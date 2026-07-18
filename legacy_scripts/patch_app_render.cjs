const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

// Clean up duplicate imports
code = code.replace(/import FloatingStats from '\.\/components\/FloatingStats';\nimport FloatingStats from '\.\/components\/FloatingStats';/, "import FloatingStats from './components/FloatingStats';");

// Inject inside the main container
// The main container is: <div className={`h-[100dvh] transition-colors...`>
code = code.replace(
    /<div className=\{\`h-\[100dvh\] transition-colors[^>]*\}>/,
    `$&
      <FloatingStats state={state} onShowHistory={() => setShowContestHistory(true)} />
      {showContestHistory && <ContestHistoryModal state={state} onClose={() => setShowContestHistory(false)} />}`
);

fs.writeFileSync('/app/applet/App.tsx', code);
