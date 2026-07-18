const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

if (!code.includes("import { getLeaderboard")) {
    code = code.replace(/import \{ IRREGULAR_CHALLENGES \} from '\.\.\/data\/challenges';/, 
    "import { IRREGULAR_CHALLENGES } from '../data/challenges';\nimport { getLeaderboard, LeaderboardEntry } from '../lib/supabase';");
}

code = code.replace(/\/\/ Leaderboard State/, "// Leaderboard State\n    const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);");

code = code.replace(/const activeChallenge = IRREGULAR_CHALLENGES\[showPastChallenges \? Math\.max\(1, currentChallengeIndex\) : 0\];\n/,
`const activeChallenge = IRREGULAR_CHALLENGES[showPastChallenges ? Math.max(1, currentChallengeIndex) : 0];

    useEffect(() => {
        const fetchScores = async () => {
            setLoadingChallenges(true);
            try {
                if (activeChallenge) {
                    const { data } = await getLeaderboard(activeChallenge.id, 5);
                    if (data) {
                        setTopScores(data as LeaderboardEntry[]);
                    }
                }
            } catch (e) {
                console.error('Error fetching data', e);
            } finally {
                setLoadingChallenges(false);
            }
        };
        fetchScores();
    }, [activeChallenge]);
`);

code = code.replace(/\{\[\]\.length > 0 \? \[\]\.map/g, "{topScores.length > 0 ? topScores.map");

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
