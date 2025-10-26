# 채용 업무 대시보드 (Firebase + GitHub Pages)

- **기능**
  - **채용 품의 관리**: 직무/인원/상태/우선순위/담당/기한/근무지/태그/체크(JD/Budget/Approval/Panel/Offer)/메모
  - **엑셀 시트 느낌의 목록**: 필터(키워드/상태/태그), 체크 진행도에 따라 **To** 표시
  - **인력 계획**: 조직/직무/현재/필요/증감/시기/사유, 합계 표시
  - **Excel 내보내기/가져오기**(SheetJS), JSON 가져오기 지원
  - **Firebase Firestore 저장**, **익명 인증** 자동(로그인 UI 없음), **오프라인 퍼시스턴스** 활성화

---

## 배포 (GitHub Pages)
1. 이 폴더 전체를 GitHub Repository root로 푸시합니다.
2. `Settings > Pages` 에서 **Branch: main (root)** 선택 후 저장.
3. 약간의 대기 후 Pages URL에서 접속.

> Pages는 정적 호스팅이므로 **서버 없이** Firebase SDK로 Firestore에 직접 접근합니다.

---

## Firebase 설정
1. [Firebase Console]에서 Web App 생성
2. `Project settings > General`의 **firebaseConfig** 값으로 `js/firebase_init.js` 내 `REPLACE_ME_*` 항목을 모두 교체
3. **Authentication > Sign-in method** 에서 **Anonymous** 활성화
4. **Firestore Database** 생성 후 아래 **보안 규칙** 적용

### 권장 Firestore 보안 규칙(샘플)
> 익명 인증만 허용 + 생성자/업데이터만 수정/삭제 가능(간단 샘플)
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // 기본 공개 읽기 금지 (필요 시 read 허용 범위를 넓히세요)
    match /{document=**} {
      allow read: if false;
    }

    match /requisitions/{docId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn();
    }

    match /workforce_plans/{docId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn();
    }
  }
}
```
