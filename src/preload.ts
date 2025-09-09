import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getCourseNames: () => ipcRenderer.invoke('get-course-names'),
  getData: () => ipcRenderer.invoke('get-data'),
  getRankedSchedules: (desiredCourseNames: string[], preferences?: any[]) => ipcRenderer.invoke('get-ranked-schedules', desiredCourseNames, preferences),
  saveData: (data: any) => ipcRenderer.invoke('save-data', data)
});
