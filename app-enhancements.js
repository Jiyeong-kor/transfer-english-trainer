"use strict";

const ENH_TEST_COUNT = 20;

function enhHash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function enhShuffle(values, seed) {
  return [...values]
    .map((value, index) => ({ value, score: enhHash(`${seed}:${index}:${String(value)}`) }))
    .sort((a, b) => a.score - b.score)
    .map(({ value }) => value);
}

function enhUnique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value).trim() !== ""))];
}

function enhMastered(id) {
  const review = reviewFor(id);
  return review?.lastGrade === "good" && (review.goodStreak || 0) >= 2;
}

function enhVariant(item, session) {
  if (session.mode === "recall") return "recall";
  if (session.mode === "test") {
    if (item.type === "vocab" && item.confusions?.length) return "meaning-choice";
    return item.type === "vocab" ? "synonym-choice" : "grammar-choice";
  }
  const value = enhHash(`${session.id}:${session.index}:${item.id}`);
  if (item.type === "vocab") {
    if (item.confusions?.length && value % 3 === 0) return "meaning-choice";
    if (item.synonyms?.length && value % 2 === 0) return "synonym-choice";
    return "recall";
  }
  return value % 3 === 0 ? "recall" : "grammar-choice";
}

function enhVocabDistractors(item, field, seed) {
  const pool = VOCAB
    .filter((candidate) => candidate.id !== item.id)
    .flatMap((candidate) => field === "synonym" ? candidate.synonyms?.slice(0, 1) || [] : [candidate.answer]);
  return enhShuffle(enhUnique(pool), seed);
}

function enhConfusionMeanings(item) {
  return (item.confusions || [])
    .map((text) => String(text).split(":").slice(1).join(":").trim())
    .filter(Boolean);
}

function enhChoiceModel(item, variant, session) {
  const seed = `${session.id}:${session.index}:${variant}`;
  if (variant === "synonym-choice") {
    const correct = item.synonyms?.[0] || item.answer;
    const distractors = enhVocabDistractors(item, "synonym", seed).filter((value) => value !== correct).slice(0, 3);
    return {
      question: `${item.term}과 가장 가까운 영어 표현은 무엇인가요?`,
      correct,
      options: enhShuffle(enhUnique([correct, ...distractors]).slice(0, 4), `${seed}:options`),
    };
  }
  if (variant === "meaning-choice") {
    const correct = item.answer;
    const distractors = enhUnique([
      ...enhConfusionMeanings(item),
      ...enhVocabDistractors(item, "meaning", seed),
    ]).filter((value) => value !== correct).slice(0, 3);
    return {
      question: `${item.term}의 뜻으로 가장 적절한 것은 무엇인가요?`,
      correct,
      options: enhShuffle(enhUnique([correct, ...distractors]).slice(0, 4), `${seed}:options`),
    };
  }
  const correct = item.answer;
  const fallback = GRAMMAR.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.answer);
  const distractors = enhUnique([...(item.distractors || []), ...enhShuffle(fallback, seed)])
    .filter((value) => value !== correct)
    .slice(0, 3);
  return {
    question: item.quizPrompt || item.prompt,
    correct,
    options: enhShuffle(enhUnique([correct, ...distractors]).slice(0, 4), `${seed}:options`),
  };
}

function enhDetails(item) {
  if (item.type === "vocab") {
    return `
      ${item.synonyms?.length ? `<div class="detail"><strong>유의어</strong><div class="chips">${item.synonyms.map((word) => `<span class="chip">${esc(word)}</span>`).join("")}</div></div>` : ""}
      ${item.confusions?.length ? `<div class="confusion"><strong>혼동 주의</strong><br>${item.confusions.map(esc).join("<br>")}</div>` : ""}
    `;
  }
  return `
    <div class="detail">${esc(item.explanation || "")}</div>
    ${item.example ? `<div class="confusion"><strong>정답 예문</strong><br>${esc(item.example)}</div>` : ""}
  `;
}

function enhGradeButtons(objectiveCorrect = null) {
  if (objectiveCorrect === false) {
    return `<div class="grades"><button class="grade again full-grade" data-grade="again">오답으로 기록하고 다음</button></div>`;
  }
  if (objectiveCorrect === true) {
    return `<div class="grades"><button class="grade hard" data-grade="hard">애매하게 맞음</button><button class="grade good" data-grade="good">확실히 맞음</button></div>`;
  }
  return `<div class="grades"><button class="grade again" data-grade="again">몰랐음</button><button class="grade hard" data-grade="hard">애매함</button><button class="grade good" data-grade="good">확실히 앎</button></div>`;
}

