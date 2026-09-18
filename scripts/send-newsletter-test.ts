import { readFile } from "node:fs/promises";

const apiKey = process.env.BUTTONDOWN_API_KEY?.trim();
const recipient = process.env.NEWSLETTER_TEST_RECIPIENT?.trim();
const subject = "이번 주 바로 써볼 오픈소스 3개";
const body = await readFile(new URL("../newsletter/first-issue.html", import.meta.url), "utf8");
if (!body.startsWith("<!-- buttondown-editor-mode: fancy -->") || !body.includes("<table") || !body.includes("style=")) {
  throw new Error("스타일이 포함된 Buttondown HTML 본문이 필요합니다.");
}

if (process.argv.includes("--dry-run")) {
  console.log(`초안 확인 완료: ${subject} (${body.length}자)`);
  process.exit(0);
}

if (!apiKey) throw new Error("BUTTONDOWN_API_KEY GitHub Actions Secret이 필요합니다.");
if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  throw new Error("유효한 NEWSLETTER_TEST_RECIPIENT 이메일 주소가 필요합니다.");
}

async function buttondown(path: string, data: unknown) {
  const response = await fetch(`https://api.buttondown.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Buttondown 요청 실패 (${path}): HTTP ${response.status}`);
  const responseBody = await response.text();
  return responseBody.trim() ? JSON.parse(responseBody) : {};
}

const draft = await buttondown("/emails", { subject, body, status: "draft" });
if (typeof draft.id !== "string") throw new Error("Buttondown 초안 ID를 받지 못했습니다.");

await buttondown(`/emails/${encodeURIComponent(draft.id)}/send-draft`, { recipients: [recipient] });
console.log(`테스트 메일 발송 요청 완료. 초안 ID: ${draft.id}`);
