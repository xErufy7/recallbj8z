const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/event_generators.ts', 'utf8');

code = code.replace(
    /export const generateOIEvent = \(state: GameState\): GameEvent => \{[\s\S]*\}\;/,
    `export const generateOIEvent = (state: GameState): GameEvent => {
    return generateOIRandomEvent(state);
};`
);

fs.writeFileSync('/app/applet/data/event_generators.ts', code);
