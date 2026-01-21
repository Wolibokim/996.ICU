/**
 * 音频管理器 - 处理背景音乐和音效
 * 支持抖音小程序音频API
 */

// 音频配置
interface AudioConfig {
    bgmVolume: number;
    sfxVolume: number;
    enableVibration: boolean;
}

// 音频资源
interface AudioResource {
    key: string;
    path: string;
    audio?: any;  // InnerAudioContext
    isLoaded: boolean;
}

export class AudioManager {
    private static instance: AudioManager;
    
    private config: AudioConfig;
    
    // BGM资源
    private bgmResources: Map<string, AudioResource> = new Map();
    private currentBGM: string | null = null;
    private bgmContext: any = null;  // 抖音音频上下文
    
    // SFX资源
    private sfxResources: Map<string, AudioResource> = new Map();
    private sfxPool: Map<string, any[]> = new Map();  // 音效对象池
    private readonly SFX_POOL_SIZE = 5;
    
    private constructor() {
        this.config = {
            bgmVolume: 0.7,
            sfxVolume: 1.0,
            enableVibration: true
        };
        
        this.loadConfigFromStorage();
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }
    
    /**
     * 从本地存储加载配置
     */
    private loadConfigFromStorage(): void {
        try {
            if (typeof tt !== 'undefined') {
                const config = tt.getStorageSync('audio_config');
                if (config) {
                    this.config = { ...this.config, ...JSON.parse(config) };
                }
            }
        } catch (e) {
            console.warn('[AudioManager] 加载配置失败:', e);
        }
    }
    
    /**
     * 保存配置到本地存储
     */
    private saveConfigToStorage(): void {
        try {
            if (typeof tt !== 'undefined') {
                tt.setStorageSync('audio_config', JSON.stringify(this.config));
            }
        } catch (e) {
            console.warn('[AudioManager] 保存配置失败:', e);
        }
    }
    
