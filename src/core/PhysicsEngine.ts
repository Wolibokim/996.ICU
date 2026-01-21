/**
 * 物理引擎 - 处理弹球运动和碰撞
 * 核心功能：弹球发射、碰撞检测、方块管理
 */

// 弹球实体
export interface Ball {
    id: string;
    x: number;
    y: number;
    vx: number;          // x方向速度
    vy: number;          // y方向速度
    radius: number;
    damage: number;      // 基础伤害
    damageMultiplier: number;  // 伤害倍率（来自节奏判定）
    isActive: boolean;
    trailPoints: Array<{x: number, y: number}>;  // 轨迹点
}

// 方块实体
export interface Block {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hp: number;          // 当前生命值
    maxHp: number;       // 最大生命值
    type: BlockType;
    row: number;         // 行号
    col: number;         // 列号
}

// 方块类型
export enum BlockType {
    NORMAL = 'normal',       // 普通方块
    BOMB = 'bomb',           // 炸弹方块
    ADD_BALL = 'add_ball',   // 加球方块
    FROZEN = 'frozen',       // 冰冻方块
    GOLD = 'gold',           // 金币方块
    RAINBOW = 'rainbow'      // 彩虹方块
}

// 碰撞结果
export interface CollisionResult {
    ball: Ball;
    block: Block;
    damage: number;
    destroyed: boolean;
}

// 墙壁定义
interface Wall {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    normal: { x: number; y: number };
}

export class PhysicsEngine {
    // 游戏区域
    private screenWidth: number = 750;   // 抖音小程序标准宽度
    private screenHeight: number = 1334;
    
    // 实体列表
    private balls: Ball[] = [];
    private blocks: Block[] = [];
    private walls: Wall[] = [];
    
    // 发射器
    private launcherX: number = 375;     // 发射器X位置（屏幕中央）
    private launcherY: number = 1200;    // 发射器Y位置
    
    // 物理参数
    private readonly BALL_SPEED = 800;       // 弹球速度（像素/秒）
    private readonly BALL_RADIUS = 12;       // 弹球半径
    private readonly BALL_DAMAGE = 1;        // 弹球基础伤害
    private readonly FRICTION = 0.999;       // 摩擦系数
    private readonly RESTITUTION = 1.0;      // 弹性系数
    
    // 方块参数
    private readonly BLOCK_COLS = 7;         // 列数
    private readonly BLOCK_WIDTH = 100;      // 方块宽度
    private readonly BLOCK_HEIGHT = 80;      // 方块高度
    private readonly BLOCK_PADDING = 5;      // 方块间距
    private readonly BLOCK_START_Y = 100;    // 方块起始Y位置
    private readonly BLOCK_DROP_LINE = 1100; // 方块到达此线游戏结束
    
    // 游戏状态
    private currentRound: number = 1;
    private ballIdCounter: number = 0;
    private blockIdCounter: number = 0;
    
    // 回调
    private onBlockDestroyed: ((block: Block, damage: number) => void) | null = null;
    private onBallReturned: ((ball: Ball) => void) | null = null;
    private onSpecialBlockTriggered: ((block: Block) => void) | null = null;
    
    // 待发射弹球数量
    private pendingBalls: number = 1;
    
    // 轨迹记录
    private readonly MAX_TRAIL_POINTS = 20;
    
    constructor() {
        this.initWalls();
        this.spawnInitialBlocks();
    }
    
    /**
     * 初始化墙壁
     */
    private initWalls(): void {
        // 左墙
        this.walls.push({
            x1: 0, y1: 0,
            x2: 0, y2: this.screenHeight,
            normal: { x: 1, y: 0 }
        });
        
        // 右墙
        this.walls.push({
            x1: this.screenWidth, y1: 0,
            x2: this.screenWidth, y2: this.screenHeight,
            normal: { x: -1, y: 0 }
        });
        
        // 上墙
        this.walls.push({
            x1: 0, y1: 0,
            x2: this.screenWidth, y2: 0,
            normal: { x: 0, y: 1 }
        });
    }
    
    /**
     * 生成初始方块
     */
    private spawnInitialBlocks(): void {
        this.spawnNewRow(3); // 初始生成3行方块
    }
    
