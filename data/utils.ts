
import { GameState, SubjectKey, OIStats, SerializableEffect, GameEvent, TalentPassiveEffects, AiGeneratedEvent, AiGeneratedEventChoice } from '../types';

export const modifySub = (s: GameState, keys: SubjectKey[], val: number) => {
  const newSubs = { ...s.subjects };
  keys.forEach(k => {
    let actualVal = val;
    // Diminishing returns to prevent infinite scaling
    if (newSubs[k].level >= 40) actualVal *= 0.25;
    else if (newSubs[k].level >= 20) actualVal *= 0.5;
    newSubs[k] = { ...newSubs[k], level: Math.max(0, newSubs[k].level + actualVal) };
  });
  return newSubs;
};

export const modifyOI = (s: GameState, changes: Partial<OIStats>) => {
    const newOI = { ...s.oiStats };
    (Object.keys(changes) as (keyof OIStats)[]).forEach(k => {
        if (k !== 'history') {
             (newOI as any)[k] = Math.max(0, ((newOI as any)[k] || 0) + ((changes as any)[k] || 0));
        }
    });
    return newOI;
};

export const getEffectiveEfficiency = (state: GameState): number => state.general.efficiency;

// --- Helper for AI Event Effects ---

/** AI 模型偶尔产出非标准 effect 键（含拼写错误），统一归一到标准属性再结算，避免选择静默无效 */
const AI_EFFECT_KEY_ALIASES: Record<string, keyof SerializableEffect> = {
    study: 'efficiency',    // 学习 → 学习效率
    enjoyment: 'mindset',   // 快乐 → 心态
    hunger: 'health',       // 饱食 → 健康
    social: 'romance',      // 社交 → 魅力
    wealth: 'money',        // 财富 → 金钱
    knowledge: 'experience',// 知识 → 经验
    knowlege: 'experience'  // 常见拼写错误
};

const normalizeAiEffectKeys = (effect: SerializableEffect): SerializableEffect => {
    const normalized: SerializableEffect = { ...effect };
    for (const [key, val] of Object.entries(effect)) {
        const target = AI_EFFECT_KEY_ALIASES[key];
        // 标准键已存在时保留原值，别名只做补位
        if (target && val !== undefined && normalized[target] === undefined) {
            (normalized as any)[target] = val;
            delete (normalized as any)[key];
        }
    }
    return normalized;
};

/** 属性增量 effect 的统一结算入口（AI 事件 / OI 事件 / 城市历史事件三条管线共用） */
export interface StatDeltaEffect {
    mindset?: number;
    health?: number;
    money?: number;
    efficiency?: number;
    romance?: number;
    experience?: number;
    luck?: number;
    subjects?: Partial<Record<SubjectKey, number>>;
    oiStats?: Partial<OIStats>;
    /** oi_events.json 风格的 OI 别名键 */
    oi_dp?: number;
    oi_ds?: number;
    oi_graph?: number;
    oi_string?: number;
    oi_math?: number;
    oi_misc?: number;
}

export interface StatDeltaOptions {
    /** 普通属性上限（默认 150） */
    cap?: number;
    /** 经验上限（默认与 cap 相同） */
    experienceCap?: number;
    /** 效率上限（默认 30） */
    efficiencyCap?: number;
    /** 效率下限（默认 1；OI/城市管线为 0） */
    efficiencyMin?: number;
}

/** OI/城市历史事件管线：沿用旧行为（上限 100、经验 999、效率 0-100） */
export const OI_CITY_STAT_OPTS: StatDeltaOptions = { cap: 100, experienceCap: 999, efficiencyCap: 100, efficiencyMin: 0 };

