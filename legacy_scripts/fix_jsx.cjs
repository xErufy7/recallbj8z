const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/ContestHistoryModal.tsx', 'utf8');
code = code.replace(/=\\> \{record\.newRating\}/g, '{"=>"} {record.newRating}');
fs.writeFileSync('/app/applet/components/ContestHistoryModal.tsx', code);
