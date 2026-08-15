// 排行榜轻量配置：不依赖 @supabase/supabase-js，可被首屏组件（HomeView）安全引用。
// 重客户端（lib/supabase.ts）在真正调用上传/查询时才动态加载，避免打进首屏包。

const STORAGE_KEY = 'bj8z_use_new_leaderboard';

export const getUseNewDb = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setUseNewDb = (useNew: boolean) => {
  localStorage.setItem(STORAGE_KEY, String(useNew));
};

export interface LeaderboardEntry {
    id: string;
    created_at: string;
    player_name: string;
    score: number;
    difficulty: string;
    details: {
        title: string;
        rank: string;
    };
}

// 白名单 = 游戏真实产出的评级/称号全集（getEndingData），防止测试页灌入的垃圾数据上榜
export const ALLOWED_RANKS = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'Z', 'F'];
export const ALLOWED_TITLES = [
    '清北保送生（国集）', '强基破格入围者', '省队巨佬', '年级学神',
    '尖子生', '中流砥柱', '芸芸众生', '学业危机', '家里蹲预备役', '退学离场'
];
export const MAX_LEADERBOARD_SCORE = 10000;

export const filterLeaderboardEntry = (e: any): boolean =>
    !e.challenge_id && // 挑战榜（负债王/睡觉王）已废弃，旧数据不再展示
    ALLOWED_RANKS.includes(e.details?.rank) &&
    ALLOWED_TITLES.includes(e.details?.title) &&
    e.score <= MAX_LEADERBOARD_SCORE;
