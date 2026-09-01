/**
 * @file 全局 Window 类型声明
 * @description 为渲染进程扩展 window.api 和 window.context 的类型定义，使渲染进程获得类型安全的访问能力
 */
import type { NoteInfo } from '@shared/types'

export {}

declare global {
  interface Window {
    /**
     * 预加载脚本注入的上下文信息
     */
    context: {
      /** 浏览器语言环境标识，如 'zh-CN'、'en-US' */
      locale: string
      /** 当前操作系统平台，如 'darwin'、'win32'、'linux' */
      platform: string
    }
    /**
     * 预加载脚本注入的笔记操作 API
     */
    api: {
      /** 获取所有笔记列表，按修改时间降序排列 */
      getNotes: () => Promise<NoteInfo[]>
      /** 读取指定笔记的文件内容 */
      readNote: (title: string) => Promise<string>
      /** 将内容写入指定笔记文件，返回文件最后修改时间戳（mtimeMs） */
      writeNote: (title: string, content: string) => Promise<number>
      /** 创建新笔记文件 */
      createNote: (title: string) => Promise<void>
      /** 删除指定笔记文件 */
      deleteNote: (title: string) => Promise<void>
      /** 重命名笔记文件 */
      renameNote: (oldTitle: string, newTitle: string) => Promise<void>
      /** 弹出系统保存对话框获取新笔记标题，返回标题字符串或 null（用户取消） */
      promptCreate: () => Promise<string | null>
      /** 最小化窗口 */
      windowMinimize: () => Promise<void>
      /** 切换窗口最大化/还原 */
      windowMaximize: () => Promise<void>
      /** 关闭窗口 */
      windowClose: () => Promise<void>
      /** 查询窗口是否已最大化 */
      windowIsMaximized: () => Promise<boolean>
      /** 订阅窗口最大化状态变化事件，返回取消订阅的清理函数 */
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
