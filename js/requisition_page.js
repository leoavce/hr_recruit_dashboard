// js/requisition_page.js
// 채용 품의 관리: CRUD + 필터(태그/상태/체크) + 테이블(엑셀 시트 느낌) + To 표시

window.RequisitionPage = (function(){
  const STATUS = ['Draft','Open','OnHold','Closed'];
  const PRIORITY = ['Low','Normal','High','Critical'];

  function _checkbox(inputId, label, checked=false){
    return `
      <label class="inline-flex items-center gap-2 text-sm text-slate-700">
        <input id="${inputId}" type="checkbox" class="rounded border-slate-300" ${checked?'checked':''}/>
        ${label}
      </label>
    `;
  }

  function _rowHtml(r){
    const checksTo = ['jd','budget','approval','interviewPanel','draftOffer'].filter(k => r.checks?.[k]).length;
    const toBadge = checksTo < 5 ? `<span class="ml-2 inline-flex items-center rounded bg-amber-100 px-2 text-xs text-amber-700">To ${5 - checksTo}</span>` : '';
    return `
    <tr class="border-t border-slate-200">
      <td class="px-2 py-2 text-sm text-slate-500">${escapeHtml(r.jobTitle)}</td>
      <td class="px-2 py-2 text-sm text-slate-500">${r.headcount}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.status)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.priority)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.reqOwner)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.dueDate)}</td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.location)}</td>
      <td class="px-2 py-2 text-sm">${(r.tags||[]).map(t=>`<span class="mr-1 rounded bg-slate-100 px-2 text-xs">${escapeHtml(t)}</span>`).join('')}</td>
      <td class="px-2 py-2 text-sm">
        ${r.checks?.jd?'✅':''}${r.checks?.budget?'💰':''}${r.checks?.approval?'📝':''}${r.checks?.interviewPanel?'👥':''}${r.checks?.draftOffer?'📄':''}
        ${toBadge}
      </td>
      <td class="px-2 py-2 text-sm">${escapeHtml(r.notes || '')}</td>
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
        <input id="f-jobTitle" class="form-input rounded-md border-slate-300" placeholder="직무명" />
        <input id="f-headcount" type="number" min="1" class="form-input rounded-md border-slate-300" placeholder="인원" />
        <select id="f-status" class="form-select rounded-md border-slate-300">
          ${STATUS.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="f-priority" class="form-select rounded-md border-slate-300">
          ${PRIORITY.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
        <input id="f-owner" class="form-input rounded-md border-slate-300" placeholder="담당자" />
        <input id="f-due" type="date" class="form-input rounded-md border-slate-300" />
        <input id="f-location" class="form-input rounded-md border-slate-300" placeholder="근무지" />
        <input id="f-tags" class="form-input rounded-md border-slate-300" placeholder="태그(쉼표 구분)" />
        <input id="f-notes" class="form-input rounded-md border-slate-300" placeholder="비고/메모" />
      </div>
      <div class="mt-3 flex flex-wrap gap-4">
        ${_checkbox('chk-jd','JD')}
        ${_checkbox('chk-budget','Budget')}
        ${_checkbox('chk-approval','Approval')}
        ${_checkbox('chk-panel','Interview Panel')}
        ${_checkbox('chk-offer','Draft Offer')}
      </div>
      <div class="mt-4 flex gap-2">
        <button id="btn-save" class="inline-flex items-center gap-1 rounded-md bg-[#137fec] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600">저장</button>
        <button id="btn-cancel" class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200" disabled>취소</button>
      </div>
    </div>`;
  }

  function _filtersHtml(){
    return `
    <div class="bg-white border border-slate-200 rounded-md p-4">
      <div class="grid sm:grid-cols-4 gap-3">
        <input id="fl-keyword" class="form-input rounded-md border-slate-300" placeholder="키워드(직무/태그/담당자)"/>
        <select id="fl-status" class="form-select rounded-md border-slate-300">
          <option value="">상태 전체</option>
          ${STATUS.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
        <input id="fl-tag" class="form-input rounded-md border-slate-300" placeholder="태그(단일)"/>
        <button id="fl-apply" class="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">필터 적용</button>
      </div>
    </div>`;
  }

  function _tableShell(){
    return `
    <div class="bg-white border border-slate-200 rounded-md mt-4 overflow-auto">
      <table class="min-w-full table-sticky">
        <thead>
          <tr class="text-left text-sm text-slate-600">
            <th class="px-2 py-2">직무</th>
            <th class="px-2 py-2">인원</th>
            <th class="px-2 py-2">상태</th>
            <th class="px-2 py-2">우선순위</th>
            <th class="px-2 py-2">담당</th>
            <th class="px-2 py-2">기한</th>
            <th class="px-2 py-2">근무지</th>
            <th class="px-2 py-2">태그</th>
            <th class="px-2 py-2">체크/To</th>
            <th class="px-2 py-2">비고</th>
            <th class="px-2 py-2 w-28">작업</th>
          </tr>
        </thead>
        <tbody id="req-tbody"></tbody>
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
      jobTitle: byId('f-jobTitle').value.trim(),
      headcount: Number(byId('f-headcount').value || 1),
      status: byId('f-status').value,
      priority: byId('f-priority').value,
      reqOwner: byId('f-owner').value.trim(),
      dueDate: byId('f-due').value,
      location: byId('f-location').value.trim(),
      tags: byId('f-tags').value,
      notes: byId('f-notes').value,
      checks: {
        jd: byId('chk-jd').checked,
        budget: byId('chk-budget').checked,
        approval: byId('chk-approval').checked,
        interviewPanel: byId('chk-panel').checked,
        draftOffer: byId('chk-offer').checked,
      }
    };
  }

  function fillForm(r){
    byId('f-jobTitle').value = r.jobTitle || '';
    byId('f-headcount').value = r.headcount || 1;
    byId('f-status').value = r.status || 'Draft';
    byId('f-priority').value = r.priority || 'Normal';
    byId('f-owner').value = r.reqOwner || '';
    byId('f-due').value = r.dueDate || '';
    byId('f-location').value = r.location || '';
    byId('f-tags').value = (r.tags||[]).join(', ');
    byId('f-notes').value = r.notes || '';
    byId('chk-jd').checked = !!r.checks?.jd;
    byId('chk-budget').checked = !!r.checks?.budget;
    byId('chk-approval').checked = !!r.checks?.approval;
    byId('chk-panel').checked = !!r.checks?.interviewPanel;
    byId('chk-offer').checked = !!r.checks?.draftOffer;
  }

  function clearForm(){
    fillForm({ headcount:1, status:'Draft', priority:'Normal', checks:{} });
  }

  async function refresh(){
    const status = byId('fl-status').value;
    const tag = byId('fl-tag').value.trim();
    cache = await DataStore.listRequisitions({ status: status || undefined, tag: tag || undefined });
    drawTable();
  }

  function drawTable(){
    const kw = byId('fl-keyword').value.trim().toLowerCase();
    const tb = byId('req-tbody');
    const rows = cache.filter(r=>{
      if (!kw) return true;
      const hay = [
        r.jobTitle, r.reqOwner, r.location,
        ...(r.tags||[])
      ].join(' ').toLowerCase();
      return hay.includes(kw);
    });
    tb.innerHTML = rows.map(_rowHtml).join('') || `
      <tr><td colspan="11" class="px-3 py-6 text-center text-slate-500">데이터가 없습니다.</td></tr>
    `;

    tb.querySelectorAll('button[data-act]').forEach(btn=>{
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener('click', async ()=>{
        const target = cache.find(x=>x.id===id);
        if (!target) return;
        if (act==='edit'){
          editId = id;
          fillForm(target);
          byId('btn-cancel').disabled = false;
        } else if (act==='del'){
          if (!confirm('삭제하시겠습니까?')) return;
          await DataStore.deleteRequisition(id);
          await refresh();
        }
      });
    });
  }

  function bind(){
    byId('btn-save').addEventListener('click', async ()=>{
      const payload = readForm();
      if (!payload.jobTitle) return alert('직무명을 입력하세요.');
      if (editId){
        await DataStore.updateRequisition(editId, payload);
        editId = null;
      } else {
        await DataStore.createRequisition(payload);
      }
      clearForm();
      byId('btn-cancel').disabled = true;
      await refresh();
    });

    byId('btn-cancel').addEventListener('click', ()=>{
      editId = null;
      clearForm();
      byId('btn-cancel').disabled = true;
    });

    byId('fl-apply').addEventListener('click', refresh);
  }

  return { render };
})();
