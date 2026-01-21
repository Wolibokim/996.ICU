/**
 * 人生模拟器 - 命运抽卡核心
 * 模拟一个完整的人生过程
 */

import { 
    CardSystem, 
    OriginCard, 
    EventCard, 
    EndingCard,
    AbilityCard,
    EventChoice,
    LifeStage,
    Rarity
} from './CardSystem';

// 人生属性
export interface LifeAttributes {
    // 基础属性
    intelligence: number;   // 智力
    charm: number;          // 魅力
    health: number;         // 健康
    wealth: number;         // 财富
    connections: number;    // 人脉
    luck: number;           // 运气
    
    // 衍生属性
    happiness: number;      // 幸福感
    willpower: number;      // 意志力
    creativity: number;     // 创造力
    experience: number;     // 经验
    love: number;           // 爱情值
    family: number;         // 家庭值
}

// 人生事件记录
export interface LifeEvent {
    id: string;
    age: number;
    stage: LifeStage;
    eventCard: EventCard;
    choiceMade: EventChoice;
    outcome: string;
}

// 人生状态
export interface LifeState {
    age: number;
    stage: LifeStage;
    isAlive: boolean;
    attributes: LifeAttributes;
    
    // 初始卡
    originCards: {
        family: OriginCard;
        talent: OriginCard;
        appearance: OriginCard;
    };
    
    // 事件历史
    lifeEvents: LifeEvent[];
    
    // 成就和标记
    achievements: string[];
    flags: Map<string, any>;
    
    // 能力卡
    abilityCards: AbilityCard[];
    
    // 关系
    relationships: Relationship[];
}

// 关系
export interface Relationship {
    id: string;
    name: string;
    type: 'lover' | 'spouse' | 'child' | 'friend' | 'enemy';
    affection: number;
    startAge: number;
    endAge?: number;
}

// 人生评分
export interface LifeScore {
    career: number;
    love: number;
    family: number;
    health: number;
    wealth: number;
    happiness: number;
    total: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

// 人生摘要
export interface LifeSummary {
    lifespan: number;
    deathCause: string;
    ending: EndingCard;
    score: LifeScore;
    highlights: string[];
    regrets: string[];
}

// 阶段配置
const STAGE_CONFIG: Record<LifeStage, { minAge: number; maxAge: number; eventCount: number }> = {
    'childhood': { minAge: 0, maxAge: 12, eventCount: 3 },
    'teenage': { minAge: 13, maxAge: 18, eventCount: 4 },
    'youth': { minAge: 19, maxAge: 30, eventCount: 5 },
    'adult': { minAge: 31, maxAge: 50, eventCount: 5 },
    'middle': { minAge: 51, maxAge: 65, eventCount: 4 },
    'senior': { minAge: 66, maxAge: 120, eventCount: -1 } // -1 表示随机
};

export class LifeSimulator {
    private cardSystem: CardSystem;
    private state: LifeState;
    
    // 回调函数
    private onStageChange: ((stage: LifeStage) => void) | null = null;
    private onEventDraw: ((event: EventCard) => void) | null = null;
    private onChoiceMade: ((choice: EventChoice, outcome: string) => void) | null = null;
    private onAttributeChange: ((attr: string, oldValue: number, newValue: number) => void) | null = null;
    private onLifeEnd: ((summary: LifeSummary) => void) | null = null;
    
    constructor() {
        this.cardSystem = CardSystem.getInstance();
        this.state = this.createInitialState();
    }
    
    /**
     * 创建初始状态
     */
    private createInitialState(): LifeState {
        return {
            age: 0,
            stage: 'childhood',
            isAlive: true,
            attributes: {
                intelligence: 5,
                charm: 5,
                health: 10,
                wealth: 0,
                connections: 0,
                luck: 5,
                happiness: 50,
                willpower: 5,
                creativity: 5,
                experience: 0,
                love: 0,
                family: 0
            },
            originCards: {
                family: null as any,
                talent: null as any,
                appearance: null as any
            },
            lifeEvents: [],
            achievements: [],
            flags: new Map(),
            abilityCards: [],
            relationships: []
        };
    }
    
