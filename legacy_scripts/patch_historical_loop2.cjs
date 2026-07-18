const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

code = code.replace(
    /if \(newEvents\.length === 0\) return prev;\s*newEvents = newEvents\.sort\(\(\) => 0\.5 - Math\.random\(\)\)\.slice\(0, 3\);/,
    `if (newEvents.length === 0) return prev;
                     if (prev.week % 3 !== 0) return prev; // Exactly 1 every 3 weeks!
                     newEvents = newEvents.sort(() => 0.5 - Math.random()).slice(0, 1);`
);

fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
