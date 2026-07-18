const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');
code = code.replace(/difficulty === \\'REALITY\\'/g, "state.difficulty === 'REALITY'");
fs.writeFileSync('/app/applet/App.tsx', code);
