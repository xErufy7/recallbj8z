const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');
const startResult = code.indexOf('{/* Weekend Result */}');
const endResult = code.indexOf('{/* Exam Result */}');
if (startResult !== -1 && endResult !== -1) {
    code = code.substring(0, startResult) + code.substring(endResult);
}
// Remove handles
code = code.replace(/handleWeekendActivityClick,\s*confirmWeekendActivity,/g, 'executeTimetable,');
code = code.replace(/handleWeekendActivityClick=\{handleWeekendActivityClick\}\s*confirmWeekendActivity=\{confirmWeekendActivity\}/, 'executeTimetable={executeTimetable}');
fs.writeFileSync('/app/applet/App.tsx', code);
