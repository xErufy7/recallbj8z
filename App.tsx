
import React, { useState, useRef, lazy, Suspense } from 'react';
import { Difficulty, GeneralStats, Talent, Phase, GameState, Challenge } from './types';
import { TALENTS } from './data/mechanics';
import { useGameLogic, ACHIEVEMENTS_KEY, PHASE_NAMES } from './hooks/useGameLogic';
import { playClick, playConfirm, playAchievement, playError, isSoundEnabled, setSoundEnabled } from './lib/sound';

// Component Imports（非首屏界面懒加载，减小首屏包体积）
import HistoricalTicker from "./components/HistoricalTicker";
import EventModal from './components/EventModal';
import FloatingTextLayer, { FloatingTextItem } from './components/FloatingTextLayer';
import ShopModal from './components/ShopModal';
import GameAchievementsModal from './components/GameAchievementsModal';
import HistoryPanel from './components/HistoryPanel';
import SubjectSelectionModal from './components/SubjectSelectionModal';
import ClubSelectionModal from './components/ClubSelectionModal';
import SaveMenuSheet from './components/SaveMenuSheet';
import RetireConfirmModal from './components/RetireConfirmModal';
import MobileStatsModal from './components/MobileStatsModal';
const StatsPanel = lazy(() => import('./components/StatsPanel'));
const TimetableModal = lazy(() => import('./components/TimetableModal'));
const ContestHistoryModal = lazy(() => import('./components/ContestHistoryModal'));
const ExamView = lazy(() => import('./components/ExamView'));
const HomeView = lazy(() => import('./components/HomeView'));
const TalentView = lazy(() => import('./components/TalentView'));
const EndingScreen = lazy(() => import('./components/EndingScreen'));
const RealityGuideModal = lazy(() => import('./components/RealityGuideModal'));
const LeaderboardModal = lazy(() => import('./components/LeaderboardModal'));
const ApiSettingsModal = lazy(() => import('./components/ApiSettingsModal'));

const FullScreenLoader = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
    </div>
);

