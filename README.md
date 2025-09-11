
# 🎓 IUT Timelab

> **Smart Course Schedule Generator & Optimizer for University Students**

A powerful Electron-based desktop application that helps students at Isfahan University of Technology (and other universities) quickly find optimal, conflict-free course schedules from hundreds of available sections. With advanced genetic algorithms, intelligent grouping, and comprehensive preference systems.

---
## 🇮🇷 راهنمای سریع برای کاربران عادی

این برنامه چیست؟
یک نرم‌افزار دسکتاپ است که به شما کمک می‌کند بین ده‌ها/صدها سکشن مختلف، «بهترین ترکیبِ بدون تداخل» را بر اساس ترجیحات شخصی (استاد، ساعت کلاس، روز تعطیل و …) پیدا کنید.

### مراحل استفاده (۵ دقیقه)
1. وارد کردن داده دروس
  - دکمه «اکسل» را بزنید و فایل را انتخاب کنید (اگر دارید).
  - یا متن خام برنامه آموزشی (خروجی سامانه دانشگاه) را داخل باکس بچسبانید و «ذخیره» را بزنید.
2. ساخت گروه‌های انتخابی ( مهم)
  - «مدیریت گروه‌های انتخابی» → گروه بسازید (مثلاً «ریاضی عمومی» / «زبان تخصصی»).
  - داخل هر گروه چند درسِ هم‌جایگزین را اضافه کنید. الگوریتم از هر گروه فقط یک مورد انتخاب می‌کند.
  - گروه را روشن (ON) بگذارید؛ گروه خاموش در نظر گرفته نمی‌شود.
3. انتخاب دستی (اختیاری)
  - اگر فقط چند کد خاص می‌خواهید، در «نمایش همه دروس» تیک بزنید. (در تب «جزئیات» فقط همین‌ها یا اشتراکشان با گروه‌های فعال نمایش می‌شود.)
4. تنظیم ترجیحات
  - تب «ترجیحات»: امتیاز استادها، اسلات‌های زمانی و ترتیب اولویت گروه‌ها را تعیین کنید (درَگ).
  - وزن‌ها (اسلایدرها) تعیین می‌کنند کدام معیار مهم‌تر است.
5. تعیین محدوده واحد (اختیاری)
  - حداقل / حداکثر واحد را وارد کنید تا برنامه‌های خارج از بازه حذف شوند.
6. تولید برنامه
  - «تولید برنامه (GA)» را بزنید. چند ثانیه صبر کنید.
  - بالای تقویم می‌توانید بین برنامه‌های پیشنهادی جابه‌جا شوید.
7. بررسی جزئیات و امتیاز
  - دکمه «جزئیات امتیاز» نشان می‌دهد هر برنامه چرا امتیاز گرفته.
  - تب «جزئیات» → لیست درس‌ها و سکشن‌هایشان.

### نکات مهم
| مورد | توضیح کوتاه |
|------|--------------|
| ذخیره خودکار | گروه‌ها و ترجیحات در پس‌زمینه ذخیره می‌شوند. | 
| حذف همه چیز | دکمه «حذف» داده درس‌ها را پاک می‌کند (تنظیمات باقی می‌ماند). |
| مشکل فوکوس در نسخه نصب‌شده | اگر روی Windows گاهی اینپوت فوکوس نگرفت، یک بار روی پس‌زمینه کلیک یا برنامه را Max/Restore کنید. نسخه جدید این مشکل را کاهش داده است. |
| گروه خالی | اگر گروه روشن باشد ولی هیچ درسِ دارای سکشن داخلش نباشد، در الگوریتم نادیده گرفته می‌شود. |
| سرعت GA | هرچه گروه‌ها و سکشن‌ها کمتر/دقیق‌تر باشند، سرعت بهتر و نتیجه واضح‌تر می‌شود. |

### خطاهای رایج
| پیام / حالت | دلیل | راه‌حل |
|--------------|------|--------|
| «ابتدا داده دروس را وارد کنید» | هنوز دیتایی ذخیره نشده | از اکسل یا Paste استفاده کنید |
| «هیچ گروه فعالی…» | همه گروه‌ها Off یا خالی‌اند | حداقل یک گروه روشن با درس معتبر بسازید |
| برنامه نمی‌سازد | تداخل یا محدودیت واحد سخت‌گیرانه | محدوده واحد را بازتر یا گروه‌ها را بازبینی کنید |

### پرسش‌های متداول (FAQ)
**چرا بعضی درس‌های انتخابی در برنامه نهایی نیست؟**
الگوریتم از هر «گروه فعال» فقط یک درس می‌گیرد. اگر چند تداخل داشتند، بهترین بر اساس امتیاز انتخاب می‌شود.

**چرا امتیاز بعضی برنامه‌ها خیلی نزدیک است؟**
به خاطر وزن‌های مساوی. اگر معیار خاصی مهم‌تر است، اسلایدر آن را بالا ببرید.

**چطور روز آزاد داشته باشم؟**
در ترجیحات، وزن Free Day (روز آزاد) و همچنین امتیاز اسلات‌های اول صبح/آخر شب را تنظیم کنید.

