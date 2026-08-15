
import { Phase, GameState } from '../../types';

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

/** 阶段内考试触发规则（主循环逐周检查，按表中顺序判断） */
export interface ExamTrigger {
    week: number;
    phase: Phase;
    condition?: (state: GameState) => boolean;
    /** 触发后写入 triggeredEvents 的标记 id（once 语义） */
    markTriggered?: string;
}

/** 单一阶段流程表：阶段推进目标、总周数、考试/选科结算后的去向（closeExamResult 与选科确认共用） */
export interface PhaseFlowInfo {
    /** 周数走完后推进到的阶段（advancePhase 用） */
    nextPhase: Phase;
    /** 该阶段总周数 */
    weeks: number;
    /** 考试/选科等结果确认后的去向 */
    resultPhase?: Phase;
    /** resultPhase 对应的周数：数字为固定值，'+1' 为当前周 +1，缺省沿用当前周 */
    resultWeek?: number | '+1';
    /** resultPhase 的总周数 */
    resultWeeks?: number;
    /** 结果确认后压入 eventQueue 的 OI 结果事件 id */
    resultQueueEventId?: string;
    /** 阶段内的考试触发周 */
    examTriggers?: ExamTrigger[];
}

export const PHASE_FLOW: Partial<Record<Phase, PhaseFlowInfo>> = {
    [Phase.INIT]: { nextPhase: Phase.SUMMER, weeks: 8 },
    [Phase.SUMMER]: { nextPhase: Phase.MILITARY, weeks: 2 },
    [Phase.MILITARY]: { nextPhase: Phase.SELECTION, weeks: 0 },
    [Phase.SELECTION]: { nextPhase: Phase.PLACEMENT_EXAM, weeks: 0, resultPhase: Phase.PLACEMENT_EXAM, resultWeeks: 0 },
    [Phase.PLACEMENT_EXAM]: { nextPhase: Phase.SEMESTER_1, weeks: 21, resultPhase: Phase.SEMESTER_1, resultWeek: 1, resultWeeks: 21 },
    [Phase.SEMESTER_1]: {
        nextPhase: Phase.FINAL_EXAM, weeks: 21,
        examTriggers: [
            { week: 7, phase: Phase.CSP_EXAM, condition: s => s.competition === 'OI' && !s.triggeredEvents.includes('csp_exam_trigger'), markTriggered: 'csp_exam_trigger' },
            { week: 11, phase: Phase.MIDTERM_EXAM, condition: s => s.midtermRank !== 'SEMESTER_1_DONE' },
            { week: 13, phase: Phase.NOIP_EXAM, condition: s => s.competition === 'OI' && !s.triggeredEvents.includes('noip_exam_trigger'), markTriggered: 'noip_exam_trigger' }
        ]
    },
    [Phase.MIDTERM_EXAM]: { nextPhase: Phase.SUBJECT_RESELECTION, weeks: 0, resultPhase: Phase.SUBJECT_RESELECTION, resultWeek: 11, resultWeeks: 0 },
    [Phase.SUBJECT_RESELECTION]: { nextPhase: Phase.SEMESTER_1, weeks: 21, resultPhase: Phase.SEMESTER_1, resultWeeks: 21 },
    [Phase.CSP_EXAM]: { nextPhase: Phase.SEMESTER_1, weeks: 21, resultPhase: Phase.SEMESTER_1, resultWeek: '+1', resultWeeks: 21 },
    [Phase.NOIP_EXAM]: { nextPhase: Phase.SEMESTER_1, weeks: 21, resultPhase: Phase.SEMESTER_1, resultWeek: '+1', resultWeeks: 21 },
    [Phase.FINAL_EXAM]: { nextPhase: Phase.WINTER_BREAK, weeks: 5, resultPhase: Phase.WINTER_BREAK, resultWeek: 1, resultWeeks: 5 },
    [Phase.WINTER_BREAK]: { nextPhase: Phase.SEMESTER_2, weeks: 21 },
    [Phase.MIDTERM_EXAM_2]: { nextPhase: Phase.SEMESTER_2, weeks: 21, resultPhase: Phase.SEMESTER_2, resultWeek: 12, resultWeeks: 21 },
    [Phase.SEMESTER_2]: {
        nextPhase: Phase.FINAL_EXAM_2, weeks: 21,
        examTriggers: [
            { week: 11, phase: Phase.MIDTERM_EXAM_2, condition: s => s.midtermRank !== 'SEMESTER_2_DONE' }
        ]
    },
    [Phase.FINAL_EXAM_2]: { nextPhase: Phase.SUMMER_BREAK, weeks: 8, resultPhase: Phase.SUMMER_BREAK, resultWeek: 1, resultWeeks: 8 },
    [Phase.SUMMER_BREAK]: { nextPhase: Phase.ENDING, weeks: 0 },
    [Phase.WC_EXAM]: { nextPhase: Phase.WINTER_BREAK, weeks: 5, resultPhase: Phase.WINTER_BREAK, resultWeek: '+1', resultWeeks: 5, resultQueueEventId: 'oi_wc_result' },
    [Phase.PROVINCIAL_EXAM]: { nextPhase: Phase.SEMESTER_2, weeks: 21, resultPhase: Phase.SEMESTER_2, resultWeek: '+1', resultWeeks: 21, resultQueueEventId: 'oi_provincial_result' },
    [Phase.APIO_EXAM]: { nextPhase: Phase.SEMESTER_2, weeks: 21, resultPhase: Phase.SEMESTER_2, resultWeek: '+1', resultWeeks: 21, resultQueueEventId: 'oi_apio_result' },
    [Phase.NOI_EXAM]: { nextPhase: Phase.SUMMER_BREAK, weeks: 8, resultPhase: Phase.SUMMER_BREAK, resultWeek: '+1', resultWeeks: 8, resultQueueEventId: 'oi_noi_social_practice' }
};

/** 根据当前阶段返回下一阶段及该阶段总周数 */
export const getNextPhaseInfo = (currentPhase: Phase): { nextPhase: Phase; weeks: number } => {
    const entry = PHASE_FLOW[currentPhase];
    return entry ? { nextPhase: entry.nextPhase, weeks: entry.weeks } : { nextPhase: Phase.ENDING, weeks: 0 };
};

/** 考试/选科结果确认后的去向（closeExamResult 与选科确认共用） */
export const getPhaseResultInfo = (phase: Phase): PhaseFlowInfo | undefined => {
    const entry = PHASE_FLOW[phase];
    return entry?.resultPhase ? entry : undefined;
};
