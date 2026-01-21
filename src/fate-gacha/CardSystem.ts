/**
 * 卡牌系统 - 命运抽卡核心
 * 处理所有卡牌的抽取、管理和效果
 */

// 稀有度
export type Rarity = 'N' | 'R' | 'SR' | 'SSR';

// 稀有度概率
export const RARITY_RATES: Record<Rarity, number> = {
    'N': 0.60,    // 60%
    'R': 0.30,    // 30%
    'SR': 0.08,   // 8%
    'SSR': 0.02   // 2%
};

// 属性修改器
export interface AttributeModifier {
    attribute: string;
    value: number;
    type: 'add' | 'multiply' | 'set';
}

// 基础卡牌接口
export interface BaseCard {
    id: string;
    name: string;
    rarity: Rarity;
    description: string;
    flavorText?: string;
    icon: string;
}

// 初始卡（投胎时抽取）
export interface OriginCard extends BaseCard {
    category: 'family' | 'talent' | 'appearance';
    effects: AttributeModifier[];
    unlockRoutes?: string[];
    specialEvents?: string[];
}

// 事件卡
export interface EventCard extends BaseCard {
    category: 'opportunity' | 'crisis' | 'choice' | 'relationship';
    stage: LifeStage;
    requirements?: Requirement[];
    choices: EventChoice[];
    isRepeatable?: boolean;
}

// 能力卡（玩家持有的道具）
export interface AbilityCard extends BaseCard {
    effect: AbilityEffect;
    usageLimit: number;
    cooldown?: number;
}

// 结局卡
export interface EndingCard extends BaseCard {
    category: 'career' | 'love' | 'family' | 'special' | 'hidden';
    conditions: EndingCondition[];
    epitaph: string;
    score: number;
}

// 人生阶段
export type LifeStage = 'childhood' | 'teenage' | 'youth' | 'adult' | 'middle' | 'senior';

// 需求条件
export interface Requirement {
    type: 'attribute' | 'event' | 'card' | 'choice';
    target: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | 'has' | 'not';
    value: number | string | boolean;
}

// 事件选择
export interface EventChoice {
    id: string;
    text: string;
    requirements?: Requirement[];
    effects: ChoiceEffect[];
    probability?: number;
    nextEventId?: string;
}

// 选择效果
export interface ChoiceEffect {
    type: 'attribute' | 'card' | 'event' | 'ending' | 'random';
    target: string;
    value: number | string;
    probability?: number;
}

// 能力效果
export interface AbilityEffect {
    type: 'reroll' | 'preview' | 'protect' | 'boost' | 'skip';
    target: string;
    value: number;
}

// 结局条件
export interface EndingCondition {
    type: 'attribute' | 'achievement' | 'event' | 'combination';
    target: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | 'has' | 'all';
    value: number | string | string[];
}

/**
 * 卡牌系统管理器
 */
export class CardSystem {
    private static instance: CardSystem;
    
    // 卡牌库
    private originCards: Map<string, OriginCard> = new Map();
    private eventCards: Map<string, EventCard> = new Map();
    private abilityCards: Map<string, AbilityCard> = new Map();
    private endingCards: Map<string, EndingCard> = new Map();
    
    // 按类别分组的卡牌池
    private familyPool: OriginCard[] = [];
    private talentPool: OriginCard[] = [];
    private appearancePool: OriginCard[] = [];
    private eventPool: Map<LifeStage, EventCard[]> = new Map();
    
    // 保底计数器
    private pityCounter: number = 0;
    private readonly PITY_THRESHOLD = 50;
    
    private constructor() {
        this.initCardPools();
    }
    
    public static getInstance(): CardSystem {
        if (!CardSystem.instance) {
            CardSystem.instance = new CardSystem();
        }
        return CardSystem.instance;
    }
    
    /**
     * 初始化卡牌池
     */
    private initCardPools(): void {
        this.initOriginCards();
        this.initEventCards();
        this.initAbilityCards();
        this.initEndingCards();
    }
    
