import { contextBridge } from 'electron'

// Custom APIs for renderer
if (!process.contextIsolated) {
  throw new Error('contextIsolated must be enabled in the Browserwindow')
}
try {
  contextBridge.exposeInMainWorld('context', {
    //TODO
  })
} catch (error) {
  console.error(error)
}
