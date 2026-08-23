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

GitHub 저장소에 올린 뒤에는 [`.github/workflows/update-stars.yml`](./.github/workflows/update-stars.yml)이 매일 한국 시간 00시, 08시, 16시에 수집과 테스트를 실행하고 변경된 `repositories.json`과 `star-history.json`을 커밋합니다. 개인 토큰 대신 GitHub Actions가 제공하는 저장소용 `GITHUB_TOKEN`을 사용합니다. 저장소의 Actions 권한에서 워크플로의 쓰기 권한이 허용되어 있어야 합니다.

편집자가 작성하고 검수하는 한국어 설명과 가이드는 `data/editorial.json`과 `data/editorial-additions.json`, API에서 갱신되는 Star·Fork·라이선스·최근 Push 정보는 `data/repositories.json`에 저장됩니다.

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
- 12개 검수 대상 오픈소스

재밋 MCP는 아직 사용하지 않았습니다. 로컬 시안과 데이터 검수가 끝난 뒤 최종 사이트 제작과 발행에만 사용할 예정입니다.
