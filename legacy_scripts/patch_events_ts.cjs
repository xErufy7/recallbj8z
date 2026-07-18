const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/events.ts', 'utf8');
code = code.replace(
    /import \{ getHistoricalEventsForWeek, loadHistoricalEventsForCity \} from '\.\/historical_events';/,
    `import { getHistoricalEventsForWeek, loadHistoricalEventsForCity } from './historical_events';
import { SEMESTER_2_EVENTS, WINTER_BREAK_EVENTS } from './events_semester2';`
);
code = code.replace(
    /\[Phase\.WINTER_BREAK\]: \[\],/,
    `[Phase.WINTER_BREAK]: injectSleep(WINTER_BREAK_EVENTS),`
);
code = code.replace(
    /\[Phase\.SEMESTER_2\]: \[\],/,
    `[Phase.SEMESTER_2]: injectSleep(SEMESTER_2_EVENTS),`
);
fs.writeFileSync('/app/applet/data/events.ts', code);
