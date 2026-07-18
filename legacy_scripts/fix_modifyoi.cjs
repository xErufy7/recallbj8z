const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/event_generators.ts', 'utf8');

code = code.replace(/export const modifyOI = \(state: GameState, changes: Partial<OIStats>\): OIStats => \{[\s\S]*?\}\;\n/, '');

fs.writeFileSync('/app/applet/data/event_generators.ts', code);
