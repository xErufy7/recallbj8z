
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    GameState, Difficulty, GeneralStats, Talent, Challenge,
    Phase, GameStatus, SubjectKey, OIStats, GameEvent,
    EventChoice, ExamResult, ClubId, Item, WeekendActivity, Project, GameLogEntry, StoryEntry
} from '../types';
import { DIFFICULTY_PRESETS } from '../data/constants';
import { PHASE_EVENTS, BASE_EVENTS, CHAINED_EVENTS, generateSummerLifeEvent, generateStudyEvent, generateOIEvent, generateRandomFlavorEvent } from '../data/events';
import { WEEKEND_ACTIVITIES, STATUSES, ACHIEVEMENTS } from '../data/mechanics';
import { modifyOI, modifySub, mapAiEventToGameEvent, getActiveTalentPassives, applyEfficiencyPassive, applyMoneyPassive, applyRomancePassive, applyHealthRecoveryPassive, applyExperiencePassive, applyStatCaps, getShopPriceMultiplier, hasNoWeeklyMoney, hasNoDebtEvents } from '../data/utils';
import { generateBatchGameEvents } from '../lib/api';
import { getRandomWorldContext, CHARACTER_TEMPLATES } from '../data/world_context';
import { getHistoricalEventsForWeek, loadCityEvents } from '../data/historical_events';
import { OI_EVENTS_POOL } from '../data/events_oi';

const STORAGE_KEY_PREFIX = 'recall_save_v3';
export const ACHIEVEMENTS_KEY = 'recall_achievements_global';

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

const getSaveKey = (difficulty?: Difficulty) => `${STORAGE_KEY_PREFIX}_${difficulty || 'unknown'}`;

const getAllSaveKeys = (): string[] => {
    try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
        }
        return keys;
    } catch { return []; }
};

const hasAnySave = (): boolean => getAllSaveKeys().length > 0;

const getInitialSubjects = (): Record<SubjectKey, { aptitude: number; level: number }> => ({
    chinese: { aptitude: 0, level: 0 },
    math: { aptitude: 0, level: 0 },
    english: { aptitude: 0, level: 0 },
    physics: { aptitude: 0, level: 0 },
    chemistry: { aptitude: 0, level: 0 },
    biology: { aptitude: 0, level: 0 },
    history: { aptitude: 0, level: 0 },
    geography: { aptitude: 0, level: 0 },
    politics: { aptitude: 0, level: 0 }
});

const getInitialOIStats = (): OIStats => ({
    dp: 0, ds: 0, math: 0, string: 0, graph: 0, misc: 0
});

const getGlobalAchievements = (): string[] => {
    try {
        const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error loading global achievements", e);
        return [];
    }
};

const getInitialGameState = (): GameState => ({
    activeProjects: [],
    completedProjects: [],
    flags: {},
    isPlaying: false,
    isAiGenerating: false,
    eventQueue: [],
    aiBuffer: [],
    pendingHistoricalEvents: [],
    recentEventIds: [],
    phase: Phase.INIT,
    week: 1,
    totalWeeksInPhase: 0,
    subjects: getInitialSubjects(),
    general: { mindset: 50, experience: 0, luck: 50, romance: 0, health: 100, money: 0, efficiency: 10 },
    initialGeneral: { mindset: 50, experience: 0, luck: 50, romance: 0, health: 100, money: 0, efficiency: 10 },
    oiStats: getInitialOIStats(),
    selectedSubjects: [],
    competition: 'None',
    club: null,
    hasSelectedClub: false,
    romancePartner: null,
    className: '',
    log: [],
    currentEvent: null,
    chainedEvent: null,
    eventResult: null,
    history: [],
    examResult: null,
    midtermRank: null,
    competitionResults: [],
    popupCompetitionResult: null,
    popupExamResult: null,
    triggeredEvents: [],
    isSick: false,
    isGrounded: false,
    debugMode: false,
    activeStatuses: [],
    unlockedAchievements: [],
    achievementPopup: null,
    difficulty: 'NORMAL',
    activeChallengeId: null,
    isWeekend: false,
    weekendActionPoints: 0,
    lastWeekSchedule: {},
    lastHistoricalWeek: -3,
    weekendProcessed: false,
    activeMiniGame: null,
    sleepCount: 0,
    rejectionCount: 0,
    talents: [],
    inventory: [],
    theme: 'light',
    hasSleptThisWeek: false,
    dreamtExam: false,
    availableWeekendActivityIds: undefined
});

