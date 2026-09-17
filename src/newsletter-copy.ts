import type { Repository } from "./domain.ts";

export type NewsletterTheme =
  | "easy-start"
  | "productivity"
  | "local-first"
  | "ai"
  | "creative"
  | "collaboration"
  | "vibe-coding"
  | "device-files"
  | "rediscovered"
  | "mixed";

interface IntroTemplate {
  id: string;
  text: string;
}

export interface NewsletterIntro {
  id: string;
  theme: NewsletterTheme;
  text: string;
}

export interface NewsletterIntroOptions {
  issueKey?: string;
  recentIntroIds?: string[];
  rediscoveredRepositoryIds?: string[];
}

const difficultyLabels: Record<Repository["difficulty"], string> = {
  beginner: "쉬움",
  intermediate: "보통",
  advanced: "어려움",
};

export function formatNewsletterInstallation(repository: Repository) {
  return {
    difficulty: difficultyLabels[repository.difficulty],
    difficultyText: `설치 난이도 ${difficultyLabels[repository.difficulty]}`,
    estimatedMinutes: repository.guide.estimatedMinutes,
  };
}

export const newsletterIntroTemplates: Record<NewsletterTheme, IntroTemplate[]> = {
  "easy-start": [
    { id: "easy-1", text: "이번 주에는 복잡한 설정 없이 바로 시작할 수 있는 도구들이 눈에 띄었어요. 오픈소스가 처음이어도 부담 없이 써볼 만한 세 가지를 골랐습니다." },
    { id: "easy-2", text: "설치 때문에 망설이지 않아도 되는 도구들을 모았어요. 내려받아 실행하면 금방 쓸 수 있는 오픈소스 세 가지를 소개합니다." },
    { id: "easy-3", text: "좋은 도구라도 시작하기 어려우면 손이 잘 가지 않죠. 이번 주에는 첫 실행까지 비교적 간단한 프로젝트를 골라봤어요." },
  ],
  productivity: [
    { id: "work-1", text: "반복해서 하던 일을 조금 덜어주는 도구들을 골랐어요. 거창한 설정 없이도 일상과 업무에 바로 활용할 수 있는 세 가지입니다." },
    { id: "work-2", text: "이번 주에는 시간을 아껴주는 오픈소스가 많이 눈에 띄었어요. 자주 반복하는 일을 더 간단하게 만들어줄 도구들을 소개합니다." },
    { id: "work-3", text: "매번 귀찮다고 생각하면서도 계속 손으로 하던 일이 있나요? 이번 주에는 그런 일을 대신해 줄 만한 도구 세 가지를 골랐습니다." },
  ],
  "local-first": [
    { id: "local-1", text: "이번 주에는 자료를 다른 서비스에 올리지 않고 내 컴퓨터에서 직접 사용할 수 있는 도구들을 골랐어요. 조금 더 마음 편히 써볼 수 있는 세 가지입니다." },
    { id: "local-2", text: "가입하거나 파일을 업로드하지 않아도 사용할 수 있는 오픈소스들이 눈에 띄었어요. 내 컴퓨터 안에서 직접 실행할 수 있는 도구들을 소개합니다." },
    { id: "local-3", text: "온라인 서비스가 편하긴 하지만 파일을 외부로 보내기 조심스러울 때도 있죠. 이번 주에는 내 컴퓨터에서 실행되는 도구 세 가지를 준비했어요." },
  ],
  ai: [
    { id: "ai-1", text: "AI를 써보고 싶지만 무엇부터 시작해야 할지 막막한 사람을 위해 골랐어요. 직접 설치하고 활용해 볼 만한 오픈소스 세 가지를 소개합니다." },
    { id: "ai-2", text: "이번 주에는 AI를 조금 더 내 방식대로 활용할 수 있는 도구들이 주목받았어요. 처음 실행하는 과정부터 차근차근 살펴봤습니다." },
    { id: "ai-3", text: "꼭 복잡한 개발 지식이 있어야 AI 도구를 사용할 수 있는 건 아니에요. 이번 주에는 비교적 쉽게 시작할 수 있는 프로젝트를 골랐습니다." },
  ],
  creative: [
    { id: "creative-1", text: "만들고 싶은 것은 있는데 적당한 도구를 찾지 못했다면 이번 편지를 살펴보세요. 디자인과 창작 작업에 활용하기 좋은 오픈소스를 골랐습니다." },
    { id: "creative-2", text: "이번 주에는 이미지, 영상, 디자인 작업을 조금 더 자유롭게 만들어주는 도구들이 눈에 띄었어요. 직접 써볼 만한 세 가지를 소개합니다." },
    { id: "creative-3", text: "비싼 프로그램을 결제하기 전에 먼저 살펴볼 만한 도구들이 있어요. 창작 작업에 활용할 수 있는 오픈소스 세 가지를 준비했습니다." },
  ],
  collaboration: [
    { id: "collab-1", text: "개발자가 아니어도 알아두면 좋은 도구들을 골랐어요. 개발자와 협업하거나 직접 서비스를 만들어볼 때 도움이 되는 세 가지입니다." },
    { id: "collab-2", text: "기획이나 디자인 업무를 하다 보면 개발 도구가 필요한 순간이 생기죠. 처음 접하는 사람도 따라가 볼 만한 프로젝트를 소개합니다." },
    { id: "collab-3", text: "개발팀과 더 원활하게 이야기하고 싶은 사람을 위해 준비했어요. 결과를 직접 확인하고 공유하는 데 도움이 되는 도구 세 가지입니다." },
  ],
  "vibe-coding": [
    { id: "vibe-1", text: "아이디어를 직접 서비스로 만들어보고 싶은 사람을 위해 골랐어요. 코드를 잘 몰라도 AI와 함께 시작해 볼 수 있는 도구들입니다." },
    { id: "vibe-2", text: "요즘은 개발 경험이 많지 않아도 작은 서비스를 직접 만들어볼 수 있죠. 이번 주에는 그런 시도를 도와줄 오픈소스 세 가지를 소개합니다." },
    { id: "vibe-3", text: "머릿속 아이디어를 화면으로 옮기는 데 도움이 되는 도구들이 주목받았어요. AI와 함께 만들 때 활용하기 좋은 프로젝트를 골랐습니다." },
  ],
  "device-files": [
    { id: "files-1", text: "기기 사이에서 파일을 옮기거나 자료를 공유할 때 유용한 도구들을 골랐어요. 설치해 두면 종종 생각날 만한 오픈소스 세 가지입니다." },
    { id: "files-2", text: "사진 한 장을 옮기려고 메신저나 클라우드를 거치는 일이 번거로울 때가 있죠. 이번 주에는 기기와 파일을 간편하게 연결하는 도구를 소개합니다." },
    { id: "files-3", text: "컴퓨터와 휴대폰을 오가며 일하는 사람에게 유용한 프로젝트들이 눈에 띄었어요. 일상에서 바로 활용할 수 있는 세 가지를 준비했습니다." },
  ],
  rediscovered: [
    { id: "again-1", text: "예전에 소개했던 도구들이 새로운 기능과 함께 다시 주목받고 있어요. 무엇이 달라졌고 지금 다시 살펴볼 이유가 있는지 정리했습니다." },
    { id: "again-2", text: "이미 이름을 들어본 도구가 있을 수도 있어요. 최근 업데이트로 사용 방법과 기능이 달라진 프로젝트 세 가지를 다시 살펴봤습니다." },
    { id: "again-3", text: "새로 등장한 프로젝트만 중요한 것은 아니죠. 이번 주에는 큰 업데이트를 거쳐 다시 눈에 띄기 시작한 도구들을 골랐어요." },
  ],
  mixed: [
    { id: "mixed-1", text: "이번 주에도 흥미로운 오픈소스가 여럿 등장했어요. 용도는 서로 다르지만 직접 써볼 만한 세 가지를 골라 쉽게 정리했습니다." },
    { id: "mixed-2", text: "많은 프로젝트 중에서 지금 알아두면 좋을 도구 세 가지를 골랐어요. 무엇을 할 수 있고 어떻게 시작하는지 함께 살펴볼게요." },
    { id: "mixed-3", text: "이번 주에 새롭게 주목받은 프로젝트를 하나씩 살펴봤어요. 그중 실제로 활용하기 좋고 첫 실행까지 안내할 수 있는 세 가지를 소개합니다." },
  ],
};

