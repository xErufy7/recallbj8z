
import React, { lazy, Suspense } from 'react';
import { GameState } from '../types';

const StatsPanel = lazy(() => import('./StatsPanel'));

interface MobileStatsModalProps {
    state: GameState;
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
    onShowGuide: () => void;
}

/** 移动端属性面板弹窗 */
const MobileStatsModal: React.FC<MobileStatsModalProps> = ({ state, flashTag, onClose, onShowGuide }) => {
    return (
        <div className="fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:hidden animate-fadeIn" onClick={onClose}>
            <div className="w-full max-w-sm bg-white rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-lg font-black text-slate-800">属性面板</h3>
                    <button onClick={onClose} className={`w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors ${flashTag === 'stats-close' ? 'key-pressed' : ''}`}><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll p-4">
                    <Suspense fallback={null}><StatsPanel state={state} onShowGuide={onShowGuide} /></Suspense>
                </div>
            </div>
        </div>
    );
};

export default MobileStatsModal;
