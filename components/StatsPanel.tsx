
import React, { useEffect, useRef, useState } from 'react';
import { GameState, SUBJECT_NAMES, SubjectKey } from '../types';
import { getEffectiveEfficiency } from '../data/utils';

interface StatsPanelProps {
  state: GameState;
  onShowGuide?: () => void;
}

// 主科（语数英为必考科目），其余 6 科中选考 3 科
const MAIN_SUBJECT_KEYS: SubjectKey[] = ['chinese', 'math', 'english'];
const OPTIONAL_SUBJECT_KEYS: SubjectKey[] = ['physics', 'chemistry', 'biology', 'history', 'geography', 'politics'];

const StatsPanel: React.FC<StatsPanelProps> = ({ state, onShowGuide }) => {
  const effectiveEfficiency = getEffectiveEfficiency(state);

  const selectedOptionalKeys = OPTIONAL_SUBJECT_KEYS.filter((k) => state.selectedSubjects.includes(k));
  const unselectedOptionalKeys = OPTIONAL_SUBJECT_KEYS.filter((k) => !state.selectedSubjects.includes(k));

  const renderSubjectBar = (key: SubjectKey) => {
    const isSelected = state.selectedSubjects.includes(key);
    const subject = state.subjects[key];
    return (
      <div key={key} className="group">
        <div className="flex justify-between text-[11px] mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{SUBJECT_NAMES[key]}</span>
            {isSelected && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-bold">选考</span>}
          </div>
          <span className="text-slate-400">
            {state.difficulty === 'REALITY' ? (
              ''
            ) : (
              <>
                天赋 <FlashValue value={subject.aptitude} format={(v) => String(v)} className="text-slate-500" /> | 水平{' '}
                <FlashValue value={subject.level} format={(v) => v.toFixed(1)} className="text-slate-500" />
              </>
            )}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-indigo-500 group-hover:bg-indigo-400 transition-all duration-700"
            style={{ width: `${Math.min(100, subject.level)}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSubjectSection = (
    title: string,
    icon: string,
    tintClass: string,
    titleClass: string,
    keys: SubjectKey[]
  ) => (
    <div className={`rounded-xl p-2.5 border ${tintClass}`}>
      <div className={`text-[10px] font-black tracking-widest uppercase mb-2.5 flex items-center gap-1.5 ${titleClass}`}>
        <i className={`fas ${icon}`}></i>
        <span>{title}</span>
        <span className="opacity-60">({keys.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {keys.map(renderSubjectBar)}
      </div>
    </div>
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 overflow-hidden h-full transition-colors duration-300">
      <div className="p-5 space-y-6 h-full overflow-y-auto custom-scroll flex flex-col">
      {/* 状态概览 */}
      <div>
        {state.worldContext && (
            <div className="mb-4 p-3 bg-gradient-to-r from-slate-800 to-indigo-900 rounded-xl text-white shadow-inner flex flex-col gap-1 relative overflow-hidden">
                <i className="fas fa-globe-asia absolute -right-2 -bottom-4 text-6xl text-white/10"></i>
                <div className="text-[10px] text-indigo-200 font-bold tracking-widest uppercase mb-1">World Context</div>
                <div className="flex items-center justify-between z-10">
                    <span className="font-black text-sm">{state.worldContext.region}</span>
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{state.worldContext.yearStart} - {state.worldContext.yearEnd}</span>
                </div>
            </div>
        )}
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-user-circle"></i> 个人档案
            </h3>
            {state.isAiGenerating && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100 animate-pulse">
                     <i className="fas fa-robot"></i> 正在生成事件...
                 </div>
            )}
        </div>
      </div>

      {/* 学业背景 */}
      <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-indigo-800">班级: {state.className || '待分班'}</span>
          <span className="text-xs font-bold text-indigo-800">
              效率: {state.difficulty === 'REALITY' ? (effectiveEfficiency >= 15 ? '高' : effectiveEfficiency >= 8 ? '中' : '低') : effectiveEfficiency.toFixed(1)}
              {effectiveEfficiency > state.general.efficiency && <span className="text-emerald-500 text-[10px] ml-1">(+{ (effectiveEfficiency - state.general.efficiency).toFixed(0) })</span>}
          </span>
        </div>
        <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, effectiveEfficiency * 5)}%` }}></div>
        </div>
      </div>

      {/* 6大基础属性 */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <i className="fas fa-chart-bar"></i> 基础属性
        </h3>
        <div className="grid grid-cols-2 gap-2">
            <StatMini icon="fa-brain" label="心态" value={state.general.mindset} color="text-indigo-500" hideValue={state.difficulty === 'REALITY'} />
            <StatMini icon="fa-heartbeat" label="健康" value={state.general.health} color="text-emerald-500" hideValue={state.difficulty === 'REALITY'} />
            <StatMini icon="fa-coins" label="金钱" value={state.general.money} color="text-yellow-600" hideValue={state.difficulty === 'REALITY'} />
            <StatMini icon="fa-book" label="经验" value={state.general.experience} color="text-blue-500" hideValue={state.difficulty === 'REALITY'} />
            <StatMini icon="fa-star" label="幸运" value={state.general.luck} color="text-amber-500" hideValue={state.difficulty === 'REALITY'} />
            <StatMini icon="fa-heart" label="桃花" value={state.general.romance} color="text-pink-500" hideValue={state.difficulty === 'REALITY'} />
        </div>
      </div>

       {/* 天赋展示 */}
       {state.talents.length > 0 && (
           <div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <i className="fas fa-dna"></i> 天赋
               </h3>
               <div className="flex flex-wrap gap-2">
                   {state.talents.map(t => (
                       <div key={t.id} className={`px-2 py-1 rounded text-[10px] font-bold border ${t.rarity === 'legendary' ? 'bg-amber-50 border-amber-300 text-amber-700' : t.rarity === 'rare' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : t.rarity === 'cursed' ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600'}`} title={t.description}>
                           {t.name}
                       </div>
                   ))}
               </div>
           </div>
       )}

      {/* 学科属性 */}
      <div className="flex-1 pb-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <i className="fas fa-graduation-cap"></i> 学科能力
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {renderSubjectSection('主科', 'fa-book-open', 'bg-indigo-50/60 border-indigo-100', 'text-indigo-700', MAIN_SUBJECT_KEYS)}
          {selectedOptionalKeys.length > 0 &&
            renderSubjectSection('选考', 'fa-star', 'bg-emerald-50/60 border-emerald-100', 'text-emerald-700', selectedOptionalKeys)}
          {unselectedOptionalKeys.length > 0 &&
            renderSubjectSection('非选考', 'fa-book', 'bg-slate-100/50 border-slate-200', 'text-slate-500', unselectedOptionalKeys)}
        </div>
      </div>

      {/* 数值变化闪烁动画（绿色=上升，红色=下降） */}
      <style>{`
        @keyframes r8zFlashUp {
          0% { background-color: rgba(16, 185, 129, 0.45); box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3); }
          100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes r8zFlashDown {
          0% { background-color: rgba(239, 68, 68, 0.45); box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3); }
          100% { background-color: transparent; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .r8z-flash-value { display: inline-block; border-radius: 4px; padding: 0 3px; margin: 0 -3px; }
        .r8z-flash-up { animation: r8zFlashUp 1s ease-out forwards; }
        .r8z-flash-down { animation: r8zFlashDown 1s ease-out forwards; }
      `}</style>
      </div>
    </div>
  );
};

/**
 * 数值变化时短暂闪烁：上升变绿、下降变红。
 * 通过 useEffect 对比上一次的值判断方向，并用递增的 key 强制重挂载 span 以重新触发 CSS 动画。
 */
const FlashValue: React.FC<{
  value: number;
  format?: (v: number) => string;
  className?: string;
}> = ({ value, format, className }) => {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev !== null && prev !== value) {
      setFlash(value > prev ? 'up' : 'down');
      setFlashKey((k) => k + 1); // 重挂载以重新触发动画
    }
    prevRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(t);
  }, [flash]);

  const flashClass = flash === 'up' ? 'r8z-flash-up' : flash === 'down' ? 'r8z-flash-down' : '';

  return (
    <span key={flashKey} className={`r8z-flash-value ${className || ''} ${flashClass}`.trim()}>
      {format ? format(value) : value.toFixed(0)}
    </span>
  );
};

const StatMini = ({ icon, label, value, color, hideValue }: { icon: string, label: string, value: number, color: string, hideValue?: boolean }) => {
  const getVagueLabel = (v: number) => {
    if (v >= 80) return '极高';
    if (v >= 60) return '较高';
    if (v >= 40) return '一般';
    if (v >= 20) return '较低';
    return '极低';
  };
  return (
    <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100 hover:border-indigo-200 transition-colors">
      <i className={`fas ${icon} ${color} text-sm mb-1`}></i>
      <span className="text-[10px] text-slate-500">{label}</span>
      <FlashValue value={value} className={`text-xs font-bold ${color}`} format={hideValue ? getVagueLabel : undefined} />
    </div>
  );
};

export default StatsPanel;
