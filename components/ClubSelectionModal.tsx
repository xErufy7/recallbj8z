
import React from 'react';
import { CLUBS } from '../data/mechanics';
import { ClubId } from '../types';

interface ClubSelectionModalProps {
    onSelect: (id: ClubId | 'none') => void;
}

const ClubSelectionModal: React.FC<ClubSelectionModalProps> = ({ onSelect }) => {
    return (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                <h2 className="text-3xl font-black text-center mb-2">百团大战</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scroll p-2">
                    {CLUBS.map(club => (
                        <button key={club.id} onClick={() => onSelect(club.id)}
                            className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex flex-col gap-2 group active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-500"><i className={`fas ${club.icon}`}></i></div>
                                <span className="font-bold text-lg text-slate-800">{club.name}</span>
                            </div>
                            <p className="text-xs text-slate-500">{club.description}</p>
                            <div className="mt-auto pt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">{club.effectDescription}</div>
                        </button>
                    ))}
                    <button onClick={() => onSelect('none')} className="p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-400 hover:bg-slate-50 transition-all text-left flex flex-col justify-center items-center gap-2 text-slate-400 active:scale-95">
                        <span className="font-bold">不参加社团</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClubSelectionModal;
