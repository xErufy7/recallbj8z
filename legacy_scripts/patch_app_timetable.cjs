const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

// Replace weekendResult import and usage
code = code.replace(/const \[weekendResult, setWeekendResult\] = useState<any>\(null\);/, '');

// Replace old weekend UI with TimetableModal
code = code.replace(
    /\{\/\* Weekend Menu \*\/\}.*?(?=\{\/\* Exam Result \*\/\})/s,
    `{/* Timetable Menu */}
        {state.isWeekend && (
            <TimetableModal state={state} onConfirm={(schedule) => {
                executeTimetable(schedule);
            }} />
        )}
        `
);

// We need to import TimetableModal
code = code.replace(
    /import ExamResultModal from '\.\/components\/ExamResultModal';/,
    `import ExamResultModal from './components/ExamResultModal';\nimport TimetableModal from './components/TimetableModal';`
);

// Fix GameView props if we passed handleWeekendActivityClick
code = code.replace(
    /handleWeekendActivityClick=\{handleWeekendActivityClick\}\s*confirmWeekendActivity=\{confirmWeekendActivity\}/,
    `executeTimetable={executeTimetable}`
);

// Remove weekendResult usages from App.tsx rendering (disabled buttons)
code = code.replace(/\|\| !!weekendResult/g, '');
code = code.replace(/\|\| weekendResult/g, '');

fs.writeFileSync('/app/applet/App.tsx', code);
