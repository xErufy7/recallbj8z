
import React from 'react';
import { ACHIEVEMENTS } from '../data/mechanics';

interface GameAchievementsModalProps {
    unlockedAchievements: string[];
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
}

const GameAchievementsModal: React.FC<GameAchievementsModalProps> = ({ unlockedAchievements, flashTag, onClose }) => {
    return (
        <div className="absolute inset-0 z-[60] flex justify-center items-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4" onClick={onClose}>
            <div className="bg-white rounded-[40px] p-4 md:p-8 max-w-4xl w-full h-3/4 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                     <div><h2 className="text-3xl font-black text-slate-800">成就墙</h2></div>
                     <button onClick={onClose} className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 ${flashTag === 'achievements-close' ? 'key-pressed' : ''}`}><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(ACHIEVEMENTS).map(ach => (
                        <div key={ach.id} className={`p-3 rounded-2xl border flex items-center gap-3 min-w-0 ${unlockedAchievements.includes(ach.id) ? 'bg-indigo-50 border-indigo-200' : 'opacity-50 grayscale'}`}>
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow flex-shrink-0"><i className={`fas ${ach.icon} text-indigo-500`}></i></div>
                            <div className="min-w-0 flex-1"><h4 className="font-bold text-[13px] md:text-base text-slate-800 truncate">{ach.title}</h4><p className="text-[10px] md:text-xs text-slate-500 line-clamp-2">{ach.description}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameAchievementsModal;
