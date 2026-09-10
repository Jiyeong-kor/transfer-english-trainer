import fs from "node:fs";
import vm from "node:vm";

global.window = {};
for (const file of [
  "content/vocabulary.js",
  "content/vocabulary-02.js",
  "content/vocabulary-hackers-750-day01.js",
  "content/vocabulary-hackers-750-day02.js",
  "content/vocabulary-hackers-750-day03-05.js",
  "content/vocabulary-hackers-750-day06-08.js",
  "content/vocabulary-hackers-750-day09-11.js",
  "content/vocabulary-hackers-750-day12-15.js",
  "content/grammar-v2.js",
]) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

const vocab = window.TRANSFER_ENGLISH_VOCAB;
const grammar = window.TRANSFER_ENGLISH_GRAMMAR;
const items = [...vocab, ...grammar];

const errors = [];
if (!Array.isArray(vocab) || vocab.length < 749) errors.push(`어휘 항목이 예상보다 적습니다: ${vocab?.length ?? 0}`);
if (!Array.isArray(grammar) || grammar.length < 10) errors.push(`문법 항목이 너무 적습니다: ${grammar?.length ?? 0}`);

const ids = new Set();
for (const item of items) {
  for (const key of ["id", "type", "prompt", "answer", "source"]) {
    if (!item[key]) errors.push(`${item.id || "(id 없음)"}: ${key} 누락`);
  }
  if (ids.has(item.id)) errors.push(`중복 id: ${item.id}`);
  ids.add(item.id);
  if (!["vocab", "grammar"].includes(item.type)) errors.push(`${item.id}: 잘못된 type ${item.type}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`검증 성공: 어휘 ${vocab.length}개, 문법 ${grammar.length}개, 총 ${items.length}개`);
