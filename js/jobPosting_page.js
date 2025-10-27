// js/jobPosting_page.js

window.JobPostingPage = (function() {
  function render(container) {
    container.innerHTML = `
      <h3 class="text-xl font-bold">공고 관리</h3>
      <p class="text-slate-500">현재 공고 등록 기능은 미지원입니다.</p>
      <p class="mt-4 text-sm text-slate-400">마이다스와 연계 예정.</p>
    `;
  }

  return { render };
})();
