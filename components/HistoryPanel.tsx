
import React from 'react';
import { StoryEntry } from '../types';

interface HistoryPanelProps {
    history: StoryEntry[];
    onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
    return (
        <div className="absolute inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="w-full md:w-96 bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col animate-slideInRight" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">故事线存档</h2>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-xl"><i className="fas fa-times"></i></button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scroll space-y-6">
                  {history.length === 0 ? <div className="text-slate-300 text-center py-20 italic">尚未开启故事...</div> :
                    history.map((h, i) => (
                      <div key={i} className="relative pl-6 border-l-2 border-indigo-100">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                         <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{h.phase} | Week {h.week}</div>
                         <h4 className="font-black text-slate-800 mt-1">{h.eventTitle}</h4>
                         <p className="text-xs text-slate-600 mt-1">决策：{h.choiceText}</p>
                         <div className="mt-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg">{h.resultSummary}</div>
                      </div>
                    ))}
               </div>
            </div>
        </div>
    );
};

export default HistoryPanel;
