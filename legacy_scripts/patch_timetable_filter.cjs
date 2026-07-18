const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');

const replacement = `
    const availableActivities = WEEKEND_ACTIVITIES.filter(a => {
        if (state.availableWeekendActivityIds && state.availableWeekendActivityIds.length > 0) {
            return state.availableWeekendActivityIds.includes(a.id) && (!a.condition || a.condition(state));
        }
        return !a.condition || a.condition(state);
    });

    const [schedule, setSchedule] = useState<Record<string, string>>(() => {
        const last = state.lastWeekSchedule || {};
        const valid: Record<string, string> = {};
        for (const [slot, actId] of Object.entries(last)) {
            if (availableActivities.find(a => a.id === actId)) {
                valid[slot] = actId;
            }
        }
        return valid;
    });
`;

code = code.replace(/    const \[schedule, setSchedule\] = useState<Record<string, string>>\(state\.lastWeekSchedule \|\| \{\}\);\n    const \[selectedSlot, setSelectedSlot\] = useState<string \| null>\(null\);\n\n    \/\/ Some activities have condition\n    const availableActivities = WEEKEND_ACTIVITIES\.filter\(a => \{\n        if \(state\.availableWeekendActivityIds && state\.availableWeekendActivityIds\.length > 0\) \{\n            return state\.availableWeekendActivityIds\.includes\(a\.id\) && \(!a\.condition \|\| a\.condition\(state\)\);\n        \}\n        return \!a\.condition \|\| a\.condition\(state\);\n    \}\);\n/, replacement + '\n    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);\n');

fs.writeFileSync('/app/applet/components/TimetableModal.tsx', code);