const App: React.FC = () => {
  const [isDevMode, setIsDevMode] = useState(false);

  // UI State (View Routing & Modals)
  const [view, setView] = useState<'HOME' | 'TALENTS' | 'GAME'>('HOME');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('NORMAL');
  const [customStats, setCustomStats] = useState<GeneralStats>({ mindset: 50, experience: 10, luck: 50, romance: 10, health: 80, money: 20, efficiency: 10 });
  const [useCustomStats, setUseCustomStats] = useState(false);
  const [showClubSelection, setShowClubSelection] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRealityGuide, setShowRealityGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showContestHistory, setShowContestHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(null);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const spawnFloatingText = (text: string, x: number, y: number, type: string) => {
      let color = '#374151';
      if (type === 'mindset') color = '#3b82f6';
      else if (type === 'health') color = text.includes('+') ? '#10b981' : '#ef4444';
      else if (type === 'money') color = '#fbbf24';
      else if (type === 'efficiency') color = '#a855f7';
      else if (type === 'romance') color = '#f43f5e';
      else if (type === 'experience') color = '#f97316';
      else if (type === 'luck') color = '#8b5cf6';
      else if (type === 'oi') color = '#6366f1';
      
      const newText: FloatingTextItem = { id: Date.now() + Math.random(), text, x, y, color };
      setFloatingTexts(prev => [...prev, newText]);
      setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)), 1500);
  };

  const calculateAndVisualizeDiff = (oldState: GameState, newState: GameState, x?: number, y?: number) => {
      const diffs: string[] = [];
      const check = (key: keyof GeneralStats, label: string, colorType: string) => {
           const delta = newState.general[key] - oldState.general[key];
           if (Math.abs(delta) >= 1) {
               const val = Math.round(delta * 10) / 10;
               if (val === 0) return;
               const text = `${label} ${val > 0 ? '+' : ''}${val}`;
               diffs.push(text);
               setTimeout(() => spawnFloatingText(text, (x || window.innerWidth/2) + (Math.random() * 40 - 20), (y || window.innerHeight/2) + (Math.random() * 40 - 20), colorType), diffs.length * 100);
           }
       };
       check('mindset', '心态', 'mindset');
       check('health', '健康', 'health');
       check('money', '金钱', 'money');
       check('romance', '魅力', 'romance');
       check('efficiency', '效率', 'efficiency');
       check('experience', '经验', 'experience');
       check('luck', '运气', 'luck');
       return diffs;
  };

  const {
      state, setState, weekendResult, setWeekendResult, hasSave, saveGame, loadGame,
      exportSave, importSave,
      startGameState, handleChoice, handleEventConfirm, handleClubSelect, handleShopPurchase,
      handleWeekendActivityClick, confirmWeekendActivity,
      executeTimetable, handleExamFinish, closeCompetitionPopup, closeExamResult, closeMiniGame,
      weekendOptions
  } = useGameLogic();

  const importInputRef = useRef<HTMLInputElement>(null);
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await importSave(file);
      e.target.value = '';
  };

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.log]);

  // 键盘快捷键：数字键选选项、Enter 确认结果、Esc 关闭弹窗
  React.useEffect(() => {
    const anyModalOpen = showRetireConfirm || showStats || showLeaderboard || showApiSettings ||
        showAchievements || showHistory || showSchedule || showContestHistory ||
        showShop || showRealityGuide || showClubSelection;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;

      if (e.key === 'Escape') {
        if (showRetireConfirm) { setShowRetireConfirm(false); return; }
        if (showStats) { setShowStats(false); return; }
        if (showLeaderboard) { setShowLeaderboard(false); return; }
        if (showApiSettings) { setShowApiSettings(false); return; }
        if (showAchievements) { setShowAchievements(false); return; }
        if (showHistory) { setShowHistory(false); return; }
        if (showSchedule) { setShowSchedule(false); return; }
        if (showContestHistory) { setShowContestHistory(false); return; }
        if (showShop) { setShowShop(false); return; }
        if (showRealityGuide) { setShowRealityGuide(false); return; }
        if (showClubSelection) { setShowClubSelection(false); return; }
        return;
      }

      if (anyModalOpen || view !== 'GAME' || !state.currentEvent) return;

      if (e.key === 'Enter' && state.eventResult) {
        handleEventConfirm();
        return;
      }
      if (state.eventResult) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        // 与 EventModal 相同的过滤逻辑，保证键盘选择的是可见选项
        const visibleChoices = state.currentEvent.choices?.filter(c => !c.condition || c.condition(state)) || [];
        const choice = visibleChoices[num - 1];
        if (choice) handleChoice(choice, (oldS, newS) => calculateAndVisualizeDiff(oldS, newS));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, state.currentEvent, state.eventResult, handleChoice, handleEventConfirm, showRetireConfirm, showStats, showLeaderboard, showApiSettings, showAchievements, showHistory, showSchedule, showContestHistory, showShop, showRealityGuide, showClubSelection]);

  React.useEffect(() => {
      if (state.phase === Phase.SEMESTER_1 && state.week === 2 && !state.hasSelectedClub && !showClubSelection) {
          setShowClubSelection(true);
      }
  }, [state.phase, state.week, state.hasSelectedClub, showClubSelection]);

  const [availableTalents, setAvailableTalents] = useState<Talent[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>([]);
  const [talentPoints, setTalentPoints] = useState(3);
  const MAX_TALENTS = 5;

  const handleDifficultyChange = (diff: Difficulty) => {
      setSelectedDifficulty(diff);
      setUseCustomStats(false);
  };

  const handleCustomStatsConfirm = () => {
      setUseCustomStats(true);
  };

  const prepareGame = (challenge?: Challenge) => {
      setWeekendResult(null); setShowClubSelection(false); setShowRealityGuide(false);
      setPendingChallenge(challenge || null);

      const pool = [...TALENTS];
      const buffs = pool.filter(t => t.cost > 0).sort(() => 0.5 - Math.random()).slice(0, 5);
      const debuffs = pool.filter(t => t.cost < 0).sort(() => 0.5 - Math.random()).slice(0, 4);
      setAvailableTalents([...buffs, ...debuffs].sort(() => 0.5 - Math.random()));
      setSelectedTalents([]);
      const effectiveDifficulty = useCustomStats ? 'CUSTOM' : selectedDifficulty;
      setTalentPoints(effectiveDifficulty === 'HARD' ? 1 : (effectiveDifficulty === 'REALITY' ? 0 : 3));
      setView('TALENTS');
  };

  const handleStartGame = () => {
      const effectiveDifficulty = useCustomStats ? 'CUSTOM' : selectedDifficulty;
      startGameState(effectiveDifficulty, customStats, selectedTalents, pendingChallenge);
      setView('GAME');
  };

  const handleTalentToggle = (talent: Talent) => {
      if (selectedTalents.find(t => t.id === talent.id)) {
          setTalentPoints(p => p + talent.cost);
          setSelectedTalents(prev => prev.filter(t => t.id !== talent.id));
      } else {
          if (selectedTalents.length >= MAX_TALENTS) return;
          setTalentPoints(p => p - talent.cost);
          setSelectedTalents(prev => [...prev, talent]);
      }
  };

  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);
  const loadErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 音效 / 暗色模式开关
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [darkMode, setDarkMode] = useState(() => {
      try { return localStorage.getItem('bj8z_dark') === 'on'; } catch { return false; }
  });

  // 暗色模式：html 挂 dark class（CSS 滤镜反色实现）
  React.useEffect(() => {
      document.documentElement.classList.toggle('dark', darkMode);
      try { localStorage.setItem('bj8z_dark', darkMode ? 'on' : 'off'); } catch { }
  }, [darkMode]);

  // 音效触发：成就解锁 / AI 灵感枯竭
  React.useEffect(() => {
      if (state.achievementPopup) playAchievement();
  }, [state.achievementPopup]);
  React.useEffect(() => {
      if (state.currentEvent?.title === '灵感枯竭') playError();
  }, [state.currentEvent]);

  const handleLoadGame = () => {
      // 不传难度：读取所有难度下最新的存档（自定义开局存的是 CUSTOM 键）
      if (loadGame()) { setView('GAME'); return; }
      // 存档读取失败（损坏或不存在）给出可见提示，避免点了没反应
      setLoadErrorMsg('存档读取失败：存档可能已损坏，可以导出文件重新导入或删除后重开。');
      if (loadErrorTimerRef.current) clearTimeout(loadErrorTimerRef.current);
      loadErrorTimerRef.current = setTimeout(() => setLoadErrorMsg(null), 3500);
  };

  const calculateProgress = () => state.totalWeeksInPhase === 0 ? 0 : Math.min(100, (state.week / state.totalWeeksInPhase) * 100);
  
  const getEndingData = () => {
     if (state.phase === Phase.WITHDRAWAL) {
         return { rank: "F", title: "退学离场", comment: "遗憾离场...", score: 0 };
     }

      // Calculate score from subject levels (main academic measure)
      const subjectAvg = (Object.values(state.subjects) as any[]).reduce((sum: number, s: any) => sum + (s.level || 0), 0) / Object.keys(state.subjects).length;
      // Combine with general stats
      let score = subjectAvg * 1.5 + state.general.experience * 0.3 + state.general.efficiency * 0.4;
      // Exam performance bonus
      if (state.examResult?.totalScore) score += state.examResult.totalScore / 20;
      // Clamp to 0-100 range
      score = Math.min(100, Math.max(0, score));

     let noiMedal = state.flags.noi_medal;
     let provincialTeam = state.flags.provincial_team;

     let rank = 'C';
     let title = '普通高中生';
     let comment = '高一学年结束了。前面的路，以后再来探索吧。';

     if (noiMedal === 'GOLD') {
       rank = 'SSS';
       title = '清北保送生（国集）';
       comment = '你在最高荣誉殿堂 NOI 中斩获金牌！高一即保送清华北大，前面的路，以后再来探索吧。';
     } else if (noiMedal === 'SILVER') {
       rank = 'SS';
       title = '强基破格入围者';
       comment = '你在 NOI 中斩获银牌，清华北大的强基计划已向你敞开。前面的路，以后再来探索吧。';
     } else if (noiMedal === 'BRONZE' || provincialTeam) {
       rank = 'S';
       title = '省队巨佬';
       comment = '你能冲入省队，已经在八中的历史上留下了浓墨重彩的一笔。前面的路，以后再来探索吧。';
     } else if (score >= 90) {
       rank = 'S';
       title = '年级学神';
       comment = '凭借不可思议的学识与思维，你制霸了年级榜单。前面的路，以后再来探索吧。';
     } else if (score >= 75) {
       rank = 'A';
       title = '尖子生';
       comment = '你是老师眼中的好学生，985/211 如同探囊取物。前面的路，以后再来探索吧。';
     } else if (score >= 60) {
       rank = 'B';
       title = '中流砥柱';
       comment = '你稳扎稳打，处于年级中上游，一本重点大学稳操胜券。前面的路，以后再来探索吧。';
     } else if (score >= 40) {
       rank = 'C';
       title = '芸芸众生';
       comment = '你的成绩中规中矩，不过青春不只有分数。前面的路，以后再来探索吧。';
     } else if (score >= 20) {
       rank = 'D';
       title = '学业危机';
       comment = '你的学业似乎遇到了麻烦。如果不加倍努力，前路坎坷。前面的路，以后再来探索吧。';
     } else {
       rank = 'Z';
       title = '家里蹲预备役';
       comment = '这一年你彻底放飞了自我。前面的路，以后再来探索吧，或者现在就重开。';
     }

     return { rank, title, comment, score: Math.round(score) };
  };

  if (view === 'HOME') {
      return (
          <Suspense fallback={<FullScreenLoader />}>
            <>
            <HomeView
              selectedDifficulty={selectedDifficulty} onDifficultyChange={handleDifficultyChange}
              customStats={customStats} onCustomStatsChange={setCustomStats} onCustomStatsConfirm={handleCustomStatsConfirm}
              onStart={prepareGame} hasSave={hasSave} onLoadGame={handleLoadGame}
              unlockedAchievements={state.unlockedAchievements}
              onResetAchievements={() => {
                localStorage.removeItem(ACHIEVEMENTS_KEY);
                setState(p => ({ ...p, unlockedAchievements: [] }));
              }}
              onShowLeaderboard={() => setShowLeaderboard(true)}
              soundOn={soundOn} darkMode={darkMode}
              onToggleSound={() => { const on = !soundOn; setSoundEnabled(on); setSoundOn(on); }}
              onToggleDark={() => setDarkMode(!darkMode)}
            />
            {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} initialChallengeId={state.activeChallengeId} />}
            {loadErrorMsg && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold animate-fadeIn">
                    {loadErrorMsg}
                </div>
            )}
            </>
          </Suspense>
      );
  }

  if (view === 'TALENTS') {
      return (
          <Suspense fallback={<FullScreenLoader />}>
            <TalentView
              availableTalents={availableTalents} selectedTalents={selectedTalents} talentPoints={talentPoints} maxTalents={MAX_TALENTS}
              onToggleTalent={handleTalentToggle} onConfirm={handleStartGame} onBack={() => setView('HOME')}
            />
          </Suspense>
      )
  }

  const getAtmosphereTheme = () => {
      if (state.phase === Phase.SUMMER || state.phase === Phase.SUMMER_BREAK || state.phase === Phase.MILITARY) return "bg-gradient-to-br from-green-100 to-emerald-200"; // Summer
      if (state.phase === Phase.WINTER_BREAK) return "bg-gradient-to-br from-slate-100 to-blue-100"; // Winter
      
      if (state.phase === Phase.SEMESTER_1) {
          if (state.week <= 8) return "bg-gradient-to-br from-orange-50 to-amber-100"; // Autumn
          return "bg-gradient-to-br from-slate-100 to-blue-50"; // Winter approaching
      }
      if (state.phase === Phase.SEMESTER_2) {
          if (state.week <= 10) return "bg-gradient-to-br from-emerald-100 to-teal-50"; // Spring
          return "bg-gradient-to-br from-green-50 to-emerald-100"; // Early Summer
      }
      return "bg-slate-100";
  };

  return (
    <div className={`h-[100dvh] transition-all duration-1000 ${getAtmosphereTheme()} ${state.general.mindset <= 20 ? 'grayscale-[0.9] contrast-125 transition-all duration-[3000ms]' : ''} ${darkMode ? 'dark-filter' : ''} flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 overflow-hidden font-sans text-slate-900 relative`}>
            {showContestHistory && <Suspense fallback={null}><ContestHistoryModal state={state} onClose={() => setShowContestHistory(false)} /></Suspense>}
      {showLeaderboard && <Suspense fallback={null}><LeaderboardModal onClose={() => setShowLeaderboard(false)} initialChallengeId={state.activeChallengeId} /></Suspense>}
      {showApiSettings && <Suspense fallback={null}><ApiSettingsModal onClose={() => setShowApiSettings(false)} /></Suspense>}
      <div className={`fixed inset-0 pointer-events-none z-[50] transition-all duration-1000 ${state.general.health < 30 ? 'opacity-100' : 'opacity-0'}`} style={{ boxShadow: 'inset 0 0 100px rgba(255, 0, 0, 0.3)' }}></div>
      <FloatingTextLayer items={floatingTexts} />
      <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
      
      <HistoricalTicker
          events={state.pendingHistoricalEvents}
          onEventClick={(e) => {
              setState(prev => ({
                  ...prev,
                  pendingHistoricalEvents: prev.pendingHistoricalEvents.filter(he => he.id !== e.id),
                  currentEvent: e,
                  isPlaying: false
              }));
          }}
          onAnimationEnd={(id) => {
              setState(prev => ({
                  ...prev,
                  pendingHistoricalEvents: prev.pendingHistoricalEvents.filter(he => he.id !== id)
              }));
          }}
       />
      {showRealityGuide && <Suspense fallback={null}><RealityGuideModal onClose={() => setShowRealityGuide(false)} /></Suspense>}
      
      
      {/* Toast */}
      {state.achievementPopup && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fadeIn border border-slate-700">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 text-xl shadow-lg border-2 border-white"><i className={`fas ${state.achievementPopup.icon}`}></i></div>
              <div>
                  <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Achievement Unlocked</div>
                  <div className="font-black text-lg">{state.achievementPopup.title}</div>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0 z-20">
        <Suspense fallback={null}><StatsPanel state={state} onShowGuide={() => setShowRealityGuide(true)} /></Suspense>
      </div>
      

      {/* Main Area */}
      <main className="flex-1 flex flex-col gap-2 md:gap-4 relative h-full overflow-hidden rounded-2xl">
        
        {/* Mobile Toolbar（单行图标栏，横向可滑动，节省纵向空间） */}
        <div className="md:hidden flex gap-1.5 pb-2.5 flex-shrink-0 overflow-x-auto custom-scroll">
             <button onClick={() => setShowSchedule(true)} disabled={state.isWeekend} className="bg-white border rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0 disabled:opacity-40"><i className="fas fa-calendar-alt text-blue-500 text-sm"></i><span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">时间表</span></button>
             <button onClick={() => setShowShop(true)} className="bg-white border rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0"><i className="fas fa-store text-emerald-500 text-sm"></i><span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">小卖部</span></button>
             <button onClick={() => setShowAchievements(true)} className="bg-white border rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0"><i className="fas fa-trophy text-yellow-500 text-sm"></i><span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">成就</span></button>
             <button onClick={() => setShowHistory(true)} className="bg-white border rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0"><i className="fas fa-archive text-indigo-500 text-sm"></i><span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">历程</span></button>
             <button onClick={() => setShowSaveMenu(true)} disabled={!!state.currentEvent} className="bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0 disabled:opacity-40"><i className="fas fa-save text-emerald-600 text-sm"></i><span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">存档</span></button>
             <button onClick={() => setShowRetireConfirm(true)} disabled={!!state.currentEvent} className="bg-rose-50 border border-rose-100 rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0 disabled:opacity-40"><i className="fas fa-door-open text-rose-600 text-sm"></i><span className="text-[10px] font-bold text-rose-700 whitespace-nowrap">退休</span></button>
             <button onClick={() => setShowStats(true)} className="bg-white border rounded-xl px-2.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5 min-w-[54px] flex-shrink-0"><i className="fas fa-chart-bar text-indigo-500 text-sm"></i><span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">属性</span></button>
        </div>

        {/* Header */}

        <header className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3 flex-shrink-0 z-20 relative">
               <div className="hidden md:flex absolute top-4 left-1/2 -translate-x-1/2 gap-1">
                  <button onClick={() => setShowSchedule(true)} disabled={state.isWeekend} className="bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-600 whitespace-nowrap hover:bg-white hover:shadow transition-all disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:shadow-none"><i className="fas fa-calendar-alt text-blue-500 mr-0.5"></i>时间表</button>
                  <button onClick={() => setShowShop(true)} className="bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-600 whitespace-nowrap hover:bg-white hover:shadow transition-all"><i className="fas fa-store text-emerald-500 mr-0.5"></i>小卖铺</button>
                  <button onClick={() => setShowAchievements(true)} className="bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-600 whitespace-nowrap hover:bg-white hover:shadow transition-all"><i className="fas fa-trophy text-yellow-500 mr-0.5"></i>成就</button>
                  <button onClick={() => setShowHistory(true)} className="bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-600 whitespace-nowrap hover:bg-white hover:shadow transition-all"><i className="fas fa-archive text-indigo-500 mr-0.5"></i>历程</button>
                  <button onClick={() => { playConfirm(); saveGame(); }} disabled={!!state.currentEvent} className="bg-emerald-50 border border-emerald-200 px-2.5 py-2 rounded-xl text-xs font-bold text-emerald-600 whitespace-nowrap hover:bg-emerald-100 transition-all"><i className="fas fa-save mr-0.5"></i>保存</button>
                  <button onClick={() => { playConfirm(); exportSave(); }} className="bg-sky-50 border border-sky-200 px-2.5 py-2 rounded-xl text-xs font-bold text-sky-600 whitespace-nowrap hover:bg-sky-100 transition-all"><i className="fas fa-file-export mr-0.5"></i>导出</button>
                  <button onClick={() => { playClick(); importInputRef.current?.click(); }} className="bg-sky-50 border border-sky-200 px-2.5 py-2 rounded-xl text-xs font-bold text-sky-600 whitespace-nowrap hover:bg-sky-100 transition-all"><i className="fas fa-file-import mr-0.5"></i>导入</button>
                  <button onClick={() => setShowRetireConfirm(true)} className="bg-rose-50 border border-rose-200 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 whitespace-nowrap hover:bg-rose-100 transition-all"><i className="fas fa-door-open mr-0.5"></i>退休</button>
               </div>
               <div className="flex items-center justify-between mt-0">
                   <div className="flex flex-col gap-1 w-full mr-4">
                       <h2 className="font-black text-slate-800 text-lg flex items-center gap-2 uppercase tracking-tight truncate">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${state.isSick ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></span> {PHASE_NAMES[state.phase] || state.phase}
                        </h2>
                        <div className="flex gap-2 items-center flex-wrap">
                            {state.activeStatuses.map(s => (
                                <div key={s.id} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold ${s.type === 'BUFF' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : s.type === 'DEBUFF' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                    <i className={`fas ${s.icon}`}></i> {s.name} ({s.duration}w)
                                </div>
                            ))}
                            {state.talents.map(t => (
                                <div key={t.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold bg-purple-50 border-purple-200 text-purple-700">
                                     <i className="fas fa-star"></i> {t.name}
                                </div>
                            ))}
                        </div>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      <button
                         onClick={() => setState(p => ({ ...p, isPlaying: !p.isPlaying }))}
                         disabled={!!state.currentEvent || state.isWeekend || !!weekendResult}
                         className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex-shrink-0 flex items-center justify-center shadow-xl transition-all ${state.currentEvent || state.isWeekend || weekendResult ? 'bg-slate-100 text-slate-300' : state.isPlaying ? 'bg-amber-400 text-white hover:bg-amber-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                         <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                      </button>
                      {!state.currentEvent && !state.isWeekend && !weekendResult && (
                         <span className="text-[10px] font-bold text-slate-400">{state.isPlaying ? '进行中' : '点击开始'}</span>
                      )}
                   </div>
               </div>
               <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Week {state.week}/{state.totalWeeksInPhase || '-'}</span>
               </div>
        </header>

        {/* Log */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden relative">
          <div className="h-full p-4 md:p-6 overflow-y-auto custom-scroll space-y-3">
             {state.log.map((l, i) => {
                const iconMap: Record<string, string> = { event: 'fa-bolt', success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
                const colorMap: Record<string, string> = { event: 'text-indigo-500', success: 'text-emerald-500', error: 'text-rose-500', warning: 'text-amber-500', info: 'text-slate-400' };
                return (
                <div key={i} className={`group p-3 rounded-xl border-l-4 animate-fadeIn ${l.type === 'event' ? 'bg-indigo-50 border-indigo-400' : l.type === 'success' ? 'bg-emerald-50 border-emerald-400' : l.type === 'error' ? 'bg-rose-50 border-rose-400' : l.type === 'warning' ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-300'}`}>
                   <div className="flex items-center gap-2 mb-0.5">
                      <i className={`fas ${iconMap[l.type] || 'fa-circle'} text-[10px] ${colorMap[l.type] || 'text-slate-400'}`}></i>
                      {l.week != null && <span className="text-[10px] font-bold text-slate-400">第{l.week}周</span>}
                   </div>
                   <p className="text-sm font-medium text-slate-800">{l.message}</p>
                </div>
             )})}
             <div ref={logEndRef} />
          </div>
        </div>

        {/* --- Overlays & Modals --- */}

        {/* Timetable Menu */}
        {state.isWeekend && (
            <Suspense fallback={null}><TimetableModal state={state} onConfirm={(schedule) => {
                executeTimetable(schedule);
            }} /></Suspense>
        )}
        {/* Timetable (View Mode) */}
        {showSchedule && !state.isWeekend && (
            <Suspense fallback={null}><TimetableModal state={state} onConfirm={() => setShowSchedule(false)} /></Suspense>
        )}
        {/* Event Modal */}
        {state.currentEvent && (
            <EventModal
                event={state.currentEvent} state={state} eventResult={state.eventResult}
                onChoice={(c, e) => { playClick(); handleChoice(c, (oldS, newS) => calculateAndVisualizeDiff(oldS, newS, e.clientX, e.clientY)); }}
                onConfirm={() => { playConfirm(); handleEventConfirm(); }}
            />
        )}

        {/* Exams */}
        {(state.phase === Phase.PLACEMENT_EXAM || state.phase === Phase.FINAL_EXAM || state.phase === Phase.MIDTERM_EXAM || state.phase === Phase.MIDTERM_EXAM_2 || state.phase === Phase.FINAL_EXAM_2 || state.phase === Phase.CSP_EXAM || state.phase === Phase.NOIP_EXAM || state.phase === Phase.WC_EXAM || state.phase === Phase.PROVINCIAL_EXAM || state.phase === Phase.APIO_EXAM || state.phase === Phase.NOI_EXAM) && (
             <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden">
                 <Suspense fallback={<div className="flex items-center justify-center h-full"><i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i></div>}><ExamView title={state.phase} state={state} onFinish={handleExamFinish} /></Suspense>
             </div>
        )}

        {/* Popup Results (Competitions/Exams) */}
        {state.popupCompetitionResult && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fadeIn p-4">
                <div className="bg-white rounded-[40px] p-8 md:p-12 text-center max-w-lg w-full shadow-2xl relative border-4 border-yellow-400">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white"><i className="fas fa-trophy text-white text-4xl"></i></div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-6 mb-2">{state.popupCompetitionResult.title}</h3>
                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                        <div className="text-4xl font-black text-indigo-600 mb-2">{state.popupCompetitionResult.score} pts</div>
                        <div className="text-2xl font-bold text-yellow-600">{state.popupCompetitionResult.award}</div>
                    </div>
                    <button onClick={closeCompetitionPopup} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl w-full">收入囊中</button>
                </div>
             </div>
        )}

        {state.popupExamResult && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fadeIn p-4">
                <div className="bg-white rounded-[40px] p-8 md:p-12 text-center max-w-lg w-full shadow-2xl relative border-4 border-yellow-400">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white"><i className="fas fa-file-alt text-white text-4xl"></i></div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-6 mb-2">{state.popupExamResult.title}</h3>
                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                        <div className="text-4xl font-black text-indigo-600 mb-2">{state.popupExamResult.totalScore}</div>
                        {state.popupExamResult.rank && state.popupExamResult.rank > 0 && (
                            <div className="text-xl font-bold text-slate-500 mb-4">年级排名: {state.popupExamResult.rank}</div>
                        )}
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm text-slate-700">
                            {Object.entries(state.popupExamResult.scores).map(([subj, score]) => (
                                <div key={subj} className="bg-white p-2 rounded border border-slate-200">
                                    <span className="font-bold text-slate-600">{
                                        {'chinese': '语文', 'math': '数学', 'english': '英语', 'physics': '物理', 'chemistry': '化学', 'biology': '生物', 'history': '历史', 'geography': '地理', 'politics': '政治'}[subj] || subj
                                    }: </span>
                                    <span className="text-indigo-600">{score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={closeExamResult} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl w-full">继续</button>
                </div>
             </div>
        )}

        {/* Selection */}
        {(state.phase === Phase.SELECTION || state.phase === Phase.SUBJECT_RESELECTION) && (
            <SubjectSelectionModal
                state={state}
                onToggle={(s) => setState(prev => ({ ...prev, selectedSubjects: prev.selectedSubjects.includes(s) ? prev.selectedSubjects.filter(x => x !== s) : (prev.selectedSubjects.length < 3 ? [...prev.selectedSubjects, s] : prev.selectedSubjects) }))}
                onConfirm={() => setState(prev => {
                    const nextPhase = prev.phase === Phase.SELECTION ? Phase.PLACEMENT_EXAM : Phase.SEMESTER_1;
                    return {
                        ...prev,
                        phase: nextPhase,
                        isPlaying: prev.phase === Phase.SUBJECT_RESELECTION,
                        totalWeeksInPhase: nextPhase === Phase.SEMESTER_1 ? 21 : 0
                    };
                })}
            />
        )}

        {/* Club Selection */}
        {showClubSelection && (
            <ClubSelectionModal onSelect={(id) => { handleClubSelect(id); setShowClubSelection(false); }} />
        )}

        {/* Shop */}
        {showShop && (
            <ShopModal state={state} onClose={() => setShowShop(false)} onPurchase={(item, actualPrice) => handleShopPurchase(item, () => spawnFloatingText(`-${actualPrice}`, window.innerWidth/2, window.innerHeight/2, 'money'))} />
        )}

        {/* History */}
        {showHistory && (
            <HistoryPanel history={state.history} onClose={() => setShowHistory(false)} />
        )}

        {/* Achievements */}
        {showAchievements && (
            <GameAchievementsModal unlockedAchievements={state.unlockedAchievements} onClose={() => setShowAchievements(false)} />
        )}
        
        {/* 移动端存档菜单（保存/导出/导入） */}
        {showSaveMenu && (
            <SaveMenuSheet
                onSave={() => { playConfirm(); saveGame(); setShowSaveMenu(false); }}
                onExport={() => { playConfirm(); exportSave(); setShowSaveMenu(false); }}
                onImport={() => { playClick(); importInputRef.current?.click(); setShowSaveMenu(false); }}
                onClose={() => setShowSaveMenu(false)}
                saveDisabled={!!state.currentEvent}
            />
        )}

        {/* 提前退休确认弹窗 */}
        {showRetireConfirm && state.phase !== Phase.WITHDRAWAL && state.phase !== Phase.ENDING && (
            <RetireConfirmModal
                onCancel={() => setShowRetireConfirm(false)}
                onConfirm={() => { setState(p => ({ ...p, phase: Phase.WITHDRAWAL })); setShowRetireConfirm(false); }}
            />
        )}

        {/* 移动端属性面板 */}
        {showStats && (
            <MobileStatsModal state={state} onClose={() => setShowStats(false)} onShowGuide={() => setShowRealityGuide(true)} />
        )}

        {/* Ending */}
        {(state.phase === Phase.ENDING || state.phase === Phase.WITHDRAWAL) && (
            <Suspense fallback={null}>
            <EndingScreen
                state={state}
                endingData={getEndingData()}
                onRestart={() => setView('HOME')}
                onShowLeaderboard={() => setShowLeaderboard(true)}
            />
            </Suspense>
        )}

      </main>
    </div>
  );
};

export default App;
