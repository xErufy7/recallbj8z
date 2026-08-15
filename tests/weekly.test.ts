import { describe, it, expect } from 'vitest';
import { Phase, GameState, GameStatus } from '../types';
import { getInitialGameState } from '../hooks/gameLogic/initialState';
import { calculateWeeklyUpdates } from '../hooks/gameLogic/weekly';
import { STATUSES } from '../data/mechanics';

const makeState = (overrides?: Partial<GameState>): GameState => ({
    ...getInitialGameState(),
    phase: Phase.SEMESTER_1,
    ...overrides
});

const status = (id: string, duration: number): GameStatus => ({ ...STATUSES[id], duration });

describe('calculateWeeklyUpdates 状态数值效果（数据驱动）', () => {
    it('anxious：心态 -2，持续时间 -1', () => {
        const s = makeState({ activeStatuses: [status('anxious', 4)] });
        const { updatedGeneral, updatedStatuses } = calculateWeeklyUpdates(s);
        // 50 - 2 = 48，再向 50 回归 5% → 48.1
        expect(updatedGeneral.mindset).toBeCloseTo(48.1, 5);
        expect(updatedStatuses.find(x => x.id === 'anxious')!.duration).toBe(3);
    });

    it('in_love：心态 +5', () => {
        const s = makeState({ activeStatuses: [status('in_love', 6)] });
        const { updatedGeneral } = calculateWeeklyUpdates(s);
        // 50 + 5 = 55，回归 5% → 54.75
        expect(updatedGeneral.mindset).toBeCloseTo(54.75, 5);
    });

    it('crush：效率 -2、魅力 +2（魅力不回归）', () => {
        const s = makeState({ activeStatuses: [status('crush', 3)] });
        const { updatedGeneral } = calculateWeeklyUpdates(s);
        // 效率 10 - 2 = 8，向 10 回归 3% → 8.06
        expect(updatedGeneral.efficiency).toBeCloseTo(8.06, 5);
        // 初始魅力为 0：0 + 2 = 2（无回归）
        expect(updatedGeneral.romance).toBeCloseTo(2, 5);
    });

    it('focused：效率 +1', () => {
        const s = makeState({ activeStatuses: [status('focused', 2)] });
        const { updatedGeneral } = calculateWeeklyUpdates(s);
        // 10 + 1 = 11，向 10 回归 3% → 10.97
        expect(updatedGeneral.efficiency).toBeCloseTo(10.97, 5);
    });

    it('持续时间归零的状态被移除', () => {
        const s = makeState({ activeStatuses: [status('anxious', 1)] });
        const { updatedStatuses } = calculateWeeklyUpdates(s);
        expect(updatedStatuses.find(x => x.id === 'anxious')).toBeUndefined();
    });
});

describe('calculateWeeklyUpdates 负债与挑战', () => {
    it('负债等级 2：心态 -10、魅力 -6（下限 0），并挂上 debt_2 状态', () => {
        const s = makeState({ general: { ...getInitialGameState().general, money: -100 } });
        const { updatedGeneral, updatedStatuses } = calculateWeeklyUpdates(s);
        // 50 - 10 = 40，回归 5% → 40.5
        expect(updatedGeneral.mindset).toBeCloseTo(40.5, 5);
        // 初始魅力为 0：0 - 6 → 下限 0
        expect(updatedGeneral.romance).toBe(0);
        expect(updatedStatuses.find(x => x.id === 'debt_2')).toBeDefined();
    });

});
