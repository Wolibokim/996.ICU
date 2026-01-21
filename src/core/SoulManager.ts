/**
 * 灵魂管理器 - 轮回酒馆核心系统
 * 负责灵魂生成、对话管理、命运追踪
 */

// 记忆类型
export enum MemoryType {
    LOVE = 'love',           // 爱情记忆
    PAIN = 'pain',           // 痛苦记忆
    FAMILY = 'family',       // 亲情记忆
    OBSESSION = 'obsession', // 执念记忆
    JOY = 'joy'              // 美好记忆
}

// 单条记忆
export interface Memory {
    id: string;
    type: MemoryType;
    intensity: number;       // 强度 0-100
    description: string;     // 简短描述
    narrative: string;       // 第一人称叙述（沉浸体验用）
    keywords: string[];      // 关键词，用于关联
}

// 对话节点
export interface DialogueNode {
    id: string;
    speaker: 'soul' | 'player' | 'narrator';
    text: string;
    emotion?: string;        // 情绪标签
    choices?: DialogueChoice[];
    next?: string;           // 下一节点ID（无选择时）
    unlocksMemory?: string;  // 解锁的记忆ID
    triggersEvent?: string;  // 触发的事件
}

// 对话选择
export interface DialogueChoice {
    id: string;
    text: string;
    tone: 'gentle' | 'direct' | 'empathy' | 'skip' | 'silence';
    nextNode: string;
    karmaChange?: number;    // 功德变化
    sinChange?: number;      // 业障变化
    revealMemory?: string;   // 揭示的记忆类型
}

// 灵魂实体
export interface Soul {
    id: string;
    name: string;
    era: string;             // 年代背景
    gender: 'male' | 'female' | 'unknown';
    deathAge: number;
    deathCause: string;
    personality: string[];   // 性格标签
    
    // 五种记忆
    memories: {
        [MemoryType.LOVE]: Memory[];
        [MemoryType.PAIN]: Memory[];
        [MemoryType.FAMILY]: Memory[];
        [MemoryType.OBSESSION]: Memory[];
        [MemoryType.JOY]: Memory[];
    };
    
    // 执念（最难忘的事）
    obsessionText: string;
    
    // 对话树
    dialogueTree: Map<string, DialogueNode>;
    currentDialogueNode: string;
    
    // 关联
    relatedSoulIds: string[];
    storyLineId?: string;    // 所属故事线
    
    // 来源
    isUGC: boolean;
    creatorId?: string;
    
    // 状态
    hasBeenServed: boolean;
    keptMemories: MemoryType[];
}

// 灵魂送别结果
export interface FarewellResult {
    soul: Soul;
    keptMemories: MemoryType[];
    forgottenMemories: MemoryType[];
    karmaGained: number;
    sinGained: number;
    fragmentsGained: MemoryFragment[];
    reincarnationHint: string;  // 转世暗示
}

// 记忆碎片（玩家收集的）
export interface MemoryFragment {
    id: string;
    soulId: string;
    soulName: string;
    type: MemoryType;
    content: string;
    experience: string;      // 沉浸体验文本
    relatedFragmentIds: string[];
    collectedAt: number;
}

// 灵魂模板（用于生成）
interface SoulTemplate {
    era: string;
    settings: string[];
    deathCauses: string[];
    namePool: string[];
    memoryTemplates: {
        [key in MemoryType]: string[];
    };
}

export class SoulManager {
    private static instance: SoulManager;
    
    // 当前酒馆中的灵魂
    private currentSoul: Soul | null = null;
    
    // 今日灵魂队列
    private todaySouls: Soul[] = [];
    private servedCount: number = 0;
    private readonly DAILY_SOUL_LIMIT = 3;
    
    // 灵魂模板库
    private templates: SoulTemplate[] = [];
    
    // 全局灵魂池（用于转世系统）
    private soulPool: Map<string, Soul> = new Map();
    
    // 故事线关联
    private storyLines: Map<string, string[]> = new Map();
    
    // 回调
    private onDialogueUpdate: ((node: DialogueNode) => void) | null = null;
    private onMemoryRevealed: ((memory: Memory) => void) | null = null;
    private onSoulFarewell: ((result: FarewellResult) => void) | null = null;
    