    /**
     * 生成新的一行方块
     */
    public spawnNewRow(rows: number = 1): void {
        for (let r = 0; r < rows; r++) {
            for (let col = 0; col < this.BLOCK_COLS; col++) {
                // 70%概率生成方块
                if (Math.random() < 0.7) {
                    const blockType = this.randomBlockType();
                    const hp = this.calculateBlockHP();
                    
                    const block: Block = {
                        id: `block_${this.blockIdCounter++}`,
                        x: col * (this.BLOCK_WIDTH + this.BLOCK_PADDING) + 25,
                        y: this.BLOCK_START_Y + r * (this.BLOCK_HEIGHT + this.BLOCK_PADDING),
                        width: this.BLOCK_WIDTH,
                        height: this.BLOCK_HEIGHT,
                        hp: hp,
                        maxHp: hp,
                        type: blockType,
                        row: r,
                        col: col
                    };
                    
                    this.blocks.push(block);
                }
            }
        }
    }
    
    /**
     * 随机方块类型
     */
    private randomBlockType(): BlockType {
        const rand = Math.random();
        
        if (rand < 0.75) return BlockType.NORMAL;      // 75% 普通
        if (rand < 0.85) return BlockType.BOMB;        // 10% 炸弹
        if (rand < 0.92) return BlockType.ADD_BALL;    // 7% 加球
        if (rand < 0.96) return BlockType.GOLD;        // 4% 金币
        if (rand < 0.99) return BlockType.FROZEN;      // 3% 冰冻
        return BlockType.RAINBOW;                       // 1% 彩虹
    }
    
    /**
     * 计算方块HP（随回合数增加）
     */
    private calculateBlockHP(): number {
        const baseHP = this.currentRound;
        const variance = Math.floor(Math.random() * 3) - 1; // -1 到 1 的随机变化
        return Math.max(1, baseHP + variance);
    }
    
    /**
     * 发射弹球
     */
    public launchBall(angle: number, damageMultiplier: number = 1): void {
        // 角度限制在 -75度 到 75度
        const clampedAngle = Math.max(-75, Math.min(75, angle));
        const radians = (clampedAngle - 90) * Math.PI / 180; // 转换为弧度，-90是因为0度指向上方
        
        const ball: Ball = {
            id: `ball_${this.ballIdCounter++}`,
            x: this.launcherX,
            y: this.launcherY,
            vx: Math.cos(radians) * this.BALL_SPEED,
            vy: Math.sin(radians) * this.BALL_SPEED,
            radius: this.BALL_RADIUS,
            damage: this.BALL_DAMAGE,
            damageMultiplier: damageMultiplier,
            isActive: true,
            trailPoints: []
        };
        
        this.balls.push(ball);
        this.pendingBalls--;
        
        console.log(`[PhysicsEngine] 发射弹球, 角度: ${clampedAngle}°, 倍率: ${damageMultiplier}`);
    }
    
    /**
     * 物理更新主循环
     */
    public update(deltaTime: number): void {
        // 更新所有活跃的弹球
        for (const ball of this.balls) {
            if (!ball.isActive) continue;
            
            // 记录轨迹点
            this.recordTrailPoint(ball);
            
            // 更新位置
            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;
            
            // 应用摩擦力
            ball.vx *= this.FRICTION;
            ball.vy *= this.FRICTION;
            
            // 墙壁碰撞
            this.handleWallCollision(ball);
            
            // 方块碰撞
            this.handleBlockCollisions(ball);
            
            // 检查弹球是否返回
            this.checkBallReturn(ball);
        }
        
        // 清理不活跃的弹球
        this.balls = this.balls.filter(ball => ball.isActive);
        
        // 清理已消除的方块
        this.blocks = this.blocks.filter(block => block.hp > 0);
    }
    
    /**
     * 记录轨迹点
     */
    private recordTrailPoint(ball: Ball): void {
        ball.trailPoints.push({ x: ball.x, y: ball.y });
        
        if (ball.trailPoints.length > this.MAX_TRAIL_POINTS) {
            ball.trailPoints.shift();
        }
    }
    
    /**
     * 处理墙壁碰撞
     */
    private handleWallCollision(ball: Ball): void {
        // 左墙
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * this.RESTITUTION;
        }
        
