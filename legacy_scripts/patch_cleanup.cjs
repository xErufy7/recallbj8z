const fs = require('fs');

// App.tsx
let app = fs.readFileSync('/app/applet/App.tsx', 'utf8');
const startWeekend = app.indexOf('{/* Weekend Menu */}');
const startExam = app.indexOf('{/* Exam Result */}');
if (startWeekend !== -1 && startExam !== -1) {
    app = app.substring(0, startWeekend) + `
        {/* Timetable Menu */}
        {state.isWeekend && (
            <TimetableModal state={state} onConfirm={(schedule) => {
                executeTimetable(schedule);
            }} />
        )}
        ` + app.substring(startExam);
}
app = app.replace(/weekendResult,\s*setWeekendResult,\s*/g, '');
app = app.replace(/setWeekendResult\(null\);\s*/g, '');
fs.writeFileSync('/app/applet/App.tsx', app);

// useGameLogic.ts
let hook = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
hook = hook.replace(/const \[weekendResult, setWeekendResult\] = useState<.*?null\);/, '');
hook = hook.replace(/weekendResult,\s*setWeekendResult,\s*/, '');
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', hook);

