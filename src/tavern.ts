/**
 * 轮回酒馆 - 游戏主入口
 * 一个关于倾听、遗忘与记忆的游戏
 */

import { SoulManager, Soul, DialogueNode, MemoryType, FarewellResult } from './core/SoulManager';
import { PlayerManager, Achievement } from './core/PlayerManager';
import { DrinkSystem, DrinkMenuData, DrinkResult } from './core/DrinkSystem';

// 游戏状态
enum GameState {
    LOADING = 'loading',
    TITLE = 'title',
    TAVERN_IDLE = 'tavern_idle',      // 酒馆空闲
    SOUL_ARRIVING = 'soul_arriving',   // 灵魂到来
    DIALOGUE = 'dialogue',             // 对话中
    DRINK_MENU = 'drink_menu',         // 调酒选择
    FAREWELL = 'farewell',             // 送别
    MEMORY_VIEW = 'memory_view',       // 查看记忆
    DAILY_END = 'daily_end'            // 今日结束
}

// 游戏上下文
interface GameContext {
    state: GameState;
    currentSoul: Soul | null;
    currentDialogue: DialogueNode | null;
    drinkMenu: DrinkMenuData | null;
    todayStats: {
        soulsServed: number;
        karmaGained: number;
        sinGained: number;
        fragmentsCollected: number;
    };
}

class TavernGame {
    private soulManager: SoulManager;
    private playerManager: PlayerManager;
    private drinkSystem: DrinkSystem;
    
    private context: GameContext;
    
    // 渲染相关
    private canvas: any;
    private ctx: any;
    
    // 动画
    private animationFrameId: number = 0;
    private lastFrameTime: number = 0;
    
    constructor() {
        this.soulManager = SoulManager.getInstance();
        this.playerManager = PlayerManager.getInstance();
        this.drinkSystem = DrinkSystem.getInstance();
        
        this.context = {
            state: GameState.LOADING,
            currentSoul: null,
            currentDialogue: null,
            drinkMenu: null,
            todayStats: {
                soulsServed: 0,
                karmaGained: 0,
                sinGained: 0,
                fragmentsCollected: 0
            }
        };
    }
    
    /**
     * 初始化游戏
     */
    public async init(): Promise<void> {
        console.log('🏮 轮回酒馆 启动中...');
        
        // 初始化画布
        this.initCanvas();
        
        // 初始化玩家数据
        await this.playerManager.init();
        
        // 生成今日灵魂
        this.soulManager.generateDailySouls();
        
        // 设置回调
        this.setupCallbacks();
        
        // 绑定事件
        this.bindEvents();
        
        // 切换到标题界面
        this.changeState(GameState.TITLE);
        
        // 开始渲染循环
        this.startRenderLoop();
        
        console.log('✅ 游戏初始化完成');
    }
    
    /**
     * 初始化画布
     */
    private initCanvas(): void {
        if (typeof tt !== 'undefined') {
            this.canvas = tt.createCanvas();
            const systemInfo = tt.getSystemInfoSync();
            this.canvas.width = systemInfo.windowWidth;
            this.canvas.height = systemInfo.windowHeight;
        } else {
            // Web环境
            this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.width = 375;
                this.canvas.height = 667;
                document.body.appendChild(this.canvas);
            }
        }
        
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * 设置回调
     */
    private setupCallbacks(): void {
        // 对话更新
        this.soulManager.setOnDialogueUpdate((node) => {
            this.context.currentDialogue = node;
            this.render();
        });
        
        // 灵魂送别
        this.soulManager.setOnSoulFarewell((result) => {
            this.handleFarewell(result);
        });
        
        // 功德变化
        this.playerManager.setOnKarmaChange((karma, sin) => {
            console.log(`功德: ${karma}, 业障: ${sin}`);
        });
        
        // 成就解锁
        this.playerManager.setOnAchievementUnlocked((achievement) => {
            this.showAchievementPopup(achievement);
        });
    }
    
    /**
     * 绑定事件
     */
    private bindEvents(): void {
        const handleTouch = (e: any) => {
            const touch = e.touches?.[0] || e;
            const x = touch.clientX;
            const y = touch.clientY;
            this.handleTap(x, y);
        };
        
        if (typeof tt !== 'undefined') {
            tt.onTouchEnd(handleTouch);
        } else {
            this.canvas.addEventListener('click', handleTouch);
        }
    }
    
    /**
     * 处理点击
     */
    private handleTap(x: number, y: number): void {
        switch (this.context.state) {
            case GameState.TITLE:
                this.startGame();
                break;
                
            case GameState.TAVERN_IDLE:
                this.summonSoul();
                break;
                
            case GameState.DIALOGUE:
                this.handleDialogueTap(x, y);
                break;
                
            case GameState.DRINK_MENU:
                this.handleDrinkMenuTap(x, y);
                break;
                
            case GameState.FAREWELL:
                this.finishFarewell();
                break;
                
            case GameState.DAILY_END:
                this.startNewDay();
                break;
        }
    }
    
