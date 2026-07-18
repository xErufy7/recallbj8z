const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /handleWeekendActivityClick,\s*confirmWeekendActivity,/,
    `executeTimetable,`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
