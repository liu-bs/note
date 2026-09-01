/**
 * @file useMarkdownEditorState.ts
 * @description Markdown 编辑器状态管理 Hook，封装笔记加载、节流保存、防抖预览、光标插入、快捷键等核心逻辑
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNoteStore } from '@renderer/store'
import type { ToolbarAction, UseMarkdownEditorStateReturn } from '@renderer/types'
import { BOLD_ACTION, ITALIC_ACTION } from '@renderer/types'

/** 保存节流间隔时间，单位毫秒 */
const SAVE_THROTTLE_MS = 1000
/** 预览防抖延迟时间，单位毫秒 */
const PREVIEW_DEBOUNCE_MS = 300

/**
 * useMarkdownEditorState 整合编辑器内容状态、节流保存、防抖预览、光标插入格式化、快捷键等功能
 * @returns 编辑器状态和操作方法
 * @example
 * const { markdown, previewMarkdown, updateMarkdown, throttledSave, flushSave, insertAtCursor, onKeyDown } = useMarkdownEditorState()
 */
export const useMarkdownEditorState = (): UseMarkdownEditorStateReturn => {
  /** 当前选中的笔记对象 */
  const selectedNote = useNoteStore((state) => state.selectedNote)
  /** 当前选中笔记的索引 */
  const selectedIndex = useNoteStore((state) => state.selectedIndex)
  /** 加载选中笔记内容的方法 */
  const loadSelectedNote = useNoteStore((state) => state.loadSelectedNote)

  /**
   * 选中笔记索引变化时异步加载笔记内容
   */
  useEffect(() => {
    void loadSelectedNote()
  }, [loadSelectedNote, selectedIndex])

  /** 编辑器 textarea DOM 引用 */
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /** 编辑器内容 ref，用于在回调中获取最新值 */
  const markdownRef = useRef<string>(selectedNote?.content ?? '')
  /** 当前选中笔记 ref，用于在回调中获取最新值 */
  const selectedNoteRef = useRef(selectedNote)
  /** 上次已保存内容 ref，用于判断是否需要保存 */
  const lastSavedContentRef = useRef<string>(selectedNote?.content ?? '')
  /** 上次保存时间戳 ref，用于节流计算 */
  const lastSavedAtRef = useRef<number>(0)
  /** 节流定时器 ref，用于管理延迟保存 */
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 当前笔记的唯一标识，用于检测笔记切换 */
  const noteKey = selectedNote?.title ?? '__empty__'
  /** 当前笔记的初始内容 */
  const initialContent = selectedNote?.content ?? ''

  /** 编辑器当前 Markdown 内容 */
  const [markdown, setMarkdown] = useState<string>(initialContent)
  /** 预览面板的 Markdown 内容，防抖更新 */
  const [previewMarkdown, setPreviewMarkdown] = useState<string>(initialContent)

  /** 上一次笔记标识，用于渲染期间检测笔记切换 */
  const [prevNoteKey, setPrevNoteKey] = useState(noteKey)
  if (noteKey !== prevNoteKey) {
    setPrevNoteKey(noteKey)
    setMarkdown(initialContent)
    setPreviewMarkdown(initialContent)
  }

  /**
   * 笔记切换后同步更新已保存内容 ref
   */
  useEffect(() => {
    lastSavedContentRef.current = initialContent
  }, [noteKey, initialContent])

  /** 保存笔记的方法 */
  const saveNote = useNoteStore((state) => state.saveNote)
  /** 保存并刷新笔记的方法 */
  const saveAndRefreshNote = useNoteStore((state) => state.saveAndRefreshNote)

  /**
   * 编辑器内容变化时同步更新 markdownRef
   */
  useEffect(() => {
    markdownRef.current = markdown
  }, [markdown])

  /**
   * 选中笔记变化时同步更新 selectedNoteRef
   */
  useEffect(() => {
    selectedNoteRef.current = selectedNote
  }, [selectedNote])

  /**
   * 编辑器内容变化后防抖更新预览内容
   */
  useEffect(() => {
    const timer = setTimeout(() => setPreviewMarkdown(markdown), PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [markdown])

  /**
   * 更新编辑器 Markdown 内容
   * @param updater 新内容字符串或基于前值计算的函数
   */
  const updateMarkdown = useCallback((updater: string | ((prev: string) => string)) => {
    setMarkdown((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      markdownRef.current = next
      return next
    })
  }, [])

  /**
   * 构建保存负载，内容未变化时返回 null
   * @returns 保存负载对象或 null
   */
  const getSavePayload = useCallback((): { title: string; content: string } | null => {
    const note = selectedNoteRef.current
    if (!note) return null
    const content = markdownRef.current
    if (content === lastSavedContentRef.current) return null
    return { title: note.title, content }
  }, [])

  /**
   * 节流保存笔记内容，间隔不足时设置延迟定时器
   */
  const throttledSave = useCallback(() => {
    const payload = getSavePayload()
    if (!payload) return

    const now = Date.now()
    const elapsed = now - lastSavedAtRef.current

    if (elapsed >= SAVE_THROTTLE_MS) {
      lastSavedAtRef.current = now
      lastSavedContentRef.current = payload.content
      saveNote(payload)
    } else if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null
        const p = getSavePayload()
        if (!p) return
        lastSavedAtRef.current = Date.now()
        lastSavedContentRef.current = p.content
        saveNote(p)
      }, SAVE_THROTTLE_MS - elapsed)
    }
  }, [getSavePayload, saveNote])

  /**
   * 立即刷新保存，清除节流定时器并同步保存并刷新笔记
   */
  const flushSave = useCallback(() => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = null
    }
    const payload = getSavePayload()
    if (!payload) return
    lastSavedAtRef.current = Date.now()
    lastSavedContentRef.current = payload.content
    saveAndRefreshNote(payload)
  }, [getSavePayload, saveAndRefreshNote])

  /**
   * 在光标位置插入格式化内容
   * @param action 工具栏操作配置
   */
  const insertAtCursor = useCallback(
    (action: ToolbarAction): void => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const current = markdownRef.current
      const before = current.substring(0, start)
      const selected = current.substring(start, end)
      const after = current.substring(end)

      if (action.type === 'wrap') {
        const content = selected || action.placeholder || ''
        const newText = `${action.prefix}${content}${action.suffix}`
        updateMarkdown(before + newText + after)
        requestAnimationFrame(() => {
          textarea.focus()
          const selStart = start + (action.prefix?.length || 0)
          textarea.setSelectionRange(selStart, selStart + content.length)
        })
        return
      }

      if (action.type === 'linePrefix') {
        const lineStart = before.lastIndexOf('\n') + 1
        const selectedText = current.substring(lineStart, end)
        const lines = selectedText.split('\n')
        const newLines = lines.map((line) => {
          if (line.startsWith(action.prefix!)) {
            return line.slice(action.prefix!.length)
          }
          return action.prefix! + line
        })
        const newText = newLines.join('\n')
        const newMarkdown = current.substring(0, lineStart) + newText + after
        updateMarkdown(newMarkdown)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.setSelectionRange(lineStart, lineStart + newText.length)
        })
        return
      }

      if (action.type === 'block') {
        const content = selected || action.placeholder || ''
        const newText = `\`\`\`${action.block || ''}\n${content}\n\`\`\`\n`
        updateMarkdown(before + newText + after)
        requestAnimationFrame(() => {
          textarea.focus()
          const codeStart = start + `\`\`\`${action.block || ''}\n`.length
          textarea.setSelectionRange(codeStart, codeStart + content.length)
        })
        return
      }

      if (action.type === 'insert') {
        const insertText = action.text || ''
        updateMarkdown(before + insertText + after)
        requestAnimationFrame(() => {
          textarea.focus()
          const pos = start + insertText.length
          textarea.setSelectionRange(pos, pos)
        })
      }
    },
    [updateMarkdown]
  )

  /**
   * 处理编辑器键盘快捷键，包括加粗、斜体、Tab 缩进
   * @param e 键盘事件对象
   */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        insertAtCursor(BOLD_ACTION)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        insertAtCursor(ITALIC_ACTION)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const current = markdownRef.current
        const newMarkdown = current.substring(0, start) + '  ' + current.substring(end)
        updateMarkdown(newMarkdown)
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 2, start + 2)
        })
      }
    },
    [insertAtCursor, updateMarkdown]
  )

  /** 最新的 flushSave 引用，供 cleanup effect 调用 */
  const flushSaveRef = useRef(flushSave)

  /**
   * 同步最新的 flushSave 到 ref，使 cleanup effect 能调用最新闭包
   */
  useEffect(() => {
    flushSaveRef.current = flushSave
  }, [flushSave])

  /**
   * 组件卸载时刷新保存并清除节流定时器
   */
  useEffect(() => {
    return () => {
      flushSaveRef.current()
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }
    }
  }, [])

  return {
    selectedNote,
    markdown,
    previewMarkdown,
    textareaRef,
    updateMarkdown,
    throttledSave,
    flushSave,
    insertAtCursor,
    onKeyDown
  }
}
