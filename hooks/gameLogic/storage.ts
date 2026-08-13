
import { GameState, Difficulty, GameLogEntry } from '../../types';

export const STORAGE_KEY_PREFIX = 'recall_save_v3';
export const ACHIEVEMENTS_KEY = 'recall_achievements_global';

export const getSaveKey = (difficulty?: Difficulty) => `${STORAGE_KEY_PREFIX}_${difficulty || 'unknown'}`;

export const getAllSaveKeys = (): string[] => {
    try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
        }
        return keys;
    } catch { return []; }
};

export const hasAnySave = (): boolean => getAllSaveKeys().length > 0;

export const getGlobalAchievements = (): string[] => {
    try {
        const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error loading global achievements", e);
        return [];
    }
};

/** 存档序列化：剔除当前事件/队列等瞬时 UI 状态，只保留可恢复的游戏进度 */
export const buildSaveData = (s: GameState): GameState => ({
    ...s,
    currentEvent: null,
    chainedEvent: null,
    eventQueue: [],
    aiBuffer: [],
    pendingHistoricalEvents: [],
    eventResult: null,
    popupCompetitionResult: null,
    popupExamResult: null
});

/**
 * 给事件 action 返回的新日志条目盖上生成时的周数。
 * action 返回的 log 是"旧日志 + 新条目"的全量数组，只对多出来的尾部新条目打戳，
 * 避免覆盖历史条目的 week（旧存档条目可能没有 week 字段，保持原样）。
 */
export const stampNewLogWeeks = (prevLog: GameLogEntry[], nextLog: GameLogEntry[] | undefined, week: number): GameLogEntry[] => {
    if (!nextLog) return prevLog;
    const newCount = nextLog.length - prevLog.length;
    if (newCount <= 0) return nextLog;
    const stamped = nextLog.slice(prevLog.length).map(l => ({ ...l, week: l.week ?? week }));
    return [...nextLog.slice(0, prevLog.length), ...stamped];
};
