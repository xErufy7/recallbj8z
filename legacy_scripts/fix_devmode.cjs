const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');
code = code.replace(
    /<button onClick=\{\(\) => setDevMode\(\!devMode\)\} className="mt-4 text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-2 mx-auto"><i className="fas fa-code"><\/i> 开发者模式<\/button>/,
    ''
);
// Insert it before the closing </div> of the main container
code = code.replace(
    /(\s*)(<\/div>\s*)$/,
    `$1<button onClick={() => setDevMode(!devMode)} className="absolute bottom-4 right-4 text-slate-300 hover:text-slate-500 text-xs flex items-center gap-1 transition-colors"><i className="fas fa-terminal"></i> 开发者模式</button>$2`
);
fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
