const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');
code = code.replace(/selectedDifficulty === 'AI_STORY'/g, "false");
fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
