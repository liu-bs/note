/**
 * @file DeleteConfirmDialog.tsx
 * @description 删除确认弹框 — macOS 风格按钮布局，danger 色标示
 */
import { useNoteStore } from '@renderer/store'
import { ReactElement, useEffect } from 'react'

/**
 * DeleteConfirmDialog 删除确认弹框
 * @description 笔记删除前弹出确认，支持 ESC 取消和遮罩点击取消
 */
export const DeleteConfirmDialog = (): ReactElement | null => {
  const pendingDeleteTitle = useNoteStore((state) => state.pendingDeleteTitle)
  const confirmDeleteNote = useNoteStore((state) => state.confirmDeleteNote)
  const cancelDelete = useNoteStore((state) => state.cancelDelete)

  /**
   * 弹框打开时监听 ESC 键取消删除
   */
  useEffect(() => {
    if (!pendingDeleteTitle) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') cancelDelete()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pendingDeleteTitle, cancelDelete])

  if (!pendingDeleteTitle) return null

  return (
    <div
      onClick={cancelDelete}
      className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] dark:bg-black/55"
    >
      {/* 弹框主体 */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="dialog-body paper-surface w-[300px] rounded-[12px] p-5 shadow-[var(--paper-shadow)] ring-1 ring-[var(--paper-ring)]"
      >
        {/* 弹框标题 */}
        <h2 id="delete-dialog-title" className="text-[15px] font-semibold text-[var(--text-1)]">
          删除笔记
        </h2>
        {/* 删除提示文案 */}
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-2)]">
          「{pendingDeleteTitle}」将被永久删除，此操作不可恢复。
        </p>
        {/* 按钮组 */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            autoFocus
            onClick={cancelDelete}
            className="rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-2)] transition-all hover:bg-[var(--hover)] hover:text-[var(--text-1)] active:scale-95"
          >
            取消
          </button>
          <button
            onClick={() => void confirmDeleteNote()}
            className="rounded-[8px] bg-[var(--danger)] px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:opacity-90 active:scale-95"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
