(function () {
  'use strict';
  const Hub = window.Hub;
  const { $, esc, DAY_FULL } = Hub;
  const U = Hub.utils;
  const DATA = window.SITE_DATA;

  function render() {
    const week = Hub.state.plannerWeek;
    $('#plannerWeekNumber').textContent = String(week);
    $('#plannerWeekRange').textContent = U.formatWeekRange(week);
    $('#plannerPrevBtn').onclick = () => goWeek(-1);
    $('#plannerNextBtn').onclick = () => goWeek(1);
    $('#plannerAddBtn').onclick = () => openTaskForm();

    const content = $('#plannerContent');
    if (!content) return;
    const tasks = U.tasksForWeek(week);
    const done = tasks.filter((task) => task.done).length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    const monday = U.mondayOfWeek(week);
    const currentWeek = U.getCurrentWeek();
    const today = new Date();

    let html = `<div class="planner-summary">
      <div>
        <div class="summary-text"><strong>${done}/${tasks.length}</strong> 本周任务完成</div>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
      </div>
      <button class="btn btn-ghost" type="button" data-action="planner-current">回到本周</button>
    </div>
    <div class="planner-grid">`;

    for (let day = 1; day <= 7; day += 1) {
      const date = U.addDays(monday, day - 1);
      const key = U.dateKey(date);
      const dayTasks = U.tasksForDate(key);
      const isToday = week === currentWeek && U.sameDay(date, today);
      html += `<div class="planner-day${isToday ? ' is-today' : ''}" data-date="${key}">
        <div class="planner-day-head">
          <b>${DAY_FULL[day - 1]}</b>
          <span>${date.getMonth() + 1}/${date.getDate()}${isToday ? '<i class="today-pill">今天</i>' : ''}</span>
        </div>
        ${dayTasks.length ? dayTasks.map((task) => `<button class="planner-chip ${esc(task.category)}${task.done ? ' done' : ''}" type="button" data-task="${esc(task.id)}">${esc(task.title)}</button>`).join('') : '<span class="planner-day-empty">空闲</span>'}
      </div>`;
    }
    html += `</div>
    <section class="task-panel card">
      <div class="task-panel-head"><h2>本周任务</h2><span class="sub">点击任务可编辑，点日期可添加</span></div>
      <div class="task-list">`;

    if (!tasks.length) {
      html += `<div class="empty-state" style="padding:28px 16px">
        <div class="empty-icon"><svg class="icon" style="width:19px;height:19px"><use href="#i-tasks"></use></svg></div>
        <h3>这一周还没有任务</h3>
        <p>可以添加作业、实验、社团或生活安排。</p>
        <button class="btn btn-primary" type="button" data-action="planner-add">添加任务</button>
      </div>`;
    } else {
      html += tasks.map((task) => `<div class="task-row${task.done ? ' done' : ''}" data-task-row="${esc(task.id)}">
        <button class="task-check${task.done ? ' done' : ''}" type="button" data-task-toggle="${esc(task.id)}" aria-label="切换完成"><svg class="icon"><use href="#i-check"></use></svg></button>
        <div class="task-main">
          <div class="task-title-line">
            <span class="task-title">${esc(task.title)}</span>
            <span class="chip chip-${esc(DATA.taskCategories[task.category].color)}">${esc(DATA.taskCategories[task.category].label)}</span>
          </div>
          ${task.note ? `<div class="task-note">${esc(task.note)}</div>` : ''}
        </div>
        <div class="task-side">
          <span class="task-date">${esc(U.formatShortDate(task.date))}</span>
          <button class="task-edit" type="button" data-task-edit="${esc(task.id)}" aria-label="编辑任务"><svg class="icon"><use href="#i-pencil"></use></svg></button>
        </div>
      </div>`).join('');
    }
    html += `</div></section>`;
    content.innerHTML = html;
    content.onclick = handleClick;
  }

  function handleClick(event) {
    const action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'planner-current') return goCurrentWeek();
      if (action.dataset.action === 'planner-add') return openTaskForm();
    }

    const toggle = event.target.closest('[data-task-toggle]');
    if (toggle) {
      const task = Hub.state.tasks.find((item) => item.id === toggle.dataset.taskToggle);
      if (task) {
        task.done = !task.done;
        Hub.storage.saveTasks();
        render();
        Hub.ui.toast(task.done ? '已完成' : '已恢复为待办');
      }
      return;
    }

    const edit = event.target.closest('[data-task-edit]');
    if (edit) {
      openTaskForm(edit.dataset.taskEdit);
      return;
    }

    const taskChip = event.target.closest('[data-task]');
    if (taskChip) {
      openTaskForm(taskChip.dataset.task);
      return;
    }

    const taskRow = event.target.closest('[data-task-row]');
    if (taskRow) {
      openTaskForm(taskRow.dataset.taskRow);
      return;
    }

    const day = event.target.closest('[data-date]');
    if (day) {
      openTaskForm(null, day.dataset.date);
    }
  }

  function goWeek(delta) {
    Hub.state.plannerWeek = U.clampWeek(Hub.state.plannerWeek + delta);
    render();
  }

  function goCurrentWeek() {
    const current = U.getCurrentWeek();
    Hub.state.plannerWeek = current < 1 ? 1 : U.clampWeek(current);
    render();
    Hub.ui.toast(`已回到第 ${Hub.state.plannerWeek} 周`);
  }

  function openTaskForm(id, prefillDate) {
    const editing = id ? Hub.state.tasks.find((task) => task.id === id) : null;
    const defaultDate = prefillDate || (() => {
      const current = U.getCurrentWeek();
      if (Hub.state.plannerWeek === current) return U.dateKey(new Date());
      return U.dateKey(U.mondayOfWeek(Hub.state.plannerWeek));
    })();
    const task = editing || { title: '', date: defaultDate, category: 'course', note: '', done: false };
    const categories = Object.entries(DATA.taskCategories).map(([key, value]) => `<option value="${key}"${task.category === key ? ' selected' : ''}>${esc(value.label)}</option>`).join('');
    const body = `<form id="taskForm" class="form-grid" novalidate>
      <div class="form-field full"><label for="task-title">任务标题<span class="req">*</span></label><input id="task-title" name="title" autocomplete="off" value="${esc(task.title)}" placeholder="例如：高等数学第3章作业"></div>
      <div class="form-field"><label for="task-date">日期</label><input id="task-date" name="date" type="date" value="${esc(task.date)}"></div>
      <div class="form-field"><label for="task-category">分类</label><select id="task-category" name="category">${categories}</select></div>
      <div class="form-field full"><label for="task-note">备注</label><textarea id="task-note" name="note" placeholder="选填，例如：截止时间、地点、提交方式">${esc(task.note)}</textarea></div>
      <div class="form-field full"><label style="display:flex;align-items:center;gap:7px;font-size:11px;color:var(--ink-2)"><input type="checkbox" name="done"${task.done ? ' checked' : ''} style="width:auto;min-height:auto"> 已完成</label></div>
    </form>`;
    const footer = `${editing ? '<button class="btn btn-danger" type="button" id="taskDelete">删除</button><span class="spacer"></span>' : ''}
      <button class="btn btn-ghost" type="button" id="taskCancel">取消</button>
      <button class="btn btn-primary" type="submit" form="taskForm">${editing ? '保存修改' : '添加任务'}</button>`;
    Hub.ui.openModal(editing ? '编辑任务' : '添加任务', body, footer);
    $('#taskCancel').addEventListener('click', Hub.ui.closeModal);
    if (editing) {
      $('#taskDelete').addEventListener('click', () => {
        Hub.ui.confirm('删除任务', `确定删除「${task.title}」吗？`, '删除', () => {
          Hub.state.tasks = Hub.state.tasks.filter((item) => item.id !== task.id);
          Hub.storage.saveTasks();
          Hub.ui.closeModal();
          Hub.render();
          Hub.ui.toast('已删除任务');
        }, true);
      });
    }
    $('#taskForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const title = String(data.get('title') || '').trim();
      const date = String(data.get('date') || '').trim();
      if (!title) { Hub.ui.toast('请填写任务标题'); return; }
      if (!date) { Hub.ui.toast('请选择任务日期'); return; }
      const next = U.normalizeTask({
        id: editing ? editing.id : U.uid('task'),
        title,
        date,
        category: data.get('category'),
        note: data.get('note'),
        done: data.get('done') === 'on'
      });
      if (editing) {
        Hub.state.tasks = Hub.state.tasks.map((item) => item.id === editing.id ? next : item);
      } else {
        Hub.state.tasks.push(next);
      }
      Hub.storage.saveTasks();
      Hub.ui.closeModal();
      Hub.render();
      Hub.ui.toast(editing ? '已保存任务' : '已添加任务');
    });
  }

  Hub.views.planner = { render, openTaskForm };
})();
