
import React from 'react';

interface RetireConfirmModalProps {
    onCancel: () => void;
    onConfirm: () => void;
}

const RetireConfirmModal: React.FC<RetireConfirmModalProps> = ({ onCancel, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn" onClick={onCancel}>
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 flex-shrink-0"><i className="fas fa-door-open"></i></div>
                    <h3 className="text-lg font-black text-slate-800">确认提前退休？</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">本局游戏将立即结束并结算成绩，无法撤销。</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">再想想</button>
                    <button onClick={onConfirm} className="relative flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors">确认退休<span className="absolute bottom-1 right-2.5 text-sm font-black opacity-40 hidden md:inline">⏎</span></button>
                </div>
            </div>
        </div>
    );
};

export default RetireConfirmModal;
