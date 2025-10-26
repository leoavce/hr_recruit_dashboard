// js/excel_io.js
// Export: requisitions, workforce_plans 시트를 가진 XLSX 다운로드
// Import: XLSX/JSON → Firestore에 생성/업데이트(간단히 생성 위주)

window.ExcelIO = (function(){
  function _s2a(s){ return new TextEncoder().encode(s); } // for JSON dl

  function _reqSheetData(list){
    const header = ['jobTitle','headcount','status','priority','reqOwner','dueDate','location','tags(comma)','jd','budget','approval','interviewPanel','draftOffer','notes'];
    const rows = list.map(r=>[
      r.jobTitle, r.headcount, r.status, r.priority, r.reqOwner, r.dueDate, r.location,
      (r.tags||[]).join(','),
      r.checks?.jd?1:0, r.checks?.budget?1:0, r.checks?.approval?1:0, r.checks?.interviewPanel?1:0, r.checks?.draftOffer?1:0,
      r.notes||''
    ]);
    return [header, ...rows];
  }

  function _wfpSheetData(list){
    const header = ['orgUnit','roleName','current','needed','delta','timeframe','justification'];
    const rows = list.map(r=>[
      r.orgUnit, r.roleName, r.current, r.needed, r.delta, r.timeframe, r.justification||''
    ]);
    return [header, ...rows];
  }

  async function downloadWorkbook(jsonAll){
    const reqs = jsonAll.requisitions || [];
    const wfps = jsonAll.workforce_plans || [];
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet(_reqSheetData(reqs));
    const ws2 = XLSX.utils.aoa_to_sheet(_wfpSheetData(wfps));

    XLSX.utils.book_append_sheet(wb, ws1, 'requisitions');
    XLSX.utils.book_append_sheet(wb, ws2, 'workforce_plans');
    XLSX.writeFile(wb, `export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`);

    // JSON도 함께 저장하고 싶다면 주석 해제
    // const blob = new Blob([_s2a(JSON.stringify(jsonAll,null,2))], {type:'application/json'});
    // const a = document.createElement('a');
    // a.href = URL.createObjectURL(blob);
    // a.download = `export_${Date.now()}.json`;
    // a.click();
  }

  async function importExcel(file){
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type:'array' });

    // requisitions
    if (wb.Sheets['requisitions']){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['requisitions'], { defval:'' });
      for (const r of rows){
        const payload = {
          jobTitle: r.jobTitle,
          headcount: Number(r.headcount||1),
          status: r.status||'Draft',
          priority: r.priority||'Normal',
          reqOwner: r.reqOwner||'',
          dueDate: r.dueDate||'',
          location: r.location||'',
          tags: String(r['tags(comma)']||''),
          checks: {
            jd: !!Number(r.jd||0),
            budget: !!Number(r.budget||0),
            approval: !!Number(r.approval||0),
            interviewPanel: !!Number(r.interviewPanel||0),
            draftOffer: !!Number(r.draftOffer||0),
          },
          notes: r.notes||'',
        };
        await DataStore.createRequisition(payload);
      }
    }

    // workforce_plans
    if (wb.Sheets['workforce_plans']){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['workforce_plans'], { defval:'' });
      for (const r of rows){
        const payload = {
          orgUnit: r.orgUnit,
          roleName: r.roleName,
          current: Number(r.current||0),
          needed: Number(r.needed||0),
          delta: Number(r.delta|| (Number(r.needed||0)-Number(r.current||0))),
          timeframe: r.timeframe||'',
          justification: r.justification||'',
        };
        await DataStore.createWorkforce(payload);
      }
    }
  }

  async function importJson(jsonAll){
    const reqs = jsonAll.requisitions || [];
    const wfps = jsonAll.workforce_plans || [];
    for (const r of reqs) await DataStore.createRequisition(r);
    for (const w of wfps) await DataStore.createWorkforce(w);
  }

  return { downloadWorkbook, importExcel, importJson };
})();
