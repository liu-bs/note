/**
 * @file main.tsx
 * @description React 应用入口文件，负责将根组件 App 挂载到 DOM 的 #root 节点上，启动渲染进程的 React 应用
 */
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from '@renderer/components/ErrorBoundary'

/** macOS 平台检测，添加 platform-mac class 使 vibrancy 生效 */
if (window.context.platform === 'darwin') {
  document.body.classList.add('platform-mac')
}

/**
 * 将 App 组件挂载到 DOM 根节点
 * @description 使用 StrictMode 包裹以启用开发模式下的额外检查，ErrorBoundary 捕获渲染异常防止白屏
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
