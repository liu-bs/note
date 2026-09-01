/**
 * @file window-state.ts
 * @description 窗口大小与位置持久化管理器，直接 JSON 读写到 userData 目录
 */
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'

/**
 * 窗口边界信息
 */
interface WindowBounds {
  /** 窗口宽度 */
  width: number
  /** 窗口高度 */
  height: number
  /** 窗口左上角 x 坐标 */
  x: number
  /** 窗口左上角 y 坐标 */
  y: number
}

/** 窗口状态持久化文件名 */
const CONFIG_FILE = 'window-state.json'

/**
 * 读取持久化的窗口边界
 * @returns 窗口边界信息；读取失败或文件不存在时返回 null
 */
async function loadBounds(): Promise<WindowBounds | null> {
  try {
    const filePath = join(app.getPath('userData'), CONFIG_FILE)
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data) as WindowBounds
  } catch {
    return null
  }
}

/**
 * 写入窗口边界到持久化文件
 * @param bounds 窗口边界信息
 */
async function saveBounds(bounds: WindowBounds): Promise<void> {
  try {
    const filePath = join(app.getPath('userData'), CONFIG_FILE)
    await writeFile(filePath, JSON.stringify(bounds), 'utf-8')
  } catch {
    // 持久化失败不影响应用运行
  }
}

/**
 * 创建窗口状态管理器
 * @description getBounds 返回上次保存的窗口边界；track 监听窗口 resize/move 事件并节流保存
 * @returns 包含 getBounds 和 track 方法的窗口状态管理器对象
 * @example
 * const manager = createWindowStateManager()
 * const bounds = await manager.getBounds()
 * manager.track(mainWindow)
 */
export function createWindowStateManager(): {
  getBounds: () => Promise<WindowBounds | null>
  track: (win: BrowserWindow) => void
} {
  /** 当前缓存的窗口边界 */
  let bounds: WindowBounds | null = null
  /** 节流保存的定时器 */
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  /** 是否已完成首次加载 */
  let loaded = false

  /**
   * 确保窗口边界数据已从磁盘加载
   */
  async function ensureLoaded(): Promise<void> {
    if (!loaded) {
      bounds = await loadBounds()
      loaded = true
    }
  }

  return {
    /**
     * 获取持久化的窗口边界
     * @returns 窗口边界信息；无保存数据时返回 null
     */
    async getBounds(): Promise<WindowBounds | null> {
      await ensureLoaded()
      return bounds
    },

    /**
     * 监听窗口 resize/move 事件，节流保存窗口边界
     * @param win 要跟踪的浏览器窗口
     */
    track(win: BrowserWindow): void {
      /** 节流持久化窗口位置和大小 */
      const persist = (): void => {
        if (saveTimer) return
        saveTimer = setTimeout(() => {
          saveTimer = null
          if (win.isDestroyed() || win.isMinimized()) return
          const [x, y] = win.getPosition()
          const [width, height] = win.getSize()
          bounds = { x, y, width, height }
          void saveBounds(bounds)
        }, 500)
      }

      win.on('resize', persist)
      win.on('move', persist)
    }
  }
}
