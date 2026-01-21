/**
 * 节奏引擎 - 处理音乐节拍同步和判定
 * 核心功能：节拍检测、判定计算、视觉提示
 */

// 节奏判定结果
export interface RhythmJudge {
    level: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
    multiplier: number;
    offset: number;  // 与节拍点的偏移（毫秒）
}

// 节拍事件
export interface BeatEvent {
    time: number;      // 节拍时间点
    index: number;     // 节拍索引
    strength: number;  // 节拍强度 (0-1)
}

// 节奏配置
export interface RhythmConfig {
    bpm: number;                    // 每分钟节拍数
    perfectWindow: number;          // PERFECT判定窗口（毫秒）
    greatWindow: number;            // GREAT判定窗口（毫秒）
    goodWindow: number;             // GOOD判定窗口（毫秒）
    visualOffset: number;           // 视觉提示偏移
    inputLatencyCompensation: number; // 输入延迟补偿
}

export class RhythmEngine {
    private config: RhythmConfig;
    
    // 时间相关
    private startTime: number = 0;
    private currentTime: number = 0;
    private beatInterval: number;    // 节拍间隔（毫秒）
    private currentBeatIndex: number = 0;
    
    // 节拍数据
    private beatEvents: BeatEvent[] = [];
    private upcomingBeats: BeatEvent[] = [];
    
    // 回调
    private onBeat: ((beat: BeatEvent) => void) | null = null;
    private onUpcomingBeat: ((beat: BeatEvent, countdown: number) => void) | null = null;
    
    // 状态
    private isRunning: boolean = false;
    
    constructor(bpm: number = 120) {
        this.config = this.getDefaultConfig(bpm);
        this.beatInterval = 60000 / bpm;
        this.generateBeatEvents();
    }
    
    /**
     * 获取默认配置
     */
    private getDefaultConfig(bpm: number): RhythmConfig {
        return {
            bpm: bpm,
            perfectWindow: 50,      // ±50ms
            greatWindow: 100,       // ±100ms
            goodWindow: 200,        // ±200ms
            visualOffset: 500,      // 提前500ms显示节拍提示
            inputLatencyCompensation: 30  // 30ms输入延迟补偿
        };
    }
    
    /**
     * 生成节拍事件列表
     */
    private generateBeatEvents(): void {
        // 生成足够多的节拍事件（10分钟的游戏时长）
        const totalDuration = 10 * 60 * 1000; // 10分钟
        const totalBeats = Math.ceil(totalDuration / this.beatInterval);
        
        for (let i = 0; i < totalBeats; i++) {
            this.beatEvents.push({
                time: i * this.beatInterval,
                index: i,
                strength: this.calculateBeatStrength(i)
            });
        }
    }
    
    /**
     * 计算节拍强度
     * 通常4/4拍中，第1拍最强，第3拍次之，第2、4拍较弱
     */
    private calculateBeatStrength(beatIndex: number): number {
        const positionInBar = beatIndex % 4;
        switch (positionInBar) {
            case 0: return 1.0;   // 强拍
            case 2: return 0.7;   // 次强拍
            default: return 0.4; // 弱拍
        }
    }
    
    /**
     * 启动节奏引擎
     */
    public start(): void {
        this.startTime = performance.now();
        this.currentTime = 0;
        this.currentBeatIndex = 0;
        this.isRunning = true;
        
        console.log('[RhythmEngine] 启动, BPM:', this.config.bpm);
    }
    
    /**
     * 停止节奏引擎
     */
    public stop(): void {
        this.isRunning = false;
        console.log('[RhythmEngine] 停止');
    }
    
    /**
     * 更新节奏引擎
     */
    public update(deltaTime: number): void {
        if (!this.isRunning) return;
        
        this.currentTime = performance.now() - this.startTime;
        
        // 检查是否到达新的节拍点
        this.checkBeatEvents();
        
        // 更新即将到来的节拍提示
        this.updateUpcomingBeats();
    }
    
    /**
     * 检查并触发节拍事件
     */
    private checkBeatEvents(): void {
        while (this.currentBeatIndex < this.beatEvents.length) {
            const beat = this.beatEvents[this.currentBeatIndex];
            
            if (this.currentTime >= beat.time) {
                // 触发节拍回调
                if (this.onBeat) {
                    this.onBeat(beat);
                }
                this.currentBeatIndex++;
            } else {
                break;
            }
        }
    }
    
