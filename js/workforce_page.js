// js/workforce_page.js
// 간결 버전: org/role/needed 중심, current/justification/timeframe은 상세 옵션

window.WorkforcePage = (function(){
  function details(){
    return `
    <details class="mt-3">
      <summary class="cursor-pointer text-sm text-slate-600">상세 옵션</summary>
      <div class="grid sm:grid-cols-3 gap-3 mt-3">
        <input id="w-current" type="number" class="form-input rounded-md border-slate-300" placeholder="현재 인원"/>
        <input id="w-timeframe" class="form-input rounded-md border-slate-300" placeholder="시기(예: 2025 Q1)"/>
        <input id="w-just" class="form-input rounded-md border-slate-300 sm:col-span-3" placeholder="사유/근거"/>
      </div>
    </details>`;
  }

  function formHtml(){
    return `
    <section class="form-card">
      <h3 class="text-base font-bold text-slate-900 mb-3">인력 계획</h3>
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="w-org" class="form-input rounded-md border-slate-300 sm:col-span-2" placeholder="조직(예: Platform)"/>
        <input id="w-role" class="form-input rounded-md border-slate-300 sm:col-span-2" placeholder="직무(예: Backend)"/>
        <input id="w-needed" type="number" class="form-input rounded-md border-slate-300" placeholder="필요 인원"/>
      </div>
      ${details()}
      <div class="mt-4 flex gap-2">
        <button id="w-save" class="btn-xs btn-primary">저장</button>
        <button id="w-cancel" class="btn-xs btn-soft" disabled>취소</button>
      </div>
    </section>`;
  }

  function filtersHtml(){
    return `
    <section class="form-card">
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="w-keyword" class="form-input rounded-md border-slate-300 sm:col-span-3" placeholder="검색(조직/직무/시기)"/>
        <input id="w-org-filter" class="form-input rounded-md border-slate-300" placeholder="조직(정확히)"/>
      </div>
      <div class="mt-3 flex items-center justify-between">
        <button id="w-apply" class="btn-xs btn-soft">필터 적용</button>
        <div id="w-sum" class="text-sm text-slate-600"></div>
      </div>
    </section>`;
  }

  function tableShell(){
    return `
    <section class="bg-white border border-slate-200 rounded-md mt-4 overflow-auto">
      <table class="min-w-full table-sticky table-basic">
        <thead>
          <tr><th>조직</th><th>직무</th><th>필요</th><th>현재</th><th>Δ</th><th class="w-28">작업</th></tr>
        </thead>
        <tbody id="w-tbody"></tbody>
      </table>
    </section>`;
  }

  function rowHtml(r){
    const delta = Number(r.delta ?? (Number(r.needed||0) - Number(r.current||0)));
    const cls = delta>0?'text-rose-600':(delta<0?'text-emerald-600':'');
    return `
    <tr>
      <td>${escapeHtml(r.orgUnit)}</td>
      <td>${escapeHtml(r.roleName)}</td>
      <td class="text-right">${r.needed}</td>
      <td class="text-right">${r.current}</td>
      <td class="text-right ${cls}">${delta}</td>
      <td>
        <button class="btn-xs btn-soft" data-act="edit" data-id="${r.id}">편집</button>
        <button class="btn-xs btn-danger" data-act="del" data-id="${r.id}">삭제</button>
      </td>
    </tr>`;
  }

  let editId=null, cache=[];

  async function render(container){
    container.innerHTML = `${formHtml()}${filtersHtml()}${tableShell()}`;
    bind(); await refresh();
  }

  function by(id){ return document.getElementById(id); }

  function readForm(){
    return {
      orgUnit: by('w-org').value.trim(),
      roleName: by('w-role').value.trim(),
      needed: Number(by('w-needed').value||0),
      current: Number(by('w-current')?.value||0),
      timeframe: by('w-timeframe')?.value||'',
      justification: by('w-just')?.value||'',
    };
  }

  function fillForm(r){
    by('w-org').value = r.orgUnit||'';
    by('w-role').value = r.roleName||'';
    by('w-needed').value = r.needed??0;
    if (by('w-current')) by('w-current').value = r.current??0;
    if (by('w-timeframe')) by('w-timeframe').value = r.timeframe||'';
    if (by('w-just')) by('w-just').value = r.justification||'';
  }

  function clearForm(){ fillForm({ needed:0, current:0 }); }

  async function refresh(){
    const org = by('w-org-filter').value.trim();
    cache = await DataStore.listWorkforce({ orgUnit: org || undefined });
    drawTable();
  }

  function drawTable(){
    const kw = by('w-keyword').value.trim().toLowerCase();
    const rows = cache.filter(r=>{
      if (!kw) return true;
      const hay = [r.orgUnit, r.roleName, r.timeframe, r.justification].join(' ').toLowerCase();
      return hay.includes(kw);
    });

    by('w-tbody').innerHTML = rows.map(rowHtml).join('') ||
      `<tr><td colspan="6" class="px-3 py-6 text-center text-slate-500">데이터가 없습니다.</td></tr>`;

    const totalDelta = rows.reduce((s,r)=>s+(Number(r.delta ?? (Number(r.needed||0)-Number(r.current||0)))||0),0);
    const totalNeeded = rows.reduce((s,r)=>s+(Number(r.needed)||0),0);
    const totalCurrent = rows.reduce((s,r)=>s+(Number(r.current)||0),0);
    by('w-sum').textContent = `합계: 현재 ${totalCurrent} / 필요 ${totalNeeded} / 증감 ${totalDelta}`;

    by('w-tbody').querySelectorAll('button[data-act]').forEach(btn=>{
      const id = btn.dataset.id, act = btn.dataset.act;
      btn.addEventListener('click', async ()=>{
        const r = cache.find(x=>x.id===id);
        if (!r) return;
        if (act==='edit'){ editId=id; fillForm(r); by('w-cancel').disabled=false; }
        if (act==='del'){ if(confirm('삭제할까요?')){ await DataStore.deleteWorkforce(id); await refresh(); } }
      });
    });
  }

  function bind(){
    by('w-save').addEventListener('click', async ()=>{
      const payload = readForm();
      if (!payload.orgUnit || !payload.roleName) return alert('조직/직무를 입력하세요.');
      if (editId){ await DataStore.updateWorkforce(editId, payload); editId=null; }
      else { await DataStore.createWorkforce(payload); }
      clearForm(); by('w-cancel').disabled=true; await refresh();
    });

    by('w-cancel').addEventListener('click', ()=>{
      editId=null; clearForm(); by('w-cancel').disabled=true;
    });

    by('w-apply').addEventListener('click', refresh);
  }

  return { render };
})();
