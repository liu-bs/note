/**
 * @file MarkdownEditor.tsx
 * @description Markdown 编辑器主组件 — 工具栏、编辑区、预览区、拖拽分隔线、滚动同步
 */
import { useCallback, useEffect, useRef, useState, ReactElement, UIEventHandler } from 'react'
import { Toolbar } from '@renderer/components/Toolbar'
import { MarkdownPreview } from '@renderer/components/MarkdownPreview'
import { useMarkdownEditorState } from '@renderer/hooks/useMarkdownEditorState'
import type { ViewMode } from '@renderer/types'

/** localStorage 存储视图模式的键名 */
const LS_VIEW_MODE = 'notemark:viewMode'
/** localStorage 存储分屏比例的键名 */
const LS_SPLIT_RATIO = 'notemark:splitRatio'

/**
 * MarkdownEditor Markdown 编辑器主组件
 * @returns 编辑器 UI 或 null
 */
export const MarkdownEditor = (): ReactElement | null => {
  const {
    selectedNote,
    markdown,
    previewMarkdown,
    textareaRef,
    updateMarkdown,
    throttledSave,
    flushSave,
    insertAtCursor,
    onKeyDown
  } = useMarkdownEditorState()

  /** 当前视图模式（编辑/分屏/预览） */
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(LS_VIEW_MODE) as ViewMode) || 'split'
  )
  /** 分屏模式下编辑区与预览区的宽度比例 */
  const [splitRatio, setSplitRatio] = useState(
    () => Number(localStorage.getItem(LS_SPLIT_RATIO)) || 0.5
  )

  /**
   * 视图模式变更时持久化到 localStorage
   */
  useEffect(() => {
    localStorage.setItem(LS_VIEW_MODE, viewMode)
  }, [viewMode])

  /**
   * 分屏比例变更时持久化到 localStorage
   */
  useEffect(() => {
    localStorage.setItem(LS_SPLIT_RATIO, String(splitRatio))
  }, [splitRatio])

  /** 编辑器外层容器 Ref，用于拖拽分隔线时获取容器宽度 */
  const containerRef = useRef<HTMLDivElement>(null)
  /** 预览区滚动容器 Ref，用于滚动同步 */
  const previewScrollRef = useRef<HTMLDivElement>(null)

  /** 当前正在滚动的源面板标记，防止滚动同步循环触发 */
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null)
  /** 滚动同步的 requestAnimationFrame 句柄 */
  const scrollRafRef = useRef<number | null>(null)

  /** 是否正在拖拽分隔线 */
  const draggingRef = useRef(false)
  /** 拖拽分隔线移动的 requestAnimationFrame 句柄 */
  const rafRef = useRef<number | null>(null)

  /**
   * 分隔线鼠标按下处理，启动拖拽监听
   */
  const onMouseDown = useCallback(() => {
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: MouseEvent): void => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const clamped = Math.min(0.85, Math.max(0.15, ratio))
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setSplitRatio(clamped)
      })
    }

    const onUp = (): void => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  /**
   * 组件卸载时清理残留的 requestAnimationFrame
   */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  /**
   * 根据源面板滚动比例同步目标面板滚动位置
   * @param source 滚动源 DOM 元素
   * @param target 需要同步的目标 DOM 元素
   */
  const syncScroll = useCallback((source: HTMLElement, target: HTMLElement): void => {
    const sourceMax = source.scrollHeight - source.clientHeight
    if (sourceMax <= 0) return
    const ratio = source.scrollTop / sourceMax
    const targetMax = target.scrollHeight - target.clientHeight
    target.scrollTop = ratio * targetMax
  }, [])

  /**
   * 获取编辑器和预览区的 DOM 元素，供滚动同步使用
   */
  const getScrollTargets = useCallback(() => {
    const textarea = textareaRef.current
    const preview = previewScrollRef.current
    if (!textarea || !preview) return null
    return { textarea, preview }
  }, [textareaRef, previewScrollRef])

  /**
   * 编辑区滚动事件处理，同步预览区滚动位置
   */
  const onEditorScroll = useCallback<UIEventHandler<HTMLTextAreaElement>>(() => {
    if (viewMode !== 'split') return
    if (isScrollingRef.current === 'preview') {
      isScrollingRef.current = null
      return
    }
    const targets = getScrollTargets()
    if (!targets) return
    isScrollingRef.current = 'editor'
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const t = getScrollTargets()
      if (t) {
        syncScroll(targets.textarea, t.preview)
      }
    })
  }, [viewMode, syncScroll, getScrollTargets])

  /**
   * 预览区滚动事件处理，同步编辑区滚动位置
   */
  const onPreviewScroll = useCallback<UIEventHandler<HTMLDivElement>>(() => {
    if (viewMode !== 'split') return
    if (isScrollingRef.current === 'editor') {
      isScrollingRef.current = null
      return
    }
    const targets = getScrollTargets()
    if (!targets) return
    isScrollingRef.current = 'preview'
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const t = getScrollTargets()
      if (t) {
        syncScroll(targets.preview, t.textarea)
      }
    })
  }, [viewMode, syncScroll, getScrollTargets])

  const showEditor = viewMode === 'split' || viewMode === 'editor'
  const showPreview = viewMode === 'split' || viewMode === 'preview'
  const editorWidth = viewMode === 'split' ? `${splitRatio * 100}%` : '100%'
  const previewWidth = viewMode === 'split' ? `${(1 - splitRatio) * 100}%` : '100%'

  if (!selectedNote) return null
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 编辑器工具栏 */}
      <Toolbar onAction={insertAtCursor} viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 编辑区与预览区外层容器 */}
      <div className="min-h-0 flex-1 px-4 pb-4 pt-3">
        {/* 纸张样式面板 */}
        <div
          ref={containerRef}
          className="paper-surface relative mx-auto flex h-full w-full overflow-hidden rounded-[10px] shadow-[var(--paper-shadow)] ring-1 ring-[var(--paper-ring)]"
        >
          {/* 编辑区 */}
          {showEditor && (
            <div
              style={{ width: editorWidth }}
              className="editor-panel editor-panel-container h-full overflow-hidden"
            >
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => {
                  updateMarkdown(e.target.value)
                  throttledSave()
                }}
                onKeyDown={onKeyDown}
                onBlur={flushSave}
                onScroll={onEditorScroll}
                className="editor-textarea mx-auto block h-full w-full max-w-[720px] resize-none overflow-y-auto bg-transparent px-8 py-8 text-[var(--text-1)] outline-none"
                spellCheck={false}
              />
            </div>
          )}

          {/* 拖拽分隔线 */}
          {viewMode === 'split' && (
            <div
              onMouseDown={onMouseDown}
              className="editor-splitter absolute top-0 bottom-0 z-10 flex cursor-col-resize items-center justify-center"
              style={{ left: `${splitRatio * 100}%`, transform: 'translateX(-50%)', width: '6px' }}
            >
              <div className="splitter-line h-full w-px bg-[var(--border)]" />
              <div className="splitter-grip absolute h-8 w-[3px] rounded-full bg-[var(--border-strong)]" />
            </div>
          )}

          {/* 预览区 */}
          {showPreview && (
            <MarkdownPreview
              ref={previewScrollRef}
              content={previewMarkdown}
              width={previewWidth}
              onScroll={onPreviewScroll}
            />
          )}
        </div>
      </div>
    </div>
  )
}
