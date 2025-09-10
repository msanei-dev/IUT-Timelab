// تست اسکریپت برای بررسی import کردن اکسل
const { parseExcelToCourses } = require('./src/excelUtils.ts');
const path = require('path');

async function testExcelImport() {
  try {
    const excelFilePath = path.join(__dirname, 'public', 'export.xlsx');
    console.log('تست خواندن فایل اکسل از:', excelFilePath);
    
    const courses = parseExcelToCourses(excelFilePath);
    console.log('تعداد دروس یافت شده:', courses.length);
    
    // نمایش اولین درس برای تست
    if (courses.length > 0) {
      console.log('اولین درس:', JSON.stringify(courses[0], null, 2));
    }
    
  } catch (error) {
    console.error('خطا در تست:', error);
  }
}

testExcelImport();