    /**
     * 加载BGM资源
     */
    public async loadBGM(key: string, path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const resource: AudioResource = {
                key,
                path,
                isLoaded: false
            };
            
            if (typeof tt !== 'undefined') {
                // 抖音小程序环境
                const audio = tt.createInnerAudioContext();
                audio.src = path;
                audio.loop = true;
                audio.volume = this.config.bgmVolume;
                
                audio.onCanplay(() => {
                    resource.audio = audio;
                    resource.isLoaded = true;
                    this.bgmResources.set(key, resource);
                    console.log(`[AudioManager] BGM加载完成: ${key}`);
                    resolve();
                });
                
                audio.onError((err: any) => {
                    console.error(`[AudioManager] BGM加载失败: ${key}`, err);
                    reject(err);
                });
            } else {
                // Web环境模拟
                resource.isLoaded = true;
                this.bgmResources.set(key, resource);
                resolve();
            }
        });
    }
    
    /**
     * 加载SFX资源
     */
    public async loadSFX(key: string, path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const resource: AudioResource = {
                key,
                path,
                isLoaded: false
            };
            
            if (typeof tt !== 'undefined') {
                // 创建音效对象池
                const pool: any[] = [];
                let loadedCount = 0;
                
                for (let i = 0; i < this.SFX_POOL_SIZE; i++) {
                    const audio = tt.createInnerAudioContext();
                    audio.src = path;
                    audio.volume = this.config.sfxVolume;
                    
                    audio.onCanplay(() => {
                        pool.push(audio);
                        loadedCount++;
                        
                        if (loadedCount === this.SFX_POOL_SIZE) {
                            resource.isLoaded = true;
                            this.sfxResources.set(key, resource);
                            this.sfxPool.set(key, pool);
                            console.log(`[AudioManager] SFX加载完成: ${key}`);
                            resolve();
                        }
                    });
                    
                    audio.onError((err: any) => {
                        console.error(`[AudioManager] SFX加载失败: ${key}`, err);
                        reject(err);
                    });
                }
            } else {
                // Web环境模拟
                resource.isLoaded = true;
                this.sfxResources.set(key, resource);
                this.sfxPool.set(key, []);
                resolve();
            }
        });
    }
    
    /**
     * 播放BGM
     */
    public playBGM(key: string): void {
        const resource = this.bgmResources.get(key);
        
        if (!resource || !resource.isLoaded) {
            console.warn(`[AudioManager] BGM未加载: ${key}`);
            return;
        }
        
        // 停止当前BGM
        if (this.currentBGM && this.currentBGM !== key) {
            this.stopBGM();
        }
        
        if (resource.audio) {
            resource.audio.play();
            this.currentBGM = key;
            this.bgmContext = resource.audio;
            console.log(`[AudioManager] 播放BGM: ${key}`);
        }
    }
    
    /**
     * 暂停BGM
     */
    public pauseBGM(): void {
        if (this.bgmContext) {
            this.bgmContext.pause();
            console.log('[AudioManager] 暂停BGM');
        }
    }
    
    /**
     * 恢复BGM
     */
    public resumeBGM(): void {
        if (this.bgmContext) {
            this.bgmContext.play();
            console.log('[AudioManager] 恢复BGM');
        }
    }
    
    /**
     * 停止BGM
     */
    public stopBGM(): void {
        if (this.bgmContext) {
            this.bgmContext.stop();
            this.bgmContext = null;
            this.currentBGM = null;
            console.log('[AudioManager] 停止BGM');
        }
    }
    
    /**
     * 播放SFX
     */
    public playSFX(key: string): void {
        const pool = this.sfxPool.get(key);
        
        if (!pool || pool.length === 0) {
            console.warn(`[AudioManager] SFX未加载: ${key}`);
            return;
        }
        
        // 从对象池中获取一个空闲的音频实例
        const audio = this.getAvailableAudio(pool);
        
        if (audio) {
            audio.seek(0);
            audio.play();
        }
    }
    
    /**
     * 获取可用的音频实例
     */
    private getAvailableAudio(pool: any[]): any {
        // 查找未在播放的实例
        for (const audio of pool) {
            if (!audio.paused) {
                continue;
            }
            return audio;
        }
        
        // 如果都在播放，返回第一个（会重新开始播放）
        return pool[0];
    }
    
    /**
     * 触发震动反馈
     */
    public vibrate(type: 'short' | 'long' = 'short'): void {
        if (!this.config.enableVibration) return;
        
        if (typeof tt !== 'undefined') {
            if (type === 'short') {
                tt.vibrateShort({ type: 'light' });
            } else {
                tt.vibrateLong();
            }
        }
    }
    
    /**
     * 播放判定音效（带震动）
     */
    public playJudgeFeedback(level: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS'): void {
        switch (level) {
            case 'PERFECT':
                this.playSFX('perfect');
                this.vibrate('short');
                break;
            case 'GREAT':
                this.playSFX('hit');
                this.vibrate('short');
                break;
            case 'GOOD':
                this.playSFX('hit');
                break;
            case 'MISS':
                // 不播放音效
                break;
        }
    }
    
    /**
     * 播放方块消除音效
     */
    public playBlockDestroy(isCombo: boolean = false): void {
        this.playSFX('destroy');
        
        if (isCombo) {
            this.playSFX('combo');
            this.vibrate('short');
        }
    }
    
    // ========== 配置相关 ==========
    
    /**
     * 设置BGM音量
     */
    public setBGMVolume(volume: number): void {
        this.config.bgmVolume = Math.max(0, Math.min(1, volume));
        
        if (this.bgmContext) {
            this.bgmContext.volume = this.config.bgmVolume;
        }
        
        this.saveConfigToStorage();
    }
    
    /**
     * 设置SFX音量
     */
    public setSFXVolume(volume: number): void {
        this.config.sfxVolume = Math.max(0, Math.min(1, volume));
        
        // 更新所有音效池的音量
        for (const pool of this.sfxPool.values()) {
            for (const audio of pool) {
                audio.volume = this.config.sfxVolume;
            }
        }
        
        this.saveConfigToStorage();
    }
    
    /**
     * 设置震动开关
     */
    public setVibrationEnabled(enabled: boolean): void {
        this.config.enableVibration = enabled;
        this.saveConfigToStorage();
    }
    
    /**
     * 获取当前配置
     */
    public getConfig(): AudioConfig {
        return { ...this.config };
    }
    
    /**
     * 静音/取消静音
     */
    public toggleMute(): boolean {
        if (this.config.bgmVolume > 0 || this.config.sfxVolume > 0) {
            // 静音
            this.setBGMVolume(0);
            this.setSFXVolume(0);
            return true;
        } else {
            // 取消静音
            this.setBGMVolume(0.7);
            this.setSFXVolume(1.0);
            return false;
        }
    }
    
    /**
     * 释放所有资源
     */
    public dispose(): void {
        // 停止BGM
        this.stopBGM();
        
        // 释放所有音频上下文
        for (const resource of this.bgmResources.values()) {
            if (resource.audio) {
                resource.audio.destroy();
            }
        }
        
        for (const pool of this.sfxPool.values()) {
            for (const audio of pool) {
                audio.destroy();
            }
        }
        
        this.bgmResources.clear();
        this.sfxResources.clear();
        this.sfxPool.clear();
        
        console.log('[AudioManager] 资源已释放');
    }
}

// 抖音小程序全局类型声明
declare const tt: any;
