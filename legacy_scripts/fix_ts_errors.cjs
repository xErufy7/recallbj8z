const fs = require('fs');

// Fix TimetableModal
let tm = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');
tm = tm.replace(/for \(const \[sId, actId\] of Object\.entries\(schedule\)\) \{/g, 'for (const [sId, _actId] of Object.entries(schedule)) {\n            const actId = _actId as string;');
fs.writeFileSync('/app/applet/components/TimetableModal.tsx', tm);

// Fix HomeView
let hv = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');
hv = hv.replace(/difficulty === 'AI_STORY'/g, 'false');
// Or remove the button completely:
// Actually, let's just replace the whole difficulty selection for AI_STORY if it exists
hv = hv.replace(/<button[^>]*onClick=\{\(\) => setDifficulty\('AI_STORY'\)\}[^>]*>[\s\S]*?<\/button>/, '');
fs.writeFileSync('/app/applet/components/HomeView.tsx', hv);

// Fix useGameLogic
let ugl = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');
ugl = ugl.replace(/difficulty === 'AI_STORY'/g, 'false');
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', ugl);

// Fix mechanics.ts type error (Type '"ACADEMIC"' is not assignable to type '"OI" | "REST" | "STUDY" | "SOCIAL" | "LOVE" | "PROJECT"'.)
let mech = fs.readFileSync('/app/applet/data/mechanics.ts', 'utf8');
mech = mech.replace(/type: 'ACADEMIC'/, "type: 'OI'"); // CF is OI
fs.writeFileSync('/app/applet/data/mechanics.ts', mech);