    private constructor() {
        this.initTemplates();
    }
    
    public static getInstance(): SoulManager {
        if (!SoulManager.instance) {
            SoulManager.instance = new SoulManager();
        }
        return SoulManager.instance;
    }
    
    /**
     * 初始化灵魂模板库
     */
    private initTemplates(): void {
        // 古代模板
        this.templates.push({
            era: '古代',
            settings: ['江南水乡', '塞北边关', '京城皇宫', '山野村落'],
            deathCauses: ['病逝', '战死', '意外', '自尽', '谋害', '老去'],
            namePool: ['小莲', '阿福', '翠儿', '大牛', '秀娘', '铁柱', '玉兰', '明远'],
            memoryTemplates: {
                [MemoryType.LOVE]: [
                    '月下的誓言，如今想来，竟已隔了一辈子',
                    '我记得他的眼睛，像星星一样亮',
                    '她说等我回来，可我再也没能回去'
                ],
                [MemoryType.PAIN]: [
                    '那场大火，烧掉了我的一切',
                    '他们说我是灾星，从小就没人愿意靠近我',
                    '眼睁睁看着，却什么都做不了'
                ],
                [MemoryType.FAMILY]: [
                    '爹娘在我五岁那年就不见了',
                    '我弟弟，是我用命换来的',
                    '母亲最后握着我的手，却叫着别人的名字'
                ],
                [MemoryType.OBSESSION]: [
                    '我想知道，害我的人是谁',
                    '我想再见他一面，哪怕只是远远看着',
                    '我想告诉她：不是你的错'
                ],
                [MemoryType.JOY]: [
                    '村口的桃花开的时候，最美',
                    '他给我折的纸鹤，我藏了一辈子',
                    '那年元宵，花灯满街，我们第一次牵手'
                ]
            }
        });
        
        // 近代模板
        this.templates.push({
            era: '近代',
            settings: ['上海滩', '北平胡同', '南洋商埠', '战火前线'],
            deathCauses: ['战乱', '疾病', '意外', '牺牲', '思念成疾'],
            namePool: ['淑芬', '建国', '美玲', '志强', '秋霞', '德明'],
            memoryTemplates: {
                [MemoryType.LOVE]: [
                    '他说等战争结束就回来娶我，可是战争赢了，他没有回来',
                    '那封信我看了一百遍，每个字都记得',
                    '我们在码头分别，我以为很快能再见'
                ],
                [MemoryType.PAIN]: [
                    '炮火声里，我失去了所有家人',
                    '我被迫做了很多不愿意的事',
                    '那个年代，活着就已经用尽全力'
                ],
                [MemoryType.FAMILY]: [
                    '弟弟妹妹是我一手带大的',
                    '父亲临终前说对不起我，我却不知道为什么',
                    '我把孩子托付给别人，自己去送死'
                ],
                [MemoryType.OBSESSION]: [
                    '我想知道孩子后来过得好不好',
                    '我想亲口说声对不起',
                    '我想看看和平的世界是什么样子'
                ],
                [MemoryType.JOY]: [
                    '那年冬天的糖葫芦，是我吃过最甜的东西',
                    '收音机里放着周璇的歌，她跟着轻轻哼',
                    '和平那天，满街都是笑声'
                ]
            }
        });
        
        // 现代模板
        this.templates.push({
            era: '现代',
            settings: ['大都市', '小县城', '海外他乡', '网络世界'],
            deathCauses: ['疾病', '意外', '过劳', '自尽', '事故'],
            namePool: ['小雨', '阿杰', '晓琳', '子轩', '思思', '浩然'],
            memoryTemplates: {
                [MemoryType.LOVE]: [
                    '我们在网上聊了三年，见面那天我躲在人群里不敢上前',
                    '她的朋友圈我看了无数遍，却从来没有勇气点赞',
                    '我把喜欢说成了开玩笑，后来再也没有机会认真说'
                ],
                [MemoryType.PAIN]: [
                    '每天加班到凌晨，却买不起一个家',
                    '网暴让我不敢出门，不敢看手机',
                    '确诊那天，我一个人在医院走廊坐了一夜'
                ],
                [MemoryType.FAMILY]: [
                    '我跟父母最后一次通话是在吵架',
                    '孩子叫的第一声不是爸爸，是平板',
                    '我飞了十几个小时回家，只见到了最后一面'
                ],
                [MemoryType.OBSESSION]: [
                    '我想告诉老板：我不干了',
                    '我想回到那天，好好说声再见',
                    '我想把真话说出来，哪怕只有一次'
                ],
                [MemoryType.JOY]: [
                    '深夜外卖小哥的一句加油，让我哭了很久',
                    '陌生人的一把伞，到现在都还记得',
                    '打工第一年，买了第一件不打折的衣服'
                ]
            }
        });
    }
    
