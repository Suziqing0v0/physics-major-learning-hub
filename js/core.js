(function () {
  'use strict';

  const Hub = window.Hub = window.Hub || {};
  const DATA = window.SITE_DATA;
  const TIMETABLE_KEY = 'college-hub-timetable-v1';
  const TASKS_KEY = 'college-hub-tasks-v1';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const DAY_CN = ['一', '二', '三', '四', '五', '六', '日'];
  const DAY_FULL = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const COURSE_COLORS = ['blue', 'violet', 'green', 'amber', 'rose', 'cyan', 'orange', 'indigo'];
  const PALETTE = {
    blue: '#5B7CA8', violet: '#7F6A95', green: '#4E9A70', amber: '#C48A32',
    rose: '#C06A7C', cyan: '#4C9AA5', orange: '#C97B43', indigo: '#6470B8', slate: '#8E8B84'
  };

  Hub.DAY_CN = DAY_CN;
  Hub.DAY_FULL = DAY_FULL;
  Hub.PALETTE = PALETTE;
  Hub.COURSE_COLORS = COURSE_COLORS;
  Hub.$ = $;
  Hub.$$ = $$;
  Hub.esc = esc;

  function uid(prefix = 'id') {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultTimetable() {
    return {
      settings: {
        studentName: '示例同学',
        semester: DATA.site.semester,
        startDate: DATA.site.startDate,
        totalWeeks: DATA.site.totalWeeks
      },
      courses: clone(DATA.demoTimetable)
    };
  }

  function defaultTasks() {
    return clone(DATA.sampleTasks);
  }

  function normalizeCourse(input) {
    if (!input || typeof input !== 'object') return null;
    const name = String(input.name || '').trim();
    if (!name) return null;
    const dayValue = input.day == null || input.day === '' ? null : parseInt(input.day, 10);
    const day = dayValue == null || !Number.isFinite(dayValue) ? null : clampNumber(dayValue, 1, 7);
    const start = day == null ? null : clampNumber(parseInt(input.start, 10) || 1, 1, 11);
    const end = day == null ? null : clampNumber(parseInt(input.end, 10) || start, start, 11);
    const credits = input.credits == null || input.credits === '' ? null : Number(input.credits);
    return {
      id: input.id || uid('course'),
      name,
      teacher: String(input.teacher || '').trim(),
      location: String(input.location || '').trim(),
      campus: String(input.campus || '').trim(),
      day,
      start,
      end,
      weeks: normalizeWeeks(input.weeks),
      color: (input.color && PALETTE[input.color]) ? input.color : colorForName(name),
      credits: credits != null && Number.isFinite(credits) ? credits : null,
      category: String(input.category || '').trim(),
      className: String(input.className || '').trim(),
      note: String(input.note || '').trim()
    };
  }

  function normalizeTimetable(input) {
    const base = defaultTimetable();
    const source = input && typeof input === 'object' ? input : {};
    const settings = Object.assign(base.settings, source.settings || {});
    settings.totalWeeks = clampNumber(parseInt(settings.totalWeeks, 10) || DATA.site.totalWeeks, 1, 30);
    if (!parseDateLocal(settings.startDate)) settings.startDate = DATA.site.startDate;
    const courses = (Array.isArray(source.courses) ? source.courses : base.courses)
      .map(normalizeCourse)
      .filter(Boolean);
    return { settings, courses };
  }

  function normalizeTask(input) {
    if (!input || typeof input !== 'object') return null;
    const title = String(input.title || '').trim();
    if (!title) return null;
    const category = DATA.taskCategories[input.category] ? input.category : 'course';
    const date = String(input.date || '').trim();
    return {
      id: input.id || uid('task'),
      title,
      date: dateFromKey(date) ? date : '',
      category,
      done: Boolean(input.done),
      note: String(input.note || '').trim()
    };
  }

  function normalizeTasks(list) {
    return (Array.isArray(list) ? list : []).map(normalizeTask).filter(Boolean);
  }

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('读取本地数据失败', key, err);
      return null;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('保存本地数据失败', key, err);
      Hub.ui.toast('保存失败，浏览器可能禁用了本地存储');
      return false;
    }
  }

  function loadTimetable() {
    return normalizeTimetable(loadJSON(TIMETABLE_KEY));
  }

  function loadTasks() {
    const stored = loadJSON(TASKS_KEY);
    return normalizeTasks(Array.isArray(stored) ? stored : defaultTasks());
  }

  const HubState = Hub.state = {
    view: 'home',
    timetable: loadTimetable(),
    tasks: loadTasks(),
    ttWeek: 1,
    ttDay: 1,
    plannerWeek: 1,
    materialGrade: 'all',
    materialSubject: 'all',
    materialQuery: '',
    modal: null
  };

  /* Date and week utilities */

  function parseDateLocal(value) {
    if (!value) return null;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function diffDays(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dateKey(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function dateFromKey(key) {
    const parsed = parseDateLocal(key);
    return parsed || null;
  }

  function todayDayIndex() {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  }

  function getCurrentWeek(date = new Date()) {
    const start = parseDateLocal(HubState.timetable.settings.startDate);
    if (!start) return 1;
    const offset = diffDays(start, date);
    if (offset < 0) return 0;
    return Math.floor(offset / 7) + 1;
  }

  function clampWeek(week) {
    return clampNumber(week, 1, Math.max(1, HubState.timetable.settings.totalWeeks));
  }

  function mondayOfWeek(week) {
    const start = parseDateLocal(HubState.timetable.settings.startDate) || new Date();
    return addDays(start, (week - 1) * 7);
  }

  function formatDateCN(date) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatWeekday(date) {
    const day = date.getDay();
    return '星期' + (day === 0 ? '日' : DAY_CN[day - 1]);
  }

  function formatWeekRange(week) {
    const monday = mondayOfWeek(week);
    const sunday = addDays(monday, 6);
    return `${formatDateCN(monday)} - ${formatDateCN(sunday)}`;
  }

  function formatShortDate(key) {
    if (!key) return '未排期';
    const date = dateFromKey(key);
    if (!date) return key;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /* Week ranges */

  function parseWeeks(text, parity = 'all') {
    const source = String(text || '');
    if (/单/.test(source)) parity = 'odd';
    if (/双/.test(source)) parity = 'even';
    const normalized = source
      .replace(/[单双]/g, '')
      .replace(/[—–~至]/g, '-')
      .replace(/[，、]/g, ',')
      .replace(/周/g, ' ')
      .replace(/第/g, '')
      .replace(/[()（）]/g, '')
      .trim();
    const ranges = [];
    normalized.split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => {
      const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        let a = parseInt(range[1], 10);
        let b = parseInt(range[2], 10);
        if (a > b) [a, b] = [b, a];
        ranges.push([a, b]);
        return;
      }
      if (/^\d+$/.test(part)) {
        const n = parseInt(part, 10);
        ranges.push([n, n]);
      }
    });
    if (!ranges.length) ranges.push([1, 16]);
    ranges.sort((a, b) => a[0] - b[0]);
    return { ranges, parity: ['odd', 'even', 'all'].includes(parity) ? parity : 'all' };
  }

  function normalizeWeeks(input) {
    if (!input) return { ranges: [[1, 16]], parity: 'all' };
    if (typeof input === 'string') {
      let parity = 'all';
      if (/单/.test(input)) parity = 'odd';
      if (/双/.test(input)) parity = 'even';
      return parseWeeks(input.replace(/[单双周]/g, ''), parity);
    }
    if (Array.isArray(input)) {
      return parseWeeks(input.map((item) => Array.isArray(item) ? item.join('-') : String(item)).join(','), 'all');
    }
    if (Array.isArray(input.ranges)) {
      const normalized = parseWeeks(input.ranges.map((item) => Array.isArray(item) ? item.join('-') : String(item)).join(','), 'all');
      if (['odd', 'even', 'all'].includes(input.parity)) normalized.parity = input.parity;
      return normalized;
    }
    if (input.from != null) {
      return parseWeeks(`${input.from}-${input.to != null ? input.to : input.from}`, input.parity || 'all');
    }
    return { ranges: [[1, 16]], parity: 'all' };
  }

  function inWeek(weeks, week) {
    const normalized = normalizeWeeks(weeks);
    const inRange = normalized.ranges.some(([from, to]) => week >= from && week <= to);
    if (!inRange) return false;
    if (normalized.parity === 'odd' && week % 2 === 0) return false;
    if (normalized.parity === 'even' && week % 2 === 1) return false;
    return true;
  }

  function formatWeeks(weeks) {
    const normalized = normalizeWeeks(weeks);
    const text = normalized.ranges.map(([from, to]) => from === to ? `第${from}周` : `${from}-${to}周`).join('、');
    if (normalized.parity === 'odd') return text + '（单周）';
    if (normalized.parity === 'even') return text + '（双周）';
    return text;
  }

  function weeksToText(weeks) {
    const normalized = normalizeWeeks(weeks);
    return normalized.ranges.map(([from, to]) => from === to ? String(from) : `${from}-${to}`).join(',');
  }

  function formatPeriod(course) {
    if (course.day == null) return '不固定';
    if (course.start === course.end) return `第${course.start}节`;
    return `第${course.start}-${course.end}节`;
  }

  function formatTime(course) {
    if (course.day == null) return '时间不固定';
    return `${DAY_FULL[course.day - 1]} · ${formatPeriod(course)}`;
  }

  /* Course queries */

  function coursesForWeek(week) {
    return HubState.timetable.courses
      .filter((course) => course.day != null && inWeek(course.weeks, week))
      .sort((a, b) => a.day - b.day || a.start - b.start || a.name.localeCompare(b.name));
  }

  function coursesForDay(day, week) {
    return coursesForWeek(week).filter((course) => course.day === day);
  }

  function practiceForWeek(week) {
    return HubState.timetable.courses.filter((course) => course.day == null && inWeek(course.weeks, week));
  }

  function uniqueCourseCount(courses) {
    return new Set(courses.map((course) => course.name)).size;
  }

  function courseById(id) {
    return HubState.timetable.courses.find((course) => course.id === id) || null;
  }

  function courseByName(name) {
    return HubState.timetable.courses.find((course) => course.name === name) || null;
  }

  function colorForName(name) {
    let hash = 0;
    for (const ch of String(name || '')) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return COURSE_COLORS[hash % COURSE_COLORS.length];
  }

  function initialSelectedDay() {
    const today = todayDayIndex();
    if (coursesForDay(today, HubState.ttWeek).length) return today;
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = ((today - 1 + offset) % 7) + 1;
      if (coursesForDay(day, HubState.ttWeek).length) return day;
    }
    return today;
  }

  /* Tasks */

  function tasksForWeek(week) {
    return HubState.tasks
      .filter((task) => {
        const date = dateFromKey(task.date);
        if (!date) return false;
        return getCurrentWeek(date) === week;
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.title.localeCompare(b.title, 'zh-CN');
      });
  }

  function tasksForDate(key) {
    return HubState.tasks
      .filter((task) => task.date === key)
      .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  }

  function upcomingTasks(limit = 4) {
    const today = dateKey(new Date());
    return HubState.tasks
      .filter((task) => !task.done && task.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  }

  function saveTimetable() {
    return saveJSON(TIMETABLE_KEY, HubState.timetable);
  }

  function saveTasks() {
    return saveJSON(TASKS_KEY, HubState.tasks);
  }

  function resetData() {
    HubState.timetable = defaultTimetable();
    HubState.tasks = defaultTasks();
    HubState.ttWeek = clampWeek(getCurrentWeek());
    HubState.plannerWeek = HubState.ttWeek;
    HubState.ttDay = initialSelectedDay();
    saveTimetable();
    saveTasks();
  }

  function exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      timetable: HubState.timetable,
      tasks: HubState.tasks
    };
  }

  function importData(data) {
    if (!data || typeof data !== 'object') throw new Error('数据格式不正确');
    if (data.timetable && Array.isArray(data.timetable.courses)) {
      HubState.timetable = normalizeTimetable(data.timetable);
    }
    if (Array.isArray(data.tasks)) {
      HubState.tasks = normalizeTasks(data.tasks);
    }
    HubState.ttWeek = clampWeek(getCurrentWeek());
    HubState.plannerWeek = HubState.ttWeek;
    HubState.ttDay = initialSelectedDay();
    saveTimetable();
    saveTasks();
  }

  /* Router */

  function navigate(view) {
    const hash = '#/' + view;
    if (location.hash === hash) {
      render();
    } else {
      location.hash = hash;
    }
  }

  function currentViewFromHash() {
    const name = (location.hash || '#/home').replace(/^#\/?/, '').split('?')[0];
    return ['home', 'timetable', 'materials', 'planner'].includes(name) ? name : 'home';
  }

  function render() {
    HubState.view = currentViewFromHash();
    $$('.view').forEach((view) => { view.hidden = view.dataset.view !== HubState.view; });
    $$('.top-nav a, .bottom-nav a').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.view === HubState.view);
    });
    $('#siteSemester').textContent = HubState.timetable.settings.semester;
    $('#siteWeekHint').textContent = `第 ${getCurrentWeek()} 周 · ${HubState.timetable.settings.studentName || '示例课表'}`;
    $('#mobileSemester').textContent = HubState.timetable.settings.semester.replace(/\s+/g, ' ').replace(' 学年', '-').replace(' 学年第 ', '-').replace(' 学期', '');
    const view = Hub.views[HubState.view];
    if (view && view.render) view.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* UI */

  let toastTimer = null;
  let pendingConfirm = null;

  function openModal(title, bodyHtml, footerHtml) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    $('#modalFoot').innerHTML = footerHtml || '';
    $('#modalBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    const focusTarget = $('#modalBody input, #modalBody select, #modalBody textarea, #modalBody button');
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (focusTarget && !coarse) setTimeout(() => focusTarget.focus(), 60);
  }

  function closeModal() {
    $('#modalBackdrop').hidden = true;
    $('#modalBody').innerHTML = '';
    $('#modalFoot').innerHTML = '';
    document.body.style.overflow = '';
    HubState.modal = null;
    pendingConfirm = null;
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2400);
  }

  function confirmAction(title, message, confirmLabel, onConfirm, danger = false) {
    pendingConfirm = onConfirm;
    const body = `<p class="confirm-text">${esc(message)}</p>`;
    const footer = `<button class="btn btn-ghost" type="button" id="confirmCancel">取消</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="confirmOk">${esc(confirmLabel)}</button>`;
    openModal(title, body, footer);
    $('#confirmCancel').addEventListener('click', closeModal);
    $('#confirmOk').addEventListener('click', () => {
      const action = pendingConfirm;
      pendingConfirm = null;
      closeModal();
      if (action) action();
    });
  }

  Hub.utils = {
    uid, clone, clampNumber, parseDateLocal, startOfDay, addDays, diffDays, sameDay,
    dateKey, dateFromKey, todayDayIndex, getCurrentWeek, clampWeek, mondayOfWeek,
    formatDateCN, formatWeekday, formatWeekRange, formatShortDate,
    parseWeeks, normalizeWeeks, inWeek, formatWeeks, weeksToText, formatPeriod, formatTime,
    coursesForWeek, coursesForDay, practiceForWeek, uniqueCourseCount, courseById, courseByName,
    colorForName, initialSelectedDay, tasksForWeek, tasksForDate, upcomingTasks,
    normalizeCourse, normalizeTimetable, normalizeTask, normalizeTasks
  };
  Hub.storage = { loadTimetable, loadTasks, saveTimetable, saveTasks, resetData, exportData, importData };
  Hub.ui = { openModal, closeModal, toast, confirm: confirmAction };
  Hub.navigate = navigate;
  Hub.render = render;
  Hub.views = Hub.views || {};

  HubState.ttWeek = clampWeek(getCurrentWeek());
  HubState.plannerWeek = HubState.ttWeek;
  HubState.ttDay = initialSelectedDay();
})();
