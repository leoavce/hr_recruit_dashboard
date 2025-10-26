// js/firebase_init.js
// - Firebase 초기화 + 익명 인증(자동) + Firestore 오프라인 퍼시스턴스
// - firebaseConfig는 배포 전 실제 값으로 교체하세요.

(function(){
  const cfg = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID",
    // measurementId: "optional"
  };

  // SDK 로드 (ESM 불가 환경 대비 window.firebaseApp 등으로 보관)
  const { initializeApp } = window.firebase || {};
  if (!initializeApp) {
    // 동적 모듈 로드 (v10 compat CDN)
    // 단, 보안을 위해 프로젝트 내에서 직접 호스트하기를 권장합니다.
  }
})();

// 모듈 스코프 汎用: window.FirebaseSvc 에 종합 바인딩
window.FirebaseSvc = (function(){
  // Firebase v10 modular via CDN (compat not used)
  // CDN 모듈 스크립트 없이 사용할 수 있도록 dynamic import fallbacks 제공
  let _app, _auth, _db, _userPromise;

  async function _ensure() {
    if (_app) return;
    // dynamic import from gstatic
    const [
      { initializeApp },
      { getAuth, onAuthStateChanged, signInAnonymously },
      { getFirestore, enableIndexedDbPersistence }
    ] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js'),
    ]);

    const firebaseConfig = {
      apiKey: "REPLACE_ME_apiKey",
      authDomain: "REPLACE_ME_authDomain",
      projectId: "REPLACE_ME_projectId",
      appId: "REPLACE_ME_appId",
    };

    _app = initializeApp(firebaseConfig);
    _auth = getAuth(_app);

    // 로그인 UI 없이 익명 인증
    _userPromise = new Promise((resolve) => {
      onAuthStateChanged(_auth, async (u) => {
        if (u) return resolve(u);
        await signInAnonymously(_auth);
      });
    });

    _db = getFirestore(_app);
    try {
      await enableIndexedDbPersistence(_db);
    } catch (_) {
      // 이미 다른 탭이 열려있는 경우 등 에러 무시(읽기/쓰기 가능)
    }
  }

  async function getApp() { await _ensure(); return _app; }
  async function getAuthInst() { await _ensure(); return _auth; }
  async function getDb() { await _ensure(); return _db; }
  async function getUser() { await _ensure(); return _userPromise; }

  return { getApp, getAuthInst, getDb, getUser };
})();
