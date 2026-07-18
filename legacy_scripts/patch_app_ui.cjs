const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');
code = code.replace(
    /className="absolute top-6 right-6 z-20 flex gap-4"/,
    `className="absolute top-6 right-6 z-20 flex gap-3"`
);
// We need to inject the debate/drama buttons into that gap-3 container.
code = code.replace(
    /<button onClick=\{saveGame\} className="w-12 h-12 bg-white\/80 backdrop-blur-sm rounded-full shadow-lg text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center">/,
    `{state.flags?.debate_joined && (
        <button onClick={() => alert('进入辩论赛界面 (WIP)')} className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-rose-500 hover:text-rose-600 transition-all hover:scale-105 flex items-center justify-center relative">
            <i className="fas fa-comments text-xl"></i>
            {state.flags.debate_stage && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
        </button>
      )}
      {state.flags?.drama_joined && (
        <button onClick={() => alert('进入英语戏剧节界面 (WIP)')} className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-purple-500 hover:text-purple-600 transition-all hover:scale-105 flex items-center justify-center relative">
            <i className="fas fa-masks-theater text-xl"></i>
        </button>
      )}
      <button onClick={saveGame} className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center">`
);
fs.writeFileSync('/app/applet/App.tsx', code);
