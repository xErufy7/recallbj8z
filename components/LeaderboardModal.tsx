
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getLeaderboard } from '../lib/supabase';
import { LeaderboardEntry, getUseNewDb, filterLeaderboardEntry } from '../lib/leaderboardConfig';

interface LeaderboardModalProps {
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
}

const PAGE_SIZE = 100;
const SUPABASE_BATCH = 100;

/** 本机玩家名（上传分数时记住的），用于高亮自己的成绩 */
const getMyName = () => {
    try { return (localStorage.getItem('bj8z_player_name') || '').trim(); } catch { return ''; }
};

function filterBatch(data: any[]): LeaderboardEntry[] {
    return data.filter(filterLeaderboardEntry);
}

const LeaderboardRow = React.memo(({ entry, idx, isMe, dateLabel }: { entry: LeaderboardEntry; idx: number; isMe: boolean; dateLabel: string }) => (
    <div className={`grid grid-cols-12 gap-2 py-3 hover:bg-white rounded-xl transition-colors text-sm border-b border-slate-100 last:border-0 group ${isMe ? 'bg-indigo-100/70 hover:bg-indigo-100' : ''}`}>
        <div className="col-span-1 text-center font-black text-slate-300 group-hover:text-indigo-500">
            {idx + 1}
        </div>
        <div className="col-span-7 md:col-span-3 text-center font-bold text-slate-700 truncate min-w-0">
            {entry.player_name}
            {isMe && <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-black align-middle">我</span>}
        </div>
        <div className="col-span-2 text-center font-mono font-bold text-indigo-600 text-xs md:text-sm">
            {Math.floor(entry.score)}
        </div>
        <div className="col-span-2 md:col-span-1 text-center text-xs text-slate-500 truncate min-w-0">
            <span className="px-1.5 md:px-2 py-0.5 bg-slate-200 rounded text-[9px] md:text-[10px]">{entry.details?.rank || 'B'}</span>
        </div>
        <div className="hidden md:block col-span-3 text-center truncate min-w-0">
            {entry.details?.title}
        </div>
        <div className="hidden md:block col-span-2 text-center text-xs text-slate-400 font-mono">
            {dateLabel}
        </div>
    </div>
));

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ flashTag, onClose }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useNewDb, setUseNew] = useState(() => getUseNewDb());
    const [hasMore, setHasMore] = useState(true);
    const [retryTick, setRetryTick] = useState(0);
    const offsetRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const [myName] = useState(getMyName);

    const doFetch = useCallback(async (fromOffset: number, targetCount: number) => {
        const result: LeaderboardEntry[] = [];
        let offset = fromOffset;
        let exhausted = false;

        while (result.length < targetCount) {
            const { data, error: fetchError } = await getLeaderboard(SUPABASE_BATCH, offset, useNewDb);
            if (fetchError) throw fetchError;
            if (!data || data.length === 0) { exhausted = true; break; }
            result.push(...filterBatch(data));
            offset += SUPABASE_BATCH;
            if (data.length < SUPABASE_BATCH) { exhausted = true; break; }
        }

        return { entries: result, newOffset: offset, exhausted };
    }, [useNewDb]);

    // initial load
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            setLoading(true);
            setError(null);
            setEntries([]);
            setHasMore(true);
            offsetRef.current = 0;

            try {
                const { entries: fresh, newOffset, exhausted } = await doFetch(0, PAGE_SIZE);
                if (cancelled) return;
                offsetRef.current = newOffset;
                setHasMore(!exhausted);
                setEntries(fresh);
            } catch (e: any) {
                if (cancelled) return;
                console.error("Leaderboard fetch error:", e);
                setError(e.message || "Failed to load");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        init();
        return () => { cancelled = true; };
    }, [useNewDb, doFetch, retryTick]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);

        try {
            const { entries: fresh, newOffset, exhausted } = await doFetch(offsetRef.current, PAGE_SIZE);
            offsetRef.current = newOffset;
            setHasMore(!exhausted);
            if (fresh.length > 0) {
                setEntries(prev => [...prev, ...fresh]);
            }
        } catch (e: any) {
            console.error("Load more error:", e);
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [useNewDb, doFetch]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && hasMore) {
            loadMore();
        }
    }, [loadMore, hasMore]);

    // 日期格式化预计算一次，避免每行每次渲染都构造 Date 对象
    const dateLabels = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const e of entries) map.set(e.id, new Date(e.created_at).toLocaleDateString());
        return map;
    }, [entries]);

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-4 md:p-8 max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h2 className="text-xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <i className="fas fa-trophy text-yellow-500"></i> 八中名人堂
                    </h2>
                    <button onClick={onClose} className={`px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-600 flex items-center gap-1.5 text-xs font-bold transition-colors ${flashTag === 'leaderboard-close' ? 'key-pressed' : ''}`}>
                        <i className="fas fa-times"></i> 关闭
                    </button>
                </div>

                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-12 gap-2 py-3 px-4 pr-[22px] border-b border-slate-200 bg-slate-100/50 text-xs font-bold text-slate-500 uppercase flex-shrink-0">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-7 md:col-span-3 text-center">玩家</div>
                        <div className="col-span-2 text-center">分数</div>
                        <div className="col-span-2 md:col-span-1 text-center">评级</div>
                        <div className="hidden md:block col-span-3 text-center">评价</div>
                        <div className="hidden md:block col-span-2 text-center">时间</div>
                    </div>
                    <div className="overflow-y-auto custom-scroll flex-1 px-4 py-2" onScroll={handleScroll}>
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-slate-400">
                                <i className="fas fa-spinner fa-spin text-2xl mr-2"></i> 加载中...
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-40 text-rose-500">
                                <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
                                <span>加载失败 ({error})</span>
                                <button onClick={() => setRetryTick(t => t + 1)} className="mt-3 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5">
                                    <i className="fas fa-rotate-right"></i> 重试
                                </button>
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <i className="fas fa-ghost text-3xl mb-2 opacity-50"></i>
                                <span>虚位以待</span>
                            </div>
                        ) : (
                            <>
                                {entries.map((entry, idx) => {
                                    const isMe = myName !== '' && entry.player_name.trim() === myName;
                                    return (
                                        <LeaderboardRow
                                            key={entry.id}
                                            entry={entry}
                                            idx={idx}
                                            isMe={isMe}
                                            dateLabel={dateLabels.get(entry.id) || ''}
                                        />
                                    );
                                })}
                                {(hasMore || loadingMore) && (
                                    <div className="flex items-center justify-center py-4 text-slate-400">
                                        <i className="fas fa-spinner fa-spin text-sm mr-2"></i> 加载中...
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
