/**
 * 调酒系统 - 处理忘川酒的调制
 * 玩家选择让灵魂遗忘哪些记忆
 */

import { Soul, MemoryType, Memory } from './SoulManager';

// 酒的类型
export enum DrinkType {
    COMPLETE_FORGET = 'complete_forget',   // 完全遗忘
    KEEP_LOVE = 'keep_love',               // 保留爱情
    KEEP_PAIN = 'keep_pain',               // 保留痛苦（不推荐）
    KEEP_FAMILY = 'keep_family',           // 保留亲情
    KEEP_OBSESSION = 'keep_obsession',     // 保留执念
    KEEP_JOY = 'keep_joy',                 // 保留美好
    CUSTOM = 'custom'                       // 自定义
}

// 预设配方
export interface DrinkRecipe {
    id: string;
    name: string;
    description: string;
    type: DrinkType;
    keptMemories: MemoryType[];
    karmaModifier: number;
    sinModifier: number;
    visualEffect: string;
    soundEffect: string;
}

// 调酒选择界面数据
export interface DrinkMenuData {
    soul: Soul;
    memoryPreview: {
        type: MemoryType;
        label: string;
        intensity: number;
        preview: string;
        icon: string;
    }[];
    presetRecipes: DrinkRecipe[];
}

// 调酒结果
export interface DrinkResult {
    recipe: DrinkRecipe;
    keptMemories: MemoryType[];
    forgottenMemories: MemoryType[];
    animation: string;
    dialogue: string;
}

export class DrinkSystem {
    private static instance: DrinkSystem;
    
    // 预设配方
    private presetRecipes: DrinkRecipe[] = [];
    
    // 当前灵魂的记忆状态
    private currentSoul: Soul | null = null;
    
    private constructor() {
        this.initRecipes();
    }
    
    public static getInstance(): DrinkSystem {
        if (!DrinkSystem.instance) {
            DrinkSystem.instance = new DrinkSystem();
        }
        return DrinkSystem.instance;
    }
    
    /**
     * 初始化预设配方
     */
    private initRecipes(): void {
        this.presetRecipes = [
            {
                id: 'complete_forget',
                name: '忘川清酒',
                description: '让灵魂完全遗忘前世，干干净净地投胎。',
                type: DrinkType.COMPLETE_FORGET,
                keptMemories: [],
                karmaModifier: 15,
                sinModifier: 0,
                visualEffect: 'gentle_fade',
                soundEffect: 'peaceful'
            },
            {
                id: 'love_remain',
                name: '相思醉',
                description: '保留爱情的印记，下辈子或许会莫名心动。',
                type: DrinkType.KEEP_LOVE,
                keptMemories: [MemoryType.LOVE],
                karmaModifier: 8,
                sinModifier: 2,
                visualEffect: 'pink_glow',
                soundEffect: 'nostalgic'
            },
            {
                id: 'pain_remain',
                name: '苦海酿',
                description: '保留痛苦的记忆...这真的好吗？',
                type: DrinkType.KEEP_PAIN,
                keptMemories: [MemoryType.PAIN],
                karmaModifier: -5,
                sinModifier: 15,
                visualEffect: 'dark_mist',
                soundEffect: 'ominous'
            },
            {
                id: 'family_remain',
                name: '血脉泉',
                description: '保留亲情的牵绊，下辈子会特别重视家人。',
                type: DrinkType.KEEP_FAMILY,
                keptMemories: [MemoryType.FAMILY],
                karmaModifier: 10,
                sinModifier: 0,
                visualEffect: 'warm_glow',
                soundEffect: 'gentle'
            },
            {
                id: 'obsession_remain',
                name: '执念露',
                description: '保留未完的心愿，下辈子会有莫名的执着。',
                type: DrinkType.KEEP_OBSESSION,
                keptMemories: [MemoryType.OBSESSION],
                karmaModifier: 0,
                sinModifier: 10,
                visualEffect: 'purple_flame',
                soundEffect: 'intense'
            },
            {
                id: 'joy_remain',
                name: '欢喜酿',
                description: '保留美好的瞬间，下辈子会有似曾相识的幸福感。',
                type: DrinkType.KEEP_JOY,
                keptMemories: [MemoryType.JOY],
                karmaModifier: 12,
                sinModifier: 0,
                visualEffect: 'golden_sparkle',
                soundEffect: 'cheerful'
            }
        ];
    }
    
