const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');

code = code.replace(/key === 'AI_STORY' \? 'bg-indigo-600 text-white' : /g, "");
code = code.replace(/key === 'AI_STORY' && selectedDifficulty === key \? 'bg-white' : /g, "");
code = code.replace(/\{key === 'AI_STORY' && <i className="fas fa-sparkles text-xs animate-pulse"><\/i>\}/g, "");
code = code.replace(/&& selectedDifficulty !== 'AI_STORY'/g, "");

fs.writeFileSync('/app/applet/components/HomeView.tsx', code);
