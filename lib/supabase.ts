
import type { SupabaseClient } from '@supabase/supabase-js'

export * from './leaderboardConfig';

// 旧排行榜
const OLD_URL = 'https://qmgfcirrgwzcmmyjnecn.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZ2ZjaXJyZ3d6Y21teWpuZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzY2NzQsImV4cCI6MjA4MzYxMjY3NH0.CU4roI0pWPHARNydPu_EeUBoz7G2dtxhw9InUFSBZ80';

// 新排行榜
const NEW_URL = 'https://mcjyuveyfgefdtyavygj.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1janl1dmV5ZmdlZmR0eWF2eWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjQyMjAsImV4cCI6MjA5NTI0MDIyMH0.-ZCKodHMGKUHLNURxm0ACp7wGhTPb4cPHTBHx07Wihc';

// 重客户端懒加载：supabase-js（~220KB）只在真正上传/查询成绩时才下载
let clientsPromise: Promise<{ oldClient: SupabaseClient; newClient: SupabaseClient }> | null = null;

const getClients = (): Promise<{ oldClient: SupabaseClient; newClient: SupabaseClient }> => {
    if (!clientsPromise) {
        clientsPromise = import('@supabase/supabase-js').then(({ createClient }) => ({
            oldClient: createClient(OLD_URL, OLD_KEY),
            newClient: createClient(NEW_URL, NEW_KEY)
        }));
    }
    return clientsPromise;
};

export const uploadScore = async (entry: { player_name: string; score: number; difficulty: string; details: { title: string; rank: string } }, useNew: boolean) => {
    const { oldClient, newClient } = await getClients();
    const client = useNew ? newClient : oldClient;
    return await client.from('leaderboard').insert([entry]);
};

export const getLeaderboard = async (limit = 50, offset = 0, useNew = false) => {
    const { oldClient, newClient } = await getClients();
    const client = useNew ? newClient : oldClient;
    return await client
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);
};