    /**
     * 获取调酒菜单数据
     */
    public getMenuData(soul: Soul): DrinkMenuData {
        this.currentSoul = soul;
        
        // 构建记忆预览
        const memoryPreview = this.buildMemoryPreview(soul);
        
        // 过滤可用配方（根据灵魂的记忆情况）
        const availableRecipes = this.filterAvailableRecipes(soul);
        
        return {
            soul,
            memoryPreview,
            presetRecipes: availableRecipes
        };
    }
    
    /**
     * 构建记忆预览
     */
    private buildMemoryPreview(soul: Soul): DrinkMenuData['memoryPreview'] {
        const preview: DrinkMenuData['memoryPreview'] = [];
        
        const typeConfig: { [key in MemoryType]: { label: string; icon: string } } = {
            [MemoryType.LOVE]: { label: '爱情记忆', icon: '💕' },
            [MemoryType.PAIN]: { label: '痛苦记忆', icon: '💔' },
            [MemoryType.FAMILY]: { label: '亲情记忆', icon: '👨‍👩‍👧' },
            [MemoryType.OBSESSION]: { label: '执念记忆', icon: '🎯' },
            [MemoryType.JOY]: { label: '美好记忆', icon: '✨' }
        };
        
        for (const type of Object.values(MemoryType)) {
            const memories = soul.memories[type];
            if (memories.length === 0) continue;
            
            // 计算平均强度
            const avgIntensity = memories.reduce((sum, m) => sum + m.intensity, 0) / memories.length;
            
            // 获取预览文本
            const previewText = memories[0].description.slice(0, 30) + '...';
            
            preview.push({
                type,
                label: typeConfig[type].label,
                intensity: avgIntensity,
                preview: previewText,
                icon: typeConfig[type].icon
            });
        }
        
        return preview;
    }
    
    /**
     * 过滤可用配方
     */
    private filterAvailableRecipes(soul: Soul): DrinkRecipe[] {
        return this.presetRecipes.filter(recipe => {
            // 检查配方需要的记忆类型是否存在
            for (const memType of recipe.keptMemories) {
                if (soul.memories[memType].length === 0) {
                    return false;
                }
            }
            return true;
        });
    }
    
    /**
     * 选择预设配方
     */
    public selectPresetRecipe(recipeId: string): DrinkResult | null {
        const recipe = this.presetRecipes.find(r => r.id === recipeId);
        if (!recipe || !this.currentSoul) return null;
        
        return this.prepareDrink(recipe);
    }
    
    /**
     * 自定义配方
     */
    public createCustomRecipe(keptMemories: MemoryType[]): DrinkResult | null {
        if (!this.currentSoul) return null;
        
        // 计算功德和业障
        let karmaModifier = 15 - keptMemories.length * 3;
        let sinModifier = 0;
        
        // 保留痛苦增加业障
        if (keptMemories.includes(MemoryType.PAIN)) {
            sinModifier += 15;
            karmaModifier -= 10;
        }
        
        // 保留执念增加业障
        if (keptMemories.includes(MemoryType.OBSESSION)) {
            sinModifier += 10;
        }
        
        const recipe: DrinkRecipe = {
            id: 'custom',
            name: '自调忘川酒',
            description: '根据你的选择调制的特殊配方',
            type: DrinkType.CUSTOM,
            keptMemories,
            karmaModifier,
            sinModifier,
            visualEffect: this.determineVisualEffect(keptMemories),
            soundEffect: this.determineSoundEffect(keptMemories)
        };
        
        return this.prepareDrink(recipe);
    }
    
    /**
     * 准备饮品
     */
    private prepareDrink(recipe: DrinkRecipe): DrinkResult {
        if (!this.currentSoul) throw new Error('No soul selected');
        
        const allTypes = Object.values(MemoryType);
        const forgottenMemories = allTypes.filter(t => !recipe.keptMemories.includes(t));
        
        // 生成对话
        const dialogue = this.generateFarewellDialogue(this.currentSoul, recipe);
        
        return {
            recipe,
            keptMemories: recipe.keptMemories,
            forgottenMemories,
            animation: recipe.visualEffect,
            dialogue
        };
    }
    
