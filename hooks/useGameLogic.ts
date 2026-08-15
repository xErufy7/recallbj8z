
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    GameState, Difficulty, GeneralStats, Talent,
    Phase, GameStatus, SubjectKey, GameEvent,
    EventChoice, ExamResult, ClubId, Item, Project, GameLogEntry, StoryEntry
} from '../types';
import { DIFFICULTY_PRESETS } from '../data/constants';
import { PHASE_EVENTS, ensureAiEvents } from '../data/events';
import { BASE_EVENTS, CHAINED_EVENTS } from '../data/event_defs';
import { generateSummerLifeEvent, generateStudyEvent, generateOIEvent, generateRandomFlavorEvent, ensureOiEvents } from '../data/event_generators';
import { WEEKEND_ACTIVITIES, STATUSES, ACHIEVEMENTS } from '../data/mechanics';
import { getShopPriceMultiplier, hasNoDebtEvents, getRomanceEventMultiplier, applyStatCaps, mapAiEventToGameEvent } from '../data/utils';
import { getRandomWorldContext, CHARACTER_TEMPLATES } from '../data/world_context';
import { getHistoricalEventsForWeek, loadCityEvents } from '../data/historical_events';
import { OI_EVENTS_POOL } from '../data/events_oi';
import { PHASE_NAMES, getNextPhaseInfo, PHASE_FLOW, getPhaseResultInfo } from './gameLogic/phases';
import { getInitialSubjects, getInitialOIStats, getInitialGameState } from './gameLogic/initialState';
import { getSaveKey, hasAnySave, getGlobalAchievements, buildSaveData, stampNewLogWeeks, ACHIEVEMENTS_KEY, getLatestSaveKey, normalizeLoadedState, MAX_LOG_ENTRIES } from './gameLogic/storage';
import { calculateWeeklyUpdates } from './gameLogic/weekly';
import { calculateRank, ALL_OI_PHASES, EXAM_PHASES } from './gameLogic/exams';
import { fetchAiEvents } from './gameLogic/ai';
import { applyTalentPassivesToUpdates } from './gameLogic/passives';

export { ACHIEVEMENTS_KEY } from './gameLogic/storage';
export { PHASE_NAMES } from './gameLogic/phases';

export type GameSpeed = 'slow' | 'normal' | 'fast';
const SPEED_DELAYS: Record<GameSpeed, number> = { slow: 2000, normal: 1000, fast: 400 };
const SPEED_STORAGE_KEY = 'bj8z_game_speed';

