
import { GameState, GameEvent } from '../../types';
import { generateBatchGameEvents } from '../../lib/api';
import { mapAiEventToGameEvent } from '../../data/utils';

/** 拉取 AI 生成的本周事件并转成 GameEvent（失败时 api.ts 会返回「灵感枯竭」兜底事件） */
export const fetchAiEvents = async (state: GameState): Promise<GameEvent[]> => {
    const aiEventsJson = await generateBatchGameEvents(state);
    return aiEventsJson.map(mapAiEventToGameEvent).filter((e: GameEvent) => e.choices && e.choices.length > 0);
};
