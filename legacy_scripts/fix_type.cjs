const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');
code = code.replace(/valid\[slot\] = actId;/g, 'valid[slot] = actId as string;');
fs.writeFileSync('/app/applet/components/TimetableModal.tsx', code);