export const applyStatDeltas = (s: GameState, effect: StatDeltaEffect, opts: StatDeltaOptions = {}): Partial<GameState> => {
    const cap = opts.cap ?? 150;
    const expCap = opts.experienceCap ?? cap;
    const effCap = opts.efficiencyCap ?? 30;
    const effMin = opts.efficiencyMin ?? 1;

    const updates: Partial<GameState> = { general: { ...s.general } };
    const g = updates.general!;

    if (effect.mindset) g.mindset = Math.min(cap, Math.max(0, g.mindset + effect.mindset));
    if (effect.health) g.health = Math.min(cap, Math.max(0, g.health + effect.health));
    if (effect.money) g.money = g.money + effect.money; // 允许为负（欠债系统）
    if (effect.efficiency) g.efficiency = Math.min(effCap, Math.max(effMin, g.efficiency + effect.efficiency));
    if (effect.romance) g.romance = Math.min(cap, Math.max(0, g.romance + effect.romance));
    if (effect.experience) g.experience = Math.min(expCap, Math.max(0, g.experience + effect.experience));
    if (effect.luck) g.luck = Math.min(cap, Math.max(0, g.luck + effect.luck));

    if (effect.subjects) {
        updates.subjects = { ...s.subjects };
        Object.entries(effect.subjects).forEach(([key, val]) => {
            const subKey = key as SubjectKey;
            if (updates.subjects![subKey]) {
                const numVal = Number(val);
                if (!isNaN(numVal)) {
                    updates.subjects![subKey] = { ...updates.subjects![subKey], level: Math.max(0, updates.subjects![subKey].level + numVal) };
                }
            }
        });
    }

    const oiDeltas: Partial<OIStats> = { ...(effect.oiStats || {}) };
    if (effect.oi_dp) oiDeltas.dp = effect.oi_dp;
    if (effect.oi_ds) oiDeltas.ds = effect.oi_ds;
    if (effect.oi_graph) oiDeltas.graph = effect.oi_graph;
    if (effect.oi_string) oiDeltas.string = effect.oi_string;
    if (effect.oi_math) oiDeltas.math = effect.oi_math;
    if (effect.oi_misc) oiDeltas.misc = effect.oi_misc;
    if (Object.keys(oiDeltas).length > 0) {
        updates.oiStats = modifyOI(s, oiDeltas);
    }

    return updates;
};

export const applyAiEffect = (s: GameState, effect: SerializableEffect): Partial<GameState> => {
    effect = normalizeAiEffectKeys(effect);
    const updates = applyStatDeltas(s, effect);

    // AI Romance Logic
    if (effect.romancePartner) {
        updates.romancePartner = effect.romancePartner;
    }

    return updates;
};

export const mapAiEventToGameEvent = (aiEvent: AiGeneratedEvent): GameEvent => {
    return {
        id: `ai_${Date.now()}_${Math.random()}`,
        title: aiEvent.title,
        description: aiEvent.description,
        type: aiEvent.type || 'neutral',
        triggerType: 'RANDOM',
        choices: (aiEvent.choices || []).map((c: AiGeneratedEventChoice) => ({
            text: c.text,
            resultDescription: c.resultDescription,
            retry: !!c.retry,
            action: (s: GameState) => {
                const stateUpdates = applyAiEffect(s, c.effect || {});
                return {
                    ...stateUpdates,
                    log: [...s.log, {
                        message: c.resultDescription || `AI 事件: 你选择了 "${c.text}"`,
                        type: aiEvent.type === 'negative' ? 'warning' : 'success',
                        timestamp: Date.now()
                    }]
                };
            }
        }))
    };
};

// --- Talent Passive Aggregation ---
export const getActiveTalentPassives = (state: GameState): TalentPassiveEffects => {
    const result: TalentPassiveEffects = {};
    for (const talent of state.talents) {
        const p = talent.passive;
        if (!p) continue;
        if (p.shopDiscount !== undefined) result.shopDiscount = (result.shopDiscount ?? 1) * p.shopDiscount;
        if (p.moneyGainMultiplier !== undefined) result.moneyGainMultiplier = (result.moneyGainMultiplier ?? 1) * p.moneyGainMultiplier;
        if (p.efficiencyChangeMod) result.efficiencyChangeMod = p.efficiencyChangeMod;
        if (p.healthCap !== undefined) result.healthCap = Math.min(result.healthCap ?? 999, p.healthCap);
        if (p.luckCap !== undefined) result.luckCap = Math.min(result.luckCap ?? 999, p.luckCap);
        if (p.noWeeklyMoney) result.noWeeklyMoney = true;
        if (p.romanceGainMultiplier !== undefined) result.romanceGainMultiplier = (result.romanceGainMultiplier ?? 1) * p.romanceGainMultiplier;
        if (p.healthRecoveryMultiplier !== undefined) result.healthRecoveryMultiplier = (result.healthRecoveryMultiplier ?? 1) * p.healthRecoveryMultiplier;
        if (p.examScoreMultiplier !== undefined) result.examScoreMultiplier = (result.examScoreMultiplier ?? 1) * p.examScoreMultiplier;
        if (p.romanceEventChanceMultiplier !== undefined) result.romanceEventChanceMultiplier = p.romanceEventChanceMultiplier;
        if (p.noDebtEvents) result.noDebtEvents = true;
        if (p.mindsetFloor !== undefined) result.mindsetFloor = Math.max(result.mindsetFloor ?? -999, p.mindsetFloor);
        if (p.luckFloor !== undefined) result.luckFloor = Math.max(result.luckFloor ?? -999, p.luckFloor);
        if (p.efficiencyCap !== undefined) result.efficiencyCap = Math.min(result.efficiencyCap ?? 999, p.efficiencyCap);
        if (p.shopPriceMultiplier !== undefined) result.shopPriceMultiplier = (result.shopPriceMultiplier ?? 1) * p.shopPriceMultiplier;
        if (p.experienceGainMultiplier !== undefined) result.experienceGainMultiplier = (result.experienceGainMultiplier ?? 1) * p.experienceGainMultiplier;
    }
    return result;
};

