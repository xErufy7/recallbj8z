const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

// Remove imports
code = code.replace(/import \{ supabase, getLeaderboard, LeaderboardEntry \} from '\.\.\/lib\/supabase';\n/, '');
code = code.replace(/import LeaderboardModal from '\.\/LeaderboardModal';\n/, '');

// Remove state
code = code.replace(/const \[showLeaderboard, setShowLeaderboard\] = React\.useState\(false\);\n/, '');
code = code.replace(/const \[leaderboardInitId, setLeaderboardInitId\] = useState<string \| null>\(null\);\n/, '');
code = code.replace(/const \[topScores, setTopScores\] = useState<LeaderboardEntry\[\]>\(\[\]\);\n/, '');

// Remove getLeaderboard call block
code = code.replace(/const fetchLeaderboard = async \(\) => \{\s*if \(\!activeChallenge\) return;\s*try \{\s*const \{ data \} = await getLeaderboard\(activeChallenge\.id, 5\);\s*if \(data\) setTopScores\(data\);\s*\} catch \(e\) \{\s*console\.error\(e\);\s*\}\s*\};\s*fetchLeaderboard\(\);\n/, '');

// Remove openLeaderboard function
code = code.replace(/const openLeaderboard = \(id: string \| null\) => \{\s*setLeaderboardInitId\(id\);\s*setShowLeaderboard\(true\);\s*\};\n/, '');

// Remove buttons
code = code.replace(/<button onClick=\{\(\) => openLeaderboard\(activeChallenge\?\.id \|\| null\)\}.*?<\/button>/s, '');
code = code.replace(/<UtilityButton icon="fa-list-ol" label="排行榜" onClick=\{\(\) => openLeaderboard\(null\)\} color="text-purple-600 bg-purple-50 hover:bg-purple-100" \/>/, '');

// Remove modal rendering
code = code.replace(/\{showLeaderboard && <LeaderboardModal onClose=\{\(\) => setShowLeaderboard\(false\)\} initialChallengeId=\{leaderboardInitId\} \/>\}/, '');

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
