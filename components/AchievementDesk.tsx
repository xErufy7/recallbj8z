import React from 'react';

interface AchievementDeskProps {
    unlockedAchievements: string[];
}

const AchievementDesk: React.FC<AchievementDeskProps> = ({ unlockedAchievements }) => {
    // Defines which achievements unlock which desk props
    const propsMap = [
        {
            id: 'first_blood', // Generic first play
            icon: 'fa-pencil-alt',
            color: 'text-amber-700',
            bg: 'bg-amber-100',
            label: '旧水笔',
            position: 'top-10 left-10 rotate-12'
        },
        {
            id: 'top_rank', // Was achv_debater, changed to top_rank to represent good academic
            icon: 'fa-microphone-alt',
            color: 'text-slate-700',
            bg: 'bg-slate-200',
            label: '最佳辩手奖杯',
            position: 'top-4 right-12 -rotate-12'
        },
        {
            id: 'oi_god',
            icon: 'fa-medal',
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            label: 'OI金牌',
            position: 'bottom-12 right-20 rotate-6'
        },
        {
            id: 'romance_master',
            icon: 'fa-envelope-open-text',
            color: 'text-pink-500',
            bg: 'bg-pink-100',
            label: '粉色情书',
            position: 'bottom-8 left-1/4 -rotate-6'
        },
        {
            id: 'survival', // Hard difficulty clear
            icon: 'fa-keyboard',
            color: 'text-slate-400',
            bg: 'bg-slate-800',
            label: '敲坏的键盘',
            position: 'top-1/2 left-20 rotate-3'
        },
        {
            id: 'nerd', // Study focused
            icon: 'fa-book',
            color: 'text-blue-700',
            bg: 'bg-blue-100',
            label: '算法导论',
            position: 'bottom-20 right-1/4 -rotate-12'
        }
    ];

    const activeProps = propsMap.filter(p => unlockedAchievements.includes(p.id));

    return (
        <div className="w-full mt-6 bg-amber-900/10 rounded-[2.5rem] p-6 relative overflow-hidden border border-amber-900/5 h-64 md:h-48 flex items-center justify-center shadow-inner">
            {/* Desk Wood Texture Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-700/10 to-amber-900/20 mix-blend-multiply"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            
            <div className="z-10 text-center opacity-40 pointer-events-none">
                <i className="fas fa-box-open text-4xl mb-2 text-amber-900"></i>
                <div className="text-xs font-black uppercase tracking-widest text-amber-900">你的课桌</div>
                <div className="text-[10px] text-amber-800 mt-1">经历的越多，这里的回忆就越多</div>
            </div>

            {/* Render unlocked props */}
            {activeProps.map((prop, i) => (
                <div
                    key={prop.id}
                    style={{ animationDelay: `${i * 0.1}s` }}
                    className={`absolute ${prop.position} flex flex-col items-center group cursor-pointer animate-popIn`}
                >
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl shadow-lg flex items-center justify-center text-2xl md:text-3xl ${prop.bg} ${prop.color} border-2 border-white/50 backdrop-blur-sm group-hover:-translate-y-2 group-hover:shadow-xl transition-all`}>
                        <i className={`fas ${prop.icon}`}></i>
                    </div>
                    <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
                        {prop.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AchievementDesk;
