const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

// Replace handleWeekendActivityClick and confirmWeekendActivity
code = code.replace(
    /const handleWeekendActivityClick = [\s\S]*?const calculateRank =/g,
    `const executeTimetable = (schedule: Record<string, string>) => {
        let currentState = { ...state };
        let results = [];
        let hasSlept = false;

        // Apply activities sequentially
        for (const [slotId, actId] of Object.entries(schedule)) {
            const activity = WEEKEND_ACTIVITIES.find(a => a.id === actId);
            if (!activity) continue;

            const oldS = { ...currentState };
            let updates = activity.action(oldS);
            let resultText = typeof activity.resultText === 'function' ? activity.resultText(oldS) : activity.resultText;
            
            if (currentState.activeChallengeId === 'c_sleep_king' && (activity.id === 'w_sleep' || activity.name.includes('睡'))) {
                updates = { ...updates, hasSleptThisWeek: true };
                hasSlept = true;
            }

            currentState = { ...currentState, ...updates };
            if (resultText) {
                results.push(\`[\${slotId}] \${resultText}\`);
            }
            if (updates.log) {
                currentState.log = [...(currentState.log || []), ...updates.log];
            }
        }

        // Challenge Check
        if (currentState.activeChallengeId === 'c_sleep_king' && !hasSlept) {
            currentState.phase = Phase.ENDING;
            currentState.isPlaying = false;
            currentState.log = [...(currentState.log || []), { message: "你这周没有睡觉，困死了！！！(挑战失败)", type: 'error', timestamp: Date.now() }];
            results.push("挑战失败：你这周没有睡觉！");
        } else {
            currentState.week += 1;
            currentState.isPlaying = true;
            currentState.hasSleptThisWeek = false;
        }

        currentState.lastWeekSchedule = schedule;
        currentState.isWeekend = false; // Turn off planning UI
        
        setState(prev => ({ ...prev, ...currentState }));
        
        // Return results to display maybe? We can set it to a new state \`timetableResult\` if we want a summary popup
    };

    const calculateRank =`
);

fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
