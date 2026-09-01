import fs from "node:fs";

const grammarData = fs.readFileSync("content/grammar-v2.js", "utf8");
const grammarExam = fs.readFileSync("grammar-exam.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`문법 실전형 출제 검증 실패: ${message}`);
    process.exitCode = 1;
  }
}

const grammarIds = [...grammarData.matchAll(/"id":"(g-[^"]+)"/g)].map((match) => match[1]);
const uniqueGrammarIds = [...new Set(grammarIds)];

assert(uniqueGrammarIds.length >= 15, `문법 데이터가 예상보다 적습니다. 현재 ${uniqueGrammarIds.length}개입니다.`);
for (const id of uniqueGrammarIds) {
  const occurrences = grammarExam.split(`"${id}"`).length - 1;
  assert(occurrences >= 1, `${id}의 실전형 문항이 없습니다.`);
}

const examIndex = index.indexOf('<script src="./exam-mode.js"></script>');
const grammarExamIndex = index.indexOf('<script src="./grammar-exam.js"></script>');
assert(grammarExamIndex > examIndex, "grammar-exam.js는 exam-mode.js 뒤에서 출제 모델을 덮어써야 합니다.");

assert(grammarExam.includes("Choose the option that best completes the sentence") || grammarExam.includes("Choose the grammatically correct sentence"), "문장 완성 또는 문장 판별형 문항이 없습니다.");
assert(grammarExam.includes('term.textContent = "GRAMMAR"'), "문제 화면에서 개념명이 직접 노출됩니다.");
assert(grammarExam.includes("enhChoiceModel = function enhChoiceModelTransferGrammar"), "문법 전용 실전 출제 모델 오버라이드가 없습니다.");
assert(grammarExam.includes("enhHash(seed) % cases.length"), "같은 문법 개념에서 문항 변형이 선택되지 않습니다.");

const bannedMetaPrompts = [
  "문법적 성질에 대한 올바른 설명",
  "정답 구조는 무엇인가요",
  "필요한 전치사는 무엇인가요",
  "동사는 어떤 형태로 연결하나요",
  "수동태로 만들 수 있나요",
];
for (const phrase of bannedMetaPrompts) {
  assert(!grammarExam.includes(phrase), `개념을 직접 묻는 문구가 다시 들어왔습니다: ${phrase}`);
}

if (!process.exitCode) {
  console.log(`문법 실전형 출제 검증 통과: ${uniqueGrammarIds.length}개 문법 항목 모두 문장형 출제 대상`);
}
