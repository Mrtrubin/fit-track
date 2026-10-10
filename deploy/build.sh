#!/usr/bin/env bash
# ============================================================
# FitTrack 构建 + 启动脚本（每次更新代码后执行）
# 前置：已在 ~/fittrack/.env.local 配置好 Supabase（见 deploy/README.md）
# 用法：bash deploy/build.sh
# ============================================================
set -e
cd "$(dirname "$0")/.."

echo "==> [1/4] 检查 .env.local（Supabase 配置）"
if [ ! -f .env.local ]; then
  echo "!! 未找到 .env.local，请先按 deploy/README.md 配置 Supabase 后再执行"
  exit 1
fi

echo "==> [2/4] 安装依赖 + 构建"
npm install
npm run build

echo "==> [3/4] 准备 standalone 产物"
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public
cp .env.local .next/standalone/.env.local

echo "==> [4/4] 启动（PM2 守护，开机自启）"
pm2 delete fittrack 2>/dev/null || true
PORT=3000 pm2 start .next/standalone/server.js --name fittrack
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "============================================================"
echo " ✅ 部署完成"
echo "    访问: http://你的公网IP/  （手机任何网络可访问）"
echo "    查看日志: pm2 logs fittrack"
echo "    重启服务: pm2 restart fittrack"
echo "============================================================"