    /**
     * 开始游戏
     */
    private startGame(): void {
        this.changeState(GameState.TAVERN_IDLE);
    }
    
    /**
     * 召唤灵魂
     */
    private summonSoul(): void {
        const soul = this.soulManager.summonNextSoul();
        
        if (!soul) {
            // 今日灵魂已全部招待
            this.changeState(GameState.DAILY_END);
            return;
        }
        
        this.context.currentSoul = soul;
        this.changeState(GameState.SOUL_ARRIVING);
        
        // 延迟后进入对话
        setTimeout(() => {
            this.changeState(GameState.DIALOGUE);
            this.context.currentDialogue = soul.dialogueTree.get('start') || null;
        }, 2000);
    }
    
    /**
     * 处理对话点击
     */
    private handleDialogueTap(x: number, y: number): void {
        if (!this.context.currentDialogue) return;
        
        const node = this.context.currentDialogue;
        
        // 检查是否触发调酒菜单
        if (node.triggersEvent === 'OPEN_DRINK_MENU') {
            this.openDrinkMenu();
            return;
        }
        
        // 如果有选项，检查点击了哪个
        if (node.choices && node.choices.length > 0) {
            const choiceIndex = this.getClickedChoiceIndex(y);
            if (choiceIndex !== -1) {
                const choice = node.choices[choiceIndex];
                const nextNode = this.soulManager.makeDialogueChoice(choice.id);
                this.context.currentDialogue = nextNode;
            }
        } else {
            // 继续对话
            const nextNode = this.soulManager.continueDialogue();
            this.context.currentDialogue = nextNode;
        }
    }
    
