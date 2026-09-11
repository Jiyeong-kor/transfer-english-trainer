import fs from "node:fs";
import vm from "node:vm";

const VOCAB_FILES = [
  "content/vocabulary.js",
  "content/vocabulary-02.js",
  "content/vocabulary-hackers-750-day01.js",
  "content/vocabulary-hackers-750-day02.js",
  "content/vocabulary-hackers-750-day03-05.js",
  "content/vocabulary-hackers-750-day06-08.js",
  "content/vocabulary-hackers-750-day09-11.js",
  "content/vocabulary-hackers-750-day12-15.js",
];
const GRAMMAR_FILES = [
  "content/grammar-v2.js",
  "content/grammar-2026-09-11.js",
];

const context = { window: {} };
vm.createContext(context);
for (const path of [...VOCAB_FILES, ...GRAMMAR_FILES]) {
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
}

const vocab = context.window.TRANSFER_ENGLISH_VOCAB;
const grammar = context.window.TRANSFER_ENGLISH_GRAMMAR;
const all = [...vocab, ...grammar];
const errors = [];

function compactLeakText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, "");
}

function exposesFullAnswer(value, answer) {
  const visible = compactLeakText(value);
  const correct = compactLeakText(answer);
  return correct.length >= 4 && visible.includes(correct);
}

if (!Array.isArray(vocab) || vocab.length < 749) errors.push(`어휘 데이터가 예상보다 적습니다: ${vocab?.length ?? 0}개`);
if (!Array.isArray(grammar) || grammar.length < 1) errors.push("문법 데이터가 비어 있습니다.");

for (let day = 1; day <= 15; day += 1) {
  const marker = `해커스편입 시험에 꼭 나오는 적중어휘 750 · DAY ${day}`;
  if (!vocab.some((item) => String(item.source || "").includes(marker))) {
    errors.push(`해커스 적중어휘 DAY ${day} 데이터가 없습니다.`);
  }
}

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
    if (!Array.isArray(item.synonyms)) errors.push(`synonyms 형식 오류: ${item.id}`);
    if (!Array.isArray(item.confusions)) errors.push(`confusions 형식 오류: ${item.id}`);
  }

  if (item.type === "grammar") {
    if (!item.title || !item.explanation) errors.push(`문법 설명 누락: ${item.id}`);
    if (!item.quizPrompt) errors.push(`문법 quizPrompt 누락: ${item.id}`);
    if (!Array.isArray(item.distractors) || item.distractors.length < 3) errors.push(`문법 distractors 3개 미만: ${item.id}`);
    if (new Set(item.distractors).size !== item.distractors.length) errors.push(`문법 distractors 중복: ${item.id}`);
    if (item.distractors.includes(item.answer)) errors.push(`정답이 distractors에 포함됨: ${item.id}`);

    for (const field of ["title", "prompt", "quizPrompt"]) {
      if (exposesFullAnswer(item[field], item.answer)) {
        errors.push(`정답 누출: ${item.id}의 ${field}에 정답 문자열/구조가 그대로 포함되어 있습니다.`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`검증 완료: 어휘 ${vocab.length}개, 문법 ${grammar.length}개, 총 ${all.length}개`);
