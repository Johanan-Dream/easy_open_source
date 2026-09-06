import { writeFile } from "node:fs/promises";

const verifiedAt = "2026-08-25";
const projects = [
  ["AppFlowy-IO/AppFlowy", "productivity", "AppFlowy", "문서와 할 일을 한곳에서 정리하는 로컬 우선 협업 도구예요.", "Notion과 비슷한 문서·데이터베이스 작업 공간을 직접 관리할 수 있습니다.", ["Windows", "macOS"], "desktop-installer", "beginner", "desktop", ["문서 편집", "칸반과 데이터베이스", "로컬 데이터 관리"]],
  ["penpot/penpot", "design", "Penpot", "브라우저에서 화면을 설계하고 개발자와 디자인 값을 공유하는 도구예요.", "별도 프로그램 설치 없이 UI 시안과 프로토타입을 공동 편집할 수 있습니다.", ["Web"], "web", "beginner", "web", ["UI 디자인", "프로토타입", "개발자 전달"]],
  ["laurent22/joplin", "productivity", "Joplin", "마크다운 메모와 할 일을 내 파일로 보관하는 노트 앱이에요.", "메모를 서비스 한곳에 묶지 않고 여러 기기에서 동기화할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["마크다운 메모", "할 일 관리", "종단간 암호화 동기화"]],
  ["dbeaver/dbeaver", "data", "DBeaver", "여러 종류의 데이터베이스를 표와 화면으로 다루는 데스크톱 도구예요.", "명령어만 쓰지 않고 데이터베이스 연결과 조회 결과를 한 화면에서 확인할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["DB 연결", "SQL 편집", "데이터 표 보기"]],
  ["beekeeper-studio/beekeeper-studio", "data", "Beekeeper Studio", "데이터베이스를 친숙한 표 화면으로 살펴보는 SQL 편집기예요.", "초보자도 연결 정보를 입력해 테이블과 쿼리 결과를 확인할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["SQL 편집", "테이블 탐색", "여러 DB 지원"]],
  ["usebruno/bruno", "developer-tools", "Bruno", "API 요청 모음을 파일로 저장해 Git으로 함께 관리하는 도구예요.", "API 테스트 내용을 온라인 계정 대신 프로젝트 파일로 공유할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["API 요청 테스트", "파일 기반 컬렉션", "Git 협업"]],
  ["microsoft/vscode", "developer-tools", "Visual Studio Code", "코드와 설정 파일을 편집하고 확장 기능을 추가하는 무료 편집기예요.", "여러 언어의 파일을 한 앱에서 열고 검색·수정·실행할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["코드 편집", "통합 터미널", "확장 기능"]],
  ["notepad-plus-plus/notepad-plus-plus", "productivity", "Notepad++", "Windows에서 큰 텍스트와 코드 파일을 빠르게 여는 편집기예요.", "기본 메모장보다 편한 검색, 탭, 문법 강조 기능을 제공합니다.", ["Windows"], "desktop-installer", "beginner", "desktop", ["탭 편집", "문법 강조", "파일 비교와 검색"]],
  ["keepassxreboot/keepassxc", "security", "KeePassXC", "비밀번호를 암호화된 파일 하나에 보관하는 오프라인 관리 도구예요.", "계정 정보를 외부 서비스에 맡기지 않고 직접 백업하고 관리할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["로컬 암호화 금고", "비밀번호 생성", "브라우저 연동"]],
  ["syncthing/syncthing", "productivity", "Syncthing", "내 기기끼리 폴더를 직접 동기화하는 파일 전송 도구예요.", "중앙 클라우드 저장소 없이 여러 컴퓨터의 폴더를 같은 상태로 유지합니다.", ["Windows", "macOS", "Linux"], "release-download", "intermediate", "desktop", ["기기간 동기화", "변경 감지", "웹 관리 화면"]],
  ["nextcloud/desktop", "productivity", "Nextcloud Desktop", "Nextcloud 서버의 파일을 컴퓨터 폴더와 동기화하는 앱이에요.", "팀이나 개인 Nextcloud 저장소를 탐색기와 Finder에서 바로 사용할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["폴더 동기화", "선택 동기화", "충돌 알림"]],
  ["KDE/krita", "design", "Krita", "디지털 드로잉과 일러스트 작업을 위한 무료 페인팅 앱이에요.", "유료 드로잉 프로그램 없이 브러시와 레이어를 활용해 그림을 제작할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["브러시 엔진", "레이어", "애니메이션 작업 공간"]],
  ["audacity/audacity", "content-media", "Audacity", "음성을 녹음하고 잘라내며 소리를 보정하는 오디오 편집기예요.", "인터뷰, 내레이션, 효과음을 한 화면에서 녹음하고 편집할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["오디오 녹음", "파형 편집", "효과 적용"]],
  ["HandBrake/HandBrake", "content-media", "HandBrake", "영상 파일의 용량과 형식을 바꾸는 무료 변환 도구예요.", "기기나 업로드 조건에 맞게 영상을 MP4 등으로 변환할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["영상 변환", "기기별 프리셋", "자막과 챕터"]],
  ["ShareX/ShareX", "content-media", "ShareX", "Windows 화면을 캡처하고 표시를 더해 저장하는 생산성 도구예요.", "영역 캡처부터 간단한 편집과 파일 저장까지 반복 작업을 줄입니다.", ["Windows"], "desktop-installer", "beginner", "desktop", ["영역 캡처", "화면 녹화", "자동 작업"]],
  ["flameshot-org/flameshot", "content-media", "Flameshot", "캡처 직후 화살표와 글자를 바로 추가하는 화면 캡처 도구예요.", "별도 편집기를 열지 않고 설명이 들어간 스크린샷을 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["영역 캡처", "즉시 주석", "클립보드 복사"]],
  ["inkscape/inkscape", "design", "Inkscape", "로고와 아이콘 같은 벡터 그래픽을 만드는 무료 편집기예요.", "크기를 키워도 깨지지 않는 SVG 그림과 인쇄물을 제작할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["SVG 편집", "도형과 경로", "텍스트와 내보내기"]],
  ["KDE/kdenlive", "content-media", "Kdenlive", "여러 영상과 소리를 타임라인에서 편집하는 무료 영상 편집기예요.", "유료 편집 프로그램 없이 컷 편집, 자막, 전환 효과를 적용할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["다중 트랙 편집", "자막", "프록시 편집"]],
  ["standardnotes/app", "productivity", "Standard Notes", "암호화된 메모를 여러 기기에서 동기화하는 노트 앱이에요.", "개인 메모를 종단간 암호화해 보관하고 컴퓨터와 휴대폰에서 이어서 쓸 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["암호화 메모", "기기간 동기화", "마크다운 편집"]],
  ["cryptomator/cryptomator", "security", "Cryptomator", "클라우드 폴더의 파일을 업로드 전에 암호화하는 도구예요.", "Dropbox나 Google Drive에 올리는 파일 내용을 서비스 제공자가 바로 읽기 어렵게 보호합니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["클라이언트 암호화", "가상 드라이브", "클라우드 호환"]],
  ["rustdesk/rustdesk", "productivity", "RustDesk", "다른 컴퓨터 화면에 원격으로 접속하고 조작하는 도구예요.", "상대방의 화면을 보며 문제를 해결하거나 내 컴퓨터에 원격 접속할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["원격 화면 제어", "파일 전송", "자체 서버 선택"]],
  ["mullvad/mullvadvpn-app", "security", "Mullvad VPN", "Mullvad VPN 연결을 관리하는 공식 오픈소스 앱이에요.", "공용 네트워크에서 VPN 연결 상태와 서버 위치를 한 화면에서 관리합니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["VPN 연결", "킬 스위치", "서버 위치 선택"]],
  ["qbittorrent/qBittorrent", "productivity", "qBittorrent", "토렌트 파일과 마그넷 링크를 내려받는 데스크톱 도구예요.", "광고가 포함된 상용 다운로드 도구 대신 공개된 클라이언트를 사용할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["토렌트 다운로드", "속도 제한", "웹 UI"]],
  ["transmission/transmission", "productivity", "Transmission", "가볍게 토렌트 다운로드를 관리하는 오픈소스 클라이언트예요.", "복잡한 설정 없이 다운로드 목록과 속도를 확인하고 제어할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["토렌트 다운로드", "원격 관리", "대역폭 제한"]],
  ["agalwood/Motrix", "productivity", "Motrix", "HTTP·FTP·토렌트 다운로드를 한곳에서 관리하는 앱이에요.", "여러 방식의 큰 파일 다운로드를 하나의 목록에서 일시정지하고 다시 시작할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["다중 방식 다운로드", "이어받기", "속도 제한"]],
  ["Eugeny/tabby", "developer-tools", "Tabby", "터미널과 SSH 연결을 탭으로 관리하는 데스크톱 앱이에요.", "여러 서버와 로컬 터미널 창을 하나의 인터페이스에서 전환할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["탭 터미널", "SSH 연결", "프로필 동기화"]],
  ["wez/wezterm", "developer-tools", "WezTerm", "빠른 렌더링과 다양한 설정을 지원하는 터미널 앱이에요.", "여러 터미널 탭과 창을 안정적으로 열고 설정 파일로 작업 환경을 관리할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["GPU 렌더링", "탭과 분할", "설정 파일"]],
  ["alacritty/alacritty", "developer-tools", "Alacritty", "단순하고 빠른 화면 출력에 집중한 터미널 앱이에요.", "무거운 부가 기능 없이 명령줄 작업을 빠르게 표시할 수 있습니다.", ["Windows", "macOS", "Linux"], "release-download", "intermediate", "desktop", ["빠른 렌더링", "다중 플랫폼", "설정 파일"]],
  ["desktop/desktop", "developer-tools", "GitHub Desktop", "Git 명령을 화면의 버튼과 변경 목록으로 다루는 앱이에요.", "터미널 명령을 외우지 않고 커밋·브랜치·동기화 작업을 시작할 수 있습니다.", ["Windows", "macOS"], "desktop-installer", "beginner", "desktop", ["변경 내용 확인", "커밋과 푸시", "브랜치 관리"]],
  ["jesseduffield/lazygit", "developer-tools", "lazygit", "터미널 안에서 Git 변경과 브랜치를 조작하는 화면형 도구예요.", "긴 Git 명령을 반복하지 않고 키보드로 상태 확인과 커밋 작업을 처리할 수 있습니다.", ["Windows", "macOS", "Linux"], "release-download", "intermediate", "cli", ["Git 상태 화면", "커밋 관리", "브랜치 전환"]],
  ["ventoy/Ventoy", "productivity", "Ventoy", "여러 ISO 파일을 USB 하나에서 선택해 부팅하는 도구예요.", "운영체제 설치 이미지를 바꿀 때마다 USB를 다시 포맷하는 작업을 줄입니다.", ["Windows", "Linux"], "release-download", "advanced", "desktop", ["멀티 ISO 부팅", "USB 재사용", "UEFI 지원"]],
  ["balena-io/etcher", "productivity", "balenaEtcher", "운영체제 이미지 파일을 USB나 SD 카드에 기록하는 앱이에요.", "복잡한 명령 없이 이미지·대상 드라이브·실행의 세 단계로 부팅 매체를 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["이미지 기록", "대상 검증", "다중 플랫폼"]],
  ["pbatard/rufus", "productivity", "Rufus", "Windows에서 부팅 가능한 USB를 만드는 작은 도구예요.", "Windows나 Linux 설치용 USB를 빠르게 만들고 파티션 방식을 선택할 수 있습니다.", ["Windows"], "release-download", "intermediate", "desktop", ["부팅 USB 제작", "ISO 선택", "파티션 방식 설정"]],
  ["ip7z/7zip", "productivity", "7-Zip", "압축 파일을 만들고 다양한 형식의 압축을 푸는 도구예요.", "기본 압축 기능에서 열리지 않는 7z·tar 등의 파일을 확인하고 관리할 수 있습니다.", ["Windows", "Linux"], "desktop-installer", "beginner", "desktop", ["7z 압축", "다양한 포맷 해제", "암호화 압축"]],
  ["peazip/PeaZip", "productivity", "PeaZip", "여러 압축 형식을 화면에서 열고 변환하는 파일 관리 도구예요.", "운영체제와 관계없이 압축 파일의 내용 확인, 분할, 암호화를 처리할 수 있습니다.", ["Windows", "Linux"], "desktop-installer", "beginner", "desktop", ["압축 해제", "분할 압축", "암호화"]],
  ["ONLYOFFICE/DesktopEditors", "productivity", "ONLYOFFICE Desktop Editors", "문서·스프레드시트·발표 파일을 편집하는 데스크톱 오피스예요.", "Microsoft Office 형식의 파일을 무료 데스크톱 앱에서 열고 편집할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["문서 편집", "스프레드시트", "프레젠테이션"]],
  ["jgraph/drawio-desktop", "design", "draw.io Desktop", "순서도와 구조도를 오프라인에서 그리는 데스크톱 앱이에요.", "브라우저 연결 없이 업무 흐름, 시스템 구조, 아이디어를 도형으로 정리할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["순서도", "다이어그램 템플릿", "로컬 파일 저장"]],
  ["godotengine/godot", "education", "Godot Engine", "2D·3D 게임과 인터랙티브 콘텐츠를 만드는 게임 엔진이에요.", "유료 엔진 비용 없이 장면, 스크립트, 그래픽을 결합해 실행 가능한 프로젝트를 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "release-download", "intermediate", "desktop", ["2D·3D 엔진", "장면 편집", "다중 플랫폼 내보내기"]],
  ["LMMS/lmms", "content-media", "LMMS", "비트와 멜로디를 배치해 음악을 만드는 무료 제작 도구예요.", "악기 연주 녹음 없이도 패턴과 가상 악기로 음악 초안을 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["비트 시퀀싱", "가상 악기", "믹서"]],
  ["musescore/MuseScore", "content-media", "MuseScore Studio", "악보를 입력하고 재생하며 PDF로 내보내는 작곡 도구예요.", "손으로 악보를 다시 그리지 않고 음표를 편집하고 소리로 확인할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["악보 입력", "재생", "PDF 내보내기"]],
  ["xbmc/xbmc", "content-media", "Kodi", "영화·음악·사진을 TV형 화면에서 정리하고 재생하는 미디어 센터예요.", "여러 폴더에 흩어진 미디어를 한 화면의 라이브러리로 관리할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["미디어 라이브러리", "TV형 화면", "확장 기능"]],
  ["videolan/vlc", "content-media", "VLC", "다양한 영상과 음원 형식을 재생하는 범용 미디어 플레이어예요.", "추가 코덱을 찾지 않고 흔한 미디어 파일과 네트워크 스트림을 열 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["다양한 코덱", "네트워크 재생", "자막 지원"]],
  ["OpenShot/openshot-qt", "content-media", "OpenShot", "영상과 사진을 타임라인에 놓아 편집하는 무료 영상 앱이에요.", "간단한 컷 편집과 제목, 전환 효과가 필요한 영상을 빠르게 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "beginner", "desktop", ["타임라인 편집", "제목", "전환 효과"]],
  ["darktable-org/darktable", "content-media", "darktable", "RAW 사진을 정리하고 색과 밝기를 보정하는 사진 작업 도구예요.", "원본 사진을 보존하면서 대량의 RAW 파일을 분류하고 현상할 수 있습니다.", ["Windows", "macOS", "Linux"], "desktop-installer", "intermediate", "desktop", ["RAW 현상", "비파괴 편집", "사진 라이브러리"]],
  ["iterate-ch/cyberduck", "productivity", "Cyberduck", "FTP·SFTP·클라우드 저장소의 파일을 탐색하는 전송 앱이에요.", "서버 주소와 계정을 입력해 원격 파일을 Finder나 탐색기처럼 올리고 내려받을 수 있습니다.", ["Windows", "macOS"], "desktop-installer", "intermediate", "desktop", ["SFTP 전송", "클라우드 연결", "북마크"]],
  ["neovim/neovim", "developer-tools", "Neovim", "키보드 중심으로 코드와 텍스트를 편집하는 확장 가능한 터미널 편집기예요.", "마우스 사용을 줄이고 설정과 플러그인으로 개인화된 편집 환경을 만들 수 있습니다.", ["Windows", "macOS", "Linux"], "release-download", "advanced", "cli", ["터미널 편집", "Lua 설정", "플러그인 생태계"]],
  ["gitextensions/gitextensions", "developer-tools", "Git Extensions", "Windows에서 Git 저장소와 커밋 기록을 화면으로 관리하는 도구예요.", "브랜치 관계와 변경 기록을 그래프로 보며 Git 작업을 처리할 수 있습니다.", ["Windows"], "desktop-installer", "intermediate", "desktop", ["커밋 그래프", "브랜치 관리", "차이 비교"]],
  ["WinMerge/winmerge", "productivity", "WinMerge", "Windows에서 두 파일이나 폴더의 차이를 나란히 비교하는 도구예요.", "수정된 줄과 빠진 파일을 눈으로 찾고 필요한 변경을 합칠 수 있습니다.", ["Windows"], "desktop-installer", "beginner", "desktop", ["파일 비교", "폴더 비교", "변경 병합"]]
] as const;

function platformGuide(project: typeof projects[number], platform: string) {
  const [, , label, , , , guideType] = project;
  if (platform === "Web") return {
    name: platform,
    steps: [
      { order: 1, title: "공식 웹 앱 열기", description: `${label} 저장소의 공식 웹 앱 링크를 새 탭에서 엽니다.` },
      { order: 2, title: "새 작업 시작", description: "새 파일 또는 새 프로젝트를 만들고 첫 항목을 입력합니다.", expectedResult: "편집 화면에 새 작업이 표시됩니다." }
    ]
  };
  const file = platform === "Windows" ? "Windows 설치 파일" : platform === "macOS" ? "macOS 설치 파일" : "Linux용 패키지";
  return {
    name: platform,
    steps: [
      { order: 1, title: `${file} 받기`, description: `공식 저장소의 Releases 또는 Download 안내에서 내 환경에 맞는 ${file}을 받습니다.` },
      { order: 2, title: "설치 진행", description: guideType === "release-download" ? "받은 압축 파일을 새 폴더에 풀고 실행 파일을 엽니다." : "받은 파일을 열고 화면의 기본 설치 절차를 완료합니다." },
      { order: 3, title: "첫 화면 확인", description: `${label}을 실행하고 새 파일·연결·프로젝트 중 화면에 보이는 시작 항목을 선택합니다.`, expectedResult: `${label}의 기본 작업 화면이 열립니다.` }
    ]
  };
}

const output = projects.map((project) => {
  const [id, category, label, summary, problemSolved, platforms, guideType, difficulty, usageType, keyFeatures] = project;
  return {
    id, category, summary,
    whatItIs: `${label} 소개: ${summary}`,
    problemSolved,
    recommendedFor: [`${label}의 핵심 기능을 무료로 시작하려는 사람`, "공식 설치 파일과 쉬운 첫 실행 안내가 필요한 사용자"],
    keyFeatures,
    useCases: [problemSolved, `${label}의 기본 기능을 비용 부담 없이 시험`],
    tags: [usageType, category, "open-source", difficulty],
    difficulty, usageType, guideType,
    costSummary: "공식 오픈소스 배포판은 무료입니다. 연동 서비스나 기업용 기능에는 별도 비용이 있을 수 있습니다.",
    apiKeyRequired: false,
    platforms,
    guide: {
      prerequisites: ["인터넷 연결", "설치 파일을 저장할 공간"],
      estimatedMinutes: guideType === "web" ? 3 : 10,
      platforms: platforms.map((platform) => platformGuide(project, platform)),
      firstRunResult: `${label}의 기본 작업 화면이 열리고 새 작업을 시작할 수 있습니다.`,
      uninstallInstructions: guideType === "web" ? undefined : "운영체제의 앱 제거 화면에서 프로그램을 제거합니다. 개인 데이터 삭제 여부는 공식 문서를 먼저 확인합니다.",
      commonIssues: [{ problem: "설치 파일이 실행되지 않음", solution: "파일이 공식 GitHub 저장소에서 받은 것인지 확인하고 운영체제와 CPU 종류에 맞는 파일을 다시 선택합니다." }],
      officialDocsUrl: `https://github.com/${id}#readme`,
      verifiedAt
    }
  };
});

await writeFile(new URL("../data/editorial-expanded.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Saved ${output.length} expanded editorial entries.`);
