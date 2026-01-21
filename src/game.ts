/**
 * 游戏入口文件 - 节奏弹球大师
 * 抖音小程序游戏启动点
 */

import { GameManager, GameState, GameData } from './core/GameManager';
import { ShareUtils } from './utils/ShareUtils';

// 全局变量
let gameManager: GameManager;
let canvas: any;
let ctx: any;

// 触摸状态
let touchStartX: number = 0;
let touchStartY: number = 0;
let currentAngle: number = 0;

/**
 * 游戏初始化
 */
async function init(): Promise<void> {
    console.log('🎮 节奏弹球大师 启动中...');
    
    // 获取画布
    canvas = tt.createCanvas();
    ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    const systemInfo = tt.getSystemInfoSync();
    canvas.width = systemInfo.windowWidth;
    canvas.height = systemInfo.windowHeight;
    
    // 初始化游戏管理器
    gameManager = GameManager.getInstance();
    
    // 设置回调
    gameManager.setOnStateChange(onStateChange);
    gameManager.setOnScoreUpdate(onScoreUpdate);
    gameManager.setOnGameOver(onGameOver);
    
    // 初始化游戏
    await gameManager.init({
        bpm: 120,
        initialBalls: 1,
        blockDropSpeed: 50
    });
    
    // 设置默认分享
    ShareUtils.setDefaultShare({
        title: '🎮 节奏弹球大师 - 跟着节奏嗨起来！',
        desc: '音乐+弹球的全新体验，来挑战我吧！'
    });
    
    // 解析邀请信息
    const inviteInfo = ShareUtils.parseInviteFromLaunch();
    if (inviteInfo?.inviteCode) {
        console.log('来自邀请:', inviteInfo.inviteCode);
        // TODO: 处理邀请奖励
    }
    
    // 绑定触摸事件
    bindTouchEvents();
    
    // 开始渲染循环
    requestAnimationFrame(render);
    
    // 显示开始界面
    showStartScreen();
    
    console.log('✅ 游戏初始化完成');
}

/**
 * 绑定触摸事件
 */
function bindTouchEvents(): void {
    tt.onTouchStart((e: any) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    });
    
    tt.onTouchMove((e: any) => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        
        // 计算发射角度
        currentAngle = Math.atan2(deltaX, 100) * (180 / Math.PI);
        currentAngle = Math.max(-75, Math.min(75, currentAngle));
    });
    
    tt.onTouchEnd((e: any) => {
        const state = gameManager.getState();
        
        if (state === GameState.READY) {
            // 开始游戏
            gameManager.start();
            ShareUtils.startRecording({ duration: 30, fps: 24 });
        } else if (state === GameState.PLAYING) {
            // 发射弹球
            gameManager.handleTap(currentAngle);
        } else if (state === GameState.GAME_OVER) {
            // 重新开始
            gameManager.restart();
        }
    });
}

/**
 * 状态变化回调
 */
function onStateChange(state: GameState): void {
    console.log('游戏状态:', state);
    
    switch (state) {
        case GameState.PLAYING:
            // 游戏开始
            break;
        case GameState.PAUSED:
            // 游戏暂停
            break;
        case GameState.GAME_OVER:
            // 游戏结束，停止录制
            ShareUtils.stopRecording();
            break;
    }
}

/**
 * 分数更新回调
 */
function onScoreUpdate(score: number, combo: number): void {
    // UI会在render中更新
}

/**
 * 游戏结束回调
 */
async function onGameOver(data: GameData): Promise<void> {
    console.log('游戏结束，得分:', data.score);
    
    // 生成分享卡片
    try {
        const cardPath = await ShareUtils.generateShareCard(
            data.score,
            await getRank(data.score),
            data.maxCombo
        );
        
        // 显示结算界面
        showResultScreen(data, cardPath);
    } catch (e) {
        console.error('生成分享卡片失败:', e);
        showResultScreen(data, '');
    }
}

/**
 * 获取排名（模拟）
 */
async function getRank(score: number): Promise<number> {
    // TODO: 从服务器获取真实排名
    return Math.max(1, Math.floor(100000 / score));
}

/**
 * 显示开始界面
 */
function showStartScreen(): void {
    // 在render中绘制
}

/**
 * 显示结算界面
 */
function showResultScreen(data: GameData, cardPath: string): void {
    // 在render中绘制
}

/**
 * 渲染循环
 */
function render(): void {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const state = gameManager.getState();
    
    switch (state) {
        case GameState.LOADING:
            renderLoading();
            break;
        case GameState.READY:
            renderStartScreen();
            break;
        case GameState.PLAYING:
            renderGame();
            break;
        case GameState.PAUSED:
            renderPaused();
            break;
        case GameState.GAME_OVER:
        case GameState.RESULT:
            renderResult();
            break;
    }
    
    requestAnimationFrame(render);
}

/**
 * 渲染加载界面
 */
function renderLoading(): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('加载中...', canvas.width / 2, canvas.height / 2);
}

/**
 * 渲染开始界面
 */
function renderStartScreen(): void {
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 节奏弹球大师', canvas.width / 2, canvas.height / 3);
    
    // 副标题
    ctx.font = '18px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('跟随节奏，消灭方块！', canvas.width / 2, canvas.height / 3 + 50);
    
    // 开始提示
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('👆 点击屏幕开始', canvas.width / 2, canvas.height * 0.7);
}

/**
 * 渲染游戏界面
 */
function renderGame(): void {
    const data = gameManager.getData();
    
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // TODO: 渲染方块
    // TODO: 渲染弹球
    // TODO: 渲染发射器
    // TODO: 渲染节奏条
    
    // 分数显示
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${data.score}`, 20, 50);
    
    // 连击显示
    if (data.combo > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${data.combo} COMBO!`, canvas.width / 2, 100);
    }
    
    // 发射角度提示
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height - 100);
    const lineLength = 80;
    const radians = (currentAngle - 90) * Math.PI / 180;
    ctx.lineTo(
        canvas.width / 2 + Math.cos(radians) * lineLength,
        canvas.height - 100 + Math.sin(radians) * lineLength
    );
    ctx.stroke();
}

/**
 * 渲染暂停界面
 */
function renderPaused(): void {
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('暂停', canvas.width / 2, canvas.height / 2);
}

/**
 * 渲染结算界面
 */
function renderResult(): void {
    const data = gameManager.getData();
    
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 游戏结束文字
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 4);
    
    // 最终得分
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(data.score.toLocaleString(), canvas.width / 2, canvas.height / 2 - 30);
    
    // 统计信息
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`最大连击: ${data.maxCombo}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`PERFECT: ${data.perfectCount}`, canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText(`消灭方块: ${data.blocksDestroyed}`, canvas.width / 2, canvas.height / 2 + 90);
    
    // 重新开始提示
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('点击屏幕重新开始', canvas.width / 2, canvas.height * 0.85);
    
    // 分享按钮区域提示
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(canvas.width / 2 - 80, canvas.height * 0.7, 160, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('分享给好友', canvas.width / 2, canvas.height * 0.7 + 27);
}

// 抖音小程序全局类型声明
declare const tt: any;
declare function requestAnimationFrame(callback: () => void): number;

// 启动游戏
init().catch(console.error);
