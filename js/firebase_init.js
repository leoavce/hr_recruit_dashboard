// js/firebase_init.js
// 파이어베이스: App + Firestore만 사용 (인증 제거)
// 포트폴리오 공개용: 규칙에서 공개 읽기/쓰기 허용 필요(README 참고)

window.FirebaseSvc = (function(){
  let _app, _db;

  async function _ensure(){
    if (_app && _db) return;
    const [{ initializeApp }, { getFirestore, enableIndexedDbPersistence }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js'),
    ]);

    const firebaseConfig = {
      apiKey: "AIzaSyD0tqE_cFyVDh9egdLH0D_cyzkQo1JKKJk",
      authDomain: "hr-recruit-board.firebaseapp.com",
      projectId: "hr-recruit-board",
      appId: "1:704694729297:web:96c7e9afea538002ec5670",
    };

    _app = initializeApp(firebaseConfig);
    _db  = getFirestore(_app);

    try{ await enableIndexedDbPersistence(_db); }catch(_){}
  }

  async function getDb(){ await _ensure(); return _db; }
  async function getApp(){ await _ensure(); return _app; }

  return { getDb, getApp };
})();
