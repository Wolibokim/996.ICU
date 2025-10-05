#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Discord成员列表爬虫脚本
使用Selenium自动登录Discord并获取服务器成员数据
"""

import time
import json
import csv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import undetected_chromedriver as uc


class DiscordScraper:
    def __init__(self, email, password):
        """
        初始化Discord爬虫
        :param email: Discord账号邮箱
        :param password: Discord密码
        """
        self.email = email
        self.password = password
        self.driver = None
        self.members_data = []
        
    def setup_driver(self):
        """设置浏览器驱动"""
        print("正在启动浏览器...")
        options = uc.ChromeOptions()
        # 可选：无头模式（不显示浏览器窗口）
        # options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        
        self.driver = uc.Chrome(options=options)
        self.driver.maximize_window()
        print("浏览器启动成功！")
        
    def login(self):
        """登录Discord"""
        print(f"正在登录Discord账号: {self.email}")
        self.driver.get("https://discord.com/login")
        
        try:
            # 等待登录页面加载
            time.sleep(3)
            
            # 输入邮箱
            print("输入邮箱...")
            email_input = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            email_input.clear()
            email_input.send_keys(self.email)
            time.sleep(1)
            
            # 输入密码
            print("输入密码...")
            password_input = self.driver.find_element(By.NAME, "password")
            password_input.clear()
            password_input.send_keys(self.password)
            time.sleep(1)
            
            # 点击登录按钮
            print("点击登录按钮...")
            password_input.send_keys(Keys.RETURN)
            
            # 等待登录完成（等待主界面加载）
            print("等待登录完成...")
            time.sleep(10)
            
            # 检查是否登录成功
            if "login" in self.driver.current_url:
                print("❌ 登录失败！请检查账号密码或可能需要人工验证")
                return False
            
            print("✅ 登录成功！")
            return True
            
        except Exception as e:
            print(f"❌ 登录过程中出现错误: {str(e)}")
            return False
    
    def navigate_to_channel(self, channel_url=None):
        """
        导航到指定频道
        :param channel_url: 频道URL，如果为None则使用当前页面
        """
        if channel_url:
            print(f"正在导航到频道: {channel_url}")
            self.driver.get(channel_url)
            time.sleep(5)
        else:
            print("使用当前页面...")
            time.sleep(2)
    
    def click_members_list(self):
        """点击成员列表按钮（第二步）"""
        print("正在查找并点击成员列表按钮...")
        try:
            # Discord的成员列表按钮通常在右上角
            # 尝试多种选择器
            selectors = [
                "button[aria-label*='成员']",
                "button[aria-label*='Members']",
                "div[class*='membersToggle']",
                "button[aria-label='显示成员列表']",
                "button[aria-label='Show Member List']",
            ]
            
            for selector in selectors:
                try:
                    members_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    members_button.click()
                    print("✅ 成功点击成员列表按钮！")
                    time.sleep(3)
                    return True
                except:
                    continue
            
            # 如果上述方法都失败，尝试通过快捷键
            print("尝试使用快捷键打开成员列表...")
            from selenium.webdriver.common.action_chains import ActionChains
            actions = ActionChains(self.driver)
            actions.key_down(Keys.CONTROL).send_keys('u').key_up(Keys.CONTROL).perform()
            time.sleep(2)
            print("✅ 已尝试打开成员列表")
            return True
            
        except Exception as e:
            print(f"⚠️ 点击成员列表按钮时出现问题: {str(e)}")
            print("成员列表可能已经打开，继续...")
            return True
    
    def scrape_members(self):
        """获取成员列表数据"""
        print("正在抓取成员列表数据...")
        self.members_data = []
        
        try:
            # 等待成员列表加载
            time.sleep(3)
            
            # 尝试多种选择器来定位成员列表
            member_selectors = [
                "div[class*='member-']",
                "div[class*='members'] div[class*='member']",
                "div[role='listitem']",
                "div[class*='memberListItem']",
            ]
            
            members = None
            for selector in member_selectors:
                try:
                    members = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if members and len(members) > 0:
                        print(f"✅ 找到 {len(members)} 个成员元素（使用选择器: {selector}）")
                        break
                except:
                    continue
            
            if not members or len(members) == 0:
                print("⚠️ 未找到成员元素，尝试获取整个成员列表区域...")
                # 截图保存当前页面以便调试
                self.driver.save_screenshot("discord_page.png")
                print("已保存截图到 discord_page.png")
                
                # 尝试获取页面上所有文本内容
                member_area = self.driver.find_elements(By.CSS_SELECTOR, "aside, div[class*='members']")
                if member_area:
                    print(f"找到 {len(member_area)} 个可能的成员区域")
            
            # 滚动加载更多成员
            print("滚动加载更多成员...")
            self.scroll_members_list()
            
            # 重新获取成员
            for selector in member_selectors:
                try:
                    members = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if members and len(members) > 0:
                        break
                except:
                    continue
            
            # 提取成员信息
            if members:
                for idx, member in enumerate(members, 1):
                    try:
                        member_info = self.extract_member_info(member)
                        if member_info and member_info.get('username'):
                            self.members_data.append(member_info)
                            print(f"  [{idx}] {member_info.get('username', 'Unknown')}")
                    except Exception as e:
                        continue
                
                print(f"\n✅ 成功抓取 {len(self.members_data)} 个成员的数据！")
            else:
                print("❌ 未能找到成员数据")
                
        except Exception as e:
            print(f"❌ 抓取成员数据时出错: {str(e)}")
        
        return self.members_data
    
    def scroll_members_list(self):
        """滚动成员列表以加载更多内容"""
        try:
            # 找到成员列表容器
            member_list = self.driver.find_element(By.CSS_SELECTOR, "aside, div[class*='members']")
            
            # 滚动多次以加载更多成员
            for _ in range(5):
                self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", member_list)
                time.sleep(1)
        except:
            # 如果找不到成员列表容器，尝试整个页面滚动
            for _ in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
    
    def extract_member_info(self, member_element):
        """
        从成员元素中提取信息
        :param member_element: 成员WebElement
        :return: 成员信息字典
        """
        try:
            # 获取成员用户名
            username = None
            username_selectors = [
                "div[class*='username']",
                "span[class*='username']",
                "div[class*='name']",
                "span[class*='name']",
            ]
            
            for selector in username_selectors:
                try:
                    username_elem = member_element.find_element(By.CSS_SELECTOR, selector)
                    username = username_elem.text.strip()
                    if username:
                        break
                except:
                    continue
            
            # 如果上述方法失败，获取整个元素的文本
            if not username:
                username = member_element.text.strip()
            
            # 获取状态（在线、离线等）
            status = "unknown"
            try:
                status_elem = member_element.find_element(By.CSS_SELECTOR, "div[class*='status'], svg[class*='status']")
                status_class = status_elem.get_attribute("class")
                if "online" in status_class.lower():
                    status = "online"
                elif "offline" in status_class.lower():
                    status = "offline"
                elif "idle" in status_class.lower():
                    status = "idle"
                elif "dnd" in status_class.lower():
                    status = "dnd"
            except:
                pass
            
            # 获取头像URL
            avatar_url = None
            try:
                avatar_elem = member_element.find_element(By.CSS_SELECTOR, "img")
                avatar_url = avatar_elem.get_attribute("src")
            except:
                pass
            
            return {
                "username": username,
                "status": status,
                "avatar_url": avatar_url,
                "raw_text": member_element.text.strip()
            }
        except Exception as e:
            return None
    
    def save_to_json(self, filename="discord_members.json"):
        """保存数据到JSON文件"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.members_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 数据已保存到 {filename}")
        except Exception as e:
            print(f"❌ 保存JSON文件失败: {str(e)}")
    
    def save_to_csv(self, filename="discord_members.csv"):
        """保存数据到CSV文件"""
        try:
            if not self.members_data:
                print("⚠️ 没有数据可保存")
                return
            
            with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
                fieldnames = ['username', 'status', 'avatar_url', 'raw_text']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.members_data)
            print(f"✅ 数据已保存到 {filename}")
        except Exception as e:
            print(f"❌ 保存CSV文件失败: {str(e)}")
    
    def close(self):
        """关闭浏览器"""
        if self.driver:
            print("正在关闭浏览器...")
            time.sleep(2)
            self.driver.quit()
            print("浏览器已关闭")


