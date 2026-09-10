import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const exam = fs.readFileSync("exam-mode.js", "utf8");
const grammarExam = fs.readFileSync("grammar-exam.js", "utf8");
const vocabExam = fs.readFileSync("vocab-exam.js", "utf8");
const appUpdate = fs.readFileSync("app-update.js", "utf8");
const newProblems = fs.readFileSync("new-problems.js", "utf8");
const questionStability = fs.readFileSync("question-stability.js", "utf8");
const grammarHierarchy = fs.readFileSync("grammar-hierarchy.js", "utf8");
const allStudy = fs.readFileSync("all-study.js", "utf8");
const css = fs.readFileSync("ux-fixes.css", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const pkg = fs.readFileSync(".github/workflows/package.yml", "utf8");
const hackersVocabFiles = [
  "vocabulary-hackers-750-day01.js",
  "vocabulary-hackers-750-day02.js",
  "vocabulary-hackers-750-day03-05.js",
  "vocabulary-hackers-750-day06-08.js",
  "vocabulary-hackers-750-day09-11.js",
  "vocabulary-hackers-750-day12-15.js",
];

function assert(condition, message) {
  if (!condition) {
    console.error(`편입영어 실전형 UX 검증 실패: ${message}`);
    process.exitCode = 1;
  }
}

const examIndex = index.indexOf('<script src="./exam-mode.js"></script>');
const grammarExamIndex = index.indexOf('<script src="./grammar-exam.js"></script>');
const vocabExamIndex = index.indexOf('<script src="./vocab-exam.js"></script>');
const updateIndex = index.indexOf('<script src="./app-update.js"></script>');
const newProblemsIndex = index.indexOf('<script src="./new-problems.js"></script>');
const questionStabilityIndex = index.indexOf('<script src="./question-stability.js"></script>');
const grammarHierarchyIndex = index.indexOf('<script src="./grammar-hierarchy.js"></script>');
const allStudyIndex = index.indexOf('<script src="./all-study.js"></script>');

assert(examIndex >= 0, "index.html이 exam-mode.js를 로드하지 않습니다.");
assert(grammarExamIndex > examIndex, "grammar-exam.js는 exam-mode.js 뒤에 로드되어야 합니다.");
assert(vocabExamIndex > grammarExamIndex, "vocab-exam.js는 문법 출제 오버라이드 뒤에 로드되어야 합니다.");
assert(updateIndex > vocabExamIndex, "app-update.js는 어휘·문법 출제 스크립트 뒤에 로드되어야 합니다.");
assert(newProblemsIndex > updateIndex, "최신 학습 기록 기반 출제 규칙은 기본 시험 모드와 업데이트 기능 뒤에 로드되어야 합니다.");
assert(questionStabilityIndex > newProblemsIndex, "문항 안정화 규칙은 최신 출제 규칙 뒤에 로드되어야 합니다.");
assert(grammarHierarchyIndex > questionStabilityIndex, "문법 문제 위계 조정은 최종 문제 렌더러 뒤에 적용되어야 합니다.");
assert(allStudyIndex > grammarHierarchyIndex, "전체 문제 풀이 모드는 최종 출제·렌더링 오버라이드 뒤에 로드되어야 합니다.");
assert(!index.includes("app-ux-parity.js"), "최종 문제 화면을 덮어쓰는 중간 UX 스크립트가 남아 있습니다.");
assert(pkg.includes("exam-mode.js"), "PWA 패키지에 exam-mode.js가 포함되어야 합니다.");
assert(pkg.includes("grammar-exam.js"), "PWA 패키지에 grammar-exam.js가 포함되어야 합니다.");
assert(pkg.includes("vocab-exam.js"), "PWA 패키지에 vocab-exam.js가 포함되어야 합니다.");
assert(pkg.includes("new-problems.js"), "PWA 패키지에 최신 학습 기록 기반 출제 규칙이 포함되어야 합니다.");
assert(pkg.includes("grammar-hierarchy.js"), "PWA 패키지에 문법 문제 위계 조정 스크립트가 포함되어야 합니다.");
assert(pkg.includes("all-study.js"), "PWA 패키지에 전체 문제 풀이 모드가 포함되어야 합니다.");
assert(pkg.includes("content/vocabulary-02.js"), "PWA 패키지에 02 VOCA 어휘 데이터가 포함되어야 합니다.");
for (const file of hackersVocabFiles) {
  assert(pkg.includes(`content/${file}`), `PWA 패키지에 ${file}이 포함되어야 합니다.`);
  assert(index.includes(`./content/${file}`), `index.html이 ${file}을 로드해야 합니다.`);
}
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
assert(grammarHierarchy.includes("renderStudy = function renderStudyWithGrammarHierarchy"), "문법 문제 화면에 시각적 위계 조정이 적용되지 않습니다.");
assert(grammarHierarchy.includes("grammar-instruction") && grammarHierarchy.includes("grammar-sentence"), "문법 지시문과 실제 문제 문장의 위계가 분리되지 않습니다.");
assert(vocabExam.includes("enhChoiceModel = function enhChoiceModelCompleteVocab"), "어휘 문제 품질 오버라이드가 없습니다.");
assert(newProblems.includes("remainingLearningTargetCount"), "미완료 학습 목표 집계 기능이 없습니다.");
assert(questionStability.includes("session.draft.questionVariant"), "문항 유형 고정 기능이 없습니다.");

assert(allStudy.includes('const ALL_STUDY_MODE = "all-targets"'), "전체 문제 풀이 모드 식별자가 없습니다.");
assert(allStudy.includes('"meaning-choice"') && allStudy.includes('`synonym-choice:${index}`') && allStudy.includes('["grammar-choice"]'), "전체 문제 풀이 큐가 어휘 뜻·개별 유의어·문법 문제를 모두 포함하지 않습니다.");
assert(allStudy.includes("targetVariants: targets.map((target) => target.variant)"), "전체 문제 풀이 큐가 각 학습 목표의 문제 유형을 보존하지 않습니다.");
assert(allStudy.includes("startDaily = startAllLearningTargets"), "기본 문제 풀이 시작 동작이 전체 학습 모드로 연결되지 않습니다.");
assert(allStudy.includes("session.targetVariants?.[session.index]"), "전체 학습 중 각 문제의 지정 유형을 강제하지 않습니다.");
assert(allStudy.includes("saveState()"), "전체 학습 진행 위치가 저장되지 않습니다.");

assert(!exam.includes('return "recall"'), "exam-mode.js에 보기 없는 회상 분기가 다시 들어왔습니다.");
assert(!exam.includes("정답 보기"), "exam-mode.js에 정답 보기 버튼이 다시 들어왔습니다.");
assert(!exam.includes('data-enh-action="reveal"'), "exam-mode.js에 정답 공개용 reveal 동작이 다시 들어왔습니다.");

assert(appUpdate.includes("const APP_VERSION = 'v15';"), "앱 업데이트 버전이 v15가 아닙니다.");
assert(appUpdate.includes("registration.update()") && appUpdate.includes("SKIP_WAITING") && appUpdate.includes("window.location.reload()"), "앱 업데이트 적용 흐름이 없습니다.");
assert(css.includes("border-left: 0 !important"), "카드 왼쪽 강조선 제거 규칙이 없습니다.");
assert(sw.includes('transfer-english-trainer-v15') && sw.includes('./exam-mode.js') && sw.includes('./grammar-exam.js') && sw.includes('./vocab-exam.js') && sw.includes('./new-problems.js') && sw.includes('./grammar-hierarchy.js') && sw.includes('./all-study.js') && sw.includes('./content/vocabulary-02.js') && !sw.includes('./app-ux-parity.js'), "서비스 워커 캐시가 최종 문제 UX 구조와 맞지 않습니다.");
for (const file of hackersVocabFiles) {
  assert(sw.includes(`./content/${file}`), `서비스 워커가 ${file}을 캐시해야 합니다.`);
}
assert(sw.includes('event.data?.type === "SKIP_WAITING"'), "서비스 워커 즉시 업데이트 메시지 처리가 없습니다.");

if (!process.exitCode) {
  console.log("즉시 채점, 어휘 뜻·개별 유의어 출제, 실전 문법 문장형 출제, 문법 문제 시각적 위계, 전체 문제 풀이, 모르겠음, 다음 버튼 이동, 다음 문항 위치 정렬, 저장 후 나가기, 앱 업데이트 검증 통과");
}
