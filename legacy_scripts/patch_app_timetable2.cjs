const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

// Replace everything from {/* Weekend Menu */} to the end of {weekendResult && ( ... )}
const startWeekend = code.indexOf('{/* Weekend Menu */}');
const startExam = code.indexOf('{/* Exam Result */}');

if (startWeekend !== -1 && startExam !== -1) {
    const before = code.substring(0, startWeekend);
    const after = code.substring(startExam);
    const replacement = `
        {/* Timetable Menu */}
        {state.isWeekend && (
            <TimetableModal state={state} onConfirm={(schedule) => {
                executeTimetable(schedule);
            }} />
        )}
        `;
    code = before + replacement + after;
}

code = code.replace(/weekendResult, setWeekendResult, /g, '');
code = code.replace(/const \[weekendResult, setWeekendResult\] = useState<any>\(null\);\s*/, '');
code = code.replace(/\|\| !!weekendResult/g, '');
code = code.replace(/\|\| weekendResult/g, '');
fs.writeFileSync('/app/applet/App.tsx', code);
