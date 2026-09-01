/**
 * @file Toolbar.tsx
 * @description Markdown 编辑器工具栏 — 格式化按钮组 + 视图模式分段控件
 */
import { cn } from '@renderer/utils'
import type { ToolbarAction, ViewMode } from '@renderer/types'
import { BOLD_ACTION, ITALIC_ACTION } from '@renderer/types'
import {
  Bold,
  Code,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  type LucideIcon
} from 'lucide-react'
import { Fragment, memo, ReactElement } from 'react'

/** 工具栏格式化按钮配置列表 */
const actions: ToolbarAction[] = [
  { label: 'H1', title: '一级标题', type: 'linePrefix', prefix: '# ', placeholder: '标题' },
  { label: 'H2', title: '二级标题', type: 'linePrefix', prefix: '## ', placeholder: '标题' },
  { label: 'H3', title: '三级标题', type: 'linePrefix', prefix: '### ', placeholder: '标题' },
  BOLD_ACTION,
  ITALIC_ACTION,
  { label: '~', title: '删除线', type: 'wrap', prefix: '~~', suffix: '~~', placeholder: '删除线' },
  { label: '`', title: '行内代码', type: 'wrap', prefix: '`', suffix: '`', placeholder: 'code' },
  { label: '<>', title: '代码块', type: 'block', block: 'js', placeholder: 'code' },
  { label: '•', title: '无序列表', type: 'linePrefix', prefix: '- ', placeholder: '列表项' },
  { label: '1.', title: '有序列表', type: 'linePrefix', prefix: '1. ', placeholder: '列表项' },
  { label: '"', title: '引用', type: 'linePrefix', prefix: '> ', placeholder: '引用' },
  { label: '---', title: '分隔线', type: 'insert', text: '\n---\n' }
]

/** 需要在按钮前插入分组的索引位置 */
const groupStarts = [3, 6, 8, 10]

/** 按钮标签与 Lucide 图标组件的映射表 */
const actionIcons: Record<string, LucideIcon> = {
  H1: Heading1,
  H2: Heading2,
  H3: Heading3,
  B: Bold,
  I: Italic,
  '~': Strikethrough,
  '`': Code,
  '<>': CodeXml,
  '•': List,
  '1.': ListOrdered,
  '"': Quote,
  '---': Minus
}

/** 视图模式选项列表 */
const viewModes: { mode: ViewMode; label: string }[] = [
  { mode: 'editor', label: '编辑' },
  { mode: 'split', label: '分屏' },
  { mode: 'preview', label: '预览' }
]

/**
 * ToolbarProps 工具栏组件属性类型
 */
type ToolbarProps = {
  /** 格式化按钮点击回调 */
  onAction: (action: ToolbarAction) => void
  /** 当前视图模式 */
  viewMode: ViewMode
  /** 视图模式切换回调 */
  onViewModeChange: (mode: ViewMode) => void
}

/**
 * Toolbar Markdown 编辑器工具栏
 * @description 提供格式化按钮组和视图模式切换控件
 * @param props {@link ToolbarProps}
 */
export const Toolbar = memo(
  ({ onAction, viewMode, onViewModeChange }: ToolbarProps): ReactElement => {
    const formatDisabled = viewMode === 'preview'
    return (
      <div className="flex items-center gap-0.5 border-b border-[var(--border)] px-3 py-1.5">
        {/* 格式化按钮组 */}
        {actions.map((action, i) => {
          const Icon = actionIcons[action.label]
          return (
            <Fragment key={action.label}>
              {groupStarts.includes(i) && (
                <div aria-hidden className="mx-1 h-3.5 w-px bg-[var(--border)]" />
              )}
              <button
                disabled={formatDisabled}
                title={action.title}
                onClick={() => onAction(action)}
                className="editor-toolbar-btn"
              >
                {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} /> : action.label}
              </button>
            </Fragment>
          )
        })}

        {/* 视图模式分段控件 */}
        <div className="ml-auto flex items-center gap-px rounded-[7px] bg-[var(--hover)] p-0.5">
          {viewModes.map(({ mode, label }) => {
            const active = viewMode === mode
            return (
              <button
                key={mode}
                disabled={active}
                title={active ? undefined : `切换为${label}视图`}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'rounded-[5px] px-2.5 py-[3px] text-[11px] font-medium transition-all',
                  active
                    ? 'cursor-default bg-[var(--raised-bg)] text-[var(--text-1)] shadow-[var(--raised-shadow)] ring-1 ring-[var(--raised-ring)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)] disabled:cursor-default disabled:opacity-100 disabled:hover:text-[var(--text-2)]'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)
Toolbar.displayName = 'Toolbar'
