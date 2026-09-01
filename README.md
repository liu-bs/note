# NoteMark

一款极简的 Markdown 笔记应用，基于 Electron + React + TypeScript 构建。

## 功能特性

- Markdown 编辑与实时预览（支持 GFM 语法、代码高亮）
- 笔记的创建、编辑、重命名、删除（含确认弹框）
- 拖拽 `.md` 文件快速导入
- 自动保存（节流写入，失焦时刷新）
- 无边框窗口 + macOS 毛玻璃效果
- 非 macOS 平台自定义窗口控制按钮（关闭/最小化/最大化）
- 窗口大小与位置持久化
- 跨平台支持（Windows / macOS / Linux）

## 技术栈

| 领域     | 技术                                           |
| -------- | ---------------------------------------------- |
| 框架     | Electron 44 + React 19 + TypeScript            |
| 构建     | electron-vite + electron-builder               |
| 样式     | Tailwind CSS v4                                |
| 状态管理 | Zustand                                        |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| 图标     | lucide-react                                   |

## 项目结构

```
src/
├── main/          # Electron 主进程（窗口、IPC、菜单、窗口状态）
├── preload/       # 预加载脚本（IPC 桥接）
├── renderer/      # 渲染进程（React 应用）
│   └── src/
│       ├── components/   # UI 组件（编辑器、笔记列表、工具栏、窗口控件等）
│       ├── hooks/        # 自定义 Hooks
│       ├── store/        # Zustand 状态管理
│       ├── types/        # 类型定义
│       └── utils/        # 工具函数
└── shared/        # 主进程与渲染进程共享的类型和常量
```

## 开发

### 环境要求

- Node.js
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 类型检查

```bash
pnpm typecheck
```

### 代码规范

```bash
pnpm lint      # ESLint 检查
pnpm format    # Prettier 格式化
```

## 构建

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
