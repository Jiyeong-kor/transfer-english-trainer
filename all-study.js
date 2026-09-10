"use strict";

(() => {
  const ALL_STUDY_MODE = "all-targets";

  function targetVariantList(item) {
    if (item?.type === "vocab") {
      return [
        "meaning-choice",
        ...(item.synonyms || []).map((_, index) => `synonym-choice:${index}`),
      ];
    }
    return ["grammar-choice"];
  }

  function allLearningTargets() {
    const day = seoulDateKey();
    return ITEMS
      .flatMap((item) => targetVariantList(item).map((variant) => ({ id: item.id, variant })))
      .map((target) => ({
        ...target,
        score: priorityScore(ITEM_MAP.get(target.id), day)
          + (enhHash(`${day}:${target.id}:${target.variant}:all-targets`) % 1000) / 1000,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ id, variant }) => ({ id, variant }));
  }

  function totalLearningTargetCount() {
    return allLearningTargets().length;
  }

  function startAllLearningTargets() {
    const targets = allLearningTargets();
    if (!targets.length) {
      showToast("등록된 문제가 없습니다.");
      return;
    }

    state.activeSession = {
      id: `session-${Date.now()}`,
      label: "전체 문제 풀이",
      mode: ALL_STUDY_MODE,
      ids: targets.map((target) => target.id),
      targetVariants: targets.map((target) => target.variant),
      index: 0,
      grades: { again: 0, hard: 0, good: 0 },
      objective: { answered: 0, correct: 0, unknown: 0 },
      draft: {},
      startedAt: new Date().toISOString(),
    };

    saveState();
    view = { name: "study", filter: view.filter || "all", reveal: false };
    render();

    if (typeof examPositionQuestionAtReadingStart === "function") {
      examPositionQuestionAtReadingStart();
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  startDaily = startAllLearningTargets;

  const baseExamVariant = examVariant;
  examVariant = function examVariantAllTargets(item, session) {
    if (session?.mode === ALL_STUDY_MODE) {
      const forcedVariant = session.targetVariants?.[session.index];
      if (forcedVariant) {
        session.draft ||= {};
        session.draft.questionVariant = forcedVariant;
        return forcedVariant;
      }
    }
    return baseExamVariant(item, session);
  };
  enhVariant = examVariant;

  const baseRenderHome = renderHome;
  renderHome = function renderHomeAllTargets() {
    baseRenderHome();

    const total = totalLearningTargetCount();
    const active = state.activeSession;
    const activeTotal = active?.ids?.length || 0;
    const activeDone = active ? Math.min(active.index || 0, activeTotal) : 0;

    const hero = app.querySelector(".hero");
    const heroSmall = hero?.querySelector("small");
    const heroTitle = hero?.querySelector("h1");
    const heroText = hero?.querySelector("p");
    const heroPrimary = hero?.querySelector(".button.primary");

    if (heroSmall) heroSmall.textContent = "전체 범위 학습";
    if (heroTitle) heroTitle.textContent = "등록된 문제를 전부 끝까지 풀기";
    if (heroText) {
      heroText.textContent = "문제 풀이를 시작하면 어휘의 뜻과 등록된 유의어, 문법 문제를 모두 한 세션에 넣습니다. 중간에 나가도 현재 위치를 저장하고 이어서 풀 수 있습니다.";
    }
    if (heroPrimary) {
      heroPrimary.textContent = active ? "이어서 풀기" : `문제 풀이 시작 · ${total}문제`;
    }

    const learningSectionTitle = [...app.querySelectorAll(".section-head h2")]
      .find((heading) => heading.textContent.trim() === "오늘의 학습");
    const learningSection = learningSectionTitle?.closest(".section");
    if (learningSectionTitle && learningSection) {
      learningSectionTitle.textContent = active ? active.label : "전체 문제 풀이";
      const status = learningSection.querySelector(".section-head span");
      const progress = learningSection.querySelector(".progress-fill");
      if (status) {
        status.textContent = active
          ? `${activeDone}/${activeTotal} 진행 중`
          : `${total}문제 모두 출제`;
      }
      if (progress) {
        progress.style.width = activeTotal ? `${Math.round((activeDone / activeTotal) * 100)}%` : "0%";
      }
    }
  };

  window.ALL_STUDY = Object.freeze({
    mode: ALL_STUDY_MODE,
    totalTargetCount: totalLearningTargetCount,
    targets: () => allLearningTargets().map((target) => ({ ...target })),
    start: startAllLearningTargets,
  });

  render();
})();
