const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

if (!code.includes('import TimetableModal')) {
    code = code.replace(
        /import \w+ from '\.\/components\/\w+';\n/,
        `$&import TimetableModal from './components/TimetableModal';\n`
    );
}

fs.writeFileSync('/app/applet/App.tsx', code);