def main():
    """主函数"""
    print("=" * 60)
    print("Discord成员列表爬虫")
    print("=" * 60)
    
    # 账号信息
    EMAIL = "CorneliaGarden3A@z87qwc.xyz"
    PASSWORD = "CorneliaGarden3A@z87qwc.xyz"
    
    # 可选：指定要访问的频道URL
    # 根据截图，URL格式类似: https://discord.com/channels/SERVER_ID/CHANNEL_ID
    CHANNEL_URL = None  # 如果需要，在这里填入完整的频道URL
    
    # 创建爬虫实例
    scraper = DiscordScraper(EMAIL, PASSWORD)
    
    try:
        # 1. 启动浏览器
        scraper.setup_driver()
        
        # 2. 登录
        if not scraper.login():
            print("登录失败，程序退出")
            return
        
        # 3. 导航到频道（如果提供了URL）
        if CHANNEL_URL:
            scraper.navigate_to_channel(CHANNEL_URL)
        else:
            print("\n⚠️ 未指定频道URL，请手动导航到目标频道")
            print("请在浏览器中手动点击左侧的服务器和频道")
            input("导航完成后，按回车键继续...")
        
        # 4. 点击成员列表按钮（第二步）
        scraper.click_members_list()
        
        # 5. 抓取成员数据
        members = scraper.scrape_members()
        
        # 6. 保存数据
        if members:
            scraper.save_to_json()
            scraper.save_to_csv()
            print(f"\n✅ 总共抓取了 {len(members)} 个成员的数据")
        else:
            print("\n⚠️ 未抓取到成员数据，可能需要手动调整")
            print("浏览器将保持打开状态，请检查页面...")
            input("按回车键结束程序...")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断程序")
    except Exception as e:
        print(f"\n❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # 关闭浏览器
        scraper.close()
    
    print("\n" + "=" * 60)
    print("程序执行完毕")
    print("=" * 60)


if __name__ == "__main__":
    main()
