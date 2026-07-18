const fs = require('fs');

// App.tsx
let app = fs.readFileSync('/app/applet/App.tsx', 'utf8');
if (!app.includes('import TimetableModal from "./components/TimetableModal";')) {
    app = app.replace(
        /import ExamResultModal from '\.\/components\/ExamResultModal';/,
        `import TimetableModal from "./components/TimetableModal";\nimport ExamResultModal from './components/ExamResultModal';`
    );
}
fs.writeFileSync('/app/applet/App.tsx', app);

// HomeView.tsx
let hv = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');
// It seems my previous regex missed replacing difficulty === 'AI_STORY'
hv = hv.replace(/difficulty === 'AI_STORY'/g, 'false');
fs.writeFileSync('/app/applet/components/HomeView.tsx', hv);

// constants.ts
let cons = fs.readFileSync('/app/applet/data/constants.ts', 'utf8');
cons = cons.replace(/'AI_STORY':\s*\{[^}]*\},?/g, '');
fs.writeFileSync('/app/applet/data/constants.ts', cons);

