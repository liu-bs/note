/**
 * @file FloatingNoteTitle.tsx
 * @description 浮动笔记标题 — 双击重命名
 */
import { useNoteStore } from '@renderer/store'
import type { FloatingNoteTitleProps } from '@renderer/types'
import { memo, ReactElement, useRef, useState } from 'react'
import { cn } from '@renderer/utils'

/**
 * FloatingNoteTitle 浮动笔记标题组件
 * @description 展示当前选中笔记标题，双击可进入重命名编辑状态
 * @param props {@link FloatingNoteTitleProps}
 */
export const FloatingNoteTitle = memo(
  ({ className, ...props }: FloatingNoteTitleProps): ReactElement | null => {
    const selectedNoteTitle = useNoteStore((state) => state.selectedNote?.title)
    const renameNote = useNoteStore((state) => state.renameNote)
    /** 是否处于重命名编辑状态 */
    const [editing, setEditing] = useState(false)
    /** 编辑中的标题文本 */
    const [editValue, setEditValue] = useState('')
    /** 是否正在执行重命名请求 */
    const [renaming, setRenaming] = useState(false)
    /** 标题输入框 Ref，用于聚焦和选中 */
    const inputRef = useRef<HTMLInputElement>(null)

    if (!selectedNoteTitle) return null

    const startEditing = (): void => {
      setEditValue(selectedNoteTitle)
      setEditing(true)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }

    const commitRename = async (): Promise<void> => {
      if (renaming) return
      const newTitle = editValue.trim()
      setEditing(false)
      if (newTitle && newTitle !== selectedNoteTitle) {
        setRenaming(true)
        try {
          await renameNote(newTitle)
        } finally {
          setRenaming(false)
        }
      }
    }

    const cancelEditing = (): void => {
      setEditing(false)
    }

    return (
      <div className={cn('flex justify-center pb-1', className)} {...props}>
        {editing ? (
          /* 重命名输入框 */
          <input
            ref={inputRef}
            disabled={renaming}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') cancelEditing()
            }}
            className="rounded-[6px] bg-[var(--hover)] px-2 py-0.5 text-center text-[13px] text-[var(--text-1)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--text-2)]"
          />
        ) : (
          /* 标题文本，双击进入编辑 */
          <span
            onDoubleClick={startEditing}
            title="双击重命名"
            className="cursor-default select-none text-[13px] font-medium text-[var(--text-1)] transition-colors hover:text-[var(--text-2)]"
          >
            {selectedNoteTitle}
          </span>
        )}
      </div>
    )
  }
)
FloatingNoteTitle.displayName = 'FloatingNoteTitle'