function enhRecordReview(itemId, grade, objectiveCorrect, variant) {
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
  const reviewedAt = new Date().toISOString();
  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  state.reviews[itemId] = {
    ...previous,
    seenCount: (previous.seenCount || 0) + 1,
    goodStreak,
    intervalDays,
    lastGrade: grade,
    lastVariant: variant,
    lastObjectiveCorrect: objectiveCorrect,
    lastReviewedAt: reviewedAt,
    dueAt: due.toISOString(),
    history: [
      ...(previous.history || []).slice(-39),
      { grade, objectiveCorrect, variant, reviewedAt },
    ],
  };
}

progressStats = function progressStatsEnhanced() {
  const studied = ITEMS.filter((item) => reviewFor(item.id)?.seenCount > 0).length;
  const weak = ITEMS.filter((item) => isWeak(item.id) || (item.focus && !enhMastered(item.id))).length;
  const due = ITEMS.filter((item) => dueNow(item.id)).length;
  const mastered = ITEMS.filter((item) => enhMastered(item.id)).length;
  const objective = ITEMS
    .flatMap((item) => reviewFor(item.id)?.history || [])
    .filter((entry) => typeof entry.objectiveCorrect === "boolean");
  const accuracy = objective.length
    ? Math.round((objective.filter((entry) => entry.objectiveCorrect).length / objective.length) * 100)
    : null;
  return { studied, weak, due, mastered, accuracy };
};

startWeak = function startWeakEnhanced() {
  const ids = ITEMS
    .filter((item) => isWeak(item.id) || (item.focus && !enhMastered(item.id)))
    .sort((a, b) => priorityScore(b, seoulDateKey()) - priorityScore(a, seoulDateKey()))
    .map((item) => item.id);
  startSession(ids, "오답·혼동 집중", "weak");
};

browseItems = function browseItemsEnhanced() {
  if (view.filter === "vocab") return VOCAB;
  if (view.filter === "grammar") return GRAMMAR;
  if (view.filter === "weak") return ITEMS.filter((item) => isWeak(item.id) || (item.focus && !enhMastered(item.id)));
  if (view.filter === "due") return ITEMS.filter((item) => dueNow(item.id));
  if (view.filter === "mastered") return ITEMS.filter((item) => enhMastered(item.id));
  return ITEMS;
};

function enhStartDue() {
  const ids = ITEMS
    .filter((item) => dueNow(item.id))
    .sort((a, b) => new Date(reviewFor(a.id).dueAt) - new Date(reviewFor(b.id).dueAt))
    .map((item) => item.id);
  startSession(ids, "오늘 복습 예정", "weak");
}

function enhStartRecall() {
  const ids = [...ITEMS]
    .sort((a, b) => priorityScore(b, seoulDateKey()) - priorityScore(a, seoulDateKey()))
    .map((item) => item.id);
  startSession(ids, "보기 없는 회상", "recall");
}

