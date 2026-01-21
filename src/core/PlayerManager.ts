/**
 * 玩家管理器 - 管理玩家数据、功德业障、记忆收藏
 */

import { MemoryFragment, MemoryType, FarewellResult } from './SoulManager';

// 玩家数据
export interface PlayerData {
    id: string;
    name: string;
    
    // 核心数值
    karma: number;           // 功德
    sin: number;             // 业障
    
    // 记忆收藏
    fragments: MemoryFragment[];
    
    // 统计
    soulsServed: number;     // 送走的灵魂总数
    perfectFarewells: number; // 完美送别（全部遗忘）
    storiesCompleted: number; // 完成的故事线
    
    // 进度
    dayCount: number;        // 经营天数
    ownMemoryProgress: number; // 自己记忆的解锁进度 (0-100)
    
    // 成就
    achievements: string[];
    
    // 设置
    settings: PlayerSettings;
    
    // 时间戳
    createdAt: number;
    lastPlayedAt: number;
}

// 玩家设置
export interface PlayerSettings {
    bgmVolume: number;
    sfxVolume: number;
    textSpeed: 'slow' | 'normal' | 'fast';
    autoSave: boolean;
}

// 故事线进度
export interface StoryLineProgress {
    id: string;
    name: string;
    totalFragments: number;
    collectedFragments: number;
    isCompleted: boolean;
    reward?: string;
}

// 成就定义
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
    reward: {
        karma?: number;
        fragment?: string;
        title?: string;
    };
}

export class PlayerManager {
    private static instance: PlayerManager;
    
    private playerData: PlayerData | null = null;
    
    // 成就列表
    private achievements: Achievement[] = [];
    
    // 故事线
    private storyLines: Map<string, StoryLineProgress> = new Map();
    
    // 回调
    private onKarmaChange: ((karma: number, sin: number) => void) | null = null;
    private onFragmentCollected: ((fragment: MemoryFragment) => void) | null = null;
    private onAchievementUnlocked: ((achievement: Achievement) => void) | null = null;
    private onOwnMemoryUnlocked: ((progress: number) => void) | null = null;
    
    private constructor() {
        this.initAchievements();
    }
    
    public static getInstance(): PlayerManager {
        if (!PlayerManager.instance) {
            PlayerManager.instance = new PlayerManager();
        }
        return PlayerManager.instance;
    }
    
    /**
     * 初始化成就系统
     */
    private initAchievements(): void {
        this.achievements = [
            {
                id: 'first_soul',
                name: '初次相遇',
                description: '送走第一个灵魂',
                icon: '👻',
                condition: 'soulsServed >= 1',
                reward: { karma: 10 }
            },
            {
                id: 'listener',
                name: '倾听者',
                description: '完整听完10个灵魂的故事',
                icon: '👂',
                condition: 'soulsServed >= 10',
                reward: { karma: 50 }
            },
            {
                id: 'collector',
                name: '记忆收藏家',
                description: '收集50个记忆碎片',
                icon: '📜',
                condition: 'fragments.length >= 50',
                reward: { title: '记忆守护者' }
            },
            {
                id: 'merciful',
                name: '慈悲为怀',
                description: '累计功德达到1000',
                icon: '☯️',
                condition: 'karma >= 1000',
                reward: { karma: 100 }
            },
            {
                id: 'dark_keeper',
                name: '暗影守望',
                description: '累计业障达到500',
                icon: '🌑',
                condition: 'sin >= 500',
                reward: { fragment: 'special_dark' }
            },
            {
                id: 'story_seeker',
                name: '故事探寻者',
                description: '完成第一条故事线',
                icon: '📖',
                condition: 'storiesCompleted >= 1',
                reward: { karma: 200 }
            },
            {
                id: 'perfect_week',
                name: '完美一周',
                description: '连续7天登录',
                icon: '🌟',
                condition: 'dayCount >= 7',
                reward: { karma: 70 }
            },
            {
                id: 'self_discovery',
                name: '自我发现',
                description: '解锁自己前世记忆的10%',
                icon: '🔮',
                condition: 'ownMemoryProgress >= 10',
                reward: { fragment: 'own_memory_hint' }
            }
        ];
    }
    
    /**
     * 初始化或加载玩家数据
     */
    public async init(): Promise<void> {
        // 尝试从本地存储加载
        const saved = await this.loadFromStorage();
        
        if (saved) {
            this.playerData = saved;
            console.log('[PlayerManager] 加载存档成功');
        } else {
            // 创建新玩家
            this.playerData = this.createNewPlayer();
            console.log('[PlayerManager] 创建新玩家');
        }
        
        // 检查每日重置
        this.checkDailyReset();
    }
    
