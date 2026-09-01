/**
 * @file ErrorBoundary.tsx
 * @description 全局错误边界组件，捕获子组件树渲染异常，展示降级 UI 防止白屏
 */
import { Component, ErrorInfo, ReactElement } from 'react'

/**
 * ErrorBoundaryState 错误边界内部状态类型
 */
type ErrorBoundaryState = {
  /** 是否已捕获错误 */
  hasError: boolean
  /** 捕获到的错误对象 */
  error: Error | null
}

/**
 * ErrorBoundary 全局错误边界
 * @description 捕获子组件渲染异常，展示错误信息并提供重试按钮
 */
export class ErrorBoundary extends Component<{ children: ReactElement }, ErrorBoundaryState> {
  constructor(props: { children: ReactElement }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /**
   * 捕获错误并更新状态
   * @param error 捕获到的错误对象
   * @returns 更新后的状态
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /**
   * 记录错误信息
   * @param error 捕获到的错误对象
   * @param errorInfo React 组件栈信息
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] 渲染异常:', error, errorInfo)
  }

  /**
   * 重置错误状态，重新渲染子组件
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  /**
   * 渲染：有错误时展示降级 UI，否则正常渲染子组件
   * @returns 降级 UI 或子组件
   */
  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--app-bg)] text-[var(--text-1)]">
          <h1 className="text-lg font-semibold">应用出现问题</h1>
          <p className="max-w-md text-center text-[13px] text-[var(--text-2)]">
            {this.state.error?.message ?? '未知错误'}
          </p>
          {/* 重试按钮 */}
          <button
            onClick={this.handleReset}
            className="rounded-[8px] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--hover)] active:scale-95"
            style={{
              background: 'var(--raised-bg)',
              color: 'var(--text-1)',
              boxShadow: 'var(--raised-shadow)',
              border: '1px solid var(--raised-ring)'
            }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
