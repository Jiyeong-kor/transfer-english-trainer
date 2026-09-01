import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const index = read('index.html');
const exam = read('exam-mode.js');
const update = read('app-update.js');
const css = read('ux-fixes.css');
const sw = read('sw.js');

assert.ok(
  exam.includes('data-exam-choice') &&
    exam.includes('examRecordChoice(session, item, variant, model, selectedIndex);') &&
    exam.includes('examPositionNextActionForTap();'),
  '선택 즉시 채점 후 다음 액션 이동이 없습니다.'
);

assert.ok(
  exam.includes('data-exam-next') &&
    exam.includes('examPositionQuestionAtReadingStart();') &&
    exam.includes('examAdvance()'),
  '다음 문제 버튼 또는 다음 문항 시작 위치 자동 정렬이 없습니다.'
);

assert.ok(
  exam.includes('data-exam-unknown') &&
    exam.includes('examRecordUnknown') &&
    exam.includes('objectiveUnknown'),
  '모르겠음 응답 흐름이 없습니다.'
);

assert.ok(
  exam.includes('data-exam-action="save-home"') &&
    exam.includes('examSaveAndGoHome'),
  '진행 위치 저장 후 나가기 기능이 없습니다.'
);

assert.ok(
  update.includes("const APP_VERSION = 'v7';") &&
    update.includes('registration.update()') &&
    update.includes('SKIP_WAITING') &&
    update.includes('window.location.reload()'),
  '앱 업데이트 기능이 최신 버전에 맞지 않습니다.'
);

assert.ok(
  css.includes('border-left: 0 !important'),
  '카드 왼쪽 강조선 제거 규칙이 없습니다.'
);

assert.ok(
  !index.includes('app-ux-parity.js') &&
    index.includes('exam-mode.js') &&
    index.includes('app-update.js'),
  '최종 문제 화면 로딩 구조가 단일화되지 않았습니다.'
);

assert.ok(
  sw.includes('transfer-english-trainer-v7') &&
    sw.includes('./exam-mode.js') &&
    sw.includes('./app-update.js') &&
    sw.includes("event.data?.type === \"SKIP_WAITING\""),
  '서비스 워커 캐시 또는 업데이트 메시지 처리가 최신 상태가 아닙니다.'
);

console.log('즉시 채점, 모르겠음, 다음 버튼 이동, 문항 위치 정렬, 저장 후 나가기, 업데이트, 카드 강조선 제거 검사를 통과했습니다.');
