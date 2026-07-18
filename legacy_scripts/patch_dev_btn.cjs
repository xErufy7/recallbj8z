const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

code = code.replace(
    /<UtilityButton icon="fa-cog" label="关于" onClick=\{\(\) => setShowSettings\(true\)\} color="text-slate-600 bg-slate-50 hover:bg-slate-100" \/>/,
    `$&
                             <UtilityButton icon="fa-hammer" label="开发者模式(超大按钮)" onClick={() => { (window as any).toggleDevMode?.(); }} color="text-red-600 bg-red-100 hover:bg-red-200 border-2 border-red-500 font-black animate-pulse" />`
);

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
