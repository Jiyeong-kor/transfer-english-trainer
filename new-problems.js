"use strict";

(() => {
  function unseenItems() {
    return ITEMS.filter((item) => (reviewFor(item.id)?.seenCount || 0) === 0);
  }

  function orderedUnseenIds() {
    const day = seoulDateKey();
    return unseenItems()
      .map((item) => ({
        item,
        score: initialPriority(item) + (enhHash(`${day}:${item.id}:unseen`) % 1000) / 1000,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item.id);
  }

  function startUnseenSession() {
    const ids = orderedUnseenIds();
    if (!ids.length) {
      showToast("아직 풀지 않은 새 문제가 없습니다.");
      return;
    }
    startSession(ids, "새 문제만 계속 풀기", "new");
  }

  function injectUnseenControl() {
    if (app.querySelector('[data-new-action="unseen"]')) return;

    const sections = [...app.querySelectorAll(".section")];
    const learningSection = sections.find((section) => section.querySelector("h2")?.textContent.trim() === "학습 모드");
    const grid = learningSection?.querySelector(".grid");
    if (!grid) return;

    const count = unseenItems().length;
    const button = document.createElement("button");
    button.className = "action-card";
    button.dataset.newAction = "unseen";
    button.innerHTML = count
      ? `<strong>새 문제만 계속 풀기</strong><span>한 번도 풀지 않은 문제만 골라서 중복 없이 계속 풉니다.</span><em>${count}개 미학습</em>`
      : `<strong>새 문제 모두 풀이 완료</strong><span>현재 등록된 문제는 모두 한 번 이상 풀었습니다.</span><em>미학습 0개</em>`;
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
    start: startUnseenSession,
  });
})();
