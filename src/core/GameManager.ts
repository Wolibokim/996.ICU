/**
 * 游戏管理器 - 节奏弹球大师核心控制器
 * 负责游戏状态管理、模块协调、生命周期控制
 */

import { RhythmEngine } from './RhythmEngine';
import { PhysicsEngine } from './PhysicsEngine';
import { AudioManager } from './AudioManager';

// 游戏状态枚举
export enum GameState {
    LOADING = 'loading',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'gameover',
    RESULT = 'result'
}

// 游戏配置
export interface GameConfig {
    bpm: number;              // 节拍速度
    initialBalls: number;     // 初始弹球数量
    blockDropSpeed: number;   // 方块下降速度
    difficultyScale: number;  // 难度增长系数
}

// 游戏数据
export interface GameData {
    score: number;
    combo: number;
    maxCombo: number;
    perfectCount: number;
    greatCount: number;
    goodCount: number;
    missCount: number;
    blocksDestroyed: number;
    ballsUsed: number;
}

export class GameManager {
    private static instance: GameManager;
    
    // 游戏状态
    private state: GameState = GameState.LOADING;
    private config: GameConfig;
    private data: GameData;
    
    // 核心模块
    private rhythmEngine: RhythmEngine;
    private physicsEngine: PhysicsEngine;
    private audioManager: AudioManager;
    
    // 回调函数
    private onStateChange: ((state: GameState) => void) | null = null;
    private onScoreUpdate: ((score: number, combo: number) => void) | null = null;
    private onGameOver: ((data: GameData) => void) | null = null;
    
    // 游戏循环
    private lastFrameTime: number = 0;
    private animationFrameId: number = 0;
    
    private constructor() {
        this.config = this.getDefaultConfig();
        this.data = this.getInitialData();
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    
    /**
     * 获取默认配置
     */
    private getDefaultConfig(): GameConfig {
        return {
            bpm: 120,
            initialBalls: 1,
            blockDropSpeed: 50,
            difficultyScale: 1.05
        };
    }
    
    /**
     * 获取初始游戏数据
     */
    private getInitialData(): GameData {
        return {
            score: 0,
            combo: 0,
            maxCombo: 0,
            perfectCount: 0,
            greatCount: 0,
            goodCount: 0,
            missCount: 0,
            blocksDestroyed: 0,
            ballsUsed: 0
        };
    }
    
    /**
     * 初始化游戏
     */
    public async init(config?: Partial<GameConfig>): Promise<void> {
        // 合并配置
        this.config = { ...this.config, ...config };
        
        // 初始化各模块
        this.rhythmEngine = new RhythmEngine(this.config.bpm);
        this.physicsEngine = new PhysicsEngine();
        this.audioManager = AudioManager.getInstance();
        
        // 加载资源
        await this.loadResources();
        
        // 设置状态
        this.setState(GameState.READY);
        
        console.log('[GameManager] 初始化完成');
    }
    
    /**
     * 加载游戏资源
     */
    private async loadResources(): Promise<void> {
        // 加载音频资源
        await this.audioManager.loadBGM('default', 'assets/audio/bgm/default.mp3');
        await this.audioManager.loadSFX('hit', 'assets/audio/sfx/hit.mp3');
        await this.audioManager.loadSFX('perfect', 'assets/audio/sfx/perfect.mp3');
        await this.audioManager.loadSFX('combo', 'assets/audio/sfx/combo.mp3');
        await this.audioManager.loadSFX('destroy', 'assets/audio/sfx/destroy.mp3');
        
        console.log('[GameManager] 资源加载完成');
    }
    
    /**
     * 开始游戏
     */
    public start(): void {
        if (this.state !== GameState.READY && this.state !== GameState.PAUSED) {
            console.warn('[GameManager] 无法开始游戏，当前状态:', this.state);
            return;
        }
        
        // 重置数据
        this.data = this.getInitialData();
        
        // 启动音乐
        this.audioManager.playBGM('default');
        
        // 启动节奏引擎
        this.rhythmEngine.start();
        
        // 启动游戏循环
        this.setState(GameState.PLAYING);
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        console.log('[GameManager] 游戏开始');
    }
    
    /**
     * 暂停游戏
     */
    public pause(): void {
        if (this.state !== GameState.PLAYING) return;
        
        this.setState(GameState.PAUSED);
        this.audioManager.pauseBGM();
        cancelAnimationFrame(this.animationFrameId);
        
        console.log('[GameManager] 游戏暂停');
    }
    
    /**
     * 恢复游戏
     */
    public resume(): void {
        if (this.state !== GameState.PAUSED) return;
        
        this.setState(GameState.PLAYING);
        this.audioManager.resumeBGM();
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        console.log('[GameManager] 游戏恢复');
    }
    
    /**
     * 游戏结束
     */
    public gameOver(): void {
        this.setState(GameState.GAME_OVER);
        this.audioManager.stopBGM();
        cancelAnimationFrame(this.animationFrameId);
        
        // 触发结束回调
        if (this.onGameOver) {
            this.onGameOver(this.data);
        }
        
        // 上报数据
        this.reportGameData();
        
        console.log('[GameManager] 游戏结束，最终得分:', this.data.score);
    }
    
    /**
     * 重新开始
     */
    public restart(): void {
        this.setState(GameState.READY);
        this.physicsEngine.reset();
        this.start();
    }
    
    /**
     * 游戏主循环
     */
    private gameLoop(): void {
        if (this.state !== GameState.PLAYING) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 转换为秒
        this.lastFrameTime = currentTime;
        
        // 更新物理
        this.physicsEngine.update(deltaTime);
        
        // 更新节奏
        this.rhythmEngine.update(deltaTime);
        
        // 检查游戏结束条件
        if (this.checkGameOver()) {
            this.gameOver();
            return;
        }
        
        // 继续循环
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 处理玩家点击发射
     */
    public handleTap(angle: number): void {
        if (this.state !== GameState.PLAYING) return;
        
        // 获取节奏判定
        const tapTime = performance.now();
        const judge = this.rhythmEngine.judgeRhythm(tapTime);
        
        // 更新统计
        this.updateJudgeStats(judge.level);
        
        // 计算伤害倍率
        const damageMultiplier = judge.multiplier;
        
        // 发射弹球
        this.physicsEngine.launchBall(angle, damageMultiplier);
        this.data.ballsUsed++;
        
        // 播放音效
        this.playJudgeSFX(judge.level);
        
        // 触发视觉反馈
        this.triggerJudgeEffect(judge.level);
        
        console.log(`[GameManager] 发射! 判定: ${judge.level}, 倍率: ${damageMultiplier}`);
    }
    
    /**
     * 处理方块消除
     */
    public onBlockDestroyed(block: any, damage: number): void {
        // 计算得分
        const baseScore = block.maxHp * 10;
        const comboBonus = Math.floor(this.data.combo * 0.1 * baseScore);
        const totalScore = baseScore + comboBonus;
        
        // 更新数据
        this.data.score += totalScore;
        this.data.combo++;
        this.data.maxCombo = Math.max(this.data.maxCombo, this.data.combo);
        this.data.blocksDestroyed++;
        
        // 播放消除音效
        this.audioManager.playSFX('destroy');
        
        // 触发连击音效
        if (this.data.combo > 0 && this.data.combo % 10 === 0) {
            this.audioManager.playSFX('combo');
        }
        
        // 触发回调
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.data.score, this.data.combo);
        }
    }
    
