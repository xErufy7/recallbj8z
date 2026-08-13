
import { GameState, SubjectKey, OIStats, SerializableEffect, GameEvent, TalentPassiveEffects } from '../types';

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

export const getEffectiveEfficiency = (state: GameState): number => {
    let eff = state.general.efficiency;
    
    // Debt King Challenge: +1 Efficiency per 15 Debt
    if (state.activeChallengeId === 'c_debt_king' && state.general.money < 0) {
        const debt = Math.abs(state.general.money);
        eff += Math.floor(debt / 15);
    }
    
    return eff;
};

// --- Helper for AI Event Effects ---
export const applyAiEffect = (s: GameState, effect: SerializableEffect): Partial<GameState> => {
    const updates: Partial<GameState> = {
        general: { ...s.general },
        subjects: { ...s.subjects },
        oiStats: { ...s.oiStats }
    };

    if (effect.mindset) updates.general!.mindset = Math.min(150, Math.max(0, s.general.mindset + effect.mindset));
    if (effect.health) updates.general!.health = Math.min(150, Math.max(0, s.general.health + effect.health));
    if (effect.money) updates.general!.money = s.general.money + effect.money; // Money can be negative
    if (effect.efficiency) updates.general!.efficiency = Math.min(30, Math.max(1, s.general.efficiency + effect.efficiency));
    if (effect.romance) updates.general!.romance = Math.min(150, Math.max(0, s.general.romance + effect.romance));
    if (effect.experience) updates.general!.experience = Math.min(150, Math.max(0, s.general.experience + effect.experience));
    if (effect.luck) updates.general!.luck = Math.min(150, Math.max(0, s.general.luck + effect.luck));

    // AI Romance Logic
    if (effect.romancePartner) {
        updates.romancePartner = effect.romancePartner;
    }

    if (effect.subjects) {
        Object.entries(effect.subjects).forEach(([key, val]) => {
            const subKey = key as SubjectKey;
            if (updates.subjects![subKey]) {
                const numVal = Number(val);
                if (!isNaN(numVal)) {
                    updates.subjects![subKey] = { 
                        ...updates.subjects![subKey], 
                        level: Math.max(0, updates.subjects![subKey].level + numVal) 
                    };
                }
            }
        });
    }

    if (effect.oiStats) {
        Object.entries(effect.oiStats).forEach(([key, val]) => {
            const oiKey = key as keyof OIStats;
            if (oiKey !== 'history') {
                const numVal = Number(val);
                if (!isNaN(numVal)) {
                    (updates.oiStats as any)[oiKey] = Math.max(0, ((updates.oiStats as any)[oiKey] || 0) + numVal);
                }
            }
        });
    }

    return updates;
};

export const mapAiEventToGameEvent = (aiEvent: any): GameEvent => {
    return {
        id: `ai_${Date.now()}_${Math.random()}`,
        title: aiEvent.title,
        description: aiEvent.description,
        type: aiEvent.type || 'neutral',
        triggerType: aiEvent.triggerType || 'RANDOM',
        choices: (aiEvent.choices || []).map((c: any) => ({
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

export const applyEfficiencyCap = (state: GameState, value: number): number => {
    const passives = getActiveTalentPassives(state);
    if (passives.efficiencyCap !== undefined) return Math.min(value, passives.efficiencyCap);
    return Math.max(1, value);
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
