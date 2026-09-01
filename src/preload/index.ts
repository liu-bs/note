/**
 * @file 预加载脚本
 * @description 通过 contextBridge 向渲染进程暴露安全的 API 接口（笔记 CRUD 操作）和上下文信息（语言环境），使渲染进程可以与主进程进行 IPC 通信
 */
import { contextBridge, ipcRenderer } from 'electron'
import { NoteChannel, WindowChannel } from '@shared/constant'

if (!process.contextIsolated) {
  throw new Error('contextIsolated must be enabled in the Browserwindow')
}

try {
  // 暴露上下文信息到渲染进程的 window.context
  contextBridge.exposeInMainWorld('context', {
    /** 浏览器语言环境标识，如 'zh-CN' */
    locale: navigator.language,
    /** 当前操作系统平台，如 'darwin'、'win32'、'linux' */
    platform: process.platform
  })

  // 暴露笔记 CRUD API 到渲染进程的 window.api
  contextBridge.exposeInMainWorld('api', {
    /**
     * 获取所有笔记列表
     * @returns 笔记信息数组
     */
    getNotes: () => ipcRenderer.invoke(NoteChannel.GET_NOTES),
    /**
     * 读取指定笔记的内容
     * @param title 笔记标题
     * @returns 笔记文件内容字符串
     */
    readNote: (title: string) => ipcRenderer.invoke(NoteChannel.READ_NOTE, title),
    /**
     * 写入笔记内容
     * @param title 笔记标题
     * @param content 笔记正文内容
     * @returns 文件最后修改时间戳（mtimeMs）
     */
    writeNote: (title: string, content: string) =>
      ipcRenderer.invoke(NoteChannel.WRITE_NOTE, title, content),
    /**
     * 创建新笔记
     * @param title 笔记标题
     * @returns 无返回值
     */
    createNote: (title: string) => ipcRenderer.invoke(NoteChannel.CREATE_NOTE, title),
    /**
     * 删除笔记
     * @param title 笔记标题
     * @returns 无返回值
     */
    deleteNote: (title: string) => ipcRenderer.invoke(NoteChannel.DELETE_NOTE, title),
    /**
     * 重命名笔记
     * @param oldTitle 原笔记标题
     * @param newTitle 新笔记标题
     * @returns 无返回值
     */
    renameNote: (oldTitle: string, newTitle: string) =>
      ipcRenderer.invoke(NoteChannel.RENAME_NOTE, oldTitle, newTitle),
    /**
     * 弹出系统保存对话框，用于新建笔记时选择路径和文件名
     * @returns 标题字符串或 null（用户取消）
     */
    promptCreate: () => ipcRenderer.invoke(NoteChannel.PROMPT_CREATE),
    /**
     * 最小化窗口
     * @returns 无返回值
     */
    windowMinimize: () => ipcRenderer.invoke(WindowChannel.MINIMIZE),
    /**
     * 切换窗口最大化/还原
     * @returns 无返回值
     */
    windowMaximize: () => ipcRenderer.invoke(WindowChannel.MAXIMIZE),
    /**
     * 关闭窗口
     * @returns 无返回值
     */
    windowClose: () => ipcRenderer.invoke(WindowChannel.CLOSE),
    /**
     * 查询窗口是否最大化
     * @returns 是否已最大化
     */
    windowIsMaximized: () => ipcRenderer.invoke(WindowChannel.IS_MAXIMIZED),
    /**
     * 订阅窗口最大化状态变化事件
     * @param callback 窗口最大化状态变化回调函数
     * @returns 取消订阅的清理函数
     */
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_e: unknown, isMaximized: boolean): void => callback(isMaximized)
      ipcRenderer.on(WindowChannel.ON_MAXIMIZE_CHANGE, listener)
      return () => ipcRenderer.removeListener(WindowChannel.ON_MAXIMIZE_CHANGE, listener)
    }
  })
} catch (error) {
  // contextBridge 初始化失败时输出错误日志
  console.error('[preload] contextBridge 初始化失败:', error)
  throw error
}
