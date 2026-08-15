
import { GameState, SubjectKey, OIStats, Phase, GeneralStats } from '../../types';

/** 初始六维属性（general 与 initialGeneral 同源，避免两份字面量漂移） */
const INITIAL_GENERAL: GeneralStats = { mindset: 50, experience: 0, luck: 50, romance: 0, health: 100, money: 0, efficiency: 10 };

export const getInitialSubjects = (): Record<SubjectKey, { aptitude: number; level: number }> => ({
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

export const getInitialOIStats = (): OIStats => ({
    dp: 0, ds: 0, math: 0, string: 0, graph: 0, misc: 0
});

export const getInitialGameState = (): GameState => ({
    activeProjects: [],
    completedProjects: [],
    flags: {},
    isPlaying: false,
    isAiGenerating: false,
    eventQueue: [],
    aiBuffer: [],
    recentEventIds: [],
    phase: Phase.INIT,
    week: 1,
    totalWeeksInPhase: 0,
    subjects: getInitialSubjects(),
    general: { ...INITIAL_GENERAL },
    initialGeneral: { ...INITIAL_GENERAL },
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
    isGrounded: false,
    debugMode: false,
    activeStatuses: [],
    unlockedAchievements: [],
    achievementPopup: null,
    difficulty: 'NORMAL',
    isWeekend: false,
    lastWeekSchedule: {},
    activeMiniGame: null,
    sleepCount: 0,
    rejectionCount: 0,
    talents: [],
    inventory: [],
    theme: 'light',
    availableWeekendActivityIds: undefined
});
