/**
 * 分享工具 - 处理抖音小程序分享功能
 * 支持好友分享、抖音视频分享、游戏录制
 */

// 分享数据
export interface ShareData {
    title: string;
    desc?: string;
    imageUrl?: string;
    query?: string;
    inviteCode?: string;
    score?: number;
}

// 录制配置
export interface RecordConfig {
    duration: number;  // 录制时长（秒）
    fps: number;       // 帧率
}

// 分享卡片样式
export interface ShareCardStyle {
    backgroundColor: string;
    titleColor: string;
    scoreColor: string;
    buttonColor: string;
}

export class ShareUtils {
    private static recorder: any = null;
    private static isRecording: boolean = false;
    
    /**
     * 分享到抖音好友
     */
    public static shareToFriend(data: ShareData): Promise<boolean> {
        return new Promise((resolve) => {
            if (typeof tt === 'undefined') {
                console.warn('[ShareUtils] 非抖音环境，无法分享');
                resolve(false);
                return;
            }
            
            const query = this.buildShareQuery(data);
            
            tt.shareAppMessage({
                title: data.title,
                desc: data.desc || '',
                imageUrl: data.imageUrl || '',
                query: query,
                success: () => {
                    console.log('[ShareUtils] 分享成功');
                    this.grantShareReward();
                    resolve(true);
                },
                fail: (err: any) => {
                    console.warn('[ShareUtils] 分享失败:', err);
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * 构建分享查询参数
     */
    private static buildShareQuery(data: ShareData): string {
        const params: string[] = [];
        
        if (data.inviteCode) {
            params.push(`inviteCode=${data.inviteCode}`);
        }
        if (data.score !== undefined) {
            params.push(`score=${data.score}`);
        }
        if (data.query) {
            params.push(data.query);
        }
        
        return params.join('&');
    }
    
    /**
     * 发放分享奖励
     */
    private static grantShareReward(): void {
        // 检查今日分享次数
        const today = new Date().toDateString();
        const shareKey = `share_count_${today}`;
        
        try {
            if (typeof tt !== 'undefined') {
                let shareCount = parseInt(tt.getStorageSync(shareKey) || '0');
                
                // 每日前3次分享有奖励
                if (shareCount < 3) {
                    shareCount++;
                    tt.setStorageSync(shareKey, shareCount.toString());
                    
                    // TODO: 发放奖励（金币/道具）
                    console.log(`[ShareUtils] 分享奖励已发放 (${shareCount}/3)`);
                }
            }
        } catch (e) {
            console.warn('[ShareUtils] 奖励发放失败:', e);
        }
    }
    
    /**
     * 开始录制游戏
     */
    public static startRecording(config?: Partial<RecordConfig>): boolean {
        if (typeof tt === 'undefined') {
            console.warn('[ShareUtils] 非抖音环境，无法录制');
            return false;
        }
        
        if (this.isRecording) {
            console.warn('[ShareUtils] 已在录制中');
            return false;
        }
        
        const defaultConfig: RecordConfig = {
            duration: 15,
            fps: 30
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        this.recorder = tt.getGameRecorderManager();
        
        this.recorder.start({
            duration: finalConfig.duration,
            fps: finalConfig.fps
        });
        
        this.isRecording = true;
        console.log('[ShareUtils] 开始录制');
        
        return true;
    }
    
    /**
     * 停止录制
     */
    public static stopRecording(): Promise<string | null> {
        return new Promise((resolve) => {
            if (!this.recorder || !this.isRecording) {
                resolve(null);
                return;
            }
            
            this.recorder.onStop((res: any) => {
                this.isRecording = false;
                console.log('[ShareUtils] 录制完成:', res.videoPath);
                resolve(res.videoPath);
            });
            
            this.recorder.onError((err: any) => {
                this.isRecording = false;
                console.error('[ShareUtils] 录制失败:', err);
                resolve(null);
            });
            
            this.recorder.stop();
        });
    }
    
    /**
     * 停止录制并分享到抖音
     */
    public static async stopAndShareToTikTok(title?: string): Promise<boolean> {
        const videoPath = await this.stopRecording();
        
        if (!videoPath) {
            return false;
        }
        
        return new Promise((resolve) => {
            if (typeof tt === 'undefined') {
                resolve(false);
                return;
            }
            
            tt.shareVideoToTikTok({
                videoPath: videoPath,
                title: title || '#节奏弹球大师 我的神级操作！',
                success: () => {
                    console.log('[ShareUtils] 视频分享成功');
                    resolve(true);
                },
                fail: (err: any) => {
                    console.warn('[ShareUtils] 视频分享失败:', err);
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * 生成分享卡片图片
     */
    public static generateShareCard(
        score: number,
        rank: number,
        maxCombo: number,
        style?: Partial<ShareCardStyle>
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            if (typeof tt === 'undefined') {
                reject(new Error('非抖音环境'));
                return;
            }
            
            const defaultStyle: ShareCardStyle = {
                backgroundColor: '#1a1a2e',
                titleColor: '#ffffff',
                scoreColor: '#ffd700',
                buttonColor: '#ff4757'
            };
            
            const finalStyle = { ...defaultStyle, ...style };
            
            try {
                const canvas = tt.createCanvas();
                canvas.width = 375;
                canvas.height = 300;
                
                const ctx = canvas.getContext('2d');
                
                // 背景
                ctx.fillStyle = finalStyle.backgroundColor;
                ctx.fillRect(0, 0, 375, 300);
                
                // 渐变背景装饰
                const gradient = ctx.createLinearGradient(0, 0, 375, 300);
                gradient.addColorStop(0, 'rgba(255, 71, 87, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 375, 300);
                
                // 标题
                ctx.fillStyle = finalStyle.titleColor;
                ctx.font = 'bold 24px "PingFang SC", Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🎮 节奏弹球大师', 187.5, 45);
                
                // 分数标签
                ctx.fillStyle = '#888888';
                ctx.font = '14px "PingFang SC", Arial';
                ctx.fillText('最终得分', 187.5, 85);
                
                // 分数
                ctx.fillStyle = finalStyle.scoreColor;
                ctx.font = 'bold 56px "PingFang SC", Arial';
                ctx.fillText(score.toLocaleString(), 187.5, 145);
                
                // 统计信息
                ctx.fillStyle = finalStyle.titleColor;
                ctx.font = '16px "PingFang SC", Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`🏆 全国排名: #${rank}`, 50, 190);
                ctx.fillText(`🔥 最大连击: ${maxCombo}`, 200, 190);
                
                // 挑战按钮
                ctx.fillStyle = finalStyle.buttonColor;
                this.roundRect(ctx, 87.5, 220, 200, 50, 25);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "PingFang SC", Arial';
                ctx.textAlign = 'center';
                ctx.fillText('👆 点击挑战我', 187.5, 252);
                
                // 底部文字
                ctx.fillStyle = '#666666';
                ctx.font = '12px "PingFang SC", Arial';
                ctx.fillText('长按识别进入游戏', 187.5, 290);
                
                // 导出图片
                const tempPath = canvas.toTempFilePathSync({
                    fileType: 'jpg',
                    quality: 0.9
                });
                
                resolve(tempPath);
                
            } catch (e) {
                console.error('[ShareUtils] 生成分享卡片失败:', e);
                reject(e);
            }
        });
    }
    
    /**
     * 绘制圆角矩形
     */
    private static roundRect(
        ctx: any,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
    }
    
    /**
     * 生成邀请码
     */
    public static generateInviteCode(): string {
        if (typeof tt === 'undefined') {
            return this.generateRandomCode();
        }
        
        try {
            // 尝试获取用户ID作为邀请码基础
            const userInfo = tt.getStorageSync('user_info');
            if (userInfo && userInfo.openId) {
                // 使用openId的后6位
                return userInfo.openId.slice(-6).toUpperCase();
            }
        } catch (e) {
            console.warn('[ShareUtils] 获取用户信息失败');
        }
        
        return this.generateRandomCode();
    }
    
    /**
     * 生成随机邀请码
     */
    private static generateRandomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    /**
     * 解析启动参数中的邀请信息
     */
    public static parseInviteFromLaunch(): { inviteCode?: string; score?: number } | null {
        if (typeof tt === 'undefined') {
            return null;
        }
        
        try {
            const launchOptions = tt.getLaunchOptionsSync();
            const query = launchOptions.query || {};
            
            return {
                inviteCode: query.inviteCode,
                score: query.score ? parseInt(query.score) : undefined
            };
        } catch (e) {
            console.warn('[ShareUtils] 解析启动参数失败:', e);
            return null;
        }
    }
    
    /**
     * 设置默认分享内容
     */
    public static setDefaultShare(data: ShareData): void {
        if (typeof tt === 'undefined') {
            return;
        }
        
        tt.showShareMenu({
            withShareTicket: true
        });
        
        tt.onShareAppMessage(() => ({
            title: data.title,
            desc: data.desc || '',
            imageUrl: data.imageUrl || '',
            query: this.buildShareQuery(data)
        }));
    }
}

// 抖音小程序全局类型声明
declare const tt: any;
