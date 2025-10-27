// js/main_page.js

window.MainPage = (function() {
  // 상호작용형 대시보드
  function drawDashboard(container) {
    container.innerHTML = `
      <h3 class="text-xl font-bold">상호작용형 대시보드</h3>
      <div id="chart" class="chart-container"></div>
      <p class="text-slate-500 mt-4">채용 품의 및 인력 계획에 대한 **상호작용형** 차트를 제공합니다.</p>
    `;
    // 차트 라이브러리 예시 (Chart.js)
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['채용 품의', '인력 계획', '공고 관리'],
        datasets: [{
          label: '진행 상황',
          data: [12, 19, 3],  // 임의 데이터
          backgroundColor: '#137fec',
          borderColor: '#0f6bd0',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // 할 일 목록 관리
  function drawTodoList(container) {
    container.innerHTML = `
      <h3 class="text-xl font-bold">할 일 목록</h3>
      <ul class="todo-list">
        <li><input type="checkbox" /> 채용 품의 상태 업데이트</li>
        <li><input type="checkbox" /> 인력 계획 검토</li>
        <li><input type="checkbox" /> 공고 등록</li>
      </ul>
    `;
  }

  // 알림 기능
  function showAlert(container) {
    container.innerHTML = `
      <div class="alert alert-info">
        <p>현재 알림 기능은 미지원입니다. 추후 구현 예정입니다.</p>
      </div>
    `;
  }

  // 페이지 렌더링
  function render(container) {
    container.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-800 mb-6">Main 대시보드</h2>
      <div id="alerts"></div>
      <div id="todo-list" class="mt-4"></div>
      <div id="dashboard" class="mt-4"></div>
    `;
    showAlert(document.getElementById('alerts'));
    drawTodoList(document.getElementById('todo-list'));
    drawDashboard(document.getElementById('dashboard'));
  }

  return { render };
})();