export const applyEfficiencyPassive = (state: GameState, delta: number): number => {
    const passives = getActiveTalentPassives(state);
    let adjusted = delta;
    if (passives.efficiencyChangeMod) {
        const { positiveMultiplier, negativeMultiplier } = passives.efficiencyChangeMod;
        if (delta > 0) adjusted = delta * positiveMultiplier;
        if (delta < 0) adjusted = delta * negativeMultiplier;
    }
    return adjusted;
};

export const applyMoneyPassive = (state: GameState, delta: number): number => {
    const passives = getActiveTalentPassives(state);
    if (delta > 0 && passives.moneyGainMultiplier) return delta * passives.moneyGainMultiplier;
    return delta;
};

export const applyRomancePassive = (state: GameState, delta: number): number => {
    const passives = getActiveTalentPassives(state);
    if (delta > 0 && passives.romanceGainMultiplier !== undefined) return delta * passives.romanceGainMultiplier;
    return delta;
};

export const applyHealthRecoveryPassive = (state: GameState, delta: number): number => {
    const passives = getActiveTalentPassives(state);
    if (delta > 0 && passives.healthRecoveryMultiplier !== undefined) return delta * passives.healthRecoveryMultiplier;
    return delta;
};

export const applyExperiencePassive = (state: GameState, delta: number): number => {
    const passives = getActiveTalentPassives(state);
    if (delta > 0 && passives.experienceGainMultiplier !== undefined) return delta * passives.experienceGainMultiplier;
    return delta;
};

export const applyStatCaps = (state: GameState, updates: { general?: Partial<GameState['general']> }): void => {
    const passives = getActiveTalentPassives(state);
    if (!updates.general) return;
    const g = updates.general;
    if (passives.healthCap !== undefined && g.health !== undefined) g.health = Math.min(g.health, passives.healthCap);
    if (passives.luckCap !== undefined && g.luck !== undefined) g.luck = Math.min(g.luck, passives.luckCap);
    if (passives.luckFloor !== undefined && g.luck !== undefined) g.luck = Math.max(g.luck, passives.luckFloor);
    if (passives.mindsetFloor !== undefined && g.mindset !== undefined) g.mindset = Math.max(g.mindset, passives.mindsetFloor);
    if (passives.efficiencyCap !== undefined && g.efficiency !== undefined) g.efficiency = Math.min(g.efficiency, passives.efficiencyCap);
};

export const getShopPriceMultiplier = (state: GameState): number => {
    const passives = getActiveTalentPassives(state);
    const discount = passives.shopDiscount ?? 1;
    const premium = passives.shopPriceMultiplier ?? 1;
    return discount * premium;
};

export const hasNoWeeklyMoney = (state: GameState): boolean => {
    return getActiveTalentPassives(state).noWeeklyMoney === true;
};

export const hasNoDebtEvents = (state: GameState): boolean => {
    return getActiveTalentPassives(state).noDebtEvents === true;
};

export const getRomanceEventMultiplier = (state: GameState): number => {
    return getActiveTalentPassives(state).romanceEventChanceMultiplier ?? 1;
};

export const getExamScoreMultiplier = (state: GameState): number => {
    return getActiveTalentPassives(state).examScoreMultiplier ?? 1;
};
