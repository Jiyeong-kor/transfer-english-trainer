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

const context = { window: {} };
vm.createContext(context);
for (const path of VOCAB_FILES) {
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
}

const vocab = context.window.TRANSFER_ENGLISH_VOCAB;
const source = fs.readFileSync("vocab-exam.js", "utf8");
const newProblems = fs.readFileSync("new-problems.js", "utf8");
const errors = [];

function requireText(content, needle, message) {
  if (!content.includes(needle)) errors.push(message);
}

if (!Array.isArray(vocab) || vocab.length < 749) errors.push(`어휘 데이터가 예상보다 적습니다: ${vocab?.length ?? 0}개`);
for (const item of vocab) {
  if (!Array.isArray(item.synonyms)) {
    errors.push(`${item.id}: synonyms 형식이 배열이 아닙니다.`);
  }
}

const totalTargets = vocab.reduce((sum, item) => sum + 1 + (item.synonyms?.length || 0), 0);
if (totalTargets <= vocab.length * 2) {
  errors.push(`뜻과 개별 유의어 학습 목표가 충분히 분리되지 않았습니다. 총 목표 ${totalTargets}개`);
}

requireText(source, "vocabCoverage", "뜻과 유의어별 학습 완료 상태를 영속적으로 저장해야 합니다.");
requireText(source, "synonym-choice:${index}", "각 유의어를 별도 문제 유형으로 구분해야 합니다.");
requireText(source, "missingVocabTargets", "아직 맞히지 못한 뜻과 유의어를 우선 출제해야 합니다.");
requireText(source, "vocabKind", "뜻 오답 선지는 품사가 비슷한 어휘를 우선 사용해야 합니다.");
requireText(source, "vocabRelated", "같거나 매우 가까운 어휘를 오답 선지로 넣지 않도록 걸러야 합니다.");
requireText(source, "유의어 전체", "채점 후 등록된 모든 유의어를 보여 줘야 합니다.");
requireText(source, "뜻이나 유의어 하나라도 아직 맞히지 못했으면", "학습 완료 기준을 사용자에게 명확히 안내해야 합니다.");
requireText(newProblems, "VOCAB_EXAM.hasUncoveredTargets", "새 문제 모드도 미완료 뜻·유의어 학습 목표를 계속 출제해야 합니다.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`어휘 문제 검증 완료: 어휘 ${vocab.length}개, 뜻·개별 유의어 학습 목표 ${totalTargets}개`);