    /**
     * 创建新玩家
     */
    private createNewPlayer(): PlayerData {
        return {
            id: `player_${Date.now()}`,
            name: '无名守护者',
            
            karma: 0,
            sin: 0,
            
            fragments: [],
            
            soulsServed: 0,
            perfectFarewells: 0,
            storiesCompleted: 0,
            
            dayCount: 1,
            ownMemoryProgress: 0,
            
            achievements: [],
            
            settings: {
                bgmVolume: 0.7,
                sfxVolume: 1.0,
                textSpeed: 'normal',
                autoSave: true
            },
            
            createdAt: Date.now(),
            lastPlayedAt: Date.now()
        };
    }
    
    /**
     * 从存储加载
     */
    private async loadFromStorage(): Promise<PlayerData | null> {
        try {
            if (typeof tt !== 'undefined') {
                const data = tt.getStorageSync('player_data');
                return data ? JSON.parse(data) : null;
            } else {
                const data = localStorage.getItem('player_data');
                return data ? JSON.parse(data) : null;
            }
        } catch (e) {
            console.warn('[PlayerManager] 加载存档失败:', e);
            return null;
        }
    }
    
    /**
     * 保存到存储
     */
    public async save(): Promise<void> {
        if (!this.playerData) return;
        
        try {
            this.playerData.lastPlayedAt = Date.now();
            const data = JSON.stringify(this.playerData);
            
            if (typeof tt !== 'undefined') {
                tt.setStorageSync('player_data', data);
            } else {
                localStorage.setItem('player_data', data);
            }
            
            console.log('[PlayerManager] 存档保存成功');
        } catch (e) {
            console.error('[PlayerManager] 存档保存失败:', e);
        }
    }
    
    /**
     * 检查每日重置
     */
    private checkDailyReset(): void {
        if (!this.playerData) return;
        
        const lastDate = new Date(this.playerData.lastPlayedAt).toDateString();
        const today = new Date().toDateString();
        
        if (lastDate !== today) {
            this.playerData.dayCount++;
            console.log(`[PlayerManager] 新的一天，第 ${this.playerData.dayCount} 天`);
        }
    }
    
    /**
     * 处理灵魂送别
     */
    public processFarewell(result: FarewellResult): void {
        if (!this.playerData) return;
        
        // 更新功德和业障
        this.playerData.karma += result.karmaGained;
        this.playerData.sin += result.sinGained;
        
        // 触发回调
        if (this.onKarmaChange) {
            this.onKarmaChange(this.playerData.karma, this.playerData.sin);
        }
        
        // 收集记忆碎片
        for (const fragment of result.fragmentsGained) {
            this.collectFragment(fragment);
        }
        
        // 更新统计
        this.playerData.soulsServed++;
        if (result.keptMemories.length === 0) {
            this.playerData.perfectFarewells++;
        }
        
        // 检查成就
        this.checkAchievements();
        
        // 检查自己记忆的解锁进度
        this.checkOwnMemoryProgress();
        
        // 自动保存
        if (this.playerData.settings.autoSave) {
            this.save();
        }
    }
    
    /**
     * 收集记忆碎片
     */
    private collectFragment(fragment: MemoryFragment): void {
        if (!this.playerData) return;
        
        // 检查是否已有
        const exists = this.playerData.fragments.find(f => f.id === fragment.id);
        if (exists) return;
        
        this.playerData.fragments.push(fragment);
        
        // 检查故事线关联
        this.checkStoryLineProgress(fragment);
        
        // 触发回调
        if (this.onFragmentCollected) {
            this.onFragmentCollected(fragment);
        }
        
        console.log(`[PlayerManager] 收集记忆碎片: ${fragment.soulName} 的 ${fragment.type}`);
    }
    
    /**
     * 检查故事线进度
     */
    private checkStoryLineProgress(fragment: MemoryFragment): void {
        // 根据碎片的关联ID检查是否推进了某个故事线
        for (const relatedId of fragment.relatedFragmentIds) {
            // 检查是否收集齐了相关碎片
            // TODO: 实现故事线完成检测
        }
    }
    
    /**
     * 检查成就
     */
    private checkAchievements(): void {
        if (!this.playerData) return;
        
        for (const achievement of this.achievements) {
            // 跳过已解锁的
            if (this.playerData.achievements.includes(achievement.id)) continue;
            
            // 检查条件
            if (this.checkAchievementCondition(achievement)) {
                this.unlockAchievement(achievement);
            }
        }
    }
    
