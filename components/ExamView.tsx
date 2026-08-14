
import React, { useState, useEffect, useRef } from 'react';
import { GameState, ExamResult, SubjectKey, SUBJECT_NAMES, Phase, OIProblem, OIStats } from '../types';
import { OI_PROBLEMS } from '../data/oi_data';
import { PHASE_NAMES } from '../hooks/useGameLogic';
import { getExamScoreMultiplier } from '../data/utils';

interface ExamViewProps {
  title: string;
  state: GameState;
  onFinish: (result: ExamResult) => void;
}

const ExamView: React.FC<ExamViewProps> = ({ title, state, onFinish }) => {
  const [examStep, setExamStep] = useState(0);
  const [examLogs, setExamLogs] = useState<string[]>([]);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [confirmFlash, setConfirmFlash] = useState(false);
  const confirmHeldRef = useRef(false);

  // Determine which subjects to test based on phase
  const getSubjectsToTest = (): string[] => {
    if ([Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM].includes(state.phase)) {
      const problemCount = [Phase.NOI_EXAM].includes(state.phase) ? 8 : [Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM].includes(state.phase) ? 6 : 4;
      return Array.from({length: problemCount}, (_, i) => `oi_prob_${i+1}`);
    }
    if (state.phase === Phase.PLACEMENT_EXAM) {
        if (state.selectedSubjects && state.selectedSubjects.length === 3) {
            return ['chinese', 'math', 'english', ...state.selectedSubjects];
        }
        // Fallback
        return ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology'];
    }
    if (state.phase === Phase.MIDTERM_EXAM || state.phase === Phase.FINAL_EXAM || state.phase === Phase.MIDTERM_EXAM_2 || state.phase === Phase.FINAL_EXAM_2) {
      if (state.selectedSubjects.length === 3) {
          return ['chinese', 'math', 'english', ...state.selectedSubjects];
      }
      return ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology'];
    }
    return Object.keys(state.subjects) as SubjectKey[];
  };

  const [subjectsToTest] = useState(getSubjectsToTest());
  const [oiProblems] = useState<OIProblem[]>(() => {
       if ([Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM].includes(state.phase)) {
           const problemCount = [Phase.NOI_EXAM].includes(state.phase) ? 8 : [Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM].includes(state.phase) ? 6 : 4;
           const shuffled = [...OI_PROBLEMS].sort(() => 0.5 - Math.random());
           return shuffled.slice(0, problemCount);
       }
       return [];
  });

  // --- DIFFICULTY CONFIGURATION ---
  // Lower is easier (divider), Higher is harder
  const getDifficultyModifier = (phase: Phase): number => {
      switch (phase) {
          case Phase.PLACEMENT_EXAM: return 1.0; // 新手福利，很容易高分
          case Phase.MIDTERM_EXAM: return 1.2;   // 标准难度
          case Phase.FINAL_EXAM: return 1.5;     // 期末地狱难度，检验一学期成果
          case Phase.MIDTERM_EXAM_2: return 1.3; // 下半学期期中
          case Phase.FINAL_EXAM_2: return 1.6;   // 高一下期末
          case Phase.CSP_EXAM: return 1.0;
          case Phase.NOIP_EXAM: return 1.3;
          case Phase.WC_EXAM: return 1.5;
          case Phase.PROVINCIAL_EXAM: return 1.8;
          case Phase.APIO_EXAM: return 1.6;
          case Phase.NOI_EXAM: return 2.0;
          default: return 1.0;
      }
  };

  const isOIExam = [Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM].includes(state.phase);

  // In-game time label for log timestamps, e.g. "[第8周·期中考试]"
  const getInGameTime = (): string => `[第${state.week}周·${PHASE_NAMES[state.phase] || state.phase}]`;

  // Running total shown in the header
  const currentTotal = (Object.values(currentScores) as number[]).reduce((a, b) => a + b, 0);
  const maxTotal = isOIExam ? subjectsToTest.length * 100 : subjectsToTest.reduce((acc, s) => acc + (['chinese', 'math', 'english'].includes(s) ? 150 : 100), 0);

  // Ref for the currently-being-tested card so it can be scrolled into view on mobile
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (examStep < subjectsToTest.length) {
      const subjectKey = subjectsToTest[examStep];
      const isOI = [Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM].includes(state.phase);
      const difficultyMod = getDifficultyModifier(state.phase);

      const timer = setTimeout(() => {
        let score = 0;
        let maxScore = 100;
        let logMsg = '';
        let extraLog = '';

        // --- LUCK MECHANIC REWORKED ---
        // 1. Base Multiplier: 0.9 ~ 1.1 (Standard Variance)
        let luckMultiplier = 1.0 + (Math.random() * 0.2 - 0.1);

        // 2. Luck Stat Influence (Luck 0 -> -10%, Luck 100 -> +10%)
        luckMultiplier += (state.general.luck - 50) / 500;

        // 3. Critical Hit Mechanic (Lucky Shot)
        // Chance to crit increases with Luck. Luck 50 = 5% chance, Luck 100 = 15% chance.
        const critChance = Math.max(0, state.general.luck - 20) / 500;
        if (Math.random() < critChance) {
            luckMultiplier += 0.25; // Huge bonus
            extraLog = ' (超常发挥！)';
        }

        // 4. Bad Luck Fumble
        // Chance to fumble decreases with Luck. Luck 0 = 10% chance, Luck 100 = 0%.
        const fumbleChance = Math.max(0, (50 - state.general.luck) / 500);
        if (Math.random() < fumbleChance) {
            luckMultiplier -= 0.2;
            extraLog = ' (失误了...)';
        }

        // Mindset Stability: Low mindset increases risk of bad variance
        if (state.general.mindset < 30) {
            luckMultiplier -= Math.random() * 0.1;
        }

        if (isOI) {
             const prob = oiProblems[examStep];
             maxScore = 100;
             const stats = state.oiStats;

             let ability = 0;
             let required = 0;

             if (prob.difficulty.dp > 0) { ability += stats.dp; required += prob.difficulty.dp; }
             if (prob.difficulty.ds > 0) { ability += stats.ds; required += prob.difficulty.ds; }
             if (prob.difficulty.math > 0) { ability += stats.math; required += prob.difficulty.math; }
             if (prob.difficulty.string > 0) { ability += stats.string; required += prob.difficulty.string; }
             if (prob.difficulty.graph > 0) { ability += stats.graph; required += prob.difficulty.graph; }
             if (prob.difficulty.misc > 0) { ability += stats.misc; required += prob.difficulty.misc; }

             ability += state.subjects.math.aptitude * 0.1;
             ability += state.subjects.math.level * 0.5;

             // Difficulty scaling: requirement * base_scale * difficulty_modifier
             const difficultyFactor = Math.max(1, required * 1.5 * difficultyMod);

             let rawRatio = ability / difficultyFactor;
             let finalRatio = rawRatio * luckMultiplier;

             if (finalRatio >= 0.95) score = 100;
             else score = Math.max(0, Math.floor(Math.min(100, finalRatio * 100)));

             logMsg = `题目 "${prob.name}" 测试结束，获得 ${score} 分${extraLog}。`;

        } else {
            // Standard Exam Logic
            const subject = subjectKey as SubjectKey;
            const isMainSubject = ['chinese', 'math', 'english'].includes(subject);
            maxScore = isMainSubject ? 150 : 100;

            const stats = state.subjects[subject];

            // Formula: (Aptitude * 0.4 + Level * 3.0) / DifficultyMod
            // Example Final Exam (Diff 1.3):
            // Apt 80, Lvl 20 -> (32 + 60) / 1.3 = 70.7 (70% score) -> OK
            // Apt 80, Lvl 10 -> (32 + 30) / 1.3 = 47.6 (47% score) -> Fail

            let basePercentage = (stats.aptitude * 0.4 + stats.level * 3.0);

            // Apply Difficulty scaling
            basePercentage = basePercentage / difficultyMod;

            // Efficiency Bonus
            if (state.general.efficiency > 15) {
                basePercentage += (state.general.efficiency - 15) * 1.0;
            }

            let finalScoreRaw = basePercentage * luckMultiplier;

            // Cap at 100% relative
            let finalPercentage = Math.min(100, Math.max(0, finalScoreRaw)) / 100;

            score = Math.floor(finalPercentage * maxScore);
            logMsg = `${SUBJECT_NAMES[subject]} 考试结束，得分 ${score}/${maxScore}${extraLog}。`;
        }

        setCurrentScores(prev => ({ ...prev, [subjectKey]: score }));
        setExamLogs(prev => [...prev, logMsg]);
        setExamStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (!isFinished) {
      setIsFinished(true);
    }
  }, [examStep, state, currentScores, isFinished, subjectsToTest, oiProblems]);

  // Keep the currently-being-tested card visible in the scroll row on mobile
  useEffect(() => {
    if (examStep < subjectsToTest.length && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [examStep, subjectsToTest]);

  const handleFinishConfirm = () => {
      // 天赋被动「考试分数加成」（如天才 ×1.05）作用于各科成绩
      const multiplier = getExamScoreMultiplier(state);
      const boostedScores: Record<string, number> = {};
      let total = 0;
      for (const key of Object.keys(currentScores)) {
          const boosted = Math.round(currentScores[key] * multiplier);
          boostedScores[key] = boosted;
          total += boosted;
      }

      let comment = "继续努力。";
      // Comments based on relative performance (Phase sensitive)
      const ratio = total / maxTotal;

      if ([Phase.CSP_EXAM, Phase.NOIP_EXAM, Phase.WC_EXAM, Phase.PROVINCIAL_EXAM, Phase.APIO_EXAM, Phase.NOI_EXAM].includes(state.phase)) {
          if (total >= 300) comment = "神乎其技，你就是机房的传说！";
          else if (total >= 200) comment = "发挥稳定，应该能拿奖。";
          else if (total >= 100) comment = "有些遗憾，明年再战。";
          else comment = "技不如人，甘拜下风。";
      } else {
          if (ratio > 0.90) comment = "傲视群雄，你是八中当之无愧的传说！";
          else if (ratio > 0.80) comment = "表现优异，稳居年级前列。";
          else if (ratio > 0.70) comment = "成绩良好，未来可期。";
          else if (ratio > 0.60) comment = "中规中矩，还需要加把劲。";
          else comment = "基础不牢，地动山摇，要小心了。";
      }

      onFinish({
        title,
        scores: boostedScores,
        totalScore: total,
        comment
      });
  };

  const isActive = (idx: number) => !isFinished && idx === examStep && examStep < subjectsToTest.length;

  // 考试结束出现「查看排名 / 继续」按钮后，Enter/空格 按住缩小、松开触发（结果弹窗弹出后不再响应）
  useEffect(() => {
    if (!isFinished) return;
    const keydownHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (state.popupExamResult) return;
      if ((e.key === 'Enter' || e.key === ' ') && !confirmHeldRef.current) {
        e.preventDefault();
        confirmHeldRef.current = true;
        setConfirmFlash(true);
      }
    };
    const keyupHandler = () => {
      if (!confirmHeldRef.current) return;
      confirmHeldRef.current = false;
      setConfirmFlash(false);
      handleFinishConfirm();
    };
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
  }, [isFinished, state.popupExamResult, handleFinishConfirm]);

  return (
    <div className="bg-white rounded-3xl p-8 h-full flex flex-col shadow-2xl overflow-hidden relative border border-slate-200">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
          <i className="fas fa-file-signature text-indigo-500"></i>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-mono whitespace-nowrap">
            总分: {currentTotal} / {maxTotal}
          </div>
          <div className="px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-mono">
            STATUS: {isFinished ? 'COMPLETED' : 'IN_PROGRESS'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 font-mono text-sm custom-scroll pr-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
        {examLogs.map((log, i) => (
          <div key={i} className="flex gap-4 items-start animate-fadeIn">
            <span className="text-slate-400">{getInGameTime()}</span>
            <span className={`text-slate-700 ${log.includes('超常发挥') ? 'text-amber-600 font-bold' : log.includes('失误') ? 'text-rose-600' : ''}`}>{log}</span>
          </div>
        ))}
        {examStep < subjectsToTest.length && (
          <div className="flex gap-4 items-center">
            <span className="text-slate-400">{getInGameTime()}</span>
            <span className="text-slate-500 font-bold">
               {isOIExam
                   ? `正在攻克 ${oiProblems[examStep]?.name || 'Unknown Problem'}...`
                   : `正在进行 ${SUBJECT_NAMES[subjectsToTest[examStep] as SubjectKey]} 考试...`}
            </span>
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 custom-scroll md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0 mb-8">
        {subjectsToTest.map((sub, idx) => (
          <div
            key={sub}
            ref={isActive(idx) ? activeCardRef : undefined}
            className={`relative bg-white rounded-xl p-3 border shadow-sm text-center shrink-0 w-28 md:w-auto transition-all ${
              isActive(idx) ? 'border-indigo-400 ring-2 ring-indigo-500 shadow-indigo-100' : 'border-slate-200'
            }`}
          >
            {isActive(idx) && (
              <>
                <span className="absolute inset-0 rounded-xl ring-2 ring-indigo-500 animate-ping pointer-events-none"></span>
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-full animate-ping pointer-events-none"></span>
              </>
            )}
            <div className="text-[10px] text-slate-500 uppercase truncate mb-1">
                {isOIExam ? oiProblems[idx]?.name : SUBJECT_NAMES[sub as SubjectKey]}
            </div>
            <div className="text-xl font-black text-indigo-600">{currentScores[sub] ?? '--'}</div>
          </div>
        ))}
      </div>

      {isFinished && (
          <button onClick={handleFinishConfirm} className={`relative w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl transition-all animate-fadeIn flex items-baseline justify-center gap-2 active:scale-95 ${confirmFlash ? 'key-pressed' : ''}`}>
              查看排名 / 继续 <i className="fas fa-arrow-right"></i> <span className="absolute bottom-2 right-3 text-sm font-black opacity-40 hidden md:inline">⏎</span>
          </button>
      )}
    </div>
  );
};

export default ExamView;