    /**
     * 处理连击中断
     */
    public onComboBreak(): void {
        this.data.combo = 0;
        
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.data.score, this.data.combo);
        }
    }
    
    /**
     * 更新判定统计
     */
    private updateJudgeStats(level: string): void {
        switch (level) {
            case 'PERFECT':
                this.data.perfectCount++;
                break;
            case 'GREAT':
                this.data.greatCount++;
                break;
            case 'GOOD':
                this.data.goodCount++;
                break;
            case 'MISS':
                this.data.missCount++;
                break;
        }
    }
    
    /**
     * 播放判定音效
     */
    private playJudgeSFX(level: string): void {
        switch (level) {
            case 'PERFECT':
                this.audioManager.playSFX('perfect');
                break;
            default:
                this.audioManager.playSFX('hit');
                break;
        }
    }
    
    /**
     * 触发判定视觉效果
     */
    private triggerJudgeEffect(level: string): void {
        // 这里会触发UI层的视觉效果
        // 由具体的渲染层实现
    }
    
    /**
     * 检查游戏结束条件
     */
    private checkGameOver(): boolean {
        return this.physicsEngine.isBlockAtBottom();
    }
    
    /**
     * 上报游戏数据
     */
    private reportGameData(): void {
        // 上报到抖音数据平台
        if (typeof tt !== 'undefined') {
            tt.reportAnalytics('game_end', {
                score: this.data.score,
                max_combo: this.data.maxCombo,
                perfect_count: this.data.perfectCount,
                great_count: this.data.greatCount,
                good_count: this.data.goodCount,
                miss_count: this.data.missCount,
                blocks_destroyed: this.data.blocksDestroyed,
                balls_used: this.data.ballsUsed
            });
        }
    }
    
    /**
     * 设置状态
     */
    private setState(newState: GameState): void {
        const oldState = this.state;
        this.state = newState;
        
        if (this.onStateChange) {
            this.onStateChange(newState);
        }
        
        console.log(`[GameManager] 状态变更: ${oldState} -> ${newState}`);
    }
    
    // ========== Getter & Setter ==========
    
    public getState(): GameState {
        return this.state;
    }
    
    public getData(): GameData {
        return { ...this.data };
    }
    
    public getConfig(): GameConfig {
        return { ...this.config };
    }
    
    public setOnStateChange(callback: (state: GameState) => void): void {
        this.onStateChange = callback;
    }
    
    public setOnScoreUpdate(callback: (score: number, combo: number) => void): void {
        this.onScoreUpdate = callback;
    }
    
    public setOnGameOver(callback: (data: GameData) => void): void {
        this.onGameOver = callback;
    }
}

// 抖音小程序全局类型声明
declare const tt: any;
