const fs = require('fs');
let code = fs.readFileSync('/app/applet/App.tsx', 'utf8');

if (!code.includes('isDevMode')) {
    code = code.replace(
        /const \[state, setState\] = useState<GameState>\(initialState\);\n/,
        `$&    const [isDevMode, setIsDevMode] = useState(false);\n    (window as any).toggleDevMode = () => setIsDevMode(p => !p);\n`
    );
    
    // add dev panel
    code = code.replace(
        /\{\/\* Header \*\/\}/,
        `{/* Header */}
        {isDevMode && (
             <div className="bg-red-50 p-2 text-red-600 border border-red-200 rounded-lg flex gap-2 overflow-x-auto text-xs z-50">
                 <button onClick={() => setState(s => ({...s, phase: Phase.SUMMER}))}>+Summer</button>
                 <button onClick={() => setState(s => ({...s, phase: Phase.SEMESTER_1}))}>+Sem1</button>
                 <button onClick={() => setState(s => ({...s, phase: Phase.WINTER}))}>+Winter</button>
                 <button onClick={() => setState(s => ({...s, phase: Phase.SEMESTER_2}))}>+Sem2</button>
                 <button onClick={() => setState(s => ({...s, week: s.week + 1}))}>+Week</button>
                 <button onClick={() => setState(s => ({...s, general: {...s.general, money: s.general.money + 100}}))}>+$100</button>
                 <button onClick={() => setState(s => ({...s, general: {...s.general, health: 100, mindset: 100}}))}>+Heal</button>
                 <button onClick={() => setState(s => ({...s, general: {...s.general, experience: s.general.experience + 100}}))}>+Exp</button>
             </div>
        )}`
    );
}

fs.writeFileSync('/app/applet/App.tsx', code);
