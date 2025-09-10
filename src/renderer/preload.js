const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCourseNames: () => ipcRenderer.invoke('get-course-names'),
  getRankedSchedules: (desiredCourseNames) => ipcRenderer.invoke('get-ranked-schedules', desiredCourseNames)
});
