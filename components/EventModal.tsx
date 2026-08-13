
import React from 'react';
import { GameEvent, EventChoice, GameState } from '../types';

interface EventModalProps {
    event: GameEvent;
    state: GameState;
    eventResult: { choice: EventChoice, diff: string[] } | null;
    onChoice: (choice: EventChoice, e: React.MouseEvent) => void;
    onConfirm: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, state, eventResult, onChoice, onConfirm }) => {
    // Filter choices: Show if no condition OR condition is met
    const visibleChoices = event.choices?.filter(c => !c.condition || c.condition(state)) || [];

    return (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-20 animate-fadeIn">
               <div
                  key={event.id + (eventResult ? '-result' : '')}
                  className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl max-w-xl w-full border border-white/50 max-h-[85vh] overflow-hidden flex flex-col animate-popIn"
               >
                  <div className="p-6 md:p-10 overflow-y-auto custom-scroll flex-1 min-h-0">
                  {!eventResult ? (
                    <div className="animate-fadeUp" style={{ animationDelay: '0.1s' }}>
                      <div className="flex justify-between items-start mb-6">
                          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{event.title}</h2>
                          {state.eventQueue.length > 0 && <span className="bg-rose-100/80 backdrop-blur text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">+{state.eventQueue.length} 更多</span>}
                      </div>
                      <p className="text-slate-700 mb-8 text-base md:text-lg leading-relaxed font-medium">
                          {typeof event.description === 'function'
                            ? event.description(state)
                            : event.description}
                      </p>
                      <div className="space-y-3">
                         {visibleChoices.map((c, i) => (
                           <button
                             key={i} onClick={(e: any) => onChoice(c, e)}
                             className={`w-full text-left p-4 rounded-2xl border transition-all font-bold group flex justify-between items-center shadow-sm hover:scale-[1.02] active:scale-[0.98] ${c.text.includes('【睡神】') ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-200/50 hover:shadow-lg' : 'bg-white/60 border-white/50 text-slate-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-indigo-200/50 hover:shadow-lg'}`}
                           >
                              {c.text}
                              <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></i>
                           </button>
                         ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 animate-popIn">
                      <div
                        className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border-4 border-white animate-checkIn"
                      >
                        <i className="fas fa-check"></i>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 mb-2 italic">"{eventResult.choice.text}"</h2>
                      {eventResult.diff.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-6 mt-4">
                           {eventResult.diff.map((d, i) => (
                             <span
                               key={i} style={{ animationDelay: `${i * 0.1}s` }}
                               className={`px-4 py-2 rounded-full text-xs font-black shadow-sm animate-fadeUp ${d.includes('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : d.includes('-') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
                             >
                               {d}
                             </span>
                           ))}
                        </div>
                      )}
                      <button
                        onClick={onConfirm} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.95]"
                      >
                           {(state.chainedEvent || eventResult.choice.nextEventId) ? '继续...' : '确认结果'} <i className="fas fa-arrow-right text-slate-400"></i>
                      </button>
                    </div>
                  )}
                  </div>
               </div>
            </div>
    );
};
export default EventModal;
