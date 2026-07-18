const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /const startGameState = useCallback\(\(difficulty: 'REALITY' \| 'AI_STORY', challengeId\?: ChallengeId\) => \{/,
    `const startGameState = useCallback((difficulty: 'REALITY' | 'AI_STORY', challengeId?: ChallengeId, devPhase?: Phase, devWeek?: number) => {`
);
code = code.replace(
    /phase: Phase\.SUMMER,\n\s*week: 1,\n\s*totalWeeksInPhase: 8,/,
    `phase: devPhase || Phase.SUMMER,
            week: devWeek || 1,
            totalWeeksInPhase: devPhase ? (devPhase === Phase.SEMESTER_1 ? 21 : devPhase === Phase.SEMESTER_2 ? 21 : devPhase === Phase.WINTER_BREAK ? 5 : devPhase === Phase.SUMMER_BREAK ? 8 : 8) : 8,`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
