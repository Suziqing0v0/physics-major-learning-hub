(function () {
  'use strict';
  const Hub = window.Hub;
  const { $, esc } = Hub;
  const DATA = window.SITE_DATA;
  const META = window.MATERIALS_META || {};

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function gradeRank(grade) {
    const list = Array.isArray(META.grades) ? META.grades : [];
    const index = list.indexOf(grade);
    return index < 0 ? 999 : index;
  }

  function gradeList() {
    return Array.isArray(META.grades) && META.grades.length ? META.grades : unique(DATA.materials.map((item) => item.grade));
  }

  function subjectList() {
    if (Hub.state.materialGrade !== 'all') {
      if (META.subjects && Array.isArray(META.subjects[Hub.state.materialGrade])) {
        return META.subjects[Hub.state.materialGrade];
      }
      return unique(DATA.materials.filter((item) => item.grade === Hub.state.materialGrade).map((item) => item.subject));
    }
    return unique(DATA.materials.map((item) => item.subject));
  }

  function materialLabel(material) {
    return [material.grade, material.subject].filter(Boolean).join(' · ') || '未分类';
  }

  function filteredMaterials() {
    const query = Hub.state.materialQuery.trim().toLowerCase();
    return DATA.materials
      .filter((material) => Hub.state.materialGrade === 'all' || material.grade === Hub.state.materialGrade)
      .filter((material) => Hub.state.materialSubject === 'all' || material.subject === Hub.state.materialSubject)
      .filter((material) => {
        if (!query) return true;
        const haystack = [
          material.title,
          material.fileName,
          material.grade,
          material.subject,
          material.description,
          material.type,
          ...(material.tags || [])
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const gradeDiff = gradeRank(a.grade) - gradeRank(b.grade);
        if (gradeDiff) return gradeDiff;
        const subjectDiff = String(a.subject).localeCompare(String(b.subject), 'zh-CN');
        if (subjectDiff) return subjectDiff;
        return String(a.fileName).localeCompare(String(b.fileName), 'zh-CN');
      });
  }

  function render() {
    const count = $('#materialsCount');
    if (count) count.textContent = `${DATA.materials.length} 份资料`;
    renderFilters();
    const search = $('#materialSearch');
    if (search) {
      search.value = Hub.state.materialQuery;
      search.oninput = () => {
        Hub.state.materialQuery = search.value;
        renderList();
      };
    }
    renderList();
  }

  function renderFilters() {
    const gradeFilter = $('#gradeFilter');
    const subjectFilter = $('#subjectFilter');
    if (!gradeFilter || !subjectFilter) return;

    const grades = ['all'].concat(gradeList());
    gradeFilter.innerHTML = grades.map((grade) => {
      const label = grade === 'all' ? '全部' : grade;
      return `<button class="filter-chip${Hub.state.materialGrade === grade ? ' is-active' : ''}" type="button" data-grade="${esc(grade)}">${esc(label)}</button>`;
    }).join('');
    gradeFilter.onclick = (event) => {
      const chip = event.target.closest('[data-grade]');
      if (!chip) return;
      Hub.state.materialGrade = chip.dataset.grade;
      Hub.state.materialSubject = 'all';
      renderFilters();
      renderList();
    };

    const subjects = ['all'].concat(subjectList());
    subjectFilter.innerHTML = subjects.map((subject) => {
      const label = subject === 'all' ? '全部' : subject;
      return `<button class="filter-chip${Hub.state.materialSubject === subject ? ' is-active' : ''}" type="button" data-subject="${esc(subject)}">${esc(label)}</button>`;
    }).join('');
    subjectFilter.onclick = (event) => {
      const chip = event.target.closest('[data-subject]');
      if (!chip) return;
      Hub.state.materialSubject = chip.dataset.subject;
      renderFilters();
      renderList();
    };
  }

  function renderList() {
    const container = $('#materialsContent');
    if (!container) return;
    const list = filteredMaterials();
    if (!list.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-icon"><svg class="icon" style="width:20px;height:20px"><use href="#i-search"></use></svg></div>
        <h3>没有找到匹配的资料</h3>
        <p>换个关键词，或清除年级/学科筛选。</p>
        <button class="btn btn-primary" type="button" data-action="clear-filter">清除筛选</button>
      </div>`;
      container.onclick = (event) => {
        if (event.target.closest('[data-action="clear-filter"]')) {
          Hub.state.materialQuery = '';
          Hub.state.materialGrade = 'all';
          Hub.state.materialSubject = 'all';
          const search = $('#materialSearch');
          if (search) search.value = '';
          renderFilters();
          renderList();
        }
      };
      return;
    }

    container.innerHTML = `<div class="materials-grid">${list.map((material) => `
      <button class="material-card" type="button" data-material="${esc(material.id)}">
        ${material.sample ? '<span class="sample-pill">示例</span>' : ''}
        <span class="material-top">
          <span class="file-badge ${esc(String(material.type).toLowerCase())}">${esc(material.type)}</span>
          <span style="min-width:0">
            <span class="material-title">${esc(material.title)}</span>
            <span class="material-course">${esc(materialLabel(material))}</span>
          </span>
        </span>
        <span class="material-desc">${esc(material.description)}</span>
        <span class="material-foot">
          <span class="material-tags">${(material.tags || []).map((tag) => `<span class="chip chip-slate">${esc(tag)}</span>`).join('')}</span>
          <span>${esc(material.size)} · ${esc(material.updated)}</span>
        </span>
      </button>`).join('')}</div>`;
    container.onclick = (event) => {
      const card = event.target.closest('[data-material]');
      if (card) openDetail(card.dataset.material);
    };
  }

  function openDetail(id) {
    const material = DATA.materials.find((item) => item.id === id);
    if (!material) return;
    const body = `<div class="detail-title">
      <span class="file-badge ${esc(String(material.type).toLowerCase())}" style="width:42px;height:46px">${esc(material.type)}</span>
      <h3>${esc(material.title)}</h3>
    </div>
    <p class="detail-sub">${esc(materialLabel(material))} · ${esc(material.size)} · 更新于 ${esc(material.updated)}</p>
    <div class="detail-grid">
      <div class="detail-item"><div class="k">年级</div><div class="v">${esc(material.grade || '未分类')}</div></div>
      <div class="detail-item"><div class="k">学科</div><div class="v">${esc(material.subject || '未分类')}</div></div>
      <div class="detail-item"><div class="k">文件类型</div><div class="v">${esc(material.type)}</div></div>
      <div class="detail-item"><div class="k">文件大小</div><div class="v">${esc(material.size)}</div></div>
      <div class="detail-item full"><div class="k">文件名</div><div class="v" style="font-weight:400;word-break:break-all">${esc(material.fileName || material.title)}</div></div>
      <div class="detail-item full"><div class="k">标签</div><div class="v">${(material.tags || []).map((tag) => `<span class="chip chip-slate" style="margin-right:4px">${esc(tag)}</span>`).join('') || '无'}</div></div>
      <div class="detail-item full"><div class="k">说明</div><div class="v" style="font-weight:400">${esc(material.description || '课程资料')}</div></div>
    </div>
    ${material.sample
      ? '<div class="detail-note">这是公开演示资料，没有真实文件。把真实文件放进本地“资料”目录并运行 scripts/build-materials.py 后即可显示。</div>'
      : '<div class="detail-note">文件来自站点内的“资料”目录。PDF 通常会在浏览器中打开，DOC 可能会下载；如果浏览器拦截了新窗口，请允许弹窗或再次点击。</div>'}`;
    const footer = `<span class="spacer"></span>
      <button class="btn btn-ghost" type="button" id="materialClose">关闭</button>
      <button class="btn btn-primary" type="button" id="materialDownload"><svg class="icon"><use href="#i-download"></use></svg>打开资料</button>`;
    Hub.ui.openModal('资料详情', body, footer);
    $('#materialClose').addEventListener('click', Hub.ui.closeModal);
    $('#materialDownload').addEventListener('click', () => {
      if (!material.url) {
        Hub.ui.toast(material.sample ? '这是示例资料；接入真实文件后即可打开' : '这条资料还没有配置文件地址');
        return;
      }
      const link = document.createElement('a');
      link.href = material.url;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      Hub.ui.toast('正在打开资料…');
    });
  }

  Hub.views.materials = { render, openDetail, materialLabel };
})();
