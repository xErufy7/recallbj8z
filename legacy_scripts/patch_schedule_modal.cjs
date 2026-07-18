const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/ScheduleModal.tsx', 'utf8');
code = code.replace(
    /const ScheduleModal: React\.FC<ScheduleModalProps> = \(\{ state, onClose \}\) => \{/,
    `const ScheduleModal: React.FC<ScheduleModalProps> = ({ state, onClose }) => {
    const [activeTab, setActiveTab] = useState<'projects' | 'history'>('projects');`
);
code = code.replace(
    /<div>\s*<h2 className="text-2xl font-black text-slate-800 tracking-tight">日程手账<\/h2>\s*<p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Mid-term Planner<\/p>\s*<\/div>/,
    `<div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">手账 & 记录</h2>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => setActiveTab('projects')} className={\`text-xs font-bold uppercase tracking-widest \${activeTab === 'projects' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}\`}>当前课题</button>
                                <button onClick={() => setActiveTab('history')} className={\`text-xs font-bold uppercase tracking-widest \${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}\`}>历史记录</button>
                            </div>
                        </div>`
);
code = code.replace(
    /\{state\.activeProjects\.length === 0 \? \(/,
    `{activeTab === 'history' ? (
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {state.history && state.history.length > 0 ? state.history.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <span className="text-xs font-bold">{entry.week}W</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-800">{entry.eventTitle}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{entry.phase}</div>
                                        </div>
                                        <div className="text-xs text-indigo-600 font-bold mb-2">&gt; {entry.choiceText}</div>
                                        <div className="text-xs text-slate-500">{entry.resultSummary}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-400 py-10 font-bold text-sm">暂无历史记录</div>
                            )}
                        </div>
                    ) : state.activeProjects.length === 0 ? (`
);
fs.writeFileSync('/app/applet/components/ScheduleModal.tsx', code);
