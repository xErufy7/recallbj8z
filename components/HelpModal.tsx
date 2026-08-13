
import React from 'react';

interface HelpModalProps {
    onClose: () => void;
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-600 whitespace-nowrap">{children}</span>
);

/** 游戏内快捷键说明弹窗（桌面端，键盘操作） */
const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const rows: { keys: React.ReactNode; desc: string }[] = [
        { keys: <><Kbd>1</Kbd> ~ <Kbd>9</Kbd></>, desc: '选择事件选项（只有一个选项时按 1）' },
        { keys: <><Kbd>回车</Kbd> / <Kbd>空格</Kbd></>, desc: '确认结果、继续剧情、关闭考试/竞赛结果弹窗' },
        { keys: <><Kbd>1</Kbd> ~ <Kbd>6</Kbd></>, desc: '选科界面切换科目，选满 3 门后回车/空格确认' },
        { keys: <Kbd>Esc</Kbd>, desc: '关闭当前弹窗' },
    ];

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-3xl p-5 md:p-6 max-w-sm w-full shadow-2xl no-btn-scale" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><i className="fas fa-keyboard text-indigo-500"></i>快捷键说明</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
                </div>
                <div className="space-y-3">
                    {rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 flex-shrink-0 w-24">{r.keys}</div>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">仅桌面端可用 · 手机上没有键盘</p>
            </div>
        </div>
    );
};
export default HelpModal;
