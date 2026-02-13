import asyncio
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Set, Tuple

from dotenv import load_dotenv
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, BrowserContext, Page


class ScrapeConfig(BaseModel):
    email: str
    password: str
    channel_url: Optional[str] = None
    guild_name: Optional[str] = None
    channel_name: Optional[str] = None
    headless: bool = False
    storage_state_path: str = ".auth/discord.json"
    output_path: str = "data/members.csv"
    slow_mo_ms: int = 50
    timeout_ms: int = 30000


async def wait_for_discord_ready(page: Page, timeout_ms: int) -> None:
    # Wait for the main app mount and channels UI
    await page.wait_for_selector("#app-mount", timeout=timeout_ms)
    # Consider the app ready when the URL contains /channels
    await page.wait_for_function(
        "() => location.pathname.includes('/channels')",
        timeout=timeout_ms,
    )


async def login_if_needed(page: Page, config: ScrapeConfig) -> None:
    # If already on channels, we assume logged in
    if "/channels" in page.url:
        return

    await page.goto("https://discord.com/login", wait_until="domcontentloaded")

    # If Discord restored a session, it may immediately redirect
    if "/channels" in page.url:
        return

    # Fill email and password
    await page.wait_for_selector('input[name="email"]')
    await page.fill('input[name="email"]', config.email)
    await page.fill('input[name="password"]', config.password)

    # Click login button
    # The login button has type=submit
    await page.click('button[type="submit"]')

    # Wait for either channels or potential manual challenge resolution
    try:
        await wait_for_discord_ready(page, timeout_ms=max(config.timeout_ms, 120000))
    except Exception:
        # Give user a chance to solve captcha/2FA manually in visible browser
        print("Login did not complete automatically. If a captcha or 2FA is present, please solve it in the opened browser window. Waiting up to 3 minutes…")
        await wait_for_discord_ready(page, timeout_ms=180000)


async def open_target_channel(page: Page, config: ScrapeConfig) -> None:
    if config.channel_url:
        await page.goto(config.channel_url, wait_until="domcontentloaded")
        await wait_for_discord_ready(page, timeout_ms=config.timeout_ms)
        return

    if not (config.guild_name and config.channel_name):
        raise RuntimeError("Either channel_url must be provided, or both guild_name and channel_name.")

    # Click the guild/server icon in the left rail by aria-label
    # We try multiple aria-label patterns to be resilient to locales
    guild_button = page.locator(
        "nav[aria-label*='Servers'] [aria-label='%s'], nav[aria-label*='服务器'] [aria-label='%s'], [role='tree'] [aria-label='%s']" % (
            config.guild_name,
            config.guild_name,
            config.guild_name,
        )
    )
    if await guild_button.count() == 0:
        # Fallback: find by title/text inside tooltip-trigger button
        guild_button = page.get_by_role("button", name=config.guild_name)
    await guild_button.first.click()

    # Click the channel in the left channel list by name
    # Use role treeitem with exact name, fallback to text
    try:
        await page.get_by_role("treeitem", name=config.channel_name, exact=True).first.click()
    except Exception:
        await page.get_by_text(config.channel_name, exact=True).first.click()

    # Wait for messages to load
    await wait_for_discord_ready(page, timeout_ms=config.timeout_ms)


async def ensure_member_list_open(page: Page, timeout_ms: int) -> None:
    # Detect if members panel exists and is visible
    members_wrap = page.locator('div[class*="membersWrap-"]')
    if await members_wrap.count() > 0 and await members_wrap.first.is_visible():
        return

    # Try clicking the Members button (top-right). Use multiple aria-labels for locales.
    toggle = page.locator(
        "button[aria-label*='Member'], button[aria-label*='成员'], button[aria-label*='members'], button[aria-label*='人员']"
    )
    if await toggle.count() > 0:
        await toggle.first.click()

    # Wait for visibility
    await page.wait_for_selector('div[class*="membersWrap-"]', timeout=timeout_ms)


async def scroll_member_list_to_end(page: Page) -> None:
    # Find scroll container inside members wrap
    scroller = page.locator('div[class*="membersWrap-"] div[class*="scrollerBase-"]')
    if await scroller.count() == 0:
        # Fallback to any scroller inside the wrap
        scroller = page.locator('div[class*="membersWrap-"] [class*="scroller"]')
    if await scroller.count() == 0:
        return

    # Incrementally scroll to bottom
    await page.wait_for_timeout(500)
    last_height = -1
    same_count = 0
    while True:
        await scroller.evaluate("el => el.scrollBy(0, el.clientHeight)")
        await page.wait_for_timeout(450)
        height = await scroller.evaluate("el => el.scrollTop + el.clientHeight")
        total = await scroller.evaluate("el => el.scrollHeight")
        if height >= total - 2:
            # One more nudge to ensure lazy loads
            await page.wait_for_timeout(600)
            break
        if height == last_height:
            same_count += 1
            if same_count >= 8:  # ~3-4 seconds without new items
                break
        else:
            same_count = 0
            last_height = height


