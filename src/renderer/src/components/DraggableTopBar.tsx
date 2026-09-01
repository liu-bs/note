/**
 * @file DraggableTopBar.tsx
 * @description 可拖拽顶栏组件，渲染一个透明 header 覆盖在窗口顶部，用于实现 Electron 窗口拖拽移动，非 macOS 平台右侧显示窗口控制按钮
 */
import { ReactElement } from 'react'
import { WindowControls } from './WindowControls'

/**
 * DraggableTopBar 可拖拽顶栏组件
 * @description 绝对定位的透明 header，高度 32px，覆盖在应用顶部区域，充当 Electron 窗口拖拽区域，右侧放置窗口控制按钮
 */
export const DraggableTopBar = (): ReactElement => {
  return (
    <header className="absolute top-0 inset-x-0 flex h-8 items-center justify-end bg-transparent">
      <WindowControls />
    </header>
  )
}
