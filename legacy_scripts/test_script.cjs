const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/TimetableModal.tsx', 'utf8');
console.log(code.includes("useEffect(() => {"));
