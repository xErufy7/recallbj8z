import { describe, it, expect } from 'vitest';
import { GameState } from '../types';
import { getInitialGameState } from '../hooks/gameLogic/initialState';
import { applyAiEffect, applyStatDeltas, OI_CITY_STAT_OPTS } from '../data/utils';

const makeState = (overrides?: Partial<GameState>): GameState => ({
    ...getInitialGameState(),
    ...overrides
});

describe('applyAiEffect 非标准 effect 键归一化', () => {
    it('study → efficiency', () => {
        const s = makeState();
        const u = applyAiEffect(s, { study: 2 } as any);
        expect(u.general!.efficiency).toBe(s.general.efficiency + 2);
    });

    it('knowlege（拼写错误）→ experience', () => {
        const s = makeState();
        const u = applyAiEffect(s, { knowlege: 1 } as any);
        expect(u.general!.experience).toBe(s.general.experience + 1);
    });

    it('enjoyment/social/wealth/hunger/knowledge 全部生效', () => {
        const s = makeState();
        const u = applyAiEffect(s, { enjoyment: 2, social: 2, wealth: 5, hunger: -1, knowledge: 3 } as any);
        expect(u.general!.mindset).toBe(s.general.mindset + 2);
        expect(u.general!.romance).toBe(s.general.romance + 2);
        expect(u.general!.money).toBe(s.general.money + 5);
        expect(u.general!.health).toBe(s.general.health - 1);
        expect(u.general!.experience).toBe(s.general.experience + 3);
    });

    it('标准键已存在时别名不覆盖', () => {
        const s = makeState();
        const u = applyAiEffect(s, { experience: 1, knowledge: 5 } as any);
        expect(u.general!.experience).toBe(s.general.experience + 1);
    });
});

describe('applyAiEffect 上限行为', () => {
    it('心态/经验上限 150，效率上限 30，金钱允许为负', () => {
        const s = makeState({ general: { ...getInitialGameState().general, mindset: 140, experience: 140, efficiency: 29, money: 10 } });
        const u = applyAiEffect(s, { mindset: 20, experience: 20, efficiency: 5, money: -50 });
        expect(u.general!.mindset).toBe(150);
        expect(u.general!.experience).toBe(150);
        expect(u.general!.efficiency).toBe(30);
        expect(u.general!.money).toBe(-40);
    });

    it('oi_dp 别名映射进 oiStats', () => {
        const s = makeState();
        const u = applyStatDeltas(s, { oi_dp: 3, oi_graph: 2 });
        expect(u.oiStats!.dp).toBe(s.oiStats.dp + 3);
        expect(u.oiStats!.graph).toBe(s.oiStats.graph + 2);
    });
});

describe('applyStatDeltas OI/城市管线（OI_CITY_STAT_OPTS）', () => {
    it('上限 100、经验 999、效率 0-100', () => {
        const s = makeState({ general: { ...getInitialGameState().general, mindset: 95, experience: 990, efficiency: 95 } });
        const u = applyStatDeltas(s, { mindset: 10, experience: 20, efficiency: 10 }, OI_CITY_STAT_OPTS);
        expect(u.general!.mindset).toBe(100);
        expect(u.general!.experience).toBe(999);
        expect(u.general!.efficiency).toBe(100);
    });
});
