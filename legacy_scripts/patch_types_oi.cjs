const fs = require('fs');
let code = fs.readFileSync('/app/applet/types.ts', 'utf8');

// Add rating and history to OIStats
code = code.replace(
    /export interface OIStats \{[\s\S]*?misc: number;\s*\}/,
    `export interface ContestRecord {
    name: string;
    date: number;
    perf: number;
    ratingChange: number;
    newRating: number;
    rank?: string;
}

export interface OIStats {
    dp: number;
    ds: number;
    math: number;
    string: number;
    graph: number;
    misc: number;
    rating?: number;
    history?: ContestRecord[];
}`
);

fs.writeFileSync('/app/applet/types.ts', code);
