#!/usr/bin/env bash
# install.sh — 一键安装 gaokao-agent 到 OpenClaw
# 用法：bash install.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.openclaw/skills/gaokao-agent"

echo "🎓 gaokao-agent 安装脚本"
echo "项目目录：$PROJECT_DIR"
echo ""

# 1. 依赖安装
echo "📦 安装 Node.js 依赖..."
cd "$PROJECT_DIR"
npm install --silent
echo "✅ 依赖安装完成"

# 2. 配置 .env
if [ ! -f "$PROJECT_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  echo ""
  echo "⚠️  已创建 .env 文件，请填入你的 MiniMax API Key："
  echo "   编辑 $PROJECT_DIR/.env"
  echo "   将 MINIMAX_API_KEY=your_minimax_api_key_here 替换为你的 Key"
  echo ""
  echo "   申请地址：https://platform.minimaxi.com"
else
  echo "✅ .env 已存在，跳过"
fi

# 3. 注册 OpenClaw Skill
if command -v openclaw &>/dev/null; then
  echo ""
  echo "🔌 注册 OpenClaw Skill..."
  mkdir -p "$SKILL_DIR"

  # 把 skill.md 中的 PROJECT_PATH 替换为实际路径
  sed "s|PROJECT_PATH|$PROJECT_DIR|g" "$PROJECT_DIR/skill.md" > "$SKILL_DIR/skill.md"

  # 重启 OpenClaw 使 skill 生效
  openclaw gateway restart 2>/dev/null && echo "✅ OpenClaw 已重启，skill 已加载" || echo "⚠️  请手动重启 OpenClaw"
else
  echo ""
  echo "ℹ️  未检测到 OpenClaw，跳过 Skill 注册"
  echo "   如需使用 OpenClaw，安装后手动运行："
  echo "   mkdir -p $SKILL_DIR"
  echo "   sed \"s|PROJECT_PATH|$PROJECT_DIR|g\" skill.md > $SKILL_DIR/skill.md"
  echo "   openclaw gateway restart"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "测试运行："
echo "  node $PROJECT_DIR/cli.js \"导数 f(x)=x³-3x 的极值是多少？\""
