// js/workforce_page.js
// 인력 계획 페이지: CRUD + 간단 합계/차트 준비 포맷(표만 렌더, 차트는 필요 시 확장)

window.WorkforcePage = (function(){

  function _rowHtml(r){
    return `
    <tr class="border-t border-slate-200">
      <td class="px-2 py-2 text-sm">${escapeHtml(r.orgUnit)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.roleName)}</td>
      <td class="px-2 py-2 text-sm text-right">${r.current}</td>
      <td class="px-2 py-2 text-sm text-right">${r.needed}</td>
      <td class="px-2 py-2 text-sm text-right ${r.delta>0?'text-rose-600':(r.delta<0?'text-emerald-600':'')}">${r.delta}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.timeframe)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.justification||'')}</td>
      <td class="px-2 py-2 text-sm">
        <button class="btn-xs bg-slate-100 hover:bg-slate-200" data-act="edit" data-id="${r.id}">편집</button>
        <button class="btn-xs bg-rose-500 text-white hover:bg-rose-600" data-act="del" data-id="${r.id}">삭제</button>
      </td>
    </tr>`;
  }

  function _formHtml(){
    return `
    <div class="bg-white border border-slate-200 rounded-md p-4 mb-4">
      <h3 class="text-lg font-bold text-slate-900 mb-3">신규/편집</h3>
      <div class="grid sm:grid-cols-3 gap-3">
        <input id="w-org" class="form-input rounded-md border-slate-300" placeholder="조직(예: Platform)"/>
        <input id="w-role" class="form-input rounded-md border-slate-300" placeholder="직무(예: Backend)"/>
        <input id="w-current" type="number" class="form-input rounded-md border-slate-300" placeholder="현재 인원"/>
        <input id="w-needed" type="number" class="form-input rounded-md border-slate-300" placeholder="필요 인원"/>
        <input id="w-timeframe" class="form-input rounded-md border-slate-300" placeholder="시기(예: 2025 Q1)"/>
        <input id="w-just" class="form-input rounded-md border-slate-300" placeholder="사유/근거"/>
      </div>
      <div class="mt-4 flex gap-2">
        <button id="w-save" class="inline-flex items-center gap-1 rounded-md bg-[#137fec] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600">저장</button>
        <button id="w-cancel" class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200" disabled>취소</button>
      </div>
    </div>`;
  }

  function _filtersHtml(){
    return `
    <div class="bg-white border border-slate-200 rounded-md p-4">
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="w-keyword" class="form-input rounded-md border-slate-300" placeholder="키워드(조직/직무/시기)"/>
        <input id="w-org-filter" class="form-input rounded-md border-slate-300" placeholder="조직(정확히)"/>
        <button id="w-apply" class="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">필터 적용</button>
        <div class="text-right text-sm text-slate-600 self-center" id="w-sum"></div>
      </div>
    </div>`;
  }

  function _tableShell(){
    return `
    <div class="bg-white border border-slate-200 rounded-md mt-4 overflow-auto">
      <table class="min-w-full table-sticky">
        <thead>
          <tr class="text-left text-sm text-slate-600">
            <th class="px-2 py-2">조직</th>
            <th class="px-2 py-2">직무</th>
            <th class="px-2 py-2">현재</th>
            <th class="px-2 py-2">필요</th>
            <th class="px-2 py-2">증감</th>
            <th class="px-2 py-2">시기</th>
            <th class="px-2 py-2">사유</th>
            <th class="px-2 py-2 w-28">작업</th>
          </tr>
        </thead>
        <tbody id="w-tbody"></tbody>
      </table>
    </div>`;
  }

  let editId = null;
  let cache = [];

  async function render(container){
    container.innerHTML = `
      <section class="space-y-4">
        ${_formHtml()}
        ${_filtersHtml()}
        ${_tableShell()}
      </section>
    `;
    bind();
    await refresh();
  }

  function readForm(){
    return {
      orgUnit: byId('w-org').value.trim(),
      roleName: byId('w-role').value.trim(),
      current: Number(byId('w-current').value || 0),
      needed: Number(byId('w-needed').value || 0),
      timeframe: byId('w-timeframe').value.trim(),
      justification: byId('w-just').value.trim(),
    };
  }

  function fillForm(r){
    byId('w-org').value = r.orgUnit || '';
    byId('w-role').value = r.roleName || '';
    byId('w-current').value = r.current ?? 0;
    byId('w-needed').value = r.needed ?? 0;
    byId('w-timeframe').value = r.timeframe || '';
    byId('w-just').value = r.justification || '';
  }

  function clearForm(){ fillForm({ current:0, needed:0 }); }

  async function refresh(){
    const orgFilter = byId('w-org-filter').value.trim();
    cache = await DataStore.listWorkforce({ orgUnit: orgFilter || undefined });
    drawTable();
  }

  function drawTable(){
    const kw = byId('w-keyword').value.trim().toLowerCase();
    const rows = cache.filter(r=>{
      if (!kw) return true;
      const hay = [r.orgUnit, r.roleName, r.timeframe, r.justification].join(' ').toLowerCase();
      return hay.includes(kw);
    });
    const tb = byId('w-tbody');
    tb.innerHTML = rows.map(_rowHtml).join('') || `
      <tr><td colspan="8" class="px-3 py-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
    `;

    // 합계
    const totalDelta = rows.reduce((s,r)=>s+(Number(r.delta)||0),0);
    const totalNeeded = rows.reduce((s,r)=>s+(Number(r.needed)||0),0);
    const totalCurrent = rows.reduce((s,r)=>s+(Number(r.current)||0),0);
    byId('w-sum').textContent = `합계: 현재 ${totalCurrent} / 필요 ${totalNeeded} / 증감 ${totalDelta}`;

    tb.querySelectorAll('button[data-act]').forEach(btn=>{
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener('click', async ()=>{
        const target = cache.find(x=>x.id===id);
        if (!target) return;
        if (act==='edit'){
          editId = id;
          fillForm(target);
          byId('w-cancel').disabled = false;
        } else if (act==='del'){
          if (!confirm('삭제하시겠습니까?')) return;
          await DataStore.deleteWorkforce(id);
          await refresh();
        }
      });
    });
  }

  function bind(){
    byId('w-save').addEventListener('click', async ()=>{
      const payload = readForm();
      if (!payload.orgUnit || !payload.roleName) return alert('조직/직무를 입력하세요.');
      if (editId){
        await DataStore.updateWorkforce(editId, payload);
        editId = null;
      } else {
        await DataStore.createWorkforce(payload);
      }
      clearForm();
      byId('w-cancel').disabled = true;
      await refresh();
    });

    byId('w-cancel').addEventListener('click', ()=>{
      editId = null;
      clearForm();
      byId('w-cancel').disabled = true;
    });

    byId('w-apply').addEventListener('click', refresh);
  }

  return { render };
})();
