const fs = require('fs');
let app = fs.readFileSync('/app/applet/App.tsx', 'utf8');

// Remove ScheduleModal import
app = app.replace(/import ScheduleModal from '\.\/components\/ScheduleModal';/, '');

// Change button text from 手账 to 时间表
app = app.replace(
    /<button onClick=\{\(\) => setShowSchedule\(true\)\} className="flex-shrink-0 bg-white border px-3 py-2 rounded-xl text-xs font-bold shadow-sm"><i className="fas fa-calendar-alt text-blue-500 mr-1"><\/i>手账<\/button>/,
    `<button onClick={() => setShowSchedule(true)} className="flex-shrink-0 bg-white border px-3 py-2 rounded-xl text-xs font-bold shadow-sm"><i className="fas fa-calendar-alt text-blue-500 mr-1"></i>时间表</button>`
);

// Replace the ScheduleModal rendering with TimetableModal in read-only mode, or just don't show it if it's not planning time.
// Wait, to make TimetableModal read-only when accessed mid-week:
// Let's just remove the old ScheduleModal rendering.
const startSchedule = app.indexOf('{showSchedule &&');
if (startSchedule !== -1) {
    const endSchedule = app.indexOf('/>', startSchedule) + 2;
    if (app.substring(endSchedule, endSchedule+1) === '}') {
        app = app.substring(0, startSchedule) + app.substring(endSchedule+1);
    } else {
        // Just regex replace
        app = app.replace(/\{showSchedule && <ScheduleModal onClose=\{\(\) => setShowSchedule\(false\)\} state=\{state\} \/>\}/, '');
    }
}

// Render TimetableModal mid-week if showSchedule is true
app = app.replace(
    /\{showSchedule && <ScheduleModal[^>]*>\}/, 
    ''
);

// We can just add it before the Event Modal
app = app.replace(
    /\{\/\* Event Modal \*\/\}/,
    `{/* Timetable (View Mode) */}
        {showSchedule && !state.isWeekend && (
            <TimetableModal state={state} onConfirm={() => setShowSchedule(false)} />
        )}
        {/* Event Modal */}`
);

fs.writeFileSync('/app/applet/App.tsx', app);
