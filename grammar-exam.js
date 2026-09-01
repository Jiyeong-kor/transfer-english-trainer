"use strict";

(() => {
  const GRAMMAR_EXAM_CASES = Object.freeze({
    "g-provide-with": [
      {
        question: "Choose the option that best completes the sentence: The scholarship program provides selected students ___ financial support throughout the semester.",
        correct: "with",
        options: ["with", "for", "to", "of"],
      },
      {
        question: "Choose the option that best completes the sentence: The museum provides visitors ___ free audio guides at the entrance.",
        correct: "with",
        options: ["with", "to", "for", "by"],
      },
    ],
    "g-view-as": [
      {
        question: "Choose the option that best completes the sentence: Many residents viewed the new regulation ___ an unnecessary restriction on small businesses.",
        correct: "as",
        options: ["as", "for", "to", "with"],
      },
      {
        question: "Choose the option that best completes the sentence: The committee viewed the sudden decline ___ evidence that the policy needed revision.",
        correct: "as",
        options: ["as", "at", "for", "from"],
      },
    ],
    "g-allow-object-to": [
      {
        question: "Choose the option that best completes the sentence: The new policy allows applicants ___ their choices before the deadline.",
        correct: "to revise",
        options: ["to revise", "revising", "revise", "revised"],
      },
      {
        question: "Choose the option that best completes the sentence: The software allows users ___ multiple files at the same time.",
        correct: "to upload",
        options: ["to upload", "uploading", "upload", "uploaded"],
      },
    ],
    "g-recommend-that": [
      {
        question: "Choose the option that best completes the sentence: The committee recommended that each proposal ___ by two independent reviewers.",
        correct: "be examined",
        options: ["be examined", "is examined", "examined", "to be examined"],
      },
      {
        question: "Choose the option that best completes the sentence: The doctor recommended that he ___ a week off before returning to work.",
        correct: "take",
        options: ["take", "takes", "took", "to take"],
      },
    ],
    "g-awaken-to": [
      {
        question: "Choose the option that best completes the sentence: The documentary awakened the public ___ the seriousness of the housing crisis.",
        correct: "to",
        options: ["to", "of", "for", "with"],
      },
      {
        question: "Choose the option that best completes the sentence: The experience awakened her ___ the importance of careful preparation.",
        correct: "to",
        options: ["to", "about", "for", "at"],
      },
    ],
    "g-occur-intransitive": [
      {
        question: "Choose the grammatically correct sentence.",
        correct: "Several minor earthquakes occurred near the coast last night.",
        options: [
          "Several minor earthquakes occurred near the coast last night.",
          "Several minor earthquakes were occurred near the coast last night.",
          "Several minor earthquakes occurred the coastal region last night.",
          "Several minor earthquakes were occurring by a sudden pressure change last night.",
        ],
      },
      {
        question: "Choose the grammatically correct sentence.",
        correct: "A serious error occurred during the data migration.",
        options: [
          "A serious error occurred during the data migration.",
          "A serious error was occurred during the data migration.",
          "The data migration occurred a serious error.",
          "A serious error was occurred by an incorrect setting.",
        ],
      },
    ],
    "g-join-transitive": [
      {
        question: "Choose the option that best completes the sentence: After graduation, Mina decided to ___ the research team at the university.",
        correct: "join",
        options: ["join", "join to", "join in", "join at"],
      },
      {
        question: "Choose the option that best completes the sentence: At the age of nineteen, he chose to ___ the Army.",
        correct: "join",
        options: ["join", "join to", "join in", "join with"],
      },
    ],
    "g-lie-recline": [
      {
        question: "Choose the option that best completes the sentence: After the long meeting, he ___ down on the sofa and fell asleep.",
        correct: "lay",
        options: ["lay", "laid", "lied", "lain"],
      },
      {
        question: "Choose the option that best completes the sentence: She has ___ in bed since early this morning.",
        correct: "lain",
        options: ["lain", "laid", "lied", "lay"],
      },
    ],
    "g-lie-lied": [
      {
        question: "Choose the option that best completes the sentence: The witness admitted that he had ___ about where he had been that night.",
        correct: "lied",
        options: ["lied", "lain", "laid", "lay"],
      },
      {
        question: "Choose the option that best completes the sentence: The suspect ___ to the investigators during the first interview.",
        correct: "lied",
        options: ["lied", "lay", "laid", "lain"],
      },
    ],
    "g-lay-laid": [
      {
        question: "Choose the option that best completes the sentence: She carefully ___ the documents on my desk before leaving the office.",
        correct: "laid",
        options: ["laid", "lay", "lain", "lied"],
      },
      {
        question: "Choose the option that best completes the sentence: The workers have ___ the foundation for the new building.",
        correct: "laid",
        options: ["laid", "lain", "lay", "lied"],
      },
    ],
    "g-visit-transitive": [
      {
        question: "Choose the option that best completes the sentence: During the trip, we plan to ___ several historic sites in the old city.",
        correct: "visit",
        options: ["visit", "visit to", "visit at", "visit for"],
      },
      {
        question: "Choose the option that best completes the sentence: Thousands of tourists ___ the palace every year.",
        correct: "visit",
        options: ["visit", "visit to", "visit at", "visit for"],
      },
    ],
    "g-participate-in": [
      {
        question: "Choose the option that best completes the sentence: All new employees are expected to participate ___ the safety workshop.",
        correct: "in",
        options: ["in", "at", "to", "with"],
      },
      {
        question: "Choose the option that best completes the sentence: More than two hundred students participated ___ the annual debate competition.",
        correct: "in",
        options: ["in", "on", "to", "for"],
      },
    ],
    "g-get-object-to": [
      {
        question: "Choose the option that best completes the sentence: The manager got the technician ___ the system before the meeting began.",
        correct: "to restart",
        options: ["to restart", "restart", "restarting", "restarted"],
      },
      {
        question: "Choose the option that best completes the sentence: She finally got her brother ___ her move the heavy boxes.",
        correct: "to help",
        options: ["to help", "help", "helping", "helped"],
      },
    ],
    "g-allow-ing": [
      {
        question: "Choose the option that best completes the sentence: The library does not allow ___ in the main reading room.",
        correct: "eating",
        options: ["eating", "to eat", "eat", "eaten"],
      },
      {
        question: "Choose the option that best completes the sentence: The gallery does not allow ___ inside the exhibition hall.",
        correct: "taking photographs",
        options: ["taking photographs", "to take photographs", "take photographs", "taken photographs"],
      },
    ],
    "g-present-perfect-result": [
      {
        question: "Choose the option that best completes the sentence: So far, the research team ___ three major errors in the dataset.",
        correct: "has identified",
        options: ["has identified", "identified", "had identified", "will identify"],
      },
      {
        question: "Choose the option that best completes the sentence: Since the new system was introduced, the company ___ several internal procedures.",
        correct: "has changed",
        options: ["has changed", "changed", "had changed", "changes"],
      },
    ],
  });

  const baseEnhChoiceModel = enhChoiceModel;
  enhChoiceModel = function enhChoiceModelTransferGrammar(item, variant, session) {
    if (item?.type !== "grammar" || variant !== "grammar-choice") {
      return baseEnhChoiceModel(item, variant, session);
    }

    const cases = GRAMMAR_EXAM_CASES[item.id];
    if (!cases?.length) return baseEnhChoiceModel(item, variant, session);

    const seed = `${session.id}:${session.index}:${item.id}:transfer-grammar`;
    const selected = cases[enhHash(seed) % cases.length];
    return {
      question: selected.question,
      correct: selected.correct,
      options: enhShuffle([...selected.options], `${seed}:options`),
    };
  };

  const baseRenderStudy = renderStudy;
  renderStudy = function renderStudyTransferGrammar() {
    baseRenderStudy();

    const session = state.activeSession;
    if (!session) return;
    const item = ITEM_MAP.get(session.ids[session.index]);
    if (item?.type !== "grammar") return;

    const term = app.querySelector(".prompt .term");
    if (term) term.textContent = "GRAMMAR";

    const modeBadge = app.querySelector(".mode-badge");
    if (modeBadge) modeBadge.textContent = "편입 실전 문법";
  };

  window.GRAMMAR_EXAM = Object.freeze({
    cases: GRAMMAR_EXAM_CASES,
  });
})();
