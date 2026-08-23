const state = { repositories: [], categories: [], category: 'all', search: '', sort: 'popular' };
const $ = (selector) => document.querySelector(selector);
const number = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 });
const categoryName = (id) => state.categories.find((item) => item.id === id)?.name ?? id;
const difficulty = { beginner: '쉬움', intermediate: '보통', advanced: '어려움' };
const usage = { web: '웹에서 바로', desktop: '앱 설치', cli: '터미널', docker: 'Docker', source: '소스 실행' };
const guideType = { web: '설치 없이 웹에서', 'desktop-installer': '공식 설치 파일', 'release-download': '파일을 받아 실행', 'package-manager': '패키지 관리자로 설치', docker: 'Docker로 실행', 'installer-cli': '설치 후 터미널 실행' };
const maintenance = { active: '활발히 관리 중', caution: '업데이트 확인 필요', inactive: '관리 중단' };
const updatedDate = (value) => value ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short' }).format(new Date(value)) : '확인 중';
const prerequisiteResources = [
  { matches: /Docker Desktop|docker /i, name: 'Docker Desktop', check: 'docker --version', url: 'https://docs.docker.com/desktop/setup/install/' },
  { matches: /Homebrew|brew /i, name: 'Homebrew', check: 'brew --version', url: 'https://docs.brew.sh/Installation' },
  { matches: /winget/i, name: 'WinGet', check: 'winget --version', url: 'https://learn.microsoft.com/windows/package-manager/winget/' },
  { matches: /Visual C\+\+/i, name: 'Visual C++ 재배포 가능 패키지', url: 'https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist' },
  { matches: /7-Zip/i, name: '7-Zip', url: 'https://www.7-zip.org/' },
];
const e = (value) => escapeHtml(String(value ?? ''));
const safeUrl = (value) => {
  try {
    const url = new URL(String(value), window.location.origin);
    return ['https:', 'http:'].includes(url.protocol) ? e(url.href) : '#';
  } catch { return '#'; }
};

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`요청 실패: ${response.status}`);
  return response.json();
}

async function initialize() {
  try {
    const [categories, repositories, trending] = await Promise.all([
      getJson('/api/categories'), getJson('/api/repositories?limit=100'), getJson('/api/trending?limit=5')
    ]);
    state.categories = categories.items;
    state.repositories = repositories.items;
    renderCategories();
    renderRepositories();
    renderTrending(trending.items);
    bindEvents();
  } catch (error) {
    $('#repository-grid').innerHTML = `<div class="empty-state"><strong>데이터를 불러오지 못했어요</strong><p>${e(error instanceof Error ? error.message : '알 수 없는 오류')}</p></div>`;
  }
}

function renderCategories() {
  $('#category-tabs').innerHTML = [{ id: 'all', name: '전체' }, ...state.categories]
    .map((item) => `<button type="button" data-category="${e(item.id)}" aria-pressed="${state.category === item.id}" class="${state.category === item.id ? 'active' : ''}">${e(item.name)}</button>`).join('');
}

function filteredRepositories() {
  const search = state.search.toLocaleLowerCase('ko');
  return state.repositories.filter((repo) => {
    const categoryMatch = state.category === 'all' || repo.category === state.category;
    const searchMatch = !search || [repo.id, repo.summary, repo.whatItIs, ...repo.tags].join(' ').toLocaleLowerCase('ko').includes(search);
    return categoryMatch && searchMatch;
  }).sort((a, b) => state.sort === 'trending'
    ? (b.trendScore ?? 0) - (a.trendScore ?? 0)
    : state.sort === 'updated'
      ? Date.parse(b.lastPushedAt) - Date.parse(a.lastPushedAt)
      : b.stars - a.stars);
}

