// js/store.js
// Firestore 래퍼: 채용 품의(requisitions) / 인력 계획(workforce_plans) CRUD
// - 익명 사용자 기준 기본 네임스페이스 제공(organization 공유로 바꿀 수 있음)
// - 필드 검증 및 방어적 코딩 포함

window.DataStore = (function(){
  const COLL_REQ = 'requisitions';
  const COLL_WFP = 'workforce_plans';

  // 공통 유틸
  function _nowIso() { return new Date().toISOString(); }
  function _safeStr(v) { return (typeof v === 'string') ? v : String(v ?? ''); }
  function _safeInt(v, d=0){ const n = Number(v); return Number.isFinite(n) ? n : d; }
  function _safeBool(v){ return v === true || v === 'true' || v === 1 || v === '1'; }

  async function _colRef(collName){
    const [{ collection }, db] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js'),
      FirebaseSvc.getDb()
    ]);
    return collection(db, collName);
  }

  async function _docOps(){
    const mod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    return mod;
  }

  // ===== 채용 품의 =====
  function normalizeRequisition(raw){
    // Excel/폼 입력 혼합 대응
    const checks = raw.checks || {};
    return {
      jobTitle: _safeStr(raw.jobTitle),
      headcount: _safeInt(raw.headcount, 1),
      status: _safeStr(raw.status || 'Draft'),
      priority: _safeStr(raw.priority || 'Normal'),
      reqOwner: _safeStr(raw.reqOwner || ''),
      dueDate: _safeStr(raw.dueDate || ''), // yyyy-mm-dd
      location: _safeStr(raw.location || ''),
      tags: Array.isArray(raw.tags) ? raw.tags.map(_safeStr) : _safeStr(raw.tags||'').split(',').map(s=>s.trim()).filter(Boolean),
      checks: {
        jd: _safeBool(checks.jd),
        budget: _safeBool(checks.budget),
        approval: _safeBool(checks.approval),
        interviewPanel: _safeBool(checks.interviewPanel),
        draftOffer: _safeBool(checks.draftOffer),
      },
      notes: _safeStr(raw.notes || ''),
      updatedAt: _nowIso(),
      createdAt: raw.createdAt || _nowIso(),
    };
  }

  async function listRequisitions(filter = {}){
    const { getDocs, query, where, orderBy } = await _docOps();
    const cref = await _colRef(COLL_REQ);

    const conds = [];
    if (filter.status) conds.push(where('status', '==', filter.status));
    if (filter.tag) conds.push(where('tags', 'array-contains', filter.tag));
    // 단순 where 조합 → 필요 시 서버 rule/인덱스 추가
    let q = query(cref, ...conds, orderBy('updatedAt','desc'));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function createRequisition(raw){
    const data = normalizeRequisition(raw);
    const { addDoc } = await _docOps();
    const cref = await _colRef(COLL_REQ);
    const ref = await addDoc(cref, data);
    return { id: ref.id, ...data };
  }

  async function updateRequisition(id, patch){
    const data = normalizeRequisition({ ...(patch||{}) });
    const { doc, updateDoc } = await _docOps();
    const ref = doc(await FirebaseSvc.getDb(), COLL_REQ, id);
    await updateDoc(ref, data);
    return { id, ...data };
  }

  async function deleteRequisition(id){
    const { doc, deleteDoc } = await _docOps();
    const ref = doc(await FirebaseSvc.getDb(), COLL_REQ, id);
    await deleteDoc(ref);
  }

  // ===== 인력 계획 =====
  function normalizeWorkforce(raw){
    return {
      orgUnit: _safeStr(raw.orgUnit),
      roleName: _safeStr(raw.roleName),
      current: _safeInt(raw.current, 0),
      needed: _safeInt(raw.needed, 0),
      delta: _safeInt(raw.delta, _safeInt(raw.needed,0) - _safeInt(raw.current,0)),
      timeframe: _safeStr(raw.timeframe || ''),
      justification: _safeStr(raw.justification || ''),
      updatedAt: _nowIso(),
      createdAt: raw.createdAt || _nowIso(),
    };
  }

  async function listWorkforce(filter = {}){
    const { getDocs, query, where, orderBy } = await _docOps();
    const cref = await _colRef(COLL_WFP);
    const conds = [];
    if (filter.orgUnit) conds.push(where('orgUnit','==', filter.orgUnit));
    let q = query(cref, ...conds, orderBy('updatedAt','desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function createWorkforce(raw){
    const data = normalizeWorkforce(raw);
    const { addDoc } = await _docOps();
    const cref = await _colRef(COLL_WFP);
    const ref = await addDoc(cref, data);
    return { id: ref.id, ...data };
  }

  async function updateWorkforce(id, patch){
    const data = normalizeWorkforce({ ...(patch||{}) });
    const { doc, updateDoc } = await _docOps();
    const ref = doc(await FirebaseSvc.getDb(), COLL_WFP, id);
    await updateDoc(ref, data);
    return { id, ...data };
  }

  async function deleteWorkforce(id){
    const { doc, deleteDoc } = await _docOps();
    const ref = doc(await FirebaseSvc.getDb(), COLL_WFP, id);
    await deleteDoc(ref);
  }

  // ===== Export / Import (Excel/JSON) =====
  async function exportAll(){
    const [reqs, wfps] = await Promise.all([listRequisitions({}), listWorkforce({})]);
    return { requisitions: reqs, workforce_plans: wfps, exportedAt: _nowIso() };
  }

  return {
    listRequisitions, createRequisition, updateRequisition, deleteRequisition,
    listWorkforce, createWorkforce, updateWorkforce, deleteWorkforce,
    exportAll
  };
})();