    /**
     * 获取点击的选项索引
     */
    private getClickedChoiceIndex(y: number): number {
        const choices = this.context.currentDialogue?.choices || [];
        const startY = this.canvas.height * 0.6;
        const choiceHeight = 50;
        
        for (let i = 0; i < choices.length; i++) {
            const choiceY = startY + i * choiceHeight;
            if (y >= choiceY && y < choiceY + choiceHeight) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * 打开调酒菜单
     */
    private openDrinkMenu(): void {
        if (!this.context.currentSoul) return;
        
        this.context.drinkMenu = this.drinkSystem.getMenuData(this.context.currentSoul);
        this.changeState(GameState.DRINK_MENU);
    }
    
    /**
     * 处理调酒菜单点击
     */
    private handleDrinkMenuTap(x: number, y: number): void {
        // 简化处理：点击不同区域选择不同配方
        const menuData = this.context.drinkMenu;
        if (!menuData) return;
        
        // 假设点击上半部分完全遗忘，下半部分保留爱情
        if (y < this.canvas.height / 2) {
            // 完全遗忘
            this.serveDrink([]);
        } else {
            // 保留爱情记忆
            this.serveDrink([MemoryType.LOVE]);
        }
    }
    
    /**
     * 调酒并送别
     */
    private serveDrink(keptMemories: MemoryType[]): void {
        const result = this.soulManager.farewellSoul(keptMemories);
        
        if (result) {
            this.context.todayStats.soulsServed++;
            this.context.todayStats.karmaGained += result.karmaGained;
            this.context.todayStats.sinGained += result.sinGained;
            this.context.todayStats.fragmentsCollected += result.fragmentsGained.length;
            
            // 处理玩家数据
            this.playerManager.processFarewell(result);
        }
        
        this.changeState(GameState.FAREWELL);
    }
    
    /**
     * 处理送别
     */
    private handleFarewell(result: FarewellResult): void {
        console.log(`送别 ${result.soul.name}`);
        console.log(`功德 +${result.karmaGained}, 业障 +${result.sinGained}`);
        console.log(`获得 ${result.fragmentsGained.length} 个记忆碎片`);
    }
    
    /**
     * 完成送别
     */
    private finishFarewell(): void {
        this.context.currentSoul = null;
        this.context.currentDialogue = null;
        this.context.drinkMenu = null;
        
        // 检查是否还有灵魂
        if (this.soulManager.getRemainingCount() > 0) {
            this.changeState(GameState.TAVERN_IDLE);
        } else {
            this.changeState(GameState.DAILY_END);
        }
    }
    
    /**
     * 开始新的一天
     */
    private startNewDay(): void {
        this.soulManager.generateDailySouls();
        this.context.todayStats = {
            soulsServed: 0,
            karmaGained: 0,
            sinGained: 0,
            fragmentsCollected: 0
        };
        this.changeState(GameState.TAVERN_IDLE);
    }
    
    /**
     * 显示成就弹窗
     */
    private showAchievementPopup(achievement: Achievement): void {
        console.log(`🏆 解锁成就: ${achievement.name}`);
        // TODO: 显示成就弹窗UI
    }
    
    /**
     * 状态切换
     */
    private changeState(newState: GameState): void {
        console.log(`状态切换: ${this.context.state} -> ${newState}`);
        this.context.state = newState;
        this.render();
    }
    
    /**
     * 开始渲染循环
     */
    private startRenderLoop(): void {
        const loop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }
    
    /**
     * 渲染
     */
    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch (this.context.state) {
            case GameState.LOADING:
                this.renderLoading();
                break;
            case GameState.TITLE:
                this.renderTitle();
                break;
            case GameState.TAVERN_IDLE:
                this.renderTavernIdle();
                break;
            case GameState.SOUL_ARRIVING:
                this.renderSoulArriving();
                break;
            case GameState.DIALOGUE:
                this.renderDialogue();
                break;
            case GameState.DRINK_MENU:
                this.renderDrinkMenu();
                break;
            case GameState.FAREWELL:
                this.renderFarewell();
                break;
            case GameState.DAILY_END:
                this.renderDailyEnd();
                break;
        }
    }
    
    /**
     * 渲染加载界面
     */
    private renderLoading(): void {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('加载中...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * 渲染标题界面
     */
    private renderTitle(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);
        
        // 标题
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 36px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏮 轮回酒馆 🏮', w / 2, h / 3);
        
        // 副标题
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '16px "PingFang SC", Arial';
        this.ctx.fillText('在生与死的边界，有一家小酒馆', w / 2, h / 3 + 50);
        this.ctx.fillText('每个灵魂在投胎前，都要来这里', w / 2, h / 3 + 80);
        this.ctx.fillText('喝一杯忘川酒', w / 2, h / 3 + 110);
        
        // 开始提示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px "PingFang SC", Arial';
        this.ctx.fillText('👆 点击开始', w / 2, h * 0.75);
        
        // 版本号
        this.ctx.fillStyle = '#444444';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('v1.0.0', w / 2, h - 30);
    }
    
    /**
     * 渲染酒馆空闲状态
     */
    private renderTavernIdle(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        // 顶部状态栏
        this.renderStatusBar();
        
        // 酒馆
        this.ctx.fillStyle = '#2d2d44';
        this.ctx.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.4);
        
        // 灯笼
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏮', w / 2, h * 0.25);
        
        // 提示
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '16px "PingFang SC", Arial';
        this.ctx.fillText('酒馆空空荡荡...', w / 2, h * 0.5);
        
        const remaining = this.soulManager.getRemainingCount();
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`今日还有 ${remaining} 个灵魂等待`, w / 2, h * 0.55);
        
        // 召唤按钮
        this.ctx.fillStyle = '#4a4a6a';
        this.ctx.fillRect(w * 0.25, h * 0.65, w * 0.5, 50);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px "PingFang SC", Arial';
        this.ctx.fillText('👻 召唤下一位灵魂', w / 2, h * 0.65 + 32);
    }
    
    /**
     * 渲染灵魂到来
     */
    private renderSoulArriving(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👻', w / 2, h / 2 - 30);
        this.ctx.fillText('一个灵魂正在走来...', w / 2, h / 2 + 20);
        
        if (this.context.currentSoul) {
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px "PingFang SC", Arial';
            this.ctx.fillText(`来自${this.context.currentSoul.era}`, w / 2, h / 2 + 50);
        }
    }
    
