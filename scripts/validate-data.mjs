import fs from "node:fs";
import vm from "node:vm";

global.window = {};
for (const file of ["content/vocabulary.js", "content/grammar.js"]) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

const vocab = window.TRANSFER_ENGLISH_VOCAB;
const grammar = window.TRANSFER_ENGLISH_GRAMMAR;
const items = [...vocab, ...grammar];

const errors = [];
if (vocab.length !== 40) errors.push(`어휘 개수 예상 40, 실제 ${vocab.length}`);
if (grammar.length < 10) errors.push(`문법 항목이 너무 적습니다: ${grammar.length}`);

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
