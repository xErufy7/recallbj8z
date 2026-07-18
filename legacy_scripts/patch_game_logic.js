const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /const historicalEvents = getHistoricalEventsForWeek\(state\);/,
    `const historicalEvents = getHistoricalEventsForWeek(state);
            if (historicalEvents.length > 0) {
                 setState(prev => ({ 
                     ...prev, 
                     pendingHistoricalEvents: [...prev.pendingHistoricalEvents, ...historicalEvents],
                     triggeredEvents: [...prev.triggeredEvents, ...historicalEvents.map(e=>e.id)]
                 }));
            }`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
