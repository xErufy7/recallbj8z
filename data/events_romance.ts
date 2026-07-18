import { GameEvent, Phase } from '../types';

export const ROMANCE_EVENTS: GameEvent[] = [
    // --- 阶段1：初识与萌芽 (好感�?< 30) ---
    {
        id: 'romance_first_encounter',
        title: '走廊的转�?,
        description: '你抱着一摞作业本匆匆走过拐角，不小心撞到了TA。几本书掉在了地上�?,
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) < 30 && Math.random() < 0.1,
        once: true,
        choices: [
            {
                text: '连忙道歉并帮TA捡起�?,
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 5, romance: s.general.romance + 2 },
                    flags: { ...s.flags, ta_favorability: (s.flags.ta_favorability || 0) + 10 },
                    log: [...s.log, { message: 'TA笑着说“没事”，你们的手不经意间触碰，你心里漏跳了一拍�?, type: 'success', timestamp: Date.now() }]
                })
            },
            {
                text: '手忙脚乱地捡自己的书',
                action: (s) => ({
                    general: { ...s.general, mindset: s.general.mindset - 2 },
                    log: [...s.log, { message: '你太紧张了，甚至没敢多看TA一眼就跑开了�?, type: 'warning', timestamp: Date.now() }]
                })
            },
            {
                text: '假装镇定，酷酷地把书递给TA',
                condition: (s) => s.general.romance > 40,
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 8 },
                    flags: { ...s.flags, ta_favorability: (s.flags.ta_favorability || 0) + 15 },
                    log: [...s.log, { message: '你的从容似乎给TA留下了不错的印象�?, type: 'success', timestamp: Date.now() }]
                })
            }
        ]
    },
    {
        id: 'romance_same_song',
        title: '同频共振',
        description: '课间休息时，你听到后排传来熟悉的旋律，发现TA也喜欢你最爱的那支乐队�?,
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) < 30 && !!s.flags.ta_favorability && Math.random() < 0.1,
        once: true,
        choices: [
            {
                text: '主动搭话：“你也听他们的歌？�?,
                action: (s) => {
                    if (s.general.luck > 40) {
                        return {
                            general: { ...s.general, mindset: s.general.mindset + 5, romance: s.general.romance + 5 },
                            flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 15 },
                            log: [...s.log, { message: 'TA眼睛一亮，你们滔滔不绝地聊了一整个课间�?, type: 'success', timestamp: Date.now() }]
                        };
                    } else {
                        return {
                            general: { ...s.general, mindset: s.general.mindset - 3 },
                            flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 2 },
                            log: [...s.log, { message: 'TA有些害羞地点点头，话题没有展开�?, type: 'neutral', timestamp: Date.now() }]
                        };
                    }
                }
            },
            {
                text: '在心里默默记下，不打扰TA',
                action: (s) => ({
                    general: { ...s.general, efficiency: s.general.efficiency + 3 },
                    log: [...s.log, { message: '发现同好的喜悦让你一整天学习都很专注�?, type: 'info', timestamp: Date.now() }]
                })
            }
        ]
    },

    // --- 阶段2：日常互�?(好感�?30 ~ 70) ---
    {
        id: 'romance_study_help',
        title: '难题探讨',
        description: 'TA似乎被一道复杂的理科题难住了，正咬着笔头犯愁�?,
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 30 && (s.flags.ta_favorability || 0) < 70 && Math.random() < 0.15,
        choices: [
            {
                text: '凑过去：“我看看，这题我会。�?,
                condition: (s) => s.general.thinking > 60 || (s.subjects.math && s.subjects.math.level > 10),
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 8, romance: s.general.romance + 3 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 10 },
                    log: [...s.log, { message: '你流畅的思路让TA投来了崇拜的目光�?, type: 'success', timestamp: Date.now() }]
                })
            },
            {
                text: '和TA一起研�?,
                action: (s) => ({
                    general: { ...s.general, efficiency: s.general.efficiency + 5, romance: s.general.romance + 5 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 8 },
                    log: [...s.log, { message: '你们凑在一起讨论了半天，虽然没解出来，但距离拉近了�?, type: 'info', timestamp: Date.now() }]
                })
            },
            {
                text: '默默递给TA一张写满步骤的草稿�?,
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 10 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 12 },
                    log: [...s.log, { message: 'TA看着工整的草稿，对着你的背影笑了�?, type: 'success', timestamp: Date.now() }]
                })
            }
        ]
    },
    {
        id: 'romance_rainy_day',
        title: '屋檐躲雨',
        description: '放学时突降大雨，你发现TA站在教学楼门口，似乎没有带伞�?,
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 30 && Math.random() < 0.1,
        choices: [
            {
                text: '把伞借给TA，自己淋雨跑回家',
                action: (s) => {
                    if (s.general.health > 60) {
                        return {
                            general: { ...s.general, health: s.general.health - 5, romance: s.general.romance + 15 },
                            flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 20 },
                            log: [...s.log, { message: '虽然淋成了落汤鸡，但TA看着你远去背影的眼神充满感动�?, type: 'success', timestamp: Date.now() }]
                        };
                    } else {
                        return {
                            general: { ...s.general, health: s.general.health - 15, romance: s.general.romance + 10 },
                            flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 15 },
                            log: [...s.log, { message: '你把伞给了TA，但第二天你不幸重感冒了...', type: 'warning', timestamp: Date.now() }]
                        };
                    }
                }
            },
            {
                text: '撑开伞：“一起走吧，顺路。�?,
                condition: (s) => s.general.romance > 30,
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 12 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 15 },
                    log: [...s.log, { message: '伞面不大，你们的肩膀靠得很近，一路上只有连绵的雨声和心跳声�?, type: 'success', timestamp: Date.now() }]
                })
            },
            {
                text: '站在TA旁边陪着等雨�?,
                action: (s) => ({
                    general: { ...s.general, mindset: s.general.mindset + 5, romance: s.general.romance + 5 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 5 },
                    log: [...s.log, { message: '屋檐下的时光很安静，你们聊了很多琐事�?, type: 'info', timestamp: Date.now() }]
                })
            }
        ]
    },

    // --- 阶段3：关键突�?(好感�?>= 70) ---
    {
        id: 'romance_weekend_date',
        title: '周末的邀�?,
        description: '你在微信上犹豫了很久，周末想约TA去市�?咖啡厅自习�?,
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 70 && !s.flags.had_weekend_date && Math.random() < 0.2,
        once: true,
        choices: [
            {
                text: '发送：“周末有空一起看书吗？�?,
                action: (s) => {
                    if (s.general.luck > 20) {
                        return {
                            general: { ...s.general, romance: s.general.romance + 20, mindset: s.general.mindset + 15, money: s.general.money - 30 },
                            flags: { ...s.flags, ta_favorability: s.flags.ta_favorability + 20, had_weekend_date: true },
                            log: [...s.log, { message: 'TA几乎秒回了“好啊”。那个周末，阳光正好，你们聊得非常开心�?, type: 'success', timestamp: Date.now() }]
                        };
                    } else {
                        return {
                            general: { ...s.general, mindset: s.general.mindset - 10 },
                            log: [...s.log, { message: 'TA回复说“抱歉周末家里有事”，你感到有些失落�?, type: 'warning', timestamp: Date.now() }]
                        };
                    }
                }
            },
            {
                text: '还是算了，专心搞竞赛/学习',
                action: (s) => ({
                    general: { ...s.general, efficiency: s.general.efficiency + 10, mindset: s.general.mindset - 2 },
                    log: [...s.log, { message: '你把萌动的心意按回心底，化作刷题的动力�?, type: 'info', timestamp: Date.now() }]
                })
            }
        ]
    },
    {
        id: 'romance_confession_prep',
        title: '心照不宣',
        description: '晚自习结束后，校园里人已散去。TA突然叫住你，眼神里闪烁着某种光芒：“其实这段时间，我一直想说……�?,
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 100 && !s.flags.romance_established && Math.random() < 0.5,
        once: true,
        choices: [
            {
                text: '抢先开口：“我喜欢你！�?,
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 30, mindset: s.general.mindset + 20, romance: s.general.romance + 10 },
                    flags: { ...s.flags, romance_established: true, ta_favorability: 999 },
                    log: [...s.log, { message: 'TA愣了一下，随后红着脸笑了：“我也是。�?你们正式在一起了�?, type: 'success', timestamp: Date.now() }]
                })
            },
            {
                text: '静静等待TA说完',
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 25, mindset: s.general.mindset + 15 },
                    flags: { ...s.flags, romance_established: true, ta_favorability: 999 },
                    log: [...s.log, { message: 'TA轻声说：“和你在一起很开心。�?夜风微凉，但你的心是滚烫的�?, type: 'success', timestamp: Date.now() }]
                })
            },
            {
                text: '回避视线：“太晚了，先回家吧。�?,
                action: (s) => ({
                    general: { ...s.general, mindset: s.general.mindset - 20, romance: s.general.romance - 10 },
                    flags: { ...s.flags, ta_favorability: s.flags.ta_favorability - 20 },
                    log: [...s.log, { message: 'TA眼底闪过一丝受伤，默默转身离开了。你可能错过了一生中最重要的时刻�?, type: 'error', timestamp: Date.now() }]
                })
            }
        ]
    }
];
