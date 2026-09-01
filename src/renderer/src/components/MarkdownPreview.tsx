/**
 * @file MarkdownPreview.tsx
 * @description Markdown 预览区 — react-markdown 渲染 + GFM + 代码高亮
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { forwardRef, memo, ReactElement, UIEventHandler } from 'react'

/** remark 插件列表，启用 GFM 语法支持 */
const remarkPlugins = [remarkGfm]
/** rehype 插件列表，启用代码语法高亮 */
const rehypePlugins = [rehypeHighlight]

/**
 * MarkdownPreviewProps 预览区组件属性类型
 */
type MarkdownPreviewProps = {
  /** Markdown 源文本 */
  content: string
  /** 预览区宽度 */
  width: string
  /** 滚动事件回调 */
  onScroll?: UIEventHandler<HTMLDivElement>
}

/**
 * MarkdownPreview Markdown 预览区组件
 * @description 使用 react-markdown 渲染 Markdown，支持 GFM 和代码高亮
 */
export const MarkdownPreview = memo(
  forwardRef<HTMLDivElement, MarkdownPreviewProps>(
    ({ content, width, onScroll }, ref): ReactElement => {
      return (
        <div
          ref={ref}
          onScroll={onScroll}
          className="editor-panel editor-panel-container h-full overflow-y-auto"
          style={{ width }}
        >
          {/* Markdown 渲染内容 */}
          <div className="markdown-preview mx-auto max-w-[720px] px-8 py-8">
            <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )
    }
  )
)
MarkdownPreview.displayName = 'MarkdownPreview'
