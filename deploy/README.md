# FitTrack 阿里云服务器部署指南（Ubuntu / Debian）

目标：网站跑在你的阿里云服务器上，手机在**任何网络**都能通过公网 IP 访问，数据存 Supabase 云数据库（RLS 安全隔离）。

## 部署架构

```
手机（4G/WiFi/任何网络） ──► 公网IP:80 ──► Nginx ──► Next.js (PM2:3000)
                                                     │
                                                     ▼
                                          Supabase 云数据库（PostgreSQL + RLS）
```

## 第一步：准备 Supabase 云数据库（必做，5 分钟）

1. 打开 **supabase.com** → 注册/登录 → **New project**（免费项目，Region 选 Singapore 或 Tokyo 更近）
2. 创建成功后，左侧 **SQL Editor** → 把项目里 `supabase/schema.sql` 全部内容粘贴 → **Run** 执行
3. 左侧 **Settings → API**，复制 **Project URL** 和 **anon public key**
4. 在项目目录（本机）创建 `.env.local`，填入：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
   ```

## 第二步：上传代码到服务器

把项目文件夹传到服务器（任选一种）：

```bash
# 方式A：scp（在本机 PowerShell 执行，替换 IP 和用户名）
scp -r C:\Users\dlq\Doubao\chats\2026-10-09\new-chat ubuntu@你的IP:~/fittrack

# 方式B：先本地打包再上传
# 在本机执行：把 new-chat 目录压缩成 fittrack.zip（不含 node_modules 和 .next）
# 然后 scp fittrack.zip 到服务器，解压到 ~/fittrack
```

> 压缩前务必删除 `node_modules`、`.next` 两个目录（体积大且会在服务器重新生成）。

## 第三步：服务器执行（SSH 登录后）

```bash
cd ~/fittrack
# 1. 首次部署执行一次：装 Node.js + PM2 + Nginx 并配置反向代理
sudo bash deploy/setup-server.sh

# 2. 把第一步配好的 .env.local 传到服务器（若方式A已包含则跳过）
# 方式A: scp .env.local ubuntu@你的IP:~/fittrack/.env.local

# 3. 构建 + 启动（每次更新代码后都执行这个）
bash deploy/build.sh
```

## 第四步：开放端口（阿里云控制台，必做）

阿里云控制台 → ECS 实例 → 安全组 → 配置规则 → 入方向添加：

| 协议 | 端口 | 授权对象 |
|---|---|---|
| TCP | 80 | 0.0.0.0/0（所有人可访问） |
| TCP | 22 | 你的电脑 IP（SSH 用，建议限制） |

## 完成

手机浏览器输入 `http://你的公网IP` 即可访问。数据在 Supabase 云端，手机和电脑登录同一账号数据互通。

## 常用运维命令

```bash
pm2 logs fittrack       # 查看运行日志
pm2 restart fittrack    # 重启服务
pm2 status              # 查看状态
pm2 monit               # 监控面板
```

## 更新网站代码

本机修改代码 → 重新 scp 覆盖 `src` 等目录（保留 node_modules/.next 可只传源码）→ 服务器执行 `bash deploy/build.sh`。
