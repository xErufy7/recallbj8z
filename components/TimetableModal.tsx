import React, { useState, useEffect } from 'react';
import { GameState, WeekendActivity } from '../types';
import { WEEKEND_ACTIVITIES } from '../data/mechanics';
import { SCHEDULE_SLOTS, TimeSlotId, BLOCKED_SLOTS_MAP } from '../data/timetable';

interface Props {
    state: GameState;
    onConfirm: (schedule: Record<string, string>) => void;
}

const TimetableModal: React.FC<Props> = ({ state, onConfirm }) => {
    // Initialize with last week's schedule

    const availableActivities = WEEKEND_ACTIVITIES.filter(a => {
        if (state.availableWeekendActivityIds && state.availableWeekendActivityIds.length > 0) {
            return state.availableWeekendActivityIds.includes(a.id) && (!a.condition || a.condition(state));
        }
        return !a.condition || a.condition(state);
    });

    const [schedule, setSchedule] = useState<Record<string, string>>(() => {
        const last = state.lastWeekSchedule || {};
        const valid: Record<string, string> = {};
        for (const [slot, actId] of Object.entries(last)) {
            if (availableActivities.find(a => a.id === actId)) {
                valid[slot] = actId as string;
            }
        }
        return valid;
    });

    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const handleSlotClick = (slotId: string) => {
        // If blocked, ignore
        if (isSlotBlocked(slotId)) return;
        setSelectedSlot(selectedSlot === slotId ? null : slotId);
    };

    const handleActivitySelect = (actId: string) => {
        if (selectedSlot) {
            const newSchedule = { ...schedule, [selectedSlot]: actId };
            setSchedule(newSchedule);
            setSelectedSlot(null);
        }
    };

    const handleClearSlot = (slotId: string) => {
        const newSchedule = { ...schedule };
        delete newSchedule[slotId];
        setSchedule(newSchedule);
    }

    const isSlotBlocked = (slotId: string) => {
        // Evening Study Lock
        if (state.flags.joined_evening_study) {
            const slotObj = SCHEDULE_SLOTS.find(s => s.id === slotId);
            if (slotObj && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(slotObj.day)) {
                return true;
            }
        }
        // Check if any scheduled activity blocks this slot
        for (const [sId, _actId] of Object.entries(schedule || {})) {
            const actId = _actId as string;
            if (BLOCKED_SLOTS_MAP[actId] && BLOCKED_SLOTS_MAP[actId].includes(slotId as TimeSlotId)) {
                return true;
            }
        }
        return false;
    };

    const getBlocker = (slotId: string) => {
        if (state.flags.joined_evening_study) {
            const slotObj = SCHEDULE_SLOTS.find(s => s.id === slotId);
            if (slotObj && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(slotObj.day)) {
                return '晚自习';
            }
        }
        for (const [sId, _actId] of Object.entries(schedule)) {
            const actId = _actId as string;
            if (BLOCKED_SLOTS_MAP[actId] && BLOCKED_SLOTS_MAP[actId].includes(slotId as TimeSlotId)) {
                return availableActivities.find(a => a.id === actId)?.name;
            }
        }
        return null;
    };

    return (
        <div className="absolute inset-0 z-[60] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-fadeIn">
            <div className="bg-slate-50 rounded-[24px] md:rounded-[32px] max-w-6xl w-full h-[95vh] md:h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">
                {/* Left: Timetable Grid */}
                <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto custom-scroll md:border-r border-b md:border-b-0 border-slate-200 bg-white">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-1 md:mb-2">周计划时间表</h2>
                    <p className="text-xs md:text-sm text-slate-500 mb-3 md:mb-6">规划你放学后和周末的时间。合理安排，劳逸结合。</p>
                    
                    <div className="grid grid-cols-1 gap-2 md:gap-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="flex flex-col gap-1 md:gap-2 p-2 md:p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h3 className="font-bold text-slate-700 text-sm md:text-base">{day}</h3>
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                    {SCHEDULE_SLOTS.filter(s => s.day === day).map(slot => {
                                        const isBlocked = isSlotBlocked(slot.id);
                                        const blocker = getBlocker(slot.id);
                                        const actId = schedule[slot.id];
                                        const act = availableActivities.find(a => a.id === actId);
                                        const isSelected = selectedSlot === slot.id;
                                        
                                        return (
                                            <div 
                                                key={slot.id} 
                                                onClick={() => handleSlotClick(slot.id)}
                                                className={`relative flex flex-col p-2 md:p-3 border-2 rounded-xl cursor-pointer transition-all w-24 md:w-32 h-16 md:h-20 ${
                                                    isBlocked ? 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed' :
                                                    isSelected ? 'border-indigo-500 bg-indigo-50' : 
                                                    act ? 'border-blue-300 bg-blue-50 hover:border-blue-400' : 
                                                    'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 mb-0.5 md:mb-1">{slot.label}</span>
                                                {isBlocked ? (
                                                    <span className="text-[10px] md:text-xs text-rose-500 font-bold leading-tight">被占用 ({blocker})</span>
                                                ) : act ? (
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] md:text-xs font-bold text-blue-800 leading-tight">{act.name}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleClearSlot(slot.id); }}
                                                            className="text-slate-400 hover:text-rose-500"
                                                        ><i className="fas fa-times-circle"></i></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] md:text-xs text-slate-300 font-bold">空闲</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Activity Selection */}
                <div className="w-full md:w-80 bg-slate-100 p-4 md:p-6 flex flex-col min-h-[200px] md:h-full shrink-0">
                    {selectedSlot ? (
                        <>
                            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-4">选择活动 <span className="text-xs md:text-sm font-normal text-slate-500">({SCHEDULE_SLOTS.find(s=>s.id === selectedSlot)?.label})</span></h3>
                            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 md:pr-2 max-h-[30vh] md:max-h-none">
                                <div 
                                    onClick={() => {
                                        const newS = {...schedule};
                                        delete newS[selectedSlot];
                                        setSchedule(newS);
                                        setSelectedSlot(null);
                                    }}
                                    className="p-2 md:p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all text-center text-slate-500 font-bold text-sm"
                                >
                                    清空此时间段
                                </div>
                                {availableActivities.map(act => {
                                    const MAX_SLOTS: Record<string, number> = { 'act_cf': 1, 'w_cf': 1, 'w_atc': 1, 'w_game_late': 1, 'w_game': 2 };
                                    const maxSlots = MAX_SLOTS[act.id] || 3;
                                    const currentCount = Object.values(schedule).filter(v => v === act.id).length;
                                    
                                    const allowedSlots: Record<string, string[]> = { 'act_cf': ['Sat_Night'] };
                                    const isAllowedSlot = !allowedSlots[act.id] || allowedSlots[act.id].includes(selectedSlot as string);
                                    
                                    const isAtLimit = currentCount >= maxSlots || !isAllowedSlot;
                                    
                                    return (
                                    <div 
                                        key={act.id}
                                        onClick={() => !isAtLimit && handleActivitySelect(act.id)}
                                        className={`p-3 md:p-4 bg-white border rounded-xl transition-all group ${
                                            isAtLimit 
                                                ? 'border-slate-100 opacity-40 cursor-not-allowed' 
                                                : 'border-slate-200 cursor-pointer hover:border-indigo-500 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                                            <i className={`fas ${act.icon} text-indigo-500 group-hover:scale-110 transition-transform`}></i>
                                            <span className="font-bold text-slate-800 text-sm md:text-base">{act.name}</span>
                                            {currentCount > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{currentCount}/{maxSlots}</span>}
                                            {!isAllowedSlot && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">时间不符</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{act.description}</p>
                                    </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-4 md:py-0">
                            <i className="fas fa-hand-pointer text-3xl md:text-4xl mb-3 md:mb-4 opacity-50"></i>
                            <p className="font-bold text-sm md:text-base">点击上方的时间段<br/>安排活动</p>
                        </div>
                    )}
                    {state.isWeekend ? (
                    <button 
                        onClick={() => onConfirm(schedule)}
                        className="w-full mt-4 md:mt-6 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base md:text-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                    >
                        执行本周计划 <i className="fas fa-play ml-2"></i>
                    </button>
                ) : (
                    <button 
                        onClick={() => onConfirm(schedule)}
                        className="w-full mt-4 md:mt-6 py-3 md:py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-2xl font-black text-base md:text-lg shadow-lg transition-all active:scale-95"
                    >
                        关闭 <i className="fas fa-times ml-2"></i>
                    </button>
                )}
                </div>
            </div>
        </div>
    );
};

export default TimetableModal;
