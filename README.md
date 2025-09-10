src/
	App.tsx              ریشهٔ رابط کاربری و مدیریت وضعیت
	CalendarView.tsx     رندر تقویم هفتگی (layout جدید absolute/grid)
	CourseSelector.tsx   انتخاب درس‌ها (نمایش هر section بصورت نام ترکیبی)
	GroupManager.tsx     مدیریت گروه‌های mutually exclusive
	solver.ts            موتور تولید برنامه + امتیازدهی + ادغام سناریوهای گروه
	grouping.ts          توابع ساخت سناریوهای انتخابی گروه‌ها
	excelUtils.ts        توابع کمکی (در حال توسعه برای ورود داده از اکسل)
	DataInput.tsx        ورودی/دکمه‌های جانبی (فعلاً تغییر نام به افزودن گروه)
	shared/types.ts      (در صورت وجود) انواع اشتراکی

# IUT Timelab

**IUT Timelab** is a smart course schedule generator and optimizer for university students. It helps you quickly find the best, conflict-free combinations of course sections, apply your personal preferences, and compare multiple alternative scenarios.

## ⭐️ Key Features

| Feature | Description |
|---------|-------------|
| Conflict-Free Scheduling | Finds all valid, non-overlapping course combinations using a recursive search algorithm with deduplication |
| Multiple Sections Support | Displays all available sections for each course and suggests alternatives in case of conflicts |
| Mutually Exclusive Grouping | Define sets of courses where only one can be selected from each group |
| Modern Weekly Calendar | Accurate, visually appealing weekly calendar with multi-hour blocks, horizontal overlaps, and half-hour lines |
| Preferences System | Extensible scoring system (e.g., avoid early mornings, prefer compact schedules) |
| Local Storage | Saves your defined groups and preferences in localStorage |
| Excel Import (Beta) | Basic support for importing raw data from Excel files |

## 🗂 Folder Structure (Summary)

```
src/
	App.tsx              // Main UI and state management
	CalendarView.tsx     // Weekly calendar rendering (absolute/grid layout)
	CourseSelector.tsx   // Course and section selection UI
	GroupManager.tsx     // Mutually exclusive group management
	solver.ts            // Schedule generation, scoring, and scenario merging
	grouping.ts          // Group scenario construction logic
	excelUtils.ts        // Excel import utilities (in development)
	DataInput.tsx        // Data input and side controls
	shared/types.ts      // Shared type definitions (if present)
```

## 🔧 Development Setup

```powershell
npm install
npm start
```

This will:
1. Start the Electron Forge development environment.
2. Run `copy-data.js` after startup to sync or copy data files.

**Requirements:** Node.js 18 or higher.

## 🏗 Building Installable Packages

```powershell
npm run make
```

The output will be in the `out/` directory (or the default Forge output path). On Windows, Squirrel is used for packaging.

## 🧠 Course Grouping Logic

In `grouping.ts`, the following steps are performed:
1. Deduplicate entries within each group.
2. Generate the cartesian product of group selections (exactly one course per group).
3. Send each scenario to the `solver` and merge results, avoiding duplicate schedules.

If the number of groups or options grows large, a combinatorial explosion may occur. In the future, threshold limits and early stopping may be added.

## 🗓 Calendar Event Rendering

Each session is converted to minutes from a base `START_HOUR`. Height is calculated as duration × pixel ratio. Overlaps are resolved with dynamic (greedy) column assignment; column width = (100 / active columns).

---

## License

MIT License. See [LICENSE](LICENSE) for details.

## Author

Developed by students at Isfahan University of Technology.

## 🛠 افزودن ترجیحات جدید
در حال حاضر ساختار ساده است؛ برای توسعه:
1. تعریف نوع/کلید ترجیح
2. افزودن وزن و تابع محاسبه در solver
3. جمع‌بندی امتیاز در مرحله رتبه‌بندی

## 📥 ورود داده از اکسل (طرح آینده)
`excelUtils.ts` می‌تواند توسعه یابد تا:
1. فایل Excel (`xlsx`) خوانده شود
2. ستون‌ها به ساختار استاندارد درس تبدیل گردد
3. کش یا JSON نرمال ذخیره شود

## 🚀 مسیرهای توسعه پیشنهادی
- محدودسازی پیچیدگی ترکیبات گروه (Pruning)
- رابط گرافیکی برای ترجیحات (Drag sliders / weights)
- Export برنامه به PDF / تصویر
- Sync ابری یا اشتراک لینک
- iCal (.ics) خروجی
- اعتبارسنجی پیشرفتهٔ فرمت زمان (جلوگیری از اشتباه تایپی)

## 🤝 مشارکت
Fork → Branch → Commit با پیام معنادار → Pull Request. پیش از PR:
```powershell
npm run lint
```

## ⚖️ مجوز
MIT License

## ✨ نام پروژه
«IUT Timelab» ترکیبی از هویت دانشگاه (IUT) و آزمایشگاه زمان (Time Lab) برای تأکید بر تحلیل و بهینه‌سازی است.

## ℹ️ پیکربندی ریپو
`package.json` شامل فیلدهای repository / bugs / homepage است؛ در صورت تغییر نام کاربری یا انتقال، آن‌ها را به‌روزرسانی کنید.

---
### English (Brief)
IUT Timelab is an intelligent timetable generator for Isfahan University of Technology. Features: conflict-free schedule engine, multi-section handling, mutually exclusive course groups, modern weekly calendar, extensible preference scoring, and (planned) Excel import.

Development:
```powershell
npm install
npm start
```
Build:
```powershell
npm run make
```
License: MIT

</div>
