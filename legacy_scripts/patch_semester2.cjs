const fs = require('fs');

const code = `
import { GameEvent, Phase } from '../types';

export const SEMESTER_2_EVENTS: GameEvent[] = [
    {
        id: 's2_spring_trip',
        title: '春游',
        description: '高一下半学期的春游开始了，这是一次放松的好机会。',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 12,
        choices: [
            { text: '开心玩耍', action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 30 }, flags: { ...s.flags, went_spring_trip: true } }) }
        ]
    },
    {
        id: 's2_debate_start',
        title: '辩论赛报名',
        description: '学校将举办辩论赛，每个班派队伍参加，16个班抽签对决。你要报名吗？',
        type: 'neutral',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 9,
        choices: [
            { text: '报名参加！', action: (s) => ({ flags: { ...s.flags, debate_joined: true, debate_stage: 16 } }) },
            { text: '没兴趣，去学习', action: (s) => ({ general: { ...s.general, efficiency: s.general.efficiency + 5 } }) }
        ]
    },
    {
        id: 's2_basketball_start',
        title: '篮球赛报名',
        description: '高一篮球联赛开始报名了，赛程和辩论赛类似，也是班级对抗。',
        type: 'neutral',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 5,
        choices: [
            { text: '上场比赛！', action: (s) => ({ flags: { ...s.flags, basketball_joined: true, basketball_stage: 16 } }) },
            { text: '做拉拉队', action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 5 } }) }
        ]
    },
    {
        id: 's2_drama_start',
        title: '英语戏剧节报名',
        description: '英语戏剧节开始筹备了。要在期末考完后表演，这是一个展示自我的好机会！',
        type: 'neutral',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 13,
        choices: [
            { text: '参与演出', action: (s) => ({ flags: { ...s.flags, drama_joined: true, drama_progress: 0 } }) },
            { text: '当个观众就好', action: (s) => ({}) }
        ]
    },
    
    // Changing Selection Conditional Event
    {
        id: 's2_change_subject_selection',
        title: '班主任的谈话',
        description: '期中考试结束了。班主任把你叫到办公室：“我看你这次期中考试有些选科成绩不太理想，你要不要考虑换一下选科？”',
        type: 'negative',
        once: true,
        triggerType: 'CONDITIONAL',
        condition: (s) => s.phase === Phase.SEMESTER_2 && s.week >= 11 && s.selectedSubjects.some(sub => s.subjects[sub].level < 40),
        choices: [
            { 
                text: '坚持原本的选择', 
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 5 } }) 
            },
            {
                text: '重新考虑选科',
                action: (s) => ({ phase: Phase.SUBJECT_RESELECTION, log: [...s.log, { message: "你决定重新考虑你的选科方向。", type: 'info', timestamp: Date.now() }] })
            }
        ]
    },

    // 6 Related events for Debate, Basketball, Spring Trip
    {
        id: 's2_debate_prep',
        title: '辩论赛准备',
        description: '下周就要打辩论赛了，你们队伍正在熬夜查资料写一辩稿。',
        type: 'neutral',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.debate_joined && s.week === 10,
        choices: [
            { text: '肝！', action: (s) => ({ general: { ...s.general, health: s.general.health - 5, experience: s.general.experience + 10 } }) }
        ]
    },
    {
        id: 's2_debate_match',
        title: '辩论赛比赛日',
        description: '比赛正式开始！对方辩友咄咄逼人，你站起来开始反击。',
        type: 'positive',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.debate_joined && s.week === 11,
        choices: [
            { 
                text: '逻辑碾压', 
                action: (s) => {
                    const win = Math.random() < 0.6;
                    return {
                        flags: { ...s.flags, debate_stage: win ? 8 : 0 },
                        general: { ...s.general, mindset: s.general.mindset + (win ? 15 : -5) },
                        log: [...s.log, { message: win ? '你们赢得了比赛，晋级8强！' : '你们遗憾落败，止步16强。', type: win ? 'success' : 'warning', timestamp: Date.now() }]
                    }
                }
            }
        ]
    },
    {
        id: 's2_basketball_training',
        title: '篮球赛训练',
        description: '为了班级的荣誉，你每天放学后都在操场上练习投篮。',
        type: 'neutral',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.basketball_joined && s.week === 6,
        choices: [
            { text: '挥洒汗水', action: (s) => ({ general: { ...s.general, health: s.general.health + 5, experience: s.general.experience + 5 } }) }
        ]
    },
    {
        id: 's2_basketball_match',
        title: '篮球联赛进行中',
        description: '今天是你们班的淘汰赛。比分非常焦灼，到了最后一节。',
        type: 'positive',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.basketball_joined && s.week === 7,
        choices: [
            { 
                text: '全力拼搏！', 
                action: (s) => {
                    const win = Math.random() < 0.5 + (s.general.health - 50) / 200;
                    return {
                        flags: { ...s.flags, basketball_stage: win ? 8 : 0 },
                        general: { ...s.general, health: s.general.health - 5, mindset: s.general.mindset + (win ? 20 : -10) },
                        log: [...s.log, { message: win ? '你投进了关键球，球队晋级8强！' : '体能不支，球队遗憾被淘汰。', type: win ? 'success' : 'error', timestamp: Date.now() }]
                    }
                }
            }
        ]
    },
    {
        id: 's2_spring_trip_photo',
        title: '春游合照',
        description: '春游进行到一半，大家提议在风景最好的地方拍一张大合照。',
        type: 'positive',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.went_spring_trip && s.week === 12,
        choices: [
            { text: '找个好位置', action: (s) => ({ general: { ...s.general, romance: s.general.romance + 5, mindset: s.general.mindset + 5 } }) }
        ]
    },
    {
        id: 's2_spring_trip_lost',
        title: '春游小插曲',
        description: '在自由活动时间，你为了买特色纪念品，和同学们走散了。',
        type: 'neutral',
        triggerType: 'CONDITIONAL',
        once: true,
        condition: (s) => s.phase === Phase.SEMESTER_2 && !!s.flags.went_spring_trip && s.week === 12,
        choices: [
            { text: '赶紧联系班长', action: (s) => ({ general: { ...s.general, experience: s.general.experience + 5 } }) }
        ]
    }
];

export const WINTER_BREAK_EVENTS: GameEvent[] = [
    {
        id: 'wb_new_year',
        title: '除夕夜',
        description: '今天是除夕，外面鞭炮齐鸣，家里热热闹闹的。',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 3,
        choices: [
            { text: '吃年夜饭，收压岁钱！', action: (s) => ({ general: { ...s.general, money: s.general.money + 1000, mindset: s.general.mindset + 20 } }) }
        ]
    }
];
`

fs.writeFileSync('/app/applet/data/events_semester2.ts', code);
