
import { GameState, Difficulty, GameLogEntry, Phase, SubjectKey, OIStats, GameStatus, Talent } from '../../types';
import { getInitialGameState } from './initialState';
import { EXAM_PHASES } from './exams';

export const STORAGE_KEY_PREFIX = 'recall_save_v3';
export const ACHIEVEMENTS_KEY = 'recall_achievements_global';
export const SAVE_VERSION = 1;
/** 单局日志上限：防止存档体积与渲染负担随游戏时长无限膨胀 */
export const MAX_LOG_ENTRIES = 200;

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
            const lastLog = parsed?.log?.slice(-1)?.[0];
            const lastStory = parsed?.history?.slice(-1)?.[0];
            const t = Math.max(lastLog?.timestamp || 0, lastStory?.timestamp || 0);
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
const ENDINGS_KEY = 'bj8z_endings_global';

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
    saveVersion: SAVE_VERSION,
    currentEvent: null,
    chainedEvent: null,
    eventQueue: [],
    aiBuffer: [],
    eventResult: null,
    popupCompetitionResult: null,
    // 考试完成后保留结果弹窗：读档直接恢复结果，跳过重考（考试进行中另有保护，不会落盘）
    popupExamResult: EXAM_PHASES.includes(s.phase) ? s.popupExamResult : null
});

// --- 存档字段级校验与补全（localStorage 读取与导入文件共用） ---

const VALID_DIFFICULTIES = new Set(['CUSTOM', 'NORMAL', 'HARD', 'REALITY', 'AI_STORY']);
const VALID_PHASES = new Set<string>(Object.values(Phase));
const VALID_LOG_TYPES = new Set(['info', 'success', 'warning', 'error', 'event']);

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * 字段级校验并补全一份存档数据。
 * 旧版本或伪造存档缺字段时用初始值补齐，防止运行时崩溃（如 talents 缺失导致每周结算抛错）；
 * 瞬时 UI 状态（事件/队列/弹窗）一律丢弃——事件里的 choice.action 是函数、无法序列化；
 * 核心字段（general/subjects/phase）不可修复时返回 null。
 */
