import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const exam = fs.readFileSync("exam-mode.js", "utf8");
const grammarExam = fs.readFileSync("grammar-exam.js", "utf8");
const appUpdate = fs.readFileSync("app-update.js", "utf8");
const css = fs.readFileSync("ux-fixes.css", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const pkg = fs.readFileSync(".github/workflows/package.yml", "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`편입영어 실전형 UX 검증 실패: ${message}`);
    process.exitCode = 1;
  }
}

const examIndex = index.indexOf('<script src="./exam-mode.js"></script>');
const grammarExamIndex = index.indexOf('<script src="./grammar-exam.js"></script>');
const updateIndex = index.indexOf('<script src="./app-update.js"></script>');
const newProblemsIndex = index.indexOf('<script src="./new-problems.js"></script>');

assert(examIndex >= 0, "index.html이 exam-mode.js를 로드하지 않습니다.");
assert(grammarExamIndex > examIndex, "grammar-exam.js는 exam-mode.js 뒤에 로드되어야 합니다.");
assert(updateIndex > grammarExamIndex, "app-update.js는 실전 문법 출제 스크립트 뒤에 로드되어야 합니다.");
assert(newProblemsIndex > updateIndex, "최신 학습 기록 기반 출제 규칙은 기본 시험 모드와 업데이트 기능 뒤에 로드되어야 합니다.");
assert(!index.includes("app-ux-parity.js"), "최종 문제 화면을 덮어쓰는 중간 UX 스크립트가 남아 있습니다.");
assert(pkg.includes("exam-mode.js"), "PWA 패키지에 exam-mode.js가 포함되어야 합니다.");
assert(pkg.includes("grammar-exam.js"), "PWA 패키지에 grammar-exam.js가 포함되어야 합니다.");
assert(pkg.includes("new-problems.js"), "PWA 패키지에 최신 학습 기록 기반 출제 규칙이 포함되어야 합니다.");
assert(!pkg.includes("app-ux-parity.js"), "PWA 패키지에 제거 대상 중간 UX 스크립트가 남아 있습니다.");

assert(exam.includes("enhVariant = examVariant"), "모든 세션을 실전형 선택 문제로 강제하는 오버라이드가 없습니다.");
assert(exam.includes("renderStudy = function renderStudyExam"), "실전형 문제 화면 렌더러가 없습니다.");
assert(exam.includes("data-exam-choice"), "처음부터 선택지를 표시하는 객관식 입력이 없습니다.");
assert(exam.includes("examRecordChoice(session, item, variant, model, selectedIndex);"), "선택 즉시 채점 로직이 없습니다.");
assert(exam.includes("examPositionNextActionForTap();"), "채점 직후 다음 문제 버튼 위치로 자동 이동하지 않습니다.");
assert(exam.includes("data-exam-next"), "채점 직후 다음 문제 버튼이 표시되지 않습니다.");
assert(exam.includes("examPositionQuestionAtReadingStart();"), "다음 문항 시작 위치 자동 정렬이 없습니다.");
assert(exam.includes("data-exam-unknown") && exam.includes("examRecordUnknown"), "모르겠음 응답 흐름이 없습니다.");
assert(exam.includes('data-exam-action="save-home"') && exam.includes("examSaveAndGoHome"), "저장하고 나가기 기능이 없습니다.");
assert(exam.includes("선지를 보고 바로 고르기"), "홈 화면이 실전형 학습 원칙을 명시하지 않습니다.");

assert(grammarExam.includes("enhChoiceModel = function enhChoiceModelTransferGrammar"), "문법이 문장형 실전 문제로 교체되지 않습니다.");
assert(grammarExam.includes('term.textContent = "GRAMMAR"'), "문제 제목에 학습 개념명이 그대로 노출될 수 있습니다.");

assert(!exam.includes('return "recall"'), "exam-mode.js에 보기 없는 회상 분기가 다시 들어왔습니다.");
assert(!exam.includes("정답 보기"), "exam-mode.js에 정답 보기 버튼이 다시 들어왔습니다.");
assert(!exam.includes('data-enh-action="reveal"'), "exam-mode.js에 정답 공개용 reveal 동작이 다시 들어왔습니다.");

assert(appUpdate.includes("const APP_VERSION = 'v10';"), "앱 업데이트 버전이 v10이 아닙니다.");
assert(appUpdate.includes("registration.update()") && appUpdate.includes("SKIP_WAITING") && appUpdate.includes("window.location.reload()"), "앱 업데이트 적용 흐름이 없습니다.");
assert(css.includes("border-left: 0 !important"), "카드 왼쪽 강조선 제거 규칙이 없습니다.");
assert(sw.includes('transfer-english-trainer-v10') && sw.includes('./exam-mode.js') && sw.includes('./grammar-exam.js') && sw.includes('./new-problems.js') && !sw.includes('./app-ux-parity.js'), "서비스 워커 캐시가 최종 문제 UX 구조와 맞지 않습니다.");
assert(sw.includes('event.data?.type === "SKIP_WAITING"'), "서비스 워커 즉시 업데이트 메시지 처리가 없습니다.");

if (!process.exitCode) {
  console.log("즉시 채점, 실전 문법 문장형 출제, 모르겠음, 다음 버튼 이동, 다음 문항 위치 정렬, 저장 후 나가기, 최신 학습 우선순위, 앱 업데이트 검증 통과");
}