        // 右墙
        if (ball.x + ball.radius > this.screenWidth) {
            ball.x = this.screenWidth - ball.radius;
            ball.vx = -ball.vx * this.RESTITUTION;
        }
        
        // 上墙
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy * this.RESTITUTION;
        }
    }
    
    /**
     * 处理方块碰撞
     */
    private handleBlockCollisions(ball: Ball): void {
        for (const block of this.blocks) {
            if (block.hp <= 0) continue;
            
            if (this.circleRectCollision(ball, block)) {
                // 计算碰撞法线
                const normal = this.getCollisionNormal(ball, block);
                
                // 反射速度
                this.reflectVelocity(ball, normal);
                
                // 计算伤害
                const damage = ball.damage * ball.damageMultiplier;
                
                // 应用伤害
                block.hp -= damage;
                
                // 触发回调
                if (block.hp <= 0) {
                    this.handleBlockDestroyed(block, damage);
                }
                
                // 分离弹球和方块
                this.separateBallFromBlock(ball, block, normal);
            }
        }
    }
    
    /**
     * 圆形与矩形碰撞检测
     */
    private circleRectCollision(ball: Ball, block: Block): boolean {
        const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
        const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.height));
        
        const distanceX = ball.x - closestX;
        const distanceY = ball.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        return distanceSquared < ball.radius * ball.radius;
    }
    
    /**
     * 获取碰撞法线
     */
    private getCollisionNormal(ball: Ball, block: Block): { x: number; y: number } {
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;
        
        const dx = ball.x - blockCenterX;
        const dy = ball.y - blockCenterY;
        
        const halfWidth = block.width / 2;
        const halfHeight = block.height / 2;
        
        // 判断碰撞发生在哪个面
        const overlapX = halfWidth - Math.abs(dx);
        const overlapY = halfHeight - Math.abs(dy);
        
        if (overlapX < overlapY) {
            // 左右碰撞
            return { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
            // 上下碰撞
            return { x: 0, y: dy > 0 ? 1 : -1 };
        }
    }
    
    /**
     * 反射速度
     */
    private reflectVelocity(ball: Ball, normal: { x: number; y: number }): void {
        const dot = ball.vx * normal.x + ball.vy * normal.y;
        ball.vx = (ball.vx - 2 * dot * normal.x) * this.RESTITUTION;
        ball.vy = (ball.vy - 2 * dot * normal.y) * this.RESTITUTION;
    }
    
    /**
     * 分离弹球和方块
     */
    private separateBallFromBlock(
        ball: Ball,
        block: Block,
        normal: { x: number; y: number }
    ): void {
        // 将弹球移出方块
        const penetration = ball.radius - this.getDistanceToBlock(ball, block);
        ball.x += normal.x * penetration * 1.1;
        ball.y += normal.y * penetration * 1.1;
    }
    
    /**
     * 获取弹球到方块的距离
     */
    private getDistanceToBlock(ball: Ball, block: Block): number {
        const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
        const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.height));
        
        const distanceX = ball.x - closestX;
        const distanceY = ball.y - closestY;
        
        return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    }
    
    /**
     * 处理方块被摧毁
     */
    private handleBlockDestroyed(block: Block, damage: number): void {
        // 触发特殊效果
        this.triggerBlockEffect(block);
        
        // 触发回调
        if (this.onBlockDestroyed) {
            this.onBlockDestroyed(block, damage);
        }
    }
    
    /**
     * 触发方块特殊效果
     */
    private triggerBlockEffect(block: Block): void {
        switch (block.type) {
            case BlockType.BOMB:
                this.triggerBombEffect(block);
                break;
            case BlockType.ADD_BALL:
                this.pendingBalls++;
                break;
            case BlockType.RAINBOW:
                this.triggerRainbowEffect(block);
                break;
            case BlockType.GOLD:
                // 金币效果在外部处理（双倍金币）
                break;
        }
        
        if (this.onSpecialBlockTriggered) {
            this.onSpecialBlockTriggered(block);
        }
    }
    
    /**
     * 炸弹效果 - 消除周围3x3方块
     */
    private triggerBombEffect(bombBlock: Block): void {
        for (const block of this.blocks) {
            if (block.id === bombBlock.id) continue;
            
            const rowDiff = Math.abs(block.row - bombBlock.row);
            const colDiff = Math.abs(block.col - bombBlock.col);
            
            if (rowDiff <= 1 && colDiff <= 1) {
                block.hp = 0;
                if (this.onBlockDestroyed) {
                    this.onBlockDestroyed(block, block.maxHp);
                }
            }
        }
    }
    
    /**
     * 彩虹效果 - 消除同行所有方块
     */
    private triggerRainbowEffect(rainbowBlock: Block): void {
        for (const block of this.blocks) {
            if (block.id === rainbowBlock.id) continue;
            
            if (block.row === rainbowBlock.row) {
                block.hp = 0;
                if (this.onBlockDestroyed) {
                    this.onBlockDestroyed(block, block.maxHp);
                }
            }
        }
    }
    
    /**
     * 检查弹球是否返回（落到屏幕下方）
     */
    private checkBallReturn(ball: Ball): void {
        if (ball.y > this.launcherY + 50) {
            ball.isActive = false;
            
            if (this.onBallReturned) {
                this.onBallReturned(ball);
            }
            
            // 检查是否所有弹球都返回了
            if (this.balls.filter(b => b.isActive).length === 0) {
                this.onRoundEnd();
            }
        }
    }
    
    /**
     * 回合结束处理
     */
    private onRoundEnd(): void {
        this.currentRound++;
        
        // 所有方块下移一行
        for (const block of this.blocks) {
            block.y += this.BLOCK_HEIGHT + this.BLOCK_PADDING;
            block.row++;
        }
        
        // 生成新的一行方块
        this.spawnNewRow(1);
        
        // 重置待发射弹球
        this.pendingBalls = Math.max(1, this.pendingBalls);
        
        console.log(`[PhysicsEngine] 回合结束，进入第 ${this.currentRound} 回合`);
    }
    
    /**
     * 检查是否有方块到达底线（游戏结束条件）
     */
    public isBlockAtBottom(): boolean {
        for (const block of this.blocks) {
            if (block.y + block.height >= this.BLOCK_DROP_LINE) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 重置物理引擎
     */
    public reset(): void {
        this.balls = [];
        this.blocks = [];
        this.currentRound = 1;
        this.pendingBalls = 1;
        this.spawnInitialBlocks();
        
        console.log('[PhysicsEngine] 重置完成');
    }
    
    /**
     * 获取发射预测线
     */
    public getLaunchPrediction(angle: number, maxBounces: number = 3): Array<{x: number, y: number}> {
        const points: Array<{x: number, y: number}> = [];
        const radians = (angle - 90) * Math.PI / 180;
        
        let x = this.launcherX;
        let y = this.launcherY;
        let vx = Math.cos(radians);
        let vy = Math.sin(radians);
        
        const step = 10;
        const maxSteps = 200;
        let bounces = 0;
        
        for (let i = 0; i < maxSteps && bounces < maxBounces; i++) {
            points.push({ x, y });
            
            x += vx * step;
            y += vy * step;
            
            // 墙壁反弹
            if (x < this.BALL_RADIUS || x > this.screenWidth - this.BALL_RADIUS) {
                vx = -vx;
                bounces++;
            }
            if (y < this.BALL_RADIUS) {
                vy = -vy;
                bounces++;
            }
            
            // 到达底部停止
            if (y > this.launcherY) {
                break;
            }
        }
        
        return points;
    }
    
    // ========== Getter & Setter ==========
    
    public getBalls(): Ball[] {
        return [...this.balls];
    }
    
    public getBlocks(): Block[] {
        return [...this.blocks];
    }
    
    public getPendingBalls(): number {
        return this.pendingBalls;
    }
    
    public getCurrentRound(): number {
        return this.currentRound;
    }
    
    public getLauncherPosition(): { x: number; y: number } {
        return { x: this.launcherX, y: this.launcherY };
    }
    
    public setOnBlockDestroyed(callback: (block: Block, damage: number) => void): void {
        this.onBlockDestroyed = callback;
    }
    
    public setOnBallReturned(callback: (ball: Ball) => void): void {
        this.onBallReturned = callback;
    }
    
    public setOnSpecialBlockTriggered(callback: (block: Block) => void): void {
        this.onSpecialBlockTriggered = callback;
    }
}
