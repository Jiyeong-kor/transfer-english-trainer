import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function requireText(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(message);
  }
}

const engine = read("new-problems.js");
const vocab = read("content/vocabulary.js");
const grammar = read("content/grammar-v2.js");

requireText(
  engine,
  '(reviewFor(item.id)?.seenCount || 0) === 0',
  "새 문제 모드는 한 번도 풀지 않은 항목만 선택해야 합니다.",
);
requireText(
  engine,
  'entry.variant === variant && entry.objectiveCorrect === true',
  "혼동어 마스터 여부는 해당 문제 유형의 실제 정답 기록을 확인해야 합니다.",
);
requireText(
  engine,
  'return "meaning-choice"',
  "아직 검증되지 않은 혼동어는 뜻 변별 문제로 우선 출제해야 합니다.",
);
requireText(
  engine,
  'review.lastGrade === "again"',
  "최근 오답 항목은 출제 우선순위를 올려야 합니다.",
);
requireText(
  engine,
  'score -= 240',
  "안정적으로 맞힌 미도래 항목은 반복 출제를 강하게 낮춰야 합니다.",
);

requireText(
  vocab,
  'prescribe: 처방하다, 규정하다',
  "노션의 proscribe/prescribe 혼동 구분이 문제 데이터에 있어야 합니다.",
);
requireText(
  vocab,
  'recognize: 알아보다, 인정하다',
  "노션의 allocate/recognize 혼동 구분이 문제 데이터에 있어야 합니다.",
);
requireText(
  vocab,
  'exhaustive: 철저한, 빠짐없는',
  "노션의 exhilarating 계열 혼동 구분이 문제 데이터에 있어야 합니다.",
);
requireText(
  vocab,
  'transcend: 초월하다',
  "노션의 conquer/transcend 혼동 구분이 문제 데이터에 있어야 합니다.",
);
requireText(
  grammar,
  '"id":"g-allow-object-to"',
  "최근 재복습 우선인 allow + 목적어 + to V 문제가 유지되어야 합니다.",
);

console.log("최신 학습 기록 기반 출제 우선순위 검증 통과");