    /**
     * 开始新人生
     */
    public startNewLife(): void {
        this.state = this.createInitialState();
        console.log('[LifeSimulator] 开始新人生');
    }
    
    /**
     * 投胎抽卡
     */
    public drawOriginCards(): { family: OriginCard; talent: OriginCard; appearance: OriginCard } {
        const family = this.cardSystem.drawOriginCard('family');
        const talent = this.cardSystem.drawOriginCard('talent');
        const appearance = this.cardSystem.drawOriginCard('appearance');
        
        this.state.originCards = { family, talent, appearance };
        
        // 应用初始卡效果
        this.applyCardEffects(family);
        this.applyCardEffects(talent);
        this.applyCardEffects(appearance);
        
        // 设置特殊标记
        if (family.id === 'family_poor') {
            this.state.flags.set('origin_poor', true);
        }
        if (family.id === 'family_royal') {
            this.state.flags.set('origin_rich', true);
        }
        
        console.log(`[LifeSimulator] 投胎结果: ${family.name} + ${talent.name} + ${appearance.name}`);
        
        return { family, talent, appearance };
    }
    
    /**
     * 应用卡牌效果
     */
    private applyCardEffects(card: OriginCard): void {
        for (const effect of card.effects) {
            const attr = effect.attribute as keyof LifeAttributes;
            const oldValue = this.state.attributes[attr] || 0;
            let newValue: number;
            
            switch (effect.type) {
                case 'add':
                    newValue = oldValue + effect.value;
                    break;
                case 'multiply':
                    newValue = oldValue * effect.value;
                    break;
                case 'set':
                    newValue = effect.value;
                    break;
                default:
                    newValue = oldValue;
            }
            
            this.state.attributes[attr] = Math.max(0, Math.min(100, newValue));
            
            if (this.onAttributeChange) {
                this.onAttributeChange(attr, oldValue, newValue);
            }
        }
    }
    
    /**
     * 进入下一阶段
     */
    public enterStage(stage: LifeStage): void {
        this.state.stage = stage;
        this.state.age = STAGE_CONFIG[stage].minAge;
        
        if (this.onStageChange) {
            this.onStageChange(stage);
        }
        
        console.log(`[LifeSimulator] 进入人生阶段: ${stage}, 年龄: ${this.state.age}`);
    }
    
    /**
     * 抽取当前阶段的事件卡
     */
    public drawEvent(): EventCard | null {
        const event = this.cardSystem.drawEventCard(
            this.state.stage,
            this.state.attributes as unknown as Record<string, number>
        );
        
        if (event && this.onEventDraw) {
            this.onEventDraw(event);
        }
        
        return event;
    }
    
    /**
     * 做出选择
     */
    public makeChoice(event: EventCard, choiceId: string): { success: boolean; outcome: string } {
        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) {
            return { success: false, outcome: '无效的选择' };
        }
        
        // 检查选择条件
        if (choice.requirements) {
            const meetsRequirements = choice.requirements.every(req => 
                this.checkRequirement(req)
            );
            if (!meetsRequirements) {
                return { success: false, outcome: '不满足选择条件' };
            }
        }
        
        // 应用效果
        let outcome = this.applyChoiceEffects(choice);
        
        // 记录事件
        const lifeEvent: LifeEvent = {
            id: `event_${Date.now()}`,
            age: this.state.age,
            stage: this.state.stage,
            eventCard: event,
            choiceMade: choice,
            outcome
        };
        this.state.lifeEvents.push(lifeEvent);
        
        // 增加年龄
        this.state.age += Math.floor(Math.random() * 3) + 1;
        
        if (this.onChoiceMade) {
            this.onChoiceMade(choice, outcome);
        }
        
        // 检查是否死亡
        this.checkDeath();
        
        return { success: true, outcome };
    }
    
