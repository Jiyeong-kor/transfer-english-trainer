# 편입영어 트레이너

Notion의 `편입 영어 오답노트`를 모바일에서 반복 학습하기 위한 개인용 PWA입니다.

기존 `bigdata-analysis-engineer-written`의 모바일 학습 흐름과 오답 우선 복습 방식을 재사용하고, 편입영어에 맞게 회상과 변별 문제를 섞었습니다.

> **운영 기본값**
>
> 이 저장소를 포함한 개인 학습 앱은 별도 지시가 없으면 기존 `bigdata-analysis-engineer-written`에서 검증한 방식을 재사용합니다. 즉, 정적 PWA로 구현하고 `main` 변경 시 GitHub Actions로 검증한 뒤 GitHub Pages에 자동 배포합니다. 새 배포 방식을 임의로 도입하지 않습니다.

## 학습 데이터

현재 앱에는 Notion에서 확인한 자료를 기준으로 총 55개 항목이 들어 있습니다.

- 어휘 40개
  - 실제 오답과 별표 항목 구분
  - 유의어
  - 혼동어
  - 아직 최종 구분이 남은 집중 복습 항목
- 문법 15개
  - `provide A with B`
  - `view A as B`
  - `allow A to V`
  - `recommend that S V원형`
  - `occur`, `join`, `visit`
  - `lie / lay` 구분
  - `participate in`, `get 목적어 to V` 등

## 학습 모드

### 오늘의 12개

한국 날짜를 기준으로 어휘 8개와 문법 4개를 구성합니다.

실제 오답, 애매하게 맞힌 항목, 혼동어, 복습 예정 항목, 아직 학습하지 않은 항목을 우선합니다. 같은 날짜에는 같은 세트를 유지합니다.

### 보기 없는 회상

단어나 문법 패턴을 먼저 보고 답을 머릿속에서 회상한 뒤 `몰랐음`, `애매함`, `확실히 앎`으로 기록합니다.

### 어휘 변별

어휘는 세 가지 방식으로 반복됩니다.

- 보기 없는 뜻 회상
- 가장 가까운 영어 유의어 선택
- 혼동 단어와 뜻 구분

### 문법 변별

문법은 정답 패턴 회상과 시험형 객관식을 섞습니다. 각 문법 항목에는 정답과 구분하기 위한 오답 선택지를 별도로 둡니다.

### 20문제 실전 변별

취약도와 학습 우선순위를 반영하여 20개 항목을 객관식으로 구성합니다. 객관식 정답률과 주관적인 확신도는 따로 기록합니다.

## 복습 간격

- 몰랐음: 1일 뒤
- 애매함: 1~3일 뒤
- 확실히 앎: 3일부터 시작하여 반복 성공 시 간격 증가
- 최대 간격: 30일
- `확실히 앎`이 2회 이상 연속되면 안정 항목으로 표시

## 저장과 백업

학습 기록은 브라우저 `localStorage`에 저장합니다. 앱 안에서 JSON 백업과 복원을 지원합니다.

## 오프라인 사용

서비스 워커가 앱 셸과 학습 데이터를 캐시합니다. 한 번 정상적으로 로드한 뒤에는 네트워크가 없어도 학습할 수 있습니다. 온라인 상태에서는 새 파일을 우선 가져오므로 데이터 갱신 후 오래된 캐시에 고정되지 않습니다.

## 주요 파일

```text
.
├── index.html
├── app.js
├── app-enhancements.js
├── styles.css
├── practice.css
├── manifest.webmanifest
├── sw.js
├── icon.svg
├── content/
│   ├── vocabulary.js
│   ├── grammar.js
│   └── grammar-v2.js
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
node --check app.js
node --check app-enhancements.js
node --check content/grammar-v2.js
node --check sw.js
```

## GitHub Pages 배포

`편입영어 학습 앱 배포` 워크플로는 기존 `bigdata-analysis-engineer-written`과 같은 방식으로 동작합니다.

1. `main`의 앱 데이터를 검증합니다.
2. 실행 파일만 `_site`에 구성합니다.
3. GitHub Pages 아티팩트를 업로드합니다.
4. `actions/deploy-pages`로 배포합니다.

새 저장소에서는 GitHub Pages를 최초 한 번 활성화해야 합니다. GitHub에서 `Settings → Pages → Build and deployment → Source`를 `GitHub Actions`로 설정합니다. GitHub Free 개인 계정은 public 저장소에서 Pages를 사용할 수 있습니다. GitHub Pro 이상에서는 private 저장소에서도 Pages를 사용할 수 있습니다.

Pages가 활성화되면 기본 프로젝트 주소는 `https://jiyeong-kor.github.io/transfer-english-trainer/` 형식입니다.

## 완성 PWA 패키지

`PWA 패키지 생성` GitHub Actions가 `transfer-english-trainer-pwa` 아티팩트를 만듭니다. 아티팩트에는 실행에 필요한 정적 파일만 포함됩니다.

## iPhone 설치

GitHub Pages 배포가 끝난 뒤 Safari에서 배포 주소를 엽니다.

`공유 → 홈 화면에 추가`를 선택하면 일반 앱처럼 실행할 수 있습니다.
