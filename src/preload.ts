import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getCourseNames: () => ipcRenderer.invoke('get-course-names'),
  getData: () => ipcRenderer.invoke('get-data'),
  // اکنون پارامتر groupingConfig نیز ارسال می‌شود
  getRankedSchedules: (desiredCourseNames: string[], preferences?: any[], groupingConfig?: any, options?: any) =>
    ipcRenderer.invoke('get-ranked-schedules', desiredCourseNames, preferences, groupingConfig, options),
  saveData: (data: any) => ipcRenderer.invoke('save-data', data),
  importExcel: () => ipcRenderer.invoke('import-excel'),
  processExcelData: (fileBuffer: number[]) => ipcRenderer.invoke('process-excel-data', fileBuffer),
  // Settings persistence
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  windowControls: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggle-max'),
    close: () => ipcRenderer.send('win:close'),
    onMaximizeState: (cb: (isMax: boolean) => void) => ipcRenderer.on('win:is-maximized', (_e, v) => cb(v))
  ,getIsMaximized: () => ipcRenderer.invoke('win:get-max')
  }
});