    /**
     * 初始化初始卡
     */
    private initOriginCards(): void {
        // 家庭背景卡
        const familyCards: OriginCard[] = [
            {
                id: 'family_royal',
                name: '豪门世家',
                rarity: 'SSR',
                category: 'family',
                description: '含着金汤匙出生，资源无限',
                flavorText: '"从小就知道，钱不是问题"',
                icon: '👑',
                effects: [
                    { attribute: 'wealth', value: 100, type: 'set' },
                    { attribute: 'connections', value: 3, type: 'add' }
                ],
                unlockRoutes: ['elite', 'heir'],
                specialEvents: ['family_pressure', 'inheritance_battle']
            },
            {
                id: 'family_scholar',
                name: '书香门第',
                rarity: 'SR',
                category: 'family',
                description: '知识分子家庭，重视教育',
                flavorText: '"我们家三代都是读书人"',
                icon: '📚',
                effects: [
                    { attribute: 'intelligence', value: 2, type: 'add' },
                    { attribute: 'wealth', value: 40, type: 'set' }
                ],
                unlockRoutes: ['academic']
            },
            {
                id: 'family_business',
                name: '商人之家',
                rarity: 'SR',
                category: 'family',
                description: '家里做生意，从小耳濡目染',
                icon: '💼',
                effects: [
                    { attribute: 'wealth', value: 60, type: 'set' },
                    { attribute: 'connections', value: 1, type: 'add' }
                ],
                unlockRoutes: ['entrepreneur']
            },
            {
                id: 'family_middle',
                name: '小康之家',
                rarity: 'R',
                category: 'family',
                description: '不穷不富，平平淡淡',
                icon: '🏠',
                effects: [
                    { attribute: 'wealth', value: 50, type: 'set' }
                ]
            },
            {
                id: 'family_worker',
                name: '工薪家庭',
                rarity: 'N',
                category: 'family',
                description: '普通上班族家庭',
                icon: '👨‍👩‍👧',
                effects: [
                    { attribute: 'wealth', value: 30, type: 'set' }
                ]
            },
            {
                id: 'family_poor',
                name: '贫困家庭',
                rarity: 'N',
                category: 'family',
                description: '起点很低，但激励更强',
                flavorText: '"穷人的孩子早当家"',
                icon: '🏚️',
                effects: [
                    { attribute: 'wealth', value: 10, type: 'set' },
                    { attribute: 'willpower', value: 2, type: 'add' }
                ],
                unlockRoutes: ['rags_to_riches']
            }
        ];
        
        familyCards.forEach(card => {
            this.originCards.set(card.id, card);
            this.familyPool.push(card);
        });
        
        // 天赋卡
        const talentCards: OriginCard[] = [
            {
                id: 'talent_genius',
                name: '全能天才',
                rarity: 'SSR',
                category: 'talent',
                description: '天选之人，各方面都很强',
                icon: '🌟',
                effects: [
                    { attribute: 'intelligence', value: 2, type: 'add' },
                    { attribute: 'charm', value: 1, type: 'add' },
                    { attribute: 'health', value: 1, type: 'add' }
                ]
            },
            {
                id: 'talent_smart',
                name: '学霸基因',
                rarity: 'SR',
                category: 'talent',
                description: '学习能力超强',
                icon: '🧠',
                effects: [
                    { attribute: 'intelligence', value: 3, type: 'add' }
                ],
                unlockRoutes: ['academic', 'tech']
            },
            {
                id: 'talent_athletic',
                name: '运动天赋',
                rarity: 'SR',
                category: 'talent',
                description: '身体素质极佳',
                icon: '💪',
                effects: [
                    { attribute: 'health', value: 3, type: 'add' }
                ],
                unlockRoutes: ['sports', 'military']
            },
            {
                id: 'talent_artistic',
                name: '艺术细胞',
                rarity: 'SR',
                category: 'talent',
                description: '对美有独特的感知',
                icon: '🎨',
                effects: [
                    { attribute: 'charm', value: 2, type: 'add' },
                    { attribute: 'creativity', value: 2, type: 'add' }
                ],
                unlockRoutes: ['artist', 'entertainer']
            },
            {
                id: 'talent_social',
                name: '社交达人',
                rarity: 'SR',
                category: 'talent',
                description: '天生会说话，人见人爱',
                icon: '🗣️',
                effects: [
                    { attribute: 'connections', value: 3, type: 'add' }
                ]
            },
            {
                id: 'talent_lucky',
                name: '欧皇体质',
                rarity: 'R',
                category: 'talent',
                description: '运气超好，经常中奖',
                icon: '🍀',
                effects: [
                    { attribute: 'luck', value: 3, type: 'add' }
                ]
            },
            {
                id: 'talent_normal',
                name: '普通资质',
                rarity: 'N',
                category: 'talent',
                description: '没什么特别的，但也没什么不好',
                icon: '😐',
                effects: []
            }
        ];
        
        talentCards.forEach(card => {
            this.originCards.set(card.id, card);
            this.talentPool.push(card);
        });
        
        // 外貌卡
        const appearanceCards: OriginCard[] = [
            {
                id: 'appearance_stunning',
                name: '倾国倾城',
                rarity: 'SSR',
                category: 'appearance',
                description: '颜值巅峰，走到哪都是焦点',
                icon: '👸',
                effects: [
                    { attribute: 'charm', value: 5, type: 'add' }
                ],
                unlockRoutes: ['celebrity', 'model'],
                specialEvents: ['stalker', 'beauty_trouble']
            },
            {
                id: 'appearance_handsome',
                name: '帅气/美丽',
                rarity: 'SR',
                category: 'appearance',
                description: '长得好看，社交加分',
                icon: '😎',
                effects: [
                    { attribute: 'charm', value: 3, type: 'add' }
                ]
            },
            {
                id: 'appearance_good',
                name: '清秀/端正',
                rarity: 'R',
                category: 'appearance',
                description: '耐看型，越看越顺眼',
                icon: '🙂',
                effects: [
                    { attribute: 'charm', value: 1, type: 'add' }
                ]
            },
            {
                id: 'appearance_normal',
                name: '普通长相',
                rarity: 'N',
                category: 'appearance',
                description: '大众脸，不出众也不丑',
                icon: '😐',
                effects: []
            },
            {
                id: 'appearance_plain',
                name: '路人脸',
                rarity: 'N',
                category: 'appearance',
                description: '存在感略低，但可以专注内在',
                icon: '🧑',
                effects: [
                    { attribute: 'charm', value: -1, type: 'add' },
                    { attribute: 'focus', value: 1, type: 'add' }
                ]
            }
        ];
        
        appearanceCards.forEach(card => {
            this.originCards.set(card.id, card);
            this.appearancePool.push(card);
        });
    }
    
