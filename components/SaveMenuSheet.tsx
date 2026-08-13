
import React from 'react';

interface SaveMenuSheetProps {
    onSave: () => void;
    onExport: () => void;
    onImport: () => void;
    onClose: () => void;
    saveDisabled: boolean;
}

/** 移动端「存档」底部弹层：保存 / 导出 / 导入 */
const SaveMenuSheet: React.FC<SaveMenuSheetProps> = ({ onSave, onExport, onImport, onClose, saveDisabled }) => {
    return (
        <div className="fixed inset-0 z-[105] bg-slate-900/50 flex items-end justify-center md:hidden animate-fadeIn" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={onSave} disabled={saveDisabled} className="bg-emerald-50 border border-emerald-100 rounded-2xl py-4 flex flex-col items-center gap-1.5 disabled:opacity-40"><i className="fas fa-save text-emerald-600 text-lg"></i><span className="text-xs font-bold text-emerald-700">保存</span></button>
                    <button onClick={onExport} className="bg-sky-50 border border-sky-100 rounded-2xl py-4 flex flex-col items-center gap-1.5"><i className="fas fa-file-export text-sky-600 text-lg"></i><span className="text-xs font-bold text-sky-700">导出</span></button>
                    <button onClick={onImport} className="bg-sky-50 border border-sky-100 rounded-2xl py-4 flex flex-col items-center gap-1.5"><i className="fas fa-file-import text-sky-600 text-lg"></i><span className="text-xs font-bold text-sky-700">导入</span></button>
                </div>
            </div>
        </div>
    );
};

export default SaveMenuSheet;