async def extract_members(page: Page) -> List[dict]:
    # Attempt to collect member entries from the right panel
    # We target items inside membersWrap-
    members = await page.evaluate(
        """
        () => {
          const wrap = document.querySelector('div[class*="membersWrap-"]');
          if (!wrap) return [];
          const items = wrap.querySelectorAll('li[role="listitem"], div[class*="member-"], [data-list-item-id^="members-"]');
          const results = [];
          items.forEach((el) => {
            let name = '';
            // Try common selectors
            const nameEl = el.querySelector('span[class*="username-"], span[class*="name-"], h3, div[dir]');
            if (nameEl && nameEl.textContent) {
              name = nameEl.textContent.trim();
            } else {
              name = (el.textContent || '').trim();
            }
            if (!name) return;
            // Attempt to get status or role text if available
            let role = '';
            const roleEl = el.closest('div[class*="membersGroup-"]');
            if (roleEl && roleEl.textContent) {
              role = roleEl.textContent.trim();
            }
            results.push({ name, role });
          });
          return results;
        }
        """
    )

    # Deduplicate while preserving order
    seen: Set[Tuple[str, str]] = set()
    uniq: List[dict] = []
    for m in members:
        key = (m.get("name", ""), m.get("role", ""))
        if key in seen:
            continue
        seen.add(key)
        uniq.append({"name": key[0], "role": key[1]})
    return uniq


async def run(config: ScrapeConfig) -> List[dict]:
    # Ensure directories exist
    Path(config.storage_state_path).parent.mkdir(parents=True, exist_ok=True)
    Path(config.output_path).parent.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser: Browser = await p.chromium.launch(headless=config.headless, slow_mo=config.slow_mo_ms)
        # Load existing storage if available
        storage_state = None
        if os.path.exists(config.storage_state_path):
            storage_state = config.storage_state_path
        context: BrowserContext = await browser.new_context(
            storage_state=storage_state,
            locale="en-US",
            viewport={"width": 1366, "height": 900},
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page: Page = await context.new_page()

        await page.goto("https://discord.com/app", wait_until="domcontentloaded")
        await login_if_needed(page, config)

        # Save storage for future runs
        await context.storage_state(path=config.storage_state_path)

        await open_target_channel(page, config)
        await ensure_member_list_open(page, timeout_ms=config.timeout_ms)
        await scroll_member_list_to_end(page)
        members = await extract_members(page)

        # Save CSV
        try:
            import pandas as pd

            df = pd.DataFrame(members)
            if "role" not in df.columns:
                df["role"] = ""
            df.to_csv(config.output_path, index=False)
        except Exception as e:
            # Fallback to JSON
            json_path = os.path.splitext(config.output_path)[0] + ".json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(members, f, ensure_ascii=False, indent=2)
            print(f"Pandas not available or failed; wrote JSON to {json_path}")

        await context.close()
        await browser.close()

        return members


def load_config_from_env_and_args() -> ScrapeConfig:
    import argparse

    load_dotenv(override=False)
    parser = argparse.ArgumentParser(description="Discord member list scraper (Playwright)")
    parser.add_argument("--email", default=os.getenv("DISCORD_EMAIL"), help="Discord account email")
    parser.add_argument("--password", default=os.getenv("DISCORD_PASSWORD"), help="Discord account password")
    parser.add_argument("--channel-url", default=os.getenv("DISCORD_CHANNEL_URL"), help="Direct channel URL")
    parser.add_argument("--guild", dest="guild_name", default=os.getenv("DISCORD_GUILD_NAME"), help="Guild name if no URL")
    parser.add_argument("--channel", dest="channel_name", default=os.getenv("DISCORD_CHANNEL_NAME"), help="Channel name if no URL")
    parser.add_argument("--output", dest="output_path", default=os.getenv("OUTPUT_PATH", "data/members.csv"), help="Output path .csv or .json")
    parser.add_argument("--headless", action="store_true", help="Run browser headless")
    parser.add_argument("--slow", dest="slow_mo_ms", type=int, default=int(os.getenv("SLOW_MO_MS", "50")), help="Slow motion ms between actions")
    parser.add_argument("--timeout", dest="timeout_ms", type=int, default=int(os.getenv("TIMEOUT_MS", "30000")), help="Default timeout ms")
    parser.add_argument("--storage", dest="storage_state_path", default=os.getenv("STORAGE_STATE_PATH", ".auth/discord.json"), help="Path to Playwright storage state json")

    args = parser.parse_args()
    if not args.email or not args.password:
        raise SystemExit("DISCORD_EMAIL and DISCORD_PASSWORD are required (or pass --email/--password)")

    return ScrapeConfig(
        email=args.email,
        password=args.password,
        channel_url=args.channel_url,
        guild_name=args.guild_name,
        channel_name=args.channel_name,
        headless=bool(args.headless),
        output_path=args.output_path,
        slow_mo_ms=args.slow_mo_ms,
        timeout_ms=args.timeout_ms,
        storage_state_path=args.storage_state_path,
    )


if __name__ == "__main__":
    cfg = load_config_from_env_and_args()
    members = asyncio.run(run(cfg))
    print(f"Collected {len(members)} members -> {cfg.output_path}")
