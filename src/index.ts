import { app, BrowserWindow, ipcMain } from 'electron';
import { getRankedSchedules, loadData } from './solver';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-course-names', async () => {
  const data = loadData();
  return data.courses.map(c => c.courseName);
});

ipcMain.handle('get-data', async () => {
  return loadData();
});

ipcMain.handle('get-ranked-schedules', async (_event, desiredCourseNames: string[], preferences?: any[]) => {
  return getRankedSchedules(desiredCourseNames, preferences);
});

ipcMain.handle('save-data', async (_event, newData: any) => {
  try {
    // ذخیره‌سازی داده‌های جدید
    const fs = require('fs');
    const path = require('path');
    
    // مسیر فایل data.json
    const dataPath = path.join(__dirname, 'data.json');
    
    // خواندن داده‌های موجود
    let existingData: any = { courses: [] };
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      existingData = JSON.parse(rawData);
    }
    
    // ادغام داده‌های جدید با موجود
    const mergedCourses = [...existingData.courses];
    for (const newCourse of newData.courses) {
      const existingIndex = mergedCourses.findIndex(c => c.courseCode === newCourse.courseCode);
      if (existingIndex >= 0) {
        // به‌روزرسانی درس موجود
        mergedCourses[existingIndex] = newCourse;
      } else {
        // اضافه کردن درس جدید
        mergedCourses.push(newCourse);
      }
    }
    
    const finalData = { courses: mergedCourses };
    
    // ذخیره‌سازی در فایل
    fs.writeFileSync(dataPath, JSON.stringify(finalData, null, 2), 'utf-8');
    
    return { success: true, message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, message: error.message };
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
