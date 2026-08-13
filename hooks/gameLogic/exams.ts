
import { Phase } from '../../types';

export const ALL_OI_PHASES = [Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM];

/** 根据总分估算年级排名（正态分布近似） */
export const calculateRank = (score: number, phase: Phase) => {
    if (ALL_OI_PHASES.includes(phase)) return -1;

    let maxScore = 750;
    const percentage = score / maxScore;
    const totalStudents = 633;
    const mean = 0.68;
    const std = 0.15;
    const z = (percentage - mean) / std;
    let percentile = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
    if (percentage < 0.1) percentile = 0;
    if (score >= maxScore * 0.99) percentile = 1;
    else if (percentage > 0.999) percentile = 0.999;
    const rank = Math.max(1, Math.floor(totalStudents * (1 - percentile)));
    return rank;
};
