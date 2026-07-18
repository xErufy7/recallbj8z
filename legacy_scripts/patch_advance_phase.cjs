const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
code = code.replace(
    /switch \(currentPhase\) \{[\s\S]*?default: nextPhase = Phase\.ENDING; weeks = 0;\n\s*\}/,
    `switch (currentPhase) {
                case Phase.INIT: nextPhase = Phase.SUMMER; weeks = 8; break;
                case Phase.SUMMER: nextPhase = Phase.MILITARY; weeks = 2; break; 
                case Phase.MILITARY: nextPhase = Phase.SELECTION; weeks = 0; break; 
                case Phase.SELECTION: nextPhase = Phase.PLACEMENT_EXAM; weeks = 0; break;
                case Phase.PLACEMENT_EXAM: nextPhase = Phase.SEMESTER_1; weeks = 21; break; 
                case Phase.MIDTERM_EXAM: nextPhase = Phase.SUBJECT_RESELECTION; weeks = 0; break;
                case Phase.SUBJECT_RESELECTION: nextPhase = Phase.SEMESTER_1; weeks = 21; break; 
                case Phase.SEMESTER_1: nextPhase = Phase.FINAL_EXAM; weeks = 0; break;
                case Phase.CSP_EXAM: nextPhase = Phase.SEMESTER_1; weeks = prev.totalWeeksInPhase; break; 
                case Phase.NOIP_EXAM: nextPhase = Phase.SEMESTER_1; weeks = prev.totalWeeksInPhase; break;
                case Phase.FINAL_EXAM: nextPhase = Phase.WINTER_BREAK; weeks = 5; break;
                case Phase.WINTER_BREAK: nextPhase = Phase.SEMESTER_2; weeks = 21; break;
                case Phase.MIDTERM_EXAM_2: nextPhase = Phase.SEMESTER_2; weeks = 21; break;
                case Phase.SEMESTER_2: nextPhase = Phase.FINAL_EXAM_2; weeks = 0; break;
                case Phase.FINAL_EXAM_2: nextPhase = Phase.SUMMER_BREAK; weeks = 8; break;
                case Phase.SUMMER_BREAK: nextPhase = Phase.ENDING; weeks = 0; break;
                default: nextPhase = Phase.ENDING; weeks = 0;
            }`
);
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
