const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/event_generators.ts', 'utf8');

code = code.replace(
    /export const generateOIEvent = \(state: GameState\): GameEvent => \{[\s\S]*?return \{[\s\S]*?id: \`evt_codeforces_.*\};/m,
    `export const generateOIEvent = (state: GameState): GameEvent => {
    const r = Math.random();
    if (r < 0.25) {
        return {
            id: \`evt_codeforces_\${Date.now()}\`,
            title: 'Codeforces Round',
            description: '今晚有一场 Codeforces Div.1+2，你要打吗？',
            type: 'neutral',
            choices: [
                {
                    text: '打！冲Rating！',
                    action: (s) => {
                        const performance = Math.random() * (s.oiStats?.misc + s.oiStats?.math + 20) + (s.general.luck - 50) * 0.5;
                        const isGood = performance > 30;
                        return {
                            oiStats: modifyOI(s, { misc: isGood ? 2 : 1, math: 1 }),
                            general: { ...s.general, mindset: s.general.mindset + (isGood ? 5 : -5), health: s.general.health - 2 },
                            log: [...s.log, { message: isGood ? "上分了！爽！(运气加持)" : "掉分了...运气太差被A题卡了。", type: isGood ? 'success' : 'warning', timestamp: Date.now() }]
                        };
                    }
                },
                {
                    text: '算了吧，睡觉',
                    action: (s) => ({ general: { ...s.general, health: s.general.health + 2 } })
                }
            ]
        };
    } else if (r < 0.5) {
        return {
            id: \`evt_luogu_\${Date.now()}\`,
            title: '洛谷月赛',
            description: '周末有一场洛谷月赛，难度适中，参加吗？',
            type: 'neutral',
            choices: [
                {
                    text: '参加',
                    action: (s) => {
                        const isGood = Math.random() < 0.6;
                        return {
                            oiStats: modifyOI(s, { ds: 2, dp: 1 }),
                            general: { ...s.general, mindset: s.general.mindset + (isGood ? 3 : -2), experience: s.general.experience + 5 },
                            log: [...s.log, { message: isGood ? "洛谷月赛打得不错，DS能力提升！" : "洛谷月赛被吊打了，但积累了经验。", type: isGood ? 'success' : 'warning', timestamp: Date.now() }]
                        };
                    }
                },
                { text: '鸽了', action: (s) => ({}) }
            ]
        };
    } else if (r < 0.75) {
        return {
            id: \`evt_algo_\${Date.now()}\`,
            title: '发现神仙博客',
            description: '你在知乎上刷到了一篇关于高级图论算法（比如网络流）的神仙博客。',
            type: 'positive',
            choices: [
                {
                    text: '仔细钻研',
                    action: (s) => ({
                        oiStats: modifyOI(s, { graph: 3 }),
                        general: { ...s.general, efficiency: s.general.efficiency + 1 },
                        log: [...s.log, { message: "花了一晚上钻研博客，图论造诣大增！", type: 'success', timestamp: Date.now() }]
                    })
                },
                {
                    text: '收藏吃灰',
                    action: (s) => ({
                        log: [...s.log, { message: "收藏了神仙博客，假装自己学会了。", type: 'info', timestamp: Date.now() }]
                    })
                }
            ]
        };
    } else {
        return {
            id: \`evt_debug_\${Date.now()}\`,
            title: '玄学 Debug',
            description: '你有一道数据结构题调了一整天，样例过了但是提交总是 WA on pretest 2。',
            type: 'negative',
            choices: [
                {
                    text: '继续死磕！',
                    action: (s) => {
                        const success = Math.random() > 0.5;
                        return {
                            oiStats: modifyOI(s, { string: 1, ds: 1 }),
                            general: { ...s.general, mindset: s.general.mindset + (success ? 10 : -10), health: s.general.health - 5 },
                            log: [...s.log, { message: success ? "死磕一整天，终于发现是多测没清空！(心态大增)" : "死磕一天还是没找出来，破防了。(心态大崩)", type: success ? 'success' : 'error', timestamp: Date.now() }]
                        };
                    }
                },
                {
                    text: '求助机房大佬',
                    action: (s) => ({
                        general: { ...s.general, romance: s.general.romance + 2 },
                        log: [...s.log, { message: "大佬帮忙看了一眼：你数组开小了。", type: 'info', timestamp: Date.now() }]
                    })
                }
            ]
        };
    };`
);
fs.writeFileSync('/app/applet/data/event_generators.ts', code);
