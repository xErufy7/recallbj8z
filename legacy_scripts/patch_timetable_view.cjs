const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');

code = code.replace(
    /<button \s*onClick=\{\(\) => onConfirm\(schedule\)\}\s*className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500\/30 transition-all active:scale-95"\s*>\s*执行本周计划 <i className="fas fa-play ml-2"><\/i>\s*<\/button>/,
    `{state.isWeekend ? (
                    <button 
                        onClick={() => onConfirm(schedule)}
                        className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                    >
                        执行本周计划 <i className="fas fa-play ml-2"></i>
                    </button>
                ) : (
                    <button 
                        onClick={() => onConfirm(schedule)}
                        className="w-full mt-6 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95"
                    >
                        关闭 <i className="fas fa-times ml-2"></i>
                    </button>
                )}`
);

fs.writeFileSync('/app/applet/components/TimetableModal.tsx', code);
