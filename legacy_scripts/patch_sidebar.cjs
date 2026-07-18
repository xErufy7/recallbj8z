const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

code = code.replace(
    /\{\/\* Sidebar \*\/\}/,
    `{/* Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0 z-20">
        <StatsPanel state={state} onShowGuide={() => setShowRealityGuide(true)} />
      </div>`
);

if (!code.includes('import StatsPanel')) {
    code = code.replace(
        /import \w+ from '\.\/components\/\w+';\n/,
        `$&import StatsPanel from './components/StatsPanel';\n`
    );
}

// Remove the FloatingStats that I added
code = code.replace(/<FloatingStats[^>]*\/>/, '');
// Also we need to keep the ContestHistory modal button somewhere? 
// The user says "删除排行榜" (Delete Leaderboard). Let's see where leaderboard is.

fs.writeFileSync('/app/applet/App.tsx', code);
