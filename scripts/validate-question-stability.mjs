import fs from "node:fs";
import vm from "node:vm";

const stability = fs.readFileSync("question-stability.js", "utf8");
const context = { window: {} };
vm.createContext(context);

vm.runInContext(`
  globalThis.coverageResolved = false;
  globalThis.state = { activeSession: null };
  function examVariant() {
    return globalThis.coverageResolved ? "synonym-choice:0" : "meaning-choice";
  }
  let enhVariant = examVariant;
  function enhChoiceModel(_item, variant) {
    return {
      question: variant,
      correct: variant,
      options: [variant, "option-b", "option-c", "option-d"],
    };
  }
`, context);

vm.runInContext(stability, context, { filename: "question-stability.js" });

vm.runInContext(`
  const session = { draft: {} };
  const item = {};

  const firstVariant = examVariant(item, session);
  const firstModel = enhChoiceModel(item, firstVariant, session);
  const firstOptions = JSON.stringify(firstModel.options);

  globalThis.coverageResolved = true;

  const secondVariant = examVariant(item, session);
  const secondModel = enhChoiceModel(item, secondVariant, session);
  const secondOptions = JSON.stringify(secondModel.options);

  if (firstVariant !== secondVariant) {
    throw new Error("채점 상태 변경 후 문제 유형이 바뀌었습니다: " + firstVariant + " -> " + secondVariant);
  }
  if (firstOptions !== secondOptions) {
    throw new Error("채점 상태 변경 후 선지가 바뀌었습니다: " + firstOptions + " -> " + secondOptions);
  }
`, context);

console.log("채점 전후 문제 유형과 선지 고정 검증 통과");
