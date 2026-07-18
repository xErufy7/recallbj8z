const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(/const startWeekend = \(\) => \{/g, 'const startWeekend = () => {\n        if (state.phase === Phase.ENDING || state.phase === Phase.WITHDRAWAL) return;');
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
