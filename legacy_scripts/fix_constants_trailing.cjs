const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/constants.ts', 'utf8');
code = code.replace(/    \},\s*\}\s*;/g, "    }\n};");
fs.writeFileSync('/app/applet/data/constants.ts', code);
