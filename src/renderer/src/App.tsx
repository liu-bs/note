/**
 * @file App.tsx
 * @description 应用根组件，组合整体布局、拖拽导入 Markdown 文件、笔记切换等交互逻辑
 */
import {
  AppLayout,
  Content,
  DeleteConfirmDialog,
  DraggableTopBar,
  FloatingNoteTitle,
  MarkdownEditor,
  NoteList,
  Sidebar,
  SidebarHeader
} from '@renderer/components'
import { useNoteStore } from '@renderer/store'
import { ReactElement, useCallback, useRef, useState } from 'react'

/**
 * App 应用根组件，组合侧边栏与编辑区布局，支持拖拽导入 .md 文件
 */
const App = (): ReactElement => {
  /** 内容区滚动容器 Ref，用于切换笔记时重置滚动位置 */
  const containerRef = useRef<HTMLDivElement>(null)

  /** 批量打开笔记的方法 */
  const batchOpenNote = useNoteStore((state) => state.batchOpenNote)

  /** 拖拽悬浮标记，控制导入遮罩显示 */
  const [dragOver, setDragOver] = useState<boolean>(false)
  /** 拖拽进出计数器 Ref，解决子元素 dragleave 闪烁问题 */
  const dragCounterRef = useRef<number>(0)

  /**
   * 处理文件拖放，筛选 .md 文件并批量导入
   * @param e 拖放事件对象
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent): Promise<void> => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      dragCounterRef.current = 0

      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.md'))
      if (files.length === 0) return

      const items = await Promise.all(
        files.map(async (file) => ({
          title: file.name.replace(/\.md$/i, ''),
          content: await file.text()
        }))
      )
      await batchOpenNote(items)
    },
    [batchOpenNote]
  )

  /**
   * 重置内容区滚动位置到顶部
   */
  const resetScroll = useCallback((): void => {
    containerRef.current?.scrollTo({ top: 0 })
  }, [])

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounterRef.current++
        setDragOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        dragCounterRef.current--
        if (dragCounterRef.current <= 0) {
          setDragOver(false)
          dragCounterRef.current = 0
        }
      }}
      onDrop={handleDrop}
      className="relative h-full"
    >
      <DraggableTopBar />
      <AppLayout>
        {/* 侧边栏区域 */}
        <Sidebar className="flex flex-col px-1.5 py-2">
          <SidebarHeader />
          <NoteList className="mt-0.5 flex-1 space-y-px overflow-y-auto" onSelect={resetScroll} />
        </Sidebar>
        {/* 内容编辑区 */}
        <Content
          ref={containerRef}
          className="flex flex-col overflow-hidden border-l border-[var(--sidebar-divider)] bg-[var(--app-bg)]"
        >
          <FloatingNoteTitle className="shrink-0 pt-2.5" />
          <MarkdownEditor />
        </Content>
      </AppLayout>
      <DeleteConfirmDialog />

      {/* 拖拽导入遮罩 */}
      {dragOver && (
        <div className="drag-overlay pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-bg)]/85 backdrop-blur-[6px]">
          <div className="flex flex-col items-center gap-4 rounded-[16px] border-2 border-dashed border-[var(--text-2)]/40 px-16 py-14 text-[var(--text-1)]">
            <svg
              className="h-10 w-10 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V4.5m0 0L7.5 9M12 4.5L16.5 9M5 19.5h14"
              />
            </svg>
            <span className="text-[13px] opacity-60">松开以导入 Markdown 文件</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
