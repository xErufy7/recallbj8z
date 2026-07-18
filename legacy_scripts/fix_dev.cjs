const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

if (!code.includes('const [isDevMode')) {
    code = code.replace(
        /const App: React\.FC = \(\) => \{/,
        `$&
  const [isDevMode, setIsDevMode] = useState(false);
  (window as any).toggleDevMode = () => setIsDevMode(p => !p);`
    );
    fs.writeFileSync('/app/applet/App.tsx', code);
}
