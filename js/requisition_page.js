// js/requisition_page.js

window.RequisitionPage = (function(){
  const STATUS = ['Draft','Open','Closed'];

  function _details(){
    return `
    <details class="mt-3">
      <summary class="cursor-pointer text-sm text-slate-600">상세 옵션</summary>
      <div class="grid sm:grid-cols-3 gap-3 mt-3">
        <input id="f-owner" class="form-input rounded-md border-slate-300" placeholder="담당자"/>
        <input id="f-due" type="date" class="form-input rounded-md border-slate-300"/>
        <input id="f-location" class="form-input rounded-md border-slate-300" placeholder="근무지"/>
        <input id="f-jd" class="form-input rounded-md border-slate-300" placeholder="JD (직무 설명)"/>
        <input id="f-budget" type="number" class="form-input rounded-md border-slate-300" placeholder="예산"/>
        <input id="f-approval" class="form-input rounded-md border-slate-300" placeholder="승인자"/>
        <input id="f-draftOffer" type="file" class="form-input rounded-md border-slate-300" />
      </div>
    </details>`;
  }

  function formHtml(){
    return `
    <section class="form-card">
      <h3 class="text-base font-bold text-slate-900 mb-3">품의 작성</h3>
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="f-jobTitle" class="form-input rounded-md border-slate-300 sm:col-span-2" placeholder="직무명(예: Backend)"/>
        <input id="f-headcount" type="number" min="1" class="form-input rounded-md border-slate-300" placeholder="인원" />
        <select id="f-status" class="form-select rounded-md border-slate-300">
          ${STATUS.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
        <input id="f-tags" class="form-input rounded-md border-slate-300 sm:col-span-4" placeholder="JD를 입력하세요"/>
      </div>
      ${_details()}
      <div class="mt-4 flex gap-2">
        <button id="btn-save" class="btn-xs btn-primary">저장</button>
        <button id="btn-cancel" class="btn-xs btn-soft" disabled>취소</button>
      </div>
    </section>`;
  }

  function filtersHtml(){
    return `
    <section class="form-card">
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="fl-keyword" class="form-input rounded-md border-slate-300 sm:col-span-3" placeholder="검색(직무/태그/담당자)"/>
        <select id="fl-status" class="form-select rounded-md border-slate-300">
          <option value="">상태 전체</option>
          ${STATUS.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="mt-3">
        <button id="fl-apply" class="btn-xs btn-soft">필터 적용</button>
      </div>
    </section>`;
  }

  function tableShell(){
    return `
    <section class="bg-white border border-slate-200 rounded-md mt-4 overflow-auto">
      <table class="min-w-full table-sticky table-basic">
        <thead>
          <tr>
            <th>직무</th><th>인원</th><th>상태</th><th>태그</th><th>To</th><th class="w-28">작업</th>
          </tr>
        </thead>
        <tbody id="req-tbody"></tbody>
      </table>
    </section>`;
  }

  function toCount(chk){
    const keys = ['jd','budget','approval','draftOffer'];
    const done = keys.filter(k=>!!chk?.[k]).length;
    return Math.max(0, 4 - done);
  }

  function rowHtml(r){
    const to = toCount(r.checks);
    return `
    <tr>
      <td>${escapeHtml(r.jobTitle)}</td>
      <td>${r.headcount}</td>
      <td>${escapeHtml(r.status)}</td>
      <td>${(r.tags||[]).map(t=>`<span class="mr-1 rounded bg-slate-100 px-2 text-xs">${escapeHtml(t)}</span>`).join('')}</td>
      <td>${to>0?`<span class="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">To ${to}</span>`:'—'}</td>
      <td>
        <button class="btn-xs btn-soft" data-act="edit" data-id="${r.id}">편집</button>
        <button class="btn-xs btn-danger" data-act="del" data-id="${r.id}">삭제</button>
      </td>
    </tr>`;
  }

  let editId=null, cache=[];

  async function render(container){
    container.innerHTML = `${formHtml()}${filtersHtml()}${tableShell()}`;
    bind();
    await refresh();
  }

  function by(id){ return document.getElementById(id); }

  function readForm(){
    return {
      jobTitle: by('f-jobTitle').value.trim(),
      headcount: Number(by('f-headcount').value||1),
      status: by('f-status').value,
      tags: by('f-tags').value,
      notes: by('f-notes')?.value || '',
      reqOwner: by('f-owner')?.value || '',
      dueDate: by('f-due')?.value || '',
      location: by('f-location')?.value || '',
      checks:{
        jd: by('f-jd')?.value || '',
        budget: by('f-budget')?.value || '',
        approval: by('f-approval')?.value || '',
        draftOffer: by('f-draftOffer')?.files[0]?.name || '', // 파일 첨부
      }
    };
  }

  function fillForm(r){
    by('f-jobTitle').value = r.jobTitle||'';
    by('f-headcount').value = r.headcount||1;
    by('f-status').value = r.status||'Draft';
    by('f-tags').value = (r.tags||[]).join(', ');
    if (by('f-owner')) by('f-owner').value = r.reqOwner||'';
    if (by('f-due')) by('f-due').value = r.dueDate||'';
    if (by('f-location')) by('f-location').value = r.location||'';
    if (by('f-notes')) by('f-notes').value = r.notes||'';
    if (by('f-jd')) by('f-jd').value = r.checks?.jd || '';
    if (by('f-budget')) by('f-budget').value = r.checks?.budget || '';
    if (by('f-approval')) by('f-approval').value = r.checks?.approval || '';
    if (by('f-draftOffer')) by('f-draftOffer').value = r.checks?.draftOffer || '';
  }

  function clearForm(){ fillForm({ headcount:1, status:'Draft', checks:{} }); }

  async function refresh(){
    const status = by('fl-status').value;
    cache = await DataStore.listRequisitions({ status: status || undefined });
    drawTable();
  }

  function drawTable(){
    const kw = by('fl-keyword').value.trim().toLowerCase();
    const rows = cache.filter(r=>{
      if (!kw) return true;
      const hay = [r.jobTitle, r.reqOwner, r.location, ...(r.tags||[])].join(' ').toLowerCase();
      return hay.includes(kw);
    });
    by('req-tbody').innerHTML = rows.map(rowHtml).join('') ||
      `<tr><td colspan="6" class="px-3 py-6 text-center text-slate-500">데이터가 없습니다.</td></tr>`;

    by('req-tbody').querySelectorAll('button[data-act]').forEach(btn=>{
      const id = btn.dataset.id, act = btn.dataset.act;
      btn.addEventListener('click', async ()=>{
        const r = cache.find(x=>x.id===id);
        if (!r) return;
        if (act==='edit'){ editId=id; fillForm(r); by('btn-cancel').disabled=false; }
        if (act==='del'){ if(confirm('삭제할까요?')){ await DataStore.deleteRequisition(id); await refresh(); } }
      });
    });

    clearForm(); by('btn-cancel').disabled=true;
  }

  function bind(){
    by('btn-save').addEventListener('click', async ()=>{
      const payload = readForm();
      if (!payload.jobTitle) return alert('직무명을 입력하세요.');
      if (editId){ await DataStore.updateRequisition(editId, payload); editId=null; }
      else { await DataStore.createRequisition(payload); }
      clearForm(); by('btn-cancel').disabled=true; await refresh();
    });

    by('btn-cancel').addEventListener('click', ()=>{
      editId=null; clearForm(); by('btn-cancel').disabled=true;
    });

    by('fl-apply').addEventListener('click', refresh);
  }

  return { render };
})();
