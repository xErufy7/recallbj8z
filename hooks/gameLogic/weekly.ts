
import { GameState, Phase, GameStatus } from '../../types';
import { STATUSES } from '../../data/mechanics';
import { getActiveTalentPassives, hasNoWeeklyMoney, applyStatCaps } from '../../data/utils';

/** 每周推进时的属性结算：金钱、状态衰减、欠债惩罚、健康消耗、回归均值、科目遗忘 */
export const calculateWeeklyUpdates = (prevState: GameState) => {
    const passives = getActiveTalentPassives(prevState);
    let moneyChange = hasNoWeeklyMoney(prevState) ? 0 : 1 * (passives.moneyGainMultiplier ?? 1);
    if (prevState.activeChallengeId === 'c_debt_king') moneyChange -= 25;

    const currentMoney = prevState.general.money;
    let debtLevel = 0;
    if (currentMoney < -800) debtLevel = 5;
    else if (currentMoney < -350) debtLevel = 4;
    else if (currentMoney < -180) debtLevel = 3;
    else if (currentMoney < -80) debtLevel = 2;
    else if (currentMoney < 0) debtLevel = 1;

    let statusMindset = 0, statusEfficiency = 0, statusRomance = 0, statusHealth = 0, statusLuck = 0, statusExperience = 0;
    let newStatuses: GameStatus[] = [];

    for (const st of prevState.activeStatuses) {
        if (st.id.startsWith('debt_')) continue;
        const newDuration = st.duration - 1;
        if (newDuration <= 0) continue;
        newStatuses.push({ ...st, duration: newDuration });
        switch (st.id) {
            case 'anxious': statusMindset -= 2; break;
            case 'crush': statusEfficiency -= 2; statusRomance += 2; break;
            case 'in_love': statusMindset += 5; break;
            case 'heartbroken': statusMindset -= 3; statusEfficiency -= 1; break;
            case 'focused': statusEfficiency += 1; break;
            case 'crush_pending': statusLuck += 2; statusExperience += 2; break;
            case 'exhausted': break;
        }
    }

    let penaltyMindset = 0, penaltyRomance = 0;
    if (debtLevel > 0) {
        newStatuses.push({ ...STATUSES[`debt_${debtLevel}`], duration: 1 });
        if (debtLevel === 1) { penaltyMindset = 5; penaltyRomance = 3; }
        if (debtLevel === 2) { penaltyMindset = 10; penaltyRomance = 6; }
        if (debtLevel === 3) { penaltyMindset = 20; penaltyRomance = 12; }
        if (debtLevel === 4) { penaltyMindset = 40; penaltyRomance = 24; }
        if (debtLevel === 5) { penaltyMindset = 80; penaltyRomance = 48; }
    }

    const healthDrain = prevState.phase === Phase.SEMESTER_1 || prevState.phase === Phase.SEMESTER_2 ? 2 : 1;

    const updatedGeneral = {
        ...prevState.general,
        money: prevState.general.money + moneyChange,
        mindset: Math.max(0, prevState.general.mindset + statusMindset - penaltyMindset),
        efficiency: Math.max(1, prevState.general.efficiency + statusEfficiency),
        romance: Math.max(0, prevState.general.romance + statusRomance - penaltyRomance),
        health: Math.max(0, prevState.general.health + statusHealth - healthDrain),
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