    /**
     * 初始化事件卡
     */
    private initEventCards(): void {
        const stages: LifeStage[] = ['childhood', 'teenage', 'youth', 'adult', 'middle', 'senior'];
        stages.forEach(stage => this.eventPool.set(stage, []));
        
        // 童年事件
        const childhoodEvents: EventCard[] = [
            {
                id: 'event_child_prodigy',
                name: '神童出世',
                rarity: 'SR',
                category: 'opportunity',
                stage: 'childhood',
                description: '你在学校表现出惊人的学习能力',
                icon: '🌟',
                requirements: [
                    { type: 'attribute', target: 'intelligence', operator: '>=', value: 3 }
                ],
                choices: [
                    {
                        id: 'skip_grade',
                        text: '接受跳级',
                        effects: [
                            { type: 'attribute', target: 'intelligence', value: 1 },
                            { type: 'attribute', target: 'connections', value: -1 },
                            { type: 'event', target: 'flag_skipped_grade', value: 'true' }
                        ]
                    },
                    {
                        id: 'stay_normal',
                        text: '保持正常升学',
                        effects: [
                            { type: 'attribute', target: 'connections', value: 1 },
                            { type: 'attribute', target: 'health', value: 1 }
                        ]
                    }
                ]
            },
            {
                id: 'event_child_bully',
                name: '校园霸凌',
                rarity: 'R',
                category: 'crisis',
                stage: 'childhood',
                description: '你在学校遭遇了霸凌...',
                icon: '😢',
                choices: [
                    {
                        id: 'fight_back',
                        text: '奋起反抗',
                        effects: [
                            { type: 'attribute', target: 'willpower', value: 2 },
                            { type: 'attribute', target: 'health', value: -1 }
                        ]
                    },
                    {
                        id: 'tell_teacher',
                        text: '告诉老师',
                        effects: [
                            { type: 'random', target: 'bully_result', value: 0.5 }
                        ]
                    },
                    {
                        id: 'endure',
                        text: '默默忍受',
                        effects: [
                            { type: 'attribute', target: 'happiness', value: -10 },
                            { type: 'attribute', target: 'willpower', value: 1 }
                        ]
                    }
                ]
            },
            {
                id: 'event_child_talent',
                name: '发现兴趣',
                rarity: 'R',
                category: 'choice',
                stage: 'childhood',
                description: '父母发现你对某些事情特别感兴趣',
                icon: '🎯',
                choices: [
                    {
                        id: 'music',
                        text: '学习音乐',
                        effects: [
                            { type: 'attribute', target: 'creativity', value: 2 },
                            { type: 'event', target: 'skill_music', value: 'true' }
                        ]
                    },
                    {
                        id: 'sports',
                        text: '参加体育',
                        effects: [
                            { type: 'attribute', target: 'health', value: 2 },
                            { type: 'event', target: 'skill_sports', value: 'true' }
                        ]
                    },
                    {
                        id: 'coding',
                        text: '学编程',
                        effects: [
                            { type: 'attribute', target: 'intelligence', value: 2 },
                            { type: 'event', target: 'skill_coding', value: 'true' }
                        ]
                    },
                    {
                        id: 'nothing',
                        text: '快乐童年，什么都不学',
                        effects: [
                            { type: 'attribute', target: 'happiness', value: 10 }
                        ]
                    }
                ]
            }
        ];
        
        childhoodEvents.forEach(event => {
            this.eventCards.set(event.id, event);
            this.eventPool.get('childhood')!.push(event);
        });
        
        // 青年事件
        const youthEvents: EventCard[] = [
            {
                id: 'event_youth_college',
                name: '高考抉择',
                rarity: 'R',
                category: 'choice',
                stage: 'teenage',
                description: '高考结束了，你面临人生的第一个重大选择',
                icon: '🎓',
                choices: [
                    {
                        id: 'top_university',
                        text: '冲刺名校',
                        requirements: [
                            { type: 'attribute', target: 'intelligence', operator: '>=', value: 4 }
                        ],
                        effects: [
                            { type: 'random', target: 'university_result', value: 0.7 },
                            { type: 'attribute', target: 'connections', value: 2 }
                        ]
                    },
                    {
                        id: 'normal_university',
                        text: '稳妥选择普通大学',
                        effects: [
                            { type: 'event', target: 'education_normal', value: 'true' }
                        ]
                    },
                    {
                        id: 'vocational',
                        text: '上职业学校学技术',
                        effects: [
                            { type: 'attribute', target: 'skill', value: 2 },
                            { type: 'event', target: 'early_career', value: 'true' }
                        ]
                    },
                    {
                        id: 'work_directly',
                        text: '直接工作',
                        effects: [
                            { type: 'attribute', target: 'wealth', value: 10 },
                            { type: 'attribute', target: 'experience', value: 2 }
                        ]
                    }
                ]
            },
            {
                id: 'event_youth_firstlove',
                name: '初恋来袭',
                rarity: 'SR',
                category: 'relationship',
                stage: 'youth',
                description: '你遇到了让你心动的人...',
                icon: '💕',
                choices: [
                    {
                        id: 'confess',
                        text: '大胆表白',
                        effects: [
                            { type: 'random', target: 'love_result', value: 0.6 },
                            { type: 'attribute', target: 'courage', value: 1 }
                        ]
                    },
                    {
                        id: 'wait',
                        text: '默默守护',
                        effects: [
                            { type: 'random', target: 'love_wait', value: 0.3 }
                        ]
                    },
                    {
                        id: 'focus_study',
                        text: '专注学业',
                        effects: [
                            { type: 'attribute', target: 'intelligence', value: 1 },
                            { type: 'attribute', target: 'happiness', value: -5 }
                        ]
                    }
                ]
            },
            {
                id: 'event_youth_career',
                name: '职业抉择',
                rarity: 'R',
                category: 'choice',
                stage: 'youth',
                description: '毕业了，你要开始规划职业道路',
                icon: '💼',
                choices: [
                    {
                        id: 'big_company',
                        text: '进大公司打工',
                        effects: [
                            { type: 'attribute', target: 'wealth', value: 20 },
                            { type: 'attribute', target: 'connections', value: 1 },
                            { type: 'event', target: 'career_corporate', value: 'true' }
                        ]
                    },
                    {
                        id: 'startup',
                        text: '加入创业公司',
                        effects: [
                            { type: 'random', target: 'startup_result', value: 0.4 },
                            { type: 'attribute', target: 'experience', value: 2 }
                        ]
                    },
                    {
                        id: 'own_business',
                        text: '自己创业',
                        effects: [
                            { type: 'random', target: 'entrepreneur_result', value: 0.2 },
                            { type: 'attribute', target: 'willpower', value: 2 }
                        ]
                    },
                    {
                        id: 'civil_service',
                        text: '考公务员',
                        requirements: [
                            { type: 'attribute', target: 'intelligence', operator: '>=', value: 3 }
                        ],
                        effects: [
                            { type: 'attribute', target: 'stability', value: 3 },
                            { type: 'event', target: 'career_government', value: 'true' }
                        ]
                    }
                ]
            }
        ];
        
        youthEvents.forEach(event => {
            this.eventCards.set(event.id, event);
            if (event.stage === 'teenage') {
                this.eventPool.get('teenage')!.push(event);
            } else {
                this.eventPool.get('youth')!.push(event);
            }
        });
    }
    
