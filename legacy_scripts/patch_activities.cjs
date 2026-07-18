const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/mechanics.ts', 'utf8');

const newActivities = `
    {
        id: 'act_music', name: '听音乐放松', icon: 'fa-headphones', type: 'REST',
        description: '沉浸在音乐的世界里，放松心情。',
        resultText: '听了一下午的歌，感觉心情平静了许多。',
        action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 5, health: s.general.health + 2, money: s.general.money - 2 } })
    },
    {
        id: 'act_movie', name: '看电影', icon: 'fa-film', type: 'REST',
        description: '去电影院或者在家看一部好电影。',
        resultText: '一部好电影能让人体验不同的人生。',
        action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 8, experience: s.general.experience + 5, money: s.general.money - 10 } })
    },
    {
        id: 'act_sport', name: '体育锻炼', icon: 'fa-running', type: 'REST',
        description: '去操场跑步或者打球。',
        resultText: '大汗淋漓之后，感觉身体更加充满活力了。',
        action: (s) => ({ general: { ...s.general, health: s.general.health + 10, mindset: s.general.mindset + 3, efficiency: s.general.efficiency + 2 } })
    },
    {
        id: 'act_library', name: '泡图书馆', icon: 'fa-book-reader', type: 'STUDY',
        description: '在安静的图书馆里看书自习。',
        resultText: '在知识的海洋中遨游，感觉自己变聪明了。',
        action: (s) => ({ general: { ...s.general, experience: s.general.experience + 10, efficiency: s.general.efficiency + 3, mindset: s.general.mindset - 2 } })
    },
`;

code = code.replace(
    /export const WEEKEND_ACTIVITIES: WeekendActivity\[\] = \[/,
    `export const WEEKEND_ACTIVITIES: WeekendActivity[] = [\n${newActivities}`
);

fs.writeFileSync('/app/applet/data/mechanics.ts', code);
