
import { Phase } from '../../types';

export const PHASE_NAMES: Record<Phase, string> = {
    [Phase.INIT]: '初始化', [Phase.SUMMER]: '暑假', [Phase.MILITARY]: '军训',
    [Phase.SELECTION]: '选科', [Phase.PLACEMENT_EXAM]: '分班考',
    [Phase.SEMESTER_1]: '高一上学期', [Phase.MIDTERM_EXAM]: '期中考试',
    [Phase.SUBJECT_RESELECTION]: '期中改选', [Phase.CSP_EXAM]: 'CSP考试',
    [Phase.NOIP_EXAM]: 'NOIP考试', [Phase.FINAL_EXAM]: '期末考试',
    [Phase.MIDTERM_EXAM_2]: '高一下期中', [Phase.FINAL_EXAM_2]: '高一下期末',
    [Phase.WINTER_BREAK]: '寒假', [Phase.SEMESTER_2]: '高一下学期',
    [Phase.SUMMER_BREAK]: '暑假', [Phase.WC_EXAM]: 'WC冬令营',
    [Phase.PROVINCIAL_EXAM]: '省选', [Phase.APIO_EXAM]: 'APIO',
    [Phase.NOI_EXAM]: 'NOI', [Phase.ENDING]: '结局', [Phase.WITHDRAWAL]: '休学'
};

/** 根据当前阶段返回下一阶段及该阶段总周数 */
export const getNextPhaseInfo = (currentPhase: Phase): { nextPhase: Phase; weeks: number } => {
    switch (currentPhase) {
        case Phase.INIT: return { nextPhase: Phase.SUMMER, weeks: 8 };
        case Phase.SUMMER: return { nextPhase: Phase.MILITARY, weeks: 2 };
        case Phase.MILITARY: return { nextPhase: Phase.SELECTION, weeks: 0 };
        case Phase.SELECTION: return { nextPhase: Phase.PLACEMENT_EXAM, weeks: 0 };
        case Phase.PLACEMENT_EXAM: return { nextPhase: Phase.SEMESTER_1, weeks: 21 };
        case Phase.MIDTERM_EXAM: return { nextPhase: Phase.SUBJECT_RESELECTION, weeks: 0 };
        case Phase.SUBJECT_RESELECTION: return { nextPhase: Phase.SEMESTER_1, weeks: 21 };
        case Phase.SEMESTER_1: return { nextPhase: Phase.FINAL_EXAM, weeks: 0 };
        case Phase.FINAL_EXAM: return { nextPhase: Phase.WINTER_BREAK, weeks: 5 };
        case Phase.WINTER_BREAK: return { nextPhase: Phase.SEMESTER_2, weeks: 21 };
        case Phase.MIDTERM_EXAM_2: return { nextPhase: Phase.SEMESTER_2, weeks: 21 };
        case Phase.SEMESTER_2: return { nextPhase: Phase.FINAL_EXAM_2, weeks: 0 };
        case Phase.FINAL_EXAM_2: return { nextPhase: Phase.SUMMER_BREAK, weeks: 8 };
        case Phase.SUMMER_BREAK: return { nextPhase: Phase.ENDING, weeks: 0 };
        default: return { nextPhase: Phase.ENDING, weeks: 0 };
    }
};
