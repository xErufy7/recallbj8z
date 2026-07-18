import React, { useEffect, useState } from 'react';
import { GameEvent } from '../types';

interface Props {
    events: GameEvent[];
    onEventClick: (event: GameEvent) => void;
    onAnimationEnd: (id: string) => void;
}

const HistoricalTicker: React.FC<Props> = ({ events, onEventClick, onAnimationEnd }) => {
    if (events.length === 0) return null;
    return (
        <div className="absolute top-20 left-0 right-0 z-[60] pointer-events-none overflow-hidden h-24">
            {events.map((e, i) => (
                <div 
                    key={e.id}
                    className="absolute whitespace-nowrap bg-white/90 backdrop-blur-sm border border-orange-200 px-6 py-2 rounded-full shadow-lg shadow-orange-500/20 text-orange-800 font-bold cursor-pointer hover:scale-105 transition-transform pointer-events-auto"
                    style={{
                        animation: `slideLeft 20s linear forwards`,
                        top: `${(i % 3) * 40}px`
                    }}
                    onClick={() => onEventClick(e)}
                    onAnimationEnd={() => onAnimationEnd(e.id)}
                >
                    <span className="mr-2 text-xl">📰</span> {e.title}
                </div>
            ))}
            <style>{`
                @keyframes slideLeft {
                    from { transform: translateX(100vw); }
                    to { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};

export default HistoricalTicker;
