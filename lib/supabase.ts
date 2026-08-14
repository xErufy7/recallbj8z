
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 旧排行榜
const OLD_URL = 'https://qmgfcirrgwzcmmyjnecn.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZ2ZjaXJyZ3d6Y21teWpuZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzY2NzQsImV4cCI6MjA4MzYxMjY3NH0.CU4roI0pWPHARNydPu_EeUBoz7G2dtxhw9InUFSBZ80';

// 新排行榜
const NEW_URL = 'https://mcjyuveyfgefdtyavygj.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1janl1dmV5ZmdlZmR0eWF2eWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjQyMjAsImV4cCI6MjA5NTI0MDIyMH0.-ZCKodHMGKUHLNURxm0ACp7wGhTPb4cPHTBHx07Wihc';

const STORAGE_KEY = 'bj8z_use_new_leaderboard';

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

const getClient = (useNew: boolean): SupabaseClient => useNew ? newClient : oldClient;

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
    challenge_id: string | null;
    difficulty: string;
    details: {
        title: string;
        rank: string;
    };
}

export const uploadScore = async (entry: Omit<LeaderboardEntry, 'id' | 'created_at'>, useNew: boolean) => {
    return await getClient(useNew).from('leaderboard').insert([entry]);
};

export const getLeaderboard = async (challengeId: string | null = null, limit = 50, offset = 0, useNew = false) => {
    const client = getClient(useNew);
    let query = client
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

    if (challengeId) {
        query = query.eq('challenge_id', challengeId);
    }

    return await query;
};

// 白名单 = 游戏真实产出的评级/称号全集（getEndingData），防止测试页灌入的垃圾数据上榜
export const ALLOWED_RANKS = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'Z', 'F'];
export const ALLOWED_TITLES = [
    '清北保送生（国集）', '强基破格入围者', '省队巨佬', '年级学神',
    '尖子生', '中流砥柱', '芸芸众生', '学业危机', '家里蹲预备役', '退学离场'
];
export const MAX_LEADERBOARD_SCORE = 10000;

export const filterLeaderboardEntry = (e: any): boolean =>
    ALLOWED_RANKS.includes(e.details?.rank) &&
    ALLOWED_TITLES.includes(e.details?.title) &&
    e.score <= MAX_LEADERBOARD_SCORE;
