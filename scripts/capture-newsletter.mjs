import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = await mkdtemp(join(tmpdir(), 'easy-open-source-preview-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=9334', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let id = 0;
const pending = new Map();

async function target() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const pages = await fetch('http://127.0.0.1:9334/json').then((response) => response.json());
      const page = pages.find((item) => item.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await pause(100);
  }
  throw new Error('Chrome did not start');
}

function send(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}

try {
  const page = await target();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    message.error ? task.reject(new Error(message.error.message)) : task.resolve(message);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:4180/newsletter-preview.html' });
  await pause(3000);
  const inspection = await send('Runtime.evaluate', { expression: "({url:location.href,title:document.title,body:document.body?.innerText.slice(0,80)})", returnByValue: true });
  if (!inspection.result.result.value?.body) throw new Error(`Page did not render: ${JSON.stringify(inspection.result.result.value)}`);
  const bounds = await send('Runtime.evaluate', { expression: "(()=>{const el=document.querySelector('#newsletter');return {x:el.offsetLeft,y:el.offsetTop,width:el.offsetWidth,height:Math.min(el.offsetHeight,1000)}})()", returnByValue: true });
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { ...bounds.result.result.value, scale: 1 } });
  await writeFile(new URL('../artifacts/screenshots/newsletter-desktop.png', import.meta.url), Buffer.from(result.result.data, 'base64'));
} finally {
  socket?.close();
  const exited = chrome.exitCode === null ? once(chrome, 'exit') : Promise.resolve();
  chrome.kill('SIGTERM');
  await Promise.race([exited, pause(2000)]);
  if (chrome.exitCode === null) chrome.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
