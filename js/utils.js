// js/utils.js
// 공용 유틸 (escapeHtml, byId 등)

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function byId(id){ return document.getElementById(id); }

// 버튼 공통 미니 스타일
document.addEventListener('DOMContentLoaded', ()=>{
  const style = document.createElement('style');
  style.textContent = `
    .btn-xs { @apply rounded-md px-2 py-1 text-xs; }
  `;
  document.head.appendChild(style);
});
