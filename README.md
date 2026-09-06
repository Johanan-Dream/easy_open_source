# Easy Open Source

인기 오픈소스를 쉬운 한국어로 이해하고, 운영체제별 안내를 따라 첫 실행까지 도달하도록 돕는 로컬 MVP입니다.

제품의 한 줄 소개, 차별점과 공모전 이후 운영 계획은 [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md)에 정리되어 있습니다.
Zaemit에 한 번에 전달할 화면·기능·데이터 명세는 [`ZAEMIT_HANDOFF.md`](./ZAEMIT_HANDOFF.md)에 정리되어 있습니다.
프로젝트별 사용 방법은 [`GUIDE_STANDARD.md`](./GUIDE_STANDARD.md)의 고정 형식과 공개 조건을 따릅니다.

## 실행

Node.js 22.18 이상이 필요합니다. 별도의 패키지 설치는 필요하지 않습니다.

```bash
npm start
```

브라우저에서 <http://localhost:4173>을 엽니다.

개발 중 자동 재시작이 필요하면 다음 명령을 사용합니다.

```bash
npm run dev
```

## GitHub 데이터 갱신

공개 저장소 메타데이터는 GitHub 공식 REST API에서 가져옵니다.

```bash
npm run collect
```

토큰 없이도 공개 저장소를 수집할 수 있지만 시간당 요청 한도가 낮습니다. 더 자주 수집할 때만 `.env.example`을 참고해 서버 환경에 `GITHUB_TOKEN`을 설정합니다. 토큰은 브라우저 코드나 저장소에 넣지 않습니다.

GitHub 저장소에 올린 뒤에는 [`.github/workflows/update-stars.yml`](./.github/workflows/update-stars.yml)이 매일 한국 시간 03시 15분에 수집과 테스트를 실행하고 변경된 `repositories.json`과 `star-history.json`을 커밋합니다. 개인 토큰 대신 GitHub Actions가 제공하는 저장소용 `GITHUB_TOKEN`을 사용합니다. 저장소의 Actions 권한에서 워크플로의 쓰기 권한이 허용되어 있어야 합니다.

편집자가 작성하고 검수하는 한국어 설명과 가이드는 `data/editorial*.json`, API에서 갱신되는 Star·Fork·라이선스·최근 Push 정보는 `data/repositories.json`에 저장됩니다.

`GEMINI_API_KEY`가 GitHub Actions Secret에 등록되어 있으면 매일 GitHub 후보 수십 개를 기존 누적 목록과 비교합니다. 신규 후보 중 최대 2개를 Gemini로 평가하고 자동 검증을 통과한 프로젝트를 `data/editorial-discovered.json`에 누적합니다. 기존 프로젝트의 변경된 README는 하루 최대 1개를 분석해 `data/review/pending-guides.json`에 보관하므로 Gemini 호출은 하루 최대 3회입니다. 키를 코드, JSON 또는 `.env` 파일에 커밋하지 마세요.

## 테스트

```bash
npm test
```

공식 근거 링크 응답 여부는 다음 명령으로 확인합니다.

```bash
npm run check:links
```

## API

- `GET /api/health`
- `GET /api/categories`
- `GET /api/repositories?category=ai-automation&sort=popular&search=로컬`
- `GET /api/trending?limit=5`
- `GET /api/repositories/{owner}/{repo}`
- `GET /api/repositories/{owner}/{repo}/guide`

## 현재 범위

- 공식 GitHub API 기반 메타데이터 수집
- 인기순·트렌딩순·최근 업데이트순 정렬
- 카테고리와 한국어 검색
- 프로젝트 상세 설명
- Windows/macOS/Web별 초보자 가이드
- 터미널 실행 방법과 명령어 복사
- 반응형 로컬 UI
- 60개 오픈소스 카탈로그
- 변경된 README의 Gemini 분석 및 검토 대기 초안
- 신규 오픈소스 탐색·중복 제거·검증 후 누적 추가

공개 화면은 재밋으로 발행되어 있으며, 로컬 JSON 변경 사항은 별도의 동기화 과정을 거쳐 반영합니다.
