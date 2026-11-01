window.SITE_DATA = {
  site: {
    college: "物理学（师范）",
    title: "物理学（师范） · 学习中心",
    semester: "2026-2027 学年第 1 学期",
    startDate: "2026-08-31",
    totalWeeks: 20,
    notice: "这是公开演示数据；真实课程资料请放在本地“资料”目录，并确认授权后再使用。"
  },

  courses: [
    { id: "math", name: "高等数学", short: "高等数学", teacher: "张老师", color: "blue", category: "必修", credits: 4 },
    { id: "english", name: "大学英语", short: "大学英语", teacher: "李老师", color: "violet", category: "必修", credits: 3 },
    { id: "physics", name: "大学物理", short: "大学物理", teacher: "王老师", color: "green", category: "必修", credits: 4 },
    { id: "programming", name: "程序设计基础", short: "程序设计", teacher: "刘老师", color: "amber", category: "必修", credits: 3 },
    { id: "education", name: "教育学基础", short: "教育学", teacher: "陈老师", color: "rose", category: "必修", credits: 2 },
    { id: "pe", name: "大学体育", short: "大学体育", teacher: "赵老师", color: "cyan", category: "选修", credits: 1 }
  ],

  materials: [
    { id: "demo-material-1", title: "高等数学 第1-8章课件", grade: "大一 上", subject: "高等数学", type: "PDF", size: "2.4 MB", updated: "2026-10-01", description: "课堂讲义与例题整理（示例资料）", tags: ["课件"], sample: true },
    { id: "demo-material-2", title: "高等数学 期中复习提纲", grade: "大一 上", subject: "高等数学", type: "PDF", size: "0.8 MB", updated: "2026-10-08", description: "核心公式与典型题型（示例资料）", tags: ["复习"], sample: true },
    { id: "demo-material-3", title: "大学英语 听力练习", grade: "大一 上", subject: "大学英语", type: "ZIP", size: "6.2 MB", updated: "2026-10-03", description: "听力音频与练习文本（示例资料）", tags: ["练习"], sample: true },
    { id: "demo-material-4", title: "大学英语 写作模板", grade: "大一 上", subject: "大学英语", type: "DOC", size: "0.3 MB", updated: "2026-10-10", description: "常用写作结构（示例资料）", tags: ["模板"], sample: true },
    { id: "demo-material-5", title: "大学物理 实验报告模板", grade: "大一 下", subject: "大学物理", type: "DOC", size: "0.2 MB", updated: "2026-10-12", description: "实验目的、原理与数据处理模板（示例资料）", tags: ["实验", "模板"], sample: true },
    { id: "demo-material-6", title: "大学物理 课后习题", grade: "大一 下", subject: "大学物理", type: "PDF", size: "1.6 MB", updated: "2026-10-15", description: "章节练习题（示例资料）", tags: ["练习"], sample: true },
    { id: "demo-material-7", title: "教育学基础 课堂笔记", grade: "大二 上", subject: "教育学基础", type: "PDF", size: "1.1 MB", updated: "2026-10-18", description: "课堂要点整理（示例资料）", tags: ["笔记"], sample: true },
    { id: "demo-material-8", title: "教育学基础 题库", grade: "大二 上", subject: "教育学基础", type: "PDF", size: "1.3 MB", updated: "2026-10-20", description: "课程题库（示例资料）", tags: ["题库"], sample: true }
  ],

  taskCategories: {
    course: { label: "课程", color: "blue" },
    lab: { label: "实验", color: "green" },
    homework: { label: "作业", color: "amber" },
    club: { label: "社团", color: "rose" },
    life: { label: "生活", color: "slate" }
  },

  sampleTasks: [
    { id: "demo-task-1", title: "高等数学 第3章作业", date: "2026-10-30", category: "homework", done: false, note: "第3章习题" },
    { id: "demo-task-2", title: "大学英语 听力练习", date: "2026-10-31", category: "course", done: false, note: "完成听力第2单元" },
    { id: "demo-task-3", title: "大学物理 实验报告", date: "2026-11-02", category: "lab", done: false, note: "下周实验课前提交" },
    { id: "demo-task-4", title: "教育学基础 阅读", date: "2026-11-04", category: "course", done: false, note: "阅读指定章节" },
    { id: "demo-task-5", title: "社团例会", date: "2026-11-05", category: "club", done: false, note: "确认下周活动安排" }
  ],

  demoTimetable: [
    { id: "demo-math-mon", name: "高等数学", teacher: "张老师", location: "教1-101", campus: "本部", day: 1, start: 1, end: 2, weeks: { ranges: [[1, 16]], parity: "all" }, color: "blue", credits: 4, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-physics-mon", name: "大学物理", teacher: "王老师", location: "理科楼302", campus: "本部", day: 1, start: 5, end: 6, weeks: { ranges: [[1, 16]], parity: "all" }, color: "green", credits: 4, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-english-tue", name: "大学英语", teacher: "李老师", location: "外语楼201", campus: "本部", day: 2, start: 3, end: 4, weeks: { ranges: [[1, 16]], parity: "all" }, color: "violet", credits: 3, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-pe-tue", name: "大学体育", teacher: "赵老师", location: "东操场", campus: "本部", day: 2, start: 7, end: 8, weeks: { ranges: [[1, 16]], parity: "all" }, color: "cyan", credits: 1, category: "选修", className: "2026级", note: "" },
    { id: "demo-math-wed", name: "高等数学", teacher: "张老师", location: "教1-101", campus: "本部", day: 3, start: 3, end: 4, weeks: { ranges: [[1, 16]], parity: "all" }, color: "blue", credits: 4, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-programming-wed", name: "程序设计基础", teacher: "刘老师", location: "计算机楼401", campus: "本部", day: 3, start: 7, end: 8, weeks: { ranges: [[1, 16]], parity: "all" }, color: "amber", credits: 3, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-english-thu", name: "大学英语", teacher: "李老师", location: "外语楼201", campus: "本部", day: 4, start: 5, end: 6, weeks: { ranges: [[1, 16]], parity: "all" }, color: "violet", credits: 3, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-physics-fri", name: "大学物理", teacher: "王老师", location: "理科楼302", campus: "本部", day: 5, start: 1, end: 2, weeks: { ranges: [[1, 16]], parity: "all" }, color: "green", credits: 4, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-education-fri", name: "教育学基础", teacher: "陈老师", location: "教育楼205", campus: "本部", day: 5, start: 3, end: 4, weeks: { ranges: [[1, 16]], parity: "all" }, color: "rose", credits: 2, category: "必修", className: "物理学（师范）1班", note: "" },
    { id: "demo-practice", name: "教育见习", teacher: "指导老师", location: "", campus: "", day: null, start: null, end: null, weeks: { ranges: [[18, 18]], parity: "all" }, color: "slate", credits: null, category: "实践", className: "", note: "共 1 周" },
    { id: "demo-practice-2", name: "教学技能训练", teacher: "指导老师", location: "", campus: "", day: null, start: null, end: null, weeks: { ranges: [[1, 16]], parity: "all" }, color: "slate", credits: null, category: "实践", className: "", note: "共 16 周" }
  ]
};
