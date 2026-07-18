const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

const startIdx = code.indexOf('{/* Weekend Menu */}');
const endIdx = code.indexOf('{/* Event Modal */}');

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + 
`{/* Timetable Menu */}
        {state.isWeekend && (
            <TimetableModal state={state} onConfirm={(schedule) => {
                executeTimetable(schedule);
            }} />
        )}
        ` + code.substring(endIdx);
} else {
    console.log("NOT FOUND", startIdx, endIdx);
}

// Check other variables
code = code.replace(/handleWeekendActivityClick=\{handleWeekendActivityClick\}/, '');
code = code.replace(/confirmWeekendActivity=\{confirmWeekendActivity\}/, '');
code = code.replace(/weekendOptions=\{weekendOptions\}/, '');

fs.writeFileSync('/app/applet/App.tsx', code);
