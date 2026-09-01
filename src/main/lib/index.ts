/**
 * @file index.ts
 * @description 笔记文件操作库，直接操作文件系统与系统对话框，负责读取、写入、创建、删除、重命名笔记文件，提供安全路径处理以及新建笔记保存对话框，笔记以 .md 格式存储在用户主目录下的应用目录中
 */
import { homedir } from 'os'
import { join, basename } from 'path'
import { BrowserWindow, dialog } from 'electron'
import {
  appDirectoryName,
  fileEncoding,
  DEFAULT_NOTE_TEMPLATE,
  FILE_FLAG_CREATE_EXCLUSIVE
} from '@shared/constant'
import type { NoteInfo } from '@shared/types'
import { mkdir, readdir, readFile, writeFile, stat, rm, rename, access } from 'fs/promises'

/**
 * 获取笔记文件的根存储目录
 * @returns 笔记根存储目录的绝对路径
 * @example
 * getRootDir()
 */
export const getRootDir = (): string => {
  return join(homedir(), appDirectoryName)
}

import { sanitizeTitle } from './sanitize'
export { sanitizeTitle } from './sanitize'

/**
 * 根据笔记标题生成完整的文件路径
 * @param title 笔记标题
 * @returns 笔记文件的绝对路径（根目录 + 安全标题 + .md 后缀）
 */
const getNotePath = (title: string): string => join(getRootDir(), `${sanitizeTitle(title)}.md`)

/**
 * 读取笔记目录下所有 .md 文件并返回笔记信息列表
 * @returns 笔记信息数组，按修改时间降序排列，每项包含标题和最后修改时间戳
 * @example
 * const notes = await getNotes()
 */
export const getNotes = async (): Promise<NoteInfo[]> => {
  /** 笔记根存储目录 */
  const rootDir = getRootDir()
  try {
    await mkdir(rootDir, { recursive: true })
  } catch (error) {
    console.error(`[lib] 创建笔记目录失败: ${rootDir}`, error)
    return []
  }
  /** 根目录下的所有文件名 */
  let fileNames: string[]
  try {
    fileNames = await readdir(rootDir, { encoding: fileEncoding })
  } catch (error) {
    console.error(`[lib] 读取笔记目录失败: ${rootDir}`, error)
    return []
  }
  /** 筛选出 .md 格式的文件 */
  const mdFiles = fileNames.filter((f) => f.endsWith('.md'))

  /** 并发读取每个 .md 文件的元数据，组装为 NoteInfo 数组 */
  const results = await Promise.allSettled(
    mdFiles.map(async (fileName) => {
      const filePath = join(rootDir, fileName)
      const fileStat = await stat(filePath)
      return {
        title: fileName.replace(/\.md$/, ''),
        lastModified: fileStat.mtimeMs
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<NoteInfo> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.lastModified - a.lastModified)
}

/**
 * 读取指定笔记的文件内容
 * @param title 笔记标题
 * @returns 笔记内容字符串；若文件不存在或读取失败则返回空字符串
 * @example
 * const content = await readNote('我的笔记')
 */
export const readNote = async (title: string): Promise<string> => {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`readNote: 无效的标题参数 "${title}"`)
  }
  /** 笔记文件的完整路径 */
  const filePath = getNotePath(title)
  try {
    return await readFile(filePath, { encoding: fileEncoding })
  } catch (error) {
    const nodeErr = error as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') return ''
    throw error
  }
}

/**
 * 将内容写入指定笔记文件
 * @param title 笔记标题
 * @param content 要写入的笔记内容
 * @returns 写入后文件的最后修改时间戳（mtimeMs）
 * @example
 * const mtime = await writeNote('我的笔记', '# 标题\n内容')
 */
export const writeNote = async (title: string, content: string): Promise<number> => {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`writeNote: 无效的标题参数 "${title}"`)
  }
  if (typeof content !== 'string') {
    throw new Error(`writeNote: 无效的 content 参数`)
  }
  const filePath = getNotePath(title)
  await writeFile(filePath, content, { encoding: fileEncoding })
  const fileStat = await stat(filePath)
  return fileStat.mtimeMs
}

/**
 * 创建一个新笔记文件，写入默认标题行
 * @param title 笔记标题
 * @example
 * await createNote('新笔记')
 */
export const createNote = async (title: string): Promise<void> => {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`createNote: 无效的标题参数 "${title}"`)
  }
  const rootDir = getRootDir()
  await mkdir(rootDir, { recursive: true })
  const filePath = getNotePath(title)
  try {
    await writeFile(filePath, DEFAULT_NOTE_TEMPLATE(title), {
      encoding: fileEncoding,
      flag: FILE_FLAG_CREATE_EXCLUSIVE
    })
  } catch (error) {
    const nodeErr = error as NodeJS.ErrnoException
    if (nodeErr.code !== 'EEXIST') throw error
    console.warn(`[lib] 笔记已存在，跳过创建: ${title}`)
  }
}

/**
 * 删除指定笔记文件
 * @param title 笔记标题
 * @warning 此操作不可恢复，调用前应通过 UI 确认
 * @example
 * await deleteNote('废弃笔记')
 */
export const deleteNote = async (title: string): Promise<void> => {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`deleteNote: 无效的标题参数 "${title}"`)
  }
  const filePath = getNotePath(title)
  try {
    await rm(filePath)
  } catch (error) {
    const nodeErr = error as NodeJS.ErrnoException
    if (nodeErr.code !== 'ENOENT') throw error
    console.warn(`[lib] 笔记不存在，跳过删除: ${title}`)
  }
}

/**
 * 重命名笔记文件
 * @param oldTitle 原笔记标题
 * @param newTitle 新笔记标题
 * @throws 当目标笔记已存在时抛出 Error
 * @example
 * await renameNote('旧标题', '新标题')
 */
export const renameNote = async (oldTitle: string, newTitle: string): Promise<void> => {
  if (typeof oldTitle !== 'string' || !oldTitle.trim()) {
    throw new Error(`renameNote: 无效的 oldTitle 参数 "${oldTitle}"`)
  }
  if (typeof newTitle !== 'string' || !newTitle.trim()) {
    throw new Error(`renameNote: 无效的 newTitle 参数 "${newTitle}"`)
  }
  /** 原笔记文件的完整路径 */
  const oldPath = getNotePath(oldTitle)
  /** 新笔记文件的完整路径 */
  const newPath = getNotePath(newTitle)
  // 检查源文件是否存在
  try {
    await access(oldPath)
  } catch {
    console.warn(`[lib] 原笔记不存在，跳过重命名: ${oldTitle}`)
    return
  }
  // 检查目标文件是否已存在，防止重命名覆盖
  let targetExists = false
  try {
    await access(newPath)
    targetExists = true
  } catch {
    // access 抛异常表示文件不存在
  }
  if (targetExists) {
    throw new Error(`目标笔记已存在: ${newTitle}`)
  }
  await rename(oldPath, newPath)
}

/**
 * 弹出系统保存对话框，获取新笔记标题
 * @returns 用户输入的笔记标题（去掉 .md 后缀）；取消或无聚焦窗口时返回 null
 * @example
 * const title = await promptCreate()
 */
export const promptCreate = async (): Promise<string | null> => {
  /** 当前聚焦的浏览器窗口，用于挂载对话框 */
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const result = await dialog.showSaveDialog(win, {
    title: '新建笔记',
    defaultPath: getRootDir(),
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  })
  if (result.canceled || !result.filePath) return null
  /** 保存对话框返回的文件名，用作笔记标题 */
  const fileName = basename(result.filePath)
  return fileName.replace(/\.md$/i, '')
}
