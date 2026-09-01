/**
 * @file self-check.ts
 * @description sanitizeTitle 自检 — 路径安全处理是信任边界上的非平凡逻辑，AGENTS.md 要求留下 runnable check
 *  run: pnpm check
 */
import assert from 'node:assert/strict'
// @ts-expect-error — Node.js --experimental-strip-types requires .ts extension
import { sanitizeTitle } from './sanitize.ts'

const cases: [string, string][] = [
  ['../etc/passwd', 'passwd'], // 路径穿越 → basename 防御
  ['a\0b', 'ab'], // null 字节清除
  ['a\x01b', 'ab'], // 控制字符过滤
  ['CON', 'untitled'], // Windows 保留设备名
  ['', 'untitled'], // 空标题
  ['..test..', 'test'], // 首尾点号去除
  ['normal title', 'normal title'], // 正常标题不变
  ['a<b>c:d"e|f?g*', 'abcdefg'], // 路径特殊字符过滤
  ['  spaced  ', 'spaced'], // 首尾空格 trim
  ['NUL.txt', 'untitled'], // Windows 保留名 + 扩展
  ['com1', 'untitled'], // Windows 保留设备名 com1
  ['.hidden', 'hidden'] // 开头点号去除
]

for (const [input, expected] of cases) {
  const got = sanitizeTitle(input)
  assert.equal(
    got,
    expected,
    `sanitizeTitle(${JSON.stringify(input)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`
  )
}

console.log('sanitizeTitle: all %d checks passed', cases.length)
