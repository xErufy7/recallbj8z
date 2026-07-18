const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

code = code.replace(
    /<HistoricalTicker\s*events=\{state.pendingHistoricalEvents\}\s*onEventClick=\{\(e\) => \{[\s\S]*?\}\}\s*\/>/,
    `<HistoricalTicker
          events={state.pendingHistoricalEvents}
          onEventClick={(e) => {
              setState(prev => ({
                  ...prev,
                  pendingHistoricalEvents: prev.pendingHistoricalEvents.filter(he => he.id !== e.id),
                  currentEvent: e,
                  isPlaying: false
              }));
          }}
          onAnimationEnd={(id) => {
              setState(prev => ({
                  ...prev,
                  pendingHistoricalEvents: prev.pendingHistoricalEvents.filter(he => he.id !== id)
              }));
          }}
       />`
);

fs.writeFileSync('/app/applet/App.tsx', code);