    /**
     * 生成送别对话
     */
    private generateFarewellDialogue(soul: Soul, recipe: DrinkRecipe): string {
        const lines: string[] = [];
        
        // 根据配方生成不同的对话
        if (recipe.keptMemories.length === 0) {
            lines.push(`${soul.name}接过那杯清澈的忘川酒。`);
            lines.push('"谢谢你...愿意听我说这些。"');
            lines.push('TA一饮而尽，眼中的迷茫渐渐变成平静。');
            lines.push('"再见了，我不会记得你...但这种感觉，好温暖。"');
            lines.push(`${soul.name}化作一道光，消失在忘川河畔。`);
        } else {
            lines.push(`${soul.name}看着那杯泛着微光的酒。`);
            lines.push('"这酒...和别人的不太一样？"');
            
            if (recipe.keptMemories.includes(MemoryType.LOVE)) {
                lines.push('TA轻轻地笑了："也许...下辈子能再遇见吧。"');
            }
            if (recipe.keptMemories.includes(MemoryType.PAIN)) {
                lines.push('TA皱了皱眉："这苦涩的味道...我好像...会记得的。"');
            }
            if (recipe.keptMemories.includes(MemoryType.OBSESSION)) {
                lines.push('TA的眼神变得坚定："有些事，我不想忘。"');
            }
            
            lines.push('TA慢慢喝下，身形开始透明。');
            lines.push('"老板...下辈子，如果你还在这里..."');
            lines.push('"我会...再来喝一杯的..."');
            lines.push(`${soul.name}带着一丝笑意，消散在夜色中。`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * 确定视觉效果
     */
    private determineVisualEffect(keptMemories: MemoryType[]): string {
        if (keptMemories.length === 0) return 'gentle_fade';
        if (keptMemories.includes(MemoryType.PAIN)) return 'dark_mist';
        if (keptMemories.includes(MemoryType.LOVE)) return 'pink_glow';
        if (keptMemories.includes(MemoryType.OBSESSION)) return 'purple_flame';
        return 'mixed_glow';
    }
    
    /**
     * 确定音效
     */
    private determineSoundEffect(keptMemories: MemoryType[]): string {
        if (keptMemories.length === 0) return 'peaceful';
        if (keptMemories.includes(MemoryType.PAIN)) return 'ominous';
        if (keptMemories.includes(MemoryType.OBSESSION)) return 'intense';
        return 'nostalgic';
    }
    
    /**
     * 获取记忆类型的提示信息
     */
    public getMemoryTypeHint(type: MemoryType): { warning: string; consequence: string } {
        const hints: { [key in MemoryType]: { warning: string; consequence: string } } = {
            [MemoryType.LOVE]: {
                warning: '保留爱情记忆是比较温和的选择',
                consequence: '下辈子可能会对某人有莫名的心动'
            },
            [MemoryType.PAIN]: {
                warning: '⚠️ 保留痛苦记忆会增加大量业障',
                consequence: '下辈子可能会有某种恐惧症或心理阴影'
            },
            [MemoryType.FAMILY]: {
                warning: '保留亲情记忆是善意的选择',
                consequence: '下辈子会特别重视家庭关系'
            },
            [MemoryType.OBSESSION]: {
                warning: '⚠️ 保留执念会增加业障',
                consequence: '下辈子会有无法解释的执着'
            },
            [MemoryType.JOY]: {
                warning: '保留美好记忆是最温暖的选择',
                consequence: '下辈子偶尔会有似曾相识的幸福感'
            }
        };
        
        return hints[type];
    }
    
    /**
     * 计算预览结果
     */
    public previewResult(keptMemories: MemoryType[]): {
        karma: number;
        sin: number;
        fragmentCount: number;
        warnings: string[];
    } {
        let karma = 15 - keptMemories.length * 3;
        let sin = 0;
        const warnings: string[] = [];
        
        if (keptMemories.includes(MemoryType.PAIN)) {
            sin += 15;
            karma -= 10;
            warnings.push('保留痛苦记忆会让灵魂带着阴影转世');
        }
        
        if (keptMemories.includes(MemoryType.OBSESSION)) {
            sin += 10;
            warnings.push('保留执念可能会影响灵魂的来世');
        }
        
        if (keptMemories.length === 0) {
            warnings.push('完全遗忘是最慈悲的选择');
        }
        
        return {
            karma: Math.max(0, karma),
            sin,
            fragmentCount: keptMemories.length,
            warnings
        };
    }
}
