/**
 * @file types.ts
 * @description 跨进程共享的数据模型定义文件，主进程、预加载脚本和渲染进程三端共用，定义笔记相关的数据结构
 */

/**
 * 笔记信息
 */
export type NoteInfo = {
  /** 笔记标题，同时作为文件名（不含 .md 后缀） */
  title: string
  /** 最后修改时间戳（毫秒，源自文件系统 mtimeMs） */
  lastModified: number
}
