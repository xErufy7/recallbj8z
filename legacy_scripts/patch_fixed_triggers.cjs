const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /if \(state.phase === Phase.SEMESTER_1 && state.week === 11 && !state.midtermRank\) \{/,
    `if (state.phase === Phase.SEMESTER_2 && state.week === 11 && state.midtermRank !== 'SEMESTER_2_DONE') {
                setState(prev => ({ ...prev, phase: Phase.MIDTERM_EXAM_2, isPlaying: false }));
                return;
            }
            if (state.phase === Phase.SEMESTER_1 && state.week === 11 && state.midtermRank !== 'SEMESTER_1_DONE') {`
);
code = code.replace(
    /midtermRank: state.phase === Phase.MIDTERM_EXAM \? rank : prev.midtermRank,/,
    `midtermRank: state.phase === Phase.MIDTERM_EXAM ? 'SEMESTER_1_DONE' : (state.phase === Phase.MIDTERM_EXAM_2 ? 'SEMESTER_2_DONE' : prev.midtermRank),`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
