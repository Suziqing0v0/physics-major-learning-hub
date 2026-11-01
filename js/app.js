(function () {
  'use strict';
  const Hub = window.Hub;
  const { $, esc } = Hub;
  const U = Hub.utils;
  const DATA = window.SITE_DATA;

  let deferredInstallPrompt = null;

  function init() {
    $('#siteTitle').textContent = DATA.site.title;
    $('#siteSemester').textContent = Hub.state.timetable.settings.semester;
    $('#mobileSemester').textContent = Hub.state.timetable.settings.semester;

    $('#settingsBtn').addEventListener('click', openSettings);
    $('#mobileSettingsBtn').addEventListener('click', openSettings);
    $('#aboutBtn').addEventListener('click', openAbout);
    $('#ttImportBtn').addEventListener('click', () => Hub.views.timetable.openImport());
    $('#ttAddBtn').addEventListener('click', () => Hub.views.timetable.openCourseForm());
    $('#modalClose').addEventListener('click', Hub.ui.closeModal);
    $('#modalBackdrop').addEventListener('click', (event) => {
      if (event.target === $('#modalBackdrop')) Hub.ui.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !$('#modalBackdrop').hidden) Hub.ui.closeModal();
    });
    window.addEventListener('hashchange', () => Hub.render());
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      $('#installApp').hidden = false;
    });
    $('#installApp').addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        Hub.ui.toast('请用浏览器菜单里的“添加到主屏幕”');
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      $('#installApp').hidden = true;
    });
    if (!location.hash) location.hash = '#/home';
    Hub.render();
    playIntro();
    registerServiceWorker();
  }

  function playIntro() {
    const root = document.documentElement || document.body;
    if (!root.classList.contains('intro-ready')) return;

    const curtain = $('#introCurtain');
    if (curtain) {
      $('#introCollege').textContent = DATA.site.college || '物理学（师范）';
      const titleParts = String(DATA.site.title || '').split('·');
      $('#introSub').textContent = titleParts.length > 1 ? titleParts.slice(1).join('·').trim() : '学习中心';
      const week = Hub.utils.getCurrentWeek();
      $('#introWeek').textContent = week > 0 ? `WEEK ${String(week).padStart(2, '0')}` : 'WEEK --';
    }

    const finish = () => {
      try { sessionStorage.setItem('hub-intro-seen', '1'); } catch (err) {}
      root.classList.remove('intro-ready');
    };

    if (curtain) {
      curtain.addEventListener('click', finish, { once: true });
      curtain.addEventListener('touchstart', finish, { once: true, passive: true });
    }
    document.addEventListener('keydown', finish, { once: true });
    setTimeout(finish, 900);
  }

  function openSettings() {
    const settings = Hub.state.timetable.settings;
    const body = `<form id="settingsForm" class="form-grid" novalidate>
      <div class="form-field"><label for="s-name">课表显示名称</label><input id="s-name" name="studentName" value="${esc(settings.studentName)}" placeholder="例如：示例同学"></div>
      <div class="form-field"><label for="s-semester">学期名称</label><input id="s-semester" name="semester" value="${esc(settings.semester)}" placeholder="例如：2026-2027 学年第 1 学期"></div>
      <div class="form-field"><label for="s-start">开学日期（第 1 周周一）</label><input id="s-start" name="startDate" type="date" value="${esc(settings.startDate)}"></div>
      <div class="form-field"><label for="s-weeks">总周数</label><input id="s-weeks" name="totalWeeks" type="number" min="1" max="30" step="1" value="${settings.totalWeeks}"></div>
      <div class="form-row-note">开学日期用于计算“第几周”。如果周次显示不对，改这里即可。数据只保存在当前浏览器。</div>
    </form>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:14px">
      <button class="btn btn-soft" type="button" id="exportBtn"><svg class="icon"><use href="#i-download"></use></svg>导出 JSON</button>
      <button class="btn btn-soft" type="button" id="importBtn"><svg class="icon"><use href="#i-upload"></use></svg>导入 JSON</button>
      <input id="importFile" type="file" accept=".json,application/json" hidden>
      <button class="btn btn-soft" type="button" id="resetBtn">恢复示例数据</button>
      <button class="btn btn-danger" type="button" id="clearBtn">清空本地数据</button>
    </div>
    <div class="tt-footnote" style="margin-top:10px">当前是轻量版：没有账号和云端同步。换浏览器、清除浏览器数据或卸载前，请先导出备份。</div>
    <div style="margin-top:10px"><button class="btn btn-ghost" type="button" id="aboutFromSettings" style="padding-left:0"><svg class="icon"><use href="#i-info"></use></svg>关于这个网站</button></div>`;
    const footer = `<button class="btn btn-ghost" type="button" id="settingsCancel">取消</button>
      <button class="btn btn-primary" type="submit" form="settingsForm">保存设置</button>`;
    Hub.ui.openModal('设置', body, footer);

    $('#settingsCancel').addEventListener('click', Hub.ui.closeModal);
    $('#aboutFromSettings').addEventListener('click', openAbout);
    $('#exportBtn').addEventListener('click', exportBackup);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || '{}'));
          Hub.storage.importData(data);
          Hub.ui.closeModal();
          Hub.render();
          Hub.ui.toast('已导入本地备份');
        } catch (err) {
          Hub.ui.toast('导入失败：' + err.message);
        }
      };
      reader.readAsText(file);
    });
    $('#resetBtn').addEventListener('click', () => {
      Hub.ui.confirm('恢复示例数据', '当前课表和任务会被示例数据覆盖，确定继续吗？', '恢复', () => {
        Hub.storage.resetData();
        Hub.ui.closeModal();
        Hub.render();
        Hub.ui.toast('已恢复示例数据');
      });
    });
    $('#clearBtn').addEventListener('click', () => {
      Hub.ui.confirm('清空本地数据', '会删除本浏览器里的课表和任务，且不可撤销。建议先导出备份。', '清空', () => {
        Hub.state.timetable.courses = [];
        Hub.state.tasks = [];
        Hub.storage.saveTimetable();
        Hub.storage.saveTasks();
        Hub.ui.closeModal();
        Hub.render();
        Hub.ui.toast('已清空本地数据');
      }, true);
    });
    $('#settingsForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const startDate = String(data.get('startDate') || '').trim();
      if (!U.parseDateLocal(startDate)) { Hub.ui.toast('请选择有效的开学日期'); return; }
      Hub.state.timetable.settings.studentName = String(data.get('studentName') || '').trim() || '示例同学';
      Hub.state.timetable.settings.semester = String(data.get('semester') || '').trim() || DATA.site.semester;
      Hub.state.timetable.settings.startDate = startDate;
      Hub.state.timetable.settings.totalWeeks = U.clampNumber(parseInt(data.get('totalWeeks'), 10) || 20, 1, 30);
      Hub.state.ttWeek = U.clampWeek(Hub.state.ttWeek);
      Hub.state.plannerWeek = U.clampWeek(Hub.state.plannerWeek);
      Hub.storage.saveTimetable();
      Hub.ui.closeModal();
      Hub.render();
      Hub.ui.toast('设置已保存');
    });
  }

  function exportBackup() {
    const data = Hub.storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    link.href = url;
    link.download = `学习中心备份-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
    Hub.ui.toast('已导出 JSON 备份');
  }

  function openAbout() {
    const body = `<div style="font-size:12px;line-height:1.8;color:var(--muted)">
      <p style="margin:0 0 10px"><strong style="color:var(--ink)">${esc(DATA.site.title)}</strong> 是第一版轻量网站，先服务一个专业/年级。</p>
      <p style="margin:0 0 10px">当前包含：课程资料浏览、课表导入与本地保存、日程计划与本地保存、电脑/手机响应式布局。</p>
      <p style="margin:0 0 10px">当前不包含：账号登录、资料上传、全文搜索、云端同步、管理员后台。这些是后续阶段。</p>
      <p style="margin:0 0 10px">数据隐私：课表和任务保存在浏览器的 localStorage 中，不会上传到服务器。课程资料目前为示例条目，正式上线前需要替换为已授权文件。</p>
      <p style="margin:0">后续建议：先找一个专业试用，收集反馈，再决定是否接入登录、数据库和搜索。</p>
    </div>`;
    const footer = `<span class="spacer"></span><button class="btn btn-primary" type="button" id="aboutClose">知道了</button>`;
    Hub.ui.openModal('关于这个网站', body, footer);
    $('#aboutClose').addEventListener('click', Hub.ui.closeModal);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  Hub.init = init;
  window.addEventListener('DOMContentLoaded', init);
})();
