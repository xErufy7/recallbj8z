#!/usr/bin/env bash
# 一键部署：构建 → 上传 → 清理服务器上的旧资源文件
# 用法：npm run deploy（或 bash scripts/deploy.sh）
set -e
cd "$(dirname "$0")/.."

echo "==> 构建中..."
npm run build

cd dist
# 记录本次构建产出的资源文件名，用于删除服务器上已过期的旧文件
KEEP=$(ls assets)

echo "==> 上传中..."
scp -r assets cities index.html sw.js manifest.webmanifest admin@39.105.128.47:/home/admin/dist/

echo "==> 清理旧资源..."
ssh admin@39.105.128.47 "cd /home/admin/dist/assets && find . -maxdepth 1 -type f $(for f in $KEEP; do printf ' ! -name %s' "$f"; done) -delete"
# 字体已改回 CDN 引用，删除服务器上残留的自托管字体目录
ssh admin@39.105.128.47 "rm -rf /home/admin/dist/fonts /home/admin/dist/fontawesome"

echo "==> 部署完成 ✅ https://39.105.128.47/"
