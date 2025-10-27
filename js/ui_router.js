// js/ui_router.js
(function(){
  const root = document.getElementById('page-root');
  const segBtns = Array.from(document.querySelectorAll('.seg-control .seg-btn'));
  const exportBtn = document.getElementById('export-all');
  const importBtn = document.getElementById('import-open');
  const importFile = document.getElementById('import-file');

  function setActive(hash){
    segBtns.forEach(a => a.dataset.active = (a.getAttribute('href') === hash) ? 'true' : 'false');
  }

  async function render(){
    const hash = location.hash || '#/requisition';
    setActive(hash);
    if (hash.startsWith('#/requisition')) await RequisitionPage.render(root);
    else if (hash.startsWith('#/workforce')) await WorkforcePage.render(root);
    else location.hash = '#/requisition';
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('load', render);

  exportBtn.addEventListener('click', async ()=>{
    try{
      const json = await DataStore.exportAll();
      ExcelIO.downloadWorkbook(json);
    }catch(e){ alert('내보내기 실패: '+e.message); }
  });

  importBtn.addEventListener('click', ()=> importFile.click());
  importFile.addEventListener('change', async ()=>{
    const file = importFile.files?.[0];
    if (!file) return;
    try{
      if ((file.type||'').includes('json')) {
        const txt = await file.text();
        await ExcelIO.importJson(JSON.parse(txt));
      } else {
        await ExcelIO.importExcel(file);
      }
      alert('가져오기 완료');
      render();
    }catch(e){
      console.error(e);
      alert('가져오기 실패: '+e.message);
    }finally{
      importFile.value = '';
    }
  });
})();