function renderRepositories() {
  const items = filteredRepositories();
  $('#empty-state').hidden = items.length > 0;
  $('#repository-grid').innerHTML = items.map((repo) => `
    <article class="repo-card" data-repo="${e(repo.id)}" tabindex="0" role="button" aria-label="${e(repo.name)} 상세 사용법 보기">
      <div class="repo-top"><div class="repo-avatar">${e(repo.name[0]?.toUpperCase())}</div><div class="repo-title"><h3>${e(repo.name)}</h3><span>${e(repo.owner)} · ${e(categoryName(repo.category))}</span></div><span class="level">${e(difficulty[repo.difficulty])}</span></div>
      <p>${e(repo.summary)}</p>
      <div class="tags">${repo.tags.slice(0, 4).map((tag) => `<span class="tag">#${e(tag)}</span>`).join('')}</div>
      <div class="repo-data"><span>${e(guideType[repo.guideType])}</span><span>${e(repo.platforms.join(' · '))}</span></div>
      <div class="repo-footer"><span>★ ${e(number.format(repo.stars))}</span><span>${e(usage[repo.usageType])}</span><b>사용법 보기 →</b></div>
    </article>`).join('');
}

function renderTrending(items) {
  $('#trending-grid').innerHTML = items.map((repo, index) => `
    <article class="trend-card" data-repo="${e(repo.id)}" tabindex="0" role="button" aria-label="${e(repo.name)} 상세 사용법 보기">
      <div class="trend-rank"><span class="rank">0${index + 1}</span><span class="growth">↗ +${e(number.format(repo.dailyStarGrowth ?? 0))}</span></div>
      <h3>${e(repo.name)}</h3><p>${e(repo.summary)}</p>
      <div class="card-meta"><span>★ ${e(number.format(repo.stars))}</span><span>${e(categoryName(repo.category))}</span></div>
    </article>`).join('');
}

function bindEvents() {
  $('#category-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    state.category = button.dataset.category; renderCategories(); renderRepositories();
  });
  $('#search-input').addEventListener('input', (event) => { state.search = event.target.value; renderRepositories(); });
  $('#sort-select').addEventListener('change', (event) => { state.sort = event.target.value; renderRepositories(); });
  document.addEventListener('click', (event) => {
    const card = event.target.closest('.repo-card[data-repo], .trend-card[data-repo]'); if (card) openRepository(card.dataset.repo);
    if (event.target.closest('.dialog-close')) closeRepository();
    if (event.target === $('#detail-dialog')) closeRepository();
    const guideLink = event.target.closest('[data-action="show-guide"]');
    if (guideLink) { event.preventDefault(); $('#detail-dialog').querySelector('.guide-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (event.target.closest('[data-action="show-trending"]')) { state.sort='trending'; $('#sort-select').value='trending'; renderRepositories(); $('#explore').scrollIntoView(); }
    const copy = event.target.closest('[data-copy]'); if (copy) copyCommand(copy);
    const platform = event.target.closest('[data-platform]'); if (platform) renderGuide(platform.dataset.repo, platform.dataset.platform);
  });
  document.addEventListener('keydown', (event) => { const card=event.target.closest?.('[data-repo]'); if(card && (event.key==='Enter'||event.key===' ')){event.preventDefault();openRepository(card.dataset.repo);} });
  $('#detail-dialog').addEventListener('close', () => { document.body.classList.remove('dialog-open'); state.lastFocused?.focus(); });
}

function openRepository(id) {
  const repo = state.repositories.find((item) => item.id === id); if (!repo) return;
  state.lastFocused = document.activeElement;
  $('#detail-content').innerHTML = `
    <section class="detail-hero"><div class="detail-top"><div class="repo-avatar">${e(repo.name[0]?.toUpperCase())}</div><div><span class="eyebrow">${e(categoryName(repo.category))}</span><h2 id="detail-title">${e(repo.name)}</h2><small>${e(repo.owner)}/${e(repo.name)}</small></div></div><p>${e(repo.summary)}</p><div class="detail-actions"><a href="#guide" data-action="show-guide">사용 방법 보기 ↓</a><a class="secondary" href="${safeUrl(repo.githubUrl)}" target="_blank" rel="noopener noreferrer">GitHub 원문 ↗</a></div></section>
    <div class="detail-body"><div class="facts"><div class="fact"><span>난이도</span><strong>${e(difficulty[repo.difficulty])}</strong></div><div class="fact"><span>시작 방법</span><strong>${e(guideType[repo.guideType])}</strong></div><div class="fact"><span>API 키</span><strong>${repo.apiKeyRequired === false ? '필요 없음' : repo.apiKeyRequired === true ? '필요함' : '확인 필요'}</strong></div><div class="fact"><span>관리 상태</span><strong>${e(maintenance[repo.maintenanceStatus])}</strong></div></div>
    <div class="cost-note"><span>비용 안내</span><p>${e(repo.costSummary)}</p></div>
    <div class="detail-grid"><div><h3>어떤 도구인가요?</h3><p>${e(repo.whatItIs)}</p><h3>어떤 문제를 해결하나요?</h3><p>${e(repo.problemSolved)}</p></div><div><h3>이런 분께 추천해요</h3><ul>${repo.recommendedFor.map((x)=>`<li>${e(x)}</li>`).join('')}</ul><h3>핵심 기능</h3><ul>${repo.keyFeatures.map((x)=>`<li>${e(x)}</li>`).join('')}</ul></div></div>
    <section class="guide-area" id="guide"><span class="eyebrow">첫 실행 가이드 · 약 ${e(repo.guide.estimatedMinutes)}분</span><h3>어떤 환경에서 사용하시나요?</h3><div class="platform-tabs">${repo.guide.platforms.map((p,i)=>`<button type="button" data-platform="${e(p.name)}" data-repo="${e(repo.id)}" aria-pressed="${i===0}" class="${i===0?'active':''}">${e(p.name)}</button>`).join('')}</div><div id="guide-steps"></div></section>
    <section class="source-info"><div><span>라이선스</span><strong>${e(repo.license || '공식 저장소에서 확인')}</strong></div><div><span>가이드 검증일</span><strong>${e(repo.guide.verifiedAt)}</strong></div><div><span>최근 코드 업데이트</span><strong>${e(updatedDate(repo.lastPushedAt))}</strong></div><a href="${safeUrl(repo.guide.officialDocsUrl)}" target="_blank" rel="noopener noreferrer">공식 사용 문서 확인 ↗</a></section></div>`;
  renderGuide(repo.id, repo.guide.platforms[0].name);
  $('#detail-dialog').showModal();
  document.body.classList.add('dialog-open');
  $('#detail-dialog').scrollTop = 0;
  $('.dialog-close').focus();
}

function closeRepository() { if ($('#detail-dialog').open) $('#detail-dialog').close(); }

function renderGuide(id, platformName) {
  const repo=state.repositories.find((item)=>item.id===id); const platform=repo?.guide.platforms.find((item)=>item.name===platformName); if(!platform)return;
  document.querySelectorAll('.platform-tabs button').forEach((button)=>{ const active=button.dataset.platform===platformName; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
  const prerequisiteText = [...(repo.guide.prerequisites || []), ...platform.steps.flatMap((step)=>[step.title, step.description, step.command || ''])].join(' ');
  const resources = prerequisiteResources.filter((item)=>item.matches.test(prerequisiteText));
  const resourceLinks = resources.length ? `<div class="prerequisite-links">${resources.map((item)=>`<div><span><b>${e(item.name)}</b>${item.check?`<code>${e(item.check)}</code>`:''}</span><a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">설치되지 않았다면 공식 안내 보기 ↗</a></div>`).join('')}</div>` : '';
  const prerequisites = repo.guide.prerequisites?.length
    ? `<section class="guide-info"><h4>시작하기 전에 준비해 주세요</h4><ul>${repo.guide.prerequisites.map((item)=>`<li>${e(item)}</li>`).join('')}</ul>${resourceLinks}</section>` : '';
  const commonIssues = repo.guide.commonIssues?.length
    ? `<section class="guide-info"><h4>막혔을 때 확인해 보세요</h4>${repo.guide.commonIssues.map((item)=>`<details><summary>${e(item.problem)}</summary><p>${e(item.solution)}</p></details>`).join('')}</section>` : '';
  const cleanup = repo.guide.stopInstructions || repo.guide.uninstallInstructions
    ? `<section class="guide-info"><h4>종료하거나 삭제하려면</h4>${repo.guide.stopInstructions?`<p><b>종료</b> ${e(repo.guide.stopInstructions)}</p>`:''}${repo.guide.uninstallInstructions?`<p><b>삭제</b> ${e(repo.guide.uninstallInstructions)}</p>`:''}</section>` : '';
  $('#guide-steps').innerHTML = `${prerequisites}${platform.terminalHelp ? `<div class="terminal-help"><b>먼저 터미널을 열어볼게요</b><ol>${platform.terminalHelp.map((x)=>`<li>${e(x)}</li>`).join('')}</ol></div>`:''}${platform.steps.map((step)=>`<div class="guide-step"><span class="step-number">${e(step.order)}</span><div><h4>${e(step.title)}</h4><p>${e(step.description)}</p>${step.command?`<div class="command"><code>${e(step.command)}</code><button type="button" data-copy="${e(encodeURIComponent(step.command))}" aria-label="명령어 복사">복사</button></div>`:''}${step.expectedResult?`<div class="success">✓ ${e(step.expectedResult)}</div>`:''}${step.warning?`<div class="warning">주의: ${e(step.warning)}</div>`:''}</div></div>`).join('')}<div class="result-note"><span>✓</span><div><b>첫 실행 결과</b><p>${e(repo.guide.firstRunResult)}</p></div></div>${commonIssues}${cleanup}`;
}

async function copyCommand(button) {
  const command = decodeURIComponent(button.dataset.copy);
  const original=button.textContent;
  try {
    await navigator.clipboard.writeText(command);
    button.textContent='복사됨';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(button.previousElementSibling);
    selection.removeAllRanges(); selection.addRange(range);
    button.textContent='직접 복사해 주세요';
  }
  setTimeout(()=>button.textContent=original,1600);
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
initialize();
