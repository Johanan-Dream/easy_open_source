import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333;
const profile = await mkdtemp(join(tmpdir(), 'easy-open-source-audit-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let nextId = 0;
const pending = new Map();

async function debuggerTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await pause(100);
  }
  throw new Error('Chrome debugging endpoint did not start.');
}

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  const remote = response.result?.result;
  if (remote?.subtype === 'error') throw new Error(remote.description);
  if (!('value' in (remote || {}))) throw new Error(`Unexpected evaluate response: ${JSON.stringify(response)}`);
  return remote.value;
}

async function navigate(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 620 });
  await send('Page.navigate', { url: 'http://localhost:4173' });
  await pause(800);
}

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail });
}

try {
  const target = await debuggerTarget();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const task = pending.get(message.id); pending.delete(message.id);
    message.error ? task.reject(new Error(message.error.message)) : task.resolve(message);
  };

  await send('Page.enable');
  await send('Runtime.enable');

  await navigate(390, 844);
  const mobile = await evaluate(`({
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cards: document.querySelectorAll('.repo-card').length,
    columns: getComputedStyle(document.querySelector('.repository-grid')).gridTemplateColumns,
  })`);
  check('모바일 가로 넘침 없음', mobile.scrollWidth === mobile.clientWidth, mobile);
  check('모바일 프로젝트 1열', !mobile.columns.includes(' '), mobile.columns);

  const search = await evaluate(`(() => {
    const input=document.querySelector('#search-input'); input.value='ollama';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    return [...document.querySelectorAll('.repo-card')].map((item)=>item.dataset.repo);
  })()`);
  check('검색 결과 일치', search.length === 1 && search[0] === 'ollama/ollama', search);

  const interaction = await evaluate(`(async()=>{
    const card=document.querySelector('.repo-card'); card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    await new Promise((resolve)=>setTimeout(resolve,50));
    const dialog=document.querySelector('#detail-dialog');
    dialog.querySelector('[data-action="show-guide"]')?.click();
    await new Promise((resolve)=>setTimeout(resolve,450));
    const windows=[...dialog.querySelectorAll('[data-platform]')].find((item)=>item.dataset.platform==='Windows');
    windows?.click();
    const result={
      open:dialog.open,
      title:dialog.querySelector('#detail-title')?.textContent,
      windowsSelected:windows?.getAttribute('aria-pressed'),
      guideSteps:dialog.querySelectorAll('.guide-step').length,
      scrolledToGuide:dialog.scrollTop > 0,
    };
    dialog.close();
    await new Promise((resolve)=>setTimeout(resolve,0));
    result.focusReturned=document.activeElement===card;
    return result;
  })()`);
  check('상세 모달 열림', interaction.open && interaction.title === 'ollama', interaction);
  check('사용 방법으로 자동 이동', interaction.scrolledToGuide, interaction);
  check('Windows 가이드 전환', interaction.windowsSelected === 'true' && interaction.guideSteps > 0, interaction);
  check('닫은 뒤 카드로 포커스 복귀', interaction.focusReturned, interaction);

  await navigate(1440, 1000);
  const desktop = await evaluate(`({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cards: document.querySelectorAll('.repo-card').length,
    columns: getComputedStyle(document.querySelector('.repository-grid')).gridTemplateColumns,
  })`);
  check('데스크톱 가로 넘침 없음', desktop.scrollWidth === desktop.clientWidth, desktop);
  check('전체 프로젝트 60개', desktop.cards === 60, desktop.cards);
  check('데스크톱 프로젝트 2열', desktop.columns.split(' ').length === 2, desktop.columns);

  for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'}  ${item.name}`, item.detail);
  const failures = checks.filter((item) => !item.pass);
  if (failures.length) process.exitCode = 1;
} finally {
  socket?.close();
  const exited = chrome.exitCode === null ? once(chrome, 'exit') : Promise.resolve();
  chrome.kill('SIGTERM');
  await Promise.race([exited, pause(2_000)]);
  if (chrome.exitCode === null) chrome.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
