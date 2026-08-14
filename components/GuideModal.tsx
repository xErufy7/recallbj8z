
import React from 'react';

interface GuideModalProps {
    /** 键盘按压标记（App 的 keyFlash），命中时按钮呈按下状态 */
    flashTag?: string | null;
    onClose: () => void;
}

/** 首次开局的新手引导弹窗（localStorage 记住已看过，只出现一次） */
const GuideModal: React.FC<GuideModalProps> = ({ flashTag, onClose }) => {
    const rows: { icon: string; color: string; title: string; desc: string }[] = [
        { icon: 'fa-bullseye', color: 'text-rose-500', title: '目标', desc: '你是一名八中高一新生，目标是活到高三毕业。难度越高，高中越真实。' },
        { icon: 'fa-book', color: 'text-indigo-500', title: '选科', desc: '选择 3 门课程陪伴你整个高中，每学期的考试排名影响结局走向。' },
        { icon: 'fa-clock', color: 'text-amber-500', title: '节奏', desc: '每周自动推进：上课、随机事件、突发状况。周末有行动点，可以自习、逛街、谈恋爱。' },
        { icon: 'fa-trophy', color: 'text-yellow-500', title: '路线', desc: '可以走信竞（OI）路线冲击金牌，也可以搞社团、经营感情——每条路都有专属结局。' },
        { icon: 'fa-heart-pulse', color: 'text-emerald-500', title: '保命', desc: '健康、心态、金钱任何一项归零都会提前退场，做选择前多想想。' },
        { icon: 'fa-floppy-disk', color: 'text-sky-500', title: '存档', desc: '进度自动保存，每个难度独立存档，也可以导出文件自己保管。' },
    ];

    return (
        <div className="fixed inset-0 z-[125] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl no-btn-scale max-h-[90vh] overflow-y-auto custom-scroll" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 mx-auto mb-3 -rotate-3">
                        <i className="fas fa-school"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-800">欢迎来到八中重开模拟器</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">30 秒了解你的高中生活</p>
                </div>
                <div className="space-y-3 mb-5">
                    {rows.map((r, i) => (
                        <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-2xl p-3">
                            <i className={`fas ${r.icon} ${r.color} text-lg mt-0.5 w-5 text-center flex-shrink-0`}></i>
                            <div>
                                <div className="text-xs font-black text-slate-800">{r.title}</div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed mt-0.5">{r.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onClose}
                    className={`w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all ${flashTag === 'guide-close' ? 'key-pressed' : ''}`}>
                    开始我的高中生活 🎒
                </button>
            </div>
        </div>
    );
};
export default GuideModal;
