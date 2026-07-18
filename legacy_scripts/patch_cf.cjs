const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/mechanics.ts', 'utf8');

code = code.replace(
    /action: \(s\) => \(\{\s*general: \{ \.\.\.s\.general, health: s\.general\.health - 5, mindset: s\.general\.mindset - 2 \},\s*oiStats: s\.oiStats \? \{ \.\.\.s\.oiStats, dp: s\.oiStats\.dp \+ 3, graph: s\.oiStats\.graph \+ 3 \} : s\.oiStats,\s*log: \[.*\]\s*\}\)/s,
    `action: (s) => {
        const baseRating = s.oiStats?.rating || 1200;
        const totalAptitude = s.oiStats ? (s.oiStats.dp + s.oiStats.ds + s.oiStats.math + s.oiStats.string + s.oiStats.graph + s.oiStats.misc) : 0;
        
        // Perf is based on total stats (e.g. 0-600 total aptitude) mapped to rating (1200-3000)
        // Add some RNG
        const expectedPerf = 1200 + (totalAptitude * 2.5); 
        const perf = Math.floor(expectedPerf + (Math.random() * 400 - 200));
        
        const ratingChange = Math.floor((perf - baseRating) / 4);
        const newRating = Math.max(0, baseRating + ratingChange);
        
        const historyRecord = {
            name: 'Codeforces Round #' + (s.week + 800),
            date: s.week,
            perf: perf,
            ratingChange: ratingChange,
            newRating: newRating
        };
        
        let rankStr = "掉分了...";
        if (ratingChange > 50) rankStr = "大上分！";
        else if (ratingChange > 0) rankStr = "小上分。";

        return {
            general: { ...s.general, health: s.general.health - 5, mindset: s.general.mindset - 2 },
            oiStats: s.oiStats ? { 
                ...s.oiStats, 
                dp: s.oiStats.dp + 3, graph: s.oiStats.graph + 3,
                rating: newRating,
                history: [...(s.oiStats.history || []), historyRecord]
            } : s.oiStats,
            log: [...s.log, { message: \`打了一场Codeforces，Perf: \${perf}，Rating: \${baseRating} -> \${newRating} (\${ratingChange > 0 ? '+' : ''}\${ratingChange})。\${rankStr}\`, type: ratingChange > 0 ? 'success' : 'warning', timestamp: Date.now() }]
        };
    }`
);
// Make sure to also update resultText if we want it dynamic, but the static one is fine too since log has the details.
code = code.replace(
    /resultText: '你打了一场CF，虽然掉分了但学到了很多新套路。（由于熬夜，周日上午都在补觉）',/,
    `resultText: (s) => '你熬夜打了一场CF，收获颇丰！（由于熬夜，周日上午都在补觉。详情见历史记录）',`
);

fs.writeFileSync('/app/applet/data/mechanics.ts', code);