/**
 * 给事件 action 返回的新日志条目盖上生成时的周数。
 * action 返回的 log 是"旧日志 + 新条目"的全量数组，只对多出来的尾部新条目打戳，
 * 避免覆盖历史条目的 week（旧存档条目可能没有 week 字段，保持原样）。
 */
const stampNewLogWeeks = (prevLog: GameLogEntry[], nextLog: GameLogEntry[] | undefined, week: number): GameLogEntry[] => {
    if (!nextLog) return prevLog;
    const newCount = nextLog.length - prevLog.length;
    if (newCount <= 0) return nextLog;
    const stamped = nextLog.slice(prevLog.length).map(l => ({ ...l, week: l.week ?? week }));
    return [...nextLog.slice(0, prevLog.length), ...stamped];
};

export const useGameLogic = () => {
    const [state, setState] = useState<GameState>(() => {
        const initial = getInitialGameState();
        const globalAchievements = getGlobalAchievements();
        return { ...initial, unlockedAchievements: globalAchievements };
    });

    const achievementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const achievementPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [weekendResult, setWeekendResult] = useState<{ activity: WeekendActivity; resultText: string; diff: string[] } | null>(null);
    const [hasSave, setHasSave] = useState(false);

    const checkHasSave = useCallback((difficulty?: Difficulty) => {
        if (difficulty) return !!localStorage.getItem(getSaveKey(difficulty));
        return hasAnySave();
    }, []);

    useEffect(() => {
        setHasSave(hasAnySave());
    }, []);

    // Auto-save on week/phase change
    useEffect(() => {
        if (state.phase !== Phase.INIT && state.phase !== Phase.ENDING && state.phase !== Phase.SELECTION && state.phase !== Phase.WITHDRAWAL) {
            autoSave(state);
        }
    }, [state.week, state.phase]);

    const advancePhase = useCallback(() => {
        setState(prev => {
            let nextPhase = Phase.SEMESTER_1;
            let weeks = 21;
            const currentPhase = prev.phase;

            switch (currentPhase) {
                case Phase.INIT: nextPhase = Phase.SUMMER; weeks = 8; break;
                case Phase.SUMMER: nextPhase = Phase.MILITARY; weeks = 2; break;
                case Phase.MILITARY: nextPhase = Phase.SELECTION; weeks = 0; break;
                case Phase.SELECTION: nextPhase = Phase.PLACEMENT_EXAM; weeks = 0; break;
                case Phase.PLACEMENT_EXAM: nextPhase = Phase.SEMESTER_1; weeks = 21; break;
                case Phase.MIDTERM_EXAM: nextPhase = Phase.SUBJECT_RESELECTION; weeks = 0; break;
                case Phase.SUBJECT_RESELECTION: nextPhase = Phase.SEMESTER_1; weeks = 21; break;
                case Phase.SEMESTER_1: nextPhase = Phase.FINAL_EXAM; weeks = 0; break;
                case Phase.FINAL_EXAM: nextPhase = Phase.WINTER_BREAK; weeks = 5; break;
                case Phase.WINTER_BREAK: nextPhase = Phase.SEMESTER_2; weeks = 21; break;
                case Phase.MIDTERM_EXAM_2: nextPhase = Phase.SEMESTER_2; weeks = 21; break;
                case Phase.SEMESTER_2: nextPhase = Phase.FINAL_EXAM_2; weeks = 0; break;
                case Phase.FINAL_EXAM_2: nextPhase = Phase.SUMMER_BREAK; weeks = 8; break;
                case Phase.SUMMER_BREAK: nextPhase = Phase.ENDING; weeks = 0; break;
                default: nextPhase = Phase.ENDING; weeks = 0;
            }

            return {
                ...prev,
                phase: nextPhase,
                week: 1,
                totalWeeksInPhase: weeks,
                isPlaying: nextPhase !== Phase.ENDING && nextPhase !== Phase.SELECTION && nextPhase !== Phase.FINAL_EXAM && nextPhase !== Phase.FINAL_EXAM_2 && nextPhase !== Phase.PLACEMENT_EXAM,
                log: [...prev.log, { message: `进入新阶段: ${PHASE_NAMES[nextPhase] || nextPhase}`, type: 'info', timestamp: Date.now(), week: 1 }],
                aiBuffer: []
            };
        });
    }, []);

    // --- Achievement Check Effect ---
    useEffect(() => {
        const isEligibleMode = state.difficulty === 'REALITY' || !!state.activeChallengeId;
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
    }, [state.general, state.sleepCount, state.rejectionCount, state.examResult, state.difficulty, state.unlockedAchievements, state.phase, state.activeChallengeId]);

    // --- MAIN GAME LOOP ---
    useEffect(() => {
        if (!state.isPlaying || state.currentEvent || state.isWeekend || state.weekendProcessed || state.isAiGenerating) return;

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
                setState(prev => ({ ...prev, ...updates, log: [...prev.log, ...logs] }));
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

            // 2. Fixed Triggers (Exams)
            if (state.phase === Phase.SEMESTER_1 && state.week === 7 && state.competition === 'OI' && !state.triggeredEvents.includes('csp_exam_trigger')) {
                setState(prev => ({ ...prev, phase: Phase.CSP_EXAM, isPlaying: false, triggeredEvents: [...prev.triggeredEvents, 'csp_exam_trigger'] }));
                return;
            }
            if (state.phase === Phase.SEMESTER_2 && state.week === 11 && state.midtermRank !== 'SEMESTER_2_DONE') {
                setState(prev => ({ ...prev, phase: Phase.MIDTERM_EXAM_2, isPlaying: false }));
                return;
            }
            if (state.phase === Phase.SEMESTER_1 && state.week === 11 && state.midtermRank !== 'SEMESTER_1_DONE') {
                setState(prev => ({ ...prev, phase: Phase.MIDTERM_EXAM, isPlaying: false }));
                return;
            }
            if (state.phase === Phase.SEMESTER_1 && state.week === 13 && state.competition === 'OI' && !state.triggeredEvents.includes('noip_exam_trigger')) {
                setState(prev => ({ ...prev, phase: Phase.NOIP_EXAM, isPlaying: false, triggeredEvents: [...prev.triggeredEvents, 'noip_exam_trigger'] }));
                return;
            }

            // 3. Generate Week's Events
            let weekEvents: GameEvent[] = [];
            const phasePool = PHASE_EVENTS[state.phase] || [];

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
                setState(prev => ({ ...prev, isAiGenerating: true, isPlaying: false }));
                try {
                    const aiEventsJson = await generateBatchGameEvents(state);
                    const aiEvents = aiEventsJson.map(mapAiEventToGameEvent).filter((e: GameEvent) => e.choices && e.choices.length > 0);
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
                    console.error("Fallback to standard events", e);
                    setState(prev => ({ ...prev, isAiGenerating: false }));
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
            const romancePool = phasePool.filter(e =>
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
                    if (state.flags?.joined_evening_study && Math.random() < 0.5) {
                        const eveningEvents = validRandoms.filter(e => e.id.includes('evening_'));
                        if (eveningEvents.length > 0) weekEvents.push(eveningEvents[Math.floor(Math.random() * eveningEvents.length)]);
                    }
                } else {
                    weekEvents.push(Math.random() < 0.7 ? generateStudyEvent(state) : generateRandomFlavorEvent(state));
                }
            }

            const eventsToMark = weekEvents
                .filter(e => (e.once || e.triggerType === 'FIXED') && e.id !== 'debt_collection')
                .map(e => e.id);

            const [first, ...rest] = weekEvents;

            if (first) {
                applyWeeklyUpdates(first, rest, eventsToMark);
            } else {
                startWeekend();
            }
        };

        const timer = setTimeout(processTurn, 1000);
        return () => clearTimeout(timer);
    }, [state.isPlaying, state.currentEvent, state.isWeekend, state.week, state.phase, state.eventQueue.length, state.midtermRank, advancePhase, state.competition, state.triggeredEvents, state.isAiGenerating, state.aiBuffer, state.recentEventIds]);

    const calculateWeeklyUpdates = (prevState: GameState) => {
        const passives = getActiveTalentPassives(prevState);
        let moneyChange = hasNoWeeklyMoney(prevState) ? 0 : 1 * (passives.moneyGainMultiplier ?? 1);
        if (prevState.activeChallengeId === 'c_debt_king') moneyChange -= 25;

        const currentMoney = prevState.general.money;
        let debtLevel = 0;
        if (currentMoney < -800) debtLevel = 5;
        else if (currentMoney < -350) debtLevel = 4;
        else if (currentMoney < -180) debtLevel = 3;
        else if (currentMoney < -80) debtLevel = 2;
        else if (currentMoney < 0) debtLevel = 1;

        let statusMindset = 0, statusEfficiency = 0, statusRomance = 0, statusHealth = 0, statusLuck = 0, statusExperience = 0;
        let newStatuses: GameStatus[] = [];

        for (const st of prevState.activeStatuses) {
            if (st.id.startsWith('debt_')) continue;
            const newDuration = st.duration - 1;
            if (newDuration <= 0) continue;
            newStatuses.push({ ...st, duration: newDuration });
            switch (st.id) {
                case 'anxious': statusMindset -= 2; break;
                case 'crush': statusEfficiency -= 2; statusRomance += 2; break;
                case 'in_love': statusMindset += 5; break;
                case 'heartbroken': statusMindset -= 3; statusEfficiency -= 1; break;
                case 'focused': statusEfficiency += 1; break;
                case 'crush_pending': statusLuck += 2; statusExperience += 2; break;
                case 'exhausted': break;
            }
        }

        let penaltyMindset = 0, penaltyRomance = 0;
        if (debtLevel > 0) {
            newStatuses.push({ ...STATUSES[`debt_${debtLevel}`], duration: 1 });
            if (debtLevel === 1) { penaltyMindset = 5; penaltyRomance = 3; }
            if (debtLevel === 2) { penaltyMindset = 10; penaltyRomance = 6; }
            if (debtLevel === 3) { penaltyMindset = 20; penaltyRomance = 12; }
            if (debtLevel === 4) { penaltyMindset = 40; penaltyRomance = 24; }
            if (debtLevel === 5) { penaltyMindset = 80; penaltyRomance = 48; }
        }

        const healthDrain = prevState.phase === Phase.SEMESTER_1 || prevState.phase === Phase.SEMESTER_2 ? 2 : 1;

        const updatedGeneral = {
            ...prevState.general,
            money: prevState.general.money + moneyChange,
            mindset: Math.max(0, prevState.general.mindset + statusMindset - penaltyMindset),
            efficiency: Math.max(1, prevState.general.efficiency + statusEfficiency),
            romance: Math.max(0, prevState.general.romance + statusRomance - penaltyRomance),
            health: Math.max(0, prevState.general.health + statusHealth - healthDrain),
            luck: Math.max(0, prevState.general.luck + statusLuck),
            experience: Math.max(0, prevState.general.experience + statusExperience)
        };

        // Regression toward baseline
        const regress = (val: number, baseline: number, rate: number = 0.05) => {
            const diff = val - baseline;
            return Math.min(150, Math.max(0, val - diff * rate));
        };
        updatedGeneral.mindset = regress(updatedGeneral.mindset, 50);
        updatedGeneral.health = regress(updatedGeneral.health, 60);
        updatedGeneral.romance = Math.min(150, Math.max(0, updatedGeneral.romance));
        updatedGeneral.luck = regress(updatedGeneral.luck, 50, 0.02);
        updatedGeneral.efficiency = Math.min(30, regress(updatedGeneral.efficiency, 10, 0.03));

        const capTarget = { general: { ...updatedGeneral } };
        applyStatCaps(prevState, capTarget);

        // Subject decay
        const updatedSubjects = { ...prevState.subjects };
        for (const key of Object.keys(updatedSubjects)) {
            const sub = updatedSubjects[key as keyof typeof updatedSubjects];
            if (sub && sub.level > 5) {
                updatedSubjects[key as keyof typeof updatedSubjects] = { ...sub, level: sub.level - 0.3 };
            }
        }

        return { updatedGeneral: capTarget.general!, updatedStatuses: newStatuses, updatedSubjects };
    };

    const applyWeeklyUpdates = (currentEvent: GameEvent, nextQueue: GameEvent[] = [], newTriggeredEvents: string[] = []) => {
        setState(prev => {
            const { updatedGeneral, updatedStatuses, updatedSubjects } = calculateWeeklyUpdates(prev);

            let newRecentIds = [...prev.recentEventIds];
            if (currentEvent.triggerType === 'RANDOM') {
                newRecentIds.push(currentEvent.id);
                if (newRecentIds.length > 4) newRecentIds.shift();
            }

            if (updatedGeneral.health <= 0) {
                return {
                    ...prev,
                    general: updatedGeneral,
                    phase: Phase.ENDING,
                    currentEvent: null,
                    eventQueue: [],
                    isPlaying: false,
                    log: [...prev.log, { message: '【猝死】你的健康值降到了0以下，身体再也承受不住了...游戏结束。', type: 'error', timestamp: Date.now(), week: prev.week }]
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
                weeklyLog = [...weeklyLog, { message: `📋 第${prev.week}周学习小结：${feedback}`, type: 'info', timestamp: Date.now(), week: prev.week }];
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
        if (state.phase === Phase.ENDING || state.phase === Phase.WITHDRAWAL) return;
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
                weekendActionPoints: 1,
                availableWeekendActivityIds: availableIds
            };
        });
    };

    const autoSave = (s: GameState) => {
        const key = getSaveKey(s.difficulty);
        const saveData = {
            ...s,
            currentEvent: null,
            chainedEvent: null,
            eventQueue: [],
            aiBuffer: [],
            pendingHistoricalEvents: [],
            eventResult: null,
            popupCompetitionResult: null,
            popupExamResult: null
        };
        try {
            localStorage.setItem(key, JSON.stringify(saveData));
            setHasSave(true);
        } catch (e) {
            console.error('Save failed:', e);
        }
    };

    const saveGame = () => {
        autoSave(state);
        setState(s => ({ ...s, log: [...s.log, { message: "游戏进度已保存。", type: 'success', timestamp: Date.now(), week: s.week }] }));
    };

    const loadGame = (difficulty?: Difficulty): boolean => {
        let saved: string | null = null;
        if (difficulty) {
            saved = localStorage.getItem(getSaveKey(difficulty));
        } else {
            const keys = getAllSaveKeys();
            if (keys.length > 0) {
                let latestKey = keys[0];
                let latestTime = 0;
                for (const k of keys) {
                    const data = localStorage.getItem(k);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            const t = parsed.history?.slice(-1)?.[0]?.timestamp || 0;
                            if (t > latestTime) { latestTime = t; latestKey = k; }
                        } catch { }
                    }
                }
                saved = localStorage.getItem(latestKey);
            }
        }
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                if (!loaded.general || !loaded.subjects || !loaded.phase) {
                    console.error("Save data corrupted");
                    return false;
                }
                const globalAchievements = getGlobalAchievements();
                const mergedAchievements = Array.from(new Set([...(loaded.unlockedAchievements || []), ...globalAchievements]));
                if (loaded.worldContext) {
                    loadCityEvents(loaded.worldContext.code, loaded.worldContext.region);
                }
                setState({
                    ...loaded,
                    isAiGenerating: false,
                    unlockedAchievements: mergedAchievements
                });
                return true;
            } catch (e) {
                console.error("Failed to load save", e);
                return false;
            }
        }
        return false;
    };

    const startGameState = (difficulty: Difficulty, customStats: GeneralStats, selectedTalents: Talent[], activeChallenge?: Challenge | null) => {
        let initialGeneral = { ...DIFFICULTY_PRESETS['NORMAL'].stats };
        const effectiveDifficulty = activeChallenge ? 'REALITY' : (difficulty === 'CUSTOM' ? 'NORMAL' : difficulty);

        if (difficulty === 'CUSTOM' && !activeChallenge) {
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

        if (activeChallenge) {
            if (activeChallenge.conditions?.initialStats) {
                initialGeneral = { ...initialGeneral, ...activeChallenge.conditions.initialStats };
            }
            if (activeChallenge.id === 'c_sleep_king') {
                initialStatuses.push({ ...STATUSES['sleep_compulsion'], duration: 999 });
            }
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
            activeChallengeId: activeChallenge ? activeChallenge.id : null,
            hasSleptThisWeek: false,
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

        if (!activeChallenge && !tempState.unlockedAchievements.includes('first_blood') && difficulty === 'REALITY') {
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

    const handleChoice = (choice: EventChoice, visualizer?: (oldS: GameState, newS: GameState) => string[]) => {
        const oldState = { ...state };
        let updates = choice.action(state);

        // Apply talent passives to stat deltas
        if (updates.general) {
            const oldEff = oldState.general.efficiency;
            const newEff = updates.general.efficiency;
            if (newEff !== undefined && newEff !== oldEff) {
                const delta = newEff - oldEff;
                const adjusted = applyEfficiencyPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, efficiency: Math.max(1, oldEff + adjusted) } };
            }
            const oldMoney = oldState.general.money;
            const newMoney = updates.general.money;
            const isDebtRepayment = oldMoney < 0 && newMoney === 0;
            if (newMoney !== undefined && newMoney > oldMoney && !isDebtRepayment) {
                const delta = newMoney - oldMoney;
                const adjusted = applyMoneyPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, money: oldMoney + adjusted } };
            }
            const oldRomance = oldState.general.romance;
            const newRomance = updates.general.romance;
            if (newRomance !== undefined && newRomance !== oldRomance) {
                const delta = newRomance - oldRomance;
                const adjusted = applyRomancePassive(state, delta);
                updates = { ...updates, general: { ...updates.general, romance: oldRomance + adjusted } };
            }
            const oldHealth = oldState.general.health;
            const newHealth = updates.general.health;
            if (newHealth !== undefined && newHealth > oldHealth) {
                const delta = newHealth - oldHealth;
                const adjusted = applyHealthRecoveryPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, health: oldHealth + adjusted } };
            }
            const oldExp = oldState.general.experience;
            const newExp = updates.general.experience;
            if (newExp !== undefined && newExp > oldExp) {
                const delta = newExp - oldExp;
                const adjusted = applyExperiencePassive(state, delta);
                updates = { ...updates, general: { ...updates.general, experience: oldExp + adjusted } };
            }
            applyStatCaps(state, updates);
        }

        if (choice.nextEventId && CHAINED_EVENTS[choice.nextEventId]) {
            updates.chainedEvent = CHAINED_EVENTS[choice.nextEventId];
        }

        if (state.activeChallengeId === 'c_sleep_king' && (choice.text.includes('睡') || choice.text.includes('梦') || choice.text.includes('补觉'))) {
            updates = { ...updates, hasSleptThisWeek: true };
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

        setState(prev => ({ ...prev, ...updates, log: stampNewLogWeeks(prev.log, updates.log, prev.week), history: [...prev.history, entry], eventResult: { choice, diff } }));
    };

    const handleEventConfirm = () => {
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
                if (prev.activeChallengeId === 'c_sleep_king' && !prev.hasSleptThisWeek) {
                    return { ...prev, phase: Phase.ENDING, log: [...prev.log, { message: "你在暑假/军训期间没有睡觉，困死了！！！(挑战失败)", type: 'error', timestamp: Date.now(), week: prev.week }] };
                }
                return {
                    ...prev,
                    currentEvent: null,
                    eventResult: null,
                    isWeekend: false,
                    week: prev.week + 1,
                    hasSleptThisWeek: false,
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
    };

    const handleClubSelect = (id: ClubId | 'none') => {
        setState(prev => ({
            ...prev,
            club: id === 'none' ? null : id,
            hasSelectedClub: true
        }));
    };

    const handleShopPurchase = (item: Item, effectVisualizer: () => void) => {
        const multiplier = getShopPriceMultiplier(state);
        const actualPrice = Math.floor(item.price * multiplier);
        if (state.general.money < actualPrice) return;

        const updates = item.effect(state);
        const priceDiff = item.price - actualPrice;
        if (priceDiff !== 0 && updates.general) {
            updates.general.money = (updates.general.money ?? state.general.money) + priceDiff;
        }
        setState(prev => ({ ...prev, ...updates, log: stampNewLogWeeks(prev.log, updates.log, prev.week) }));
        effectVisualizer();
    };

    const handleWeekendActivityClick = (activity: WeekendActivity, visualizer?: (oldS: GameState, newS: GameState) => string[]) => {
        if (state.weekendActionPoints <= 0) return;

        const oldState = { ...state };
        let updates = activity.action(state);

        // Apply talent passives
        if (updates.general) {
            const oldEff = oldState.general.efficiency;
            const newEff = updates.general.efficiency;
            if (newEff !== undefined && newEff !== oldEff) {
                const delta = newEff - oldEff;
                const adjusted = applyEfficiencyPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, efficiency: Math.max(1, oldEff + adjusted) } };
            }
            const oldMoney = oldState.general.money;
            const newMoney = updates.general.money;
            if (newMoney !== undefined && newMoney > oldMoney) {
                const delta = newMoney - oldMoney;
                const adjusted = applyMoneyPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, money: oldMoney + adjusted } };
            }
            const oldRomance = oldState.general.romance;
            const newRomance = updates.general.romance;
            if (newRomance !== undefined && newRomance !== oldRomance) {
                const delta = newRomance - oldRomance;
                const adjusted = applyRomancePassive(state, delta);
                updates = { ...updates, general: { ...updates.general, romance: oldRomance + adjusted } };
            }
            const oldHealth = oldState.general.health;
            const newHealth = updates.general.health;
            if (newHealth !== undefined && newHealth > oldHealth) {
                const delta = newHealth - oldHealth;
                const adjusted = applyHealthRecoveryPassive(state, delta);
                updates = { ...updates, general: { ...updates.general, health: oldHealth + adjusted } };
            }
            const oldExp = oldState.general.experience;
            const newExp = updates.general.experience;
            if (newExp !== undefined && newExp > oldExp) {
                const delta = newExp - oldExp;
                const adjusted = applyExperiencePassive(state, delta);
                updates = { ...updates, general: { ...updates.general, experience: oldExp + adjusted } };
            }
            applyStatCaps(state, updates);
        }

        if (state.activeChallengeId === 'c_sleep_king' && (activity.id === 'w_sleep' || activity.name.includes('睡'))) {
            updates = {
                ...updates, hasSleptThisWeek: true,
                general: { ...oldState.general, ...updates.general, health: (updates.general?.health ?? oldState.general.health) + 5, mindset: (updates.general?.mindset ?? oldState.general.mindset) + 3 } as GeneralStats
            };
        }

        let resultText = typeof activity.resultText === 'function' ? activity.resultText(state) : activity.resultText;

        const newState = { ...state, ...updates };
        const diff = visualizer ? visualizer(oldState, newState) : [];

        setWeekendResult({ activity, resultText, diff });
        setState(prev => ({ ...prev, ...updates, log: stampNewLogWeeks(prev.log, updates.log, prev.week) }));
    };

    const confirmWeekendActivity = () => {
        setWeekendResult(null);
        setState(prev => {
            const newPoints = prev.weekendActionPoints - 1;
            if (newPoints <= 0) {
                if (prev.activeChallengeId === 'c_sleep_king' && !prev.hasSleptThisWeek) {
                    return { ...prev, weekendActionPoints: 0, isWeekend: false, isPlaying: false, phase: Phase.ENDING, log: [...prev.log, { message: "你这周没有睡觉，困死了！！！(挑战失败)", type: 'error', timestamp: Date.now(), week: prev.week }] };
                }
                return { ...prev, weekendActionPoints: 0, isWeekend: false, isPlaying: false, week: prev.week + 1, hasSleptThisWeek: false };
            }
            return { ...prev, weekendActionPoints: newPoints };
        });
    };

    const executeTimetable = (schedule: Record<string, string>) => {
        let currentState = { ...state };
        let results = [];
        let hasSlept = false;

        const activityMap = new Map(WEEKEND_ACTIVITIES.map(a => [a.id, a]));
        const batchLogs: typeof state.log = [];

        for (const [slotId, actId] of Object.entries(schedule)) {
            const activity = activityMap.get(actId);
            if (!activity) continue;

            const oldS = { ...currentState };
            let updates = activity.action(oldS);
            let resultText = typeof activity.resultText === 'function' ? activity.resultText(oldS) : activity.resultText;

            if (currentState.activeChallengeId === 'c_sleep_king' && (activity.id === 'w_sleep' || activity.name.includes('睡'))) {
                updates = { ...updates, hasSleptThisWeek: true };
                hasSlept = true;
            }

            if (updates.log) {
                // action 返回的 log 是全量数组，只取尾部新增条目（避免历史日志重复），并盖上当前周数
                const newEntries = updates.log.slice(oldS.log.length).map(l => ({ ...l, week: l.week ?? oldS.week }));
                batchLogs.push(...newEntries);
                delete updates.log;
            }
            currentState = { ...currentState, ...updates };
            if (resultText) results.push(`[${slotId}] ${resultText}`);
        }
        currentState.log = [...(currentState.log || []), ...batchLogs];

        if (currentState.activeChallengeId === 'c_sleep_king' && !hasSlept) {
            currentState.phase = Phase.ENDING;
            currentState.isPlaying = false;
            currentState.log = [...(currentState.log || []), { message: "你这周没有睡觉，困死了！！！(挑战失败)", type: 'error', timestamp: Date.now(), week: currentState.week }];
        } else {
            currentState.week += 1;
            currentState.isPlaying = true;
            currentState.hasSleptThisWeek = false;
        }

        currentState.lastWeekSchedule = schedule;
        currentState.isWeekend = false;

        setState(prev => ({ ...prev, ...currentState }));
    };

    const calculateRank = (score: number, phase: Phase) => {
        const ALL_OI_PHASES = [Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM];
        if (ALL_OI_PHASES.includes(phase)) return -1;

        let maxScore = 750;
        const percentage = score / maxScore;
        const totalStudents = 633;
        const mean = 0.68;
        const std = 0.15;
        const z = (percentage - mean) / std;
        let percentile = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
        if (percentage < 0.1) percentile = 0;
        if (score >= maxScore * 0.99) percentile = 1;
        else if (percentage > 0.999) percentile = 0.999;
        const rank = Math.max(1, Math.floor(totalStudents * (1 - percentile)));
        return rank;
    };

    const handleExamFinish = (result: ExamResult) => {
        const ALL_OI_PHASES = [Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM];
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
    };

    const closeCompetitionPopup = () => {
        setState(prev => ({ ...prev, popupCompetitionResult: null, isPlaying: false }));
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isPlaying: false }));
        }, 500);
    };

    const closeExamResult = () => {
        setState(prev => {
            const nextState = { ...prev, popupExamResult: null, isPlaying: false };

            if (prev.phase === Phase.MIDTERM_EXAM) {
                return { ...nextState, phase: Phase.SUBJECT_RESELECTION, week: 11, isPlaying: false };
            }
            if (prev.phase === Phase.PLACEMENT_EXAM) {
                return { ...nextState, phase: Phase.SEMESTER_1, week: 1, totalWeeksInPhase: 21, isPlaying: false };
            }
            if (prev.phase === Phase.FINAL_EXAM) {
                return { ...nextState, phase: Phase.WINTER_BREAK, week: 1, totalWeeksInPhase: 5, isPlaying: false };
            }
            if (prev.phase === Phase.MIDTERM_EXAM_2) {
                return { ...nextState, phase: Phase.SEMESTER_2, week: 12, isPlaying: false };
            }
            if (prev.phase === Phase.FINAL_EXAM_2) {
                return { ...nextState, phase: Phase.SUMMER_BREAK, week: 1, totalWeeksInPhase: 8, isPlaying: false };
            }
            if ([Phase.CSP_EXAM, Phase.NOIP_EXAM].includes(prev.phase)) {
                return { ...nextState, phase: Phase.SEMESTER_1, week: prev.week + 1, totalWeeksInPhase: 21, isPlaying: false };
            }
            if (prev.phase === Phase.WC_EXAM) {
                const resultEvent = OI_EVENTS_POOL.find((e: GameEvent) => e.id === 'oi_wc_result') as GameEvent;
                return { ...nextState, phase: Phase.WINTER_BREAK, week: prev.week + 1, totalWeeksInPhase: 5, isPlaying: false, eventQueue: [...prev.eventQueue, resultEvent] };
            }
            if ([Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM].includes(prev.phase)) {
                const resultEventId = prev.phase === Phase.PROVINCIAL_EXAM ? 'oi_provincial_result' : 'oi_apio_result';
                const resultEvent = OI_EVENTS_POOL.find((e: GameEvent) => e.id === resultEventId) as GameEvent;
                return { ...nextState, phase: Phase.SEMESTER_2, week: prev.week + 1, totalWeeksInPhase: 21, isPlaying: false, eventQueue: [...prev.eventQueue, resultEvent] };
            }
            if (prev.phase === Phase.NOI_EXAM) {
                const socialPractice = OI_EVENTS_POOL.find((e: GameEvent) => e.id === 'oi_noi_social_practice') as GameEvent;
                return { ...nextState, phase: Phase.SUMMER_BREAK, week: prev.week + 1, totalWeeksInPhase: 8, isPlaying: false, eventQueue: [...prev.eventQueue, socialPractice] };
            }
            return { ...nextState, isPlaying: false };
        });
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isPlaying: true }));
        }, 500);
    };

    const closeMiniGame = (res?: Partial<GameState>) => {
        setState(prev => {
            const next = { ...prev, activeMiniGame: null, ...res };
            const skipWeekend = next.phase === Phase.SUMMER || next.phase === Phase.MILITARY;
            if (skipWeekend) {
                return { ...next, week: next.week + 1, isPlaying: false };
            }
            return next;
        });

        if (state.phase !== Phase.SUMMER && state.phase !== Phase.MILITARY) {
            setTimeout(() => startWeekend(), 0);
        }
    };

    const weekendOptions = WEEKEND_ACTIVITIES.filter(a => {
        if (state.availableWeekendActivityIds) {
            return state.availableWeekendActivityIds.includes(a.id) && (!a.condition || a.condition(state));
        }
        return !a.condition || a.condition(state);
    });

    return {
        state, setState, weekendResult, setWeekendResult, hasSave, checkHasSave, saveGame, loadGame,
        startGameState, handleChoice, handleEventConfirm, handleClubSelect, handleShopPurchase,
        handleWeekendActivityClick, confirmWeekendActivity,
        executeTimetable, handleExamFinish, closeCompetitionPopup, closeExamResult, closeMiniGame,
        weekendOptions
    };
};