function enhStartTest() {
  const day = seoulDateKey();
  const ids = ITEMS
    .map((item) => ({ item, score: priorityScore(item, day) + (enhHash(`${Date.now()}:${item.id}`) % 1000) / 1000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(ENH_TEST_COUNT, ITEMS.length))
    .map(({ item }) => item.id);
  startSession(ids, `${Math.min(ENH_TEST_COUNT, ITEMS.length)}문제 실전 변별`, "test");
}

function enhRecentSessions() {
  const sessions = [...state.completedSessions].slice(-3).reverse();
  if (!sessions.length) return `<p class="muted">아직 완료한 학습 세션이 없습니다.</p>`;
  return `<div class="recent-list">${sessions.map((session) => {
    const objective = session.objective?.answered ? `${session.objective.correct}/${session.objective.answered} 객관식 정답` : "회상 중심";
    return `<div class="recent-item"><strong>${esc(session.label)}</strong><span>${esc(objective)} · ${esc(seoulDateKey(new Date(session.completedAt)))}</span></div>`;
  }).join("")}</div>`;
}

renderHome = function renderHomeEnhanced() {
  const stats = progressStats();
  const daily = getDailySet();
  const today = seoulDateKey();
  const dailyDone = daily.ids.filter((id) => {
    const review = reviewFor(id);
    return (review?.history || []).some((entry) => entry.reviewedAt && seoulDateKey(new Date(entry.reviewedAt)) === today)
      || (review?.lastReviewedAt && seoulDateKey(new Date(review.lastReviewedAt)) === today);
  }).length;
  const pct = ITEMS.length ? Math.round((stats.studied / ITEMS.length) * 100) : 0;
  app.innerHTML = `
    <main class="shell">
      ${renderTopbar()}
      <section class="hero">
        <small>오늘의 우선순위</small>
        <h1>오답과 혼동어부터 다시 꺼내기</h1>
        <p>보기 없는 회상과 객관식 변별을 섞어서 어휘 8개와 문법 4개를 구성합니다. 실제 오답과 아직 구분이 남은 항목은 더 자주 나옵니다.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="${state.activeSession ? "resume" : "daily"}">${state.activeSession ? "이어서 공부" : "오늘 12개 시작"}</button>
          <button class="button secondary" data-enh-action="test">20문제 실전 변별</button>
        </div>
      </section>
      <section class="stats stats-five" aria-label="학습 현황">
        <div class="stat"><strong>${stats.studied}</strong><span>학습</span></div>
        <div class="stat"><strong>${stats.weak}</strong><span>취약</span></div>
        <div class="stat"><strong>${stats.due}</strong><span>복습 예정</span></div>
        <div class="stat"><strong>${stats.mastered}</strong><span>안정</span></div>
        <div class="stat"><strong>${stats.accuracy === null ? "-" : `${stats.accuracy}%`}</strong><span>객관식</span></div>
      </section>
      <section class="section">
        <div class="section-head"><h2>오늘의 학습</h2><span>${dailyDone}/${daily.ids.length} 완료</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${daily.ids.length ? Math.round((dailyDone / daily.ids.length) * 100) : 0}%"></div></div>
        ${stats.due ? `<button class="inline-link" data-enh-action="due">복습 예정 ${stats.due}개 바로 시작</button>` : ""}
      </section>
      <section class="section">
        <div class="section-head"><h2>학습 모드</h2><span>총 ${ITEMS.length}개</span></div>
        <div class="grid">
          <button class="action-card" data-action="weak"><strong>오답·혼동 집중</strong><span>몰랐거나 애매했던 항목과 아직 구분이 남은 혼동어를 우선합니다.</span><em>${stats.weak}개</em></button>
          <button class="action-card" data-enh-action="recall"><strong>보기 없는 회상</strong><span>선택지 없이 뜻과 정답 패턴을 먼저 머릿속에서 꺼냅니다.</span><em>전 범위 회상</em></button>
          <button class="action-card" data-action="category" data-type="vocab"><strong>어휘 ${VOCAB.length}개</strong><span>회상, 유의어 변별, 혼동어 뜻 구분을 섞어서 학습합니다.</span><em>3가지 유형</em></button>
          <button class="action-card" data-action="category" data-type="grammar"><strong>문법 ${GRAMMAR.length}개</strong><span>정답 패턴 회상과 시험형 선택 문제를 섞습니다.</span><em>정답 패턴 중심</em></button>
          <button class="action-card" data-action="browse"><strong>전체 자료 보기</strong><span>Notion 자료와 학습 상태를 항목별로 확인합니다.</span><em>${pct}% 한 번 이상 학습</em></button>
        </div>
      </section>
      <section class="section"><div class="section-head"><h2>최근 기록</h2><span>최근 3회</span></div>${enhRecentSessions()}</section>
      <section class="section">
        <div class="section-head"><h2>기록 관리</h2><span>기기 내부 저장</span></div>
        <div class="footer-tools"><button class="button ghost" data-action="export">JSON 백업</button><button class="button ghost" data-action="import">JSON 복원</button></div>
      </section>
    </main>
  `;
};

renderStudy = function renderStudyEnhanced() {
  const session = state.activeSession;
  if (!session) return goHome();
  const id = session.ids[session.index];
  const currentItem = ITEM_MAP.get(id);
  if (!currentItem) return goHome();
  session.draft ||= {};
  session.objective ||= { answered: 0, correct: 0 };
  const variant = enhVariant(currentItem, session);
  const current = session.index + 1;
  const percent = Math.round((session.index / session.ids.length) * 100);
  const review = reviewFor(currentItem.id);
  const variantLabel = variant === "recall" ? "회상" : variant === "synonym-choice" ? "유의어 변별" : variant === "meaning-choice" ? "혼동어 구분" : "시험형 선택";
  let body = "";

  if (variant === "recall") {
    body = `
      <div class="prompt"><div class="term">${esc(currentItem.type === "vocab" ? currentItem.term : currentItem.title)}</div><div class="question">${esc(currentItem.prompt)}</div></div>
      <div class="reveal-wrap">
        ${session.draft.revealed ? `<div class="answer-panel"><h3>정답</h3><div class="answer-main">${esc(currentItem.answer)}</div>${enhDetails(currentItem)}<div class="source">출처: ${esc(currentItem.source)}</div></div>${enhGradeButtons(null)}` : `<button class="button brand" data-enh-action="reveal">정답 보기</button>`}
      </div>
    `;
  } else {
    const model = enhChoiceModel(currentItem, variant, session);
    const submitted = Boolean(session.draft.submitted);
    const selected = session.draft.selected;
    const objectiveCorrect = submitted ? Boolean(session.draft.objectiveCorrect) : null;
    const options = model.options.map((option, index) => {
      const classes = ["choice-option"];
      if (selected === index) classes.push("selected");
      if (submitted && option === model.correct) classes.push("correct");
      if (submitted && selected === index && option !== model.correct) classes.push("wrong");
      return `<button class="${classes.join(" ")}" data-enh-choice="${index}" ${submitted ? "disabled" : ""}><span>${index + 1}</span>${esc(option)}</button>`;
    }).join("");
    body = `
      <div class="prompt"><div class="term">${esc(currentItem.type === "vocab" ? currentItem.term : currentItem.title)}</div><div class="question">${esc(model.question)}</div></div>
      <div class="choice-list">${options}</div>
      ${submitted ? `<div class="answer-panel result-panel ${objectiveCorrect ? "result-correct" : "result-wrong"}"><h3>${objectiveCorrect ? "정답" : "오답"}</h3><div class="answer-main">${esc(model.correct)}</div>${enhDetails(currentItem)}<div class="source">출처: ${esc(currentItem.source)}</div></div>${enhGradeButtons(objectiveCorrect)}` : `<button class="button brand" data-enh-action="submit-choice" ${Number.isInteger(selected) ? "" : "disabled"}>정답 확인</button>`}
    `;
  }

  app.innerHTML = `
    <main class="shell">
      <header class="study-head"><button class="icon-button" data-action="home">홈</button><div class="progress-label">${esc(session.label)} · ${current}/${session.ids.length}</div><button class="icon-button" data-action="quit">종료</button></header>
      <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
      <section class="study-card">
        <div class="badge-row"><span class="badge">${currentItem.type === "vocab" ? "어휘" : "문법"}</span><span class="badge mode-badge">${esc(variantLabel)}</span>${currentItem.focus && !enhMastered(currentItem.id) ? `<span class="badge warn">집중 복습</span>` : ""}${review ? `<span class="badge">${esc(gradeLabel(review.lastGrade))} 기록</span>` : ""}</div>
        ${body}
      </section>
    </main>
  `;
};

renderBrowse = function renderBrowseEnhanced() {
  const items = browseItems();
  const filterButton = (key, label) => `<button class="filter ${view.filter === key ? "active" : ""}" data-filter="${key}">${label}</button>`;
  app.innerHTML = `
    <main class="shell">
      <header class="study-head"><button class="icon-button" data-action="home">홈</button><div class="progress-label">전체 자료</div><span></span></header>
      <div class="filters">${filterButton("all", `전체 ${ITEMS.length}`)}${filterButton("vocab", `어휘 ${VOCAB.length}`)}${filterButton("grammar", `문법 ${GRAMMAR.length}`)}${filterButton("weak", "취약")}${filterButton("due", "복습 예정")}${filterButton("mastered", "안정")}</div>
      <section class="browse-list">
        ${items.length ? items.map((item) => {
          const review = reviewFor(item.id);
          const status = enhMastered(item.id) ? "안정" : review ? gradeLabel(review.lastGrade) : item.initialStrength === "weak" ? "초기 오답" : item.initialStrength === "uncertain" ? "초기 애매" : "미학습";
          return `<button class="browse-card" data-item="${esc(item.id)}"><span class="browse-kind">${item.type === "vocab" ? "어휘" : "문법"}</span><strong>${esc(item.type === "vocab" ? item.term : item.title)}</strong><span>${esc(item.answer)}</span><em>${esc(status)}${dueNow(item.id) ? " · 복습 예정" : ""}</em></button>`;
        }).join("") : `<div class="empty-state">해당 조건의 항목이 없습니다.</div>`}
      </section>
    </main>
  `;
};

completeSession = function completeSessionEnhanced() {
  const session = state.activeSession;
  if (!session) return;
  const summary = {
    id: session.id,
    label: session.label,
    total: session.ids.length,
    grades: session.grades,
    objective: session.objective || { answered: 0, correct: 0 },
    completedAt: new Date().toISOString(),
  };
  state.completedSessions.push(summary);
  state.completedSessions = state.completedSessions.slice(-50);
  state.lastSummary = summary;
  state.activeSession = null;
  saveState();
  view.name = "summary";
  view.summary = summary;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
};

renderSummary = function renderSummaryEnhanced() {
  const summary = view.summary || state.lastSummary || state.completedSessions.at(-1);
  if (!summary) return goHome();
  const objective = summary.objective?.answered ? `<div class="summary-objective"><strong>${summary.objective.correct}/${summary.objective.answered}</strong><span>객관식 정답</span></div>` : "";
  app.innerHTML = `
    <main class="shell summary-shell">${renderTopbar("학습 완료")}
      <section class="summary-card"><small>${esc(summary.label)}</small><h1>${summary.total}개 학습 완료</h1>
        <div class="summary-grid"><div><strong>${summary.grades.good}</strong><span>확실</span></div><div><strong>${summary.grades.hard}</strong><span>애매</span></div><div><strong>${summary.grades.again}</strong><span>재학습</span></div></div>
        ${objective}
        <div class="summary-actions"><button class="button primary" data-action="weak">취약 항목 다시 보기</button><button class="button ghost" data-action="home">홈으로</button></div>
      </section>
    </main>
  `;
};

gradeCurrent = function gradeCurrentEnhanced(grade) {
  const session = state.activeSession;
  if (!session) return;
  const currentItem = ITEM_MAP.get(session.ids[session.index]);
  if (!currentItem) return;
  session.draft ||= {};
  session.objective ||= { answered: 0, correct: 0 };
  const variant = enhVariant(currentItem, session);
  if (variant === "recall" && !session.draft.revealed) return;
  if (variant !== "recall" && !session.draft.submitted) return;
  const objectiveCorrect = variant === "recall" ? null : Boolean(session.draft.objectiveCorrect);
  if (objectiveCorrect === false) grade = "again";
  enhRecordReview(currentItem.id, grade, objectiveCorrect, variant);
  session.grades[grade] += 1;
  session.index += 1;
  session.draft = {};
  if (session.index >= session.ids.length) return completeSession();
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
};

app.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.enhAction === "test") return enhStartTest();
  if (target.dataset.enhAction === "due") return enhStartDue();
  if (target.dataset.enhAction === "recall") return enhStartRecall();
  if (target.dataset.enhAction === "reveal") {
    state.activeSession.draft ||= {};
    state.activeSession.draft.revealed = true;
    saveState();
    return render();
  }
  if (target.dataset.enhChoice !== undefined) {
    const session = state.activeSession;
    if (!session || session.draft?.submitted) return;
    session.draft ||= {};
    session.draft.selected = Number(target.dataset.enhChoice);
    saveState();
    return render();
  }
  if (target.dataset.enhAction === "submit-choice") {
    const session = state.activeSession;
    if (!session) return;
    const currentItem = ITEM_MAP.get(session.ids[session.index]);
    const variant = enhVariant(currentItem, session);
    const model = enhChoiceModel(currentItem, variant, session);
    session.draft ||= {};
    if (!Number.isInteger(session.draft.selected)) return showToast("보기를 하나 선택해 주세요.");
    session.draft.submitted = true;
    session.draft.objectiveCorrect = model.options[session.draft.selected] === model.correct;
    session.objective ||= { answered: 0, correct: 0 };
    session.objective.answered += 1;
    if (session.draft.objectiveCorrect) session.objective.correct += 1;
    saveState();
    return render();
  }
});

render();
