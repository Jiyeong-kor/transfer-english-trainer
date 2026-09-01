import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const exam = fs.readFileSync("exam-mode.js", "utf8");
const pkg = fs.readFileSync(".github/workflows/package.yml", "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`편입영어 실전형 UX 검증 실패: ${message}`);
    process.exitCode = 1;
  }
}

const parityIndex = index.indexOf('<script src="./app-ux-parity.js"></script>');
const examIndex = index.indexOf('<script src="./exam-mode.js"></script>');
const updateIndex = index.indexOf('<script src="./app-update.js"></script>');

assert(examIndex >= 0, "index.html이 exam-mode.js를 로드하지 않습니다.");
assert(parityIndex >= 0 && examIndex > parityIndex, "exam-mode.js는 기존 학습 렌더러 뒤에서 로드되어야 합니다.");
assert(updateIndex >= 0 && examIndex < updateIndex, "exam-mode.js는 app-update.js보다 먼저 로드되어야 합니다.");
assert(pkg.includes("exam-mode.js"), "PWA 패키지에 exam-mode.js가 포함되어야 합니다.");

assert(exam.includes("enhVariant = examVariant"), "모든 세션을 실전형 선택 문제로 강제하는 오버라이드가 없습니다.");
assert(exam.includes("renderStudy = function renderStudyExam"), "실전형 문제 화면 렌더러가 없습니다.");
assert(exam.includes("data-exam-choice"), "처음부터 선택지를 표시하는 객관식 입력이 없습니다.");
assert(exam.includes("examRecordChoice"), "선택 즉시 채점 로직이 없습니다.");
assert(exam.includes("선지를 보고 바로 고르기"), "홈 화면이 실전형 학습 원칙을 명시하지 않습니다.");

assert(!exam.includes('return "recall"'), "exam-mode.js에 보기 없는 회상 분기가 다시 들어왔습니다.");
assert(!exam.includes("정답 보기"), "exam-mode.js에 정답 보기 버튼이 다시 들어왔습니다.");
assert(!exam.includes('data-enh-action="reveal"'), "exam-mode.js에 정답 공개용 reveal 동작이 다시 들어왔습니다.");

if (!process.exitCode) {
  console.log("편입영어 실전형 UX 검증 통과");
}
