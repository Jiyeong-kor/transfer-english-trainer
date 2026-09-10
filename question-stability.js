"use strict";

(() => {
  const baseExamVariant = examVariant;
  const baseEnhChoiceModel = enhChoiceModel;

  function copyChoiceModel(model) {
    return {
      ...model,
      options: [...(model.options || [])],
    };
  }

  examVariant = function examVariantStable(item, session) {
    session.draft ||= {};
    if (session.draft.questionVariant) return session.draft.questionVariant;

    const variant = baseExamVariant(item, session);
    session.draft.questionVariant = variant;
    return variant;
  };
  enhVariant = examVariant;

  enhChoiceModel = function enhChoiceModelStable(item, variant, session) {
    session.draft ||= {};
    if (session.draft.questionModel && session.draft.questionVariant === variant) {
      return session.draft.questionModel;
    }

    const model = copyChoiceModel(baseEnhChoiceModel(item, variant, session));
    session.draft.questionVariant = variant;
    session.draft.questionModel = model;
    return model;
  };

  window.QUESTION_STABILITY = Object.freeze({
    current: () => state.activeSession?.draft?.questionModel || null,
  });
})();