    /**
     * 生成今日灵魂
     */
    public generateDailySouls(): void {
        this.todaySouls = [];
        this.servedCount = 0;
        
        // 生成3个基础灵魂
        for (let i = 0; i < this.DAILY_SOUL_LIMIT; i++) {
            const soul = this.generateSoul();
            this.todaySouls.push(soul);
            this.soulPool.set(soul.id, soul);
        }
        
        console.log(`[SoulManager] 今日生成 ${this.todaySouls.length} 个灵魂`);
    }
    
    /**
     * 生成单个灵魂
     */
    private generateSoul(): Soul {
        // 随机选择模板
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];
        
        // 生成基础信息
        const gender = Math.random() > 0.5 ? 'female' : 'male';
        const name = template.namePool[Math.floor(Math.random() * template.namePool.length)];
        const deathAge = 15 + Math.floor(Math.random() * 70);
        const deathCause = template.deathCauses[Math.floor(Math.random() * template.deathCauses.length)];
        
        // 生成记忆
        const memories = this.generateMemories(template);
        
        // 生成执念
        const obsessionMemory = memories[MemoryType.OBSESSION][0];
        
        // 生成对话树
        const dialogueTree = this.generateDialogueTree(name, template.era, memories);
        
        const soul: Soul = {
            id: `soul_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            era: template.era,
            gender,
            deathAge,
            deathCause,
            personality: this.generatePersonality(),
            memories,
            obsessionText: obsessionMemory?.description || '我已经忘了自己在执着什么...',
            dialogueTree,
            currentDialogueNode: 'start',
            relatedSoulIds: [],
            isUGC: false,
            hasBeenServed: false,
            keptMemories: []
        };
        
        return soul;
    }
    
    /**
     * 生成记忆
     */
    private generateMemories(template: SoulTemplate): Soul['memories'] {
        const memories: Soul['memories'] = {
            [MemoryType.LOVE]: [],
            [MemoryType.PAIN]: [],
            [MemoryType.FAMILY]: [],
            [MemoryType.OBSESSION]: [],
            [MemoryType.JOY]: []
        };
        
        // 为每种类型生成1-2条记忆
        for (const type of Object.values(MemoryType)) {
            const templates = template.memoryTemplates[type];
            const count = 1 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < count && i < templates.length; i++) {
                const text = templates[Math.floor(Math.random() * templates.length)];
                memories[type].push({
                    id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    intensity: 30 + Math.floor(Math.random() * 70),
                    description: text,
                    narrative: this.generateNarrative(text),
                    keywords: this.extractKeywords(text)
                });
            }
        }
        
        return memories;
    }
    
    /**
     * 生成第一人称叙述
     */
    private generateNarrative(description: string): string {
        return `我闭上眼睛，那段记忆浮现...\n\n${description}\n\n那时候的我，不知道这会成为永远的记忆。`;
    }
    
    /**
     * 提取关键词
     */
    private extractKeywords(text: string): string[] {
        const keywords: string[] = [];
        const patterns = ['爱', '恨', '父', '母', '战', '火', '别', '等', '死', '活'];
        for (const p of patterns) {
            if (text.includes(p)) keywords.push(p);
        }
        return keywords;
    }
    
    /**
     * 生成性格标签
     */
    private generatePersonality(): string[] {
        const traits = ['温柔', '倔强', '沉默', '活泼', '忧郁', '坚强', '胆小', '善良', '固执', '乐观'];
        const count = 2 + Math.floor(Math.random() * 2);
        const result: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const trait = traits[Math.floor(Math.random() * traits.length)];
            if (!result.includes(trait)) result.push(trait);
        }
        
        return result;
    }
    
    /**
     * 生成对话树
     */
    private generateDialogueTree(name: string, era: string, memories: Soul['memories']): Map<string, DialogueNode> {
        const tree = new Map<string, DialogueNode>();
        
        // 开场
        tree.set('start', {
            id: 'start',
            speaker: 'soul',
            text: `...这里是？`,
            emotion: 'confused',
            next: 'intro'
        });
        
        tree.set('intro', {
            id: 'intro',
            speaker: 'narrator',
            text: `一个灵魂缓缓走入酒馆，带着${era}的风尘。`,
            next: 'greeting'
        });
        
        tree.set('greeting', {
            id: 'greeting',
            speaker: 'soul',
            text: `我叫${name}。我...我好像死了？`,
            emotion: 'uncertain',
            choices: [
                {
                    id: 'c1',
                    text: '"是的，你已经离开人世了。"',
                    tone: 'gentle',
                    nextNode: 'accept_death'
                },
                {
                    id: 'c2',
                    text: '"你还记得发生了什么吗？"',
                    tone: 'direct',
                    nextNode: 'recall_death'
                },
                {
                    id: 'c3',
                    text: '沉默，递上一杯热茶。',
                    tone: 'silence',
                    nextNode: 'silent_comfort',
                    karmaChange: 2
                }
            ]
        });
        
        tree.set('accept_death', {
            id: 'accept_death',
            speaker: 'soul',
            text: '我知道...其实我早就有感觉了。',
            emotion: 'sad',
            next: 'ask_regret'
        });
        
        tree.set('recall_death', {
            id: 'recall_death',
            speaker: 'soul',
            text: '我记得...最后看到的是...',
            emotion: 'painful',
            unlocksMemory: memories[MemoryType.PAIN][0]?.id,
            next: 'ask_regret'
        });
        
        tree.set('silent_comfort', {
            id: 'silent_comfort',
            speaker: 'narrator',
            text: `${name}接过茶，手微微颤抖。热气升腾中，TA的眼眶红了。`,
            next: 'ask_regret'
        });
        
        tree.set('ask_regret', {
            id: 'ask_regret',
            speaker: 'player',
            text: '',
            choices: [
                {
                    id: 'c1',
                    text: '"有什么放不下的人吗？"',
                    tone: 'empathy',
                    nextNode: 'talk_love',
                    revealMemory: MemoryType.LOVE
                },
                {
                    id: 'c2',
                    text: '"这一生，最痛的是什么？"',
                    tone: 'direct',
                    nextNode: 'talk_pain',
                    revealMemory: MemoryType.PAIN
                },
                {
                    id: 'c3',
                    text: '"家人还好吗？"',
                    tone: 'gentle',
                    nextNode: 'talk_family',
                    revealMemory: MemoryType.FAMILY
                },
                {
                    id: 'c4',
                    text: '"直接喝酒吧，不必多说。"',
                    tone: 'skip',
                    nextNode: 'skip_to_drink',
                    sinChange: 5
                }
            ]
        });
        
        // 爱情记忆分支
        const loveMemory = memories[MemoryType.LOVE][0];
        tree.set('talk_love', {
            id: 'talk_love',
            speaker: 'soul',
            text: loveMemory?.description || '有一个人...算了，说了也没用了。',
            emotion: 'nostalgic',
            unlocksMemory: loveMemory?.id,
            next: 'love_detail'
        });
        
        tree.set('love_detail', {
            id: 'love_detail',
            speaker: 'soul',
            text: '如果能重来...不，没有如果了。',
            choices: [
                {
                    id: 'c1',
                    text: '"也许下辈子，你们还会相遇。"',
                    tone: 'gentle',
                    nextNode: 'to_obsession',
                    karmaChange: 3
                },
                {
                    id: 'c2',
                    text: '"你想记住TA吗？"',
                    tone: 'direct',
                    nextNode: 'to_obsession'
                }
            ]
        });
        
        // 痛苦记忆分支
        const painMemory = memories[MemoryType.PAIN][0];
        tree.set('talk_pain', {
            id: 'talk_pain',
            speaker: 'soul',
            text: painMemory?.description || '太多了...不想再提了。',
            emotion: 'painful',
            unlocksMemory: painMemory?.id,
            next: 'to_obsession'
        });
        
        // 亲情记忆分支
        const familyMemory = memories[MemoryType.FAMILY][0];
        tree.set('talk_family', {
            id: 'talk_family',
            speaker: 'soul',
            text: familyMemory?.description || '家人...很久没想起他们了。',
            emotion: 'mixed',
            unlocksMemory: familyMemory?.id,
            next: 'to_obsession'
        });
        
        // 执念
        const obsessionMemory = memories[MemoryType.OBSESSION][0];
        tree.set('to_obsession', {
            id: 'to_obsession',
            speaker: 'soul',
            text: `其实，我最放不下的是...\n\n${obsessionMemory?.description || '算了，都过去了。'}`,
            emotion: 'obsessed',
            unlocksMemory: obsessionMemory?.id,
            next: 'before_drink'
        });
        
        // 跳过对话
        tree.set('skip_to_drink', {
            id: 'skip_to_drink',
            speaker: 'narrator',
            text: `${name}沉默地点点头，眼中有一丝失落。\n也许，TA本想说些什么的。`,
            next: 'before_drink'
        });
        
        // 喝酒前
        tree.set('before_drink', {
            id: 'before_drink',
            speaker: 'narrator',
            text: '是时候调制忘川酒了。\n你要让TA忘记什么？',
            next: 'drink_choice'
        });
        
        tree.set('drink_choice', {
            id: 'drink_choice',
            speaker: 'player',
            text: '',
            triggersEvent: 'OPEN_DRINK_MENU'
        });
        
        return tree;
    }
    
    /**
     * 获取当前灵魂
     */
    public getCurrentSoul(): Soul | null {
        return this.currentSoul;
    }
    
    /**
     * 召唤下一个灵魂
     */
    public summonNextSoul(): Soul | null {
        if (this.servedCount >= this.DAILY_SOUL_LIMIT) {
            console.log('[SoulManager] 今日灵魂已全部招待完毕');
            return null;
        }
        
        if (this.todaySouls.length === 0) {
            this.generateDailySouls();
        }
        
        this.currentSoul = this.todaySouls[this.servedCount];
        console.log(`[SoulManager] 灵魂 ${this.currentSoul.name} 来到酒馆`);
        
        return this.currentSoul;
    }
    
    /**
     * 进行对话选择
     */
    public makeDialogueChoice(choiceId: string): DialogueNode | null {
        if (!this.currentSoul) return null;
        
        const currentNode = this.currentSoul.dialogueTree.get(this.currentSoul.currentDialogueNode);
        if (!currentNode || !currentNode.choices) return null;
        
        const choice = currentNode.choices.find(c => c.id === choiceId);
        if (!choice) return null;
        
        // 更新当前节点
        this.currentSoul.currentDialogueNode = choice.nextNode;
        
        // 获取下一个节点
        const nextNode = this.currentSoul.dialogueTree.get(choice.nextNode);
        
        // 处理记忆揭示
        if (choice.revealMemory && nextNode?.unlocksMemory) {
            const memory = this.findMemoryById(nextNode.unlocksMemory);
            if (memory && this.onMemoryRevealed) {
                this.onMemoryRevealed(memory);
            }
        }
        
        // 触发回调
        if (nextNode && this.onDialogueUpdate) {
            this.onDialogueUpdate(nextNode);
        }
        
        return nextNode || null;
    }
    
    /**
     * 继续对话（无选择时）
     */
    public continueDialogue(): DialogueNode | null {
        if (!this.currentSoul) return null;
        
        const currentNode = this.currentSoul.dialogueTree.get(this.currentSoul.currentDialogueNode);
        if (!currentNode || !currentNode.next) return null;
        
        this.currentSoul.currentDialogueNode = currentNode.next;
        const nextNode = this.currentSoul.dialogueTree.get(currentNode.next);
        
        if (nextNode && this.onDialogueUpdate) {
            this.onDialogueUpdate(nextNode);
        }
        
        return nextNode || null;
    }
    
    /**
     * 通过ID查找记忆
     */
    private findMemoryById(memoryId: string): Memory | null {
        if (!this.currentSoul) return null;
        
        for (const type of Object.values(MemoryType)) {
            const memory = this.currentSoul.memories[type].find(m => m.id === memoryId);
            if (memory) return memory;
        }
        
        return null;
    }
    
    /**
     * 送别灵魂（调酒完成后）
     */
    public farewellSoul(keptMemoryTypes: MemoryType[]): FarewellResult | null {
        if (!this.currentSoul) return null;
        
        const soul = this.currentSoul;
        soul.hasBeenServed = true;
        soul.keptMemories = keptMemoryTypes;
        
        // 计算功德和业障
        const forgottenCount = Object.values(MemoryType).length - keptMemoryTypes.length;
        let karmaGained = forgottenCount * 5;
        let sinGained = 0;
        
        // 保留痛苦记忆会增加业障
        if (keptMemoryTypes.includes(MemoryType.PAIN)) {
            sinGained += 10;
            karmaGained -= 5;
        }
        
        // 保留执念会增加业障
        if (keptMemoryTypes.includes(MemoryType.OBSESSION)) {
            sinGained += 8;
        }
        
        // 收集记忆碎片
        const fragmentsGained: MemoryFragment[] = [];
        for (const type of keptMemoryTypes) {
            const memories = soul.memories[type];
            for (const memory of memories) {
                fragmentsGained.push({
                    id: `fragment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    soulId: soul.id,
                    soulName: soul.name,
                    type: memory.type,
                    content: memory.description,
                    experience: memory.narrative,
                    relatedFragmentIds: [],
                    collectedAt: Date.now()
                });
            }
        }
        
        // 生成转世暗示
        const reincarnationHint = this.generateReincarnationHint(soul, keptMemoryTypes);
        
        const result: FarewellResult = {
            soul,
            keptMemories: keptMemoryTypes,
            forgottenMemories: Object.values(MemoryType).filter(t => !keptMemoryTypes.includes(t)),
            karmaGained,
            sinGained,
            fragmentsGained,
            reincarnationHint
        };
        
        // 更新状态
        this.servedCount++;
        this.currentSoul = null;
        
        // 触发回调
        if (this.onSoulFarewell) {
            this.onSoulFarewell(result);
        }
        
        console.log(`[SoulManager] ${soul.name} 已送别，功德+${karmaGained}，业障+${sinGained}`);
        
        return result;
    }
    
    /**
     * 生成转世暗示
     */
    private generateReincarnationHint(soul: Soul, keptMemories: MemoryType[]): string {
        if (keptMemories.length === 0) {
            return `${soul.name}带着微笑，喝下了忘川酒。\nTA将干干净净地投胎，开始全新的一生。`;
        }
        
        const hints: string[] = [];
        
        if (keptMemories.includes(MemoryType.LOVE)) {
            hints.push('下辈子，TA可能会莫名被某个人吸引...');
        }
        if (keptMemories.includes(MemoryType.PAIN)) {
            hints.push('下辈子，TA可能会有某种说不清的恐惧...');
        }
        if (keptMemories.includes(MemoryType.OBSESSION)) {
            hints.push('下辈子，TA可能会有一个执念，却不知道为什么...');
        }
        if (keptMemories.includes(MemoryType.FAMILY)) {
            hints.push('下辈子，TA可能会格外在意家庭...');
        }
        if (keptMemories.includes(MemoryType.JOY)) {
            hints.push('下辈子，TA可能会在某个瞬间感到似曾相识的幸福...');
        }
        
        return `${soul.name}喝下了调制的忘川酒。\n${hints.join('\n')}`;
    }
    
    /**
     * 获取今日剩余灵魂数
     */
    public getRemainingCount(): number {
        return this.DAILY_SOUL_LIMIT - this.servedCount;
    }
    
    // ========== 回调设置 ==========
    
    public setOnDialogueUpdate(callback: (node: DialogueNode) => void): void {
        this.onDialogueUpdate = callback;
    }
    
    public setOnMemoryRevealed(callback: (memory: Memory) => void): void {
        this.onMemoryRevealed = callback;
    }
    
    public setOnSoulFarewell(callback: (result: FarewellResult) => void): void {
        this.onSoulFarewell = callback;
    }
}
