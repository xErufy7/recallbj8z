import React from 'react';
import { GameState } from '../types';

interface Props {
    state: GameState;
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
}

const ContestHistoryModal: React.FC<Props> = ({ state, flashTag, onClose }) => {
    const history = state.oiStats?.history || [];
    const rating = state.oiStats?.rating || 1200;

    return (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <i className="fas fa-trophy text-yellow-400"></i> OI 竞赛履历
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">当前 Rating: <span className="font-bold text-white text-lg">{rating}</span></p>
                    </div>
                    <button onClick={onClose} className={`w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors ${flashTag === 'contest-close' ? 'key-pressed' : ''}`}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scroll flex-1 bg-slate-50">
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <i className="fas fa-ghost text-4xl mb-4 opacity-50"></i>
                            <p className="font-bold">还没有参加过任何比赛哦...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...history].reverse().map((record, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-inner ${record.ratingChange > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            <i className={`fas ${record.ratingChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{record.name}</h4>
                                            <p className="text-xs text-slate-500">
                                                第 {record.date} 周 {record.rank && <span className="ml-2 font-bold text-yellow-600">{record.rank}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-400">
                                            Perf: <span className="text-slate-700">{record.perf}</span>
                                        </div>
                                        <div className={`text-lg font-black ${record.ratingChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {record.ratingChange > 0 ? '+' : ''}{record.ratingChange}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400">
                                            {"=>"} {record.newRating}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestHistoryModal;
