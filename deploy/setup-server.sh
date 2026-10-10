#!/usr/bin/env bash
# ============================================================
# FitTrack 服务器初始化脚本（Ubuntu / Debian，只需执行一次）
# 功能：安装 Node.js 20 + PM2 + Nginx，配置 Nginx 反向代理
# 用法：sudo bash setup-server.sh
# ============================================================
set -e

echo "==> [1/4] 安装 Node.js 20"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "    Node.js 已存在: $(node -v)"
fi

echo "==> [2/4] 安装 PM2"
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
else
  echo "    PM2 已存在: $(pm2 -v)"
fi

echo "==> [3/4] 安装 Nginx"
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
else
  echo "    Nginx 已存在: $(nginx -v 2>&1)"
fi

echo "==> [4/4] 配置 Nginx 反向代理（公网IP:80 → 127.0.0.1:3000）"
sudo tee /etc/nginx/sites-available/fittrack > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 上传大小限制（JSON 备份等）
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/fittrack /etc/nginx/sites-enabled/fittrack
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "============================================================"
echo " ✅ 服务器初始化完成"
echo "    下一步：把项目代码上传到 ~/fittrack 后执行 deploy/build.sh"
echo "============================================================"