    /**
     * 应用选择效果
     */
    private applyChoiceEffects(choice: EventChoice): string {
        let outcome = '';
        
        for (const effect of choice.effects) {
            switch (effect.type) {
                case 'attribute':
                    const attr = effect.target as keyof LifeAttributes;
                    const change = effect.value as number;
                    const oldValue = this.state.attributes[attr] || 0;
                    const newValue = Math.max(0, Math.min(100, oldValue + change));
                    this.state.attributes[attr] = newValue;
                    
                    if (change > 0) {
                        outcome += `${attr} +${change}  `;
                    } else {
                        outcome += `${attr} ${change}  `;
                    }
                    break;
                    
                case 'event':
                    this.state.flags.set(effect.target, effect.value);
                    break;
                    
                case 'random':
                    const probability = effect.value as number;
                    const roll = Math.random();
                    const success = roll < probability;
                    
                    if (effect.target.includes('result')) {
                        if (success) {
                            outcome += '成功！';
                            this.handleRandomSuccess(effect.target);
                        } else {
                            outcome += '失败...';
                            this.handleRandomFailure(effect.target);
                        }
                    }
                    break;
                    
                case 'card':
                    // 获得能力卡
                    const card = this.cardSystem.getAbilityCard(effect.target);
                    if (card) {
                        this.state.abilityCards.push(card);
                        outcome += `获得 ${card.name}！`;
                    }
                    break;
            }
        }
        
        return outcome || '选择完成';
    }
    
    /**
     * 处理随机成功
     */
    private handleRandomSuccess(target: string): void {
        switch (target) {
            case 'love_result':
                this.state.attributes.love += 30;
                this.state.attributes.happiness += 20;
                this.state.flags.set('has_lover', true);
                break;
            case 'startup_result':
                this.state.attributes.wealth += 40;
                this.state.attributes.experience += 10;
                break;
            case 'entrepreneur_result':
                this.state.attributes.wealth += 80;
                this.state.achievements.push('entrepreneur_success');
                break;
            case 'university_result':
                this.state.flags.set('top_university', true);
                this.state.attributes.connections += 3;
                break;
        }
    }
    
    /**
     * 处理随机失败
     */
    private handleRandomFailure(target: string): void {
        switch (target) {
            case 'love_result':
                this.state.attributes.happiness -= 10;
                break;
            case 'startup_result':
                this.state.attributes.wealth -= 10;
                break;
            case 'entrepreneur_result':
                this.state.attributes.wealth -= 30;
                this.state.attributes.willpower += 5;
                break;
            case 'university_result':
                this.state.flags.set('normal_university', true);
                break;
        }
    }
    
    /**
     * 检查条件
     */
    private checkRequirement(req: any): boolean {
        const value = this.state.attributes[req.target as keyof LifeAttributes] || 
                     (this.state.flags.get(req.target) ? 1 : 0);
        
        switch (req.operator) {
            case '>': return value > req.value;
            case '<': return value < req.value;
            case '>=': return value >= req.value;
            case '<=': return value <= req.value;
            case '=': return value === req.value;
            case 'has': return this.state.flags.has(req.target);
            default: return true;
        }
    }
    
    /**
     * 检查死亡
     */
    private checkDeath(): void {
        // 健康值太低
        if (this.state.attributes.health <= 0) {
            this.endLife('疾病');
            return;
        }
        
        // 老年随机死亡
        if (this.state.stage === 'senior') {
            const deathChance = (this.state.age - 65) * 0.02;
            if (Math.random() < deathChance) {
                this.endLife('自然老去');
                return;
            }
        }
        
        // 极端不幸福
        if (this.state.attributes.happiness <= 0 && Math.random() < 0.1) {
            this.endLife('意外');
            return;
        }
    }
    
    /**
     * 结束人生
     */
    public endLife(deathCause: string = '自然老去'): LifeSummary {
        this.state.isAlive = false;
        
        // 判定结局
        const ending = this.cardSystem.judgeEnding({
            attributes: this.state.attributes as unknown as Record<string, number>,
            events: Array.from(this.state.flags.keys()),
            achievements: this.state.achievements
        });
        
        // 计算评分
        const score = this.calculateScore();
        
        // 提取高光和遗憾
        const highlights = this.extractHighlights();
        const regrets = this.extractRegrets();
        
        const summary: LifeSummary = {
            lifespan: this.state.age,
            deathCause,
            ending,
            score,
            highlights,
            regrets
        };
        
        if (this.onLifeEnd) {
            this.onLifeEnd(summary);
        }
        
        console.log(`[LifeSimulator] 人生结束，享年${this.state.age}岁，结局：${ending.name}`);
        
        return summary;
    }
    
