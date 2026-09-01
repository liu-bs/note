/**
 * @file 笔记状态管理 Store
 * @description 基于 Zustand 创建的笔记应用状态管理，管理笔记列表、选中状态及笔记增删改查等异步操作
 */

import { create } from 'zustand'
import { DEFAULT_NOTE_TEMPLATE } from '@shared/constant'
import type { NoteStore } from '@renderer/types'

/**
 * 刷新笔记列表
 * @description 通过 IPC 获取最新笔记列表并更新 store 状态
 * @param set Zustand 的 set 函数，用于更新 store 状态
 * @returns 无返回值
 */
const refreshNotes = async (
  set: (fn: (s: NoteStore) => Partial<NoteStore>) => void
): Promise<void> => {
  const notes = await window.api.getNotes()
  set(() => ({ notes }))
}

/**
 * 笔记状态管理 store
 * @description 基于 Zustand 创建，提供笔记列表、选中状态及笔记增删改查等操作
 * @returns Zustand store 实例，包含笔记状态和操作方法
 * @example
 * const { notes, selectedNote, createNote } = useNoteStore()
 */
export const useNoteStore = create<NoteStore>((set, get) => ({
  /** 笔记列表 */
  notes: [],
  /** 当前选中的笔记索引，未选中时为 null */
  selectedIndex: null,
  /** 当前选中的笔记完整数据，未选中或未加载时为 null */
  selectedNote: null,
  /** 是否跳过下一次 loadSelectedNote 的 IPC 读取，用于创建/重命名后预加载场景 */
  skipNextLoad: false,
  /** 待确认删除的笔记标题，非 null 时显示应用内确认弹框 */
  pendingDeleteTitle: null,
  /** 是否已执行过初始加载，避免重复 IPC */
  initialized: false,

  /**
   * 初始化笔记列表
   * @description 仅首次调用有效，后续忽略；应用启动时调用一次，从主进程拉取笔记列表
   * @returns 无返回值
   */
  initNotes: async () => {
    if (get().initialized) return
    set(() => ({ initialized: true }))
    try {
      await refreshNotes(set)
    } catch (error) {
      console.error('[store] initNotes 失败:', error)
      set(() => ({ initialized: false }))
    }
  },

  /**
   * 选中指定索引的笔记
   * @param index 笔记索引
   * @returns 无返回值
   */
  selectNote: (index: number) => {
    set(() => ({ selectedIndex: index }))
  },

  /**
   * 根据当前选中索引从磁盘加载笔记内容
   * @description 若 skipNextLoad 为 true 则跳过 IPC 读取并重置标记；索引为 null 或笔记不存在时清空选中状态
   * @returns 无返回值
   */
  loadSelectedNote: async () => {
    if (get().skipNextLoad) {
      set(() => ({ skipNextLoad: false }))
      return
    }
    const index = get().selectedIndex
    const notes = get().notes
    if (index === null) {
      set(() => ({ selectedNote: null }))
      return
    }
    const note = notes[index]
    if (!note) {
      set(() => ({ selectedNote: null }))
      return
    }
    try {
      const content = await window.api.readNote(note.title)
      set(() => ({ selectedNote: { ...note, content } }))
    } catch (error) {
      console.error('[store] loadSelectedNote 失败:', error)
      set(() => ({ selectedNote: null }))
    }
  },

  /**
   * 创建新笔记
   * @description 弹出输入框获取标题，创建笔记后刷新列表并预加载内容，标记 skipNextLoad 避免冗余 IPC
   * @returns 无返回值
   */
  createNote: async () => {
    try {
      const title = await window.api.promptCreate()
      if (!title) return
      await window.api.createNote(title)
      await refreshNotes(set)
      // 按标题匹配找到新笔记索引，不依赖排序假设
      const notes = get().notes
      const newIndex = notes.findIndex((n) => n.title === title)
      const index = newIndex >= 0 ? newIndex : 0
      const newNote = notes[index]
      if (!newNote) {
        console.error('[store] createNote: 新建笔记未在列表中找到', title)
        return
      }
      // 新建笔记内容已知，标记跳过即将触发的 loadSelectedNote，避免冗余 IPC
      const content = DEFAULT_NOTE_TEMPLATE(title)
      set(() => ({
        selectedIndex: index,
        selectedNote: { ...newNote, content },
        skipNextLoad: true
      }))
    } catch (error) {
      console.error('[store] createNote 失败:', error)
    }
  },

  /**
   * 请求删除指定索引的笔记
   * @description 仅记录待删除标题，不改变选中状态，由应用内确认弹框接管后续流程
   * @param index 笔记在列表中的索引
   * @returns 无返回值
   */
  requestDelete: (index: number) => {
    const note = get().notes[index]
    set(() => ({
      pendingDeleteTitle: note?.title ?? null
    }))
  },

  /**
   * 确认删除笔记
   * @description 删除文件并刷新列表；若删除的是选中项且索引越界则清空选中，否则重新加载当前位置内容
   * @returns 无返回值
   */
  confirmDeleteNote: async () => {
    const title = get().pendingDeleteTitle
    if (!title) return
    try {
      await window.api.deleteNote(title)
      await refreshNotes(set)
      set(() => ({ pendingDeleteTitle: null }))
      const index = get().selectedIndex
      if (index === null || index >= get().notes.length) {
        set(() => ({ selectedIndex: null, selectedNote: null }))
        return
      }
      // 原位置的笔记已变化，重新加载当前位置内容
      await get().loadSelectedNote()
    } catch (error) {
      console.error('[store] confirmDeleteNote 失败:', error)
      // 弹框保持打开，用户可看到操作未成功
    }
  },

  /**
   * 取消删除
   * @description 关闭确认弹框，不执行任何删除操作
   * @returns 无返回值
   */
  cancelDelete: () => {
    set(() => ({ pendingDeleteTitle: null }))
  },

  /**
   * 重命名当前选中的笔记
   * @description 通过 IPC 重命名文件后刷新列表，若当前笔记已加载内容则保留内容并更新标题
   * @param newTitle 新笔记标题
   * @returns 无返回值
   */
  renameNote: async (newTitle: string) => {
    const notes = get().notes
    const index = get().selectedIndex
    if (index === null) return
    const note = notes[index]
    if (!note) return
    const oldTitle = note.title
    if (oldTitle === newTitle) return
    try {
      await window.api.renameNote(oldTitle, newTitle)
      await refreshNotes(set)
      const newIndex = get().notes.findIndex((n) => n.title === newTitle)
      set(() => ({ selectedIndex: newIndex >= 0 ? newIndex : null }))
      // 当前笔记已加载内容，保留内容但更新标题
      const current = get().selectedNote
      if (current && current.title === oldTitle) {
        set(() => ({ selectedNote: { ...current, title: newTitle }, skipNextLoad: true }))
      }
    } catch (error) {
      console.error('[store] renameNote 失败:', error)
    }
  },

  /**
   * 节流保存笔记
   * @description 仅写入文件，不更新笔记列表，零额外渲染，适用于编辑器节流自动保存场景
   * @param payload.title 笔记标题
   * @param payload.content 笔记正文内容
   * @returns 无返回值
   */
  saveNote: async ({ title, content }) => {
    try {
      await window.api.writeNote(title, content)
    } catch (error) {
      console.error('[store] saveNote 失败:', error)
    }
  },

  /**
   * 保存并刷新笔记
   * @description 写入文件后就地更新 lastModified 为真实文件 mtime，不重新拉取列表，适用于失焦或手动保存场景
   * @param payload.title 笔记标题
   * @param payload.content 笔记正文内容
   * @returns 无返回值
   */
  saveAndRefreshNote: async ({ title, content }) => {
    try {
      const mtimeMs = await window.api.writeNote(title, content)
      const notes = get().notes
      set(() => ({
        notes: notes.map((n) => (n.title === title ? { ...n, lastModified: mtimeMs } : n))
      }))
      const current = get().selectedNote
      if (current && current.title === title) {
        set(() => ({ selectedNote: { ...current, content, lastModified: mtimeMs } }))
      }
    } catch (error) {
      console.error('[store] saveAndRefreshNote 失败:', error)
    }
  },

  /**
   * 打开指定标题的笔记
   * @description 写入笔记文件后刷新列表并选中该笔记，标记 skipNextLoad 避免冗余 IPC
   * @param title 笔记标题
   * @param content 笔记内容
   * @returns 无返回值
   */
  openNote: async (title, content) => {
    try {
      await window.api.writeNote(title, content)
      await refreshNotes(set)
      const notes = get().notes
      const index = notes.findIndex((n) => n.title === title)
      if (index < 0) return
      const note = notes[index]
      set(() => ({
        selectedIndex: index,
        selectedNote: { ...note, content },
        skipNextLoad: true
      }))
    } catch (error) {
      console.error('[store] openNote 失败:', error)
    }
  },

  /**
   * 批量打开笔记
   * @description 批量写入文件后刷新列表并选中最后一篇笔记
   * @param items 笔记标题和内容数组
   * @returns 无返回值
   */
  batchOpenNote: async (items) => {
    if (items.length === 0) return
    try {
      await Promise.all(items.map(({ title, content }) => window.api.writeNote(title, content)))
      await refreshNotes(set)
      const notes = get().notes
      const last = items[items.length - 1]
      const index = notes.findIndex((n) => n.title === last.title)
      if (index < 0) return
      const note = notes[index]
      set(() => ({
        selectedIndex: index,
        selectedNote: { ...note, content: last.content },
        skipNextLoad: true
      }))
    } catch (error) {
      console.error('[store] batchOpenNote 失败:', error)
    }
  }
}))
