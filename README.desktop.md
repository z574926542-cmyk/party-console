# 奇妙奇遇游戏控制台 - 桌面版构建指南

## 方式一：通过 GitHub Actions 自动构建（推荐）

### 步骤

1. **推送代码到 GitHub**（已完成）

2. **触发构建**：有两种方式触发构建
   - **打标签触发**（推荐，同时生成 Release）：
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - **手动触发**：在 GitHub 仓库页面 → Actions → 「构建桌面安装包」→ Run workflow

3. **下载安装包**：
   - 打标签方式：构建完成后在 Releases 页面下载
   - 手动触发方式：在 Actions 页面对应的 workflow run → Artifacts 中下载

### 安装说明

**macOS (.dmg)**：
1. 下载 `.dmg` 文件
2. 双击打开，将应用图标拖入 Applications 文件夹
3. 首次运行可能需要在「系统偏好设置 → 安全性与隐私」中允许运行

**Windows (.exe)**：
1. 下载 `.exe` 安装程序
2. 双击运行，按向导完成安装
3. 桌面和开始菜单会自动创建快捷方式

---

## 方式二：本地构建

### 前置要求
- Node.js 20+
- pnpm 10+

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/z574926542-cmyk/party-console.git
cd party-console

# 2. 使用桌面版 package.json
cp package.desktop.json package.json

# 3. 安装依赖
pnpm install

# 4. 构建（选择对应平台）
pnpm electron:build:mac    # macOS
pnpm electron:build:win    # Windows（需在 Windows 上运行）
pnpm electron:build:linux  # Linux

# 5. 安装包在 release/ 目录中
```

---

## 数据存储说明

桌面版使用浏览器 IndexedDB 和 localStorage 存储数据，数据保存在本地，完全离线运行。

- 游戏库、轮盘、结算记录等数据永久保存
- 可通过应用内的导出功能将数据备份为 JSON 文件
- 重装系统前请先导出备份
