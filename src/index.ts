import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { getRankedSchedules, loadData } from './solver';
import { parseExcelToCourses, saveCoursesToJson } from './excelUtils';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    frame: false, // custom chrome
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 } as any, // macOS only safe-guard
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // Expose id for later reference if needed
  (global as any).__MAIN_WINDOW_ID__ = mainWindow.id;
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

ipcMain.handle('get-ranked-schedules', async (_event, desiredCourseNames: string[], preferences?: any[], groupingConfig?: any, options?: any) => {
  return getRankedSchedules(desiredCourseNames, preferences, groupingConfig, options);
});

ipcMain.handle('save-data', async (_event, newData: any) => {
  try {
    // ذخیره‌سازی داده‌های جدید
  const fs = require('fs');
  const path = require('path');
    
  // مسیر فایل data.json در پوشه‌ی کاربر برای پایداری و دسترسی نوشتن
  const dataPath = path.join(app.getPath('userData'), 'data.json');
    
    // اگر داده‌های جدید خالی باشه، فایل رو پاک کن
    if (!newData.courses || newData.courses.length === 0) {
      const emptyData: { courses: any[] } = { courses: [] };
      fs.writeFileSync(dataPath, JSON.stringify(emptyData, null, 2), 'utf-8');
      return { success: true, message: 'Data cleared successfully' };
    }
    
    // جایگزین کامل داده‌ها (بدون ادغام)
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');
    
    return { success: true, message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, message: error.message };
  }
});

// API جدید برای خواندن فایل اکسل
ipcMain.handle('import-excel', async (_event) => {
  try {
    // نمایش دیالوگ انتخاب فایل
    const result = await dialog.showOpenDialog({
      title: 'انتخاب فایل اکسل',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: 'User canceled file selection' };
    }

    const filePath = result.filePaths[0];
    
    // خواندن فایل به صورت Buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    
    return { 
      success: true, 
      message: 'فایل با موفقیت انتخاب شد',
      fileBuffer: Array.from(fileBuffer), // تبدیل Buffer به Array برای انتقال
      fileName: require('path').basename(filePath)
    };
    
  } catch (error) {
    console.error('Error selecting Excel file:', error);
    return { 
      success: false, 
      message: `خطا در انتخاب فایل اکسل: ${error.message}` 
    };
  }
});

// API جدید برای پردازش داده‌های اکسل
ipcMain.handle('process-excel-data', async (_event, fileBuffer: number[]) => {
  try {
    // تبدیل Array به Buffer
    const buffer = Buffer.from(fileBuffer);
    
    // خواندن و تجزیه فایل اکسل
    const courses = parseExcelToCourses(buffer);
    
    // ذخیره در فایل data.json
  const fs = require('fs');
  const path = require('path');
  const dataPath = path.join(app.getPath('userData'), 'data.json');
    const dataToSave = { courses: courses };
    
    fs.writeFileSync(dataPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    
    return { 
      success: true, 
      message: `${courses.length} درس با موفقیت از فایل اکسل خوانده شد`,
      data: dataToSave
    };
    
  } catch (error) {
    console.error('Error processing Excel data:', error);
    return { 
      success: false, 
      message: `خطا در پردازش فایل اکسل: ${error.message}` 
    };
  }
});

// ---------------- User Settings Persistence ----------------
// Path resolver helper (lazy because app.getPath only valid after ready)
function getSettingsPath() {
  const path = require('path');
  return path.join(app.getPath('userData'), 'settings.json');
}

// Save settings (UserSettings object)
ipcMain.handle('save-settings', async (_event, settings: any) => {
  const fs = require('fs').promises;
  try {
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'Invalid settings payload' };
    }
    // Basic shape guard
    if (!Array.isArray(settings.courseGroups)) settings.courseGroups = [];
    if (!settings.preferences) {
      settings.preferences = { preferredProfessors: [], timeSlotScores: {}, preferFreeDays: false };
    }
    const filePath = getSettingsPath();
    const data = JSON.stringify(settings, null, 2);
    await fs.mkdir(require('path').dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data, 'utf-8');
    return { success: true };
  } catch (err: any) {
    console.error('Error saving settings:', err);
    return { success: false, message: err.message };
  }
});

// Load settings
ipcMain.handle('load-settings', async () => {
  const fs = require('fs').promises;
  const path = getSettingsPath();
  try {
    await fs.access(path);
  } catch {
    // file not found -> first run
    return { success: true, data: null };
  }
  try {
    const raw = await fs.readFile(path, 'utf-8');
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch (e:any) {
      console.error('Settings JSON parse error:', e);
      return { success: false, data: null, message: 'Corrupted settings file' };
    }
    // minimal normalization
    if (!parsed || typeof parsed !== 'object') return { success: false, data: null, message: 'Invalid settings structure' };
    if (!Array.isArray(parsed.courseGroups)) parsed.courseGroups = [];
    if (!parsed.preferences) parsed.preferences = { preferredProfessors: [], timeSlotScores: {}, preferFreeDays: false };
    return { success: true, data: parsed };
  } catch (err:any) {
    console.error('Error loading settings:', err);
    return { success: false, data: null, message: err.message };
  }
});

// Window control channels
ipcMain.on('win:minimize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.minimize();
});
ipcMain.on('win:toggle-max', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) {
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    e.sender.send('win:is-maximized', win.isMaximized());
  }
});
ipcMain.on('win:close', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.close();
});
ipcMain.handle('win:get-max', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  return win ? win.isMaximized() : false;
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
