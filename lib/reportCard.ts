
// 毕业成绩单生成（canvas 750×1000，样式与 report_card_test.html 一致）

export interface ReportCardData {
    rank: string;
    title: string;
    comment: string;
    score: number;
    name?: string;
    stats: { label: string; value: number; max: number; color: string }[];
}

const FONT = "'Noto Sans SC','Microsoft YaHei',system-ui,sans-serif";

const RANK_COLORS: Record<string, { main: string; light: string; label: string }> = {
    SSS: { main: '#b45309', light: '#fef3c7', label: 'GOLD' },
    SS:  { main: '#64748b', light: '#f1f5f9', label: 'SILVER' },
    S:   { main: '#b45309', light: '#ffedd5', label: 'BRONZE' },
    A:   { main: '#4f46e5', light: '#e0e7ff', label: 'RANK' },
    B:   { main: '#0d9488', light: '#ccfbf1', label: 'RANK' },
    C:   { main: '#0284c7', light: '#e0f2fe', label: 'RANK' },
    D:   { main: '#ea580c', light: '#ffedd5', label: 'RANK' },
    Z:   { main: '#475569', light: '#e2e8f0', label: 'RANK' }
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const chars = [...text];
    const lines: string[] = [];
    let line = '';
    for (const ch of chars) {
        if (ctx.measureText(line + ch).width > maxWidth) {
            lines.push(line);
            line = ch;
            if (lines.length >= maxLines) break;
        } else {
            line += ch;
        }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length >= maxLines && line && !lines.includes(line)) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
    lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const drawBar = (ctx: CanvasRenderingContext2D, label: string, value: number, max: number, y: number, color: string) => {
    ctx.fillStyle = '#475569';
    ctx.font = `600 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, 120, y + 22);
    const barX = 220, barW = 350, barH = 16;
    roundRect(ctx, barX, y + 8, barW, barH, 8);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    const pct = Math.max(0, Math.min(1, value / max));
    if (pct > 0) {
        roundRect(ctx, barX, y + 8, Math.max(16, barW * pct), barH, 8);
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.fillStyle = '#334155';
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(String(value), barX + barW + 60, y + 24);
};

/** 在给定 canvas 上绘制成绩单 */
export const drawReportCard = (canvas: HTMLCanvasElement, data: ReportCardData) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { rank, title, comment, score, name, stats } = data;
    const rc = RANK_COLORS[rank] || RANK_COLORS.C;
    const now = new Date();
    const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 750, 1000);
    const grad = ctx.createLinearGradient(0, 0, 750, 0);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 750, 10);

    // 装饰边框（外框底 984 / 内框底 974，底部签名区要放进框内）
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 694, 956);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 1;
    ctx.strokeRect(38, 38, 674, 936);

    // 校名
    ctx.fillStyle = '#334155';
    ctx.font = `900 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('北京八中 · 重开模拟器', 375, 110);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText('GRADUATION REPORT', 375, 145);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 170);
    ctx.lineTo(630, 170);
    ctx.stroke();

    // 评级徽章
    ctx.beginPath();
    ctx.arc(375, 275, 85, 0, Math.PI * 2);
    ctx.fillStyle = rc.light;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = rc.main;
    ctx.stroke();
    ctx.fillStyle = rc.main;
    ctx.font = `900 72px ${FONT}`;
    ctx.fillText(rank, 375, 300);
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText(rc.label, 375, 330);

    // 称号 + 名字 + 分数
    ctx.fillStyle = '#0f172a';
    ctx.font = `900 40px ${FONT}`;
    ctx.fillText(title, 375, 420);
    ctx.fillStyle = '#64748b';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(`${name || '匿名'} · 综合评分`, 375, 458);
    ctx.fillStyle = '#4f46e5';
    ctx.font = `900 56px ${FONT}`;
    ctx.fillText(String(Math.round(score)), 375, 520);

    // 评语
    ctx.fillStyle = '#475569';
    ctx.font = `500 22px ${FONT}`;
    wrapText(ctx, comment, 375, 575, 480, 32, 2);

    // 属性条（640 起、间距 32，8 条最底约 888，留出底部签名区）
    stats.forEach((s, i) => {
        drawBar(ctx, s.label, Math.round(s.value), s.max, 640 + i * 32, s.color);
    });

    // 底部
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(120, 912);
    ctx.lineTo(630, 912);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 18px ${FONT}`;
    ctx.textAlign = 'center'; // drawBar 结束时是 right 对齐，这里必须重置回居中
    ctx.fillText(`颁发日期：${dateStr} 八中重开模拟器 · 出品`, 375, 943);
};
