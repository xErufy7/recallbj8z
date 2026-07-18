const fs = require('fs');

const code = `
import oiEventsData from '../oi_events.json';
import { GameEvent, GameState, OIStats } from '../types';

export const modifyOI = (state: GameState, changes: Partial<OIStats>): OIStats => {
    const current = state.oiStats || { dp: 0, ds: 0, graph: 0, string: 0, math: 0, misc: 0, rating: 1200 };
    return {
        dp: Math.max(0, current.dp + (changes.dp || 0)),
        ds: Math.max(0, current.ds + (changes.ds || 0)),
        graph: Math.max(0, current.graph + (changes.graph || 0)),
        string: Math.max(0, current.string + (changes.string || 0)),
        math: Math.max(0, current.math + (changes.math || 0)),
        misc: Math.max(0, current.misc + (changes.misc || 0)),
        rating: Math.max(0, current.rating + (changes.rating || 0))
    };
};

const parsedOiEvents: GameEvent[] = (oiEventsData as any[]).map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    choices: e.choices.map((c: any) => ({
        text: c.text,
        action: (s: GameState) => {
            const nextGen = { ...s.general };
            let bonusOI: Partial<OIStats> = {};
            if (c.effect) {
                if (c.effect.efficiency) nextGen.efficiency = Math.min(100, Math.max(0, nextGen.efficiency + c.effect.efficiency));
                if (c.effect.health) nextGen.health = Math.min(100, Math.max(0, nextGen.health + c.effect.health));
                if (c.effect.mindset) nextGen.mindset = Math.min(100, Math.max(0, nextGen.mindset + c.effect.mindset));
                if (c.effect.experience) nextGen.experience = Math.min(999, Math.max(0, nextGen.experience + c.effect.experience));
                if (c.effect.luck) nextGen.luck = Math.min(100, Math.max(0, nextGen.luck + c.effect.luck));
                if (c.effect.money) nextGen.money = Math.max(0, nextGen.money + c.effect.money);
                if (c.effect.romance) nextGen.romance = Math.min(100, Math.max(0, nextGen.romance + c.effect.romance));
                
                if (c.effect.oi_dp) bonusOI.dp = c.effect.oi_dp;
                if (c.effect.oi_ds) bonusOI.ds = c.effect.oi_ds;
                if (c.effect.oi_graph) bonusOI.graph = c.effect.oi_graph;
                if (c.effect.oi_string) bonusOI.string = c.effect.oi_string;
                if (c.effect.oi_math) bonusOI.math = c.effect.oi_math;
                if (c.effect.oi_misc) bonusOI.misc = c.effect.oi_misc;
            }
            return {
                general: nextGen,
                oiStats: modifyOI(s, bonusOI),
                log: c.resultDescription ? [...s.log, { message: c.resultDescription, type: 'info', timestamp: Date.now() }] : s.log
            };
        }
    }))
}));

export const generateOIRandomEvent = (state: GameState): GameEvent => {
    // Filter by rating and phase if we want, or just pick random
    const pool = parsedOiEvents.filter(e => {
        const raw = oiEventsData.find((d: any) => d.id === e.id) as any;
        if (!raw) return false;
        if (raw.cfRatingMin && state.oiStats.rating < raw.cfRatingMin) return false;
        if (raw.cfRatingMax && state.oiStats.rating > raw.cfRatingMax) return false;
        return true;
    });
    if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)];
    }
    // Fallback
    return parsedOiEvents[0];
};

`;

let orig = fs.readFileSync('/app/applet/data/event_generators.ts', 'utf8');
orig = orig.replace(/export const modifyOI = [\s\S]*?(?=export const generateOIEvent)/, '');

fs.writeFileSync('/app/applet/data/event_generators.ts', code + '\n' + orig);
