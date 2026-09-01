/**
 * @file NewNoteButton.tsx
 * @description 新建笔记按钮
 */
import { ActionButton } from '@renderer/components/Button/ActionButton'
import type { ActionButtonProps } from '@renderer/types'
import { FilePlus } from 'lucide-react'
import { ReactElement } from 'react'

/**
 * NewNoteButton 新建笔记按钮
 * @param props {@link ActionButtonProps}
 */
export const NewNoteButton = ({ ...props }: ActionButtonProps): ReactElement => {
  return (
    <ActionButton
      title="新建笔记"
      className="hover:bg-[var(--active)] hover:text-[var(--text-1)]"
      {...props}
    >
      {/* 新建笔记图标 */}
      <FilePlus className="h-4 w-4" strokeWidth={1.75} />
    </ActionButton>
  )
}
