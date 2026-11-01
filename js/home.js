(function () {
  'use strict';
  const Hub = window.Hub;
  const { $, esc, DAY_CN, PALETTE } = Hub;
  const U = Hub.utils;
  const DATA = window.SITE_DATA;

  const pad2 = (n) => String(n).padStart(2, '0');

  function heroSentence(sessions, pending) {
    if (!sessions.length) {
      return '这一周没有排课，可以整理资料、补实验报告，或者提前安排下周。';
    }
    const days = [...new Set(sessions.map((course) => `周${DAY_CN[course.day - 1]}`))];
    const dayText = days.length <= 1 ? days[0] : `${days.slice(0, -1).join('、')}和${days[days.length - 1]}`;
    const practice = U.practiceForWeek(U.clampWeek(U.getCurrentWeek())).length;
    const tail = pending
      ? `还有 ${pending} 项待办没有完成。`
      : '本周待办已经清空。';
    const practiceText = practice ? `，另有 ${practice} 门实践课` : '';
    return `这周 ${sessions.length} 个时段分布在${dayText}${practiceText}。${tail}`;
  }

  function render() {
    const content = $('#homeContent');
    if (!content) return;

    const currentWeek = U.getCurrentWeek();
    const week = currentWeek < 1 ? 1 : U.clampWeek(currentWeek);
    const sessions = U.coursesForWeek(week);
    const pending = Hub.state.tasks.filter((task) => !task.done).length;
    const materials = DATA.materials.slice().sort((a, b) => b.updated.localeCompare(a.updated));
    const tasks = U.upcomingTasks(4);
    const practice = U.practiceForWeek(week);
    const totalWeeks = Hub.state.timetable.settings.totalWeeks;

    const statItems = [
      ['本周课程', U.uniqueCourseCount(sessions), '门'],
      ['本周时段', sessions.length, '个'],
      ['课程资料', DATA.materials.length, '份'],
      ['待办任务', pending, '项']
    ];

    let html = `<section class="home-hero">
      <div class="hero-copy">
        <div class="eyebrow">${esc(DATA.site.semester)}</div>
        <h1>第 ${week} 周 · ${esc(U.formatWeekRange(week))}</h1>
        <p>${esc(heroSentence(sessions, pending))}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" type="button" data-action="go-timetable">查看课表</button>
          <button class="btn btn-ghost" type="button" data-action="go-materials">浏览资料</button>
          <button class="btn btn-ghost" type="button" data-action="go-planner">安排日程</button>
        </div>
      </div>
      <div class="hero-week">
        <b>${pad2(week)}</b>
        <span>WEEK / ${pad2(totalWeeks)}</span>
      </div>
    </section>

    <div class="hero-stats">
      ${statItems.map(([label, value, unit]) => `<div class="hero-stat"><strong>${value}<small>${unit}</small></strong><span>${label}</span></div>`).join('')}
    </div>

    <div class="notice-bar">
      <svg class="icon"><use href="#i-info"></use></svg>
      <span>${esc(DATA.site.notice)}</span>
    </div>`;

    html += `<div class="home-grid">
      <section class="panel card">
        <div class="panel-head">
          <h2>本周课程</h2>
          <span class="sec-no">§ 01</span>
        </div>
        <div class="line-list">
          ${sessions.length ? sessions.map((course) => {
            const date = U.addDays(U.mondayOfWeek(week), course.day - 1);
            const color = PALETTE[course.color] || PALETTE.slate;
            return `<div class="line-item clickable" data-course-day="${course.day}" data-course-week="${week}">
              <span class="day-badge" style="background:${color}" title="周${DAY_CN[course.day - 1]}"></span>
              <span class="line-body">
                <span class="line-title">${esc(course.name)}</span>
                <span class="line-meta">周${DAY_CN[course.day - 1]} ${date.getMonth() + 1}/${date.getDate()} · ${esc(course.location || '地点未填')}${course.teacher ? ' · ' + esc(course.teacher) : ''}</span>
              </span>
              <span class="line-side"><strong>${esc(U.formatPeriod(course))}</strong>${esc(U.formatWeeks(course.weeks))}</span>
            </div>`;
          }).join('') : `<div class="empty-state" style="padding:24px 14px"><h3>本周没有课程</h3><p>可以导入自己的课表，或切换到其他周查看。</p></div>`}
        </div>
        <div class="panel-head" style="margin:16px 0 8px">
          <button class="link" type="button" data-action="go-timetable">完整课表 →</button>
        </div>
      </section>

      <section class="panel card">
        <div class="panel-head">
          <h2>近期任务</h2>
          <span class="sec-no">§ 02</span>
        </div>
        <div>
          ${tasks.length ? tasks.map((task) => `<div class="task-mini" data-task="${esc(task.id)}">
            <span class="task-check"><svg class="icon"><use href="#i-check"></use></svg></span>
            <span class="line-body">
              <span class="line-title">${esc(task.title)}</span>
              <span class="line-meta">${esc(U.formatShortDate(task.date))} · ${esc(DATA.taskCategories[task.category] ? DATA.taskCategories[task.category].label : '任务')}</span>
            </span>
          </div>`).join('') : `<div class="empty-state" style="padding:24px 14px"><h3>暂时没有待办</h3><p>点“日程计划”添加作业、实验或社团安排。</p></div>`}
        </div>
        <div class="panel-head" style="margin:16px 0 8px">
          <button class="link" type="button" data-action="go-planner">日程计划 →</button>
        </div>
      </section>
    </div>`;

    html += `<div class="home-grid">
      <section class="panel card">
        <div class="panel-head">
          <h2>最新资料</h2>
          <span class="sec-no">§ 03</span>
        </div>
        ${materials.slice(0, 4).map((material) => {
          const materialLabel = [material.grade, material.subject].filter(Boolean).join(' · ') || '未分类';
          return `<div class="material-mini" data-material="${esc(material.id)}">
            <span class="file-badge ${material.type.toLowerCase()}">${esc(material.type)}</span>
            <span class="line-body">
              <span class="line-title">${esc(material.title)}</span>
              <span class="line-meta">${esc(materialLabel)} · ${esc(material.size)} · ${esc(material.updated)}</span>
            </span>
          </div>`;
        }).join('')}
        <div class="panel-head" style="margin:12px 0 0">
          <button class="link" type="button" data-action="go-materials">全部资料 →</button>
        </div>
      </section>

      <section class="panel card">
        <div class="panel-head">
          <h2>${practice.length ? '实践课程' : '快速入口'}</h2>
          <span class="sec-no">§ 04</span>
        </div>
        ${practice.length ? practice.map((course) => `<div class="line-item" data-course-day="" data-course-week="${week}">
          <span class="day-badge" style="background:${PALETTE.slate}"></span>
          <span class="line-body">
            <span class="line-title">${esc(course.name)}</span>
            <span class="line-meta">${esc([course.teacher, course.location].filter(Boolean).join(' · ') || '时间地点待定')}${course.note ? ' · ' + esc(course.note) : ''}</span>
          </span>
          <span class="line-side"><strong>实践</strong>${esc(U.formatWeeks(course.weeks))}</span>
        </div>`).join('') : ''}
        <div class="quick-links" style="grid-template-columns:1fr;margin-top:${practice.length ? '14px' : '0'}">
          <button class="quick-card" type="button" data-action="import-timetable">
            <span class="quick-icon"><svg class="icon"><use href="#i-upload"></use></svg></span>
            <strong>导入自己的课表</strong>
            <small>支持 Excel / 教务系统复制 / 手动添加</small>
          </button>
          <button class="quick-card" type="button" data-action="add-task">
            <span class="quick-icon"><svg class="icon"><use href="#i-plus"></use></svg></span>
            <strong>添加一个任务</strong>
            <small>作业、实验、社团、生活安排都可以放进来</small>
          </button>
        </div>
      </section>
    </div>`;

    html += `<div class="tt-footnote" style="margin-top:14px">提示：当前版本没有登录和云端同步，换浏览器或清除数据后课表/任务不会自动恢复。可以在“设置”里导出 JSON 备份。</div>`;

    content.innerHTML = html;
    content.onclick = onClick;
  }

  function onClick(event) {
    const action = event.target.closest('[data-action]');
    if (action) {
      const name = action.dataset.action;
      if (name === 'go-timetable') return Hub.navigate('timetable');
      if (name === 'go-materials') return Hub.navigate('materials');
      if (name === 'go-planner') return Hub.navigate('planner');
      if (name === 'import-timetable') {
        Hub.navigate('timetable');
        setTimeout(() => Hub.views.timetable.openImport(), 80);
        return;
      }
      if (name === 'add-task') {
        Hub.navigate('planner');
        setTimeout(() => Hub.views.planner.openTaskForm(), 80);
        return;
      }
    }

    const material = event.target.closest('[data-material]');
    if (material) {
      Hub.navigate('materials');
      setTimeout(() => Hub.views.materials.openDetail(material.dataset.material), 80);
      return;
    }

    const task = event.target.closest('[data-task]');
    if (task) {
      Hub.navigate('planner');
      setTimeout(() => Hub.views.planner.openTaskForm(task.dataset.task), 80);
      return;
    }

    const course = event.target.closest('[data-course-day]');
    if (course) {
      const day = parseInt(course.dataset.courseDay, 10);
      if (!day) return;
      Hub.state.ttWeek = parseInt(course.dataset.courseWeek, 10);
      Hub.state.ttDay = day;
      Hub.navigate('timetable');
    }
  }

  Hub.views.home = { render };
})();
