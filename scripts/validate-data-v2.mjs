import fs from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
for (const path of ["content/vocabulary.js", "content/grammar-v2.js"]) {
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
}

const vocab = context.window.TRANSFER_ENGLISH_VOCAB;
const grammar = context.window.TRANSFER_ENGLISH_GRAMMAR;
const all = [...vocab, ...grammar];
const errors = [];

if (!Array.isArray(vocab) || vocab.length < 1) errors.push("어휘 데이터가 비어 있습니다.");
if (!Array.isArray(grammar) || grammar.length < 1) errors.push("문법 데이터가 비어 있습니다.");

const ids = new Set();
for (const item of all) {
  if (!item.id) errors.push("id가 없는 항목이 있습니다.");
  if (ids.has(item.id)) errors.push(`중복 id: ${item.id}`);
  ids.add(item.id);
  if (!item.type || !["vocab", "grammar"].includes(item.type)) errors.push(`잘못된 type: ${item.id}`);
  if (!item.prompt || !item.answer) errors.push(`prompt/answer 누락: ${item.id}`);
  if (!item.source) errors.push(`source 누락: ${item.id}`);
  if (!["weak", "uncertain", "new"].includes(item.initialStrength)) errors.push(`initialStrength 오류: ${item.id}`);

  if (item.type === "vocab") {
    if (!item.term) errors.push(`term 누락: ${item.id}`);
    if (!Array.isArray(item.synonyms) || item.synonyms.length < 1) errors.push(`synonyms 누락: ${item.id}`);
    if (!Array.isArray(item.confusions)) errors.push(`confusions 형식 오류: ${item.id}`);
  }

  if (item.type === "grammar") {
    if (!item.title || !item.explanation) errors.push(`문법 설명 누락: ${item.id}`);
    if (!Array.isArray(item.distractors) || item.distractors.length < 3) errors.push(`문법 distractors 3개 미만: ${item.id}`);
    if (new Set(item.distractors).size !== item.distractors.length) errors.push(`문법 distractors 중복: ${item.id}`);
    if (item.distractors.includes(item.answer)) errors.push(`정답이 distractors에 포함됨: ${item.id}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`검증 완료: 어휘 ${vocab.length}개, 문법 ${grammar.length}개, 총 ${all.length}개`);
