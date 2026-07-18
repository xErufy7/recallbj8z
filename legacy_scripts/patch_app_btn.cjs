const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

if (!code.includes('开发者模式(作弊)')) {
    code = code.replace(
        /\{\/\* Header \*\/\}/,
        `{/* Header */}
        <button 
            onClick={() => { (window as any).toggleDevMode?.(); }} 
            className="fixed bottom-4 left-4 z-[9999] bg-red-600 text-white font-black px-6 py-4 rounded-3xl shadow-2xl border-4 border-yellow-400 hover:bg-red-500 animate-pulse text-lg"
        >
            <i className="fas fa-hammer mr-2"></i> 开发者模式(作弊)
        </button>
        `
    );
}

fs.writeFileSync('/app/applet/App.tsx', code);