export const useGameLogic = () => {
    const [state, setState] = useState<GameState>(() => {
        const initial = getInitialGameState();
        const globalAchievements = getGlobalAchievements();
        return { ...initial, unlockedAchievements: globalAchievements };
    });

    const achievementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const achievementPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 最新 state 镜像：供异步回调/键盘事件读取，避免陈旧闭包
    const stateRef = useRef(state);
    stateRef.current = state;
    // AI 生成令牌：等待期间加载存档/重开新局则使本次生成结果作废
    const aiGenerationTokenRef = useRef(0);

    /** 日志截断：单局日志保留最近 MAX_LOG_ENTRIES 条，防止存档与渲染负担无限膨胀 */
    const capLog = (log: GameLogEntry[]): GameLogEntry[] =>
        log.length > MAX_LOG_ENTRIES ? log.slice(-MAX_LOG_ENTRIES) : log;

    const [hasSave, setHasSave] = useState(false);
    // 游戏速度：自动推进的事件间隔（快/正常/慢），localStorage 持久化
    const [gameSpeed, setGameSpeedState] = useState<GameSpeed>(() => {
        try {
            const v = localStorage.getItem(SPEED_STORAGE_KEY);
            return v === 'slow' || v === 'fast' ? v : 'normal';
        } catch { return 'normal'; }
    });
    const setGameSpeed = (v: GameSpeed) => {
        setGameSpeedState(v);
        try { localStorage.setItem(SPEED_STORAGE_KEY, v); } catch { }
    };

    const checkHasSave = useCallback((difficulty?: Difficulty) => {
        if (difficulty) return !!localStorage.getItem(getSaveKey(difficulty));
        return hasAnySave();
    }, []);

    /** 删除存档后刷新 hasSave 状态（存档管理界面用） */
    const refreshHasSave = useCallback(() => setHasSave(hasAnySave()), []);

    useEffect(() => {
        setHasSave(hasAnySave());
    }, []);

    // Auto-save on week/phase change（考试进行中不落盘：读档会重考刷分）
    useEffect(() => {
        if (EXAM_PHASES.includes(state.phase) && !state.popupExamResult) return;
        if (state.phase !== Phase.INIT && state.phase !== Phase.ENDING && state.phase !== Phase.SELECTION && state.phase !== Phase.WITHDRAWAL) {
            autoSave(state);
        }
    }, [state.week, state.phase, state.popupExamResult]);

    const advancePhase = useCallback(() => {
        setState(prev => {
            const { nextPhase, weeks } = getNextPhaseInfo(prev.phase);

            return {
                ...prev,
                phase: nextPhase,
                week: 1,
                totalWeeksInPhase: weeks,
                isPlaying: nextPhase !== Phase.ENDING && nextPhase !== Phase.SELECTION && !EXAM_PHASES.includes(nextPhase),
                log: capLog([...prev.log, { message: `进入新阶段: ${PHASE_NAMES[nextPhase] || nextPhase}`, type: 'info', timestamp: Date.now(), week: 1 }]),
                aiBuffer: []
            };
        });
    }, []);

    // --- Achievement Check Effect ---
    useEffect(() => {
        const isEligibleMode = state.difficulty === 'REALITY';
        if (!isEligibleMode) return;

        const newUnlocked: string[] = [];
        const add = (id: string) => {
            if (!state.unlockedAchievements.includes(id) && !newUnlocked.includes(id)) {
                newUnlocked.push(id);
            }
        };

        if (state.general.money >= 200) add('rich');
        if (state.general.money <= -250) add('in_debt');
        if (state.sleepCount >= 10) add('sleep_god');
        if (state.rejectionCount >= 5) add('nice_person');
        if (state.general.health < 10 && state.phase === Phase.SEMESTER_1 && state.week > 10) add('survival');
        if (state.general.health >= 100) add('sports_star');
        if (state.general.mindset <= 0) add('emotional_damage');
        if (state.general.romance >= 80) add('popular');
        if (state.flags.noip_score && state.flags.noip_score >= 195) add('oi_god');

        if (state.examResult) {
            const isAcademic = state.examResult.type === 'ACADEMIC';
            if (isAcademic) {
                if (state.examResult.rank === 1) add('top_rank');
                if (state.examResult.totalStudents && state.examResult.rank === state.examResult.totalStudents) add('bottom_rank');
                const isFullScore = Object.entries(state.examResult.scores).some(([subj, score]) => {
                    const max = ['chinese', 'math', 'english'].includes(subj) ? 150 : 100;
                    return (score as number) >= max;
                });
                if (isFullScore) add('nerd');
            }
        }

        if (newUnlocked.length > 0) {
            const lastId = newUnlocked[newUnlocked.length - 1];
            const globalAch = getGlobalAchievements();
            const merged = Array.from(new Set([...globalAch, ...newUnlocked]));
            localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(merged));

            setState(prev => ({
                ...prev,
                unlockedAchievements: merged,
                achievementPopup: ACHIEVEMENTS[lastId]
            }));

            if (achievementPopupTimerRef.current) clearTimeout(achievementPopupTimerRef.current);
            achievementPopupTimerRef.current = setTimeout(() => setState(prev => ({ ...prev, achievementPopup: null })), 3000);
        }
    }, [state.general, state.sleepCount, state.rejectionCount, state.examResult, state.difficulty, state.unlockedAchievements, state.phase, state.week, state.flags]);

    // --- MAIN GAME LOOP ---
    useEffect(() => {
        if (!state.isPlaying || state.currentEvent || state.isWeekend || state.isAiGenerating) return;

        const processTurn = async () => {
            // Check Project Deadlines
            let failedProjects: Project[] = [];
            let activeProjects = [...state.activeProjects];
            activeProjects = activeProjects.filter(p => {
                if (p.deadlinePhase === state.phase && p.deadlineWeek === state.week) {
                    if (p.progress < p.requiredProgress) {
                        failedProjects.push(p);
                        return false;
                    }
                }
                return true;
            });

            if (failedProjects.length > 0) {
                let updates: Partial<GameState> = { activeProjects };
                let logs: GameLogEntry[] = [];
                failedProjects.forEach(p => {
                    if (p.onFail) {
                        const failEffects = p.onFail(state);
                        updates = { ...updates, ...failEffects };
                    }
                    logs.push({ message: `【课题失败】${p.title} 截止日期已过，未能完成。`, type: 'error', timestamp: Date.now(), week: state.week });
                });
                setState(prev => ({ ...prev, ...updates, log: capLog([...prev.log, ...logs]) }));
                return;
            }

            // 0. Handle Queue first
            if (state.eventQueue.length > 0) {
                const [next, ...rest] = state.eventQueue;
                setState(prev => ({ ...prev, currentEvent: next, eventQueue: rest, isPlaying: false }));
                return;
            }

            // 1. Check Phase Progression
            if (state.totalWeeksInPhase > 0 && state.week > state.totalWeeksInPhase) {
                advancePhase();
                return;
            }

            // 2. Fixed Triggers (Exams) — 由 PHASE_FLOW.examTriggers 数据驱动
            const examTriggers = PHASE_FLOW[state.phase]?.examTriggers || [];
            for (const trigger of examTriggers) {
                if (state.week === trigger.week && (!trigger.condition || trigger.condition(state))) {
                    setState(prev => ({
                        ...prev,
                        phase: trigger.phase,
                        isPlaying: false,
                        triggeredEvents: trigger.markTriggered ? [...prev.triggeredEvents, trigger.markTriggered] : prev.triggeredEvents
                    }));
                    return;
                }
            }

            // 3. Generate Week's Events
            let weekEvents: GameEvent[] = [];
            let phasePool = PHASE_EVENTS[state.phase] || [];
            // AI 事件池懒加载：学期阶段首次推进周时动态加载并并入事件池
            if (state.phase === Phase.SEMESTER_1 || state.phase === Phase.SEMESTER_2) {
                try {
                    phasePool = [...phasePool, ...(await ensureAiEvents())];
                } catch (e) {
                    // chunk 加载失败（如离线且未缓存）：降级为标准事件池，游戏继续
                    console.error('AI 事件池加载失败，本周使用标准事件池', e);
                }
            }

            // Historical Events
            const historicalEvents = getHistoricalEventsForWeek(state);
            if (historicalEvents.length > 0 && state.week % 3 === 0) {
                let newEvents = historicalEvents.filter(he => !state.triggeredEvents.includes(he.id));
                if (newEvents.length > 0) {
                    newEvents = newEvents.sort(() => 0.5 - Math.random()).slice(0, 1);
                    weekEvents.push(newEvents[0]);
                }
            }

            // 3a. Fixed Events
            const pendingFixed = phasePool.filter(e =>
                e.triggerType === 'FIXED' &&
                e.fixedWeek === state.week &&
                (!e.condition || e.condition(state)) &&
                !state.triggeredEvents.includes(e.id)
            );
            weekEvents.push(...pendingFixed);

            // 3a.2 Debt Events (with talent immunity)
            if (state.general.money < 0 && !hasNoDebtEvents(state)) {
                const debt = Math.abs(state.general.money);
                const prob = Math.min(1, Math.sqrt(debt) / 30);
                if (Math.random() < prob && !state.recentEventIds.includes('debt_collection')) {
                    const evt = BASE_EVENTS['debt_collection'];
                    if (evt) weekEvents.push(evt);
                }
            }

            // === AI_STORY BRANCH ===
            if (state.difficulty === 'AI_STORY' && weekEvents.length === 0) {
                if (state.aiBuffer.length > 0) {
                    const [nextAiEvent, ...remainingBuffer] = state.aiBuffer;
                    applyWeeklyUpdates(nextAiEvent, remainingBuffer);
                    return;
                }
                const genToken = aiGenerationTokenRef.current;
                setState(prev => ({ ...prev, isAiGenerating: true, isPlaying: false }));
                try {
                    const aiEvents = await fetchAiEvents(stateRef.current);
                    // 等待期间加载了存档或重开新局：丢弃本次过期结果
                    if (genToken !== aiGenerationTokenRef.current) return;
                    if (aiEvents.length > 0) {
                        const [first, ...rest] = aiEvents;
                        setState(prev => {
                            const { updatedGeneral, updatedStatuses, updatedSubjects } = calculateWeeklyUpdates(prev);
                            return {
                                ...prev,
                                general: updatedGeneral,
                                activeStatuses: updatedStatuses,
                                subjects: updatedSubjects,
                                isAiGenerating: false,
                                currentEvent: first,
                                aiBuffer: rest,
                                isPlaying: false
                            };
                        });
                        return;
                    }
                    setState(prev => ({ ...prev, isAiGenerating: false }));
                } catch (e) {
                    console.error("AI 事件生成异常，降级为本地兜底事件", e);
                    if (genToken !== aiGenerationTokenRef.current) return;
                    // 防御性兜底：即使 api.ts 未拦住意外错误，也保证玩家有事件可点、游戏不卡死
                    const fallback = mapAiEventToGameEvent({
                        title: '灵感枯竭',
                        description: 'AI 事件生成失败，本周没有特别的事情发生。可在设置中检查 API 配置。',
                        type: 'neutral',
                        choices: [
                            { text: '继续', resultDescription: '日子还得过。', effect: {} },
                            { text: '重试', resultDescription: '再试一次，重新生成本周事件。', effect: {}, retry: true }
                        ]
                    });
                    setState(prev => ({ ...prev, isAiGenerating: false, isPlaying: false, currentEvent: fallback }));
                }
            }

            // 3b. Conditional Events
            const conditionalEvents = phasePool.filter(e =>
                e.triggerType === 'CONDITIONAL' &&
                (!e.once || !state.triggeredEvents.includes(e.id)) &&
                e.condition && e.condition(state)
            );
            if (conditionalEvents.length > 0) {
                weekEvents.push(...conditionalEvents);
            }

            // 3c. Regular Events
            // 天赋被动「恋爱事件触发概率」（孤僻 ×0 时完全不出恋爱事件）
            const romancePool = getRomanceEventMultiplier(state) <= 0
                ? []
                : phasePool.filter(e =>
                    e.triggerType === 'RANDOM' &&
                    e.id.startsWith('romance_') &&
                    (!e.once || !state.triggeredEvents.includes(e.id)) &&
                    (!e.condition || e.condition(state)) &&
                    !state.recentEventIds.includes(e.id)
                );
            if (romancePool.length > 0) {
                weekEvents.push(romancePool[Math.floor(Math.random() * romancePool.length)]);
            }

            if (weekEvents.length === 0 || (weekEvents.length <= 1 && weekEvents[0]?.id?.startsWith('romance_'))) {
                const validRandoms = phasePool.filter(e =>
                    e.triggerType === 'RANDOM' &&
                    !e.id.startsWith('romance_') &&
                    (!e.once || !state.triggeredEvents.includes(e.id)) &&
                    (!e.condition || e.condition(state)) &&
                    !state.recentEventIds.includes(e.id)
                );

                if (state.phase === Phase.SUMMER) {
                    if (validRandoms.length > 0 && Math.random() < 0.5) {
                        weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                    } else {
                        weekEvents.push(generateSummerLifeEvent(state));
                    }
                } else if (state.phase === Phase.MILITARY) {
                    if (validRandoms.length > 0) weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                } else if (state.phase === Phase.SEMESTER_1 || state.phase === Phase.SEMESTER_2) {
                    if (state.competition === 'OI') {
                        // OI 事件数据懒加载：首次信竞路线生成前动态加载
                        await ensureOiEvents();
                        const oiCount = Math.floor(Math.random() * 3);
                        const normalCount = Math.floor(Math.random() * 3);
                        const total = Math.max(1, oiCount + normalCount);
                        for (let i = 0; i < oiCount; i++) weekEvents.push(generateOIEvent(state));
                        for (let i = 0; i < total - oiCount; i++) {
                            const roll = Math.random();
                            if (validRandoms.length > 0 && roll < 0.3) weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                            else if (roll < 0.6) weekEvents.push(generateRandomFlavorEvent(state));
                            else weekEvents.push(generateStudyEvent(state));
                        }
                    } else {
                        const eventCount = Math.floor(Math.random() * 3) + 1;
                        for (let i = 0; i < eventCount; i++) {
                            const roll = Math.random();
                            if (validRandoms.length > 0 && roll < 0.3) weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                            else if (roll < 0.6) weekEvents.push(generateRandomFlavorEvent(state));
                            else weekEvents.push(generateStudyEvent(state));
                        }
                    }
                } else {
                    weekEvents.push(Math.random() < 0.7 ? generateStudyEvent(state) : generateRandomFlavorEvent(state));
                }
            }

            const eventsToMark = weekEvents
                .filter(e => e.once || e.triggerType === 'FIXED')
                .map(e => e.id);

            const [first, ...rest] = weekEvents;

            if (first) {
                applyWeeklyUpdates(first, rest, eventsToMark);
            } else {
                startWeekend();
            }
        };

        const timer = setTimeout(processTurn, SPEED_DELAYS[gameSpeed]);
        return () => clearTimeout(timer);
    }, [state.isPlaying, state.currentEvent, state.isWeekend, state.week, state.phase, state.eventQueue.length, state.midtermRank, advancePhase, state.competition, state.triggeredEvents, state.isAiGenerating, state.aiBuffer, state.recentEventIds, gameSpeed]);

    const applyWeeklyUpdates = (currentEvent: GameEvent, nextQueue: GameEvent[] = [], newTriggeredEvents: string[] = []) => {
        setState(prev => {
            const { updatedGeneral, updatedStatuses, updatedSubjects } = calculateWeeklyUpdates(prev);
            const healthDrain = prev.phase === Phase.SEMESTER_1 || prev.phase === Phase.SEMESTER_2 ? 2 : 1;

            let newRecentIds = [...prev.recentEventIds];
            if (currentEvent.triggerType === 'RANDOM') {
                newRecentIds.push(currentEvent.id);
                if (newRecentIds.length > 4) newRecentIds.shift();
            }

            if (Math.max(0, prev.general.health - healthDrain) <= 0) {
                return {
                    ...prev,
                    general: { ...updatedGeneral, health: 0 },
                    phase: Phase.ENDING,
                    currentEvent: null,
                    eventQueue: [],
                    isPlaying: false,
                    log: capLog([...prev.log, { message: '【猝死】你的健康值降到了0以下，身体再也承受不住了...游戏结束。', type: 'error', timestamp: Date.now(), week: prev.week }])
                };
            }

            // Weekly learning feedback
            let weeklyLog = [...prev.log];
            if ((prev.phase === Phase.SEMESTER_1 || prev.phase === Phase.SEMESTER_2) && prev.week > 0 && prev.week % 4 === 0) {
                const subs = prev.selectedSubjects.length > 0 ? prev.selectedSubjects : ['math', 'chinese', 'english'] as SubjectKey[];
                const totalLevel = subs.reduce((sum, k) => sum + prev.subjects[k].level, 0);
                const avgLevel = totalLevel / subs.length;
                let feedback = '';
                if (avgLevel < 10) feedback = '你对课程内容还很陌生，需要花时间打好基础。';
                else if (avgLevel < 25) feedback = '你开始慢慢跟上节奏了，继续努力。';
                else if (avgLevel < 45) feedback = '知识体系逐渐成形，解题时越来越有感觉。';
                else if (avgLevel < 70) feedback = '你已经进入了高分段，各科都有不错的积累。';
                else feedback = '你的学识已经超出了高中范围，开始思考更深层的问题。';
                weeklyLog = capLog([...weeklyLog, { message: `📋 第${prev.week}周学习小结：${feedback}`, type: 'info', timestamp: Date.now(), week: prev.week }]);
            }

            return {
                ...prev,
                activeStatuses: updatedStatuses,
                general: updatedGeneral,
                subjects: updatedSubjects,
                currentEvent: currentEvent,
                eventQueue: nextQueue,
                triggeredEvents: [...prev.triggeredEvents, ...newTriggeredEvents],
                recentEventIds: newRecentIds,
                isPlaying: false,
                log: weeklyLog,
                aiBuffer: prev.difficulty === 'AI_STORY'
                    ? prev.aiBuffer.filter((e: GameEvent) => e.id !== currentEvent.id && !nextQueue.some(q => q.id === e.id))
                    : prev.aiBuffer
            };
        });
    };

    const startWeekend = () => {
        if (stateRef.current.phase === Phase.ENDING || stateRef.current.phase === Phase.WITHDRAWAL) return;
        setState(prev => {
            let availableIds = undefined;
            if (prev.difficulty === 'REALITY') {
                const validActivities = WEEKEND_ACTIVITIES.filter(a => !a.condition || a.condition(prev));
                let validIds = validActivities.map(a => a.id);
                for (let i = validIds.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [validIds[i], validIds[j]] = [validIds[j], validIds[i]];
                }
                availableIds = validIds.slice(0, 6);
            }

            return {
                ...prev,
                currentEvent: null,
                eventResult: null,
                isWeekend: true,
                isPlaying: false,
                availableWeekendActivityIds: availableIds
            };
        });
    };

    const autoSave = (s: GameState) => {
        const key = getSaveKey(s.difficulty);
        try {
            localStorage.setItem(key, JSON.stringify(buildSaveData(s)));
            setHasSave(true);
        } catch (e) {
            console.error('Save failed:', e);
        }
    };

    const saveGame = useCallback(() => {
        const state = stateRef.current;
        // 考试进行中无法存档：考试过程不支持恢复，落盘等于允许读档重考
        if (EXAM_PHASES.includes(state.phase) && !state.popupExamResult) {
            setState(s => ({ ...s, log: [...s.log, { message: "考试进行中，无法保存。考试结束后会自动保存。", type: 'warning', timestamp: Date.now(), week: s.week }] }));
            return;
        }
        autoSave(state);
        setState(s => ({ ...s, log: [...s.log, { message: "游戏进度已保存。", type: 'success', timestamp: Date.now(), week: s.week }] }));
    }, []);

    /** 校验并应用一份存档数据（localStorage 读取或导入文件共用） */
    const applyLoadedState = (loaded: GameState, announce?: string) => {
        // 作废进行中的 AI 生成：其结果基于旧状态，会覆盖刚加载的存档
        aiGenerationTokenRef.current++;
        const globalAchievements = getGlobalAchievements();
        const mergedAchievements = Array.from(new Set([...(loaded.unlockedAchievements || []), ...globalAchievements]));
        if (loaded.worldContext) {
            loadCityEvents(loaded.worldContext.code, loaded.worldContext.region);
        }
        const log = announce
            ? [...(loaded.log || []), { message: announce, type: 'success', timestamp: Date.now(), week: loaded.week }]
            : loaded.log;
        setState({
            ...loaded,
            isAiGenerating: false,
            unlockedAchievements: mergedAchievements,
            log
        });
    };

    const loadGame = useCallback((difficulty?: Difficulty): boolean => {
        let saved: string | null = null;
        if (difficulty) {
            saved = localStorage.getItem(getSaveKey(difficulty));
        } else {
            const latestKey = getLatestSaveKey();
            saved = latestKey ? localStorage.getItem(latestKey) : null;
        }
        if (saved) {
            try {
                const normalized = normalizeLoadedState(JSON.parse(saved));
                if (!normalized) {
                    console.error("Save data corrupted");
                    return false;
                }
                applyLoadedState(normalized);
                return true;
            } catch (e) {
                console.error("Failed to load save", e);
                return false;
            }
        }
        return false;
    }, []);

    /** 导出当前进度为 JSON 文件，玩家自己保管，可随时导入回滚 */
    const exportSave = useCallback(() => {
        const state = stateRef.current;
        // 考试进行中无法导出：导出文件导入后会重考刷分
        if (EXAM_PHASES.includes(state.phase) && !state.popupExamResult) {
            setState(s => ({ ...s, log: [...s.log, { message: "考试进行中，无法导出。考试结束后会自动保存。", type: 'warning', timestamp: Date.now(), week: s.week }] }));
            return;
        }
        const data = buildSaveData(state);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `八中重开模拟器-存档-${data.difficulty}-第${data.week}周.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setState(s => ({ ...s, log: [...s.log, { message: '存档已导出为文件，请妥善保存。', type: 'success', timestamp: Date.now(), week: s.week }] }));
    }, []);

    /** 导入存档文件并加载，返回是否成功（结果会写入日志） */
    const importSave = useCallback(async (file: File): Promise<boolean> => {
        try {
            const text = await file.text();
            const normalized = normalizeLoadedState(JSON.parse(text));
            if (!normalized) {
                setState(s => ({ ...s, log: [...s.log, { message: '导入失败：文件不是有效的存档。', type: 'error', timestamp: Date.now(), week: s.week }] }));
                return false;
            }
            applyLoadedState(normalized, `存档已导入：${normalized.difficulty} 难度，第 ${normalized.week} 周。`);
            setHasSave(true);
            return true;
        } catch (e) {
            console.error("Failed to import save", e);
            setState(s => ({ ...s, log: [...s.log, { message: '导入失败：文件解析出错。', type: 'error', timestamp: Date.now(), week: s.week }] }));
            return false;
        }
    }, []);

    const startGameState = (difficulty: Difficulty, customStats: GeneralStats, selectedTalents: Talent[]) => {
        // 作废进行中的 AI 生成：其结果是基于旧局的
        aiGenerationTokenRef.current++;
        let initialGeneral = { ...DIFFICULTY_PRESETS['NORMAL'].stats };
        const effectiveDifficulty = difficulty === 'CUSTOM' ? 'NORMAL' : difficulty;

        if (difficulty === 'CUSTOM') {
            initialGeneral = { ...customStats };
        } else if (difficulty === 'AI_STORY') {
            initialGeneral = DIFFICULTY_PRESETS['AI_STORY'] ? { ...DIFFICULTY_PRESETS['AI_STORY'].stats } : { ...DIFFICULTY_PRESETS['NORMAL'].stats };
        } else {
            initialGeneral = { ...DIFFICULTY_PRESETS[effectiveDifficulty].stats };
        }

        let initialStatuses: GameStatus[] = [];
        if (effectiveDifficulty === 'REALITY') {
            initialStatuses.push({ ...STATUSES['anxious'], duration: 4 });
        }

        const rolledSubjects = getInitialSubjects();
        (Object.keys(rolledSubjects) as SubjectKey[]).forEach(k => {
            rolledSubjects[k] = { aptitude: Math.floor(Math.random() * 40 + 60), level: Math.floor(Math.random() * 10 + 5) };
            if (effectiveDifficulty === 'NORMAL' || difficulty === 'AI_STORY') { rolledSubjects[k].aptitude += 15; rolledSubjects[k].level += 5; }
        });

        const globalAchievements = getGlobalAchievements();

        const worldContext = getRandomWorldContext();
        loadCityEvents(worldContext.code, worldContext.region);
        const charTemplate = CHARACTER_TEMPLATES.find(t => t.id === worldContext.characterTemplateId);

        if (charTemplate && charTemplate.baseStatsModifier) {
            Object.keys(charTemplate.baseStatsModifier).forEach(key => {
                const k = key as keyof GeneralStats;
                initialGeneral[k] = (initialGeneral[k] || 0) + (charTemplate.baseStatsModifier[k] || 0);
            });
        }

        let tempState: GameState = {
            ...getInitialGameState(),
            worldContext,
            subjects: rolledSubjects,
            general: initialGeneral,
            initialGeneral: { ...initialGeneral },
            activeStatuses: initialStatuses,
            talents: selectedTalents,
            oiStats: getInitialOIStats(),
            difficulty: difficulty,
            unlockedAchievements: globalAchievements
        };

        selectedTalents.forEach(t => {
            if (t.effect) {
                const updates = t.effect(tempState);
                if (updates.general) tempState.general = { ...tempState.general, ...updates.general };
                if (updates.subjects) tempState.subjects = { ...tempState.subjects, ...updates.subjects };
                if (updates.oiStats) tempState.oiStats = { ...tempState.oiStats, ...updates.oiStats };
            }
        });
        tempState.initialGeneral = { ...tempState.general };

        const firstEvent = PHASE_EVENTS[Phase.SUMMER].find(e => e.id === 'sum_goal_selection');
        setState({
            ...tempState,
            unlockedAchievements: tempState.unlockedAchievements,
            phase: Phase.SUMMER,
            week: 1,
            totalWeeksInPhase: 8,
            currentEvent: firstEvent || null,
            triggeredEvents: firstEvent ? [firstEvent.id] : [],
            log: [{ message: "八中模拟器启动。", type: 'success', timestamp: Date.now(), week: 1 }],
            isPlaying: false
        });

        if (!tempState.unlockedAchievements.includes('first_blood') && difficulty === 'REALITY') {
            if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
            if (achievementPopupTimerRef.current) clearTimeout(achievementPopupTimerRef.current);
            achievementTimerRef.current = setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    unlockedAchievements: [...prev.unlockedAchievements, 'first_blood'],
                    achievementPopup: ACHIEVEMENTS['first_blood']
                }));
                const globalAch = getGlobalAchievements();
                localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(Array.from(new Set([...globalAch, 'first_blood']))));
                achievementPopupTimerRef.current = setTimeout(() => setState(prev => ({ ...prev, achievementPopup: null })), 3000);
            }, 100);
        }
    };

    const handleChoice = useCallback((choice: EventChoice, visualizer?: (oldS: GameState, newS: GameState) => string[]) => {
        // AI 生成失败的重试选项：不消耗进度、不记入故事线，直接重新生成本周事件
        if (choice.retry) {
            const genToken = aiGenerationTokenRef.current;
            setState(prev => ({ ...prev, currentEvent: null, eventResult: null, isPlaying: false, isAiGenerating: true }));
            fetchAiEvents(stateRef.current).then(aiEvents => {
                if (genToken !== aiGenerationTokenRef.current) return;
                if (aiEvents.length > 0) {
                    const [first, ...rest] = aiEvents;
                    setState(prev => ({ ...prev, isAiGenerating: false, currentEvent: first, aiBuffer: rest }));
                } else {
                    setState(prev => ({ ...prev, isAiGenerating: false, isPlaying: true }));
                }
            }).catch(() => {
                if (genToken !== aiGenerationTokenRef.current) return;
                setState(prev => ({ ...prev, isAiGenerating: false, isPlaying: true }));
            });
            return;
        }

        const state = stateRef.current;
        const oldState = { ...state };
        let updates = choice.action(state);

        // Apply talent passives to stat deltas
        updates = applyTalentPassivesToUpdates(state, updates);

        if (choice.nextEventId && CHAINED_EVENTS[choice.nextEventId]) {
            updates.chainedEvent = CHAINED_EVENTS[choice.nextEventId];
        }

        const newState = { ...state, ...updates };
        const diff = visualizer ? visualizer(oldState, newState) : [];

        const entry: StoryEntry = {
            week: state.week,
            phase: state.phase,
            eventTitle: state.currentEvent?.title || '未知事件',
            choiceText: choice.text,
            resultSummary: choice.resultDescription || '无',
            timestamp: Date.now()
        };

        setState(prev => ({ ...prev, ...updates, log: capLog(stampNewLogWeeks(prev.log, updates.log, prev.week)), history: [...prev.history, entry], eventResult: { choice, diff } }));
    }, []);

    const handleEventConfirm = useCallback(() => {
        const state = stateRef.current;
        const miniGameId = state.currentEvent?.miniGameId;

        if (state.chainedEvent) {
            setState(prev => ({ ...prev, currentEvent: prev.chainedEvent, chainedEvent: null, eventResult: null }));
            return;
        }

        if (state.eventQueue.length > 0) {
            setState(prev => {
                const [next, ...rest] = prev.eventQueue;
                return { ...prev, currentEvent: next, eventQueue: rest, eventResult: null, activeMiniGame: miniGameId || prev.activeMiniGame };
            });
            return;
        }

        const skipWeekend = state.phase === Phase.SUMMER || state.phase === Phase.MILITARY;
        if (skipWeekend) {
            setState(prev => {
                return {
                    ...prev,
                    currentEvent: null,
                    eventResult: null,
                    isWeekend: false,
                    week: prev.week + 1,
                    isPlaying: !miniGameId,
                    activeMiniGame: miniGameId || prev.activeMiniGame
                };
            });
            return;
        }

        if (miniGameId) {
            setState(prev => ({ ...prev, currentEvent: null, eventResult: null, isPlaying: false, activeMiniGame: miniGameId }));
            return;
        }

        startWeekend();
    }, []);

    const handleClubSelect = useCallback((id: ClubId | 'none') => {
        setState(prev => ({
            ...prev,
            club: id === 'none' ? null : id,
            hasSelectedClub: true
        }));
    }, []);

    const handleShopPurchase = useCallback((item: Item, effectVisualizer: () => void) => {
        const state = stateRef.current;
        const multiplier = getShopPriceMultiplier(state);
        const actualPrice = Math.floor(item.price * multiplier);
        if (state.general.money < actualPrice) return;

        // 余额校验与结算移入函数式更新：同一渲染帧内连点两次也不会重复扣款/重复结算
        setState(prev => {
            if (prev.general.money < actualPrice) return prev;
            const updates = item.effect(prev);
            const priceDiff = item.price - actualPrice;
            if (priceDiff !== 0 && updates.general) {
                updates.general.money = (updates.general.money ?? prev.general.money) + priceDiff;
            }
            // 商店购买同样遵守天赋带来的属性上限/下限（如体弱多病的健康上限）
            applyStatCaps(prev, updates);
            return { ...prev, ...updates, log: stampNewLogWeeks(prev.log, updates.log, prev.week) };
        });
        effectVisualizer();
    }, []);

    const executeTimetable = useCallback((schedule: Record<string, string>) => {
        const state = stateRef.current;
        let currentState = { ...state };
        let results = [];

        const activityMap = new Map(WEEKEND_ACTIVITIES.map(a => [a.id, a]));
        const batchLogs: typeof state.log = [];

        for (const [slotId, actId] of Object.entries(schedule)) {
            const activity = activityMap.get(actId);
            if (!activity) continue;

            const oldS = { ...currentState };
            let updates = activity.action(oldS);
            // 周末课表活动同样套用天赋被动加成与属性上限（与事件选择/商店一致）
            updates = applyTalentPassivesToUpdates(oldS, updates);
            let resultText = typeof activity.resultText === 'function' ? activity.resultText(oldS) : activity.resultText;

            if (updates.log) {
                // action 返回的 log 是全量数组，只取尾部新增条目（避免历史日志重复），并盖上当前周数
                const newEntries = updates.log.slice(oldS.log.length).map(l => ({ ...l, week: l.week ?? oldS.week }));
                batchLogs.push(...newEntries);
                delete updates.log;
            }
            currentState = { ...currentState, ...updates };
            if (resultText) results.push(`[${slotId}] ${resultText}`);
        }
        currentState.log = capLog([...(currentState.log || []), ...batchLogs]);

        currentState.week += 1;
        currentState.isPlaying = true;

        currentState.lastWeekSchedule = schedule;
        currentState.isWeekend = false;

        setState(prev => ({ ...prev, ...currentState }));
    }, []);

    const handleExamFinish = useCallback((result: ExamResult) => {
        const state = stateRef.current;
        const rank = calculateRank(result.totalScore, state.phase);
        const isOI = ALL_OI_PHASES.includes(state.phase);
        const resultWithRank: ExamResult = { ...result, rank: isOI ? undefined : rank, type: isOI ? 'COMPETITION' : 'ACADEMIC' };

        let newClassName = state.className;
        if (state.phase === Phase.PLACEMENT_EXAM) {
            if (rank <= 160) newClassName = "一类实验班";
            else if (rank <= 380) newClassName = "二类实验班";
            else newClassName = "普通班";
        }

        let newFlags = { ...state.flags };
        if (state.phase === Phase.CSP_EXAM) newFlags.csp_score = result.totalScore;
        else if (state.phase === Phase.NOIP_EXAM) newFlags.noip_score = result.totalScore;
        else if (state.phase === Phase.WC_EXAM) newFlags.wc_score = result.totalScore;
        else if (state.phase === Phase.PROVINCIAL_EXAM) newFlags.provincial_score = result.totalScore;
        else if (state.phase === Phase.APIO_EXAM) newFlags.apio_score = result.totalScore;
        else if (state.phase === Phase.NOI_EXAM) newFlags.noi_score = result.totalScore;

        setState(prev => ({
            ...prev,
            examResult: resultWithRank,
            popupExamResult: resultWithRank,
            midtermRank: state.phase === Phase.MIDTERM_EXAM ? 'SEMESTER_1_DONE' : (state.phase === Phase.MIDTERM_EXAM_2 ? 'SEMESTER_2_DONE' : prev.midtermRank),
            className: newClassName,
            flags: newFlags
        }));
    }, []);

    const closeCompetitionPopup = useCallback(() => {
        setState(prev => ({ ...prev, popupCompetitionResult: null, isPlaying: false }));
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isPlaying: true }));
        }, 500);
    }, []);

    const closeExamResult = useCallback(() => {
        setState(prev => {
            const flow = getPhaseResultInfo(prev.phase);
            const nextState = { ...prev, popupExamResult: null, isPlaying: false };

            // 无结算去向的阶段（不应出现）：仅关闭弹窗
            if (!flow) return nextState;

            const week = flow.resultWeek === '+1' ? prev.week + 1
                : typeof flow.resultWeek === 'number' ? flow.resultWeek
                : prev.week;

            let eventQueue = prev.eventQueue;
            if (flow.resultQueueEventId) {
                const resultEvent = OI_EVENTS_POOL.find((e: GameEvent) => e.id === flow.resultQueueEventId);
                if (resultEvent) eventQueue = [...prev.eventQueue, resultEvent];
            }

            return {
                ...nextState,
                phase: flow.resultPhase!,
                week,
                totalWeeksInPhase: flow.resultWeeks ?? prev.totalWeeksInPhase,
                eventQueue
            };
        });
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isPlaying: true }));
        }, 500);
    }, []);

    const closeMiniGame = useCallback((res?: Partial<GameState>) => {
        setState(prev => {
            const next = { ...prev, activeMiniGame: null, ...res };
            const skipWeekend = next.phase === Phase.SUMMER || next.phase === Phase.MILITARY;
            if (skipWeekend) {
                return { ...next, week: next.week + 1, isPlaying: false };
            }
            return next;
        });

        if (stateRef.current.phase !== Phase.SUMMER && stateRef.current.phase !== Phase.MILITARY) {
            setTimeout(() => startWeekend(), 0);
        }
    }, []);

    return {
        state, setState, hasSave, checkHasSave, refreshHasSave, saveGame, loadGame, gameSpeed, setGameSpeed,
        exportSave, importSave,
        startGameState, handleChoice, handleEventConfirm, handleClubSelect, handleShopPurchase,
        executeTimetable, handleExamFinish, closeCompetitionPopup, closeExamResult, closeMiniGame
    };
};
