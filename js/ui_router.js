// js/ui_router.js
// 해시 기반 라우터(#/requisition, #/workforce)
// 네비게이션 active 처리 + 공용 Import/Export 버튼 핸들링

(function(){
  const root = document.getElementById('page-root');
  const navLinks = Array.from(document.querySelectorAll('header nav a[href^="#/"]'));
  const exportBtn = document.getElementById('export-all');
  const importBtn = document.getElementById('import-open');
  const importFile = document.getElementById('import-file');

  function setActive(hash){
    navLinks.forEach(a => {
      a.dataset.active = (a.getAttribute('href') === hash) ? 'true' : 'false';
    });
  }

  async function render(){
    const hash = location.hash || '#/requisition';
    setActive(hash);
    if (hash.startsWith('#/requisition')) {
      await RequisitionPage.render(root);
    } else if (hash.startsWith('#/workforce')) {
      await WorkforcePage.render(root);
    } else {
      location.hash = '#/requisition';
    }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('load', render);

  // Export
  exportBtn.addEventListener('click', async () => {
    try {
      const json = await DataStore.exportAll();
      ExcelIO.downloadWorkbook(json);
    } catch (e) {
      alert('내보내기 실패: ' + e.message);
    }
  });

  // Import
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      const { type } = file;
      if (type.includes('json')) {
        const text = await file.text();
        await ExcelIO.importJson(JSON.parse(text));
      } else {
        await ExcelIO.importExcel(file);
      }
      alert('가져오기 완료');
      render(); // 새로고침
    } catch (e) {
      console.error(e);
      alert('가져오기 실패: ' + e.message);
    } finally {
      importFile.value = '';
    }
  });
})();
