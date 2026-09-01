export {}

declare global {
  interface Window {
    // electron: ElectronAPI
    context: Record<string, unknown>
  }
}
