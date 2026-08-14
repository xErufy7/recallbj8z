
import React from 'react';

interface RestartConfirmModalProps {
    /** 旧存档概要（难度 + 周数），用于提示玩家 */
    saveLabel: string;
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}

/** 已有存档时重新开局前确认，防止误覆盖进度 */
const RestartConfirmModal: React.FC<RestartConfirmModalProps> = ({ saveLabel, flashTag, onCancel, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn" onClick={onCancel}>
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 flex-shrink-0"><i className="fas fa-triangle-exclamation"></i></div>
                    <h3 className="text-lg font-black text-slate-800">已有存档，确定重开？</h3>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                    当前难度已有一份存档：<span className="font-black text-slate-700">{saveLabel}</span>
                </p>
                <p className="text-sm text-slate-500 mb-6">开始新游戏会覆盖旧存档。想保留进度的话，可以先进游戏把存档导出成文件。</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className={`relative flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors ${flashTag === 'restart-cancel' ? 'key-pressed' : ''}`}>
                        取消<span className="absolute bottom-1 right-2.5 text-[10px] font-black opacity-40 hidden md:inline">Esc</span>
                    </button>
                    <button onClick={onConfirm} className={`relative flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors ${flashTag === 'restart-confirm' ? 'key-pressed' : ''}`}>覆盖并开始<span className="absolute bottom-1 right-2.5 text-sm font-black opacity-40 hidden md:inline">⏎</span></button>
                </div>
            </div>
        </div>
    );
};

export default RestartConfirmModal;
