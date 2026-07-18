const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

// Update Historical Events logic to be at most 1 every 3 weeks, and slice to 1
code = code.replace(
    /const historicalEvents = getHistoricalEventsForWeek\(state\);\s*if \(historicalEvents\.length > 0\) \{[\s\S]*?\}\s*\}\s*\/\/\ 3a\. Fixed Events/,
    `const historicalEvents = getHistoricalEventsForWeek(state);
            if (historicalEvents.length > 0 && state.week % 3 === 0 && state.pendingHistoricalEvents.length === 0) {
                 setState(prev => {
                     let newEvents = historicalEvents.filter(he => !prev.pendingHistoricalEvents.find(p => p.id === he.id) && !prev.triggeredEvents.includes(he.id));
                     if (newEvents.length === 0) return prev;
                     newEvents = newEvents.sort(() => 0.5 - Math.random()).slice(0, 1);
                     return {
                         ...prev, 
                         pendingHistoricalEvents: [...prev.pendingHistoricalEvents, ...newEvents],
                         triggeredEvents: [...prev.triggeredEvents, ...newEvents.map(e=>e.id)]
                     };
                 });
            }

            // 3a. Fixed Events`
);

fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
