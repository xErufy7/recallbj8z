const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

code = code.replace(
    /\/\/ 3c\. Regular Events \(Phase Specific Randoms\)\n\s*if \(weekEvents\.length === 0\) \{/,
    `// 3c. Regular Events (Phase Specific Randoms)
            if (state.week % 3 === 0 && weekEvents.length === 0) {`
);

fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
