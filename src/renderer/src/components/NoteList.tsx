/**
 * @file NoteList.tsx
 * @description 笔记列表组件，渲染 NoteListItem 列表，空列表时展示占位提示
 */
import { NoteListItem } from '@renderer/components/NoteListItem'
import { useNotesList } from '@renderer/hooks/useNotesList'
import type { NoteListProps } from '@renderer/types'
import { FileText } from 'lucide-react'
import { memo, ReactElement } from 'react'
import { cn } from '@renderer/utils'

/**
 * NoteList 笔记列表组件
 * @param props {@link NoteListProps}
 */
export const NoteList = memo(({ className, onSelect, ...props }: NoteListProps): ReactElement => {
  const { notes, handleSelectNote, selectNoteIndex } = useNotesList({ onSelect })
  if (notes.length === 0) {
    return (
      <ul className={cn('px-2 pt-20', className)} {...props}>
        {/* 空列表占位内容 */}
        <li className="flex flex-col items-center gap-2 text-[var(--text-2)]">
          <FileText aria-hidden className="h-6 w-6 opacity-30" strokeWidth={1.5} />
          <span className="text-[13px] text-[var(--text-2)]">暂无笔记</span>
          <span className="text-[11px] text-[var(--text-3)]">点击右上角 +，写下第一篇</span>
        </li>
      </ul>
    )
  }
  return (
    <ul className={className} {...props}>
      {notes.map((note, index) => (
        <NoteListItem
          isActive={selectNoteIndex === index}
          key={note.title}
          index={index}
          onSelect={handleSelectNote}
          title={note.title}
          lastModified={note.lastModified}
        />
      ))}
    </ul>
  )
})
NoteList.displayName = 'NoteList'
