const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /phase: devPhase \|\| Phase\.SUMMER,\s*week: devWeek \|\| 1,\s*totalWeeksInPhase: devPhase \? \(devPhase === Phase\.SEMESTER_1 \? 21 : devPhase === Phase\.SEMESTER_2 \? 21 : devPhase === Phase\.WINTER_BREAK \? 5 : devPhase === Phase\.SUMMER_BREAK \? 8 : 8\) : 8,/,
    `phase: Phase.SUMMER,\n            week: 1,\n            totalWeeksInPhase: 8,`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
