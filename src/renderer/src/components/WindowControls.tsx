/**
 * @file WindowControls.tsx
 * @description 窗口控制按钮组件，非 macOS 平台显示最小化、最大化/还原、关闭三个窗口操作按钮
 */
import { ReactElement, useEffect, useState } from 'react'

/** 当前平台是否为 macOS */
const isMac = window.context.platform === 'darwin'

/**
 * WindowControls 窗口控制按钮组件
 * @description 监听窗口最大化状态变化，非 macOS 平台渲染最小化、最大化/还原、关闭按钮
 */
export const WindowControls = (): ReactElement | null => {
  /** 窗口是否处于最大化状态 */
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    void window.api.windowIsMaximized().then(setIsMaximized)
    const unsubscribe = window.api.onMaximizeChange(setIsMaximized)
    return unsubscribe
  }, [])

  if (isMac) return null

  /**
   * 窗口最小化处理
   */
  const handleMinimize = (): void => void window.api.windowMinimize()
  /**
   * 窗口最大化/还原处理
   */
  const handleMaximize = (): void => {
    void window.api.windowMaximize()
  }
  /**
   * 窗口关闭处理
   */
  const handleClose = (): void => void window.api.windowClose()

  return (
    <div className="flex items-center">
      {/* 最小化按钮 */}
      <button
        onClick={handleMinimize}
        className="flex h-8 w-[46px] items-center justify-center text-[var(--text-2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text-1)] active:bg-[var(--active)]"
        title="最小化"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line
            x1="1"
            y1="5"
            x2="9"
            y2="5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {/* 最大化/还原按钮 */}
      <button
        onClick={handleMaximize}
        className="flex h-8 w-[46px] items-center justify-center text-[var(--text-2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text-1)] active:bg-[var(--active)]"
        title={isMaximized ? '还原' : '最大化'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect
              x="1.5"
              y="3"
              width="5"
              height="5"
              stroke="currentColor"
              strokeWidth="1"
              rx="0.5"
            />
            <path d="M3.5 3V1.5h5v5H7" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="7"
              height="7"
              stroke="currentColor"
              strokeWidth="1"
              rx="0.5"
            />
          </svg>
        )}
      </button>
      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className="flex h-8 w-[46px] items-center justify-center text-[var(--text-2)] transition-colors hover:bg-[var(--danger)] hover:text-white active:bg-[var(--danger)] active:opacity-90"
        title="关闭"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line
            x1="2"
            y1="2"
            x2="8"
            y2="8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="2"
            x2="2"
            y2="8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
