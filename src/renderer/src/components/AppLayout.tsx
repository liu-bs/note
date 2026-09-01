/**
 * @file AppLayout.tsx
 * @description 应用布局原语，提供 AppLayout 主容器、Sidebar 侧边栏和 Content 内容区三个布局组件，支撑整体页面结构
 */
import { ComponentProps, forwardRef, ReactElement } from 'react'
import { cn } from '@renderer/utils'

/**
 * AppLayout 应用主布局容器
 * @param props {@link ComponentProps<'main'>}
 */
export const AppLayout = ({
  className,
  children,
  ...props
}: ComponentProps<'main'>): ReactElement => {
  return (
    <main className={cn('flex flex-row h-screen', className)} {...props}>
      {children}
    </main>
  )
}

/**
 * Sidebar 侧边栏布局容器
 * @param props {@link ComponentProps<'aside'>}
 */
export const Sidebar = ({
  className,
  children,
  ...props
}: ComponentProps<'aside'>): ReactElement => {
  return (
    <aside
      className={cn(
        'w-60 mt-8 h-[calc(100vh-32px)] overflow-hidden bg-[var(--sidebar-bg)]',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

/**
 * Content 内容区布局容器
 * @param props {@link ComponentProps<'div'>}
 */
export const Content = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, children, ...props }, ref): ReactElement => {
    return (
      <div ref={ref} className={cn('flex-1 overflow-auto', className)} {...props}>
        {children}
      </div>
    )
  }
)
Content.displayName = 'Content'
