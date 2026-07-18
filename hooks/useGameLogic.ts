
import { useState, useEffect, useCallback } from 'react';
import { 
    GameState, Difficulty, GeneralStats, Talent, Challenge, 
    Phase, GameStatus, SubjectKey, OIStats, GameEvent, 
    EventChoice, ExamResult, ClubId, Item, WeekendActivity, Project, GameLogEntry, StoryEntry
} from '../types';
import { DIFFICULTY_PRESETS } from '../data/constants';
import { PHASE_EVENTS, BASE_EVENTS, CHAINED_EVENTS, generateSummerLifeEvent, generateStudyEvent, generateOIEvent, generateRandomFlavorEvent } from '../data/events';
import { WEEKEND_ACTIVITIES, STATUSES, ACHIEVEMENTS } from '../data/mechanics';
import { modifyOI, modifySub, mapAiEventToGameEvent } from '../data/utils';
import { generateBatchGameEvents } from '../lib/gemini';
import { getRandomWorldContext, CHARACTER_TEMPLATES } from '../data/world_context';
import { getHistoricalEventsForWeek, loadCityEvents } from '../data/historical_events';
import { OI_EVENTS_POOL } from '../data/events_oi';

const STORAGE_KEY = 'recall_save_v1';
const ACHIEVEMENTS_KEY = 'recall_achievements_global'; // Global key for achievements

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

// Helper to get global achievements
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
     
    eventQueue: [],
    pendingHistoricalEvents: [],
     // Init AI Buffer
    recentEventIds: [], // Init Repetition Buffer
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

