"use strict";

(() => {
  function reviewHistory(id) {
    return reviewFor(id)?.history || [];
  }

  function hasCorrectVariant(id, variant) {
    return reviewHistory(id).some((entry) => entry.variant === variant && entry.objectiveCorrect === true);
  }

  function unresolvedConfusion(item) {
    return Boolean(item?.confusions?.length) && !hasCorrectVariant(item.id, "meaning-choice");
  }

  const baseEnhMastered = enhMastered;
  enhMastered = function enhMasteredByLatestProgress(id) {
    const item = ITEM_MAP.get(id);
    if (!baseEnhMastered(id)) return false;
    if (unresolvedConfusion(item)) return false;
    return true;
  };

  const basePriorityScore = priorityScore;
  priorityScore = function priorityScoreByLatestProgress(item, dayKey) {
    const review = reviewFor(item.id);
    let score = basePriorityScore(item, dayKey);

    if (!review) return score + 120;
    if (review.lastGrade === "again") score += 160;
    else if (review.lastGrade === "hard") score += 90;

    if (unresolvedConfusion(item)) score += 130;
    if (enhMastered(item.id) && !dueNow(item.id)) score -= 240;

    return score;
  };

  const baseExamVariant = examVariant;
  examVariant = function examVariantByLatestProgress(item, session) {
    if (item.type === "vocab" && unresolvedConfusion(item)) return "meaning-choice";
    return baseExamVariant(item, session);
  };
  enhVariant = examVariant;

  function hasIncompleteLearningTarget(item) {
    if (item?.type === "vocab" && window.VOCAB_EXAM?.hasUncoveredTargets) {
      return window.VOCAB_EXAM.hasUncoveredTargets(item);
    }
    return (reviewFor(item.id)?.seenCount || 0) === 0;
  }

  function unseenItems() {
    return ITEMS.filter((item) => hasIncompleteLearningTarget(item));
  }

  function remainingLearningTargetCount() {
    const vocabTargets = window.VOCAB_EXAM?.remainingTargetCount?.() || 0;
    const grammarTargets = GRAMMAR.filter((item) => (reviewFor(item.id)?.seenCount || 0) === 0).length;
    return vocabTargets + grammarTargets;
  }

  function orderedUnseenIds() {
    const day = seoulDateKey();
    return unseenItems()
      .map((item) => ({
        item,
        score: initialPriority(item) + priorityScore(item, day) + (enhHash(`${day}:${item.id}:unseen`) % 1000) / 1000,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item.id);
  }

  function startUnseenSession() {
    const ids = orderedUnseenIds();
    if (!ids.length) {
      showToast("아직 확인하지 않은 뜻·유의어·문법 학습 목표가 없습니다.");
      return;
    }
    startSession(ids, "미완료 학습 목표 계속 풀기", "new");
  }

  function unresolvedConfusionCount() {
    return ITEMS.filter((item) => unresolvedConfusion(item)).length;
  }

  function injectUnseenControl() {
    if (app.querySelector('[data-new-action="unseen"]')) return;

    const sections = [...app.querySelectorAll(".section")];
    const learningSection = sections.find((section) => section.querySelector("h2")?.textContent.trim() === "학습 모드");
    const grid = learningSection?.querySelector(".grid");
    if (!grid) return;

    const count = unseenItems().length;
    const targetCount = remainingLearningTargetCount();
    const confusionCount = unresolvedConfusionCount();
    const button = document.createElement("button");
    button.className = "action-card";
    button.dataset.newAction = "unseen";
    button.innerHTML = count
      ? `<strong>미완료 학습 목표 계속 풀기</strong><span>단어 뜻과 등록된 유의어를 각각 확인합니다. 이미 한 번 본 단어라도 아직 맞히지 못한 유의어가 있으면 다시 나옵니다.</span><em>${count}개 항목 · ${targetCount}개 목표 남음${confusionCount ? ` · 혼동 변별 ${confusionCount}개` : ""}</em>`
      : `<strong>등록된 학습 목표 모두 확인 완료</strong><span>현재 등록된 단어 뜻, 개별 유의어와 문법 항목을 모두 한 번 이상 맞혔습니다.</span><em>미완료 0개${confusionCount ? ` · 혼동 변별 ${confusionCount}개 남음` : ""}</em>`;
    button.disabled = count === 0;
    grid.prepend(button);
  }

  const originalRenderHome = renderHome;
  renderHome = function renderHomeWithUnseenMode() {
    originalRenderHome();
    injectUnseenControl();
  };

  app.addEventListener("click", (event) => {
    const button = event.target.closest('[data-new-action="unseen"]');
    if (!button || button.disabled) return;
    startUnseenSession();
  });

  injectUnseenControl();

  window.NEW_PROBLEMS = Object.freeze({
    unseenCount: () => unseenItems().length,
    remainingLearningTargetCount,
    unresolvedConfusionCount,
    start: startUnseenSession,
  });
})();
