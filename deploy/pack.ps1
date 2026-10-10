# FitTrack 部署包打包脚本（Windows PowerShell）
# 用法：右键“使用 PowerShell 运行”，或在本机 PowerShell 执行
# 产物：fittrack-deploy.tar.gz（路径为正斜杠，Linux 原生兼容；不含 node_modules/.next）
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $root
$out = Join-Path $root "fittrack-deploy.tar.gz"

if (Test-Path $out) { Remove-Item $out -Force }

# 需要打包的内容（显式列出，避免夹带 node_modules/.next/.git）
tar -a -c -f $out src supabase deploy scripts public package.json package-lock.json tsconfig.json next.config.ts .env.local.example .gitignore README.md

Write-Host ""
Write-Host "部署包已生成: $out"
Write-Host "上传: scp $out ubuntu@你的IP:~/"
Write-Host "服务器解压: cd ~ && tar -xzf fittrack-deploy.tar.gz -C fittrack"

