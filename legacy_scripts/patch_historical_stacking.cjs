const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

code = code.replace(
    /if \(historical\.length > 0\) \{\s*newState\.pendingHistoricalEvents = \[\.\.\.newState\.pendingHistoricalEvents, \.\.\.historical\];\s*\}/s,
    `if (historical.length > 0) {
                // Shuffle and limit to max 3 events to prevent UI clutter
                const shuffled = historical.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 3);
                newState.pendingHistoricalEvents = [...newState.pendingHistoricalEvents, ...selected];
            }`
);

fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
