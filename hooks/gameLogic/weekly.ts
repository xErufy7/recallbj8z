
import { GameState, Phase, GameStatus } from '../../types';
import { STATUSES, DEBT_LEVEL_PENALTIES } from '../../data/mechanics';
import { getActiveTalentPassives, hasNoWeeklyMoney, applyStatCaps } from '../../data/utils';

/** 每周推进时的属性结算：金钱、状态衰减、欠债惩罚、健康消耗、回归均值、科目遗忘 */
export const calculateWeeklyUpdates = (prevState: GameState) => {
    const passives = getActiveTalentPassives(prevState);
    const moneyChange = hasNoWeeklyMoney(prevState) ? 0 : 1 * (passives.moneyGainMultiplier ?? 1);

    const currentMoney = prevState.general.money;
    let debtLevel = 0;
    if (currentMoney < -800) debtLevel = 5;
    else if (currentMoney < -350) debtLevel = 4;
    else if (currentMoney < -180) debtLevel = 3;
    else if (currentMoney < -80) debtLevel = 2;
    else if (currentMoney < 0) debtLevel = 1;

    let statusMindset = 0, statusEfficiency = 0, statusRomance = 0, statusLuck = 0, statusExperience = 0;
    let newStatuses: GameStatus[] = [];

    // 状态数值效果由 STATUSES.weeklyEffects 数据驱动，新增状态无需改这里
    for (const st of prevState.activeStatuses) {
        if (st.id.startsWith('debt_')) continue;
        const newDuration = st.duration - 1;
        if (newDuration <= 0) continue;
        newStatuses.push({ ...st, duration: newDuration });
        const fx = st.weeklyEffects;
        if (!fx) continue;
        statusMindset += fx.mindset || 0;
        statusEfficiency += fx.efficiency || 0;
        statusRomance += fx.romance || 0;
        statusLuck += fx.luck || 0;
        statusExperience += fx.experience || 0;
    }

    let penaltyMindset = 0, penaltyRomance = 0;
    if (debtLevel > 0) {
        newStatuses.push({ ...STATUSES[`debt_${debtLevel}`], duration: 1 });
        const penalty = DEBT_LEVEL_PENALTIES[debtLevel];
        penaltyMindset = penalty.mindset;
        penaltyRomance = penalty.romance;
    }

    const healthDrain = prevState.phase === Phase.SEMESTER_1 || prevState.phase === Phase.SEMESTER_2 ? 2 : 1;

    const updatedGeneral = {
        ...prevState.general,
        money: prevState.general.money + moneyChange,
        mindset: Math.max(0, prevState.general.mindset + statusMindset - penaltyMindset),
        efficiency: Math.max(1, prevState.general.efficiency + statusEfficiency),
        romance: Math.max(0, prevState.general.romance + statusRomance - penaltyRomance),
        health: Math.max(0, prevState.general.health - healthDrain),
        luck: Math.max(0, prevState.general.luck + statusLuck),
        experience: Math.max(0, prevState.general.experience + statusExperience)
    };

    // Regression toward baseline
    const regress = (val: number, baseline: number, rate: number = 0.05) => {
        const diff = val - baseline;
        return Math.min(150, Math.max(0, val - diff * rate));
    };
    updatedGeneral.mindset = regress(updatedGeneral.mindset, 50);
    updatedGeneral.health = regress(updatedGeneral.health, 60);
    updatedGeneral.romance = Math.min(150, Math.max(0, updatedGeneral.romance));
    updatedGeneral.luck = regress(updatedGeneral.luck, 50, 0.02);
    updatedGeneral.efficiency = Math.min(30, regress(updatedGeneral.efficiency, 10, 0.03));

    const capTarget = { general: { ...updatedGeneral } };
    applyStatCaps(prevState, capTarget);

    // Subject decay
    const updatedSubjects = { ...prevState.subjects };
    for (const key of Object.keys(updatedSubjects)) {
        const sub = updatedSubjects[key as keyof typeof updatedSubjects];
        if (sub && sub.level > 5) {
            updatedSubjects[key as keyof typeof updatedSubjects] = { ...sub, level: sub.level - 0.3 };
        }
    }

    return { updatedGeneral: capTarget.general!, updatedStatuses: newStatuses, updatedSubjects };
};
