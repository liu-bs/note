/**
 * @file SidebarHeader.tsx
 * @description 侧栏顶栏组件，展示全部笔记分组标题及新建笔记按钮
 */
import { NewNoteButton } from '@renderer/components/Button'
import { useNoteStore } from '@renderer/store'
import type { SidebarHeaderProps } from '@renderer/types'
import { memo, ReactElement } from 'react'
import { cn } from '@renderer/utils'

/**
 * SidebarHeader 侧栏顶栏组件
 * @param props {@link SidebarHeaderProps}
 */
export const SidebarHeader = memo(({ className, ...props }: SidebarHeaderProps): ReactElement => {
  const createNote = useNoteStore((state) => state.createNote)

  return (
    <div className={cn('flex items-center justify-between px-2 pb-2 pt-3', className)} {...props}>
      {/* 分组标题 */}
      <span className="text-[11px] font-medium tracking-wide text-[var(--text-2)]">全部笔记</span>
      {/* 新建笔记按钮 */}
      <NewNoteButton onClick={createNote} />
    </div>
  )
})
SidebarHeader.displayName = 'SidebarHeader'
