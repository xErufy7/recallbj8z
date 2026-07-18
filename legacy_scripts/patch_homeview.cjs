const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

// Ensure the developer mode button is prominent at top-right
code = code.replace(/<button onClick=\{\(\) => setDevMode\(\!devMode\)\} className="absolute bottom-4 right-4.*?<\/button>/, '');
code = code.replace(/<div className="absolute top-4 right-4 flex gap-2">/, 
    `$&
                <button onClick={() => setDevMode(!devMode)} className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-2 rounded-full text-xs flex items-center gap-1 transition-colors border border-white/10">
                    <i className="fas fa-terminal"></i> <span className="hidden md:inline">开发者</span>
                </button>`);

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
