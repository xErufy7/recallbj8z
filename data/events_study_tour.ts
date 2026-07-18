import { GameEvent, Phase } from '../types';

export const STUDY_TOUR_EVENTS: GameEvent[] = [
    {
        id: 's2_study_tour_start',
        title: '高一研学旅行！',
        description: '6月5日，期末考试前的一次大放松。全年级的大巴车浩浩荡荡地开出校门，目的地是邻省的科技城。',
        type: 'positive',
        once: true,
        triggerType: 'FIXED',
        fixedWeek: 17, // Approximating June 5th
        condition: (s) => s.phase === Phase.SEMESTER_2,
        choices: [
            { 
                text: '和死党坐一起打游戏', 
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 10, luck: s.general.luck + 2 } }),
                nextEventId: 's2_study_tour_bus'
            },
            { 
                text: '戴上耳机补觉', 
                action: (s) => ({ general: { ...s.general, health: s.general.health + 10 } }),
                nextEventId: 's2_study_tour_bus'
            }
        ]
    },
    {
        id: 's2_study_tour_bus',
        title: '大巴车上的风波',
        description: '车程有5个小时。突然，班主任拿着麦克风站了起来：“同学们，漫漫长路，我们来拉歌吧！”',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '主动上去唱一首',
                action: (s) => ({ general: { ...s.general, romance: s.general.romance + 5, mindset: s.general.mindset + 5 } }),
                nextEventId: 's2_study_tour_day1'
            },
            {
                text: '在下面鼓掌摸鱼',
                action: (s) => ({ general: { ...s.general, efficiency: s.general.efficiency + 2 } }),
                nextEventId: 's2_study_tour_day1'
            }
        ]
    },
    {
        id: 's2_study_tour_day1',
        title: '研学Day 1：高新科技园',
        description: '第一站来到了著名的AI创新园区，展厅里全是各种尖端机器人和自动驾驶模型。',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '认真听讲解员介绍技术原理',
                action: (s) => ({ general: { ...s.general, experience: s.general.experience + 15 } }),
                nextEventId: 's2_study_tour_hotel'
            },
            {
                text: '偷偷去旁边的纪念品商店',
                action: (s) => ({ general: { ...s.general, money: s.general.money - 30, luck: s.general.luck + 5 } }),
                nextEventId: 's2_study_tour_hotel'
            }
        ]
    },
    {
        id: 's2_study_tour_hotel',
        title: '研学之夜：酒店风云',
        description: '晚上入住了青年旅社，四人一间。大家洗漱完后，兴奋地睡不着觉。',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '通宵打牌/狼人杀！',
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 20, health: s.general.health - 15 } }),
                nextEventId: 's2_study_tour_day2'
            },
            {
                text: '早点休息，明天还要走一天',
                action: (s) => ({ general: { ...s.general, health: s.general.health + 10 } }),
                nextEventId: 's2_study_tour_day2'
            },
            {
                text: '偷偷溜去其他宿舍串门',
                action: (s) => ({ general: { ...s.general, romance: s.general.romance + 5, mindset: s.general.mindset + 10 } }),
                nextEventId: 's2_study_tour_day2'
            }
        ]
    },
    {
        id: 's2_study_tour_day2',
        title: '研学Day 2：知名学府',
        description: '第二天，行程安排参观了顶尖大学的校园，古朴的建筑和浓厚的学术氛围让人心生向往。',
        type: 'positive',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '在校门前合影，立下目标',
                action: (s) => ({ general: { ...s.general, efficiency: s.general.efficiency + 5, experience: s.general.experience + 5 } }),
                nextEventId: 's2_study_tour_end'
            },
            {
                text: '去大学食堂体验美食',
                action: (s) => ({ general: { ...s.general, health: s.general.health + 5, mindset: s.general.mindset + 5, money: s.general.money - 20 } }),
                nextEventId: 's2_study_tour_end'
            }
        ]
    },
    {
        id: 's2_study_tour_end',
        title: '研学结束，回归现实',
        description: '为期两天的研学旅行结束了。大巴车驶回八中校园，刚下车，班主任就在校门口微笑着说：“同学们，收收心，马上期末考试了。”',
        type: 'neutral',
        triggerType: 'CHAINED',
        choices: [
            {
                text: '心肺停止',
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset - 15, efficiency: s.general.efficiency + 10 } })
            },
            {
                text: '我已经准备好了！',
                action: (s) => ({ general: { ...s.general, mindset: s.general.mindset + 5, experience: s.general.experience + 5 } })
            }
        ]
    }
];
