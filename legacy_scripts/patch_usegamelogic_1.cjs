const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(/isAiGenerating: false,/, '');
code = code.replace(/aiBuffer: \[\],/, '');
code = code.replace(/weekendActionPoints: 0,/, 'lastWeekSchedule: {},\n    lastHistoricalWeek: -3,');
code = code.replace(/weekendActionPoints/g, 'lastWeekSchedule'); 
// wait, replacing globally might break something if it's used elsewhere like confirmWeekendActivity
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
