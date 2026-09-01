/**
 * @file 渲染进程工具函数集
 * @description 提供 Tailwind 类名合并与时间戳格式化能力，供渲染进程各组件使用
 */

import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并并去重 Tailwind CSS 类名
 * @description 先通过 clsx 处理条件类名，再通过 tailwind-merge 去除冲突类
 * @param args 任意数量的类名参数，支持字符串、数组、对象等 ClassValue 格式
 * @returns 合并去重后的类名字符串
 * @example
 * cn('px-2 py-1', condition && 'bg-blue-500', { 'text-white': isActive })
 */
export const cn = (...args: ClassValue[]): string => twMerge(clsx(...args))

/** 基于 navigator.language 的短日期时间格式化器，使用本地时区 */
const dateFormat = new Intl.DateTimeFormat(window.context.locale, {
  dateStyle: 'short',
  timeStyle: 'short'
})

/**
 * 将毫秒时间戳格式化为本地化日期时间字符串
 * @param ms 毫秒时间戳
 * @returns 格式化后的日期时间字符串，格式取决于浏览器语言设置
 * @example
 * formatDateFromMs(1712345678000)
 */
export const formatDateFromMs = (ms: number): string => dateFormat.format(ms)
