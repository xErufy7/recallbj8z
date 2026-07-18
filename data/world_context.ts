import { CharacterTemplate } from '../types';

export const WORLD_REGIONS = [
    { id: 'beijing', code: 'bj', name: '北京', type: 'tier1' },
    { id: 'chengdu', code: 'cd', name: '成都', type: 'tier1' },
    { id: 'chongqing', code: 'cq', name: '重庆', type: 'tier1' },
    { id: 'changsha', code: 'cs', name: '长沙', type: 'tier2' },
    { id: 'fuzhou', code: 'fz', name: '福州', type: 'tier2' },
    { id: 'guiyang', code: 'gy', name: '贵阳', type: 'tier2' },
    { id: 'guangzhou', code: 'gz', name: '广州', type: 'tier1' },
    { id: 'harbin', code: 'heb', name: '哈尔滨', type: 'tier2' },
    { id: 'hangzhou', code: 'hz', name: '杭州', type: 'tier1' },
    { id: 'kunming', code: 'km', name: '昆明', type: 'tier2' },
    { id: 'lanzhou', code: 'lz', name: '兰州', type: 'tier2' },
    { id: 'nanjing', code: 'nj', name: '南京', type: 'tier1' },
    { id: 'qingdao', code: 'qd', name: '青岛', type: 'tier2' },
    { id: 'shanghai', code: 'sh', name: '上海', type: 'tier1' },
    { id: 'shenzhen', code: 'sz', name: '深圳', type: 'tier1' },
    { id: 'tianjin', code: 'tj', name: '天津', type: 'tier1' },
    { id: 'wuhan', code: 'wh', name: '武汉', type: 'tier1' },
    { id: 'xian', code: 'xa', name: '西安', type: 'tier1' },
    { id: 'xiamen', code: 'xm', name: '厦门', type: 'tier2' },
    { id: 'zhengzhou', code: 'zz', name: '郑州', type: 'tier2' }
];

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
    { id: 't_ordinary', name: '普通学生', description: '平平无奇，但贵在真实。', baseStatsModifier: {} },
    { id: 't_hardworker', name: '卷王潜质', description: '天生热爱学习，效率高。', baseStatsModifier: { efficiency: 3, mindset: 5 } },
    { id: 't_dreamer', name: '空想家', description: '脑洞很大，但是不爱动手。', baseStatsModifier: { efficiency: -2, luck: 10, experience: 5 } },
    { id: 't_fragile', name: '脆皮', description: '容易生病。', baseStatsModifier: { health: -15 } },
    { id: 't_social', name: '社牛', description: '在哪都能交到朋友。', baseStatsModifier: { romance: 10, mindset: 5 } },
    { id: 't_nerd', name: '极客', description: '对电子产品和数字敏感。', baseStatsModifier: { experience: 10, romance: -5 } }
];

export const getRandomWorldContext = () => {
    const startYear = Math.floor(Math.random() * (2024 - 2016 + 1)) + 2016;
    const region = WORLD_REGIONS[Math.floor(Math.random() * WORLD_REGIONS.length)];
    const template = CHARACTER_TEMPLATES[Math.floor(Math.random() * CHARACTER_TEMPLATES.length)];
    return {
        region: region.name,
        code: region.code,
        yearStart: startYear,
        yearEnd: startYear + 3,
        characterTemplateId: template.id
    };
};
