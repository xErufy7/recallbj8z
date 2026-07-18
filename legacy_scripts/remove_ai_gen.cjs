const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

const startIdx = code.indexOf('{/* AI Generating Loading Overlay */}');
const endIdx = code.indexOf('{/* Toast */}');
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
}
fs.writeFileSync('/app/applet/App.tsx', code);
