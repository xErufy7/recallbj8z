
import React from 'react';
import { Talent } from '../types';

interface TalentViewProps {
    availableTalents: Talent[];
    selectedTalents: Talent[];
    talentPoints: number;
    onToggleTalent: (talent: Talent) => void;
    onConfirm: () => void;
    onBack: () => void;
}

const TalentView: React.FC<TalentViewProps> = ({ availableTalents, selectedTalents, talentPoints, onToggleTalent, onConfirm, onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* 顶部固定栏：标题 + 剩余点数 + 操作提示，滚动时始终可见 */}
            <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl w-full mx-auto px-4 md:px-6 py-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">天赋抉择</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-slate-500 font-bold text-sm">剩余点数</span>
                            <span className={`text-xl font-black leading-none ${talentPoints >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{talentPoints}</span>
                        </div>
                        <span className="text-xs text-slate-400">选择负面天赋以获取更多点数</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 lg:ml-auto">点击选择/取消天赋</span>
                </div>
            </header>

            {/* 天赋卡片网格（独立滚动区域，不与底部栏重叠） */}
            <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 md:px-6 py-4 overflow-y-auto custom-scroll">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-6 md:pb-24">
                    {availableTalents.map(talent => {
                        const isSelected = selectedTalents.some(t => t.id === talent.id);
                        const isDebuff = talent.cost < 0;
                        return (
                            <button
                                key={talent.id}
                                onClick={() => onToggleTalent(talent)}
                                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-start gap-2 h-44 relative overflow-hidden group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                    isSelected
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-300/50 transform scale-105 z-10'
                                        : isDebuff
                                        ? 'bg-rose-50/70 border-rose-300 text-slate-600 hover:border-rose-400 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-200/60 hover:-translate-y-0.5'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-indigo-200/60 hover:-translate-y-0.5'
                                }`}
                            >
                                <div className="flex justify-between w-full items-start">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${talent.rarity === 'cursed' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {talent.rarity}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-1 rounded-full ${talent.cost > 0 ? 'bg-slate-100 text-red-500' : 'bg-slate-100 text-emerald-600'}`}>
                                        {talent.cost > 0 ? `-${talent.cost}` : `+${Math.abs(talent.cost)}`}
                                    </span>
                                </div>

                                <h3 className="text-base md:text-lg font-bold mt-1 leading-tight">{talent.name}</h3>
                                <p className={`text-xs leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>{talent.description}</p>

                                {/* 悬浮提示：告知玩家卡片可点击选择/取消 */}
                                <div className={`absolute inset-x-0 bottom-0 py-1 text-center text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                                    isSelected
                                        ? 'bg-black/25 text-white'
                                        : isDebuff
                                        ? 'bg-rose-100/95 text-rose-600'
                                        : 'bg-indigo-50/95 text-indigo-600'
                                }`}>
                                    {isSelected ? '点击取消' : '点击选择'}
                                </div>

                            </button>
                        );
                    })}
                </div>
            </main>

            {/* 底部确认栏：独立占位，不会遮挡卡片网格 */}
            <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
                <div className="max-w-6xl w-full mx-auto px-4 md:px-6 py-4 flex items-center justify-center gap-4">
                    <button onClick={onBack} className="text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-2">返回</button>
                    <button
                        onClick={onConfirm}
                        disabled={talentPoints < 0}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                    >
                        {talentPoints < 0 ? '点数不足' : '入学吧。'}
                        {talentPoints >= 0 && <i className="fas fa-arrow-right"></i>}
                    </button>
                </div>
            </footer>
        </div>
    );
};
export default TalentView;
