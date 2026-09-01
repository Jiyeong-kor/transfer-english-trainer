"use strict";

// 편입영어 실전형 학습 모드
// 모든 학습 세션을 선택지 기반으로 통일하고, 선택 즉시 객관식으로 채점합니다.

function examVariant(item, session) {
  if (item.type === "grammar") return "grammar-choice";

  const value = enhHash(`${session.id}:${session.index}:${item.id}:exam`);
  if (item.confusions?.length && value % 3 === 0) return "meaning-choice";
  if (item.synonyms?.length && value % 2 === 0) return "synonym-choice";
  return "meaning-choice";
}

enhVariant = examVariant;

function examVariantLabel(variant) {
  if (variant === "synonym-choice") return "유의어 4지선다";
  if (variant === "meaning-choice") return "뜻 4지선다";
  return "문법 4지선다";
}

function examResultDetails(item) {
  return enhDetails(item);
}

function examRecordChoice(session, item, variant, model, selectedIndex) {
  session.draft ||= {};
  if (session.draft.submitted) return;

  const objectiveCorrect = model.options[selectedIndex] === model.correct;
  const grade = objectiveCorrect ? "good" : "again";

  session.draft.selected = selectedIndex;
  session.draft.submitted = true;
  session.draft.objectiveCorrect = objectiveCorrect;
  session.draft.reviewRecorded = true;

  session.objective ||= { answered: 0, correct: 0 };
  session.objective.answered += 1;
  if (objectiveCorrect) session.objective.correct += 1;

  enhRecordReview(item.id, grade, objectiveCorrect, variant);
  session.grades[grade] += 1;
  saveState();
}