    /**
     * 初始化能力卡
     */
    private initAbilityCards(): void {
        const abilities: AbilityCard[] = [
            {
                id: 'ability_reroll',
                name: '重来一次',
                rarity: 'SR',
                description: '重新抽取当前事件卡',
                icon: '🔄',
                effect: { type: 'reroll', target: 'current_event', value: 1 },
                usageLimit: 1
            },
            {
                id: 'ability_preview',
                name: '未卜先知',
                rarity: 'R',
                description: '预览下一张事件卡',
                icon: '👁️',
                effect: { type: 'preview', target: 'next_event', value: 1 },
                usageLimit: 3
            },
            {
                id: 'ability_shield',
                name: '护身符',
                rarity: 'SR',
                description: '抵消一次负面事件',
                icon: '🛡️',
                effect: { type: 'protect', target: 'negative_event', value: 1 },
                usageLimit: 1
            },
            {
                id: 'ability_lucky',
                name: '幸运加持',
                rarity: 'R',
                description: '下次抽卡必出R以上',
                icon: '🍀',
                effect: { type: 'boost', target: 'gacha_rate', value: 2 },
                usageLimit: 2
            }
        ];
        
        abilities.forEach(card => {
            this.abilityCards.set(card.id, card);
        });
    }
    
    /**
     * 初始化结局卡
     */
    private initEndingCards(): void {
        const endings: EndingCard[] = [
            {
                id: 'ending_billionaire',
                name: '世界首富',
                rarity: 'SSR',
                category: 'career',
                description: '你的财富超越了所有人',
                epitaph: '"他买下了整个世界"',
                icon: '💰',
                score: 100,
                conditions: [
                    { type: 'attribute', target: 'wealth', operator: '>=', value: 100 }
                ]
            },
            {
                id: 'ending_nobel',
                name: '诺贝尔奖得主',
                rarity: 'SSR',
                category: 'career',
                description: '你的研究改变了世界',
                epitaph: '"他的名字将被永远铭记"',
                icon: '🏆',
                score: 100,
                conditions: [
                    { type: 'attribute', target: 'intelligence', operator: '>=', value: 10 },
                    { type: 'event', target: 'career_academic', operator: 'has', value: true }
                ]
            },
            {
                id: 'ending_soulmate',
                name: '神仙眷侣',
                rarity: 'SSR',
                category: 'love',
                description: '你找到了命中注定的那个人',
                epitaph: '"执子之手，与子偕老"',
                icon: '💕',
                score: 95,
                conditions: [
                    { type: 'attribute', target: 'love', operator: '>=', value: 90 },
                    { type: 'event', target: 'married', operator: 'has', value: true }
                ]
            },
            {
                id: 'ending_legend',
                name: '传奇逆袭',
                rarity: 'SSR',
                category: 'special',
                description: '从谷底爬到巅峰',
                epitaph: '"出身不能选择，但人生可以"',
                icon: '⭐',
                score: 100,
                conditions: [
                    { type: 'event', target: 'origin_poor', operator: 'has', value: true },
                    { type: 'attribute', target: 'wealth', operator: '>=', value: 80 }
                ]
            },
            {
                id: 'ending_ordinary',
                name: '平凡一生',
                rarity: 'N',
                category: 'special',
                description: '普普通通，但也算圆满',
                epitaph: '"他是一个好人"',
                icon: '🏠',
                score: 50,
                conditions: []
            }
        ];
        
        endings.forEach(card => {
            this.endingCards.set(card.id, card);
        });
    }
    
