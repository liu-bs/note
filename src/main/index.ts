/**
 * @file index.ts
 * @description Electron 主进程入口文件，负责创建浏览器窗口、注册 IPC 通信处理器、管理应用生命周期，是整个笔记应用的启动点
 */
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { NoteChannel, WindowChannel } from '@shared/constant'

import * as noteLib from './lib'
import { createAppMenu } from './menu'
import { createWindowStateManager } from './window-state'

/** 允许在系统浏览器中打开的 URL 协议白名单 */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

/**
 * 通用 IPC 处理器注册表，将 NoteChannel 频道名映射到对应的处理函数，主进程启动时统一注册
 */
const ipcHandlers: Record<string, (...args: unknown[]) => unknown> = {
  [NoteChannel.GET_NOTES]: () => noteLib.getNotes(),
  [NoteChannel.READ_NOTE]: (_e, title) => noteLib.readNote(title as string),
  [NoteChannel.WRITE_NOTE]: (_e, title, content) =>
    noteLib.writeNote(title as string, content as string),
  [NoteChannel.CREATE_NOTE]: (_e, title) => noteLib.createNote(title as string),
  [NoteChannel.DELETE_NOTE]: (_e, title) => noteLib.deleteNote(title as string),
  [NoteChannel.RENAME_NOTE]: (_e, oldTitle, newTitle) =>
    noteLib.renameNote(oldTitle as string, newTitle as string),
  [NoteChannel.PROMPT_CREATE]: () => noteLib.promptCreate()
}

/** 窗口状态管理器，用于持久化窗口大小与位置 */
const windowState = createWindowStateManager()

/**
 * 注册窗口控制 IPC 处理器，用于非 macOS 平台的窗口操作
 */
function registerWindowControls(): void {
  ipcMain.handle(WindowChannel.MINIMIZE, (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.handle(WindowChannel.MAXIMIZE, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle(WindowChannel.CLOSE, (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
  ipcMain.handle(WindowChannel.IS_MAXIMIZED, (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
  })
}

/**
 * 监听窗口 maximize/unmaximize 事件，推送到渲染进程实现状态同步
 * @param mainWindow 应用主窗口实例
 */
function trackMaximizeState(mainWindow: BrowserWindow): void {
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send(WindowChannel.ON_MAXIMIZE_CHANGE, true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send(WindowChannel.ON_MAXIMIZE_CHANGE, false)
  })
}

/**
 * 创建应用主窗口并完成初始化配置
 * @example
 * createWindow()
 */
async function createWindow(): Promise<void> {
  /** 持久化的窗口边界，首次启动时为 null，退回默认值 */
  const saved = await windowState.getBounds()
  /** 应用主窗口实例 */
  const mainWindow = new BrowserWindow({
    width: saved?.width ?? 900,
    height: saved?.height ?? 670,
    x: saved?.x,
    y: saved?.y,
    show: false,
    autoHideMenuBar: true,
    center: !saved,
    title: 'NoteMark',
    frame: false,
    ...(process.platform === 'darwin'
      ? {
          vibrancy: 'under-window' as const,
          visualEffectState: 'active' as const,
          titleBarStyle: 'hidden' as const,
          trafficLightPosition: { x: 15, y: 10 }
        }
      : {}),
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('show', () => mainWindow.webContents.setBackgroundThrottling(false)) // 窗口可见时恢复渲染频率，不可见时降低以省 CPU/电
  mainWindow.on('hide', () => mainWindow.webContents.setBackgroundThrottling(true))

  windowState.track(mainWindow) // 持久化窗口大小与位置

  trackMaximizeState(mainWindow) // 推送 maximize/unmaximize 事件到渲染进程

  // 外部链接白名单过滤：仅允许 http(s)/mailto 协议在系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url)
      if (ALLOWED_PROTOCOLS.has(url.protocol)) {
        shell.openExternal(details.url)
      }
    } catch {
      // 无效 URL，静默丢弃
    }
    return { action: 'deny' }
  })

  // 阻止渲染进程通过 location.href 导航到外部 URL，仅允许 file:// 协议
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return
    event.preventDefault()
  })

  // 开发环境加载远程 URL，生产环境加载本地 HTML 文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Electron 完成初始化并准备创建浏览器窗口时触发，部分 API 仅在此事件后才可调用
app.whenReady().then(() => {
  // 设置 Windows 平台应用用户模型 ID
  electronApp.setAppUserModelId('com.notemark.app')

  // macOS 开发模式下设置 Dock 图标（打包后由 .icns 自动生效）
  if (process.platform === 'darwin' && !app.isPackaged && app.dock) {
    app.dock.setIcon(icon)
  }

  // 开发模式 F12 打开/关闭 DevTools，生产模式忽略 CommandOrControl+R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 笔记增删改查 IPC 处理器，通用注册，附带 sender 校验
  for (const [channel, handler] of Object.entries(ipcHandlers)) {
    ipcMain.handle(channel, (e, ...args) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) {
        console.warn(`[IPC] 拒绝无关联窗口的调用: ${channel}`)
        return null
      }
      return handler(e, ...args)
    })
  }

  // 窗口控制 IPC 处理器，用于非 macOS 平台
  registerWindowControls()

  // 应用菜单
  createAppMenu()

  void createWindow()

  app.on('activate', function () {
    // macOS 点击 Dock 图标且无窗口时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) void createWindow()
  })
})

// 全局未捕获的 Promise 拒绝，防止主进程静默崩溃
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason)
})

// 全局未捕获异常，弹出错误提示，给用户一次恢复机会
process.on('uncaughtException', (error) => {
  console.error('[main] uncaughtException:', error)
  dialog.showErrorBox('应用遇到问题', `${error.message}\n\n请重启应用。`)
})

// 渲染进程崩溃自动恢复
app.on('render-process-gone', (_event, webContents, details) => {
  console.error('[main] 渲染进程崩溃:', details.reason)
  const win = BrowserWindow.fromWebContents(webContents)
  if (win && !win.isDestroyed()) {
    win.reload()
  }
})

// GPU 子进程崩溃自动恢复
app.on('child-process-gone', (_event, details) => {
  console.warn('[main] 子进程崩溃:', details.type, details.reason)
})

// 所有窗口关闭时退出应用，macOS 除外（macOS 应用通常在用户 Cmd+Q 前保持活跃）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