function examAdvance() {
  const session = state.activeSession;
  if (!session?.draft?.submitted) return;

  session.index += 1;
  session.draft = {};

  if (session.index >= session.ids.length) {
    completeSession();
    return;
  }

  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

renderHome = function renderHomeExam() {
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
      ${renderTopbar("편입영어 실전형 4지선다")}
      <section class="hero">
        <small>오늘의 우선순위</small>
        <h1>선지를 보고 바로 고르기</h1>
        <p>오늘의 12문제는 보기 없는 회상을 사용하지 않습니다. 어휘는 뜻과 유의어 4지선다로, 문법은 시험형 4지선다로 출제합니다. 틀린 문제는 자동으로 취약 항목에 누적합니다.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="${state.activeSession ? "resume" : "daily"}">${state.activeSession ? "이어서 풀기" : "오늘 12문제 시작"}</button>
          <button class="button secondary" data-enh-action="test">20문제 실전 세트</button>
        </div>
      </section>

      <section class="stats stats-five" aria-label="학습 현황">
        <div class="stat"><strong>${stats.studied}</strong><span>학습</span></div>
        <div class="stat"><strong>${stats.weak}</strong><span>취약</span></div>
        <div class="stat"><strong>${stats.due}</strong><span>복습 예정</span></div>
        <div class="stat"><strong>${stats.mastered}</strong><span>안정</span></div>
        <div class="stat"><strong>${stats.accuracy === null ? "-" : `${stats.accuracy}%`}</strong><span>정답률</span></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>오늘의 학습</h2><span>${dailyDone}/${daily.ids.length} 완료</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${daily.ids.length ? Math.round((dailyDone / daily.ids.length) * 100) : 0}%"></div></div>
        ${stats.due ? `<button class="inline-link" data-enh-action="due">복습 예정 ${stats.due}문제 바로 풀기</button>` : ""}
      </section>

      <section class="section">
        <div class="section-head"><h2>학습 모드</h2><span>총 ${ITEMS.length}개</span></div>
        <div class="grid">
          <button class="action-card" data-action="weak">
            <strong>오답·혼동 집중</strong>
            <span>틀린 문제와 아직 구분이 불안정한 항목만 다시 4지선다로 풉니다.</span>
            <em>${stats.weak}개</em>
          </button>
          <button class="action-card" data-action="category" data-type="vocab">
            <strong>어휘 실전 ${VOCAB.length}개</strong>
            <span>단어를 보고 뜻 또는 가장 가까운 영어 표현을 선지에서 고릅니다.</span>
            <em>뜻·유의어 4지선다</em>
          </button>
          <button class="action-card" data-action="category" data-type="grammar">
            <strong>문법 실전 ${GRAMMAR.length}개</strong>
            <span>문법 패턴과 올바른 문장을 실제 선택 문제처럼 구분합니다.</span>
            <em>문법 4지선다</em>
          </button>
          <button class="action-card" data-action="browse">
            <strong>전체 자료 보기</strong>
            <span>Notion에서 옮긴 어휘와 문법 자료, 현재 취약 상태를 확인합니다.</span>
            <em>${pct}% 한 번 이상 풀이</em>
          </button>
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

renderStudy = function renderStudyExam() {
  const session = state.activeSession;
  if (!session) return goHome();

  const currentItem = ITEM_MAP.get(session.ids[session.index]);
  if (!currentItem) return goHome();

  session.draft ||= {};
  session.objective ||= { answered: 0, correct: 0 };

  const variant = examVariant(currentItem, session);
  const model = enhChoiceModel(currentItem, variant, session);
  const current = session.index + 1;
  const percent = Math.round((session.index / session.ids.length) * 100);
  const review = reviewFor(currentItem.id);
  const submitted = Boolean(session.draft.submitted);
  const selected = session.draft.selected;
  const objectiveCorrect = submitted ? Boolean(session.draft.objectiveCorrect) : null;

  const options = model.options.map((option, index) => {
    const classes = ["choice-option"];
    if (selected === index) classes.push("selected");
    if (submitted && option === model.correct) classes.push("correct");
    if (submitted && selected === index && option !== model.correct) classes.push("wrong");

    return `<button class="${classes.join(" ")}" data-exam-choice="${index}" ${submitted ? "disabled" : ""}><span>${index + 1}</span>${esc(option)}</button>`;
  }).join("");

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
          <span class="badge">${currentItem.type === "vocab" ? "어휘" : "문법"}</span>
          <span class="badge mode-badge">${esc(examVariantLabel(variant))}</span>
          ${currentItem.focus && !enhMastered(currentItem.id) ? `<span class="badge warn">집중 복습</span>` : ""}
          ${review ? `<span class="badge">${review.lastObjectiveCorrect === false ? "최근 오답" : review.lastObjectiveCorrect === true ? "최근 정답" : esc(gradeLabel(review.lastGrade))}</span>` : ""}
        </div>

        <div class="prompt">
          <div class="term">${esc(currentItem.type === "vocab" ? currentItem.term : currentItem.title)}</div>
          <div class="question">${esc(model.question)}</div>
        </div>

        <div class="choice-list">${options}</div>

        ${submitted ? `
          <div class="answer-panel result-panel ${objectiveCorrect ? "result-correct" : "result-wrong"}">
            <h3>${objectiveCorrect ? "정답" : "오답"}</h3>
            <div class="answer-main">${esc(model.correct)}</div>
            ${examResultDetails(currentItem)}
            <div class="source">출처: ${esc(currentItem.source || "Notion 편입 영어 오답노트")}</div>
          </div>
          <button class="button brand" data-exam-next>${current === session.ids.length ? "결과 보기" : "다음 문제"}</button>
        ` : ""}
      </section>
    </main>
  `;
};

renderSummary = function renderSummaryExam() {
  const summary = view.summary || state.lastSummary || state.completedSessions.at(-1);
  if (!summary) return goHome();

  const answered = summary.objective?.answered || 0;
  const correct = summary.objective?.correct || 0;
  const wrong = Math.max(0, answered - correct);
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

  app.innerHTML = `
    <main class="shell summary-shell">
      ${renderTopbar("학습 완료")}
      <section class="summary-card">
        <small>${esc(summary.label)}</small>
        <h1>${answered}문제 풀이 완료</h1>
        <div class="summary-grid">
          <div><strong>${correct}</strong><span>정답</span></div>
          <div><strong>${wrong}</strong><span>오답</span></div>
          <div><strong>${accuracy}%</strong><span>정답률</span></div>
        </div>
        <div class="summary-actions">
          <button class="button primary" data-action="weak">오답 다시 풀기</button>
          <button class="button ghost" data-action="home">홈으로</button>
        </div>
      </section>
    </main>
  `;
};

app.addEventListener("click", (event) => {
  const choiceButton = event.target.closest("[data-exam-choice]");
  if (choiceButton) {
    const session = state.activeSession;
    if (!session || session.draft?.submitted) return;

    const item = ITEM_MAP.get(session.ids[session.index]);
    if (!item) return;

    const variant = examVariant(item, session);
    const model = enhChoiceModel(item, variant, session);
    const selectedIndex = Number(choiceButton.dataset.examChoice);
    if (!Number.isInteger(selectedIndex) || !model.options[selectedIndex]) return;

    examRecordChoice(session, item, variant, model, selectedIndex);
    render();
    return;
  }

  const nextButton = event.target.closest("[data-exam-next]");
  if (nextButton) examAdvance();
});

render();
