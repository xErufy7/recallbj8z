const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');

// Ensure schedule is robust
code = code.replace(
    /const \[schedule, setSchedule\] = useState<Record<string, string>>\(state\.lastWeekSchedule \|\| \{\}\);/,
    `const [schedule, setSchedule] = useState<Record<string, string>>(state.lastWeekSchedule || {});`
);
code = code.replace(
    /for \(const \[sId, _actId\] of Object\.entries\(schedule\)\) \{/,
    `for (const [sId, _actId] of Object.entries(schedule || {})) {`
);

fs.writeFileSync('/app/applet/components/TimetableModal.tsx', code);
