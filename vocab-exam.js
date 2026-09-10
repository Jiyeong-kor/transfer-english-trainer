"use strict";

(() => {
  const MEANING_VARIANT = "meaning-choice";
  const LEGACY_SYNONYM_VARIANT = "synonym-choice";

  function synonymVariant(index) {
    return `synonym-choice:${index}`;
  }

  function synonymIndexFromVariant(variant) {
    if (variant === LEGACY_SYNONYM_VARIANT) return 0;
    const match = /^synonym-choice:(\d+)$/.exec(String(variant || ""));
    return match ? Number(match[1]) : null;
  }

  function historyFor(item) {
    return reviewFor(item.id)?.history || [];
  }

  function storedCoverage(item) {
    const coverage = reviewFor(item.id)?.vocabCoverage;
    return {
      meaning: Boolean(coverage?.meaning),
      synonyms: coverage?.synonyms || {},
    };
  }

  function hasCorrectMeaning(item) {
    const coverage = storedCoverage(item);
    if (coverage.meaning) return true;
    return historyFor(item).some((entry) => entry.variant === MEANING_VARIANT && entry.objectiveCorrect === true);
  }

  function hasCorrectSynonym(item, index) {
    const coverage = storedCoverage(item);
    if (coverage.synonyms?.[String(index)] === true) return true;
    return historyFor(item).some((entry) => {
      if (entry.objectiveCorrect !== true) return false;
      return entry.variant === synonymVariant(index)
        || (index === 0 && entry.variant === LEGACY_SYNONYM_VARIANT);
    });
  }

  function missingVocabTargets(item) {
    if (item?.type !== "vocab") return [];
    const missing = [];
    if (!hasCorrectMeaning(item)) missing.push(MEANING_VARIANT);
    (item.synonyms || []).forEach((_, index) => {
      if (!hasCorrectSynonym(item, index)) missing.push(synonymVariant(index));
    });
    return missing;
  }

  function hasUncoveredTargets(item) {
    return missingVocabTargets(item).length > 0;
  }

  function remainingTargetCount() {
    return VOCAB.reduce((sum, item) => sum + missingVocabTargets(item).length, 0);
  }

  function totalTargetCount() {
    return VOCAB.reduce((sum, item) => sum + 1 + (item.synonyms?.length || 0), 0);
  }

  function vocabKind(item) {
    const senses = String(item?.answer || "")
      .split(/[,;]/)
      .map((sense) => sense.trim())
      .filter(Boolean);

    if (senses.some((sense) => /다$/.test(sense))) return "verb";
    if (senses.some((sense) => /(?:한|적인|의|없는|있는|로운|스러운|맞은|되는|난|쉰|른|은|는)$/.test(sense))) {
      return "adjective";
    }
    return "noun";
  }

  function normalizeLexeme(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function lexicalSet(item) {
    return new Set([item?.term, ...(item?.synonyms || [])].map(normalizeLexeme).filter(Boolean));
  }

  function meaningSenseSet(item) {
    return new Set(
      String(item?.answer || "")
        .split(/[,;]/)
        .map((sense) => sense.trim().replace(/^[~\s]+/, "").replace(/\s+/g, " "))
        .filter(Boolean),
    );
  }

  function setsOverlap(a, b) {
    for (const value of a) {
      if (b.has(value)) return true;
    }
    return false;
  }

  function vocabRelated(item, candidate) {
    if (!item || !candidate) return false;
    if (setsOverlap(lexicalSet(item), lexicalSet(candidate))) return true;
    return setsOverlap(meaningSenseSet(item), meaningSenseSet(candidate));
  }

  function synonymShape(value) {
    return /\s/.test(String(value || "").trim()) ? "phrase" : "word";
  }

  function shuffledCandidates(item, field, seed, correct) {
    const currentSynonyms = new Set((item.synonyms || []).map(normalizeLexeme));
    const candidates = VOCAB.filter((candidate) => candidate.id !== item.id && !vocabRelated(item, candidate));
    const sameKind = candidates.filter((candidate) => vocabKind(candidate) === vocabKind(item));
    const otherKind = candidates.filter((candidate) => vocabKind(candidate) !== vocabKind(item));
    const ordered = [...enhShuffle(sameKind, `${seed}:same-kind`), ...enhShuffle(otherKind, `${seed}:other-kind`)];

    let values = ordered.flatMap((candidate) => field === "meaning" ? [candidate.answer] : candidate.synonyms || []);
    values = enhUnique(values).filter((value) => {
      const normalized = normalizeLexeme(value);
      if (!normalized || normalized === normalizeLexeme(correct)) return false;
      if (field === "synonym" && currentSynonyms.has(normalized)) return false;
      return true;
    });

    if (field === "synonym") {
      const shape = synonymShape(correct);
      const sameShape = values.filter((value) => synonymShape(value) === shape);
      const otherShape = values.filter((value) => synonymShape(value) !== shape);
      values = [...enhShuffle(sameShape, `${seed}:same-shape`), ...enhShuffle(otherShape, `${seed}:other-shape`)];
    } else {
      values = enhShuffle(values, `${seed}:meaning-order`);
    }

    return values;
  }

  function meaningDistractors(item, seed) {
    const confusionMeanings = (item.confusions || [])
      .map((text) => String(text).split(":").slice(1).join(":").trim())
      .filter(Boolean);
    const candidates = shuffledCandidates(item, "meaning", seed, item.answer);
    return enhUnique([...confusionMeanings, ...candidates])
      .filter((value) => normalizeLexeme(value) !== normalizeLexeme(item.answer))
      .slice(0, 3);
  }

  function synonymDistractors(item, correct, seed) {
    return shuffledCandidates(item, "synonym", seed, correct).slice(0, 3);
  }

  const baseEnhChoiceModel = enhChoiceModel;
  enhChoiceModel = function enhChoiceModelCompleteVocab(item, variant, session) {
    if (item?.type !== "vocab") return baseEnhChoiceModel(item, variant, session);

    const seed = `${session.id}:${session.index}:${item.id}:${variant}:vocab-quality`;

    if (variant === MEANING_VARIANT) {
      const correct = item.answer;
      const distractors = meaningDistractors(item, seed);
      return {
        question: `다음 중 "${item.term}"의 뜻으로 가장 적절한 것을 고르세요.`,
        correct,
        options: enhShuffle([correct, ...distractors], `${seed}:options`),
      };
    }

    const synonymIndex = synonymIndexFromVariant(variant);
    if (synonymIndex !== null && item.synonyms?.length) {
      const safeIndex = Math.min(synonymIndex, item.synonyms.length - 1);
      const correct = item.synonyms[safeIndex];
      const distractors = synonymDistractors(item, correct, seed);
      return {
        question: `다음 중 "${item.term}"의 유의어로 가장 적절한 영어 표현을 고르세요.`,
        correct,
        options: enhShuffle([correct, ...distractors], `${seed}:options`),
      };
    }

    return baseEnhChoiceModel(item, variant, session);
  };

  const baseExamVariant = examVariant;
  examVariant = function examVariantCompleteVocab(item, session) {
    if (item?.type !== "vocab") return baseExamVariant(item, session);

    const missing = missingVocabTargets(item);
    if (missing.length) return missing[0];

    const reviewVariants = [MEANING_VARIANT, ...(item.synonyms || []).map((_, index) => synonymVariant(index))];
    const value = enhHash(`${session.id}:${session.index}:${item.id}:covered-vocab-review`);
    return reviewVariants[value % reviewVariants.length];
  };
  enhVariant = examVariant;

  const baseExamVariantLabel = examVariantLabel;
  examVariantLabel = function examVariantLabelCompleteVocab(variant) {
    if (String(variant).startsWith("synonym-choice")) return "유의어 4지선다";
    return baseExamVariantLabel(variant);
  };

  const baseEnhRecordReview = enhRecordReview;
  enhRecordReview = function enhRecordReviewWithVocabCoverage(itemId, grade, objectiveCorrect, variant) {
    baseEnhRecordReview(itemId, grade, objectiveCorrect, variant);
    if (objectiveCorrect !== true) return;

    const item = ITEM_MAP.get(itemId);
    const review = state.reviews[itemId];
    if (item?.type !== "vocab" || !review) return;

    const previous = review.vocabCoverage || { meaning: false, synonyms: {} };
    const coverage = {
      meaning: Boolean(previous.meaning),
      synonyms: { ...(previous.synonyms || {}) },
    };

    if (variant === MEANING_VARIANT) coverage.meaning = true;
    const synonymIndex = synonymIndexFromVariant(variant);
    if (synonymIndex !== null) coverage.synonyms[String(synonymIndex)] = true;
    review.vocabCoverage = coverage;
  };

  const baseEnhMastered = enhMastered;
  enhMastered = function enhMasteredCompleteVocab(id) {
    const item = ITEM_MAP.get(id);
    if (item?.type === "vocab" && hasUncoveredTargets(item)) return false;
    return baseEnhMastered(id);
  };

  const basePriorityScore = priorityScore;
  priorityScore = function priorityScoreCompleteVocab(item, dayKey) {
    let score = basePriorityScore(item, dayKey);
    if (item?.type !== "vocab") return score;

    const missing = missingVocabTargets(item);
    if (!missing.length) return score;
    score += Math.min(180, missing.length * 38);
    if (missing.includes(MEANING_VARIANT)) score += 45;
    return score;
  };

  const baseEnhDetails = enhDetails;
  enhDetails = function enhDetailsCompleteVocab(item) {
    if (item?.type !== "vocab") return baseEnhDetails(item);
    return `
      <div class="detail"><strong>뜻</strong><div>${esc(item.answer)}</div></div>
      ${item.synonyms?.length ? `<div class="detail"><strong>유의어 전체</strong><div class="chips">${item.synonyms.map((word) => `<span class="chip">${esc(word)}</span>`).join("")}</div></div>` : ""}
      ${item.confusions?.length ? `<div class="confusion"><strong>혼동 주의</strong><br>${item.confusions.map(esc).join("<br>")}</div>` : ""}
    `;
  };

  const baseRenderHome = renderHome;
  renderHome = function renderHomeCompleteVocab() {
    baseRenderHome();

    const heroText = app.querySelector(".hero p");
    if (heroText) {
      heroText.textContent = "어휘는 단어의 뜻과 등록된 유의어를 각각 별도 문제로 확인합니다. 뜻이나 유의어 하나라도 아직 맞히지 못했으면 해당 단어를 안정적으로 익힌 것으로 처리하지 않습니다.";
    }

    const vocabCardText = app.querySelector('[data-action="category"][data-type="vocab"] span');
    if (vocabCardText) {
      vocabCardText.textContent = "단어의 뜻을 확인한 뒤 등록된 유의어를 하나씩 모두 4지선다로 풉니다.";
    }
  };

  window.VOCAB_EXAM = Object.freeze({
    missingTargets: (itemOrId) => {
      const item = typeof itemOrId === "string" ? ITEM_MAP.get(itemOrId) : itemOrId;
      return missingVocabTargets(item);
    },
    hasUncoveredTargets: (itemOrId) => {
      const item = typeof itemOrId === "string" ? ITEM_MAP.get(itemOrId) : itemOrId;
      return hasUncoveredTargets(item);
    },
    remainingTargetCount,
    totalTargetCount,
  });
})();
