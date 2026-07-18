const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

code = code.replace(/import FloatingStats from '\.\/components\/FloatingStats';\n/g, '');

fs.writeFileSync('/app/applet/App.tsx', code);
