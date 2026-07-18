import { GameEvent, Phase } from '../types';

export const ROMANCE_EVENTS: GameEvent[] = [
    // --- 阶段1：初识与萌芽 (好感度 < 30) ---
    {
        id: 'romance_first_encounter',
        title: '走廊的转角',
        description: '你抱着一摞作业本匆匆走过拐角，不小心撞到了TA。几本书掉在了地上。',
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) < 30 && Math.random() < 0.1,
        choices: [
            {
                id: 'help_pick_up',
                text: '赶紧帮忙捡起来连声道歉',
                resultDescription: 'TA看着你手忙脚乱的样子，忍不住笑了：“没关系，我自己来吧。”（好感度微升）',
                effect: {
                    general: { mindset: 0, health: 0, money: 0, efficiency: 0, romance: 2, experience: 0, luck: 0 },
                    flags: { ta_favorability: 5 }
                }
            },
            {
                id: 'stare_blankly',
                text: '愣在原地看着TA',
                resultDescription: '你呆呆地看着TA捡起书，气氛有些尴尬，TA皱了皱眉快步离开了。（好感度下降）',
                effect: {
                    general: { mindset: -5, health: 0, money: 0, efficiency: 0, romance: -2, experience: 0, luck: 0 },
                    flags: { ta_favorability: -5 }
                }
            },
            {
                id: 'joke_around',
                text: '“同学，你的书和我很有缘啊。”（需要魅力>20）',
                condition: (s) => s.general.romance > 20,
                resultDescription: 'TA愣了一下，随后噗嗤一声笑了：“你的搭讪方式真老土。”你们借此聊了几句。（好感度大幅上升）',
                effect: {
                    general: { mindset: +5, health: 0, money: 0, efficiency: 0, romance: +5, experience: 0, luck: 0 },
                    flags: { ta_favorability: 10 }
                }
            }
        ]
    },
    {
        id: 'romance_same_song',
        title: '同频共振',
        description: '午休时间，你在座位上听歌，TA碰巧路过，看到了你手机屏幕上的播放界面。',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) > 5 && (s.flags.ta_favorability || 0) < 30 && Math.random() < 0.1,
        choices: [
            {
                id: 'share_earbud',
                text: '递过一只耳机：“要一起听吗？”',
                resultDescription: 'TA犹豫了一下，接过耳机。你们静静地听完了一首歌，仿佛分享了一个小秘密。（好感度上升）',
                effect: {
                    general: { mindset: +10, health: 0, money: 0, efficiency: 0, romance: +3, experience: 0, luck: 0 },
                    flags: { ta_favorability: 8 }
                }
            },
            {
                id: 'discuss_music',
                text: '“你也喜欢这首歌？”',
                resultDescription: '你们就这首歌的歌手聊了一会儿，发现彼此的音乐品味出奇地一致。（好感度上升）',
                effect: {
                    general: { mindset: +5, health: 0, money: 0, efficiency: 0, romance: +2, experience: 0, luck: 0 },
                    flags: { ta_favorability: 5 }
                }
            }
        ]
    },
    {
        id: 'romance_borrow_notes',
        title: '借笔记',
        description: '这节课的知识点很难，TA似乎没有完全听懂，正皱着眉头翻看课本。',
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) > 10 && (s.flags.ta_favorability || 0) < 30 && Math.random() < 0.1,
        choices: [
            {
                id: 'offer_notes',
                text: '主动把自己的完美笔记递过去（需要任一理科等级>=2）',
                condition: (s) => s.subjects.math.level >= 2 || s.subjects.physics.level >= 2 || s.subjects.chemistry.level >= 2,
                resultDescription: 'TA十分感激地接过笔记：“太感谢了！你的字写得真好看。”（好感度上升）',
                effect: {
                    general: { mindset: +5, health: 0, money: 0, efficiency: 0, romance: +2, experience: 0, luck: 0 },
                    flags: { ta_favorability: 8 }
                }
            },
            {
                id: 'teach_problem',
                text: '凑过去问：“哪里不懂？我教你。”',
                resultDescription: '你耐心地给TA讲解了难点，TA恍然大悟，看着你的眼神多了几分崇拜。（好感度大幅上升，耗费一点精力）',
                effect: {
                    general: { mindset: 0, health: -5, money: 0, efficiency: -1, romance: +3, experience: +5, luck: 0 },
                    flags: { ta_favorability: 10 }
                }
            }
        ]
    },

    // --- 阶段2：暧昧与日常 (好感度 30 - 70) ---
    {
        id: 'romance_study_together',
        title: '图书馆的偶遇',
        description: '周末在首都图书馆，你正准备找个座位，抬头发现TA也在这里，正向许招手。',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 30 && (s.flags.ta_favorability || 0) < 70 && s.isWeekend && Math.random() < 0.2,
        choices: [
            {
                id: 'sit_together',
                text: '走过去坐在TA旁边',
                resultDescription: '你们默契地一起自习了一下午，偶尔交流几个问题。学习效率出奇的高。（好感度上升，各科经验提升）',
                effect: {
                    general: { mindset: +10, health: 0, money: 0, efficiency: +2, romance: +2, experience: +10, luck: 0 },
                    flags: { ta_favorability: 10 },
                    subjects: { math: 10, physics: 10, english: 10 }
                }
            },
            {
                id: 'buy_drinks',
                text: '“等我一下”，去买两杯热奶茶回来（需要金钱>30）',
                condition: (s) => s.general.money > 30,
                resultDescription: '你把热腾腾的奶茶递给TA，TA捧着杯子，脸颊微红：“谢谢，你怎么知道我喜欢这个口味？”（好感度大幅上升）',
                effect: {
                    general: { mindset: +15, health: +5, money: -30, efficiency: +1, romance: +5, experience: 0, luck: 0 },
                    flags: { ta_favorability: 15 }
                }
            }
        ]
    },
    {
        id: 'romance_sports_meet',
        title: '运动会送水',
        description: '秋季运动会，你刚跑完1000米，气喘吁吁。TA拿着一瓶矿泉水在终点等你。',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 40 && (s.flags.ta_favorability || 0) < 70 && s.phase === Phase.SEMESTER_1 && s.week > 4 && s.week < 8,
        choices: [
            {
                id: 'accept_water',
                text: '接过水一饮而尽：“谢了！”',
                resultDescription: 'TA递给你纸巾让你擦汗，你们相视一笑，周围同学投来起哄的目光。（好感度上升）',
                effect: {
                    general: { mindset: +20, health: +10, money: 0, efficiency: 0, romance: +5, experience: 0, luck: 0 },
                    flags: { ta_favorability: 10 }
                }
            },
            {
                id: 'show_off',
                text: '强装镇定：“一点都不累，小意思。”',
                resultDescription: 'TA白了你一眼，把水塞到你怀里：“行了别装了，快喝吧。”虽然被拆穿，但气氛很温馨。（好感度上升）',
                effect: {
                    general: { mindset: +10, health: +5, money: 0, efficiency: 0, romance: +2, experience: 0, luck: 0 },
                    flags: { ta_favorability: 8 }
                }
            }
        ]
    },
    {
        id: 'romance_late_chat',
        title: '深夜的聊天',
        description: '已经过了零点，你正准备睡觉，手机屏幕亮了，是TA发来的消息：“睡了吗？有点睡不着。”',
        type: 'neutral',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 50 && (s.flags.ta_favorability || 0) < 70 && Math.random() < 0.15,
        choices: [
            {
                id: 'chat_all_night',
                text: '陪TA聊天直到深夜',
                resultDescription: '你们从学校的八卦聊到未来的理想，感觉彼此的心贴得更近了。但第二天上课你困得不行。（好感度大幅上升，健康和效率下降）',
                effect: {
                    general: { mindset: +15, health: -15, money: 0, efficiency: -2, romance: +5, experience: 0, luck: 0 },
                    flags: { ta_favorability: 15 }
                }
            },
            {
                id: 'urge_to_sleep',
                text: '“早点休息吧，明天还要早起呢。”',
                resultDescription: 'TA回复了一个“晚安”的表情包。虽然有些失落，但你知道这样对彼此都好。（好感度不变，心态略降）',
                effect: {
                    general: { mindset: -5, health: +5, money: 0, efficiency: 0, romance: 0, experience: 0, luck: 0 },
                }
            }
        ]
    },

    // --- 阶段3：关键转折 (好感度 >= 70) ---
    {
        id: 'romance_confession_prep',
        title: '跨年夜的邀约',
        description: '马上就是元旦了，班级里弥漫着节日的气氛。TA走到你座位旁，有些局促：“跨年夜……你有什么安排吗？”',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => (s.flags.ta_favorability || 0) >= 70 && !s.romancePartner && s.phase === Phase.SEMESTER_1 && s.week === 18,
        choices: [
            {
                id: 'accept_invite',
                text: '“还没有，要一起去王府井倒数吗？”',
                resultDescription: 'TA的眼睛亮了起来：“好！那就这么说定了，不见不散！”（好感度满点，准备进入表白事件）',
                effect: {
                    general: { mindset: +30, health: 0, money: 0, efficiency: +2, romance: +10, experience: 0, luck: 0 },
                    flags: { ta_favorability: 20, ready_for_confession: true }
                }
            },
            {
                id: 'reject_invite',
                text: '“我要和信竞队一起集训 / 要复习期末考。”',
                resultDescription: 'TA眼里的光黯淡了下去：“这样啊……那祝你学习顺利。”（好感度大幅下降，可能错失机会）',
                effect: {
                    general: { mindset: -20, health: 0, money: 0, efficiency: +2, romance: -10, experience: 0, luck: 0 },
                    flags: { ta_favorability: -30 }
                }
            }
        ]
    },
    {
        id: 'romance_confession',
        title: '钟声与告白',
        description: '跨年夜，王府井大街上人山人海。新年的钟声即将敲响，满天繁星似乎都在见证这一刻。TA转过头，认真地看着你：“其实，我喜欢你很久了。”',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => s.flags.ready_for_confession && !s.romancePartner && s.week === 19, // 紧接着上一周
        choices: [
            {
                id: 'accept_confession',
                text: '“我也喜欢你。”（握住TA的手）',
                resultDescription: '在零点钟声敲响的那一刻，你们紧紧相拥。在这所高中里，你不再是孤单一人了。（确立关系！）',
                effect: {
                    general: { mindset: +100, health: +20, money: 0, efficiency: +3, romance: +20, experience: 0, luck: +10 },
                    romancePartner: 'TA' // 确立关系
                }
            },
            {
                id: 'hesitate',
                text: '“我……还没准备好。”',
                resultDescription: 'TA苦笑了一下：“没关系，是我太唐突了。”新年的钟声听起来有些刺耳。（好感度清零，关系回到原点）',
                effect: {
                    general: { mindset: -30, health: 0, money: 0, efficiency: -3, romance: -20, experience: 0, luck: 0 },
                    flags: { ta_favorability: -100, ready_for_confession: false }
                }
            }
        ]
    },
    {
        id: 'romance_valentine',
        title: '情人节的巧克力',
        description: '今天是情人节。你打开课桌抽屉，发现里面静静地躺着一盒包装精致的巧克力，上面没有署名。',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => !s.romancePartner && s.general.romance > 40 && s.phase === Phase.SEMESTER_2 && s.week === 2 && Math.random() < 0.5,
        choices: [
            {
                id: 'guess_who',
                text: '环顾四周，寻找是谁放的',
                resultDescription: '你看到TA在不远处假装看书，余光却不时飘向你这边。你心里有了答案，微微一笑。（魅力与心态提升）',
                effect: {
                    general: { mindset: +15, health: +5, money: 0, efficiency: 0, romance: +5, experience: 0, luck: 0 },
                    flags: { ta_favorability: 10 }
                }
            },
            {
                id: 'just_eat',
                text: '管他是谁，直接拆开吃掉',
                resultDescription: '巧克力很甜，但你似乎错过了某个弄清真相的机会。远处传来一声轻不可闻的叹息。',
                effect: {
                    general: { mindset: +5, health: +2, money: 0, efficiency: 0, romance: 0, experience: 0, luck: 0 }
                }
            }
        ]
    },

    // --- 确立关系后的日常 ---
    {
        id: 'romance_dating_park',
        title: '玉渊潭的樱花',
        description: '春暖花开，TA提议周末一起去玉渊潭看樱花。',
        type: 'positive',
        triggerType: 'RANDOM',
        condition: (s) => !!s.romancePartner && s.phase === Phase.SEMESTER_2 && s.week > 4 && s.week < 8 && s.isWeekend,
        choices: [
            {
                id: 'go_date',
                text: '欣然前往，准备相机（花费50金钱）',
                condition: (s) => s.general.money >= 50,
                resultDescription: '樱花树下，你为TA拍了许多美丽的照片。这一天的回忆成为了你们最珍贵的宝物。（心态大增）',
                effect: {
                    general: { mindset: +30, health: +10, money: -50, efficiency: 0, romance: +5, experience: +10, luck: 0 }
                }
            },
            {
                id: 'stay_study',
                text: '“马上期中考了，我们还是去自习吧。”',
                resultDescription: 'TA虽然有些遗憾，但还是答应了。你们在自习室度过了一个充实的周末。（学业提升，心态微降）',
                effect: {
                    general: { mindset: -5, health: 0, money: 0, efficiency: +2, romance: 0, experience: +20, luck: 0 },
                    subjects: { math: 15, physics: 15, chinese: 15 }
                }
            }
        ]
    }
];
