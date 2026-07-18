const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/utils.ts', 'utf8');

code = code.replace(
    /export const modifyOI = \(s: GameState, changes: Partial<OIStats>\) => \{[\s\S]*?return newOI;\s*\};/,
    `export const modifyOI = (s: GameState, changes: Partial<OIStats>) => {
    const newOI = { ...s.oiStats };
    (Object.keys(changes) as (keyof OIStats)[]).forEach(k => {
        if (k !== 'history') {
             (newOI as any)[k] = Math.max(0, ((newOI as any)[k] || 0) + ((changes as any)[k] || 0));
        }
    });
    return newOI;
};`
);

code = code.replace(
    /updates\.oiStats\!\[oiKey\] = Math\.max\(0, updates\.oiStats\!\[oiKey\] \+ \(val as number\)\);/,
    `if (oiKey !== 'history') {
                (updates.oiStats as any)[oiKey] = Math.max(0, ((updates.oiStats as any)[oiKey] || 0) + (val as number));
            }`
);

fs.writeFileSync('/app/applet/data/utils.ts', code);