    /**
     * 检查成就条件
     */
    private checkAchievementCondition(achievement: Achievement): boolean {
        if (!this.playerData) return false;
        
        // 简单的条件解析
        const condition = achievement.condition;
        
        if (condition.includes('soulsServed')) {
            const match = condition.match(/soulsServed >= (\d+)/);
            if (match) {
                return this.playerData.soulsServed >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('fragments.length')) {
            const match = condition.match(/fragments\.length >= (\d+)/);
            if (match) {
                return this.playerData.fragments.length >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('karma')) {
            const match = condition.match(/karma >= (\d+)/);
            if (match) {
                return this.playerData.karma >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('sin')) {
            const match = condition.match(/sin >= (\d+)/);
            if (match) {
                return this.playerData.sin >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('dayCount')) {
            const match = condition.match(/dayCount >= (\d+)/);
            if (match) {
                return this.playerData.dayCount >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('ownMemoryProgress')) {
            const match = condition.match(/ownMemoryProgress >= (\d+)/);
            if (match) {
                return this.playerData.ownMemoryProgress >= parseInt(match[1]);
            }
        }
        
        if (condition.includes('storiesCompleted')) {
            const match = condition.match(/storiesCompleted >= (\d+)/);
            if (match) {
                return this.playerData.storiesCompleted >= parseInt(match[1]);
            }
        }
        
        return false;
    }
    
    /**
     * 解锁成就
     */
    private unlockAchievement(achievement: Achievement): void {
        if (!this.playerData) return;
        
        this.playerData.achievements.push(achievement.id);
        
        // 发放奖励
        if (achievement.reward.karma) {
            this.playerData.karma += achievement.reward.karma;
        }
        
        // 触发回调
        if (this.onAchievementUnlocked) {
            this.onAchievementUnlocked(achievement);
        }
        
        console.log(`[PlayerManager] 解锁成就: ${achievement.name}`);
    }
    
    /**
     * 检查自己记忆的解锁进度
     */
    private checkOwnMemoryProgress(): void {
        if (!this.playerData) return;
        
        // 每收集10个碎片，解锁1%的自己记忆
        const newProgress = Math.min(100, Math.floor(this.playerData.fragments.length / 10));
        
        if (newProgress > this.playerData.ownMemoryProgress) {
            this.playerData.ownMemoryProgress = newProgress;
            
            if (this.onOwnMemoryUnlocked) {
                this.onOwnMemoryUnlocked(newProgress);
            }
            
            console.log(`[PlayerManager] 自己记忆解锁进度: ${newProgress}%`);
        }
    }
    
    /**
     * 获取功德业障平衡状态
     */
    public getBalanceStatus(): 'balanced' | 'karma_high' | 'sin_high' | 'critical_karma' | 'critical_sin' {
        if (!this.playerData) return 'balanced';
        
        const { karma, sin } = this.playerData;
        const ratio = karma / (sin || 1);
        
        if (karma >= 10000) return 'critical_karma';  // 即将飞升
        if (sin >= 5000) return 'critical_sin';       // 即将被收
        if (ratio > 3) return 'karma_high';
        if (ratio < 0.33) return 'sin_high';
        return 'balanced';
    }
    
    /**
     * 获取记忆碎片统计
     */
    public getFragmentStats(): { [key in MemoryType]: number } {
        if (!this.playerData) {
            return {
                [MemoryType.LOVE]: 0,
                [MemoryType.PAIN]: 0,
                [MemoryType.FAMILY]: 0,
                [MemoryType.OBSESSION]: 0,
                [MemoryType.JOY]: 0
            };
        }
        
        const stats: { [key in MemoryType]: number } = {
            [MemoryType.LOVE]: 0,
            [MemoryType.PAIN]: 0,
            [MemoryType.FAMILY]: 0,
            [MemoryType.OBSESSION]: 0,
            [MemoryType.JOY]: 0
        };
        
        for (const fragment of this.playerData.fragments) {
            stats[fragment.type]++;
        }
        
        return stats;
    }
    
    // ========== Getter ==========
    
    public getPlayerData(): PlayerData | null {
        return this.playerData;
    }
    
    public getKarma(): number {
        return this.playerData?.karma || 0;
    }
    
    public getSin(): number {
        return this.playerData?.sin || 0;
    }
    
    public getFragments(): MemoryFragment[] {
        return this.playerData?.fragments || [];
    }
    
    public getAchievements(): Achievement[] {
        if (!this.playerData) return [];
        return this.achievements.filter(a => this.playerData!.achievements.includes(a.id));
    }
    
    public getOwnMemoryProgress(): number {
        return this.playerData?.ownMemoryProgress || 0;
    }
    
    // ========== 回调设置 ==========
    
    public setOnKarmaChange(callback: (karma: number, sin: number) => void): void {
        this.onKarmaChange = callback;
    }
    
    public setOnFragmentCollected(callback: (fragment: MemoryFragment) => void): void {
        this.onFragmentCollected = callback;
    }
    
    public setOnAchievementUnlocked(callback: (achievement: Achievement) => void): void {
        this.onAchievementUnlocked = callback;
    }
    
    public setOnOwnMemoryUnlocked(callback: (progress: number) => void): void {
        this.onOwnMemoryUnlocked = callback;
    }
}

// 抖音小程序全局类型声明
declare const tt: any;
