
import React from 'react';
import { SubjectKey, GameState, SUBJECT_NAMES } from '../types';

interface SubjectSelectionModalProps {
    state: GameState;
    onToggle: (s: SubjectKey) => void;
    onConfirm: () => void;
}

const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({ state, onToggle, onConfirm }) => {
    return (
        <div className="absolute inset-0 bg-white/95 z-30 p-4 md:p-10 flex flex-col items-center justify-center rounded-2xl">
           <h2 className="text-3xl font-black mb-4">高一选科</h2>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10 w-full max-w-lg">
              {(['physics', 'chemistry', 'biology', 'history', 'geography', 'politics'] as SubjectKey[]).map(s => (
                <button key={s} onClick={() => onToggle(s)}
                  className={`p-4 rounded-2xl border-2 transition-all font-bold ${state.selectedSubjects.includes(s) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  {SUBJECT_NAMES[s]}
                </button>
              ))}
           </div>
           <button disabled={state.selectedSubjects.length !== 3} onClick={onConfirm} className="bg-indigo-600 disabled:bg-slate-200 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl">确认选择</button>
        </div>
    );
};

export default SubjectSelectionModal;
