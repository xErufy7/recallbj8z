
// 轻量音效系统：Web Audio 合成简单提示音，无外部资源。
// 浏览器要求用户交互后才能出声，所有播放都发生在点击等交互回调里，天然满足。

const STORAGE_KEY = 'bj8z_sound_enabled';

let enabled = (() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
})();

let ctx: AudioContext | null = null;

export const isSoundEnabled = (): boolean => enabled;

export const setSoundEnabled = (on: boolean) => {
    enabled = on;
    try { localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off'); } catch { }
};

const getCtx = (): AudioContext | null => {
    if (!enabled) return null;
    try {
        if (!ctx) {
            const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    } catch { return null; }
};

const beep = (freq: number, duration = 0.08, type: OscillatorType = 'sine', gain = 0.12, when = 0) => {
    const c = getCtx();
    if (!c) return;
    try {
        const t = c.currentTime + when;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + duration);
    } catch { /* 忽略播放失败 */ }
};

/** 选项点击：短促轻响 */
export const playClick = () => beep(600, 0.06, 'triangle', 0.1);

/** 确认/保存：两连升调 */
export const playConfirm = () => {
    beep(440, 0.08, 'sine', 0.1);
    beep(660, 0.1, 'sine', 0.1, 0.08);
};

/** 成就解锁：三连上行音阶 */
export const playAchievement = () => {
    beep(523, 0.1, 'sine', 0.12);
    beep(659, 0.1, 'sine', 0.12, 0.1);
    beep(784, 0.2, 'sine', 0.12, 0.2);
};

/** 错误提示：低沉短嗡 */
export const playError = () => beep(200, 0.2, 'sawtooth', 0.08);

/** 周末来临：轻快两连音 */
export const playWeekend = () => {
    beep(392, 0.09, 'sine', 0.1);
    beep(523, 0.12, 'sine', 0.1, 0.09);
};

/** 考试开始：低沉提示 */
export const playExam = () => {
    beep(311, 0.18, 'sine', 0.1);
    beep(262, 0.25, 'sine', 0.1, 0.16);
};

/** 结局结算：上行小号角 */
export const playEnding = () => {
    beep(523, 0.12, 'sine', 0.11);
    beep(659, 0.12, 'sine', 0.11, 0.12);
    beep(784, 0.2, 'sine', 0.11, 0.24);
    beep(1047, 0.35, 'sine', 0.11, 0.36);
};
