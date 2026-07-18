const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /if \(prev\.phase === Phase\.FINAL_EXAM\) \{\s*return \{ \.\.\.nextState, phase: Phase\.ENDING, isPlaying: false \};\s*\}/,
    `if (prev.phase === Phase.FINAL_EXAM) {
                 return { ...nextState, phase: Phase.WINTER_BREAK, week: 1, totalWeeksInPhase: 5, isPlaying: true };
            }
            if (prev.phase === Phase.MIDTERM_EXAM_2) {
                 return { ...nextState, phase: Phase.SEMESTER_2, week: 12, isPlaying: true };
            }
            if (prev.phase === Phase.FINAL_EXAM_2) {
                 return { ...nextState, phase: Phase.SUMMER_BREAK, week: 1, totalWeeksInPhase: 8, isPlaying: true };
            }`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
