# 편입영어 트레이너

Notion의 `편입 영어 오답노트`를 모바일에서 반복 학습하기 위한 개인용 PWA입니다.

기존 `bigdata-analysis-engineer-written`의 모바일 학습 흐름과 오답 우선 복습 방식을 재사용하되, 편입영어 문제 풀이에 맞게 학습 화면을 실전형 4지선다 중심으로 구성합니다.

> **운영 기본값**
>
> 이 저장소를 포함한 개인 학습 앱은 별도 지시가 없으면 기존 `bigdata-analysis-engineer-written`에서 검증한 방식을 재사용합니다. 정적 PWA로 구현하고 `main` 변경 시 GitHub Actions로 검증한 뒤 GitHub Pages에 자동 배포합니다.

## 학습 데이터

현재 앱에는 Notion 오답노트, 김영편입 영어 어휘 기출 1단계 학습 자료, `해커스편입 시험에 꼭 나오는 적중어휘 750`의 DAY 1~15 전체 어휘를 통합해 두었습니다. 해커스 자료의 750개 원본 행은 표제어, 뜻, 기출동의어, 출제학교를 보존합니다. 기존 데이터와 표제어가 같은 항목은 새 카드를 중복 생성하지 않고 기존 항목에 뜻, 유의어, 출제학교, 출처를 병합합니다.

- 어휘
  - 실제 오답과 집중 복습 항목 구분
  - 핵심 뜻
  - 등록된 기출동의어 전체
  - 혼동어
  - 해커스 자료의 출제학교 메타데이터
- 문법 36개
  - `provide A with B`
  - `view A as B`
  - `allow A to V`
  - `recommend that S V원형`
  - `occur`, `happen`, `join`, `visit`, `discuss`, `inhabit`의 자동사·타동사 구분
  - `lie / lay`, `rise / raise`, `affect / effect` 구분
  - `participate in`, `rid A of B`, `prevent A from V-ing`
  - `tend to V`, `anticipate / finish / risk + V-ing`
  - `have + 목적어 + p.p.`, `get + 목적어 + to V`
  - `make it + 형용사 + to V`, `request that S V원형` 등

해커스 원문에 기출동의어가 적혀 있지 않은 표제어는 임의의 유의어를 보충하지 않고 뜻 학습만 출제합니다.

## 학습 방식

### 오늘의 12문제

한국 날짜를 기준으로 어휘 8문제와 문법 4문제를 구성합니다.

실제 오답, 복습 예정 항목, 집중 복습 항목, 아직 학습하지 않은 항목을 우선합니다. 같은 날짜에는 같은 세트를 유지합니다.

### 어휘 실전

어휘는 문제를 열자마자 선지를 보여 줍니다. 보기 없는 회상 단계는 사용하지 않습니다.

- 단어의 뜻을 고르는 4지선다
- 가장 가까운 영어 표현을 고르는 4지선다
- 혼동어가 있는 경우 의미를 구분하는 4지선다

각 어휘는 뜻과 등록된 각 유의어를 별도의 학습 목표로 관리합니다. 선지를 누르면 즉시 채점하며, 정답과 오답은 자동으로 학습 기록에 반영합니다.

### 문법 실전

문법도 처음부터 선택지를 보여 줍니다. 정답 패턴을 머릿속에서 먼저 회상하도록 요구하지 않습니다.

각 문법 항목의 정답 패턴과 오답 선택지를 이용하여 시험형 4지선다로 구성합니다. 2026-09-11에 추가한 김영편입 문법 기출 1단계 오답 21개도 각 개념당 2개의 문장형 변형 문제로 출제합니다.

### 20문제 실전 세트

취약도와 학습 우선순위를 반영하여 20문제를 구성합니다. 모든 문제는 객관식으로 채점하며 세션 종료 후 정답 수, 오답 수, 정답률을 보여 줍니다.

## 복습 규칙

- 오답: 1일 뒤 우선 복습
- 정답: 3일부터 시작하여 반복 성공 시 복습 간격 증가
- 최대 간격: 30일
- 연속 정답이 누적되면 안정 항목으로 표시

기존 백업에 남아 있는 `애매함` 기록은 호환을 위해 유지하지만, 현재 실전형 풀이에서는 정답과 오답을 객관적으로 기록합니다.

## 저장과 백업

학습 기록은 브라우저 `localStorage`에 저장합니다. 앱 안에서 JSON 백업과 복원을 지원합니다.

## 오프라인 사용

서비스 워커가 앱 셸과 학습 데이터를 캐시합니다. 한 번 정상적으로 로드한 뒤에는 네트워크가 없어도 학습할 수 있습니다. 온라인 상태에서는 새 파일을 우선 가져옵니다.

## 주요 파일

```text
.
├── index.html
├── app.js
├── app-enhancements.js
├── exam-mode.js
├── grammar-exam.js
├── grammar-exam-2026-09-11.js
├── app-update.js
├── styles.css
├── practice.css
├── ux-fixes.css
├── manifest.webmanifest
├── sw.js
├── icon.svg
├── content/
│   ├── vocabulary.js
│   ├── vocabulary-02.js
│   ├── vocabulary-hackers-750-day01.js
│   ├── vocabulary-hackers-750-day02.js
│   ├── vocabulary-hackers-750-day03-05.js
│   ├── vocabulary-hackers-750-day06-08.js
│   ├── vocabulary-hackers-750-day09-11.js
│   ├── vocabulary-hackers-750-day12-15.js
│   ├── grammar.js
│   ├── grammar-v2.js
│   └── grammar-2026-09-11.js
├── scripts/
│   ├── validate-data.mjs
│   └── validate-data-v2.mjs
└── .github/workflows/
    ├── validate.yml
    ├── package.yml
    └── deploy-pages.yml
```

## 검증

`main`에 변경이 들어오면 GitHub Actions가 학습 데이터와 앱 JavaScript 구문을 자동 검증합니다.

```bash
node scripts/validate-data.mjs
node scripts/validate-data-v2.mjs
node scripts/validate-vocab-exam.mjs
node scripts/validate-grammar-exam.mjs
node --check app.js
node --check app-enhancements.js
node --check exam-mode.js
node --check grammar-exam.js
node --check grammar-exam-2026-09-11.js
node --check app-ux-parity.js
node --check app-update.js
node --check content/grammar-v2.js
node --check content/grammar-2026-09-11.js
node --check sw.js
```

## GitHub Pages 배포

`편입영어 학습 앱 배포` 워크플로가 `main` 변경을 검증한 뒤 GitHub Pages에 자동 배포합니다.

기본 프로젝트 주소는 `https://jiyeong-kor.github.io/transfer-english-trainer/` 형식입니다.

## iPhone 설치

Safari에서 배포 주소를 연 뒤 `공유 → 홈 화면에 추가`를 선택하면 일반 앱처럼 실행할 수 있습니다.