    /**
     * 计算人生评分
     */
    private calculateScore(): LifeScore {
        const attr = this.state.attributes;
        
        const career = Math.min(100, attr.wealth * 0.4 + attr.experience * 0.3 + attr.intelligence * 3);
        const love = Math.min(100, attr.love);
        const family = Math.min(100, attr.family + (this.state.relationships.filter(r => r.type === 'child').length * 20));
        const health = Math.min(100, attr.health * 10);
        const wealth = Math.min(100, attr.wealth);
        const happiness = Math.min(100, attr.happiness);
        
        const total = Math.round((career + love + family + health + wealth + happiness) / 6);
        
        let grade: LifeScore['grade'];
        if (total >= 90) grade = 'S';
        else if (total >= 80) grade = 'A';
        else if (total >= 70) grade = 'B';
        else if (total >= 60) grade = 'C';
        else if (total >= 50) grade = 'D';
        else grade = 'F';
        
        return { career, love, family, health, wealth, happiness, total, grade };
    }
    
    /**
     * 提取高光时刻
     */
    private extractHighlights(): string[] {
        const highlights: string[] = [];
        
        if (this.state.attributes.wealth >= 80) {
            highlights.push('财富自由');
        }
        if (this.state.flags.get('has_lover')) {
            highlights.push('找到真爱');
        }
        if (this.state.achievements.includes('entrepreneur_success')) {
            highlights.push('创业成功');
        }
        if (this.state.flags.get('top_university')) {
            highlights.push('考入名校');
        }
        
        return highlights;
    }
    
    /**
     * 提取遗憾
     */
    private extractRegrets(): string[] {
        const regrets: string[] = [];
        
        if (this.state.attributes.love < 20) {
            regrets.push('没有找到真爱');
        }
        if (this.state.attributes.happiness < 30) {
            regrets.push('一生不太快乐');
        }
        if (this.state.attributes.family < 20) {
            regrets.push('家庭关系疏离');
        }
        
        return regrets;
    }
    
    /**
     * 使用能力卡
     */
    public useAbilityCard(cardId: string): boolean {
        const cardIndex = this.state.abilityCards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;
        
        const card = this.state.abilityCards[cardIndex];
        
        // TODO: 实现能力卡效果
        
        // 减少使用次数
        card.usageLimit--;
        if (card.usageLimit <= 0) {
            this.state.abilityCards.splice(cardIndex, 1);
        }
        
        return true;
    }
    
    /**
     * 获取当前状态
     */
    public getState(): LifeState {
        return { ...this.state };
    }
    
    /**
     * 获取当前阶段应该抽取的事件数量
     */
    public getStageEventCount(): number {
        const config = STAGE_CONFIG[this.state.stage];
        if (config.eventCount === -1) {
            // 老年阶段，随机事件数量
            return Math.floor(Math.random() * 5) + 1;
        }
        return config.eventCount;
    }
    
    /**
     * 检查是否应该进入下一阶段
     */
    public shouldAdvanceStage(): boolean {
        const config = STAGE_CONFIG[this.state.stage];
        return this.state.age >= config.maxAge;
    }
    
    /**
     * 获取下一阶段
     */
    public getNextStage(): LifeStage | null {
        const stages: LifeStage[] = ['childhood', 'teenage', 'youth', 'adult', 'middle', 'senior'];
        const currentIndex = stages.indexOf(this.state.stage);
        if (currentIndex < stages.length - 1) {
            return stages[currentIndex + 1];
        }
        return null;
    }
    
    // 回调设置
    public setOnStageChange(callback: (stage: LifeStage) => void): void {
        this.onStageChange = callback;
    }
    
    public setOnEventDraw(callback: (event: EventCard) => void): void {
        this.onEventDraw = callback;
    }
    
    public setOnChoiceMade(callback: (choice: EventChoice, outcome: string) => void): void {
        this.onChoiceMade = callback;
    }
    
    public setOnAttributeChange(callback: (attr: string, oldValue: number, newValue: number) => void): void {
        this.onAttributeChange = callback;
    }
    
    public setOnLifeEnd(callback: (summary: LifeSummary) => void): void {
        this.onLifeEnd = callback;
    }
}
