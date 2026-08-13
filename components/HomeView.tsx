import React, { useState } from 'react';
import { Difficulty, GeneralStats, ApiSettings } from '../types';
import { DIFFICULTY_PRESETS, CHANGELOG_DATA } from '../data/constants';
import { ACHIEVEMENTS } from '../data/mechanics';
import { getApiSettings, saveApiSettings } from '../lib/api';
import { getUseNewDb, setUseNewDb } from '../lib/supabase';
import { SaveInfo, getAllSaveInfos, deleteSaveByKey } from '../hooks/gameLogic/storage';

interface HomeViewProps {
    selectedDifficulty: Difficulty;
    onDifficultyChange: (diff: Difficulty) => void;
    customStats: GeneralStats;
    onCustomStatsChange: (stats: GeneralStats) => void;
    onCustomStatsConfirm?: () => void;
    onStart: () => void;
    hasSave: boolean;
    onLoadGame: () => void;
    unlockedAchievements: string[];
    onResetAchievements?: () => void;
    onShowLeaderboard?: () => void;
    soundOn: boolean;
    darkMode: boolean;
    onToggleSound: () => void;
    onToggleDark: () => void;
    latestSave?: SaveInfo | null;
    onSaveDeleted?: () => void;
}

const STAT_LABELS: Record<string, string> = {
    mindset: '心态', health: '健康', money: '金钱', efficiency: '效率',
    romance: '魅力', luck: '运气', experience: '经验',
};

