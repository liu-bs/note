/**
 * @file index.ts
 * @description 渲染进程类型定义与共享常量，合并自 note/editor/hooks/store/components 五个模块
 */
import type { ComponentProps, RefObject } from 'react'
import type { NoteInfo } from '@shared/types'

// ─── note.ts ──────────────────────────────────────────────

export type { NoteInfo } from '@shared/types'

/** 当前选中的笔记完整数据，在 NoteInfo 基础上扩展 content 字段 */
export type SelectedNote = NoteInfo & {
  /** 笔记正文内容，Markdown 格式 */
  content: string
}

// ─── editor.ts ────────────────────────────────────────────

/** 工具栏操作配置 */
export type ToolbarAction = {
  label: string
  title: string
  type: 'wrap' | 'linePrefix' | 'block' | 'insert'
  prefix?: string
  suffix?: string
  placeholder?: string
  block?: string
  text?: string
}

/** 编辑器视图模式 */
export type ViewMode = 'split' | 'editor' | 'preview'

/** 快捷键绑定的加粗 action，Toolbar 与 useMarkdownEditorState 共享 */
export const BOLD_ACTION: ToolbarAction = {
  label: 'B',
  title: '加粗 (Ctrl+B)',
  type: 'wrap',
  prefix: '**',
  suffix: '**',
  placeholder: '加粗'
}

/** 快捷键绑定的斜体 action，Toolbar 与 useMarkdownEditorState 共享 */
export const ITALIC_ACTION: ToolbarAction = {
  label: 'I',
  title: '斜体 (Ctrl+I)',
  type: 'wrap',
  prefix: '*',
  suffix: '*',
  placeholder: '斜体'
}

// ─── hooks.ts ─────────────────────────────────────────────

export type UseNotesListOptions = {
  onSelect?: () => void
}

export type UseNotesListReturn = {
  notes: NoteInfo[]
  selectNoteIndex: number | null
  handleSelectNote: (index: number) => void
}

export type UseMarkdownEditorStateReturn = {
  selectedNote: SelectedNote | null
  markdown: string
  previewMarkdown: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  updateMarkdown: (updater: string | ((prev: string) => string)) => void
  throttledSave: () => void
  flushSave: () => void
  insertAtCursor: (action: ToolbarAction) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

// ─── store.ts ─────────────────────────────────────────────

export type NoteStore = {
  notes: NoteInfo[]
  selectedIndex: number | null
  selectedNote: SelectedNote | null
  skipNextLoad: boolean
  pendingDeleteTitle: string | null
  initialized: boolean

  initNotes: () => Promise<void>
  selectNote: (index: number) => void
  loadSelectedNote: () => Promise<void>
  createNote: () => Promise<void>
  requestDelete: (index: number) => void
  confirmDeleteNote: () => Promise<void>
  cancelDelete: () => void
  renameNote: (newTitle: string) => Promise<void>
  saveNote: (payload: { title: string; content: string }) => Promise<void>
  saveAndRefreshNote: (payload: { title: string; content: string }) => Promise<void>
  openNote: (title: string, content: string) => Promise<void>
  batchOpenNote: (items: { title: string; content: string }[]) => Promise<void>
}

// ─── components.ts ────────────────────────────────────────

export type ActionButtonProps = ComponentProps<'button'>

export type NotePreviewProps = NoteInfo & {
  isActive?: boolean
  index: number
  onSelect: (index: number) => void
}

export type NoteListProps = ComponentProps<'ul'> & {
  onSelect?: () => void
}

export type FloatingNoteTitleProps = ComponentProps<'div'>

export type SidebarHeaderProps = ComponentProps<'div'>
