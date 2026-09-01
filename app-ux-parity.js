"use strict";

function uxAdvanceRecordedCurrent() {
  const session = state.activeSession;
  if (!session || !session.draft?.reviewRecorded) return;

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

function uxRecordUnknownCurrent() {
  const session = state.activeSession;
  if (!session || session.draft?.submitted || session.draft?.reviewRecorded) return;

  const item = ITEM_MAP.get(session.ids[session.index]);
  if (!item) return;

  session.draft ||= {};
  session.objective ||= { answered: 0, correct: 0, unknown: 0 };
  const variant = enhVariant(item, session);

  if (variant === "recall") {
    session.draft.revealed = true;
  } else {
    session.draft.submitted = true;
    session.draft.objectiveCorrect = null;
    session.draft.objectiveUnknown = true;
    session.objective.answered += 1;
    session.objective.unknown = (session.objective.unknown || 0) + 1;
  }

  enhRecordReview(item.id, "again", null, variant);
  const review = state.reviews[item.id];
  if (review) {
    review.lastObjectiveUnknown = true;
    const latest = review.history?.at(-1);
    if (latest) latest.objectiveUnknown = true;
  }

  session.grades.again += 1;
  session.draft.reviewRecorded = true;
  session.draft.unknown = true;
  saveState();
  render();
}

function uxSubmitChoiceImmediately(index) {
  const session = state.activeSession;
  if (!session || session.draft?.submitted || session.draft?.reviewRecorded) return;

  const item = ITEM_MAP.get(session.ids[session.index]);
  if (!item) return;

  const variant = enhVariant(item, session);
  if (variant === "recall") return;

  const model = enhChoiceModel(item, variant, session);
  session.draft ||= {};
  session.draft.selected = index;
  session.draft.submitted = true;
  session.draft.objectiveUnknown = false;
  session.draft.objectiveCorrect = model.options[index] === model.correct;
  session.objective ||= { answered: 0, correct: 0, unknown: 0 };
  session.objective.answered += 1;
  if (session.draft.objectiveCorrect) session.objective.correct += 1;

  saveState();
  render();
}

renderStudy = function renderStudyInstantGrading() {
  const session = state.activeSession;
  if (!session) return goHome();
  const id = session.ids[session.index];
  const currentItem = ITEM_MAP.get(id);
  if (!currentItem) return goHome();

  session.draft ||= {};
  session.objective ||= { answered: 0, correct: 0, unknown: 0 };

  const variant = enhVariant(currentItem, session);
  const current = session.index + 1;
  const percent = Math.round((session.index / session.ids.length) * 100);
  const review = reviewFor(currentItem.id);
  const variantLabel = variant === "recall"
    ? "회상"
    : variant === "synonym-choice"
      ? "유의어 변별"
      : variant === "meaning-choice"
        ? "혼동어 구분"
        : "시험형 선택";
  let body = "";

  if (variant === "recall") {
    const revealed = Boolean(session.draft.revealed);
    const unknown = Boolean(session.draft.unknown);
    body = `
      <div class="prompt">
        <div class="term">${esc(currentItem.type === "vocab" ? currentItem.term : currentItem.title)}</div>
        <div class="question">${esc(currentItem.prompt)}</div>
      </div>
      <div class="reveal-wrap">
        ${revealed ? `
          ${unknown ? `<div class="result-banner result-unknown">모르겠음으로 기록했습니다.</div>` : ""}
          <div class="answer-panel">
            <h3>정답</h3>
            <div class="answer-main">${esc(currentItem.answer)}</div>
            ${enhDetails(currentItem)}
            <div class="source">출처: ${esc(currentItem.source)}</div>
          </div>
          ${unknown
            ? `<button class="button brand full-action" data-ux-action="next-recorded">${current >= session.ids.length ? "결과 보기" : "다음 문제"}</button>`
            : enhGradeButtons(null)}
        ` : `
          <div class="pre-answer-actions">
            <button class="button secondary" data-ux-action="unknown">모르겠음</button>
            <button class="button brand" data-enh-action="reveal">정답 보기</button>
          </div>
        `}
      </div>
    `;
  } else {
    const model = enhChoiceModel(currentItem, variant, session);
    const submitted = Boolean(session.draft.submitted);
    const selected = session.draft.selected;
    const unknown = Boolean(session.draft.unknown || session.draft.objectiveUnknown);
    const objectiveCorrect = submitted && !unknown ? Boolean(session.draft.objectiveCorrect) : null;

    const options = model.options.map((option, index) => {
      const classes = ["choice-option"];
      if (selected === index) classes.push("selected");
      if (submitted && option === model.correct) classes.push("correct");
      if (submitted && selected === index && option !== model.correct) classes.push("wrong");
      return `<button class="${classes.join(" ")}" data-enh-choice="${index}" ${submitted ? "disabled" : ""}><span>${index + 1}</span>${esc(option)}</button>`;
    }).join("");

    body = `
      <div class="prompt">
        <div class="term">${esc(currentItem.type === "vocab" ? currentItem.term : currentItem.title)}</div>
        <div class="question">${esc(model.question)}</div>
      </div>
      <div class="choice-list">${options}</div>
      ${submitted ? `
        <div class="answer-panel result-panel ${unknown ? "result-unknown" : objectiveCorrect ? "result-correct" : "result-wrong"}">
          <h3>${unknown ? "모르겠음" : objectiveCorrect ? "정답" : "오답"}</h3>
          <div class="answer-main">${esc(model.correct)}</div>
          ${enhDetails(currentItem)}
          <div class="source">출처: ${esc(currentItem.source)}</div>
        </div>
        ${unknown
          ? `<button class="button brand full-action" data-ux-action="next-recorded">${current >= session.ids.length ? "결과 보기" : "다음 문제"}</button>`
          : enhGradeButtons(objectiveCorrect)}
      ` : `
        <button class="button secondary full-action" data-ux-action="unknown">모르겠음</button>
      `}
    `;
  }

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
          <span class="badge mode-badge">${esc(variantLabel)}</span>
          ${currentItem.focus && !enhMastered(currentItem.id) ? `<span class="badge warn">집중 복습</span>` : ""}
          ${review ? `<span class="badge">${esc(gradeLabel(review.lastGrade))} 기록</span>` : ""}
        </div>
        ${body}
      </section>
    </main>
  `;
};

const originalRenderSummaryForUnknown = renderSummary;
renderSummary = function renderSummaryWithUnknownCount() {
  originalRenderSummaryForUnknown();
  const summary = view.summary || state.lastSummary || state.completedSessions.at(-1);
  if (!summary?.objective?.unknown) return;
  const objective = app.querySelector(".summary-objective");
  if (!objective) return;
  const note = document.createElement("span");
  note.className = "summary-unknown";
  note.textContent = `모르겠음 ${summary.objective.unknown}개`;
  objective.appendChild(note);
};

app.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-enh-choice]");
  if (choice && !choice.disabled) {
    event.preventDefault();
    event.stopImmediatePropagation();
    uxSubmitChoiceImmediately(Number(choice.dataset.enhChoice));
    return;
  }

  const action = event.target.closest("[data-ux-action]")?.dataset.uxAction;
  if (!action) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (action === "unknown") uxRecordUnknownCurrent();
  else if (action === "next-recorded") uxAdvanceRecordedCurrent();
}, true);

render();