const HomeView: React.FC<HomeViewProps> = ({ selectedDifficulty, onDifficultyChange, customStats, onCustomStatsChange, onCustomStatsConfirm, onStart, hasSave, onLoadGame, unlockedAchievements, onResetAchievements, onShowLeaderboard, soundOn, darkMode, onToggleSound, onToggleDark, latestSave, onSaveDeleted }) => {
    const [showChangelog, setShowChangelog] = React.useState(false);
    const [showAchievements, setShowAchievements] = React.useState(false);
    const [showCustomModal, setShowCustomModal] = React.useState(false);
    const [showResetConfirm, setShowResetConfirm] = React.useState(false);
    const [showVarHelp, setShowVarHelp] = React.useState(false);
    const [apiSettings, setApiSettings] = useState<ApiSettings>(getApiSettings);
    const [apiSaved, setApiSaved] = useState(false);
    const [useNewDb, setUseNewDbLocal] = useState(getUseNewDb());
    // 存档管理
    const [saves, setSaves] = useState(getAllSaveInfos);
    const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

    const handleCustomClick = () => {
        setSaves(getAllSaveInfos());
        setShowCustomModal(true);
    };

    const saveApi = () => {
        saveApiSettings(apiSettings);
        setApiSaved(true);
        setTimeout(() => setApiSaved(false), 2000);
    };

    const resetApi = () => {
        const empty: ApiSettings = { apiUrl: '', apiKey: '', modelName: '', customPrompt: '' };
        setApiSettings(empty);
        saveApiSettings(empty);
    };

    return (
        <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 p-3 md:p-8 flex items-center justify-center transition-all duration-500 ${darkMode ? 'dark-filter' : ''}`}>
            <div className="fixed top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-10 left-10 text-[12rem] font-black rotate-12 text-slate-900">8</div>
                <div className="absolute bottom-10 right-10 text-[12rem] font-black -rotate-12 text-slate-900">OI</div>
            </div>

            <div className="w-full max-w-[864px] z-10 mx-auto relative">

                {/* Hero Card */}
                <div className="bg-white rounded-[2.5rem] p-5 md:p-12 shadow-xl shadow-indigo-100/50 border border-slate-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

                    {/* Action buttons + Visitor */}
                    <div className="flex justify-end items-center gap-1 mb-4 md:mb-0 md:absolute md:top-12 md:right-12 md:flex-col md:gap-0 md:items-end z-20">
                        {/* Visitor badge */}
                        <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full shadow-sm mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visitors</span>
                            <img src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Fliuenyin%2Frecallbj8z&label=&countColor=%234f46e5&style=flat&labelStyle=none" alt="views" className="h-3.5" loading="lazy" referrerPolicy="no-referrer" />
                        </div>
                        <button onClick={() => setShowAchievements(true)}
                            className="group px-2.5 py-2 rounded-lg md:px-3 md:py-2.5 md:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-0 text-sm font-bold active:scale-95 whitespace-nowrap mb-1"
                        >
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:mr-2 group-hover:opacity-100 transition-all duration-300 ease-in-out">成就墙 ({unlockedAchievements.length}/{Object.keys(ACHIEVEMENTS).length})</span>
                            <i className="fas fa-trophy text-yellow-500 flex-shrink-0 w-4 text-center text-sm md:w-5 md:text-base"></i>
                        </button>
                        <button onClick={() => setShowChangelog(true)}
                            className="group px-2.5 py-2 rounded-lg md:px-3 md:py-2.5 md:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-0 text-sm font-bold active:scale-95 whitespace-nowrap mb-1"
                        >
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:mr-2 group-hover:opacity-100 transition-all duration-300 ease-in-out">更新日志</span>
                            <i className="fas fa-clipboard-list text-indigo-500 flex-shrink-0 w-4 text-center text-sm md:w-5 md:text-base"></i>
                        </button>
                        {onShowLeaderboard && (
                            <button onClick={onShowLeaderboard}
                                className="group px-2.5 py-2 rounded-lg md:px-3 md:py-2.5 md:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-0 text-sm font-bold active:scale-95 whitespace-nowrap mb-1"
                            >
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:mr-2 group-hover:opacity-100 transition-all duration-300 ease-in-out">排行榜</span>
                                <i className="fas fa-list-ol flex-shrink-0 w-4 text-center text-sm md:w-5 md:text-base"></i>
                            </button>
                        )}
                        <button onClick={handleCustomClick}
                            className="group px-2.5 py-2 rounded-lg md:px-3 md:py-2.5 md:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-0 text-sm font-bold active:scale-95 whitespace-nowrap mb-1"
                        >
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:mr-2 group-hover:opacity-100 transition-all duration-300 ease-in-out">设置</span>
                            <i className="fas fa-cog flex-shrink-0 w-4 text-center text-sm md:w-5 md:text-base"></i>
                        </button>
                    </div>

                    <div className="relative z-10 flex-1">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl md:w-20 md:h-20 md:rounded-3xl md:text-4xl shadow-lg shadow-indigo-200 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <i className="fas fa-school text-2xl md:text-4xl"></i>
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-slate-900">八中重开模拟器</h1>
                                    <p className="text-slate-400 font-bold text-xs mt-1 md:text-sm">Made by liuenyin</p>
                                </div>
                            </div>
                            <p className="mt-4 text-base md:mt-5 md:text-lg text-slate-600 leading-relaxed font-medium">
                                如果是你，能在这所学校里活得更精彩吗？<br/>
                                <span className="text-xs md:text-sm text-slate-400 font-normal">体验真实的高中生活，做出你的选择。</span>
                            </p>

                            {/* Version */}
                            <div className="text-left mt-6 md:mt-12">
                                <span className="text-xs font-bold text-slate-300 tracking-widest">{CHANGELOG_DATA[0].version}</span>
                            </div>

                            {/* Difficulty Selection */}
                            <div className="mt-4 md:mt-6">
                                <div className="flex flex-wrap items-center gap-3 mb-3 min-h-[28px]">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">选择开局难度</h3>
                                    {selectedDifficulty !== 'REALITY' && selectedDifficulty !== 'AI_STORY' && (
                                        <span className="text-xs text-amber-500 font-bold flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full whitespace-nowrap">
                                            <i className="fas fa-exclamation-triangle"></i> 仅在【现实】难度下可解锁成就
                                        </span>
                                    )}
                                    {selectedDifficulty === 'AI_STORY' && (
                                        <span className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 whitespace-nowrap">
                                            <i className="fas fa-robot"></i> 请确保已在设置中配置 API Key
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {(Object.entries(DIFFICULTY_PRESETS) as [Difficulty, typeof DIFFICULTY_PRESETS['NORMAL']][]).map(([key, config]) => (
                                        <button key={key} onClick={() => onDifficultyChange(key)}
                                            className={`px-3.5 py-2 rounded-2xl border-2 transition-all flex items-center gap-2 font-bold text-xs md:px-5 md:py-2.5 md:text-sm ${selectedDifficulty === key ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-300 hover:bg-white'}`}
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full ${config.color}`}></div>
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 my-5 md:my-6"></div>

                            {/* CTA Buttons */}
                            <div className="flex gap-3 md:gap-4">
                                <button
                                    onClick={onStart}
                                    className="bg-slate-900 text-white flex-1 py-3 rounded-2xl font-black text-base md:py-4 md:text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 md:gap-3 border-2 border-transparent whitespace-nowrap"
                                >
                                    <i className="fas fa-play text-indigo-400"></i> 开启新学期
                                </button>

                                <div className={`relative overflow-visible transition-all duration-500 ease-in-out ${hasSave ? 'flex-[0.5] opacity-100 w-[180px]' : 'flex-[0] opacity-0 w-0'}`}>
                                    <button onClick={onLoadGame}
                                        className="bg-white text-emerald-600 border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl py-3 px-2.5 font-black text-sm md:py-4 md:px-5 md:text-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap w-full h-full"
                                        title="继续上次的进度"
                                        disabled={!hasSave}
                                    >
                                    <i className="fas fa-save flex-shrink-0"></i> <span className="whitespace-nowrap">继续游戏</span>
                                </button>
                                {latestSave && (
                                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 text-[10px] font-bold text-slate-400 whitespace-nowrap hidden md:inline">
                                        {DIFFICULTY_PRESETS[latestSave.difficulty as Difficulty]?.label || latestSave.difficulty} · 第{latestSave.week}周
                                    </span>
                                )}
                                </div>
                            </div>


                    </div>
                </div>

            </div>

            {/* Custom Modal: Stats + AI Settings */}
            {showCustomModal && (
                <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowCustomModal(false)}>
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden no-btn-scale" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">
                                    <i className="fas fa-sliders-h text-indigo-500 mr-2"></i>自定义设置
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">调整初始属性与 AI 参数</p>
                            </div>
                            <button onClick={() => setShowCustomModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scroll space-y-6 pl-0.5 pr-4 pb-4 flex-1">
                            {/* 偏好设置：音效 / 暗色模式 */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                    <i className="fas fa-sliders-h mr-2"></i>偏好设置
                                </label>
                                <div className="space-y-2">
                                    <button
                                        onClick={onToggleSound}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-slate-600"><i className={`fas ${soundOn ? 'fa-volume-high text-indigo-500' : 'fa-volume-xmark text-slate-400'} inline-block w-4 text-center mr-2`}></i>音效</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${soundOn ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{soundOn ? '已开启' : '已关闭'}</span>
                                    </button>
                                    <button
                                        onClick={onToggleDark}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-slate-600"><i className={`fas ${darkMode ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-500'} inline-block w-4 text-center mr-2`}></i>暗色模式</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{darkMode ? '已开启' : '已关闭'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 my-5"></div>

                            {/* 存档管理 */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                    <i className="fas fa-database mr-2"></i>存档管理
                                </label>
                                {saves.length === 0 ? (
                                    <p className="text-xs text-slate-400 px-1">暂无本地存档</p>
                                ) : (
                                    <div className="space-y-2">
                                        {saves.map(s => (
                                            <div key={s.key} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                                                <span className="text-xs font-bold text-slate-600 min-w-0">
                                                    {DIFFICULTY_PRESETS[s.difficulty as Difficulty]?.label || s.difficulty} · 第{s.week}周
                                                    {s.updatedAt > 0 && <span className="text-slate-400 font-normal ml-1.5">{new Date(s.updatedAt).toLocaleDateString()}</span>}
                                                </span>
                                                {confirmDeleteKey === s.key ? (
                                                    <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                        <button onClick={() => { deleteSaveByKey(s.key); setConfirmDeleteKey(null); setSaves(getAllSaveInfos()); onSaveDeleted?.(); }} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold">确认删除</button>
                                                        <button onClick={() => setConfirmDeleteKey(null)} className="px-2 py-1 rounded-lg bg-slate-200 text-slate-500 text-[10px] font-bold">取消</button>
                                                    </span>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteKey(s.key)} className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 text-[10px] font-bold transition-colors flex-shrink-0 ml-2" title="删除该存档"><i className="fas fa-trash-alt"></i></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 my-5"></div>

                            {/* Custom Stats */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                    <i className="fas fa-chart-bar mr-1"></i>初始属性
                                </label>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    {(Object.keys(customStats) as (keyof GeneralStats)[]).map(key => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 w-10">{STAT_LABELS[key] || key}</span>
                                            <input type="range" min="0" max="100" value={customStats[key]} onChange={(e) => { onCustomStatsChange({...customStats, [key]: parseInt(e.target.value)}); onCustomStatsConfirm?.(); }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <span className="text-xs font-bold text-indigo-600 w-7 text-right">{customStats[key]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 my-5"></div>

                            {/* AI Settings */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                    <i className="fas fa-robot mr-1"></i>AI 设置
                                </label>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">API 地址</label>
                                        <input
                                            type="text"
                                            value={apiSettings.apiUrl}
                                            onChange={e => setApiSettings(p => ({ ...p, apiUrl: e.target.value }))}
                                            placeholder="https://api.deepseek.com/chat/completions"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">API Key</label>
                                        <input
                                            type="password"
                                            value={apiSettings.apiKey}
                                            onChange={e => setApiSettings(p => ({ ...p, apiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">模型名称</label>
                                        <input
                                            type="text"
                                            value={apiSettings.modelName}
                                            onChange={e => setApiSettings(p => ({ ...p, modelName: e.target.value }))}
                                            placeholder="DeepSeek-v4-flash"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">自定义提示词</label>
                                            <button onClick={() => setShowVarHelp(true)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors">
                                                <i className="fas fa-question-circle mr-0.5"></i>变量说明
                                            </button>
                                        </div>
                                        <textarea
                                            value={apiSettings.customPrompt}
                                            onChange={e => setApiSettings(p => ({ ...p, customPrompt: e.target.value }))}
                                            placeholder="留空使用默认提示词。可用变量：{{phase}} {{week}} {{talents}} {{mindset}} ..."
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100 my-5"></div>

                                {/* Database Toggle */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                        <i className="fas fa-list-ol mr-2"></i>排行榜数据
                                    </label>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">切换数据源</label>
                                    <button
                                        onClick={() => { const v = !useNewDb; setUseNewDbLocal(v); setUseNewDb(v); }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-xs text-slate-500">当前：{useNewDb ? '新版数据库' : '旧版数据库'}</span>
                                        <i className="fas fa-exchange-alt text-slate-400 text-xs"></i>
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={resetApi} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                                <i className="fas fa-undo"></i> 重置AI设置
                            </button>
                            <button onClick={saveApi} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${apiSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}>
                                {apiSaved ? <><i className="fas fa-check"></i> 已保存</> : <><i className="fas fa-save"></i> 保存设置</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievements Modal */}
            {showAchievements && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fadeIn" onClick={() => setShowAchievements(false)}>
                    <div className="bg-white rounded-[2rem] p-4 md:p-8 max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800">成就墙</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">已解锁 <span className="text-indigo-600 font-bold">{unlockedAchievements.length}</span> / {Object.keys(ACHIEVEMENTS).length}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {onResetAchievements && (
                                    <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all flex items-center gap-1.5">
                                        <i className="fas fa-undo"></i> 重置
                                    </button>
                                )}
                                <button onClick={() => setShowAchievements(false)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                            {Object.values(ACHIEVEMENTS).map(ach => {
                                const isUnlocked = unlockedAchievements.includes(ach.id);
                                return (
                                    <div key={ach.id} className={`p-3 rounded-2xl border-2 flex items-center gap-3 min-w-0 transition-all ${isUnlocked ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
                                        <div className={`w-10 h-10 rounded-xl md:w-12 md:h-12 md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-sm flex-shrink-0 ${isUnlocked ? 'bg-white text-indigo-500' : 'bg-slate-200 text-slate-400'}`}>
                                            <i className={`fas ${ach.icon}`}></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`font-bold text-[13px] md:text-sm truncate ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>{ach.title}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5 leading-tight line-clamp-2">{ach.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowResetConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <p className="text-lg font-bold text-slate-800 mb-4">确认重置吗？</p>
                        <p className="text-sm text-slate-500 mb-6">所有成就进度将被清空，此操作不可撤销。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">取消</button>
                            <button onClick={() => { onResetAchievements?.(); setShowResetConfirm(false); }} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors">确认重置</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Variable Help Modal */}
            {showVarHelp && (
                <div className="fixed inset-0 z-[120] bg-slate-900/40 flex items-center justify-center p-4 md:p-6 animate-fadeIn" onClick={() => setShowVarHelp(false)}>
                    <div className="bg-white rounded-2xl p-5 md:p-6 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-black text-slate-800">提示词变量说明</h3>
                            <button onClick={() => setShowVarHelp(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="overflow-y-auto custom-scroll rounded-xl border border-slate-200">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left px-4 py-1.5 font-bold text-slate-500 border-b border-slate-200">变量</th>
                                        <th className="text-left px-4 py-1.5 font-bold text-slate-500 border-b border-slate-200">说明</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        ['{{phase}}', '当前阶段'],
                                        ['{{week}}', '当前周数'],
                                        ['{{talents}}', '天赋列表'],
                                        ['{{subjects}}', '科目信息'],
                                        ['{{statuses}}', '当前状态'],
                                        ['{{mindset}}', '心态值'],
                                        ['{{health}}', '健康值'],
                                        ['{{money}}', '金钱'],
                                        ['{{efficiency}}', '效率'],
                                        ['{{romance}}', '魅力值'],
                                        ['{{luck}}', '运气值'],
                                        ['{{experience}}', '经验值'],
                                        ['{{competition}}', '赛道（高考/OI）'],
                                        ['{{partner}}', '感情对象'],
                                        ['{{history}}', '最近5条剧情'],
                                        ['{{recentTitles}}', '最近8条事件标题'],
                                    ].map(([k, v]) => (
                                        <tr key={k}>
                                            <td className="px-4 py-1.5 font-mono text-indigo-600">{k}</td>
                                            <td className="px-4 py-1.5 text-slate-600">{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Changelog Modal */}
            {showChangelog && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowChangelog(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-800">更新日志</h2>
                            <button onClick={() => setShowChangelog(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="overflow-y-auto custom-scroll space-y-6 pr-2">
                            {CHANGELOG_DATA.map((log, i) => (
                                <div key={i}>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-lg font-bold text-indigo-600">{log.version}</span>
                                        <span className="text-xs text-slate-400 font-mono">{log.date}</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1">
                                        {log.content.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-600">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeView;