    /**
     * 抽取初始卡
     */
    public drawOriginCard(category: 'family' | 'talent' | 'appearance', luckyBoost: number = 0): OriginCard {
        let pool: OriginCard[];
        
        switch (category) {
            case 'family':
                pool = this.familyPool;
                break;
            case 'talent':
                pool = this.talentPool;
                break;
            case 'appearance':
                pool = this.appearancePool;
                break;
        }
        
        return this.drawFromPool(pool, luckyBoost);
    }
    
    /**
     * 抽取事件卡
     */
    public drawEventCard(stage: LifeStage, attributes: Record<string, number>): EventCard | null {
        const pool = this.eventPool.get(stage);
        if (!pool || pool.length === 0) return null;
        
        // 过滤出满足条件的事件
        const availableEvents = pool.filter(event => {
            if (!event.requirements) return true;
            return event.requirements.every(req => this.checkRequirement(req, attributes));
        });
        
        if (availableEvents.length === 0) return null;
        
        return this.drawFromPool(availableEvents, attributes.luck || 0);
    }
    
    /**
     * 从卡池中抽取
     */
    private drawFromPool<T extends BaseCard>(pool: T[], luckyBoost: number = 0): T {
        // 检查保底
        this.pityCounter++;
        if (this.pityCounter >= this.PITY_THRESHOLD) {
            const srOrAbove = pool.filter(c => c.rarity === 'SR' || c.rarity === 'SSR');
            if (srOrAbove.length > 0) {
                this.pityCounter = 0;
                return srOrAbove[Math.floor(Math.random() * srOrAbove.length)];
            }
        }
        
        // 计算调整后的概率
        const adjustedRates = { ...RARITY_RATES };
        if (luckyBoost > 0) {
            adjustedRates.SSR = Math.min(0.1, adjustedRates.SSR * (1 + luckyBoost * 0.1));
            adjustedRates.SR = Math.min(0.2, adjustedRates.SR * (1 + luckyBoost * 0.05));
        }
        
        // 抽取稀有度
        const roll = Math.random();
        let targetRarity: Rarity;
        
        if (roll < adjustedRates.SSR) {
            targetRarity = 'SSR';
            this.pityCounter = 0;
        } else if (roll < adjustedRates.SSR + adjustedRates.SR) {
            targetRarity = 'SR';
        } else if (roll < adjustedRates.SSR + adjustedRates.SR + adjustedRates.R) {
            targetRarity = 'R';
        } else {
            targetRarity = 'N';
        }
        
        // 从对应稀有度中随机选择
        const targetPool = pool.filter(c => c.rarity === targetRarity);
        if (targetPool.length > 0) {
            return targetPool[Math.floor(Math.random() * targetPool.length)];
        }
        
        // 降级选择
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    /**
     * 检查条件是否满足
     */
    private checkRequirement(req: Requirement, attributes: Record<string, number>): boolean {
        const value = attributes[req.target] || 0;
        
        switch (req.operator) {
            case '>': return value > (req.value as number);
            case '<': return value < (req.value as number);
            case '=': return value === req.value;
            case '>=': return value >= (req.value as number);
            case '<=': return value <= (req.value as number);
            case 'has': return value !== 0 && value !== false;
            case 'not': return value === 0 || value === false;
            default: return true;
        }
    }
    
    /**
     * 判定结局
     */
    public judgeEnding(lifeData: {
        attributes: Record<string, number>;
        events: string[];
        achievements: string[];
    }): EndingCard {
        const allEndings = Array.from(this.endingCards.values());
        
        // 按稀有度排序（优先判定高稀有度）
        const sortedEndings = allEndings.sort((a, b) => {
            const rarityOrder: Record<Rarity, number> = { 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        });
        
        // 找到第一个满足条件的结局
        for (const ending of sortedEndings) {
            if (this.checkEndingConditions(ending, lifeData)) {
                return ending;
            }
        }
        
        // 默认结局
        return this.endingCards.get('ending_ordinary')!;
    }
    
    /**
     * 检查结局条件
     */
    private checkEndingConditions(ending: EndingCard, lifeData: any): boolean {
        if (ending.conditions.length === 0) return true;
        
        return ending.conditions.every(condition => {
            switch (condition.type) {
                case 'attribute':
                    const attrValue = lifeData.attributes[condition.target] || 0;
                    return this.checkRequirement(
                        { ...condition, type: 'attribute' } as Requirement,
                        lifeData.attributes
                    );
                case 'event':
                    return lifeData.events.includes(condition.target as string);
                case 'achievement':
                    return lifeData.achievements.includes(condition.target as string);
                default:
                    return true;
            }
        });
    }
    
    // Getter methods
    public getOriginCard(id: string): OriginCard | undefined {
        return this.originCards.get(id);
    }
    
    public getEventCard(id: string): EventCard | undefined {
        return this.eventCards.get(id);
    }
    
    public getAbilityCard(id: string): AbilityCard | undefined {
        return this.abilityCards.get(id);
    }
    
    public getEndingCard(id: string): EndingCard | undefined {
        return this.endingCards.get(id);
    }
    
    public getAllEndings(): EndingCard[] {
        return Array.from(this.endingCards.values());
    }
}
