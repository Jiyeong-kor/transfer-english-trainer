"use strict";

(() => {
  const COMPLETE_SENTENCE_PREFIX = "Choose the option that best completes the sentence:";
  const STYLE_ID = "grammar-question-hierarchy";

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .grammar-prompt {
        margin-top: 24px;
        text-align: left;
      }

      .grammar-prompt .term {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .grammar-prompt .question {
        max-width: none;
        margin: 10px 0 0;
        color: var(--text);
        text-align: left;
      }

      .grammar-instruction {
        display: block;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
        font-weight: 600;
      }

      .grammar-sentence,
      .grammar-question-only {
        display: block;
        color: var(--text);
        font-size: clamp(20px, 5.2vw, 26px);
        line-height: 1.45;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .grammar-sentence {
        margin-top: 8px;
      }
    `;
    document.head.append(style);
  }

  function applyGrammarHierarchy() {
    const session = state.activeSession;
    if (!session) return;
    const item = ITEM_MAP.get(session.ids[session.index]);
    if (item?.type !== "grammar") return;

    const prompt = app.querySelector(".prompt");
    const term = prompt?.querySelector(".term");
    const question = prompt?.querySelector(".question");
    if (!prompt || !term || !question) return;

    prompt.classList.add("grammar-prompt");
    term.textContent = "GRAMMAR";

    const text = question.textContent.trim();
    if (text.startsWith(COMPLETE_SENTENCE_PREFIX)) {
      const sentenceText = text.slice(COMPLETE_SENTENCE_PREFIX.length).trim();
      question.textContent = "";

      const instruction = document.createElement("span");
      instruction.className = "grammar-instruction";
      instruction.textContent = COMPLETE_SENTENCE_PREFIX;

      const sentence = document.createElement("span");
      sentence.className = "grammar-sentence";
      sentence.textContent = sentenceText;

      question.append(instruction, sentence);
      return;
    }

    question.classList.add("grammar-question-only");
  }

  installStyles();

  const baseRenderStudy = renderStudy;
  renderStudy = function renderStudyWithGrammarHierarchy() {
    baseRenderStudy();
    applyGrammarHierarchy();
  };

  render();
})();
