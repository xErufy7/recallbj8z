import { describe, it, expect } from 'vitest';
import { Phase } from '../types';
import { getInitialGameState } from '../hooks/gameLogic/initialState';
import { normalizeLoadedState, buildSaveData, MAX_LOG_ENTRIES } from '../hooks/gameLogic/storage';

describe('normalizeLoadedState', () => {
    it('拒绝无效输入', () => {
        expect(normalizeLoadedState(null)).toBeNull();
        expect(normalizeLoadedState('x')).toBeNull();
        expect(normalizeLoadedState({})).toBeNull();
        expect(normalizeLoadedState({ general: {}, phase: 'SUMMER' })).toBeNull();
        expect(normalizeLoadedState({ subjects: {}, phase: 'SUMMER' })).toBeNull();
        expect(normalizeLoadedState({ general: {}, subjects: {}, phase: 'BOGUS' })).toBeNull();
    });

    it('旧存档缺字段时用初始值补齐（talents 缺失不再崩溃）', () => {
        const loaded = normalizeLoadedState({
            general: { mindset: 60 },
            subjects: { math: { aptitude: 80, level: 10 } },
            phase: 'SEMESTER_1'
        });
        expect(loaded).not.toBeNull();
        expect(loaded!.talents).toEqual([]);
        expect(loaded!.inventory).toEqual([]);
        expect(loaded!.log).toEqual([]);
        expect(loaded!.general.mindset).toBe(60);
        expect(loaded!.general.health).toBe(100); // 缺省补默认
        expect(loaded!.subjects.math.level).toBe(10);
        expect(loaded!.subjects.chinese.level).toBe(0); // 缺省补默认
        expect(loaded!.week).toBe(1);
    });

    it('非法数值字段回退默认值，非法 difficulty 回退 NORMAL', () => {
        const loaded = normalizeLoadedState({
            general: { mindset: 'oops', health: NaN },
            subjects: { math: { aptitude: 'x', level: 5 } },
            phase: 'SEMESTER_1',
            week: -3,
            difficulty: 'HACKED'
        });
        expect(loaded!.general.mindset).toBe(50);
        expect(loaded!.general.health).toBe(100);
        expect(loaded!.subjects.math.aptitude).toBe(0);
        expect(loaded!.difficulty).toBe('NORMAL');
    });

    it('日志超上限时只保留最近 MAX_LOG_ENTRIES 条', () => {
        const manyLogs = Array.from({ length: MAX_LOG_ENTRIES + 50 }, (_, i) => ({
            message: `log-${i}`, type: 'info', timestamp: i, week: 1
        }));
        const loaded = normalizeLoadedState({
            general: { money: 10 }, subjects: {}, phase: 'SUMMER', log: manyLogs
        });
        expect(loaded!.log.length).toBe(MAX_LOG_ENTRIES);
        expect(loaded!.log[0].message).toBe('log-50'); // 最老的被截掉
    });

    it('考试阶段保留 popupExamResult（读档直接恢复结果），非考试阶段丢弃', () => {
        const result = { title: '期中考试', scores: { math: 120 }, totalScore: 400, comment: 'ok' };
        const examPhase = normalizeLoadedState({
            general: {}, subjects: {}, phase: 'CSP_EXAM', popupExamResult: result
        });
        expect(examPhase!.popupExamResult).toEqual(result);

        const normalPhase = normalizeLoadedState({
            general: {}, subjects: {}, phase: 'SEMESTER_1', popupExamResult: result
        });
        expect(normalPhase!.popupExamResult).toBeNull();
    });
});

describe('buildSaveData', () => {
    it('考试阶段保留 popupExamResult，其余阶段清空', () => {
        const base = getInitialGameState();
        const result = { title: 'NOIP', scores: {}, totalScore: 300, comment: 'c' };
        const examSave = buildSaveData({ ...base, phase: Phase.NOIP_EXAM, popupExamResult: result });
        expect(examSave.popupExamResult).toEqual(result);

        const normalSave = buildSaveData({ ...base, phase: Phase.SEMESTER_1, popupExamResult: result });
        expect(normalSave.popupExamResult).toBeNull();
    });

    it('瞬时 UI 状态不入存档', () => {
        const base = getInitialGameState();
        const save = buildSaveData({ ...base, isPlaying: true });
        expect(save.currentEvent).toBeNull();
        expect(save.eventQueue).toEqual([]);
        expect(save.aiBuffer).toEqual([]);
        expect(save.isPlaying).toBe(true); // isPlaying 是恢复语义的一部分，保留
        expect(save.saveVersion).toBeDefined();
    });
});
