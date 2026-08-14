
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

/** 找出所有存档中最近的一个（按最后一条剧情时间戳） */
export const getLatestSaveKey = (): string | null => {
    const keys = getAllSaveKeys();
    if (keys.length === 0) return null;
    let latestKey = keys[0];
    let latestTime = 0;
    for (const k of keys) {
        const data = localStorage.getItem(k);
        if (!data) continue;
        try {
            const parsed = JSON.parse(data);
            const t = parsed.history?.slice(-1)?.[0]?.timestamp || 0;
            if (t > latestTime) { latestTime = t; latestKey = k; }
        } catch { }
    }
    return latestKey;
};

export interface SaveInfo {
    difficulty: string;
    week: number;
    phase: string;
}

/** 最近存档的概要信息（用于「继续游戏」按钮展示） */
export const getLatestSaveInfo = (): SaveInfo | null => {
    const key = getLatestSaveKey();
    if (!key) return null;
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        if (!parsed || !parsed.general || !parsed.subjects) return null;
        return { difficulty: parsed.difficulty || '?', week: parsed.week ?? 1, phase: parsed.phase || '' };
    } catch { return null; }
};

/** 指定难度的存档概要信息（该难度无存档时返回 null） */
export const getSaveInfo = (difficulty: Difficulty): SaveInfo | null => {
    try {
        const parsed = JSON.parse(localStorage.getItem(getSaveKey(difficulty)) || 'null');
        if (!parsed || !parsed.general || !parsed.subjects) return null;
        return { difficulty: parsed.difficulty || difficulty, week: parsed.week ?? 1, phase: parsed.phase || '' };
    } catch { return null; }
};

export interface SaveEntry {
    key: string;
    difficulty: string;
    week: number;
    updatedAt: number;
}

/** 所有存档的概要列表（存档管理界面用），按最近游玩排序 */
export const getAllSaveInfos = (): SaveEntry[] => {
    return getAllSaveKeys()
        .map(key => {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || 'null');
                const lastLog = parsed?.log?.slice(-1)?.[0];
                const lastStory = parsed?.history?.slice(-1)?.[0];
                const updatedAt = Math.max(lastLog?.timestamp || 0, lastStory?.timestamp || 0);
                return { key, difficulty: parsed?.difficulty || '?', week: parsed?.week ?? 1, updatedAt };
            } catch {
                return { key, difficulty: '?', week: 1, updatedAt: 0 };
            }
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const deleteSaveByKey = (key: string) => {
    try { localStorage.removeItem(key); } catch { }
};

// --- 结局收集册（跨局持久化，按 评级+称号+难度 去重） ---
export const ENDINGS_KEY = 'bj8z_endings_global';

export interface EndingEntry {
    rank: string;
    title: string;
    score: number;
    difficulty: string;
    /** ISO 日期串 */
    date: string;
}

export const getCollectedEndings = (): EndingEntry[] => {
    try {
        const stored = localStorage.getItem(ENDINGS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
};

export const recordEnding = (entry: EndingEntry) => {
    try {
        const all = getCollectedEndings();
        if (!all.some(e => e.rank === entry.rank && e.title === entry.title && e.difficulty === entry.difficulty)) {
            all.push(entry);
            localStorage.setItem(ENDINGS_KEY, JSON.stringify(all));
        }
    } catch { }
};

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