    /**
     * 渲染对话界面
     */
    private renderDialogue(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        this.renderStatusBar();
        
        const node = this.context.currentDialogue;
        const soul = this.context.currentSoul;
        
        if (!node || !soul) return;
        
        // 灵魂信息
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '14px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`👻 ${soul.name}`, w / 2, 80);
        
        // 对话框
        this.ctx.fillStyle = '#2d2d44';
        this.ctx.fillRect(20, h * 0.15, w - 40, h * 0.35);
        
        // 对话内容
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px "PingFang SC", Arial';
        this.ctx.textAlign = 'left';
        
        const lines = this.wrapText(node.text, w - 80);
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 40, h * 0.2 + i * 25);
        });
        
        // 选项
        if (node.choices && node.choices.length > 0) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = '14px "PingFang SC", Arial';
            this.ctx.textAlign = 'left';
            
            node.choices.forEach((choice, i) => {
                const y = h * 0.6 + i * 50;
                
                // 选项背景
                this.ctx.fillStyle = '#3d3d5c';
                this.ctx.fillRect(20, y, w - 40, 45);
                
                // 选项文字
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(choice.text, 30, y + 28);
            });
        } else if (!node.triggersEvent) {
            // 继续提示
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px "PingFang SC", Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击继续...', w / 2, h * 0.85);
        }
        
        // 如果是调酒触发
        if (node.triggersEvent === 'OPEN_DRINK_MENU') {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = '18px "PingFang SC", Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🍶 点击调制忘川酒', w / 2, h * 0.75);
        }
    }
    
    /**
     * 渲染调酒菜单
     */
    private renderDrinkMenu(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 24px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍶 调制忘川酒', w / 2, 60);
        
        const soul = this.context.currentSoul;
        if (soul) {
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px "PingFang SC", Arial';
            this.ctx.fillText(`为 ${soul.name} 调酒`, w / 2, 90);
            this.ctx.fillText(`执念：${soul.obsessionText.slice(0, 20)}...`, w / 2, 115);
        }
        
        // 选项1：完全遗忘
        this.ctx.fillStyle = '#4a9eff';
        this.ctx.fillRect(30, h * 0.25, w - 60, 80);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px "PingFang SC", Arial';
        this.ctx.fillText('忘川清酒', w / 2, h * 0.25 + 35);
        this.ctx.font = '12px "PingFang SC", Arial';
        this.ctx.fillText('完全遗忘，干净投胎 (+15功德)', w / 2, h * 0.25 + 60);
        
        // 选项2：保留爱情
        this.ctx.fillStyle = '#ff6b9d';
        this.ctx.fillRect(30, h * 0.45, w - 60, 80);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px "PingFang SC", Arial';
        this.ctx.fillText('相思醉', w / 2, h * 0.45 + 35);
        this.ctx.font = '12px "PingFang SC", Arial';
        this.ctx.fillText('保留爱情记忆 (+8功德 +2业障)', w / 2, h * 0.45 + 60);
        
        // 提示
        this.ctx.fillStyle = '#666666';
        this.ctx.font = '12px "PingFang SC", Arial';
        this.ctx.fillText('保留的记忆会成为你的收藏', w / 2, h * 0.85);
    }
    
    /**
     * 渲染送别界面
     */
    private renderFarewell(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        
        const soul = this.context.currentSoul;
        if (soul) {
            this.ctx.fillText(`${soul.name} 喝下了忘川酒`, w / 2, h / 3);
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px "PingFang SC", Arial';
            this.ctx.fillText('"再见了..."', w / 2, h / 3 + 40);
            this.ctx.fillText('TA化作一道光，消散在忘川河畔', w / 2, h / 3 + 70);
        }
        
        // 结算
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '16px "PingFang SC", Arial';
        this.ctx.fillText(`功德 +${this.context.todayStats.karmaGained}`, w / 2, h * 0.6);
        
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '14px "PingFang SC", Arial';
        this.ctx.fillText('点击继续...', w / 2, h * 0.85);
    }
    
    /**
     * 渲染每日结束
     */
    private renderDailyEnd(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, w, h);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 24px "PingFang SC", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌙 今日打烊', w / 2, h / 4);
        
        const stats = this.context.todayStats;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px "PingFang SC", Arial';
        this.ctx.fillText(`送走了 ${stats.soulsServed} 个灵魂`, w / 2, h / 2 - 40);
        this.ctx.fillText(`功德 +${stats.karmaGained}`, w / 2, h / 2);
        this.ctx.fillText(`业障 +${stats.sinGained}`, w / 2, h / 2 + 30);
        this.ctx.fillText(`记忆碎片 +${stats.fragmentsCollected}`, w / 2, h / 2 + 60);
        
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '14px "PingFang SC", Arial';
        this.ctx.fillText('明天，会有新的灵魂到来', w / 2, h * 0.75);
        this.ctx.fillText('点击继续...', w / 2, h * 0.85);
    }
    
    /**
     * 渲染状态栏
     */
    private renderStatusBar(): void {
        const w = this.canvas.width;
        const player = this.playerManager.getPlayerData();
        
        this.ctx.fillStyle = '#2d2d44';
        this.ctx.fillRect(0, 0, w, 40);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '14px "PingFang SC", Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`☯️ ${player?.karma || 0}`, 15, 26);
        
        this.ctx.fillStyle = '#9966ff';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${player?.sin || 0} 👹`, w - 15, 26);
    }
    
    /**
     * 文本换行
     */
    private wrapText(text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        const paragraphs = text.split('\n');
        
        for (const paragraph of paragraphs) {
            let line = '';
            for (const char of paragraph) {
                const testLine = line + char;
                const metrics = this.ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && line.length > 0) {
                    lines.push(line);
                    line = char;
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
        }
        
        return lines;
    }
}

// 启动游戏
const game = new TavernGame();
game.init().catch(console.error);

// 抖音小程序全局类型声明
declare const tt: any;
declare function requestAnimationFrame(callback: () => void): number;

export { TavernGame };
