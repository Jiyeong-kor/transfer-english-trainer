"use strict";

const VOCAB = Array.isArray(window.TRANSFER_ENGLISH_VOCAB) ? window.TRANSFER_ENGLISH_VOCAB : [];
const GRAMMAR = Array.isArray(window.TRANSFER_ENGLISH_GRAMMAR) ? window.TRANSFER_ENGLISH_GRAMMAR : [];
const ITEMS = [...VOCAB, ...GRAMMAR];
const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]));
const STORAGE_KEY = "transfer-english-trainer-v1";
const STATE_VERSION = 1;
const DAILY_VOCAB_COUNT = 8;
const DAILY_GRAMMAR_COUNT = 4;
const app = document.getElementById("app");
const toast = document.getElementById("toast");
const importInput = document.getElementById("backup-import");

let view = { name: "home", filter: "all", reveal: false };
let toastTimer = null;
let state = loadState();

function freshState() {
  return {
    version: STATE_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviews: {},
    dailySets: {},
    activeSession: null,
    completedSessions: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STATE_VERSION) return freshState();
    return { ...freshState(), ...parsed, reviews: parsed.reviews || {}, dailySets: parsed.dailySets || {} };
  } catch (error) {
    console.error(error);
    return freshState();
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function seoulDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDaysIso(days) {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

function reviewFor(id) {
  return state.reviews[id] || null;
}

function isWeak(id) {
  const review = reviewFor(id);
  return review?.lastGrade === "again" || review?.lastGrade === "hard";
}

function dueNow(id) {
  const review = reviewFor(id);
  if (!review?.dueAt) return false;
  return new Date(review.dueAt).getTime() <= Date.now();
}

function initialPriority(item) {
  let score = 0;
  if (item.focus) score += 90;
  if (item.initialStrength === "weak") score += 60;
  if (item.initialStrength === "uncertain") score += 40;
  if (item.initialStrength === "new") score += 15;
  return score;
}

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function priorityScore(item, dayKey) {
  const review = reviewFor(item.id);
  let score = initialPriority(item);
  if (!review) score += 80;
  if (dueNow(item.id)) score += 120;
  if (review?.lastGrade === "again") score += 100;
  if (review?.lastGrade === "hard") score += 65;
  if (review?.lastGrade === "good") score -= Math.min(55, (review.goodStreak || 0) * 12);
  score += (hash(`${dayKey}:${item.id}`) % 1000) / 1000;
  return score;
}

function pickForType(type, count, dayKey) {
  return ITEMS
    .filter((item) => item.type === type)
    .map((item) => ({ item, score: priorityScore(item, dayKey) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ item }) => item.id);
}

function getDailySet() {
  const dayKey = seoulDateKey();
  const saved = state.dailySets[dayKey];
  if (saved?.ids?.every((id) => ITEM_MAP.has(id))) return saved;
  const ids = [
    ...pickForType("vocab", DAILY_VOCAB_COUNT, dayKey),
    ...pickForType("grammar", DAILY_GRAMMAR_COUNT, dayKey),
  ];
  const set = { ids, createdAt: new Date().toISOString() };
  state.dailySets[dayKey] = set;
  saveState();
  return set;
}

function progressStats() {
  const studied = ITEMS.filter((item) => reviewFor(item.id)?.seenCount > 0).length;
  const weak = ITEMS.filter((item) => isWeak(item.id)).length;
  const due = ITEMS.filter((item) => dueNow(item.id)).length;
  return { studied, weak, due };
}

function gradeLabel(grade) {
  return grade === "again" ? "몰랐음" : grade === "hard" ? "애매함" : "확실히 앎";
}

function updateReview(itemId, grade) {
  const previous = reviewFor(itemId) || {
    seenCount: 0,
    goodStreak: 0,
    intervalDays: 0,
    history: [],
  };
  let intervalDays = previous.intervalDays || 0;
  let goodStreak = previous.goodStreak || 0;

  if (grade === "again") {
    intervalDays = 1;
    goodStreak = 0;
  } else if (grade === "hard") {
    intervalDays = Math.max(1, Math.min(3, intervalDays || 1));
    goodStreak = 0;
  } else {
    goodStreak += 1;
    intervalDays = intervalDays > 0 ? Math.min(30, Math.max(3, Math.round(intervalDays * 2.2))) : 3;
  }

  const entry = {
    ...previous,
    seenCount: previous.seenCount + 1,
    goodStreak,
    intervalDays,
    lastGrade: grade,
    lastReviewedAt: new Date().toISOString(),
    dueAt: addDaysIso(intervalDays),
    history: [
      ...(previous.history || []).slice(-19),
      { grade, reviewedAt: new Date().toISOString() },
    ],
  };
  state.reviews[itemId] = entry;
}

function sessionItem() {
  const session = state.activeSession;
  if (!session) return null;
  return ITEM_MAP.get(session.ids[session.index]) || null;
}

function startSession(ids, label, mode) {
  const unique = [...new Set(ids)].filter((id) => ITEM_MAP.has(id));
  if (!unique.length) {
    showToast("지금 복습할 항목이 없습니다.");
    return;
  }
  state.activeSession = {
    id: `session-${Date.now()}`,
    label,
    mode,
    ids: unique,
    index: 0,
    grades: { again: 0, hard: 0, good: 0 },
    startedAt: new Date().toISOString(),
  };
  saveState();
  view = { name: "study", filter: view.filter, reveal: false };
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function startDaily() {
  const daily = getDailySet();
  startSession(daily.ids, "오늘의 학습", "daily");
}

function startWeak() {
  const ids = ITEMS
    .filter((item) => isWeak(item.id) || item.focus)
    .sort((a, b) => priorityScore(b, seoulDateKey()) - priorityScore(a, seoulDateKey()))
    .map((item) => item.id);
  startSession(ids, "취약 항목 복습", "weak");
}

function startCategory(type) {
  const ids = ITEMS
    .filter((item) => item.type === type)
    .sort((a, b) => priorityScore(b, seoulDateKey()) - priorityScore(a, seoulDateKey()))
    .map((item) => item.id);
  startSession(ids, type === "vocab" ? "어휘 전체 학습" : "문법 전체 학습", type);
}

function resumeSession() {
  if (!state.activeSession) return;
  view.name = "study";
  view.reveal = false;
  render();
}

function gradeCurrent(grade) {
  const session = state.activeSession;
  const item = sessionItem();
  if (!session || !item || !view.reveal) return;
  updateReview(item.id, grade);
  session.grades[grade] += 1;
  session.index += 1;
  view.reveal = false;

  if (session.index >= session.ids.length) {
    completeSession();
    return;
  }
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function completeSession() {
  const session = state.activeSession;
  if (!session) return;
  const summary = {
    id: session.id,
    label: session.label,
    total: session.ids.length,
    grades: session.grades,
    completedAt: new Date().toISOString(),
  };
  state.completedSessions.push(summary);
  state.completedSessions = state.completedSessions.slice(-50);
  state.activeSession = null;
  saveState();
  view = { name: "summary", filter: "all", reveal: false, summary };
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function quitSession() {
  if (!state.activeSession) return;
  state.activeSession = null;
  saveState();
  goHome();
}

function goHome() {
  view = { name: "home", filter: view.filter || "all", reveal: false };
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openBrowse(filter = "all") {
  view = { name: "browse", filter, reveal: false };
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function browseItems() {
  if (view.filter === "vocab") return VOCAB;
  if (view.filter === "grammar") return GRAMMAR;
  if (view.filter === "weak") return ITEMS.filter((item) => isWeak(item.id) || item.focus);
  return ITEMS;
}

function startSingle(id) {
  const item = ITEM_MAP.get(id);
  if (!item) return;
  startSession([id], item.type === "vocab" ? "어휘 확인" : "문법 확인", "single");
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transfer-english-trainer-${seoulDateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (parsed?.version !== STATE_VERSION || typeof parsed.reviews !== "object") {
        throw new Error("지원하지 않는 백업 형식");
      }
      state = { ...freshState(), ...parsed };
      saveState();
      showToast("학습 기록을 복원했습니다.");
      goHome();
    } catch (error) {
      console.error(error);
      showToast("백업 파일을 읽지 못했습니다.");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function renderTopbar(subtitle = "Notion 오답노트 기반") {
  return `
    <header class="topbar">
      <div class="brand">
        <strong>편입영어 트레이너</strong>
        <span>${esc(subtitle)}</span>
      </div>
      <button class="icon-button" data-action="browse">전체 보기</button>
    </header>
  `;
}

function renderHome() {
  const stats = progressStats();
  const daily = getDailySet();
  const dailyDone = daily.ids.filter((id) => reviewFor(id)?.lastReviewedAt?.slice(0, 10) === seoulDateKey()).length;
  const pct = Math.round((stats.studied / ITEMS.length) * 100);
  app.innerHTML = `
    <main class="shell">
      ${renderTopbar()}
      <section class="hero">
        <small>오늘의 우선순위</small>
        <h1>오답과 혼동어부터 다시 꺼내기</h1>
        <p>최근 오답, 애매하게 맞힌 항목, 아직 회상하지 않은 항목을 우선해서 어휘 8개와 문법 4개를 구성합니다.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="${state.activeSession ? "resume" : "daily"}">${state.activeSession ? "이어서 공부" : "오늘 12개 시작"}</button>
        </div>
      </section>

      <section class="stats" aria-label="학습 현황">
        <div class="stat"><strong>${stats.studied}</strong><span>학습한 항목</span></div>
        <div class="stat"><strong>${stats.weak}</strong><span>취약·집중</span></div>
        <div class="stat"><strong>${stats.due}</strong><span>복습 예정</span></div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>오늘의 학습</h2>
          <span>${dailyDone}/${daily.ids.length} 최근 복습</span>
        </div>
        <div class="progress-track" aria-label="오늘의 학습 진행률">
          <div class="progress-fill" style="width:${Math.round((dailyDone / daily.ids.length) * 100)}%"></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>학습 모드</h2><span>총 ${ITEMS.length}개</span></div>
        <div class="grid">
          <button class="action-card" data-action="weak">
            <strong>오답·애매 복습</strong>
            <span>몰랐거나 애매했던 항목과 Notion에서 아직 구분이 남은 혼동어를 우선합니다.</span>
            <em>${stats.weak}개 취약 기록</em>
          </button>
          <button class="action-card" data-action="category" data-type="vocab">
            <strong>어휘 ${VOCAB.length}개</strong>
            <span>뜻을 보기 전에 먼저 회상하고, 유의어와 혼동어를 확인합니다.</span>
            <em>보기 없는 회상</em>
          </button>
          <button class="action-card" data-action="category" data-type="grammar">
            <strong>문법 ${GRAMMAR.length}개</strong>
            <span>틀린 문장을 오래 보기보다 정답 패턴과 올바른 예문을 먼저 익힙니다.</span>
            <em>정답 패턴 중심</em>
          </button>
          <button class="action-card" data-action="browse">
            <strong>전체 자료 보기</strong>
            <span>현재 앱에 옮긴 Notion 어휘와 문법 항목을 목록에서 직접 확인합니다.</span>
            <em>${pct}% 한 번 이상 학습</em>
          </button>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>기록 관리</h2><span>기기 내부 저장</span></div>
        <div class="footer-tools">
          <button class="button ghost" data-action="export">JSON 백업</button>
          <button class="button ghost" data-action="import">JSON 복원</button>
        </div>
      </section>
    </main>
  `;
}

function renderStudy() {
  const session = state.activeSession;
  const item = sessionItem();
  if (!session || !item) {
    goHome();
    return;
  }
  const current = session.index + 1;
  const percent = Math.round((session.index / session.ids.length) * 100);
  const review = reviewFor(item.id);
  const isVocab = item.type === "vocab";
  const main = isVocab ? item.term : item.title;
  const badge = isVocab ? "어휘" : "문법";
  const source = item.source || "Notion 편입 영어 오답노트";

  const details = isVocab
    ? `
      ${item.synonyms?.length ? `<div class="detail"><strong>유의어</strong><div class="chips">${item.synonyms.map((word) => `<span class="chip">${esc(word)}</span>`).join("")}</div></div>` : ""}
      ${item.confusions?.length ? `<div class="confusion"><strong>혼동 주의</strong><br>${item.confusions.map(esc).join("<br>")}</div>` : ""}
    `
    : `
      <div class="detail">${esc(item.explanation || "")}</div>
      ${item.example ? `<div class="confusion"><strong>정답 예문</strong><br>${esc(item.example)}</div>` : ""}
    `;

  app.innerHTML = `
    <main class="shell">
      <header class="study-head">
        <button class="icon-button" data-action="home">홈</button>
        <div class="progress-label">${esc(session.label)} · ${current}/${session.ids.length}</div>
        <button class="icon-button" data-action="quit">종료</button>
      </header>
      <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>

      <section class="study-card">
        <div class="badge-row">
          <span class="badge">${badge}</span>
          ${item.focus ? `<span class="badge warn">집중 복습</span>` : ""}
          ${review ? `<span class="badge">${esc(gradeLabel(review.lastGrade))} 기록 있음</span>` : ""}
        </div>

        <div class="prompt">
          <div class="term">${esc(main)}</div>
          <div class="question">${esc(item.prompt)}</div>
        </div>

        <div class="reveal-wrap">
          ${view.reveal ? `
            <div class="answer-panel">
              <h3>정답</h3>
              <div class="answer-main">${esc(item.answer)}</div>
              ${details}
              <div class="source">출처: ${esc(source)}</div>
            </div>
            <div class="grades" aria-label="회상 결과">
              <button class="grade again" data-grade="again">몰랐음</button>
              <button class="grade hard" data-grade="hard">애매함</button>
              <button class="grade good" data-grade="good">확실히 앎</button>
            </div>
          ` : `
            <button class="button brand" data-action="reveal">정답 보기</button>
          `}
        </div>
      </section>
    </main>
  `;
}

function renderBrowse() {
  const items = browseItems();
  const filterButton = (key, label) => `<button class="filter ${view.filter === key ? "active" : ""}" data-filter="${key}">${label}</button>`;
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><strong>전체 학습 자료</strong><span>${items.length}개 표시</span></div>
        <button class="icon-button" data-action="home">홈</button>
      </header>
      <div class="filters">
        ${filterButton("all", `전체 ${ITEMS.length}`)}
        ${filterButton("vocab", `어휘 ${VOCAB.length}`)}
        ${filterButton("grammar", `문법 ${GRAMMAR.length}`)}
        ${filterButton("weak", "취약·집중")}
      </div>
      <section class="section">
        <div class="list">
          ${items.map((item) => {
            const review = reviewFor(item.id);
            const subtitle = item.type === "vocab"
              ? `${item.answer}${item.synonyms?.length ? ` · ${item.synonyms.slice(0, 3).join(", ")}` : ""}`
              : item.answer;
            return `
              <button class="list-item" data-item="${esc(item.id)}">
                <strong>${esc(item.type === "vocab" ? item.term : item.title)}</strong>
                <span>${esc(subtitle)}</span>
                ${review ? `<span> · 최근: ${esc(gradeLabel(review.lastGrade))}</span>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderSummary() {
  const summary = view.summary || state.completedSessions.at(-1);
  if (!summary) {
    goHome();
    return;
  }
  app.innerHTML = `
    <main class="shell">
      <section class="summary">
        <small>${esc(summary.label)}</small>
        <h1>${summary.total}개 학습 완료</h1>
        <p>모르는 항목과 애매한 항목은 다음 복습에서 우선순위가 올라갑니다.</p>
        <div class="summary-grid">
          <div><strong>${summary.grades.again}</strong><span>몰랐음</span></div>
          <div><strong>${summary.grades.hard}</strong><span>애매함</span></div>
          <div><strong>${summary.grades.good}</strong><span>확실히 앎</span></div>
        </div>
        <button class="button brand" data-action="home">홈으로</button>
      </section>
    </main>
  `;
}

function render() {
  if (!ITEMS.length) {
    app.textContent = "학습 데이터를 불러오지 못했습니다.";
    return;
  }
  if (view.name === "study") renderStudy();
  else if (view.name === "browse") renderBrowse();
  else if (view.name === "summary") renderSummary();
  else renderHome();
}

document.addEventListener("click", (event) => {
  const grade = event.target.closest("[data-grade]")?.dataset.grade;
  if (grade) {
    gradeCurrent(grade);
    return;
  }

  const filter = event.target.closest("[data-filter]")?.dataset.filter;
  if (filter) {
    view.filter = filter;
    render();
    return;
  }

  const itemId = event.target.closest("[data-item]")?.dataset.item;
  if (itemId) {
    startSingle(itemId);
    return;
  }

  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "daily") startDaily();
  else if (action === "resume") resumeSession();
  else if (action === "weak") startWeak();
  else if (action === "category") startCategory(target.dataset.type);
  else if (action === "reveal") { view.reveal = true; render(); }
  else if (action === "home") goHome();
  else if (action === "quit") quitSession();
  else if (action === "browse") openBrowse("all");
  else if (action === "export") exportBackup();
  else if (action === "import") importInput.click();
});

importInput.addEventListener("change", () => {
  const file = importInput.files?.[0];
  if (file) importBackup(file);
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.error("SW registration failed", error));
  });
}

render();
