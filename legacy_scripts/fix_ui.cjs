const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

code = code.replace(/<FloatingStats state=\{state\} onShowHistory=\{\(\) => setShowContestHistory\(true\)\} \/>\n/g, '');

fs.writeFileSync('/app/applet/App.tsx', code);