    /**
     * 更新即将到来的节拍提示
     */
    private updateUpcomingBeats(): void {
        this.upcomingBeats = [];
        
        const lookAheadTime = this.currentTime + this.config.visualOffset;
        
        for (let i = this.currentBeatIndex; i < this.beatEvents.length; i++) {
            const beat = this.beatEvents[i];
            
            if (beat.time <= lookAheadTime) {
                const countdown = beat.time - this.currentTime;
                this.upcomingBeats.push(beat);
                
                if (this.onUpcomingBeat) {
                    this.onUpcomingBeat(beat, countdown);
                }
            } else {
                break;
            }
        }
    }
    
    /**
     * 判定玩家点击的节奏等级
     * @param tapTime 点击时间（相对于游戏开始）
     */
    public judgeRhythm(tapTime: number): RhythmJudge {
        // 应用输入延迟补偿
        const adjustedTapTime = (tapTime - this.startTime) - this.config.inputLatencyCompensation;
        
        // 找到最近的节拍点
        const nearestBeat = this.findNearestBeat(adjustedTapTime);
        const offset = Math.abs(adjustedTapTime - nearestBeat.time);
        
        // 判定等级
        if (offset <= this.config.perfectWindow) {
            return { level: 'PERFECT', multiplier: 3.0, offset };
        } else if (offset <= this.config.greatWindow) {
            return { level: 'GREAT', multiplier: 2.0, offset };
        } else if (offset <= this.config.goodWindow) {
            return { level: 'GOOD', multiplier: 1.5, offset };
        } else {
            return { level: 'MISS', multiplier: 1.0, offset };
        }
    }
    
    /**
     * 查找最近的节拍点
     */
    private findNearestBeat(time: number): BeatEvent {
        let nearestBeat = this.beatEvents[0];
        let minDistance = Math.abs(time - nearestBeat.time);
        
        // 从当前节拍附近开始搜索
        const startIndex = Math.max(0, this.currentBeatIndex - 2);
        const endIndex = Math.min(this.beatEvents.length - 1, this.currentBeatIndex + 2);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const beat = this.beatEvents[i];
            const distance = Math.abs(time - beat.time);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestBeat = beat;
            }
        }
        
        return nearestBeat;
    }
    
    /**
     * 获取下一个节拍的倒计时（毫秒）
     */
    public getNextBeatCountdown(): number {
        if (this.currentBeatIndex >= this.beatEvents.length) {
            return Infinity;
        }
        
        const nextBeat = this.beatEvents[this.currentBeatIndex];
        return Math.max(0, nextBeat.time - this.currentTime);
    }
    
    /**
     * 获取当前节拍进度 (0-1)
     * 用于动画和视觉效果
     */
    public getBeatProgress(): number {
        const timeSinceLastBeat = this.currentTime % this.beatInterval;
        return timeSinceLastBeat / this.beatInterval;
    }
    
    /**
     * 获取当前节拍强度
     */
    public getCurrentBeatStrength(): number {
        if (this.currentBeatIndex > 0 && this.currentBeatIndex <= this.beatEvents.length) {
            return this.beatEvents[this.currentBeatIndex - 1].strength;
        }
        return 0;
    }
    
    /**
     * 设置BPM（动态调整难度用）
     */
    public setBPM(newBPM: number): void {
        this.config.bpm = newBPM;
        this.beatInterval = 60000 / newBPM;
        this.beatEvents = [];
        this.generateBeatEvents();
        
        console.log('[RhythmEngine] BPM更新为:', newBPM);
    }
    
    /**
     * 获取判定窗口可视化数据
     */
    public getJudgeWindowVisualization(): {
        perfectRange: [number, number];
        greatRange: [number, number];
        goodRange: [number, number];
    } {
        const nextBeatTime = this.getNextBeatCountdown() + this.currentTime;
        
        return {
            perfectRange: [
                nextBeatTime - this.config.perfectWindow,
                nextBeatTime + this.config.perfectWindow
            ],
            greatRange: [
                nextBeatTime - this.config.greatWindow,
                nextBeatTime + this.config.greatWindow
            ],
            goodRange: [
                nextBeatTime - this.config.goodWindow,
                nextBeatTime + this.config.goodWindow
            ]
        };
    }
    
    // ========== 回调设置 ==========
    
    public setOnBeat(callback: (beat: BeatEvent) => void): void {
        this.onBeat = callback;
    }
    
    public setOnUpcomingBeat(callback: (beat: BeatEvent, countdown: number) => void): void {
        this.onUpcomingBeat = callback;
    }
    
    // ========== Getter ==========
    
    public getBPM(): number {
        return this.config.bpm;
    }
    
    public getBeatInterval(): number {
        return this.beatInterval;
    }
    
    public getCurrentTime(): number {
        return this.currentTime;
    }
    
    public getUpcomingBeats(): BeatEvent[] {
        return [...this.upcomingBeats];
    }
}
