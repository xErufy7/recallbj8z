// 下载 Noto Sans SC woff2 子集到 public/fonts 并生成本地 CSS（自托管，摆脱 Google Fonts）
// 用法：node scripts/fetch-fonts.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const WEIGHTS = '400;500;700;900';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const CSS_SOURCES = [
    `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${WEIGHTS}&display=swap`,
    `https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@${WEIGHTS}&display=swap`, // 国内镜像兜底
];
const OUT_DIR = new URL('../public/fonts/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const FILE_DIR = `${OUT_DIR}noto-sans-sc/`;

const fetchText = async (url) => (await fetch(url, { headers: { 'User-Agent': UA } })).text();

let css = '';
for (const src of CSS_SOURCES) {
    try {
        css = await fetchText(src);
        console.log(`CSS 获取成功: ${src}`);
        break;
    } catch (e) {
        console.log(`CSS 获取失败: ${src} (${e.message})`);
    }
}
if (!css) { console.error('所有源都失败了'); process.exit(1); }

const urls = [...css.matchAll(/url\((https:\/\/[^)]+?\.woff2)\)/g)].map(m => m[1]);
if (urls.length === 0) { console.error('CSS 里没有找到 woff2 地址'); process.exit(1); }
console.log(`共 ${urls.length} 个字体子集文件，开始下载...`);

await mkdir(FILE_DIR, { recursive: true });
let done = 0;
const pool = async (items, n, fn) => {
    const queue = [...items];
    await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => {
        while (queue.length) await fn(queue.shift());
    }));
};
await pool(urls, 12, async (u) => {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const buf = Buffer.from(await (await fetch(u, { headers: { 'User-Agent': UA } })).arrayBuffer());
            await writeFile(`${FILE_DIR}${basename(u)}`, buf);
            if (++done % 50 === 0) console.log(`  ${done}/${urls.length}`);
            return;
        } catch (e) {
            if (attempt === 2) console.error(`下载失败: ${u} (${e.message})`);
        }
    }
});

// CSS 里的远程地址改写为相对路径
const localCss = css.replace(/url\((https:\/\/[^)]+?\.woff2)\)/g, (_m, u) => `url(noto-sans-sc/${basename(u)})`);
await writeFile(`${OUT_DIR}noto-sans-sc.css`, localCss);
console.log(`完成: ${done}/${urls.length}，已写入 public/fonts/noto-sans-sc.css`);
