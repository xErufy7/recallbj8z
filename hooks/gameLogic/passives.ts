
import { GameState, GeneralStats } from '../../types';
import { applyEfficiencyPassive, applyMoneyPassive, applyRomancePassive, applyHealthRecoveryPassive, applyExperiencePassive, applyStatCaps } from '../../data/utils';

/** 给 action 产生的属性变化套用天赋被动加成（handleChoice / handleWeekendActivityClick 共用） */
export const applyTalentPassivesToUpdates = (state: GameState, updates: Partial<GameState>): Partial<GameState> => {
    let result = updates;

    const oldEff = state.general.efficiency;
    const newEff = updates.general?.efficiency;
    if (newEff !== undefined && newEff !== oldEff) {
        const adjusted = applyEfficiencyPassive(state, newEff - oldEff);
        result = { ...result, general: { ...result.general, efficiency: Math.max(1, oldEff + adjusted) } as GeneralStats };
    }

    const oldMoney = state.general.money;
    const newMoney = updates.general?.money;
    const isDebtRepayment = oldMoney < 0 && newMoney === 0;
    if (newMoney !== undefined && newMoney > oldMoney && !isDebtRepayment) {
        const adjusted = applyMoneyPassive(state, newMoney - oldMoney);
        result = { ...result, general: { ...result.general, money: oldMoney + adjusted } as GeneralStats };
    }

    const oldRomance = state.general.romance;
    const newRomance = updates.general?.romance;
    if (newRomance !== undefined && newRomance !== oldRomance) {
        const adjusted = applyRomancePassive(state, newRomance - oldRomance);
        result = { ...result, general: { ...result.general, romance: oldRomance + adjusted } as GeneralStats };
    }

    const oldHealth = state.general.health;
    const newHealth = updates.general?.health;
    if (newHealth !== undefined && newHealth > oldHealth) {
        const adjusted = applyHealthRecoveryPassive(state, newHealth - oldHealth);
        result = { ...result, general: { ...result.general, health: oldHealth + adjusted } as GeneralStats };
    }

    const oldExp = state.general.experience;
    const newExp = updates.general?.experience;
    if (newExp !== undefined && newExp > oldExp) {
        const adjusted = applyExperiencePassive(state, newExp - oldExp);
        result = { ...result, general: { ...result.general, experience: oldExp + adjusted } as GeneralStats };
    }

    applyStatCaps(state, result);
    return result;
};
