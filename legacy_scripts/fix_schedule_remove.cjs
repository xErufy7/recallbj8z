const fs = require('fs');
let app = fs.readFileSync('/app/applet/App.tsx', 'utf8');

const sIdx = app.indexOf('{/* Schedule/Journal Modal */}');
const eIdx = app.indexOf('{/* Ending */}');
if (sIdx !== -1 && eIdx !== -1) {
    app = app.substring(0, sIdx) + app.substring(eIdx);
}
fs.writeFileSync('/app/applet/App.tsx', app);
