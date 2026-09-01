/**
 * @file constant.ts
 * @description 应用级常量定义文件，包含应用目录名、文件编码格式以及 IPC 通信频道名称，在主进程、预加载脚本和渲染进程之间共享
 */

/** 笔记文件存储的目录名，位于用户主目录下 */
export const appDirectoryName = 'NoteMark'

/** 笔记文件的读写编码格式 */
export const fileEncoding = 'utf-8'

/** 根据笔记标题生成默认笔记内容 */
export const DEFAULT_NOTE_TEMPLATE = (title: string): string => `# ${title}\n`

/** 文件写入标志：仅当文件不存在时创建（独占创建），文件已存在时抛出 EEXIST */
export const FILE_FLAG_CREATE_EXCLUSIVE = 'wx'

/**
 * IPC 通信频道名称常量集合
 */
export const NoteChannel = {
  /** 获取笔记列表频道 */
  GET_NOTES: 'notes:get',
  /** 读取笔记内容频道 */
  READ_NOTE: 'notes:read',
  /** 写入笔记内容频道 */
  WRITE_NOTE: 'notes:write',
  /** 创建笔记频道 */
  CREATE_NOTE: 'notes:create',
  /** 删除笔记频道 */
  DELETE_NOTE: 'notes:delete',
  /** 重命名笔记频道 */
  RENAME_NOTE: 'notes:rename',
  /** 弹出新建笔记对话框频道 */
  PROMPT_CREATE: 'dialog:prompt-create'
} as const

/**
 * 窗口控制 IPC 频道常量集合
 */
export const WindowChannel = {
  /** 最小化窗口 */
  MINIMIZE: 'window:minimize',
  /** 切换最大化/还原 */
  MAXIMIZE: 'window:maximize',
  /** 关闭窗口 */
  CLOSE: 'window:close',
  /** 查询窗口是否最大化 */
  IS_MAXIMIZED: 'window:is-maximized',
  /** 窗口最大化状态变化事件（主进程到渲染进程） */
  ON_MAXIMIZE_CHANGE: 'window:on-maximize-change'
} as const
