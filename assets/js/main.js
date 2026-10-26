/* 청라 아크원 푸르지오 — 동작 스크립트 (설정값은 config.js 에서 관리) */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var toastTimer;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }

  /* ---------- 저장소 (막힌 환경에서도 오류 없이) ---------- */
  function store(kind, key, val) {
    try {
      var s = kind === "session" ? window.sessionStorage : window.localStorage;
      if (val === undefined) return s.getItem(key);
      s.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- 1. 이미지 연결 ---------- */
  document.querySelectorAll("img[data-img]").forEach(function (img) {
    var src = (cfg.IMAGES || {})[img.getAttribute("data-img")];
    if (!src) { img.classList.add("is-missing"); return; }
    img.addEventListener("error", function () { img.classList.add("is-missing"); });
    img.src = src;
  });

  /* ---------- 2. 청약 가점 계산기 (아파트 일반 가점제 84점 만점) ----------
     무주택기간 32점 · 부양가족 35점 · 청약통장 17점 (배우자 통장 합산 포함, 통장 17점 한도)
     ※ 점수표를 바꿔야 할 때는 아래 표(HOME / BANK / SPOUSE)와 update() 계산식만 수정하세요. */
  var HOME = [["해당 없음 · 만 30세 미만 미혼 또는 유주택자", 0]];
  for (var i = 0; i < 15; i++) HOME.push([i === 0 ? "1년 미만" : i + "년 이상 ~ " + (i + 1) + "년 미만", 2 * (i + 1)]);
  HOME.push(["15년 이상", 32]);

  var BANK = [["6개월 미만", 1], ["6개월 이상 ~ 1년 미만", 2]];
  for (var b = 1; b < 15; b++) BANK.push([b + "년 이상 ~ " + (b + 1) + "년 미만", b + 2]);
  BANK.push(["15년 이상", 17]);

  var SPOUSE = [["1년 미만", 1], ["1년 이상 ~ 2년 미만", 2], ["2년 이상", 3]];

  var tpl = $("calc-tpl");
  var uid = 0;
  var lastScore = null; /* 이벤트 신청으로 넘길 점수 (가장 최근 '이 점수로 신청' 클릭 시점) */

  function fillSelect(sel, rows) {
    sel.innerHTML = rows.map(function (r, idx) {
      return '<option value="' + idx + '">' + r[0] + " (" + r[1] + "점)</option>";
    }).join("");
  }

  function initCalc(host) {
    if (!tpl || !tpl.content) return;
    host.appendChild(tpl.content.cloneNode(true));
    var id = ++uid;
    var el = {}, out = {};
    host.querySelectorAll("[data-k]").forEach(function (n) { el[n.getAttribute("data-k")] = n; });
    host.querySelectorAll("[data-o]").forEach(function (n) { out[n.getAttribute("data-o")] = n; });
    var spouseBox = host.querySelector(".spouse-field");
    var dependents = 0;
    var snap = { total: 0 };

    fillSelect(el.home, HOME);
    fillSelect(el.account, BANK);
    fillSelect(el.spouse, SPOUSE);

    host.querySelectorAll("label[data-for]").forEach(function (lb) {
      var key = lb.getAttribute("data-for");
      el[key].id = "calc" + id + "-" + key;
      lb.setAttribute("for", el[key].id);
    });

    function update() {
      var homePts = HOME[+el.home.value][1];
      var depPts = Math.min(35, 5 + dependents * 5);
      var spousePts = el.spouseOn.checked ? SPOUSE[+el.spouse.value][1] : 0;
      var acctPts = Math.min(17, BANK[+el.account.value][1] + spousePts);
      var total = homePts + depPts + acctPts;
      out.depCount.textContent = dependents;
      out.depScore.textContent = depPts + "점";
      el.minus.disabled = dependents === 0;
      el.plus.disabled = dependents >= 6;
      out.home.textContent = homePts;
      out.dep.textContent = depPts;
      out.acct.textContent = acctPts;
      out.total.textContent = total;
      out.bar.style.width = (total / 84) * 100 + "%";
      snap = { total: total, home: homePts, dep: depPts, acct: acctPts };
    }

    el.minus.addEventListener("click", function () { dependents = Math.max(0, dependents - 1); update(); });
    el.plus.addEventListener("click", function () { dependents = Math.min(6, dependents + 1); update(); });
    el.home.addEventListener("change", update);
    el.account.addEventListener("change", update);
    el.spouse.addEventListener("change", update);
    el.spouseOn.addEventListener("change", function () { spouseBox.hidden = !el.spouseOn.checked; update(); });

    host.querySelector("[data-go-event]").addEventListener("click", function () { goEvent(snap); });
    update();
  }
  document.querySelectorAll("[data-calc]").forEach(initCalc);

  /* 계산 결과 → 이벤트 신청 영역으로 이동 (점수 전송 동의 문구 노출) */
  function goEvent(snap) {
    lastScore = snap.total;
    $("event-score").textContent = snap.total + "점";
    $("score-consent").classList.add("visible");
    closePopup();
    setTimeout(function () {
      $("event").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var nm = $("applicant-name");
      if (nm) nm.focus({ preventScroll: true });
    }, 60);
  }

  /* ---------- 3. 외부 링크 ---------- */
  document.querySelectorAll("a[data-link]").forEach(function (a) {
    var href = (cfg.LINKS || {})[a.getAttribute("data-link")];
    if (href) { a.href = href; } else { a.hidden = true; }
  });

  /* ---------- 4. 전화·방문예약 CTA ---------- */
  function showToast(msg) {
    var t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 4500);
  }

  function wireCtas(root) {
    root.querySelectorAll("[data-cta='call']").forEach(function (a) { a.href = cfg.PHONE_TEL || "#"; });
    root.querySelectorAll("[data-phone-text]").forEach(function (n) { n.textContent = cfg.PHONE_DISPLAY || ""; });
  }
  wireCtas(document);

  /* 방문예약 버튼은 모두 홈페이지 자체 신청서(팝업)를 엽니다. (계산기 팝업 안에서 눌러도 동작하도록 문서 전체에서 처리) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-cta='reserve']");
    if (!a) return;
    e.preventDefault();
    openReserve();
  });

  /* ---------- 5. 접수폼 (이메일 + 구글챗 전송) ---------- */
  var MIN_GAP_MS = 30000; /* 연속 전송 방지 */

  function kstNow() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    return d.toISOString().replace("T", " ").slice(0, 16) + " (KST)";
  }

  /* 접수 내용을 설정된 모든 곳(이메일 · 구글챗)으로 전달. 한 곳이라도 성공하면 접수 성공으로 처리 */
  function sendLead(payload) {
    var f = cfg.FORM || {};
    var jobs = [];
    if (f.APPS_SCRIPT_URL) {
      /* 구글 Apps Script: 이메일·구글챗·시트 기록을 서버 쪽에서 처리 (브라우저는 응답을 읽을 수 없어 전송되면 성공으로 봄) */
      return fetch(f.APPS_SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(function () { return true; }).catch(function () { return false; });
    }
    var mailUrl = f.ENDPOINT || (f.TO_EMAIL ? "https://formsubmit.co/ajax/" + f.TO_EMAIL : "");
    if (mailUrl) {
      var body = { "_subject": f.SUBJECT || "홈페이지 신규 접수", "_template": "table", "_captcha": "false" };
      Object.keys(payload).forEach(function (k) { body[k] = payload[k]; });
      jobs.push(fetch(mailUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          var ok = res.ok && (d.success === true || d.success === "true");
          if (!ok && window.console) console.warn("[접수 전송 실패]", res.status, d.message || d);
          return ok;
        });
      }).catch(function () { return false; }));
    }
    if (f.CHAT_WEBHOOK) {
      var lines = ["*" + (f.SUBJECT || "홈페이지 신규 접수") + "*"];
      Object.keys(payload).forEach(function (k) { lines.push(k + ": " + payload[k]); });
      /* 구글챗 웹훅은 브라우저 응답을 읽을 수 없어(no-cors) 요청이 전송되면 성공으로 봅니다. */
      jobs.push(fetch(f.CHAT_WEBHOOK, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ text: lines.join("\n") })
      }).then(function () { return true; }).catch(function () { return false; }));
    }
    if (!jobs.length) return Promise.resolve(null); /* 전송처 미설정 */
    return Promise.all(jobs).then(function (r) { return r.some(Boolean); });
  }

  /* 접수폼 공통 처리: 이벤트 접수폼(#event-form)과 방문예약 신청서(#reserve-form)가 함께 사용 */
  function bindLeadForm(o) {
    var form = o.form;
    if (!form) return;
    var notice = o.notice, submitBtn = o.submit;
    var el = form.elements;
    function setNotice(msg, isError) { notice.textContent = msg || ""; notice.classList.toggle("is-error", !!isError); }
    function invalid(input, msg) { input.setAttribute("aria-invalid", "true"); setNotice(msg, true); input.focus(); }

    var dateInput = el.visitDate;
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    form.querySelectorAll("input,select").forEach(function (n) {
      n.addEventListener("input", function () { n.removeAttribute("aria-invalid"); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setNotice("");
      form.querySelectorAll("[aria-invalid]").forEach(function (n) { n.removeAttribute("aria-invalid"); });
      if (el._honey && el._honey.value) return; /* 봇 차단 */

      var nameV = el.name.value.trim(), phoneV = el.phone.value.trim();
      if (nameV.length < 2) return invalid(el.name, "성명을 입력해 주세요.");
      if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phoneV)) return invalid(el.phone, "연락처를 올바르게 입력해 주세요. (예: 010-0000-0000)");
      if (!el.privacy.checked) return invalid(el.privacy, "개인정보 수집·이용 안내에 동의해 주세요.");

      var f = cfg.FORM || {};
      if (!f.APPS_SCRIPT_URL && !f.ENDPOINT && !f.TO_EMAIL && !f.CHAT_WEBHOOK) { setNotice("접수 연결을 준비 중입니다. 상담문의 " + (cfg.PHONE_DISPLAY || "") + " 로 연락해 주세요.", true); return; }

      var gapKey = "arkone-last-submit-" + o.source;
      var last = Number(store("session", gapKey) || 0);
      if (Date.now() - last < MIN_GAP_MS) { setNotice("접수가 방금 처리되었습니다. 잠시 후 다시 시도해 주세요.", true); return; }

      var scoreOk = el.scoreOptin && el.scoreOptin.checked && lastScore !== null;
      var payload = {
        "접수 경로": o.source,
        "성명": nameV,
        "연락처": phoneV,
        "방문 희망일": (el.visitDate && el.visitDate.value) || "(미입력)",
        "방문 희망시간": (el.visitTime && el.visitTime.value) || "(미입력)",
        "금 1돈 사은품 이벤트 신청": el.gift && el.gift.checked ? "신청함" : "신청 안 함",
        "청약가점(전송 동의 시)": scoreOk ? lastScore + "점 (84점 만점)" : "전달 안 함",
        "개인정보 수집·이용 동의": "동의"
      };
      if (el.sms) payload["분양정보 문자 수신 동의"] = el.sms.checked ? "동의" : "동의 안 함";
      payload["접수 일시"] = kstNow();

      submitBtn.disabled = true;
      var label = submitBtn.innerHTML;
      submitBtn.textContent = "전송 중…";

      sendLead(payload).then(function (ok) {
        if (ok) {
          store("session", gapKey, String(Date.now()));
          o.onSuccess();
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = label;
          setNotice("접수 전송에 실패했습니다. 잠시 후 다시 시도하시거나 상담문의 " + (cfg.PHONE_DISPLAY || "") + " 로 연락해 주세요.", true);
        }
      });
    });
  }

  bindLeadForm({
    form: $("event-form"), notice: $("event-notice"), submit: $("event-submit"), source: "사은품 이벤트 접수폼",
    onSuccess: function () {
      $("event-form").hidden = true;
      var done = $("event-success");
      done.hidden = false;
      wireCtas(done);
      done.focus();
      if (!reduce) done.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  /* 방문예약 신청서 팝업 */
  var rvDlg = $("reserve-dialog");
  function openReserve() {
    if (!rvDlg) return;
    var calc = $("calc-popup");
    if (calc && calc.open) calc.close();
    var sc = $("rv-score");
    if (sc) {
      sc.classList.toggle("visible", lastScore !== null);
      if (lastScore !== null) $("rv-score-val").textContent = lastScore + "점";
    }
    if (!rvDlg.open) { if (typeof rvDlg.showModal === "function") rvDlg.showModal(); else rvDlg.setAttribute("open", ""); }
    document.documentElement.classList.add("is-modal");
  }
  function closeReserve() {
    if (!rvDlg || !rvDlg.open) return;
    if (typeof rvDlg.close === "function") rvDlg.close(); else rvDlg.removeAttribute("open");
    document.documentElement.classList.remove("is-modal");
  }
  if (rvDlg) {
    rvDlg.addEventListener("close", function () { document.documentElement.classList.remove("is-modal"); });
    rvDlg.addEventListener("click", function (e) { if (e.target === rvDlg) closeReserve(); });
    rvDlg.querySelectorAll("[data-rv-close]").forEach(function (n) { n.addEventListener("click", closeReserve); });
    bindLeadForm({
      form: $("reserve-form"), notice: $("rv-notice"), submit: $("rv-submit"), source: "방문예약 신청서",
      onSuccess: function () {
        $("rv-view").hidden = true;
        var done = $("rv-success");
        done.hidden = false;
        wireCtas(done);
        done.focus();
        rvDlg.querySelector(".popup__panel").scrollTop = 0;
      }
    });
  }

  /* ---------- 6. 팝업 (청약 가점 계산기) ---------- */
  var dlg = $("calc-popup");
  var popCfg = cfg.POPUP || {};
  var today = new Date().toISOString().slice(0, 10);

  function openPopup() {
    if (!dlg || dlg.open) return;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("is-modal");
  }
  function closePopup() {
    if (!dlg || !dlg.open) return;
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    document.documentElement.classList.remove("is-modal");
  }
  if (dlg) {
    dlg.addEventListener("close", function () { document.documentElement.classList.remove("is-modal"); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closePopup(); });
    dlg.querySelectorAll("[data-popup-close]").forEach(function (n) { n.addEventListener("click", closePopup); });
    dlg.querySelectorAll("[data-popup-snooze]").forEach(function (n) {
      n.addEventListener("click", function () { store("local", "arkone-popup-snooze", today); closePopup(); });
    });
  }
  document.querySelectorAll("[data-open-calc]").forEach(function (n) { n.addEventListener("click", openPopup); });

  /* 자동 팝업: 접속 후 지연 시간이 지나면 1회(세션당), '오늘 하루 보지 않기' 선택 시 당일 제외 */
  if (dlg && popCfg.ENABLED !== false) {
    var seen = store("session", "arkone-popup-seen");
    var snoozed = store("local", "arkone-popup-snooze") === today;
    if (!seen && !snoozed) {
      setTimeout(function () {
        if (dlg.open) return;
        store("session", "arkone-popup-seen", "1");
        openPopup();
      }, popCfg.DELAY_MS || 4000);
    }
  }

  /* ---------- 7. 스크롤 등장 효과 (모션 감소 설정 존중) ---------- */
  var targets = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (t) { t.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- 히어로 배경 영상 (1회 재생 후 정지 · 버튼으로 일시정지/다시보기 · 모션 감소·데이터 절약 시 정지 이미지) ---------- */
  (function () {
    var hv = $("hero-video"), btn = $("hero-vbtn"), hero = document.getElementById("top");
    var vc = cfg.VIDEO || {};
    if (!hv || !hero || !(vc.MP4 || vc.WEBM)) return;
    var conn = navigator.connection || {};
    if (reduce || conn.saveData) return;
    var src = (vc.MP4 && hv.canPlayType('video/mp4; codecs="avc1.4D401E"')) ? vc.MP4
            : (vc.WEBM && hv.canPlayType('video/webm; codecs="vp9"')) ? vc.WEBM : "";
    if (!src) return;
    function toUrl(u) { /* data: 주소(단일 파일 배포)는 Blob 으로 바꿔 모든 브라우저에서 재생되게 함 */
      var mm = /^data:([^;]+);base64,(.*)$/.exec(u);
      if (!mm) return u;
      var bin = atob(mm[2]), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([arr], { type: mm[1] }));
    }
    function state(st) {
      btn.setAttribute("data-state", st);
      btn.setAttribute("aria-label", st === "pause" ? "배경 영상 일시정지" : st === "play" ? "배경 영상 재생" : "배경 영상 다시 재생");
    }
    hv.addEventListener("playing", function () { hero.classList.add("is-playing"); hero.classList.remove("is-ended"); state("pause"); });
    hv.addEventListener("pause", function () { if (!hv.ended) state("play"); });
    hv.addEventListener("ended", function () { hero.classList.add("is-ended"); state("replay"); });
    btn.addEventListener("click", function () {
      if (hv.ended) { hv.currentTime = 0; hv.play(); }
      else if (hv.paused) hv.play(); else hv.pause();
    });
    hv.src = toUrl(src);
    var pr = hv.play();
    if (pr && pr.catch) pr.catch(function () { /* 자동재생이 막히면 정지 이미지 유지 */ });
    btn.hidden = false;
  })();

  /* ---------- 그랜드오픈 D-day (한국시간 기준, 지나면 숨김) ---------- */
  document.querySelectorAll("[data-dday]").forEach(function (n) {
    var p = n.getAttribute("data-dday").split("-");
    var target = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var k = new Date(Date.now() + 9 * 3600 * 1000);
    var today = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
    var diff = Math.round((target - today) / 86400000);
    if (diff > 0) { n.textContent = "D-" + diff; n.hidden = false; }
    else if (diff === 0) { n.textContent = "오늘 오픈"; n.hidden = false; }
  });

  /* ---------- 8. 상단 바 스크롤 상태 ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-solid", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  /* ---------- 9. 숫자 카운트업 (핵심 정보) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(n, delay) {
    var end = Number(n.getAttribute("data-count"));
    var finalText = end.toLocaleString("ko-KR");
    var digits = finalText.replace(/[^0-9]/g, "").length;
    n.style.minWidth = (digits + (finalText.length - digits) * 0.35) + "ch"; /* 숫자 폭 고정(콤마는 좁게) */
    var dur = 1400, start = null;
    n.textContent = "0";
    function step(ts) {
      if (start === null) start = ts + delay;
      var t = Math.min(1, Math.max(0, (ts - start) / dur));
      var eased = 1 - Math.pow(1 - t, 3);
      n.textContent = Math.round(end * eased).toLocaleString("ko-KR");
      if (t < 1) requestAnimationFrame(step); else n.textContent = finalText;
    }
    requestAnimationFrame(step);
  }
  if (!reduce && "IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var idx = Array.prototype.indexOf.call(counters, en.target);
        runCount(en.target, idx * 120);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (n) { cio.observe(n); });
  }

  /* ---------- 10. 변경된 청약제도 탭 (JS 미작동 시에는 전체 표시) ---------- */
  var tabWrap = document.querySelector(".tabs");
  if (tabWrap) {
    var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll("[role=tab]"));
    var section = document.getElementById("rules");
    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      section.querySelectorAll(".tabpanel:not([hidden]) .reveal").forEach(function (r) { r.classList.add("is-in"); });
      if (focus) tab.focus();
    }
    tabWrap.hidden = false;
    section.classList.add("has-tabs");
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, ni = -1;
        if (k === "ArrowRight") ni = (i + 1) % tabs.length;
        else if (k === "ArrowLeft") ni = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") ni = 0;
        else if (k === "End") ni = tabs.length - 1;
        if (ni > -1) { e.preventDefault(); selectTab(tabs[ni], true); }
      });
    });
    selectTab(tabs[0]);
  }

  /* ---------- 11. 날짜·시간 입력칸: 어디를 눌러도 선택창이 열리도록 ---------- */
  document.querySelectorAll("input[type=date], input[type=time]").forEach(function (inp) {
    inp.addEventListener("click", function () {
      if (typeof inp.showPicker === "function") {
        try { inp.showPicker(); } catch (e) { /* 지원하지 않는 환경에서는 기본 동작 사용 */ }
      }
    });
  });
})();