export const normalizeLoadedState = (raw: unknown): GameState | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, any>;
    if (!r.general || typeof r.general !== 'object' || !r.subjects || typeof r.subjects !== 'object') return null;
    if (typeof r.phase !== 'string' || !VALID_PHASES.has(r.phase)) return null;

    const base = getInitialGameState();

    const general = (Object.keys(base.general) as (keyof GameState['general'])[]).reduce(
        (acc, k) => ({ ...acc, [k]: num(r.general[k], base.general[k]) }),
        {} as GameState['general']
    );

    const initialGeneral = (Object.keys(base.initialGeneral) as (keyof GameState['initialGeneral'])[]).reduce(
        (acc, k) => ({ ...acc, [k]: num(r.initialGeneral?.[k] ?? r.general[k], base.initialGeneral[k]) }),
        {} as GameState['initialGeneral']
    );

    const subjects = (Object.keys(base.subjects) as SubjectKey[]).reduce((acc, k) => {
        const s = r.subjects[k];
        acc[k] = {
            aptitude: num(s?.aptitude, base.subjects[k].aptitude),
            level: num(s?.level, base.subjects[k].level)
        };
        return acc;
    }, {} as GameState['subjects']);

    const oiStats: OIStats = {
        dp: num(r.oiStats?.dp, 0),
        ds: num(r.oiStats?.ds, 0),
        math: num(r.oiStats?.math, 0),
        string: num(r.oiStats?.string, 0),
        graph: num(r.oiStats?.graph, 0),
        misc: num(r.oiStats?.misc, 0),
        rating: num(r.oiStats?.rating, 0),
        history: Array.isArray(r.oiStats?.history) ? r.oiStats.history.filter((h: any) => h && typeof h === 'object') : []
    };

    const rawLog = Array.isArray(r.log)
        ? r.log
            .filter((l: any) => l && typeof l.message === 'string')
            .map((l: any): GameLogEntry => ({
                message: l.message,
                type: VALID_LOG_TYPES.has(l.type) ? l.type : 'info',
                timestamp: num(l.timestamp, 0),
                ...(typeof l.week === 'number' ? { week: num(l.week, 0) } : {})
            }))
        : [];
    const log = rawLog.slice(-MAX_LOG_ENTRIES);

    const talents = Array.isArray(r.talents)
        ? r.talents.filter((t: any): t is Talent => t && typeof t === 'object' && typeof t.id === 'string')
        : [];

    const activeStatuses: GameStatus[] = Array.isArray(r.activeStatuses)
        ? r.activeStatuses
            .filter((s: any) => s && typeof s === 'object' && typeof s.id === 'string' && typeof s.name === 'string')
            .map((s: any) => ({ ...s, duration: num(s.duration, 1) }))
        : [];

    const selectedSubjects = (Array.isArray(r.selectedSubjects) ? r.selectedSubjects : [])
        .filter((s: any): s is SubjectKey => typeof s === 'string' && s in base.subjects);

    return {
        ...base,
        saveVersion: num(r.saveVersion, 1),
        // 瞬时 UI 状态一律丢弃，读档后由主循环/UI 重新驱动
        currentEvent: null,
        chainedEvent: null,
        eventQueue: [],
        aiBuffer: [],
        eventResult: null,
        popupCompetitionResult: null,
        // 考试阶段且结果已生成：保留结果弹窗，读档直接恢复，跳过重考
        popupExamResult: EXAM_PHASES.includes(r.phase as Phase) && r.popupExamResult && typeof r.popupExamResult === 'object' ? r.popupExamResult : null,
        achievementPopup: null,
        activeMiniGame: null,
        isAiGenerating: false,

        worldContext: r.worldContext && typeof r.worldContext === 'object' ? r.worldContext : undefined,
        activeProjects: Array.isArray(r.activeProjects)
            ? r.activeProjects.filter((p: any) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.title === 'string')
            : [],
        completedProjects: strArray(r.completedProjects),
        recentEventIds: strArray(r.recentEventIds),
        phase: r.phase as Phase,
        week: num(r.week, 1),
        totalWeeksInPhase: num(r.totalWeeksInPhase, 0),
        subjects,
        general,
        initialGeneral,
        oiStats,
        selectedSubjects,
        competition: r.competition === 'OI' || r.competition === 'None' ? r.competition : 'None',
        flags: r.flags && typeof r.flags === 'object' ? r.flags : {},
        // club 是宽松校验：非法 id 只会让 UI 找不到对应社团文案，不会崩溃
        club: (typeof r.club === 'string' ? r.club : null) as GameState['club'],
        hasSelectedClub: bool(r.hasSelectedClub, false),
        romancePartner: typeof r.romancePartner === 'string' ? r.romancePartner : null,
        className: str(r.className, ''),
        log,
        history: Array.isArray(r.history)
            ? r.history.filter((h: any) => h && typeof h === 'object' && typeof h.eventTitle === 'string')
            : [],
        examResult: r.examResult && typeof r.examResult === 'object' ? r.examResult : null,
        midtermRank: (typeof r.midtermRank === 'number' || typeof r.midtermRank === 'string') ? r.midtermRank : null,
        competitionResults: Array.isArray(r.competitionResults)
            ? r.competitionResults.filter((c: any) => c && typeof c === 'object' && typeof c.title === 'string')
            : [],
        triggeredEvents: strArray(r.triggeredEvents),
        isGrounded: bool(r.isGrounded, false),
        debugMode: bool(r.debugMode, false),
        activeStatuses,
        unlockedAchievements: strArray(r.unlockedAchievements),
        difficulty: VALID_DIFFICULTIES.has(r.difficulty) ? r.difficulty : 'NORMAL',
        isWeekend: bool(r.isWeekend, false),
        isPlaying: bool(r.isPlaying, false),
        lastWeekSchedule: r.lastWeekSchedule && typeof r.lastWeekSchedule === 'object' ? r.lastWeekSchedule : {},
        availableWeekendActivityIds: Array.isArray(r.availableWeekendActivityIds) ? strArray(r.availableWeekendActivityIds) : undefined,
        sleepCount: num(r.sleepCount, 0),
        rejectionCount: num(r.rejectionCount, 0),
        talents,
        inventory: strArray(r.inventory),
        theme: r.theme === 'dark' ? 'dark' : 'light'
    };
};

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
