/* ==========================================================================
   청라 아크원 푸르지오 — 사이트 설정 (담당자는 이 파일만 수정하면 됩니다)
   --------------------------------------------------------------------------
   1) 접수 알림 받는 곳     → FORM (이메일 / 구글챗)
   2) 상담 전화번호         → PHONE_DISPLAY / PHONE_TEL
   3) 이미지 교체           → IMAGES (index.html 의 data-img="키" 와 연결)
   4) 외부 링크(모집공고 등) → LINKS
   문구(텍스트)는 index.html 에서 직접 수정합니다.
   ========================================================================== */

window.SITE_CONFIG = {
  /* 상담문의 전화번호 (사용자 지정 번호) */
  PHONE_DISPLAY: "1844-1554",
  PHONE_TEL: "tel:1844-1554",

  /* 접수폼 메일 전송 — 접수 내용을 TO_EMAIL 로 보냅니다.
     ※ 정적 HTML 은 메일을 직접 보낼 수 없어 외부 폼 전송 서비스(FormSubmit)를 사용합니다.
     ※ 최초 1회: 배포한 사이트에서 테스트 접수를 하면 TO_EMAIL 로 '활성화(Activate)' 메일이 옵니다.
        그 메일의 버튼을 눌러야 이후 접수가 정상 전달됩니다. (스팸함도 확인)
     ※ 자체 서버(예: Replit)를 쓰게 되면 ENDPOINT 에 그 주소를 넣으세요. (비워 두면 TO_EMAIL 로 자동 구성) */
  FORM: {
    TO_EMAIL: "power76ad@naver.com",
    /* 구글챗 알림(선택): 구글챗 스페이스 → 앱 및 통합 → 웹훅 추가 에서 만든 주소를 따옴표 안에 붙여넣으세요.
       비워 두면 이메일로만 받습니다. ※ 정적 페이지 특성상 이 주소는 페이지 소스에 노출됩니다(아래 안내 참고). */
    CHAT_WEBHOOK: "",
    /* ★ 권장: 구글 Apps Script 웹 앱 주소 (apps-script/설정안내.md 참고).
       입력하면 FormSubmit·CHAT_WEBHOOK 대신 이 주소로만 보내며, 이메일·구글챗·구글시트 기록을 스크립트가 처리합니다. */
    APPS_SCRIPT_URL: "",
    ENDPOINT: "",
    SUBJECT: "[청라 아크원 푸르지오] 홈페이지 신규 접수"
  },

  /* 팝업(청약 가점 계산기) — 접속 후 DELAY_MS 뒤 1회 표시. 끄려면 ENABLED: false */
  POPUP: {
    ENABLED: true,
    DELAY_MS: 4000
  },

  /* 이미지 — 「4가지 이유」(why*)는 assets/img/ 의 편집본 파일, 나머지(hero·brand·overview)는 공식 홈페이지 이미지를 참조합니다.
     배포 전 승인받은 원본 파일을 assets/img/ 에 넣고 경로만 바꾸는 것을 권장합니다.
     예) hero: "assets/img/hero.webp"  */
  IMAGES: {
    hero:     "assets/img/hero-poster.webp",   /* 히어로 영상의 첫 장면(영상 로딩 전·모션 감소 시 표시) */
    symbolW:  "assets/img/logo-symbol-w.webp",
    symbolC:  "assets/img/logo-symbol.webp",
    wordW:    "assets/img/logo-word-w.webp",
    why1:     "assets/img/why1-center.webp",
    why2a:    "assets/img/why2-view-a.webp",
    why2b:    "assets/img/why2-view-b.webp",
    why3:     "assets/img/why3-town.webp",
    why4a:    "assets/img/why4-life-a.webp",
    why4b:    "assets/img/why4-life-b.webp",
    why4c:    "assets/img/why4-life-c.webp",
    brand:    "https://arkone-prugio.com/resources/img/pages/main/brand_bg.v6.jpg",
    overview: "https://arkone-prugio.com/resources/img/pages/overview/overview_apt_img.v6.jpg"
  },

  /* 히어로 배경 영상 (5초, 소리 없음, 1회 재생 후 마지막 장면에서 정지)
     MP4(H.264)는 대부분의 기기에서 재생됩니다. 비워 두면 정지 이미지만 표시됩니다. (WEBM 주소를 WEBM: 으로 추가하면 예비 영상으로 사용) */
  VIDEO: {
    MP4:  "assets/video/hero.mp4"
  },

  /* 외부 링크 */
  LINKS: {
    notice:     "https://arkone-prugio.com/pages/gonggo",   /* 모집공고 */
    official:   "https://arkone-prugio.com/",               /* 공식 홈페이지 */
    mapModel:   "https://naver.me/xNpQLQ3L",                /* 견본주택 네이버지도 */
    mapPromo:   "https://naver.me/xwmqyGWk"                 /* 홍보관 네이버지도 */
  }
};
