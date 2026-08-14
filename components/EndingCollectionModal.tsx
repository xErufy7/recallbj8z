
import React, { useState } from 'react';
import { getCollectedEndings } from '../hooks/gameLogic/storage';
import { RANK_COLORS } from '../lib/reportCard';
import { DIFFICULTY_PRESETS } from '../data/constants';
import { Difficulty } from '../types';

interface EndingCollectionModalProps {
    onClose: () => void;
}

/** 结局图鉴：展示已收集的结局评级/称号，鼓励多周目收集 */
const EndingCollectionModal: React.FC<EndingCollectionModalProps> = ({ onClose }) => {
    const [endings] = useState(() => getCollectedEndings());

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-4 md:p-8 max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col no-btn-scale" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2"><i className="fas fa-scroll text-purple-500"></i>结局图鉴</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">已收集 <span className="text-purple-600 font-bold">{endings.length}</span> 个结局 · 每个结局都值得再走一遍</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors flex-shrink-0"><i className="fas fa-times"></i></button>
                </div>

                {endings.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 text-4xl mb-4"><i className="fas fa-question"></i></div>
                        <p className="text-sm font-black text-slate-500">还没有通关记录</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">开启你的高中生活，收集第一个结局吧！</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scroll pr-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {endings.map((e, i) => {
                                const rc = RANK_COLORS[e.rank] || RANK_COLORS.C;
                                const date = e.date ? e.date.slice(5, 10).replace('-', '/') : '';
                                return (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl flex-shrink-0" style={{ backgroundColor: rc.light, color: rc.main, border: `2px solid ${rc.main}` }}>
                                            {e.rank}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-slate-800 truncate">{e.title}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                {DIFFICULTY_PRESETS[e.difficulty as Difficulty]?.label || e.difficulty} · 得分 {e.score}{date ? ` · ${date}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndingCollectionModal;
