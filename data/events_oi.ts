import { GameEvent, Phase } from '../types';

export const OI_EVENTS: GameEvent[] = [
    // ---------------- NOIWC (Winter Break) ----------------
    {
        id: 'oi_wc_invite',
        title: 'NOIWC 冬令营邀请',
        description: '你在 CSP-S 中取得了极为优异的成绩（>280分），成功获得了 NOI 冬令营（NOIWC & CTSC）的邀请函！',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 2,
        condition: (s) => s.phase === Phase.WINTER_BREAK && s.competition === 'OI' && (s.flags.csp_score || 0) > 280,
        choices: [
            { 
                text: '前往报到', 
                action: (s) => ({ 
                    eventQueue: [
                        {...OI_EVENTS_POOL.find(e=>e.id==='oi_wc_arrive')! }
                    ]
                }) 
            },
            { 
                text: '算了，我要在家里卷', 
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset - 10, efficiency: s.general.efficiency + 5 } }) 
            }
        ]
    },
    // ---------------- 省选 (Semester 2, Week 4) ----------------
    {
        id: 'oi_provincial_invite',
        title: '联合省选集结令',
        description: 'NOIP 的成绩让你获得了参加本省信息学奥林匹克省队选拔（省选）的资格！各省分数线不同，但这是通往 NOI 的唯一道路。',
        type: 'neutral',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 4,
        condition: (s) => s.phase === Phase.SEMESTER_2 && s.competition === 'OI' && (s.flags.noip_score || 0) >= 150, // Lowered threshold slightly to reflect varying province requirements
        choices: [
            {
                text: '迎战省选！',
                action: (s) => ({
                    eventQueue: [
                        {...OI_EVENTS_POOL.find(e=>e.id==='oi_provincial_day1')!}
                    ]
                })
            },
            {
                text: '我感觉希望渺茫，专心搞文化课吧',
                action: (s) => ({
                    competition: 'None',
                    general: { ...s.general, efficiency: s.general.efficiency + 10, mindset: s.general.mindset - 20 }
                })
            }
        ]
    },
    // ---------------- APIO (Semester 2, Week 12) ----------------
    {
        id: 'oi_apio_invite',
        title: 'APIO 亚洲与太平洋地区信息学奥林匹克',
        description: '基于你的 NOIP 成绩，你获得了 APIO 的参赛资格。这场全英文题面的国际级别赛事，是绝佳的锻炼机会。',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 12,
        condition: (s) => s.phase === Phase.SEMESTER_2 && s.competition === 'OI' && (s.flags.noip_score || 0) > 180,
        choices: [
            {
                text: '参加线上测试',
                action: (s) => ({
                    eventQueue: [
                        {...OI_EVENTS_POOL.find(e=>e.id==='oi_apio_exam')!}
                    ]
                })
            },
            {
                text: '放弃参赛',
                action: (s) => ({ general: { ...s.general, money: s.general.money + 50 } }) // Saved registration fee
            }
        ]
    },
    // ---------------- NOI (Summer Break, Week 2) ----------------
    {
        id: 'oi_noi_invite',
        title: 'NOI 全国青少年信息学奥林匹克竞赛',
        description: '你成功杀入了省队！最高荣誉的殿堂 NOI 就在眼前，这也决定了你是否能保送清北。',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 2,
        condition: (s) => s.phase === Phase.SUMMER_BREAK && s.competition === 'OI' && !!s.flags.provincial_team,
        choices: [
            {
                text: '出征 NOI！',
                action: (s) => ({
                    eventQueue: [
                        {...OI_EVENTS_POOL.find(e=>e.id==='oi_noi_arrive')!}
                    ]
                })
            }
        ]
    }
];

