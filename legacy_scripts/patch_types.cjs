const fs = require('fs');
let code = fs.readFileSync('/app/applet/types.ts', 'utf8');
code = code.replace(/\| 'AI_STORY'/, '');
code = code.replace(/isAiGenerating: boolean;/, '');
code = code.replace(/aiBuffer: GameEvent\[\];/, '');
code = code.replace(/weekendActionPoints: number;/, 'lastWeekSchedule: Record<string, string>;\n  lastHistoricalWeek: number;');
fs.writeFileSync('/app/applet/types.ts', code);