function searchable(repository: Repository) {
  return [repository.name, repository.summary, repository.whatItIs, repository.problemSolved, ...repository.tags]
    .join(" ")
    .toLocaleLowerCase("ko");
}

function count(repositories: Repository[], predicate: (repository: Repository) => boolean) {
  return repositories.filter(predicate).length;
}

export function classifyNewsletterTheme(
  repositories: Repository[],
  rediscoveredRepositoryIds: string[] = [],
): NewsletterTheme {
  const rediscovered = new Set(rediscoveredRepositoryIds.map((id) => id.toLocaleLowerCase("en")));
  if (repositories.some((repository) => rediscovered.has(repository.id.toLocaleLowerCase("en")))) return "rediscovered";

  const contains = (repository: Repository, pattern: RegExp) => pattern.test(searchable(repository));
  if (count(repositories, (repository) => contains(repository, /vibe|바이브|coding agent|코딩 에이전트/)) >= 2) return "vibe-coding";
  if (count(repositories, (repository) => contains(repository, /local-first|self-host|offline|로컬 실행|내 컴퓨터/)) >= 2) return "local-first";
  if (count(repositories, (repository) => repository.category === "ai-automation") >= 2) return "ai";
  if (count(repositories, (repository) => repository.category === "design" || repository.category === "content-media") >= 2) return "creative";
  if (count(repositories, (repository) => contains(repository, /file transfer|file sharing|파일 전송|파일 공유|기기.*연결/)) >= 2) return "device-files";
  if (count(repositories, (repository) => repository.category === "developer-tools") >= 2) return "collaboration";
  if (count(repositories, (repository) => repository.category === "productivity") >= 2) return "productivity";
  if (count(repositories, (repository) => repository.difficulty === "beginner") >= 2) return "easy-start";
  return "mixed";
}

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hash % length;
}

export function selectNewsletterIntro(
  repositories: Repository[],
  options: NewsletterIntroOptions = {},
): NewsletterIntro {
  const theme = classifyNewsletterTheme(repositories, options.rediscoveredRepositoryIds);
  const recent = new Set(options.recentIntroIds ?? []);
  const available = newsletterIntroTemplates[theme].filter((template) => !recent.has(template.id));
  const candidates = available.length > 0 ? available : newsletterIntroTemplates[theme];
  const issueKey = options.issueKey ?? repositories.map((repository) => repository.id).sort().join("|");
  const selected = candidates[stableIndex(`${theme}:${issueKey}`, candidates.length)];
  return { ...selected, theme };
}
