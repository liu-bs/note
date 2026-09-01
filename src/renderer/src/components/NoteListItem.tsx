/**
 * @file NoteListItem.tsx
 * @description 笔记列表项组件，展示笔记标题、修改时间，支持选中高亮及 hover 时删除操作
 */
import { useNoteStore } from '@renderer/store'
import { cn, formatDateFromMs } from '@renderer/utils'
import type { NotePreviewProps } from '@renderer/types'
import { Trash2 } from 'lucide-react'
import { memo, ReactElement, MouseEvent, useCallback } from 'react'

/**
 * NoteListItem 笔记列表项组件
 * @param props {@link NotePreviewProps}
 */
export const NoteListItem = memo(
  ({ title, lastModified, index, onSelect, isActive = false }: NotePreviewProps): ReactElement => {
    const requestDelete = useNoteStore((state) => state.requestDelete)

    /**
     * 列表项点击处理
     */
    const handleClick = useCallback(() => onSelect(index), [index, onSelect])

    /**
     * 删除按钮点击处理
     * @param e 原生鼠标事件
     */
    const handleDelete = useCallback(
      (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation()
        requestDelete(index)
      },
      [index, requestDelete]
    )

    return (
      <div
        onClick={handleClick}
        className={cn('group relative cursor-pointer rounded-[8px] px-2 py-2', {
          'bg-[var(--active)]': isActive,
          'hover:bg-[var(--hover)]': !isActive
        })}
      >
        {/* 选中状态指示条 */}
        <span
          aria-hidden
          className={cn(
            'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--text-1)] transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* 笔记标题 */}
        <h3
          className={cn(
            'truncate pl-2 pr-6 text-[13px] font-semibold',
            isActive
              ? 'text-[var(--text-1)]'
              : 'text-[var(--text-2)] group-hover:text-[var(--text-1)]'
          )}
        >
          {title}
        </h3>
        {/* 笔记修改时间 */}
        <time className="mt-1 block truncate pl-2 text-[11px] text-[var(--text-2)]">
          {formatDateFromMs(lastModified)}
        </time>
        {/* 删除笔记按钮 */}
        <button
          onClick={handleDelete}
          title="删除此笔记"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-[6px] p-1 text-[var(--text-2)] opacity-0 transition-opacity hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] active:scale-90 focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`删除笔记 ${title}`}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    )
  }
)
NoteListItem.displayName = 'NoteListItem'
