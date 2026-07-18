const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /const historicalEvents = getHistoricalEventsForWeek\(state\);/,
    `const historicalEvents = getHistoricalEventsForWeek(state);
            if (historicalEvents.length > 0) {
                 setState(prev => {
                     const newEvents = historicalEvents.filter(he => !prev.pendingHistoricalEvents.find(p => p.id === he.id));
                     if (newEvents.length === 0) return prev;
                     return {
                         ...prev, 
                         pendingHistoricalEvents: [...prev.pendingHistoricalEvents, ...newEvents],
                         triggeredEvents: [...prev.triggeredEvents, ...newEvents.map(e=>e.id)]
                     };
                 });
            }`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