export const useGameLogic = () => {
    // Initialize state with global achievements merged in
    const [state, setState] = useState<GameState>(() => {
        const initial = getInitialGameState();
        const globalAchievements = getGlobalAchievements();
        return {
            ...initial,
            unlockedAchievements: globalAchievements
        };
    });

    
    const [hasSave, setHasSave] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setHasSave(true);
    }, []);

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
                case Phase.CSP_EXAM: nextPhase = Phase.SEMESTER_1; weeks = prev.totalWeeksInPhase; break; 
                case Phase.NOIP_EXAM: nextPhase = Phase.SEMESTER_1; weeks = prev.totalWeeksInPhase; break;
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
                isPlaying: nextPhase !== Phase.ENDING && nextPhase !== Phase.SELECTION,
                log: [...prev.log, { message: `进入新阶段: ${nextPhase}`, type: 'info', timestamp: Date.now() }]
            };
        });
    }, []);

    // --- Achievement Check Effect ---
    useEffect(() => {
        // STRICT MODE CHECK
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

        // Academic Achievements Check
        if (state.examResult) {
            // Check if it's an Academic Exam, NOT a Competition
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
            
            // Persist to Global Storage
            const globalAch = getGlobalAchievements();
            const merged = Array.from(new Set([...globalAch, ...newUnlocked]));
            localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(merged));

            setState(prev => ({
                ...prev,
                unlockedAchievements: merged,
                achievementPopup: ACHIEVEMENTS[lastId]
            }));
            
            setTimeout(() => setState(prev => ({ ...prev, achievementPopup: null })), 3000);
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
                    logs.push({ message: `【课题失败】${p.title} 截止日期已过，未能完成。`, type: 'error', timestamp: Date.now() });
                });
                setState(prev => ({ ...prev, ...updates, log: [...prev.log, ...logs] }));
                return; // Let the state update and re-enter loop
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

            // 3a. Fixed Events in current Phase/Week (Priority)
            const pendingFixed = phasePool.filter(e => 
                e.triggerType === 'FIXED' && 
                e.fixedWeek === state.week && 
                (!e.condition || e.condition(state)) &&
                !state.triggeredEvents.includes(e.id)
            );
            weekEvents.push(...pendingFixed);
            
            // 3a.2 Global Negative Triggers (Debt Event)
            if (state.general.money < 0) {
                 const debt = Math.abs(state.general.money);
                 const prob = Math.min(1, Math.sqrt(debt) / 30);
                 if (Math.random() < prob && !state.recentEventIds.includes('debt_collection')) {
                     weekEvents.push(BASE_EVENTS['debt_collection']);
                 }
            }

            // AI Branch Logic has been moved to offline pre-generation.

            // 3b. Conditional Events
            const conditionalEvents = phasePool.filter(e => 
                e.triggerType === 'CONDITIONAL' &&
                (!e.once || !state.triggeredEvents.includes(e.id)) &&
                e.condition && e.condition(state)
            );
            if (conditionalEvents.length > 0) {
                 weekEvents.push(...conditionalEvents);
            }

            // 3c. Regular Events (Phase Specific Randoms)
            if (weekEvents.length === 0) {
                // Filter out recently triggered events to prevent repetition
                const validRandoms = phasePool.filter(e => 
                    e.triggerType === 'RANDOM' &&
                    (!e.once || !state.triggeredEvents.includes(e.id)) &&
                    (!e.condition || e.condition(state)) &&
                    !state.recentEventIds.includes(e.id) // Anti-repetition check
                );

                if (state.phase === Phase.SUMMER) {
                     // 50% chance for specific Summer events (like hot day), 50% for generator
                     if (validRandoms.length > 0 && Math.random() < 0.5) {
                         weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                     } else {
                         weekEvents.push(generateSummerLifeEvent(state));
                     }
                } else if (state.phase === Phase.MILITARY) {
                     if (validRandoms.length > 0) weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                } else if (state.phase === Phase.SEMESTER_1 || state.phase === Phase.SEMESTER_2) {
                    const eventCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 events

                    if (state.competition === 'OI') {
                        const oiCount = Math.floor(Math.random() * 3); // 0 to 2
                        const normalCount = Math.floor(Math.random() * 3); // 0 to 2
                        const total = Math.max(1, oiCount + normalCount); 
                        
                        for (let i=0; i<oiCount; i++) {
                            weekEvents.push(generateOIEvent(state));
                        }
                        for (let i=0; i<total - oiCount; i++) {
                            const roll = Math.random();
                            if (validRandoms.length > 0 && roll < 0.3) weekEvents.push(validRandoms[Math.floor(Math.random() * validRandoms.length)]);
                            else if (roll < 0.6) weekEvents.push(generateRandomFlavorEvent(state));
                            else weekEvents.push(generateStudyEvent(state));
                        }
                    } else {
                        for (let i=0; i<eventCount; i++) {
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

            // --- FIXED EVENTS FOR SEMESTER 2 ---
            if (state.phase === Phase.SEMESTER_2) {
                // April Fools (Week 5)
                if (state.week === 5 && Math.random() < 0.7 && !state.triggeredEvents.includes('evt_april_fools')) {
                    const evt = BASE_EVENTS['evt_april_fools'];
                    if (evt) weekEvents.unshift(evt);
                }
                // Study Tour (Week 14)
                if (state.week === 14 && !state.triggeredEvents.includes('evt_study_tour_start')) {
                    const evt = BASE_EVENTS['evt_study_tour_start'];
                    if (evt) weekEvents.unshift(evt);
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
        let moneyChange = 2; // Base weekly money
        if (prevState.activeChallengeId === 'c_debt_king') {
            moneyChange -= 25; // Debt King Challenge: -25 money per week
        }

        const currentMoney = prevState.general.money;
        let debtLevel = 0;
        if (currentMoney < -800) debtLevel = 5;
        else if(currentMoney < -350)debtLevel=4;
        else if (currentMoney < -180) debtLevel = 3;
        else if (currentMoney < -80) debtLevel = 2;
        else if (currentMoney < 0) debtLevel = 1;

        const cleanStatuses = prevState.activeStatuses.filter(s => !s.id.startsWith('debt_'));
        let newStatuses = [...cleanStatuses];
        let penaltyMindset = 0;
        let penaltyRomance = 0;

        if (debtLevel > 0) {
            newStatuses.push({ ...STATUSES[`debt_${debtLevel}`], duration: 1 });
            if (debtLevel === 1) { penaltyMindset = 5; penaltyRomance = 3; }
            if (debtLevel === 2) { penaltyMindset = 10; penaltyRomance = 6; }
            if (debtLevel === 3) { penaltyMindset = 20; penaltyRomance = 12; }
            if (debtLevel === 4) { penaltyMindset = 40; penaltyRomance = 24; }
            if (debtLevel === 5) { penaltyMindset = 80; penaltyRomance = 48; }
        }

        const updatedGeneral = {
            ...prevState.general,
            money: prevState.general.money + moneyChange, 
            mindset: Math.max(0, prevState.general.mindset - penaltyMindset),
            romance: Math.max(0, prevState.general.romance - penaltyRomance)
        };

        return { updatedGeneral, updatedStatuses: newStatuses };
    };

    const applyWeeklyUpdates = (currentEvent: GameEvent, nextQueue: GameEvent[] = [], newTriggeredEvents: string[] = []) => {
        setState(prev => {
            const { updatedGeneral, updatedStatuses } = calculateWeeklyUpdates(prev);
            
            // Update Anti-Repetition Buffer
            let newRecentIds = [...prev.recentEventIds];
            // Only track RANDOM events for repetition prevention, ignore generated/fixed
            if (currentEvent.triggerType === 'RANDOM') {
                newRecentIds.push(currentEvent.id);
                if (newRecentIds.length > 4) newRecentIds.shift(); // Keep last 4
            }

            return {
                ...prev,
                activeStatuses: updatedStatuses,
                general: updatedGeneral,
                currentEvent: currentEvent,
                eventQueue: nextQueue,
                triggeredEvents: [...prev.triggeredEvents, ...newTriggeredEvents],
                recentEventIds: newRecentIds,
                isPlaying: false
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
                                availableWeekendActivityIds: availableIds
            };
        });
    };

    const saveGame = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setHasSave(true);
        setState(s => ({ ...s, log: [...s.log, { message: "游戏进度已保存。", type: 'success', timestamp: Date.now() }] }));
    };

    const loadGame = (): boolean => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                const globalAchievements = getGlobalAchievements();
                // Merge persisted global achievements with saved state to ensure no loss
                const mergedAchievements = Array.from(new Set([...loaded.unlockedAchievements, ...globalAchievements]));
                if (loaded.worldContext) {
                    loadCityEvents(loaded.worldContext.code, loaded.worldContext.region);
                }
                setState({
                    ...loaded,
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
        } else if (false) {
             initialGeneral = DIFFICULTY_PRESETS['AI_STORY'] ? { ...DIFFICULTY_PRESETS['AI_STORY'].stats } : { ...DIFFICULTY_PRESETS['NORMAL'].stats };
        } else {
             initialGeneral = { ...DIFFICULTY_PRESETS[effectiveDifficulty].stats };
        }
        
        let initialStatuses: GameStatus[] = [];
        if (effectiveDifficulty === 'REALITY') {
            initialStatuses.push({ ...STATUSES['anxious'], duration: 4 });
        }
        
        if (activeChallenge) {
             if (activeChallenge.conditions.initialStats) {
                 initialGeneral = { ...initialGeneral, ...activeChallenge.conditions.initialStats };
             }
             if (activeChallenge.id === 'c_sleep_king') {
                 initialStatuses.push({ ...STATUSES['sleep_compulsion'], duration: 999 });
             }
        }

        const rolledSubjects = getInitialSubjects();
        (Object.keys(rolledSubjects) as SubjectKey[]).forEach(k => {
            rolledSubjects[k] = { aptitude: Math.floor(Math.random() * 40 + 60), level: Math.floor(Math.random() * 10 + 5) };
            if (effectiveDifficulty === 'NORMAL' || false) { rolledSubjects[k].aptitude += 15; rolledSubjects[k].level += 5; }
        });

        // Ensure achievements are carried over to new game
        const globalAchievements = getGlobalAchievements();

        // Generate V2 World Context
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
            unlockedAchievements: globalAchievements // Keep existing achievements
        };
        
        selectedTalents.forEach(t => {
            if (t.effect) {
                const updates = t.effect(tempState);
                if(updates.general) tempState.general = { ...tempState.general, ...updates.general };
                if(updates.subjects) tempState.subjects = { ...tempState.subjects, ...updates.subjects }; 
                if(updates.oiStats) tempState.oiStats = { ...tempState.oiStats, ...updates.oiStats };
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
            log: [{ message: "八中模拟器启动。", type: 'success', timestamp: Date.now() }],
            isPlaying: false
        });
        
        // Only grant First Blood if eligible
        if (!activeChallenge && !tempState.unlockedAchievements.includes('first_blood') && difficulty === 'REALITY') {
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    unlockedAchievements: [...prev.unlockedAchievements, 'first_blood'],
                    achievementPopup: ACHIEVEMENTS['first_blood']
                }));
                // Persist new achievement immediately
                const currentGlobals = getGlobalAchievements();
                localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...currentGlobals, 'first_blood']));

                setTimeout(() => setState(prev => ({ ...prev, achievementPopup: null })), 3000);
            }, 100);
        }
    };

    const handleChoice = (choice: EventChoice, visualizer?: (oldS: GameState, newS: GameState) => string[]) => {
        const oldState = { ...state };
        let updates = choice.action(state);
        
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
        
        setState(prev => ({ ...prev, ...updates, history: [...prev.history, entry], eventResult: { choice, diff } }));
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
             setState(prev => ({ 
                 ...prev, 
                 currentEvent: null, 
                 eventResult: null,
                 isWeekend: false, 
                 week: prev.week + 1, 
                 hasSleptThisWeek: false, 
                 isPlaying: !miniGameId,
                 activeMiniGame: miniGameId || prev.activeMiniGame
            }));
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
        const updates = item.effect(state);
        setState(prev => ({ ...prev, ...updates }));
        effectVisualizer();
    };

    const executeTimetable = (schedule: Record<string, string>) => {
        let currentState = { ...state };
        let results = [];
        let hasSlept = false;

        // Apply activities sequentially
        for (const [slotId, actId] of Object.entries(schedule)) {
            const activity = WEEKEND_ACTIVITIES.find(a => a.id === actId);
            if (!activity) continue;

            const oldS = { ...currentState };
            let updates = activity.action(oldS);
            let resultText = typeof activity.resultText === 'function' ? activity.resultText(oldS) : activity.resultText;
            
            if (currentState.activeChallengeId === 'c_sleep_king' && (activity.id === 'w_sleep' || activity.name.includes('睡'))) {
                updates = { ...updates, hasSleptThisWeek: true };
                hasSlept = true;
            }

            currentState = { ...currentState, ...updates };
            if (resultText) {
                results.push(`[${slotId}] ${resultText}`);
            }
            if (updates.log) {
                currentState.log = [...(currentState.log || []), ...updates.log];
            }
        }

        // Challenge Check
        if (currentState.activeChallengeId === 'c_sleep_king' && !hasSlept) {
            currentState.phase = Phase.ENDING;
            currentState.isPlaying = false;
            currentState.log = [...(currentState.log || []), { message: "你这周没有睡觉，困死了！！！(挑战失败)", type: 'error', timestamp: Date.now() }];
            results.push("挑战失败：你这周没有睡觉！");
        } else {
            currentState.week += 1;
            currentState.isPlaying = true;
            currentState.hasSleptThisWeek = false;
        }

        currentState.lastWeekSchedule = schedule;
        currentState.isWeekend = false; // Turn off planning UI
        
        setState(prev => ({ ...prev, ...currentState }));
        
        // Return results to display maybe? We can set it to a new state `timetableResult` if we want a summary popup
    };

    const calculateRank = (score: number, phase: Phase) => {
        let maxScore = 750;
        if (phase === Phase.CSP_EXAM || phase === Phase.NOIP_EXAM) {
            maxScore = 400; 
        }
        
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
        const rank = calculateRank(result.totalScore, state.phase);
        const isOI = [Phase.CSP_EXAM, Phase.NOIP_EXAM].includes(state.phase);
        const resultWithRank: ExamResult = { ...result, rank, type: isOI ? 'COMPETITION' : 'ACADEMIC' };
        
        let newClassName = state.className;
        if (state.phase === Phase.PLACEMENT_EXAM) {
             if (rank <= 160) newClassName = "一类实验班"; // Updated threshold from 40
             else if (rank <= 380) newClassName = "二类实验班"; // Updated threshold from 80
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
    
    const closeCompetitionPopup = () => setState(prev => ({ ...prev, popupCompetitionResult: null }));
    
    const closeExamResult = () => {
        setState(prev => {
            const nextState = { ...prev, popupExamResult: null };
            
            if (prev.phase === Phase.MIDTERM_EXAM) {
                 return { ...nextState, phase: Phase.SEMESTER_1, week: 12, isPlaying: true };
            }
            if (prev.phase === Phase.PLACEMENT_EXAM) {
                 return { ...nextState, phase: Phase.SEMESTER_1, week: 1, totalWeeksInPhase: 21, isPlaying: true };
            }
            if (prev.phase === Phase.FINAL_EXAM) {
                 return { ...nextState, phase: Phase.WINTER_BREAK, week: 1, totalWeeksInPhase: 5, isPlaying: true };
            }
            if (prev.phase === Phase.MIDTERM_EXAM_2) {
                 return { ...nextState, phase: Phase.SEMESTER_2, week: 12, isPlaying: true };
            }
            if (prev.phase === Phase.FINAL_EXAM_2) {
                 return { ...nextState, phase: Phase.SUMMER_BREAK, week: 1, totalWeeksInPhase: 8, isPlaying: true };
            }
            if ([Phase.CSP_EXAM, Phase.NOIP_EXAM].includes(prev.phase)) {
                 return { ...nextState, phase: Phase.SEMESTER_1, week: prev.week + 1, totalWeeksInPhase: 21, isPlaying: true };
            }
            if (prev.phase === Phase.WC_EXAM) {
                 // Push wc_result event and stop playing so the event pops up
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
            return { ...nextState, isPlaying: true };
        });
    };

    const closeMiniGame = (res?: Partial<GameState>) => {
        setState(prev => {
            const next = { ...prev, activeMiniGame: null, ...res };
            const skipWeekend = next.phase === Phase.SUMMER || next.phase === Phase.MILITARY;
            if (skipWeekend) {
                return { ...next, week: next.week + 1, isPlaying: true };
            }
            // Trigger startWeekend logic inline because we can't easily call startWeekend() inside setState callback cleanly if startWeekend uses setState itself, but wait, startWeekend uses setState, so we can just call it AFTER.
            return next;
        });
        
        // Wait, startWeekend uses setState. So we can just call it here based on phase!
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
        state, setState, hasSave, saveGame, loadGame,
        startGameState, handleChoice, handleEventConfirm, handleClubSelect, handleShopPurchase, 
        executeTimetable, handleExamFinish, closeCompetitionPopup, closeExamResult, closeMiniGame,
        weekendOptions
    };
};
