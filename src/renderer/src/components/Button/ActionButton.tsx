/**
 * @file ActionButton.tsx
 * @description 基础操作按钮组件，提供统一样式与 hover/active 过渡动效
 */
import type { ActionButtonProps } from '@renderer/types'
import { ReactElement } from 'react'
import { cn } from '@renderer/utils'

/**
 * ActionButton 基础操作按钮组件
 * @param props {@link ActionButtonProps}
 */
export const ActionButton = ({
  className,
  children,
  ...props
}: ActionButtonProps): ReactElement => {
  return (
    <button
      {...props}
      className={cn(
        'rounded-[7px] p-1.5 text-[var(--text-2)] transition-all',
        'hover:bg-[var(--hover)] hover:text-[var(--text-1)]',
        'active:bg-[var(--active)] active:scale-95',
        className
      )}
    >
      {children}
    </button>
  )
}
