/**
 * @file sanitize.ts
 * @description 笔记标题安全处理 — 防路径穿越、null 字节、控制字符、Windows 保留名
 *  隔离为独立模块以便 self-check 在 Node.js 中直接测试，无需 electron 运行时
 */
import { basename } from 'path'

/** Windows 保留设备名正则 */
const WINDOWS_RESERVED = /^(con|prn|nul|aux|com[1-9]|lpt[1-9])(\.|$)/i

/**
 * 对笔记标题进行安全处理，防止路径穿越攻击
 * @param title 原始笔记标题
 * @returns 安全处理后的标题；结果为空则返回 'untitled'
 * @warning 必须在拼接文件路径前调用
 */
export const sanitizeTitle = (title: string): string => {
  const noNull = title.replace(/\0/g, '')
  const base = basename(noNull)
  const cleaned = Array.from(base)
    .filter((ch) => ch.codePointAt(0)! >= 0x20 && !'<>:"|?*'.includes(ch))
    .join('')
    .replace(/^\.+|\.+$/g, '')
    .trim()
  if (WINDOWS_RESERVED.test(cleaned)) return 'untitled'
  return cleaned || 'untitled'
}
