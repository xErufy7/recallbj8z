const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

// Remove the useEffect that calls getLeaderboard
code = code.replace(/useEffect\(\(\) => \{\s+const fetchScores = async \(\) => \{[\s\S]*?\}, \[activeChallenge\]\);/, '');

// Fix topScores issue: replace topScores with an empty array or remove the block
// Actually, let's just replace `topScores` with `[]` in the map, or remove the entire block.
code = code.replace(/topScores/g, '[]');

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
