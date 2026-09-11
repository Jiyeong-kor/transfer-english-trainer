"use strict";

(() => {
  const CURRENT_GRAMMAR_WRONG_IDS = Object.freeze([
    "g-occur-intransitive",
    "g-join-transitive",
    "g-visit-transitive",
    "g-participate-in",
    "g-get-object-to",
    "g-lie-recline",
    "g-denounce-as",
    "g-remain-adjective",
    "g-one-vs-it",
    "g-have-object-past-participle",
    "g-happen-intransitive",
    "g-tend-to",
    "g-rid-of",
    "g-rise-raise",
    "g-outlive-transitive",
    "g-comparison-parallel",
    "g-discuss-transitive",
    "g-finish-gerund",
    "g-risk-gerund",
    "g-linking-verb-adjective",
    "g-affect-effect",
    "g-anticipate-gerund",
    "g-inhabit-transitive",
    "g-formal-object-it",
    "g-appreciate-possessive-gerund",
    "g-prevent-from",
    "g-request-that"
  ]);

  function currentWrongIds() {
    return CURRENT_GRAMMAR_WRONG_IDS.filter((id) => ITEM_MAP.has(id));
  }

  function startCurrentGrammarWrongReview() {
    if (state.activeSession) {
      showToast("진행 중인 학습을 먼저 이어서 하거나 저장하고 나가 주세요.");
      return;
    }

    const ids = currentWrongIds();
    if (!ids.length) {
      showToast("이번 문법 오답 항목을 찾지 못했습니다.");
      return;
    }

    startSession(ids, "2026-09-11 문법 오답", "weak");
  }

  function injectCurrentGrammarWrongCard() {
    if (app.querySelector('[data-current-review="grammar-wrong"]')) return;

    const sections = [...app.querySelectorAll(".section")];
    const learningSection = sections.find((section) => section.querySelector("h2")?.textContent.trim() === "학습 모드");
    const grid = learningSection?.querySelector(".grid");
    if (!grid) return;

    const count = currentWrongIds().length;
    const button = document.createElement("button");
    button.className = "action-card current-wrong-card";
    button.dataset.currentReview = "grammar-wrong";
    button.innerHTML = `
      <strong>이번 문법 오답만</strong>
      <span>방금 정리한 TEST 01~03 오답 개념만 풉니다. 같은 개념을 여러 번 틀린 문항은 한 개념으로 묶었습니다.</span>
      <em>${count}개 개념</em>
    `;
    grid.prepend(button);
  }

  const baseRenderHome = renderHome;
  renderHome = function renderHomeWithCurrentGrammarReview() {
    baseRenderHome();
    injectCurrentGrammarWrongCard();
  };

  app.addEventListener("click", (event) => {
    const button = event.target.closest('[data-current-review="grammar-wrong"]');
    if (!button) return;
    event.stopImmediatePropagation();
    startCurrentGrammarWrongReview();
  }, true);

  window.CURRENT_GRAMMAR_REVIEW = Object.freeze({
    ids: () => [...currentWrongIds()],
    start: startCurrentGrammarWrongReview,
  });

  render();
})();
