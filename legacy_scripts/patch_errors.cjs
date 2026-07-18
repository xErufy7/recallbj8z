const fs = require('fs');

let appCode = fs.readFileSync('/app/applet/App.tsx', 'utf8');
appCode = appCode.replace(/Phase\.WINTER/g, 'Phase.WINTER_BREAK');
fs.writeFileSync('/app/applet/App.tsx', appCode);

let homeCode = fs.readFileSync('/app/applet/components/HomeView.tsx', 'utf8');
homeCode = homeCode.replace(/<button[^>]*onClick=\{\(\) => openLeaderboard\([^)]*\)\}[^>]*>[\s\S]*?<\/button>/, '');
fs.writeFileSync('/app/applet/components/HomeView.tsx', homeCode);