export const OI_EVENTS_POOL: GameEvent[] = [
    // WC Events
    {
        id: 'oi_wc_arrive',
        title: 'NOIWC 报到与开幕式',
        description: '你来到了全国冬令营现场。开幕式上，CCF 秘书长 dzd 慷慨激昂地发表了一番关于“计算机教育要从娃娃抓起”的演讲，底下掌声雷动。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '认真听讲座，记笔记',
                action: (s) => ({
                    general: { ...s.general, experience: s.general.experience + 10, mindset: s.general.mindset - 5 },
                    phase: Phase.WC_EXAM
                })
            },
            {
                text: '在下面偷偷刷题',
                action: (s) => ({
                    general: { ...s.general, efficiency: s.general.efficiency + 2 },
                    phase: Phase.WC_EXAM
                })
            }
        ]
    },
    {
        id: 'oi_wc_result', // Triggered in handleExamFinish or closeExamResult if Phase.WC_EXAM ends
        title: 'NOIWC 文艺汇演与国家集训队答辩',
        description: '残酷的考试结束了。晚上是传统的 WC 文艺汇演，各省选手唱歌、跳舞，甚至还有女装表演。第二天，你还在现场观摩了激动人心的国家集训队答辩，国家队的四个名额就在神仙们的较量中诞生了。',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '在台下膜拜神仙（查看自己成绩）',
                action: (s) => {
                    const score = s.flags.wc_score || 0;
                    let msg = '';
                    if (score > 150) { msg = '你发挥极其出色，拿到了 WC 金牌！感觉距离上面的答辩席也不算太遥远了。'; }
                    else if (score > 80) { msg = '你稳扎稳打，拿到了一块银牌，可喜可贺。'; }
                    else { msg = '题目太难，打铁了。不过能亲眼见到这么多巨佬，已经值回票价了。'; }
                    return {
                        general: { ...s.general, mindset: s.general.mindset + 20, experience: s.general.experience + 30 },
                        log: [...s.log, { message: msg, type: score > 80 ? 'success' : 'warning', timestamp: Date.now() }]
                    };
                }
            }
        ]
    },

    // Provincial Events
    {
        id: 'oi_provincial_day1',
        title: '联合省选 Day 1',
        description: '赛前一天你去试机，遇到了许多在洛谷上神交已久的神犇。大家面基聊天，气氛看似轻松，实则暗流涌动。第一天的考试即将开始！',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '深呼吸，进入考场',
                action: (s) => ({ phase: Phase.PROVINCIAL_EXAM })
            }
        ]
    },
    {
        id: 'oi_provincial_result', 
        title: '联合省选 Day 2 与落幕',
        description: 'Day 2 更是折磨人的防AK场。两天的鏖战终于结束，各大省份的省队名额（省定分数线）有所不同，有的省份 180 分就能进，有的省份则卷到 250 分。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '查看省队名单',
                action: (s) => {
                    const score = s.flags.provincial_score || 0;
                    // Mock varying provincial boundaries. Higher score means much higher chance.
                    let madeTeam = false;
                    if (score > 230) madeTeam = true; // Guaranteed in almost all provinces
                    else if (score > 160) madeTeam = Math.random() < 0.6; // 60% chance for average provinces
                    else if (score > 100) madeTeam = Math.random() < 0.2; // 20% chance for weak provinces
                    
                    if (madeTeam) {
                        return {
                            flags: { ...s.flags, provincial_team: true },
                            general: { ...s.general, mindset: s.general.mindset + 50, experience: s.general.experience + 50 },
                            log: [...s.log, { message: "你成功卡线进入了省队（A/B类）！获得了参加 NOI 的门票！", type: 'success', timestamp: Date.now() }]
                        };
                    } else {
                        return {
                            general: { ...s.general, mindset: s.general.mindset - 40, efficiency: s.general.efficiency + 20 },
                            log: [...s.log, { message: `你的总分为 ${score}，遗憾未能达到本省的省队线，或者只拿到了买不到的 D 类... OI 生涯留下了遗憾。`, type: 'error', timestamp: Date.now() }]
                        };
                    }
                }
            }
        ]
    },

    // APIO Events
    {
        id: 'oi_apio_exam',
        title: 'APIO 线上测试',
        description: '比赛开始。题面全是英文，你需要一边翻译一边思考算法。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '开始答题',
                action: (s) => ({ phase: Phase.APIO_EXAM })
            }
        ]
    },
    {
        id: 'oi_apio_result',
        title: 'APIO 成绩公布',
        description: '作为一场国际赛事，虽然线上参赛没有线下那么隆重，但奖牌的含金量依然很高。',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '看看自己的排名',
                action: (s) => {
                    const score = s.flags.apio_score || 0;
                    let msg = '';
                    if (score > 200) { msg = '你在 APIO 中斩获金牌！'; }
                    else if (score > 100) { msg = '你在 APIO 中获得银牌！'; }
                    else { msg = '拿到了铜牌或优秀奖，再接再厉。'; }
                    return {
                        general: { ...s.general, experience: s.general.experience + 15 },
                        log: [...s.log, { message: msg, type: 'info', timestamp: Date.now() }]
                    };
                }
            }
        ]
    },

    // NOI Events
    {
        id: 'oi_noi_arrive',
        title: 'NOI 报到日：徽章交换',
        description: '你抵达了 NOI 举办学校。报到后最热闹的就是“徽章交换”环节。大家都拿着自己省或者学校的定制徽章到处面基换章。你不仅换到了一大堆徽章，还面基了以前只在网上膜拜过的神犇。',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '拿着徽章到处换章，扩列神犇！',
                action: (s) => ({
                    general: { ...s.general, romance: s.general.romance + 15, mindset: s.general.mindset + 30 },
                    eventQueue: [{...OI_EVENTS_POOL.find(e=>e.id==='oi_noi_exam_start')!}]
                })
            },
            {
                text: '社恐，躲在宿舍敲板子',
                action: (s) => ({
                    general: { ...s.general, efficiency: s.general.efficiency + 5 },
                    eventQueue: [{...OI_EVENTS_POOL.find(e=>e.id==='oi_noi_exam_start')!}]
                })
            }
        ]
    },
    {
        id: 'oi_noi_exam_start',
        title: 'NOI Day 1',
        description: 'NOI 比赛正式开始。今天的笔试满分拿下后，上机实战，周围全是键盘敲击的声音。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '全神贯注，开题！',
                action: (s) => ({ phase: Phase.NOI_EXAM })
            }
        ]
    },
    {
        id: 'oi_noi_social_practice',
        title: '社会实践日 & Day 2',
        description: '紧张的 Day 1 结束后，按照 NOI 惯例，中间有一天的“社会实践活动”。大家前往当地的博物馆或游乐园放松心情。第二天一早，又紧接着是决定命运的 Day 2 考试。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '随波逐流，完成 Day 2',
                action: (s) => {
                    // We only have one NOI exam phase in our game for simplicity, 
                    // so we represent Day 2 narratively.
                    return {
                        eventQueue: [{...OI_EVENTS_POOL.find(e=>e.id==='oi_noi_result')!}]
                    };
                }
            }
        ]
    },
    {
        id: 'oi_noi_result',
        title: 'NOI 颁奖典礼',
        description: '所有的比赛都结束了。闭幕式上，激动人心的时刻到来了。各大高校的招生办老师就在门外。前 50 名入选国家集训队。你的最终名次是...',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '查看奖牌',
                action: (s) => {
                    const score = s.flags.noi_score || 0;
                    let msg = '';
                    if (score >= 400) { 
                        msg = '你获得了 NOI 金牌！不仅保送清北，还成功入选了国家集训队（前50名）！'; 
                    } else if (score >= 250) { 
                        msg = '你获得了 NOI 银牌，顺利签下清北强基破格入围。'; 
                    } else { 
                        msg = '你获得了 NOI 铜牌。OI 生涯就此画上句号。'; 
                    }
                    return {
                        general: { ...s.general, mindset: s.general.mindset + 100 },
                        flags: { ...s.flags, noi_medal: score >= 400 ? 'GOLD' : (score >= 250 ? 'SILVER' : 'BRONZE') },
                        log: [...s.log, { message: msg, type: score >= 400 ? 'success' : 'info', timestamp: Date.now() }]
                    };
                }
            }
        ]
    }
];
