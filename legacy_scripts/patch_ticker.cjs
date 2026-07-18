const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HistoricalTicker.tsx', 'utf8');

// Add onAnimationEnd prop
code = code.replace(
    /onEventClick: \(event: GameEvent\) => void;/,
    `onEventClick: (event: GameEvent) => void;\n    onAnimationEnd: (id: string) => void;`
);
code = code.replace(
    /const HistoricalTicker: React\.FC<Props> = \(\{ events, onEventClick \}\) => \{/,
    `const HistoricalTicker: React.FC<Props> = ({ events, onEventClick, onAnimationEnd }) => {`
);

// Update animation style and add onAnimationEnd event
code = code.replace(
    /animation: \`slideLeft \$\{15 \+ \(i \* 2\)\}s linear infinite\`,/,
    `animation: \`slideLeft 20s linear forwards\`,` // Slower, just once
);
code = code.replace(
    /onClick=\{\(\) => onEventClick\(e\)\}/,
    `onClick={() => onEventClick(e)}\n                    onAnimationEnd={() => onAnimationEnd(e.id)}`
);

fs.writeFileSync('/app/applet/components/HistoricalTicker.tsx', code);