---

> اگر لازم بود راهنمای تصویری اضافه شود، پوشه‌ای با اسکرین‌شات می‌توان ساخت (پیشنهاد: docs/screenshots).


[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Electron](https://img.shields.io/badge/Electron-29+-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Key Features

### 🧠 Advanced Scheduling Engine
- **Genetic Algorithm Optimizer**: Utilizes sophisticated genetic algorithms with tournament selection, crossover, and mutation for optimal schedule generation
- **Conflict-Free Scheduling**: Recursive backtracking algorithm with deduplication ensures zero time conflicts
- **Multi-Scenario Generation**: Handles complex course groupings with cartesian product generation and scenario merging

### 📊 Intelligent Course Management
- **Mutually Exclusive Groups**: Define course groups where only one can be selected (e.g., choose between different math courses)
- **Section-Aware Selection**: Full support for multiple sections per course with automatic conflict detection
- **Unit Constraints**: Flexible minimum and maximum credit hour limits with automatic validation

### 🎯 Comprehensive Preference System
- **Priority-Based Scoring**: Weighted course priorities with inverted scoring algorithm
- **Professor Ratings**: Integration of professor ratings into schedule optimization
- **Time Slot Preferences**: Granular time slot ratings for personalized scheduling
- **Schedule Compactness**: Bonus points for free days and optimal time distribution

### 🖥️ Modern User Interface
- **Professional Desktop App**: Custom titlebar with native window controls
- **RTL Support**: Right-to-left layout optimized for Persian/Arabic languages
- **Responsive Calendar View**: Weekly calendar with precise time blocks, overlap handling, and half-hour granularity
- **Dark/Light Themes**: Automatic theme detection with manual override capability

### 💾 Data Management
- **Local Storage Persistence**: Automatic saving of groups, preferences, and settings
- **Excel Import Support**: Beta functionality for importing course data from Excel files
- **JSON Export/Import**: Easy backup and sharing of schedule configurations

## 🏗️ Technical Architecture

### Core Components

```
src/
├── App.tsx                    # Main application component with state management
├── CalendarView.tsx          # Advanced calendar rendering with absolute positioning
├── CourseSelector.tsx        # Course and section selection interface
├── GroupManager.tsx          # Mutually exclusive group management
├── DataInput.tsx            # Data input controls and UI components
├── solver/
│   ├── genetic.ts           # Genetic algorithm implementation
│   ├── scoring.ts           # Preference-based scoring engine
│   └── conflicts.ts         # Conflict detection and analysis
├── solver.ts                # Main scheduling engine and API
├── grouping.ts             # Course grouping and scenario generation
├── excelUtils.ts           # Excel import utilities
└── shared/
    └── types.ts            # TypeScript type definitions
```

### Algorithms & Data Structures

**Genetic Algorithm Engine**
- Population-based optimization with configurable parameters
- Tournament selection with elitism preservation
- Multi-point crossover with adaptive mutation rates
- Fitness function incorporating user preferences and constraints

**Backtracking Solver**
- Recursive conflict-free schedule generation
- Efficient pruning with early termination
- Cartesian product optimization for group scenarios

**Scoring System**
- Multi-criteria decision analysis with weighted preferences
- Professor ratings integration (1-5 scale)
- Time slot preferences with granular control
- Schedule compactness optimization## � Quick Start

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm 8+** or **yarn**
- **Windows 10+** (primary platform)

### Installation & Development

```powershell
# Clone the repository
git clone https://github.com/msanei-dev/IUT-Timelab.git
cd IUT-Timelab

# Install dependencies
npm install

# Start development environment
npm start
```

The development server will:
1. Launch the Electron application in development mode
2. Enable hot reloading for React components
3. Automatically copy data files via `copy-data.js`

### Building for Production

```powershell
# Create distributable packages
npm run make

# Output location: out/ directory
# Windows: Squirrel installer (.exe)
# Additional formats can be configured in forge.config.ts
```

### Project Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development environment with hot reload |
| `npm run package` | Package app without creating installer |
| `npm run make` | Build distributable installers |
| `npm run lint` | Run ESLint for code quality checks |

## 🔬 Advanced Features

### Genetic Algorithm Configuration

```typescript
// Configurable GA parameters
const gaParams = {
  populationSize: 140,    // Population size for genetic algorithm
  generations: 120,       // Number of evolution generations
  crossoverRate: 0.85,   // Probability of crossover between parents
  mutationRate: 0.07,    // Probability of gene mutation
  elitism: 4             // Number of best individuals preserved
};
```

### Preference System Deep Dive

The scoring system uses multiple weighted criteria:

- **Priority Weight (60)**: Course importance ranking
- **Professor Weight (25)**: Instructor rating influence
- **Time Slot Weight (8)**: Preferred time preferences
- **Attendance Bonus (40)**: Bonus for professors who don't take attendance
- **Free Day Bonus (60)**: Reward for having complete free days
- **Group Priority Bonuses**: High (100), Medium (50), Low (20)

### Course Grouping Logic

**Scenario Generation Process:**
1. **Deduplication**: Remove duplicate entries within each group
2. **Cartesian Product**: Generate all possible course combinations
3. **Conflict Resolution**: Filter out time-conflicting scenarios
4. **Optimization**: Apply genetic algorithm for best solutions

**Complexity Management:**
- Maximum scenario limit: 8,000 combinations
- Early termination for large datasets
- Pruning strategies for combinatorial explosion

### Calendar Rendering Engine

**Time Conversion System:**
```typescript
// Convert time slots to pixel positions
const minutesFromStart = (hour - START_HOUR) * 60 + minutes;
const pixelHeight = duration * PIXELS_PER_MINUTE;
const columnWidth = 100 / activeColumns;
```

**Overlap Resolution:**
- Greedy column assignment algorithm
- Dynamic width adjustment for overlapping events
- Half-hour grid lines for precise positioning

---

## License

MIT License. See [LICENSE](LICENSE) for details.

## Author

Developed by students at Isfahan University of Technology.

## � Performance & Scalability

### Optimization Strategies
- **Memoization**: Cached conflict detection for repeated schedule validation
- **Lazy Evaluation**: On-demand scenario generation to minimize memory usage
- **Efficient Data Structures**: Optimized course indexing and lookup tables
- **Background Processing**: Non-blocking genetic algorithm execution

### Benchmarks
- **Small Datasets** (< 50 courses): ~100ms generation time
- **Medium Datasets** (50-200 courses): ~500ms generation time  
- **Large Datasets** (200+ courses): ~2-5s with genetic algorithm optimization
- **Memory Usage**: < 100MB RAM for typical university course catalogs

## 🛠️ Extending the System

### Adding New Preferences

```typescript
// 1. Define preference type in scoring.ts
interface CustomPreference {
  courseCode: string;
  customWeight: number;
  customCriteria: any;
}

// 2. Update scoring function
const CUSTOM_WEIGHT = 30;
if (customPreference) {
  score += customPreference.customWeight * CUSTOM_WEIGHT;
}

// 3. Add UI controls in PreferencePanel.tsx
```

### Excel Data Import Structure

```typescript
// Expected Excel columns:
interface ExcelCourseData {
  courseCode: string;      // e.g., "CS101"
  courseName: string;      // e.g., "Introduction to Programming"
  sectionCode: string;     // e.g., "01", "02"
  professor: string;       // Professor name
  day: string;            // "Saturday", "Sunday", etc.
  startTime: string;      // "08:00"
  endTime: string;        // "10:00"
  units: number;          // Credit hours
}
```

## 🚀 Roadmap & Future Development

### Short-term Goals
- [ ] **Enhanced Excel Import**: Complete Excel parser with error validation
- [ ] **Preference GUI**: Drag-and-drop preference configuration
- [ ] **Export Features**: PDF/image export of generated schedules
- [ ] **Performance Optimization**: Further algorithm optimizations for large datasets

### Medium-term Goals  
- [ ] **Cloud Synchronization**: User account system with cloud backup
- [ ] **Collaborative Features**: Share schedules and group configurations
- [ ] **iCal Integration**: Export to calendar applications (.ics format)
- [ ] **Mobile Companion**: React Native app for schedule viewing

### Long-term Vision
- [ ] **Multi-University Support**: Configurable for different university systems
- [ ] **AI Recommendations**: Machine learning for preference prediction
- [ ] **Advanced Analytics**: Schedule pattern analysis and insights
- [ ] **Integration APIs**: Connect with university registration systems

## 🤝 Contributing
Fork → Branch → Commit with meaningful message → Pull Request. Before PR:
```powershell
npm run lint
```

## ⚖️ License
MIT License

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# 4. Run tests and linting
npm run lint

# 5. Commit with meaningful messages
git commit -m "feat: add new preference system"

# 6. Push and create Pull Request
git push origin feature/your-feature-name
```

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage required
- **ESLint**: Must pass all linting rules
- **Formatting**: Prettier configuration enforced
- **Testing**: Unit tests for core algorithms (when applicable)

### Areas for Contribution
- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **New Features**: Implement roadmap items
- 📚 **Documentation**: Improve code comments and guides
- 🎨 **UI/UX**: Enhance user interface and experience
- ⚡ **Performance**: Optimize algorithms and rendering

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/msanei-dev/IUT-Timelab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/msanei-dev/IUT-Timelab/discussions)
- **Email**: Contact the development team for specific inquiries

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ **Commercial Use**: Allowed
- ✅ **Modification**: Allowed  
- ✅ **Distribution**: Allowed
- ✅ **Private Use**: Allowed
- ❌ **Liability**: Not provided
- ❌ **Warranty**: Not provided

## 👨‍💻 Authors & Acknowledgments

**Created by:** Students at Isfahan University of Technology

**Special Thanks:**
- Computer Science Department, IUT
- Open source community for excellent libraries
- Beta testers and early adopters

---

<div align="center">

**⭐ Star this repository if you find it useful!**

Made with ❤️ for university students worldwide

</div>
