// js/ui_router.js

window.Router = (function() {
  const routes = {
    '/main': window.MainPage.render,
    '/requisition': window.RequisitionPage.render,
    '/workforce': window.WorkforcePage.render,
    '/jobPosting': window.JobPostingPage.render
  };

  function loadPage() {
    const path = window.location.hash || '/main';
    const pageContainer = document.getElementById('page-root');
    routes[path] && routes[path](pageContainer);
  }

  window.addEventListener('hashchange', loadPage);
  loadPage();  // Initial page load
})();
