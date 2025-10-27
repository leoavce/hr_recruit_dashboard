// js/ui_router.js

window.Router = (function() {
  const routes = {
    '/requisition': window.RequisitionPage.render,
    '/workforce': window.WorkforcePage.render,
    '/jobPosting': window.JobPostingPage.render
  };

  function loadPage() {
    const path = window.location.hash || '/requisition';
    const pageContainer = document.getElementById('page-root');
    routes[path] && routes[path](pageContainer);
  }

  window.addEventListener('hashchange', loadPage);
  loadPage();  // Initial page load
})();
