// Course grouping module
// امکان تعریف گروه‌هایی که چند درس (courseCode یا courseName) دارند و باید فقط یکی از آن‌ها انتخاب شود.

export interface CourseGroup {
  id: string;            // شناسه یکتا
  name: string;          // نام نمایشی مثل "ریاضی"
  courseNames: string[]; // لیست courseName هایی که معادل هم هستند
}

export interface GroupingConfig {
  groups: CourseGroup[];
}

// نرمال کردن نام‌ها (برای مقایسه بدون فاصله و کاراکترهای اضافی)
export function normalizeName(name: string): string {
  return name.replace(/\s+/g,'').toLowerCase();
}

// برگرداندن map از courseName نرمال شده به شناسه گروه
export function buildGroupIndex(config: GroupingConfig): Record<string,string> {
  const map: Record<string,string> = {};
  for (const g of config.groups) {
    for (const n of g.courseNames) {
      map[ normalizeName(n) ] = g.id;
    }
  }
  return map;
}

// فیلتر کردن لیست انتخابی کاربر: اگر کاربر چند مورد از یک گروه انتخاب کند، همه نگه داشته می‌شوند
// اما solve استفاده می‌کند که فقط یکی را بردارد. (می‌توان اینجا هم dedupe کرد.)
export function dedupeWithinGroups(selectedCourseNames: string[], config: GroupingConfig): string[][] {
  // خروجی: آرایه‌ای از "لیست های انتخاب جایگزین". هر لیست = یکی باید انتخاب شود.
  // مثال: اگر گروه ریاضی شامل ["ریاضی عمومی 1", "ریاضی عمومی 2"] و کاربر هر دو را انتخاب کرده باشد
  // خروجی شامل آرایه‌ای مثل [["ریاضی عمومی 1", "ریاضی عمومی 2"], ... سایر دروس تک]
  const index = buildGroupIndex(config);
  const grouped: Record<string,string[]> = {};
  const singles: string[] = [];
  for (const name of selectedCourseNames) {
    const gid = index[ normalizeName(name) ];
    if (gid) {
      grouped[gid] = grouped[gid] || [];
      if (!grouped[gid].includes(name)) grouped[gid].push(name);
    } else {
      singles.push(name);
    }
  }
  const result: string[][] = [];
  for (const gid in grouped) {
    result.push(grouped[gid]);
  }
  for (const s of singles) result.push([s]);
  return result;
}

// تولید تمام ترکیب‌های انتخاب از هر گروه (ضرب دکارتی)
export function expandGroups(groupedChoices: string[][]): string[][] {
  const results: string[][] = [];
  function dfs(i: number, current: string[]) {
    if (i === groupedChoices.length) { results.push([...current]); return; }
    for (const option of groupedChoices[i]) {
      current.push(option);
      dfs(i+1, current);
      current.pop();
    }
  }
  dfs(0, []);
  return results;
}

// API سطح بالا: گرفتن selection کاربر + config و برگرداندن لیست سناریوهای معادل برای solver
export function generateSelectionScenarios(selected: string[], config: GroupingConfig): string[][] {
  const grouped = dedupeWithinGroups(selected, config);
  return expandGroups(grouped);
}

// مثال استفاده:
// const config: GroupingConfig = { groups:[{ id:'math', name:'ریاضی', courseNames:['ریاضی عمومی 1','ریاضی عمومی 2']}] };
// const scenarios = generateSelectionScenarios(['ریاضی عمومی 1','ریاضی عمومی 2','فیزیک 1'], config);
// scenarios => [ ['ریاضی عمومی 1','فیزیک 1'], ['ریاضی عمومی 2','فیزیک 1'] ]
