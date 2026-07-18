const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

code = code.replace(
    /const historicalEvents = getHistoricalEventsForWeek\(state\);\s*if \(historicalEvents\.length > 0\) \{\s*setState\(prev => \{\s*const newEvents = historicalEvents\.filter\(he => !prev\.pendingHistoricalEvents\.find\(p => p\.id === he\.id\)\);\s*if \(newEvents\.length === 0\) return prev;\s*return \{\s*\.\.\.prev,\s*pendingHistoricalEvents: \[\.\.\.prev\.pendingHistoricalEvents, \.\.\.newEvents\],/,
    `const historicalEvents = getHistoricalEventsForWeek(state);
            if (historicalEvents.length > 0) {
                 setState(prev => {
                     let newEvents = historicalEvents.filter(he => !prev.pendingHistoricalEvents.find(p => p.id === he.id));
                     if (newEvents.length === 0) return prev;
                     newEvents = newEvents.sort(() => 0.5 - Math.random()).slice(0, 3);
                     return {
                         ...prev, 
                         pendingHistoricalEvents: [...prev.pendingHistoricalEvents, ...newEvents],`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
