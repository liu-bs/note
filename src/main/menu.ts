/**
 * @file menu.ts
 * @description 应用原生菜单配置，提供快捷键和标准 macOS 菜单栏
 */
import { Menu, app, shell } from 'electron'
import { is } from '@electron-toolkit/utils'

/**
 * 创建并设置应用原生菜单
 * @description macOS 标准菜单栏（App / File / Edit / View / Window）+ 快捷键；生产模式隐藏 DevTools 菜单项
 * @example
 * createAppMenu()
 */
export function createAppMenu(): void {
  /** 当前平台是否为 macOS */
  const isMac = process.platform === 'darwin'

  /** 菜单模板，根据平台动态组装菜单项 */
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: '文件',
      submenu: [isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' }]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
        ...(is.dev
          ? [
              { type: 'separator' as const },
              { role: 'toggleDevTools' as const, label: '开发者工具' }
            ]
          : [])
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { type: 'separator' },
        { role: 'front', label: '前置全部窗口' }
      ]
    },
    {
      role: 'help',
      label: '帮助',
      submenu: [
        {
          label: '项目主页',
          click: () => shell.openExternal('https://github.com/notemark/notemark')
        }
      ]
    }
  ]

  // 从模板构建菜单并设为应用菜单
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
