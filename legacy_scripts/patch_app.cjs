const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

// Ensure ContestHistoryModal and FloatingStats are imported
if (!code.includes('ContestHistoryModal')) {
    code = code.replace(
        /import \w+ from '\.\/components\/\w+';\n/,
        `$&import ContestHistoryModal from './components/ContestHistoryModal';\nimport FloatingStats from './components/FloatingStats';\n`
    );
}

// Ensure showContestHistory state exists
if (!code.includes('showContestHistory')) {
    code = code.replace(
        /const \[showSchedule, setShowSchedule\] = useState\(false\);/,
        `$&
  const [showContestHistory, setShowContestHistory] = useState(false);`
    );
}

// Remove aside and StatsPanel
code = code.replace(/<aside[\s\S]*?<\/aside>/, '');

// Make main area full width
code = code.replace(
    /className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0"/g,
    'className="flex-1 w-full flex flex-col gap-4 md:gap-6 min-w-0 max-w-5xl mx-auto pl-16 md:pl-20"'
);

// Remove the old FloatingStats if it was added manually in the body earlier
code = code.replace(/<FloatingStats[^>]*\/>/g, '');

// Add FloatingStats component and ContestHistoryModal at the top inside main flex container
code = code.replace(
    /<div className="min-h-screen[^"]*"[^>]*>/,
    `$&
      <FloatingStats state={state} onShowHistory={() => setShowContestHistory(true)} />
      {showContestHistory && <ContestHistoryModal state={state} onClose={() => setShowContestHistory(false)} />}`
);

fs.writeFileSync('/app/applet/App.tsx', code);
