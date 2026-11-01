(function () {
  'use strict';
  const Hub = window.Hub;
  const { $, esc, DAY_CN, DAY_FULL, PALETTE, COURSE_COLORS } = Hub;
  const U = Hub.utils;
  const MAX_PERIODS = 11;

  function render() {
    const state = Hub.state;
    $('#ttWeekNumber').textContent = String(state.ttWeek);
    $('#ttWeekRange').textContent = U.formatWeekRange(state.ttWeek);

    const content = $('#ttContent');
    if (!content) return;
    content.innerHTML = `<div class="tt-toolbar">
      <div class="week-nav">
        <button class="round-btn" type="button" data-tt="prev" aria-label="上一周"><svg class="icon"><use href="#i-chevron-left"></use></svg></button>
        <button class="week-current" type="button" data-tt="current" title="回到本周">
          <strong>第 ${state.ttWeek} 周</strong>
          <span>${esc(U.formatWeekRange(state.ttWeek))}</span>
        </button>
        <button class="round-btn" type="button" data-tt="next" aria-label="下一周"><svg class="icon"><use href="#i-chevron-right"></use></svg></button>
      </div>
      <div class="tt-tools">
        <button class="btn btn-ghost mobile-only" type="button" data-tt="toggle">周视图</button>
      </div>
    </div>
    <div class="tt-board">
      <div class="grid-scroll" id="gridScroll">
        <div class="week-grid" id="weekGrid" role="grid" aria-label="周课表"></div>
      </div>
      <div class="day-tabs" id="dayTabs" aria-label="选择星期"></div>
      <div class="day-view" id="dayView"></div>
    </div>
    <section class="practice-section" id="practiceSection" hidden></section>
    <div class="tt-footnote">课表只保存在本机浏览器。点空白格子可以快速添加课程，点已有课程可以查看详情。</div>`;

    renderGrid();
    renderDayTabs();
    renderDayView();
    renderPractice();
    content.onclick = handleClick;
    updateToggleLabel();
  }

  function updateToggleLabel() {
    const toggle = $('[data-tt="toggle"]');
    if (!toggle) return;
    toggle.textContent = document.body.classList.contains('show-week-grid') ? '日视图' : '周视图';
  }

  function renderGrid() {
    const state = Hub.state;
    const monday = U.mondayOfWeek(state.ttWeek);
    const current = U.getCurrentWeek();
    const today = new Date();
    let html = '<div class="grid-head corner" style="grid-column:1 / 3">节次</div>';

    for (let day = 1; day <= 7; day += 1) {
      const date = U.addDays(monday, day - 1);
      const isToday = state.ttWeek === current && U.sameDay(date, today);
      html += `<div class="grid-head day-head${isToday ? ' is-today' : ''}" data-day="${day}" style="grid-column:${day + 2}">
        <span class="day-name">周${DAY_CN[day - 1]}</span>
        <span class="day-date">${date.getMonth() + 1}/${date.getDate()}</span>
      </div>`;
    }

    for (let period = 1; period <= MAX_PERIODS; period += 1) {
      const group = period <= 4 ? '上午' : period <= 8 ? '下午' : '晚上';
      const groupStart = period === 1 || period === 5 || period === 9;
      if (groupStart) {
        const span = period === 1 || period === 5 ? 4 : 3;
        html += `<div class="group-cell" style="grid-column:1;grid-row:${period + 1} / span ${span}">${group}</div>`;
      }
      html += `<div class="period-cell" style="grid-column:2;grid-row:${period + 1}">${period}</div>`;
      for (let day = 1; day <= 7; day += 1) {
        html += `<div class="slot" data-day="${day}" data-period="${period}" style="grid-column:${day + 2};grid-row:${period + 1}" title="点击添加课程"></div>`;
      }
    }

    U.coursesForWeek(state.ttWeek).forEach((course) => {
      const span = course.end - course.start + 1;
      html += `<button class="course${span <= 1 ? ' is-compact' : ''}" type="button" data-course-id="${esc(course.id)}" data-color="${esc(course.color)}" style="grid-column:${course.day + 2};grid-row:${course.start + 1} / span ${span}" title="${esc(course.name)} · ${esc(U.formatPeriod(course))} · ${esc(course.location || '')}">
        <span class="course-name">${esc(course.name)}</span>
        ${course.location ? `<span class="course-loc">${esc(course.location)}</span>` : ''}
        ${course.teacher ? `<span class="course-teacher">${esc(course.teacher)}</span>` : ''}
      </button>`;
    });

    $('#weekGrid').innerHTML = html;
  }

  function renderDayTabs() {
    const state = Hub.state;
    const monday = U.mondayOfWeek(state.ttWeek);
    const current = U.getCurrentWeek();
    const today = new Date();
    let html = '';
    for (let day = 1; day <= 7; day += 1) {
      const date = U.addDays(monday, day - 1);
      const hasCourse = U.coursesForDay(day, state.ttWeek).length > 0;
      const classes = ['day-tab'];
      if (hasCourse) classes.push('has-course');
      if (state.ttWeek === current && U.sameDay(date, today)) classes.push('is-today');
      if (state.ttDay === day) classes.push('is-active');
      html += `<button class="${classes.join(' ')}" type="button" data-day="${day}" aria-label="${DAY_FULL[day - 1]} ${U.formatDateCN(date)}">
        <span class="d-name">${DAY_CN[day - 1]}</span>
        <span class="d-date">${date.getMonth() + 1}/${date.getDate()}</span>
        <span class="d-dot"></span>
      </button>`;
    }
    $('#dayTabs').innerHTML = html;
  }

  function renderDayView() {
    const state = Hub.state;
    const monday = U.mondayOfWeek(state.ttWeek);
    const date = U.addDays(monday, state.ttDay - 1);
    const courses = U.coursesForDay(state.ttDay, state.ttWeek);
    let html = `<div class="day-view-head">
      <div>
        <h3>${DAY_FULL[state.ttDay - 1]} · ${U.formatDateCN(date)}</h3>
        <p>${courses.length ? `${courses.length} 个时段` : '没有课程'}</p>
      </div>
      <button class="btn btn-ghost" type="button" data-action="add-day"><svg class="icon"><use href="#i-plus"></use></svg>添加</button>
    </div>`;

    if (!courses.length) {
      html += `<div class="empty-day">
        <div class="empty-icon"><svg class="icon" style="width:19px;height:19px"><use href="#i-calendar"></use></svg></div>
        <h4>这一天没有课</h4>
        <p>可以休息，也可以添加临时安排。</p>
        <button class="btn btn-primary" type="button" data-action="add-day"><svg class="icon"><use href="#i-plus"></use></svg>添加课程</button>
      </div>`;
    } else {
      courses.forEach((course) => {
        const meta = [course.location, course.teacher].filter(Boolean).join(' · ') || '未填写地点和教师';
        html += `<button class="day-course" type="button" data-course-id="${esc(course.id)}" data-color="${esc(course.color)}">
          <span class="time-badge">${course.start}-${course.end}<span>节</span></span>
          <span class="body">
            <span class="name">${esc(course.name)}${course.category ? `<span class="chip chip-${esc(course.color)}">${esc(course.category)}</span>` : ''}</span>
            <span class="meta">${esc(meta)}</span>
            <span class="weeks">${esc(U.formatWeeks(course.weeks))}</span>
          </span>
          <span class="chev">›</span>
        </button>`;
      });
    }
    $('#dayView').innerHTML = html;
  }

  function renderPractice() {
    const section = $('#practiceSection');
    const list = U.practiceForWeek(Hub.state.ttWeek);
    if (!list.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    section.innerHTML = `<div class="section-head">
      <div><span class="section-kicker">没有固定节次</span><h2>实践课程</h2></div>
      <span class="section-count">${list.length} 项</span>
    </div>
    <div class="practice-list">${list.map((course) => `<button class="practice-card" type="button" data-course-id="${esc(course.id)}">
      <span class="practice-icon"><svg class="icon" style="width:16px;height:16px"><use href="#i-book"></use></svg></span>
      <span>
        <span class="name">${esc(course.name)}</span>
        <span class="meta">${esc([course.teacher, course.location].filter(Boolean).join(' · ') || '时间地点待定')}</span>
        <span class="weeks">${esc(U.formatWeeks(course.weeks))}${course.note ? ' · ' + esc(course.note) : ''}</span>
      </span>
    </button>`).join('')}</div>`;
  }

  function handleClick(event) {
    const action = event.target.closest('[data-tt]');
    if (action) {
      const name = action.dataset.tt;
      if (name === 'prev') return goWeek(Hub.state.ttWeek - 1);
      if (name === 'next') return goWeek(Hub.state.ttWeek + 1);
      if (name === 'current') return goCurrentWeek();
      if (name === 'toggle') return toggleView();
    }

    const tab = event.target.closest('.day-tab');
    if (tab) {
      Hub.state.ttDay = parseInt(tab.dataset.day, 10);
      renderDayTabs();
      renderDayView();
      return;
    }

    const addDay = event.target.closest('[data-action="add-day"]');
    if (addDay) {
      openCourseForm(null, { day: Hub.state.ttDay });
      return;
    }

    const course = event.target.closest('[data-course-id]');
    if (course) {
      openDetail(course.dataset.courseId);
      return;
    }

    const slot = event.target.closest('.slot');
    if (slot) {
      openCourseForm(null, { day: parseInt(slot.dataset.day, 10), period: parseInt(slot.dataset.period, 10) });
    }
  }

  function goWeek(week) {
    Hub.state.ttWeek = U.clampWeek(week);
    Hub.state.ttDay = U.initialSelectedDay();
    render();
  }

  function goCurrentWeek() {
    const current = U.getCurrentWeek();
    Hub.state.ttWeek = current < 1 ? 1 : U.clampWeek(current);
    Hub.state.ttDay = U.initialSelectedDay();
    render();
    Hub.ui.toast(`已回到第 ${Hub.state.ttWeek} 周`);
  }

  function toggleView() {
    const showingGrid = document.body.classList.toggle('show-week-grid');
    updateToggleLabel();
    if (showingGrid) {
      const scroll = $('#gridScroll');
      const column = $(`#weekGrid .day-head[data-day="${Hub.state.ttDay}"]`) || $('#weekGrid .day-head.is-today');
      if (column && scroll) {
        const left = column.offsetLeft - scroll.clientWidth / 2 + column.offsetWidth / 2;
        scroll.scrollTo({ left, behavior: 'smooth' });
      }
    }
  }

  function openDetail(id) {
    const course = U.courseById(id);
    if (!course) return;
    const items = [
      ['i-calendar', '时间', course.day == null ? '不固定' : `${DAY_FULL[course.day - 1]} · ${U.formatPeriod(course)}`],
      ['i-clock', '周次', U.formatWeeks(course.weeks)],
      ['i-pin', '地点', course.location || '未填写'],
      ['i-user', '教师', course.teacher || '未填写'],
      ['i-book', '分类', course.category || '未填写'],
      ['i-book', '学分', course.credits == null ? '未填写' : `${course.credits} 学分`]
    ];
    let grid = items.map(([icon, key, value]) => `<div class="detail-item">
      <div class="k"><svg class="icon"><use href="#${icon}"></use></svg>${key}</div>
      <div class="v">${esc(value)}</div>
    </div>`).join('');
    if (course.className) {
      grid += `<div class="detail-item full"><div class="k"><svg class="icon"><use href="#i-user"></use></svg>教学班</div><div class="v">${esc(course.className)}</div></div>`;
    }
    if (course.campus) {
      grid += `<div class="detail-item full"><div class="k"><svg class="icon"><use href="#i-pin"></use></svg>校区</div><div class="v">${esc(course.campus)}</div></div>`;
    }
    const body = `<div class="detail-title">
      <span class="detail-dot" style="background:${PALETTE[course.color] || PALETTE.slate}"></span>
      <h3>${esc(course.name)}</h3>
    </div>
    <p class="detail-sub">${esc(course.category || '课程')}${course.credits != null ? ' · ' + course.credits + ' 学分' : ''}</p>
    <div class="detail-grid">${grid}</div>
    ${course.note ? `<div class="detail-note">${esc(course.note)}</div>` : ''}`;
    const footer = `<button class="btn btn-danger" type="button" id="detailDelete">删除</button>
      <span class="spacer"></span>
      <button class="btn" type="button" id="detailEdit">编辑</button>
      <button class="btn btn-primary" type="button" id="detailClose">关闭</button>`;
    Hub.ui.openModal('课程详情', body, footer);
    $('#detailClose').addEventListener('click', Hub.ui.closeModal);
    $('#detailEdit').addEventListener('click', () => openCourseForm(course.id));
    $('#detailDelete').addEventListener('click', () => {
      Hub.ui.confirm('删除课程', `确定删除「${course.name}」吗？`, '删除', () => {
        Hub.state.timetable.courses = Hub.state.timetable.courses.filter((item) => item.id !== course.id);
        Hub.storage.saveTimetable();
        Hub.ui.closeModal();
        Hub.render();
        Hub.ui.toast('已删除课程');
      }, true);
    });
  }

  function openCourseForm(id, prefill = {}) {
    const editing = id ? U.courseById(id) : null;
    const course = editing || {
      name: '', teacher: '', location: '', campus: '',
      day: prefill.day != null ? prefill.day : Hub.state.ttDay,
      start: prefill.period || 1, end: prefill.period || 1,
      weeks: { ranges: [[1, 16]], parity: 'all' },
      color: 'blue', credits: null, category: '', className: '', note: ''
    };
    if (prefill.period) { course.start = prefill.period; course.end = prefill.period; }

    const dayOptions = ['<option value="">不固定（实践课）</option>'].concat(
      DAY_FULL.map((label, index) => `<option value="${index + 1}"${course.day === index + 1 ? ' selected' : ''}>${label}</option>`)
    ).join('');
    const periodOptions = (selected) => Array.from({ length: MAX_PERIODS }, (_, i) => i + 1)
      .map((n) => `<option value="${n}"${n === selected ? ' selected' : ''}>${n}</option>`).join('');
    const colorOptions = COURSE_COLORS.map((color) => `<label class="color-option" data-color="${color}" title="${color}">
      <input type="radio" name="color" value="${color}"${(course.color || 'blue') === color ? ' checked' : ''}><span></span>
    </label>`).join('');

    const body = `<form id="courseForm" class="form-grid" novalidate>
      <div class="form-field full"><label for="f-name">课程名称<span class="req">*</span></label><input id="f-name" name="name" autocomplete="off" value="${esc(course.name)}" placeholder="例如：高等数学"></div>
      <div class="form-field"><label for="f-teacher">教师</label><input id="f-teacher" name="teacher" autocomplete="off" value="${esc(course.teacher)}" placeholder="例如：张老师"></div>
      <div class="form-field"><label for="f-location">地点</label><input id="f-location" name="location" autocomplete="off" value="${esc(course.location)}" placeholder="例如：教3-201"></div>
      <div class="form-field"><label for="f-day">星期</label><select id="f-day" name="day">${dayOptions}</select></div>
      <div class="form-field"><label>节次</label><div style="display:flex;align-items:center;gap:6px"><select name="start" aria-label="开始节次" style="min-width:0;flex:1">${periodOptions(course.start || 1)}</select><span style="font-size:10px;color:var(--muted);flex:none">到</span><select name="end" aria-label="结束节次" style="min-width:0;flex:1">${periodOptions(course.end || 1)}</select></div></div>
      <div class="form-field"><label for="f-weeks">周次</label><input id="f-weeks" name="weeks" autocomplete="off" value="${esc(U.weeksToText(course.weeks))}" placeholder="1-16 或 1-8,10-16"><span class="hint">多段用逗号分隔</span></div>
      <div class="form-field"><label for="f-parity">单双周</label><select id="f-parity" name="parity">
        <option value="all"${U.normalizeWeeks(course.weeks).parity === 'all' ? ' selected' : ''}>全部周</option>
        <option value="odd"${U.normalizeWeeks(course.weeks).parity === 'odd' ? ' selected' : ''}>单周</option>
        <option value="even"${U.normalizeWeeks(course.weeks).parity === 'even' ? ' selected' : ''}>双周</option>
      </select></div>
      <div class="form-field"><label for="f-category">分类</label><input id="f-category" name="category" list="categoryList" autocomplete="off" value="${esc(course.category)}" placeholder="必修 / 选修 / 校选"><datalist id="categoryList"><option value="必修"><option value="选修"><option value="校选"><option value="实践"><option value="其他"></datalist></div>
      <div class="form-field"><label for="f-credits">学分</label><input id="f-credits" name="credits" type="number" min="0" max="20" step="0.5" value="${course.credits == null ? '' : course.credits}" placeholder="例如：4"></div>
      <div class="form-field"><label for="f-campus">校区</label><input id="f-campus" name="campus" autocomplete="off" value="${esc(course.campus)}" placeholder="例如：本部"></div>
      <div class="form-field full"><label for="f-class">教学班</label><input id="f-class" name="className" autocomplete="off" value="${esc(course.className)}" placeholder="选填"></div>
      <div class="form-field full"><label>颜色</label><div class="color-row">${colorOptions}</div></div>
      <div class="form-field full"><label for="f-note">备注</label><textarea id="f-note" name="note" placeholder="选填">${esc(course.note)}</textarea></div>
      <div class="form-row-note">星期选择“不固定”时，课程会显示在“实践课程”里。</div>
    </form>`;
    const footer = `<button class="btn btn-ghost" type="button" id="courseCancel">取消</button>
      <button class="btn btn-primary" type="submit" form="courseForm">${editing ? '保存修改' : '添加课程'}</button>`;
    Hub.ui.openModal(editing ? '编辑课程' : '添加课程', body, footer);

    const form = $('#courseForm');
    const sync = () => {
      const off = form.elements.day.value === '';
      form.elements.start.disabled = off;
      form.elements.end.disabled = off;
    };
    form.elements.day.addEventListener('change', sync);
    sync();
    $('#courseCancel').addEventListener('click', Hub.ui.closeModal);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      if (!name) { Hub.ui.toast('请填写课程名称'); form.elements.name.focus(); return; }
      const day = data.get('day') === '' ? null : parseInt(data.get('day'), 10);
      const start = day == null ? null : parseInt(data.get('start'), 10);
      const end = day == null ? null : parseInt(data.get('end'), 10);
      if (day != null && (!start || !end || start > end)) { Hub.ui.toast('节次不对，请检查开始和结束节'); return; }
      const weeksText = String(data.get('weeks') || '').trim();
      if (day != null && !weeksText) { Hub.ui.toast('请填写周次，例如 1-16'); return; }
      const weeks = U.parseWeeks(weeksText || '1-16', data.get('parity'));
      const colorInput = form.querySelector('input[name="color"]:checked');
      const next = U.normalizeCourse({
        id: editing ? editing.id : U.uid('course'),
        name,
        teacher: data.get('teacher'),
        location: data.get('location'),
        campus: data.get('campus'),
        day, start, end, weeks,
        color: colorInput ? colorInput.value : U.colorForName(name),
        credits: data.get('credits'),
        category: data.get('category'),
        className: data.get('className'),
        note: data.get('note')
      });
      if (!next) { Hub.ui.toast('课程信息不完整'); return; }
      if (editing) {
        Hub.state.timetable.courses = Hub.state.timetable.courses.map((item) => item.id === editing.id ? next : item);
      } else {
        Hub.state.timetable.courses.push(next);
      }
      Hub.storage.saveTimetable();
      Hub.ui.closeModal();
      Hub.render();
      Hub.ui.toast(editing ? '已保存修改' : '已添加课程');
    });
  }

  function openImport() {
    const body = `<div class="tabs" id="importTabs">
      <button class="tab is-active" type="button" data-mode="tsv">粘贴表格</button>
      <button class="tab" type="button" data-mode="json">JSON</button>
    </div>
    <div class="import-area">
      <textarea id="importText" spellcheck="false" placeholder="从 Excel 或教务系统复制整张课表，粘贴到这里…"></textarea>
    </div>
    <details class="import-help">
      <summary>支持哪些格式？</summary>
      <strong>方式一：整张表格</strong><br>
      从 Excel 复制包含“节次 / 星期一 … 星期日”的表格，直接粘贴。教务系统单元格常见格式：<br>
      <code>高等数学</code><br>
      <code>(1-2节)1-16周/校区:本部/场地:教1-101/教师:张老师/学分:4</code><br><br>
      <strong>方式二：每行一门课</strong><br>
      <code>课程名 | 周一 | 1-2节 | 1-16周 | 地点 | 教师</code><br><br>
      单双周可以写成 <code>1-16周(单)</code>，多段周次写成 <code>1-8,10-16周</code>。
    </details>
    <div id="importFeedback"></div>`;
    const footer = `<button class="btn btn-ghost" type="button" id="importCancel">取消</button>
      <button class="btn btn-primary" type="button" id="importParse">识别课表</button>
      <button class="btn btn-primary" type="button" id="importConfirm" hidden>确认导入</button>`;
    Hub.ui.openModal('导入课表', body, footer);

    const textarea = $('#importText');
    const feedback = $('#importFeedback');
    const parseBtn = $('#importParse');
    const confirmBtn = $('#importConfirm');

    $$('#importTabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('#importTabs .tab').forEach((item) => item.classList.toggle('is-active', item === tab));
        textarea.value = '';
        textarea.placeholder = tab.dataset.mode === 'tsv'
          ? '从 Excel 或教务系统复制整张课表，粘贴到这里…'
          : '粘贴 JSON 数组，例如 [{"name":"高等数学","day":1,"start":1,"end":2,"weeks":"1-16"}]';
        feedback.innerHTML = '';
        parseBtn.hidden = false;
        confirmBtn.hidden = true;
      });
    });

    parseBtn.addEventListener('click', () => {
      const mode = $('#importTabs .tab.is-active').dataset.mode;
      const result = parseImportText(textarea.value, mode);
      renderImportFeedback(feedback, result);
      if (result.courses.length) {
        parseBtn.hidden = true;
        confirmBtn.hidden = false;
        confirmBtn.dataset.count = String(result.courses.length);
        confirmBtn.dataset.courses = JSON.stringify(result.courses);
      }
    });

    confirmBtn.addEventListener('click', () => {
      const courses = JSON.parse(confirmBtn.dataset.courses || '[]');
      if (!courses.length) return;
      const mode = feedback.querySelector('input[name="importMode"]:checked')?.value || 'replace';
      if (mode === 'replace') {
        Hub.state.timetable.courses = courses;
      } else {
        const existing = new Set(Hub.state.timetable.courses.map(fingerprint));
        Hub.state.timetable.courses = Hub.state.timetable.courses.concat(courses.filter((course) => !existing.has(fingerprint(course))));
      }
      Hub.storage.saveTimetable();
      Hub.ui.closeModal();
      Hub.render();
      Hub.ui.toast(`已导入 ${courses.length} 个时段`);
    });

    $('#importCancel').addEventListener('click', Hub.ui.closeModal);
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) setTimeout(() => textarea.focus(), 80);
  }

  function fingerprint(course) {
    return [course.name, course.day, course.start, course.end, JSON.stringify(U.normalizeWeeks(course.weeks)), course.location].join('|');
  }

  function renderImportFeedback(container, result) {
    let html = '';
    if (result.errors.length) {
      html += `<div class="import-errors">${result.errors.slice(0, 6).map((error) => `<div>${esc(error)}</div>`).join('')}${result.errors.length > 6 ? `<div>还有 ${result.errors.length - 6} 条错误…</div>` : ''}</div>`;
    }
    if (result.courses.length) {
      const rows = result.courses.slice(0, 16).map((course) => `<div class="preview-row">
        <span class="p-dot" style="background:${PALETTE[course.color] || PALETTE.slate}"></span>
        <span class="p-name">${esc(course.name)}</span>
        <span class="p-meta">${esc(U.formatTime(course))} · ${esc(course.location || '地点未填')}</span>
      </div>`).join('');
      html += `<div class="preview">
        <div class="preview-head"><span>识别到 ${result.courses.length} 个时段</span><span>请确认后导入</span></div>
        <div class="preview-list">${rows}${result.courses.length > 16 ? `<div class="preview-row"><span class="p-meta">还有 ${result.courses.length - 16} 个时段…</span></div>` : ''}</div>
      </div>
      <div class="radio-row">
        <label><input type="radio" name="importMode" value="replace" checked> 替换现有课表</label>
        <label><input type="radio" name="importMode" value="append"> 追加到现有课表</label>
      </div>`;
    }
    container.innerHTML = html;
  }

  function parseImportText(text, mode) {
    const raw = String(text || '').replace(/\r/g, '').trim();
    if (!raw) return { courses: [], errors: ['请先粘贴课表内容'] };
    if (mode === 'json' || /^[\[{]/.test(raw)) return parseJSONImport(raw);
    if (raw.includes('\t')) return parseTSV(raw);
    if (raw.includes('|')) return parseCompact(raw);
    return { courses: [], errors: ['没有识别到表格。请从 Excel/教务系统复制带制表符的整张课表，或使用“课程名 | 周一 | 1-2节 | 1-16周 | 地点 | 教师”每行一条。'] };
  }

  function parseJSONImport(text) {
    let value;
    try { value = JSON.parse(text); } catch (err) { return { courses: [], errors: [`JSON 格式错误：${err.message}`] }; }
    const list = Array.isArray(value) ? value : Array.isArray(value.courses) ? value.courses : null;
    if (!list) return { courses: [], errors: ['JSON 里没有找到课程数组，应为 [...] 或 {"courses":[...]}'] };
    const courses = [];
    const errors = [];
    list.forEach((item, index) => {
      const course = U.normalizeCourse(item);
      if (!course) errors.push(`第 ${index + 1} 条缺少课程名称`);
      else courses.push(course);
    });
    return { courses, errors };
  }

  function parseDelimited(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 1; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"' && field === '') inQuotes = true;
      else if (ch === '\t') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
  }

  function parseTSV(text) {
    const rows = parseDelimited(text);
    let headerIndex = rows.findIndex((row) => row.some((cell) => /星期[一二三四五六日天]/.test(cell)));
    let dayColumns = [];
    let periodIndex = 0;
    if (headerIndex >= 0) {
      const header = rows[headerIndex].map((cell) => cell.replace(/\s/g, ''));
      dayColumns = DAY_CN.map((day) => header.findIndex((cell) => {
        const sundayAlias = day === '日' && (cell.includes('星期天') || cell === '周天' || cell === '天');
        return cell.includes(`星期${day}`) || cell === `周${day}` || cell === day || sundayAlias;
      }));
      periodIndex = Math.max(0, header.findIndex((cell) => cell.includes('节次')));
    } else {
      dayColumns = [1, 2, 3, 4, 5, 6, 7];
    }
    const courses = [];
    const errors = [];
    const seen = new Set();
    for (let r = headerIndex + 1; r < rows.length; r += 1) {
      const row = rows[r];
      if (!row || !row.some((cell) => cell.trim())) continue;
      const periodRaw = String(row[periodIndex] || '');
      const periodMatch = periodRaw.match(/\d+/);
      const fallbackPeriod = periodMatch ? parseInt(periodMatch[0], 10) : null;
      for (let day = 1; day <= 7; day += 1) {
        const column = dayColumns[day - 1];
        if (column == null || column < 0) continue;
        const cell = String(row[column] || '').trim();
        if (!cell) continue;
        const course = parseCourseCell(cell, day, fallbackPeriod);
        if (!course) { errors.push(`第 ${r + 1} 行周${DAY_CN[day - 1]}的单元格无法识别`); continue; }
        const key = fingerprint(course);
        if (seen.has(key)) continue;
        seen.add(key);
        courses.push(course);
      }
    }
    if (!courses.length && !errors.length) errors.push('表格里没有找到课程内容，请确认包含“节次”和“星期一…星期日”表头。');
    return { courses, errors };
  }

  function parseCompact(text) {
    const courses = [];
    const errors = [];
    text.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line, index) => {
      const parts = line.split('|').map((part) => part.trim());
      if (parts.length < 4) { errors.push(`第 ${index + 1} 行至少需要 4 列：课程名 | 星期 | 节次 | 周次`); return; }
      const [name, dayRaw, periodRaw, weeksRaw, location = '', teacher = '', category = ''] = parts;
      const day = parseDay(dayRaw);
      const periods = parsePeriodRange(periodRaw);
      if (!name) { errors.push(`第 ${index + 1} 行缺少课程名`); return; }
      if (day == null) { errors.push(`第 ${index + 1} 行的星期无法识别：${dayRaw}`); return; }
      if (!periods) { errors.push(`第 ${index + 1} 行的节次无法识别：${periodRaw}`); return; }
      courses.push(U.normalizeCourse({
        name, day, start: periods.start, end: periods.end, weeks: U.normalizeWeeks(weeksRaw),
        location, teacher, category, color: U.colorForName(name)
      }));
    });
    return { courses, errors };
  }

  function parseDay(value) {
    const text = String(value || '').replace(/\s/g, '');
    if (!text) return null;
    if (/不固定|实践|待定/.test(text)) return null;
    if (/周天|星期天/.test(text)) return 7;
    const index = DAY_CN.findIndex((day) => text.includes(day));
    if (index >= 0) return index + 1;
    const numeric = parseInt(text, 10);
    if (numeric >= 1 && numeric <= 7) return numeric;
    const english = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].findIndex((day) => text.toLowerCase().startsWith(day));
    return english >= 0 ? english + 1 : null;
  }

  function parsePeriodRange(value) {
    const text = String(value || '').replace(/[第节]/g, '').replace(/[—–~至]/g, '-').trim();
    const range = text.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) return { start: parseInt(range[1], 10), end: parseInt(range[2], 10) };
    const single = text.match(/^(\d+)$/);
    if (single) return { start: parseInt(single[1], 10), end: parseInt(single[1], 10) };
    const comma = text.match(/^(\d+)\s*,\s*(\d+)$/);
    if (comma) return { start: parseInt(comma[1], 10), end: parseInt(comma[2], 10) };
    return null;
  }

  function parseCourseCell(cell, day, fallbackPeriod) {
    const raw = String(cell || '').replace(/\r/g, '').trim();
    if (!raw) return null;
    const periodAt = raw.search(/[（(]?\s*\d+\s*[-—–~至]\s*\d+\s*节/);
    let name;
    let body;
    if (periodAt > 0) {
      name = raw.slice(0, periodAt).trim();
      body = raw.slice(periodAt).replace(/\s+/g, '');
    } else {
      const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
      name = lines[0] || '';
      body = lines.slice(1).join('').replace(/\s+/g, '');
    }
    name = name.replace(/^[•·\-–—\s]+/, '').trim();
    if (!name) return null;
    let start = fallbackPeriod;
    let end = fallbackPeriod;
    const periodMatch = body.match(/[（(]\s*(\d+)\s*[-—–~至]\s*(\d+)\s*节\s*[）)]/) || body.match(/(\d+)\s*[-—–~至]\s*(\d+)\s*节/) || body.match(/[（(]\s*(\d+)\s*节\s*[）)]/);
    if (periodMatch) {
      start = parseInt(periodMatch[1], 10);
      end = periodMatch[2] ? parseInt(periodMatch[2], 10) : start;
    }
    if (!Number.isFinite(start) || start < 1) return null;
    if (!Number.isFinite(end) || end < start) end = start;
    start = U.clampNumber(start, 1, MAX_PERIODS);
    end = U.clampNumber(end, start, MAX_PERIODS);
    const weeksMatch = body.match(/((?:\d+\s*[-—–~至]\s*\d+|\d+)(?:\s*[,，、]\s*(?:\d+\s*[-—–~至]\s*\d+|\d+))*)\s*周/);
    let parity = 'all';
    if (/周\s*[（(]\s*单\s*[）)]/.test(body) || /单周/.test(body)) parity = 'odd';
    if (/周\s*[（(]\s*双\s*[）)]/.test(body) || /双周/.test(body)) parity = 'even';
    const weeks = U.parseWeeks(weeksMatch ? weeksMatch[1] : '1-16', parity);
    const location = pickField(body, /(?:场地|地点)[:：]([^/／]+)/);
    const teacher = pickField(body, /教师[:：]([^/／]+)/);
    const creditsRaw = pickField(body, /学分[:：]([\d.]+)/);
    const category = pickField(body, /课程性质简称[:：]([^/／]+)/);
    const className = pickField(body, /教学班组成[:：]([^/／]+)/);
    const campus = pickField(body, /校区[:：]([^/／]+)/);
    return U.normalizeCourse({
      name, teacher, location, campus, day, start, end, weeks,
      credits: creditsRaw ? Number(creditsRaw) : null, category, className, color: U.colorForName(name)
    });
  }

  function pickField(body, regex) {
    const match = body.match(regex);
    return match ? match[1].trim() : '';
  }
  Hub.timetableDebug = { parseTSV, parseCompact, parseJSONImport };

  Hub.views.timetable = { render, openImport: () => openImport(), openCourseForm, openDetail, goWeek, goCurrentWeek };
})();
