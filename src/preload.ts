import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getCourseNames: () => ipcRenderer.invoke('get-course-names'),
  getRankedSchedules: (desiredCourseNames: string[]) => ipcRenderer.invoke('get-ranked-schedules', desiredCourseNames),
  saveData: (data: any) => ipcRenderer.invoke('save-data', data)
});
