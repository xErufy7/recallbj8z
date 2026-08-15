import { describe, it, expect } from 'vitest';
import { Phase, GameState } from '../types';
import { getInitialGameState } from '../hooks/gameLogic/initialState';
import { PHASE_FLOW, getNextPhaseInfo, getPhaseResultInfo } from '../hooks/gameLogic/phases';

const state = (overrides?: Partial<GameState>): GameState => ({
    ...getInitialGameState(),
    ...overrides
});

describe('PHASE_FLOW 阶段推进表', () => {
    it('常规推进目标与周数', () => {
        expect(getNextPhaseInfo(Phase.INIT)).toEqual({ nextPhase: Phase.SUMMER, weeks: 8 });
        expect(getNextPhaseInfo(Phase.SUMMER)).toEqual({ nextPhase: Phase.MILITARY, weeks: 2 });
        expect(getNextPhaseInfo(Phase.MILITARY)).toEqual({ nextPhase: Phase.SELECTION, weeks: 0 });
        expect(getNextPhaseInfo(Phase.WINTER_BREAK)).toEqual({ nextPhase: Phase.SEMESTER_2, weeks: 21 });
        expect(getNextPhaseInfo(Phase.SUMMER_BREAK)).toEqual({ nextPhase: Phase.ENDING, weeks: 0 });
    });

    it('高一上学期考试触发周：CSP 第7周、期中第11周、NOIP 第13周', () => {
        const triggers = PHASE_FLOW[Phase.SEMESTER_1]!.examTriggers!;
        expect(triggers.map(t => t.week)).toEqual([7, 11, 13]);
        expect(triggers.map(t => t.phase)).toEqual([Phase.CSP_EXAM, Phase.MIDTERM_EXAM, Phase.NOIP_EXAM]);

        // CSP/NOIP 需要信竞路线且未触发过
        const oiState = state({ competition: 'OI' });
        const nonOiState = state({ competition: 'None' });
        expect(triggers[0].condition!(oiState)).toBe(true);
        expect(triggers[0].condition!(nonOiState)).toBe(false);
        expect(triggers[0].condition!(state({ competition: 'OI', triggeredEvents: ['csp_exam_trigger'] }))).toBe(false);

        // 期中只触发一次
        expect(triggers[1].condition!(state({ midtermRank: 'SEMESTER_1_DONE' }))).toBe(false);
        expect(triggers[1].condition!(state({ midtermRank: null }))).toBe(true);
    });

    it('高一下学期第11周期中触发', () => {
        const triggers = PHASE_FLOW[Phase.SEMESTER_2]!.examTriggers!;
        expect(triggers).toEqual([
            { week: 11, phase: Phase.MIDTERM_EXAM_2, condition: expect.any(Function) }
        ]);
    });
});

describe('getPhaseResultInfo 考试/选科结算去向', () => {
    it('期中 → 期中改选（固定第 11 周）', () => {
        const flow = getPhaseResultInfo(Phase.MIDTERM_EXAM)!;
        expect(flow.resultPhase).toBe(Phase.SUBJECT_RESELECTION);
        expect(flow.resultWeek).toBe(11);
    });

    it('分班考 → 高一上（第 1 周，21 周总长）', () => {
        const flow = getPhaseResultInfo(Phase.PLACEMENT_EXAM)!;
        expect(flow.resultPhase).toBe(Phase.SEMESTER_1);
        expect(flow.resultWeek).toBe(1);
        expect(flow.resultWeeks).toBe(21);
    });

    it('CSP/NOIP → 高一上（当前周 +1）', () => {
        const csp = getPhaseResultInfo(Phase.CSP_EXAM)!;
        expect(csp.resultPhase).toBe(Phase.SEMESTER_1);
        expect(csp.resultWeek).toBe('+1');
        expect(getPhaseResultInfo(Phase.NOIP_EXAM)!.resultPhase).toBe(Phase.SEMESTER_1);
    });

    it('NOI → 暑假 + 社会实践事件入队', () => {
        const flow = getPhaseResultInfo(Phase.NOI_EXAM)!;
        expect(flow.resultPhase).toBe(Phase.SUMMER_BREAK);
        expect(flow.resultQueueEventId).toBe('oi_noi_social_practice');
    });

    it('非结算阶段返回 undefined', () => {
        expect(getPhaseResultInfo(Phase.SEMESTER_1)).toBeUndefined();
        expect(getPhaseResultInfo(Phase.SUMMER)).toBeUndefined();
    });
});
