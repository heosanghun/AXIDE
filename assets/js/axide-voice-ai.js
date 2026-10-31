/**
 * AXIDE Cogni-Voice AI (아리아 · Aria)
 * Gemini Flash & Neural Korean Female Voice Concierge + Full Website Controller
 * Domain: https://axide.ai | https://heosanghun.github.io/AXIDE/
 */
(function () {
  "use strict";

  const STORAGE_KEY_HISTORY = "axide_voice_history_v1";
  const STORAGE_KEY_OPEN = "axide_voice_panel_open_v1";
  const STORAGE_KEY_PENDING = "axide_voice_pending_utterance_v1";
  const STORAGE_KEY_CONTINUOUS = "axide_voice_continuous_v1";

  const PAGE_LABELS = {
    "index.html": "메인 홈 (방산 폐쇄망 AI 표준)",
    "index-v2.html": "홈 02 (소버린 AI 모션 비디오)",
    "about.html": "회사소개 (주식회사 액사이드)",
    "service.html": "솔루션 (Cogni-OS 아키텍처 & 하드웨어)",
    "service-single.html": "방산 부품 여권 (Part Passport v1) 상세",
    "work.html": "실증사례 (공급계약 & 5단계 진화 로드맵)",
    "work-single.html": "아주산업 1호 계약 & 3D 도면 복원 실측",
    "blog-standard.html": "기술·규제 백서 (표준형)",
    "blog-two-columns.html": "기술 아카이브 (2열 그리드)",
    "blog-three-columns.html": "기술 아카이브 (3열 그리드)",
    "blog-single.html": "기술 백서 상세 (DEQ & 감사 봉인)",
    "contact.html": "도입문의 (1시간 현장 데모 & 파일럿 신청)",
    "404.html": "보안 구역 안내 (Air-Gap Zone)"
  };

  function getCurrentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    return file.includes(".html") ? file : "index.html";
  }

  /* --------------------------------------------------------------------------
   * 1. Korean Female Voice Synthesis & Phonetic Normalization Engine
   * -------------------------------------------------------------------------- */
  let synth = window.speechSynthesis || null;
  let selectedVoice = null;
  let isSpeaking = false;

  function selectBestKoreanFemaleVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    const koVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().includes("ko") ||
        v.name.toLowerCase().includes("korean") ||
        v.name.includes("한국")
    );

    const priorityPatterns = [
      /SunHi.*Natural/i,
      /SunHi/i,
      /SeoHyeon.*Natural/i,
      /SeoHyeon/i,
      /JiMin/i,
      /Yuna/i,
      /Sora/i,
      /Google.*한국/i,
      /Google.*Korean/i,
      /Female/i
    ];

    for (const pattern of priorityPatterns) {
      const found = koVoices.find((v) => pattern.test(v.name));
      if (found) return found;
    }
    return koVoices[0] || voices[0] || null;
  }

  if (synth) {
    selectedVoice = selectBestKoreanFemaleVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = function () {
        selectedVoice = selectBestKoreanFemaleVoice();
        updateVoiceBadgeText();
      };
    }
  }

  function normalizeForKoreanSpeech(text) {
    return String(text || "")
      .replace(/AXIDE/gi, "액사이드")
      .replace(/Cogni-OS/gi, "코그니 오에스")
      .replace(/CogniBoard/gi, "코그니보드")
      .replace(/CogniCraft/gi, "코그니크래프트")
      .replace(/Part Passport/gi, "파트 패스포트")
      .replace(/Field Vault/gi, "필드 볼트")
      .replace(/Tech-Audit/gi, "테크 오딧")
      .replace(/DEQ/g, "디이큐")
      .replace(/ADAS/g, "에이다스")
      .replace(/A2A/g, "에이투에이")
      .replace(/TTFT/g, "첫 글자 응답속도")
      .replace(/VRAM/g, "브이램")
      .replace(/NVMe/gi, "엔브이엠이")
      .replace(/SHA-?256/gi, "샤 이오육")
      .replace(/Ed25519/gi, "이디 이오오일구")
      .replace(/B200/g, "비이백")
      .replace(/SFT→DPO|SFT\/DPO/g, "에스에프티 디피오")
      .replace(/DPO/g, "디피오")
      .replace(/ATP/g, "에이티피")
      .replace(/LOI/g, "구매의향서")
      .replace(/OMY-F3M/gi, "오엠와이 에프쓰리엠")
      .replace(/O\(1\)/g, "오 원 상수")
      .replace(/0\.161초/g, "영점 일육일 초")
      .replace(/1\.1억/g, "일점 일억")
      .replace(/2\.2억/g, "이점 이억")
      .replace(/8\.0억/g, "팔억")
      .replace(/96\.7%/g, "구십육점 칠 퍼센트")
      .replace(/93\.3점/g, "구십삼점 삼 점")
      .replace(/14\.8GB/gi, "십사점 팔 기가바이트")
      .replace(/48GB/gi, "사십팔 기가바이트")
      .replace(/32GB/gi, "삼십이 기가바이트")
      .replace(/0 Byte/gi, "제로 바이트")
      .replace(/L0~L5/gi, "엘제로부터 엘파이브까지")
      .replace(/[*#_`~🔒✅●]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speakFemaleVoice(text, onEndCallback) {
    if (!synth) {
      if (onEndCallback) onEndCallback();
      return;
    }
    synth.cancel();

    const cleanText = normalizeForKoreanSpeech(text);
    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    if (!selectedVoice) {
      selectedVoice = selectBestKoreanFemaleVoice();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ko-KR";
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    // Natural, warm, articulate female announcer prosody
    const isNaturalOnline =
      selectedVoice && /Natural|Online|Google/i.test(selectedVoice.name);
    utterance.pitch = isNaturalOnline ? 1.04 : 1.12;
    utterance.rate = isNaturalOnline ? 1.04 : 1.02;
    utterance.volume = 1.0;

    utterance.onstart = function () {
      isSpeaking = true;
      setWidgetState("speaking");
    };
    utterance.onend = function () {
      isSpeaking = false;
      setWidgetState(isListening ? "listening" : "idle");
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = function () {
      isSpeaking = false;
      setWidgetState("idle");
      if (onEndCallback) onEndCallback();
    };

    synth.speak(utterance);
  }

  /* --------------------------------------------------------------------------
   * 2. Intent Recognition, Gemini Flash API & Local Cogni-OS Brain
   * -------------------------------------------------------------------------- */
  function matchLocalCommandAndKnowledge(rawInput) {
    const q = rawInput.trim();
    const lower = q.toLowerCase();
    const curPage = getCurrentPage();

    // A. Stop / Mute commands
    if (/멈춰|그만|조용|음소거|닫아|종료/.test(q)) {
      return {
        reply: "네, 음성 안내를 멈추겠습니다. 필요하실 때 언제든 우측 마이크 버튼을 눌러주세요.",
        action: { type: "stop_speaking", target: "" }
      };
    }

    // B. Architecture Blueprint Zoom / Scroll Commands
    if (/참조\s*아키텍처|아키텍처\s*도면|아키텍처\s*크게|블루프린트|l0|l4|adas|에이다스|a2a|에이투에이/.test(lower)) {
      if (/크게|확대|모달|전체\s*화면/.test(q)) {
        return {
          reply: "Cogni-OS 참조 아키텍처 버전 1.0 도면을 전체 화면으로 확대해 드립니다. 원청과 공급업체 간 6단계 A2A 공급망과 L0부터 L5까지의 6계층 및 ADAS 자율 진화 구조를 확인하실 수 있습니다.",
          action: { type: "open_arch_modal", target: "assets/images/doc/cogni-os-reference-architecture.jpg" }
        };
      }
      return {
        reply: "Cogni-OS 참조 아키텍처 섹션으로 이동합니다. NVMe에서 GPU로 직접 전송하는 L0 DEQ 추론 코어부터 L4 ADAS 메타 에이전트 자율 진화, 그리고 원청과 부품 공장을 잇는 6단계 A2A 공급망까지 한눈에 확인해 보세요.",
        action: {
          type: document.querySelector(".arch-blueprint-wrap") ? "scroll" : "navigate",
          target: document.querySelector(".arch-blueprint-wrap") ? ".arch-blueprint-wrap" : "index.html#services"
        }
      };
    }

    // C. Page Navigation Commands (All 13 Pages)
    if (/홈\s*2|버전\s*2|비디오\s*홈|모션\s*홈|v2/.test(lower)) {
      return {
        reply: "소버린 AI 모션 비디오가 적용된 홈 버전 2 페이지로 바로 이동하겠습니다.",
        action: { type: "navigate", target: "index-v2.html" }
      };
    }
    if (/(메인|홈으로|첫\s*페이지|홈\s*페이지|홈\s*1)/.test(lower) && !/홈페이지에서/.test(lower)) {
      return {
        reply: "주식회사 액사이드 메인 홈페이지로 이동합니다.",
        action: { type: "navigate", target: "index.html" }
      };
    }
    if (/회사\s*소개|액사이드\s*소개|기업\s*소개|창업\s*미션|허상훈\s*대표|대표이사\s*소개|어바웃/.test(lower)) {
      return {
        reply: "주식회사 액사이드의 창업 미션과 허상훈 대표이사, KAIST 및 충북대 산업AI 연구진이 소개된 회사소개 페이지로 이동합니다.",
        action: { type: "navigate", target: "about.html" }
      };
    }
    if (/부품\s*여권|파트\s*패스포트|필드\s*볼트|하드웨어\s*상세|동글|솔루션\s*상세/.test(lower)) {
      if (/이동|열어|가자|가줘|보여줘|페이지/.test(lower) || curPage !== "service-single.html") {
        return {
          reply: "방산 부품 여권과 Field Vault 6종 하드웨어 금고 상세 페이지로 이동합니다. 도면 유출 없이 정본 도면 해시와 검사 이력을 1초 만에 검증하는 아키텍처를 확인해 보세요.",
          action: { type: "navigate", target: "service-single.html" }
        };
      }
    }
    if (/솔루션|제품\s*소개|모듈|서비스\s*페이지/.test(lower)) {
      return {
        reply: "Cogni-OS의 핵심 아키텍처와 4대 모듈, 인수가능시험 프로토콜이 정리된 솔루션 페이지로 이동합니다.",
        action: { type: "navigate", target: "service.html" }
      };
    }
    if (/아주산업|1호\s*계약|일호\s*계약|도면\s*복원|도면\s*296|3d\s*복원|성적표\s*상세/.test(lower)) {
      return {
        reply: "아주산업 1.1억 원 1호 정식 공급계약과 2D 도면 296에서 3D CAD 솔리드 모델을 자동 복원한 실증 상세 페이지로 이동합니다.",
        action: { type: "navigate", target: "work-single.html" }
      };
    }
    if (/실증\s*사례|도입\s*사례|레퍼런스|로드맵|5단계|오단계|로보티즈/.test(lower)) {
      if (/이동|페이지|열어|가줘|보여줘/.test(lower) && curPage !== "work.html") {
        return {
          reply: "아주산업 공급계약, 방산 부품 여권 파일럿, 신한카드 AX연구소 공동연구, 그리고 로보티즈 로봇팔 5단계 진화 로드맵이 담긴 실증사례 페이지로 이동합니다.",
          action: { type: "navigate", target: "work.html" }
        };
      }
    }
    if (/2열|2단|이열/.test(lower) && /백서|블로그|아카이브/.test(lower)) {
      return {
        reply: "기술 아카이브 2열 그리드 페이지로 이동합니다.",
        action: { type: "navigate", target: "blog-two-columns.html" }
      };
    }
    if (/3열|3단|삼열/.test(lower) && /백서|블로그|아카이브/.test(lower)) {
      return {
        reply: "기술 아카이브 3열 그리드 페이지로 이동합니다.",
        action: { type: "navigate", target: "blog-three-columns.html" }
      };
    }
    if (/백서\s*상세|백서\s*전문|암호학\s*백서|방산법\s*해설/.test(lower)) {
      return {
        reply: "2026년 12월 10일 방위산업기술 보호법 시행과 SHA-256 해시 체인 및 Ed25519 전자서명 아키텍처를 다룬 기술 백서 상세 페이지로 이동합니다.",
        action: { type: "navigate", target: "blog-single.html" }
      };
    }
    if (/백서|블로그|인사이트|규제\s*브리핑/.test(lower)) {
      return {
        reply: "액사이드의 기술 백서 및 방산 규제 브리핑 페이지로 이동합니다.",
        action: { type: "navigate", target: "blog-standard.html" }
      };
    }
    if (/문의\s*페이지|도입\s*문의|상담\s*페이지|오시는\s*길|지도\s*보여/.test(lower)) {
      return {
        reply: "1시간 현장 설치 데모와 6주 파일럿을 신청하실 수 있는 도입문의 페이지로 이동합니다.",
        action: { type: "navigate", target: "contact.html" }
      };
    }

    // D. In-Page UI Controls (Pricing Switch, FAQ Accordions, Sliders, Scroll, Theme, Form)
    if (/연간\s*갱신|원청\s*구독|1년차\s*도입|초기\s*도입|요금\s*스위치|요금\s*전환|요금\s*바꿔/.test(lower)) {
      return {
        reply: "요금제 비교 스위치를 전환하여 1년차 일체형 도입 비용과 연간 갱신 및 원청 검증 노드 구독 요금을 비교해 드립니다.",
        action: { type: "toggle_pricing", target: "#pricing" }
      };
    }
    if (/요금|가격|비용|얼마|구독료|플랜/.test(lower)) {
      return {
        reply: "액사이드는 표준 Field Vault 패키지 기준 1년차 도입 9,000만 원, 2·3년차 연간 갱신 6,600만 원으로 3년 누적 2.2억 원의 투명한 요금 체계를 제공하며, 원청 검증 노드는 연 3,600만 원에 구독하실 수 있습니다. 요금제 섹션으로 안내해 드릴게요.",
        action: {
          type: document.querySelector("#pricing") ? "scroll" : "navigate",
          target: document.querySelector("#pricing") ? "#pricing" : "index.html#pricing"
        }
      };
    }
    if (/faq|질문|자주\s*묻는/.test(lower)) {
      const numMatch = q.match(/([1-4]|일|이|삼|사)\s*번/);
      let idx = 1;
      if (numMatch) {
        const map = { "1": 1, "2": 2, "3": 3, "4": 4, "일": 1, "이": 2, "삼": 3, "사": 4 };
        idx = map[numMatch[1]] || 1;
      }
      return {
        reply: `자주 묻는 핵심 질문 ${idx}번 항목을 펼쳐서 보여드립니다.`,
        action: {
          type: document.querySelector(".section-faqs") ? "open_faq" : "navigate",
          target: document.querySelector(".section-faqs") ? String(idx) : "index.html"
        }
      };
    }
    if (/팀|임원|리더십|안수진|황영배|박해선/.test(lower)) {
      return {
        reply: "허상훈 대표이사, KAIST 뇌인지과학 연구원 안수진 CTO, 충북대 산업인공지능학과 황영배 교수, 아이브이알시스템즈 박해선 멘토가 함께하는 리더십 섹션으로 안내합니다.",
        action: {
          type: document.querySelector(".section-team") ? "scroll" : "navigate",
          target: document.querySelector(".section-team") ? ".section-team" : "about.html"
        }
      };
    }
    if (/특허|수상|연혁|pct/.test(lower)) {
      return {
        reply: "대한민국 등록특허 제10-2973709호와 PCT 국제출원, 아주산업 1호 공급계약 및 신한카드 AX연구소 공동연구 이력이 담긴 섹션으로 이동합니다.",
        action: {
          type: document.querySelector(".section-awards") ? "scroll" : "navigate",
          target: document.querySelector(".section-awards") ? ".section-awards" : "index.html"
        }
      };
    }
    if (/후기|추천사|고객\s*목소리|조난식/.test(lower)) {
      return {
        reply: "아주산업 조난식 대표님과 방산 체계업체 품질보증 수석, 금융 AX연구소 연구원분들의 실제 도입 후기 섹션으로 안내합니다.",
        action: {
          type: document.querySelector(".section-testimonials") ? "scroll" : "navigate",
          target: document.querySelector(".section-testimonials") ? ".section-testimonials" : "index.html"
        }
      };
    }
    if (/통계|실측\s*숫자|성능|벤치마크|0\.161|96\.7/.test(lower)) {
      return {
        reply: "인터넷을 물리적으로 차단한 환경에서 실측한 첫 글자 응답속도 0.161초, VRAM 14.8GB, NVIDIA B200 DPO 감사 선호 정확도 96.7%, 외부 패킷 전송 0 Byte 벤치마크 섹션으로 안내합니다.",
        action: {
          type: document.querySelector(".section-benefits") ? "scroll" : "navigate",
          target: document.querySelector(".section-benefits") ? ".section-benefits" : "index.html"
        }
      };
    }
    if (/다음\s*슬라이드|오른쪽\s*슬라이드|넘겨/.test(lower)) {
      return {
        reply: "다음 슬라이드로 전환합니다.",
        action: { type: "slide_next", target: "" }
      };
    }
    if (/이전\s*슬라이드|왼쪽\s*슬라이드/.test(lower)) {
      return {
        reply: "이전 슬라이드로 전환합니다.",
        action: { type: "slide_prev", target: "" }
      };
    }
    if (/맨\s*위|최상단|탑으로|위로\s*올려/.test(lower)) {
      return {
        reply: "페이지 최상단으로 부드럽게 이동합니다.",
        action: { type: "scroll", target: "top" }
      };
    }
    if (/맨\s*아래|최하단|푸터/.test(lower)) {
      return {
        reply: "페이지 하단 푸터 영역으로 이동합니다.",
        action: { type: "scroll", target: "footer" }
      };
    }
    if (/아래로|내려|스크롤/.test(lower)) {
      return {
        reply: "화면을 아래로 스크롤합니다.",
        action: { type: "scroll", target: "down" }
      };
    }
    if (/테마|색상|컬러/.test(lower)) {
      let colorIdx = 1;
      if (/블루|파랑|청색/.test(lower)) colorIdx = 7;
      else if (/그린|초록|녹색/.test(lower)) colorIdx = 4;
      else if (/퍼플|보라/.test(lower)) colorIdx = 8;
      else if (/옐로|노랑|골드/.test(lower)) colorIdx = 2;
      else if (/오렌지|주황/.test(lower)) colorIdx = 3;
      else if (/레드|빨강|기본/.test(lower)) colorIdx = 1;
      return {
        reply: "홈페이지 포인트 테마 색상을 즉시 변경해 드렸습니다.",
        action: { type: "change_theme", target: String(colorIdx) }
      };
    }
    if (/데모\s*신청|양식\s*작성|폼\s*작성|상담\s*신청|신청서/.test(lower)) {
      return {
        reply: "1시간 현장 설치 데모 및 부품 여권 실증 신청 양식으로 이동하여 바로 작성하실 수 있도록 샘플 내용을 준비해 드렸습니다.",
        action: {
          type: document.querySelector(".form-contact") ? "fill_contact" : "navigate",
          target: document.querySelector(".form-contact") ? ".form-contact" : "contact.html"
        }
      };
    }

    // E. Conversational Q&A about AXIDE / Cogni-OS / Defense Law / Greeting
    if (/안녕|반가워|누구|소개해|뭐하는/.test(lower)) {
      return {
        reply: "안녕하세요! 주식회사 액사이드의 AI 음성 비서 아리아입니다. 폐쇄망 소버린 AI 운영체제 코그니 오에스와 방산 부품 여권 안내부터, 원하시는 페이지 이동과 화면 제어까지 음성으로 도와드립니다. 무엇을 도와드릴까요?",
        action: { type: "none", target: "" }
      };
    }
    if (/방위산업|방산법|12월\s*10일|법률|유출/.test(lower)) {
      return {
        reply: "2026년 12월 10일 시행되는 개정 방위산업기술 보호법은 도면 외부 유출 시 징역 3년 이상 및 벌금 65억 원 이하 병과를 규정합니다. 액사이드의 코그니 오에스와 방산 부품 여권은 도면을 공장 밖으로 단 1바이트도 내보내지 않고 원청에 암호학적 증명만 제출하여 법적 리스크를 완벽히 해결합니다.",
        action: { type: "none", target: "" }
      };
    }
    if (/래퍼|wrapper|오픈소스|차별점|경쟁력/.test(lower)) {
      return {
        reply: "액사이드는 단순 오픈소스 언어모델 래퍼가 아닙니다. 등록특허 제10-2973709호 기반의 DEQ 상수 메모리 추론 코어, 3D 도면을 직접 계산하는 코그니크래프트 파서, 미수렴 시 거짓 환각 대신 판단 보류를 선언하는 안전장치, 그리고 Ed25519·SHA256 해시 체인 봉인이 결합된 6계층 소버린 AI 운영체제입니다.",
        action: { type: "none", target: "" }
      };
    }
    if (/연락처|전화번호|이메일|주소|위치|어디/.test(lower)) {
      return {
        reply: "주식회사 액사이드 본사는 대전광역시 유성구 관들1길 47, 대전 방산혁신클러스터에 위치하고 있습니다. 직통 전화는 010-6689-3508이며, 공식 이메일은 wwwhunycom@naver.com 입니다.",
        action: { type: "none", target: "" }
      };
    }

    return null;
  }

  async function processUserCommand(userText) {
    if (!userText || !userText.trim()) return;
    appendMessage("user", userText);

    // 1. Check fast deterministic local command & knowledge matcher first
    const localMatch = matchLocalCommandAndKnowledge(userText);
    if (localMatch) {
      appendMessage("ai", localMatch.reply);
      executeSiteAction(localMatch.action, localMatch.reply);
      return;
    }

    // 2. Try Cloudflare Pages Function (/api/gemini) powered by env.Gemini
    setWidgetState("thinking");
    try {
      const resp = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          currentPage: getCurrentPage()
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.reply && !data.fallback) {
          appendMessage("ai", data.reply);
          executeSiteAction(data.action || { type: "none", target: "" }, data.reply);
          return;
        }
      }
    } catch (e) {
      // Fallback to local intelligent response when static hosting is used
    }

    // 3. Intelligent Contextual Fallback Response
    const fallbackReply =
      "말씀하신 내용은 액사이드의 폐쇄망 소버린 AI 운영체제 코그니 오에스와 방산 부품 여권 솔루션에서 핵심적으로 지원하는 영역입니다. '아키텍처 보여줘', '부품 여권 페이지로 이동해줘', '아주산업 1호 계약 보여줘', 또는 '요금제 알려줘'라고 말씀해 주시면 해당 화면으로 즉시 안내해 드리겠습니다.";
    appendMessage("ai", fallbackReply);
    speakFemaleVoice(fallbackReply);
  }

  /* --------------------------------------------------------------------------
   * 3. Action Executor (Navigation, Scroll, Toggles, Accordions, Modals, Forms)
   * -------------------------------------------------------------------------- */
  function highlightElement(el) {
    if (!el) return;
    const origTransition = el.style.transition;
    const origBoxShadow = el.style.boxShadow;
    el.style.transition = "box-shadow 0.4s ease";
    el.style.boxShadow = "0 0 0 3px #38bdf8, 0 18px 48px rgba(56, 189, 248, 0.35)";
    setTimeout(() => {
      el.style.boxShadow = origBoxShadow;
      setTimeout(() => {
        el.style.transition = origTransition;
      }, 400);
    }, 2600);
  }

  function executeSiteAction(action, replyText) {
    if (!action || !action.type || action.type === "none") {
      speakFemaleVoice(replyText);
      return;
    }

    const type = action.type;
    const target = action.target || "";

    if (type === "stop_speaking") {
      if (synth) synth.cancel();
      stopListening();
      setWidgetState("idle");
      return;
    }

    if (type === "navigate") {
      const parts = target.split("#");
      const targetFile = parts[0] || "index.html";
      const targetHash = parts[1] ? "#" + parts[1] : "";
      const curPage = getCurrentPage();

      if (targetFile === curPage && targetHash) {
        const el = document.querySelector(targetHash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          highlightElement(el);
        }
        speakFemaleVoice(replyText);
        return;
      }

      // Save reply to speak immediately after page transition
      sessionStorage.setItem(STORAGE_KEY_PENDING, replyText);
      sessionStorage.setItem(STORAGE_KEY_OPEN, "true");
      speakFemaleVoice(replyText);
      setTimeout(() => {
        window.location.href = targetFile + targetHash;
      }, 650);
      return;
    }

    if (type === "scroll") {
      speakFemaleVoice(replyText);
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === "down") {
        window.scrollBy({ top: 680, behavior: "smooth" });
      } else {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          highlightElement(el);
        }
      }
      return;
    }

    if (type === "toggle_pricing") {
      speakFemaleVoice(replyText);
      const pricingSec = document.querySelector("#pricing");
      if (pricingSec) {
        pricingSec.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const sw = document.querySelector("#pricingSwitch");
      if (sw) {
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event("change", { bubbles: true }));
        if (window.jQuery) {
          window.jQuery(sw).trigger("change");
        }
      }
      return;
    }

    if (type === "open_faq") {
      speakFemaleVoice(replyText);
      const idx = parseInt(target, 10) || 1;
      const faqCollapse =
        document.querySelector(`#collapse${idx}`) ||
        document.querySelector(`#faq-${idx}`);
      if (faqCollapse) {
        faqCollapse.scrollIntoView({ behavior: "smooth", block: "center" });
        const btn = document.querySelector(
          `[data-bs-target="#${faqCollapse.id}"]`
        );
        if (btn && btn.classList.contains("collapsed")) {
          btn.click();
        }
        highlightElement(faqCollapse.closest(".accordion-asked-item, .accordion-faq_item") || faqCollapse);
      }
      return;
    }

    if (type === "slide_next" || type === "slide_prev") {
      speakFemaleVoice(replyText);
      const selector =
        type === "slide_next"
          ? ".nav-next-swiper, .progressbar-next, .testimonials-next"
          : ".nav-prev-swiper, .progressbar-prev, .testimonials-prev";
      const btns = document.querySelectorAll(selector);
      btns.forEach((b) => b.click());
      return;
    }

    if (type === "open_arch_modal") {
      speakFemaleVoice(replyText);
      openArchModal(target || "assets/images/doc/cogni-os-reference-architecture.jpg");
      return;
    }

    if (type === "change_theme") {
      speakFemaleVoice(replyText);
      const idx = target || "1";
      document.body.setAttribute("data-color-primary", "color-primary-" + idx);
      localStorage.setItem("selectedColorIndex", idx);
      return;
    }

    if (type === "fill_contact") {
      speakFemaleVoice(replyText);
      const form = document.querySelector(".form-contact");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightElement(form);
        const inputs = form.querySelectorAll("input[type='text'], input[type='email']");
        const textarea = form.querySelector("textarea");
        if (inputs[0] && !inputs[0].value) {
          inputs[0].value = "한국방산정밀(주) / 품질보증팀";
        }
        if (inputs[1] && !inputs[1].value) {
          inputs[1].focus();
        }
        if (textarea && !textarea.value) {
          textarea.value =
            "[음성 비서 자동 작성] Field Vault 1시간 현장 설치 데모 및 방산 부품 여권(Part Passport v1) 파일럿 실증을 요청합니다.";
        }
      }
      return;
    }

    speakFemaleVoice(replyText);
  }

  /* --------------------------------------------------------------------------
   * 4. Web Speech Recognition (Speech-to-Text) Engine
   * -------------------------------------------------------------------------- */
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = function () {
      isListening = true;
      setWidgetState("listening");
      updateStatusText("듣고 있는 중 · 편하게 말씀해 주세요");
    };

    recognition.onresult = function (event) {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      const inputEl = document.getElementById("axideVoiceInput");
      if (inputEl && interimTranscript) {
        inputEl.value = interimTranscript;
      }
      if (finalTranscript) {
        if (inputEl) inputEl.value = "";
        stopListening();
        processUserCommand(finalTranscript);
      }
    };

    recognition.onerror = function (event) {
      isListening = false;
      setWidgetState("idle");
      if (event.error === "not-allowed") {
        updateStatusText("마이크 권한 필요 · 아래 입력창에 말씀해 주세요");
      } else {
        updateStatusText("대기 중 · 구체를 누르거나 말씀해 주세요");
      }
    };

    recognition.onend = function () {
      isListening = false;
      if (!isSpeaking) {
        setWidgetState("idle");
      }
    };
  }

  function startListening() {
    if (!recognition) {
      openVoicePanel();
      updateStatusText("음성 입력 미지원 · 아래 입력창을 이용해 주세요");
      const inputEl = document.getElementById("axideVoiceInput");
      if (inputEl) inputEl.focus();
      return;
    }
    if (synth && isSpeaking) {
      synth.cancel();
      isSpeaking = false;
    }
    openVoicePanel();
    try {
      recognition.start();
    } catch (e) {
      // Already started
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    isListening = false;
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      setWidgetState("idle");
      updateStatusText("대기 중 · 구체를 누르거나 말씀해 주세요");
    } else {
      startListening();
    }
  }

  /* --------------------------------------------------------------------------
   * 5. Build Luxury SIMS-Style Spatial/Sovereign AI Voice HUD & Orb
   * -------------------------------------------------------------------------- */
  function loadLastHeadline() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return saved;
    } catch (e) {}
    return "안녕하세요! 반갑습니다~ 오늘 어떤 솔루션을 함께 둘러볼까요?";
  }

  function saveLastHeadline(text) {
    try {
      sessionStorage.setItem(STORAGE_KEY_HISTORY, text);
    } catch (e) {}
  }

  function appendMessage(role, text) {
    if (role === "ai") {
      saveLastHeadline(text);
      const headlineEl = document.getElementById("axideLiveHeadline");
      if (headlineEl) {
        headlineEl.style.opacity = "0";
        setTimeout(() => {
          headlineEl.textContent = text;
          headlineEl.style.opacity = "1";
        }, 120);
      }
    } else if (role === "user") {
      const statusEl = document.getElementById("axideVoiceStatus");
      if (statusEl) {
        statusEl.textContent = `“${text}”`;
      }
    }
  }

  function updateStatusText(msg) {
    const el = document.getElementById("axideVoiceStatus");
    if (el) el.textContent = msg;
  }

  function updateVoiceBadgeText() {
    // Kept for compatibility when voices finish loading
  }

  function setWidgetState(state) {
    const widget = document.getElementById("axideVoiceWidget");
    const headerBtns = document.querySelectorAll(".axide-header-mic-btn");
    if (widget) {
      widget.setAttribute("data-state", state);
    }
    headerBtns.forEach((b) => b.setAttribute("data-state", state));
    if (state === "listening") {
      updateStatusText("듣고 있는 중 · 편하게 말씀해 주세요");
    } else if (state === "speaking") {
      updateStatusText("말하는 중 · 언제든 끼어들어도 돼요");
    } else if (state === "thinking") {
      updateStatusText("생각하는 중 · 잠시만 기다려 주세요");
    } else {
      updateStatusText("말하는 중 · 언제든 끼어들어도 돼요");
    }
  }

  function openVoicePanel() {
    const panel = document.getElementById("axideVoicePanel");
    if (panel) {
      panel.classList.add("open");
      sessionStorage.setItem(STORAGE_KEY_OPEN, "true");
    }
  }

  function closeVoicePanel() {
    const panel = document.getElementById("axideVoicePanel");
    if (panel) {
      panel.classList.remove("open");
      sessionStorage.setItem(STORAGE_KEY_OPEN, "false");
    }
    stopListening();
    if (synth && isSpeaking) {
      synth.cancel();
      isSpeaking = false;
    }
    setWidgetState("idle");
  }

  function openArchModal(imgSrc) {
    let modal = document.getElementById("axideArchModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "axideArchModal";
      modal.className = "axide-arch-modal";
      modal.innerHTML = `
        <div class="arch-modal-backdrop"></div>
        <div class="arch-modal-content">
          <div class="arch-modal-top">
            <div class="arch-modal-title">Cogni-OS 참조 아키텍처 v1.0 (L0~L5 · ADAS · A2A 공급망)</div>
            <button type="button" class="arch-modal-close" aria-label="닫기">&times; 닫기</button>
          </div>
          <div class="arch-modal-body">
            <img src="${imgSrc}" alt="Cogni-OS 참조 아키텍처 v1.0">
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".arch-modal-backdrop").addEventListener("click", () => {
        modal.classList.remove("show");
      });
      modal.querySelector(".arch-modal-close").addEventListener("click", () => {
        modal.classList.remove("show");
      });
    }
    modal.classList.add("show");
  }

  function injectUI() {
    // 1. Inject Right-Most Minimal Luxury Mic Button into .tf-header .header-inner
    const headerInner = document.querySelector(".tf-header .header-inner");
    if (headerInner && !headerInner.querySelector(".axide-header-mic-btn")) {
      const rightWrap = document.createElement("div");
      rightWrap.className = "d-flex align-items-center gap-10 flex-shrink-0";

      const existingCta = headerInner.querySelector("a.tf-btn:not(.mobile-menu)");
      const existingMobileBtn = headerInner.querySelector("a.mobile-menu");

      const micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.className = "axide-header-mic-btn";
      micBtn.setAttribute("aria-label", "AI 음성 비서 호출");
      micBtn.setAttribute("title", "AI 음성 대화 및 사이트 제어 (Gemini Live)");
      micBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19V22M8 22H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      micBtn.addEventListener("click", function () {
        const panel = document.getElementById("axideVoicePanel");
        if (panel && !panel.classList.contains("open")) {
          openVoicePanel();
          const greet = "안녕하세요! 반갑습니다~ 오늘 어떤 솔루션을 함께 둘러볼까요?";
          appendMessage("ai", greet);
          speakFemaleVoice(greet, () => {
            startListening();
          });
        } else {
          if (synth && isSpeaking) {
            synth.cancel();
            isSpeaking = false;
            startListening();
          } else {
            toggleListening();
          }
        }
      });

      if (existingCta) {
        rightWrap.appendChild(existingCta);
      }
      rightWrap.appendChild(micBtn);
      if (existingMobileBtn) {
        rightWrap.appendChild(existingMobileBtn);
      }
      headerInner.appendChild(rightWrap);
    }

    // 2. Inject Floating Right-Edge SIMS-Style Spatial AI HUD & Minimal Cyan-Violet Mic Button
    if (document.getElementById("axideVoiceWidget")) return;

    const initialHeadline = loadLastHeadline();

    const widget = document.createElement("div");
    widget.id = "axideVoiceWidget";
    widget.className = "axide-voice-widget";
    widget.setAttribute("data-state", "idle");
    widget.innerHTML = `
      <div class="axide-voice-panel" id="axideVoicePanel">
        <!-- Top Minimal Header -->
        <div class="sims-top-bar">
          <div class="sims-brand-group">
            <span class="sims-brand-main">AXIDE</span>
            <span class="sims-brand-sub">SOVEREIGN AI</span>
          </div>
          <div class="sims-win-controls">
            <button type="button" class="sims-win-btn" id="axideVoiceMuteBtn" title="음성 일시 중지 / 최소화" aria-label="최소화">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button type="button" class="sims-win-btn" id="axideVoiceCloseBtn" title="닫기" aria-label="닫기">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Centerpiece 3D Iridescent Sphere with 4 Concentric Ripple Rings -->
        <div class="sims-sphere-stage" id="axideSphereTrigger" title="클릭하여 말하기 / 끼어들기">
          <span class="sims-ring sims-ring-4"></span>
          <span class="sims-ring sims-ring-3"></span>
          <span class="sims-ring sims-ring-2"></span>
          <span class="sims-ring sims-ring-1"></span>
          <div class="sims-core-sphere">
            <span class="sims-sphere-shine"></span>
          </div>
        </div>

        <!-- Status Subtitle -->
        <div class="sims-status-line" id="axideVoiceStatus">
          말하는 중 · 언제든 끼어들어도 돼요
        </div>

        <!-- Centered Live Hero Prompt -->
        <div class="sims-hero-text" id="axideLiveHeadline">${initialHeadline}</div>

        <!-- 3x2 Grid of 6 Minimal Dark Glass Action Tiles -->
        <div class="sims-action-grid">
          <button type="button" class="sims-action-tile" data-cmd="참조 아키텍처 보여줘">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="7" y="3" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7"/>
              <path d="M12 10V17M12 17L9 14M12 17L15 14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 20H19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
            <span>아키텍처</span>
          </button>
          <button type="button" class="sims-action-tile" data-cmd="부품 여권 페이지로 이동해줘">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="18" r="2.2" stroke="currentColor" stroke-width="1.7"/>
              <path d="M8 18H12C14.2091 18 16 16.2091 16 14V10C16 7.79086 17.7909 6 20 6H21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <path d="M18 3L21 6L18 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>이동</span>
          </button>
          <button type="button" class="sims-action-tile" data-cmd="요금제 비교 스위치 전환해줘">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7"/>
              <path d="M10.5 9.5L14 12L10.5 14.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>테마 전환</span>
          </button>
          <button type="button" class="sims-action-tile" data-cmd="아키텍처 크게 확대해줘">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.7"/>
              <path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="1.7"/>
            </svg>
            <span>공간 분할</span>
          </button>
          <button type="button" class="sims-action-tile" data-cmd="아주산업 1호 계약 상세 보여줘">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.7"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
            <span>정밀 선택</span>
          </button>
          <button type="button" class="sims-action-tile" data-cmd="회사소개 페이지로 이동해줘">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/>
              <ellipse cx="12" cy="12" rx="3.6" ry="8" stroke="currentColor" stroke-width="1.7"/>
              <path d="M4.5 9.5H19.5M4.5 14.5H19.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>월드 모델</span>
          </button>
        </div>

        <!-- Sleek Pill Input Bar with Up-Arrow Gradient Button -->
        <form class="sims-input-pill" id="axideVoiceForm">
          <input type="text" id="axideVoiceInput" placeholder="말하거나 입력하세요 · 예) 부품 여권 보여줘" autocomplete="off">
          <button type="submit" class="sims-send-circle" aria-label="전송">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- Bottom Footer Row -->
        <div class="sims-footer-row">
          <span class="sims-live-indicator">
            <i class="sims-green-dot"></i>
            Gemini Live
          </span>
          <span class="sims-barge-hint">말을 끊어도 돼요</span>
        </div>
      </div>

      <!-- Bottom-Right Minimal Dark Obsidian & Cyan-Violet Rim Glow Mic Orb -->
      <button type="button" class="axide-voice-orb" id="axideFloatingOrb" aria-label="AXIDE AI 음성 비서 열기">
        <svg class="orb-mic-svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19V22M8 22H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    document.body.appendChild(widget);

    // Event bindings
    function handleOrbOrSphereClick() {
      const panel = document.getElementById("axideVoicePanel");
      if (!panel.classList.contains("open")) {
        openVoicePanel();
        const greet = "안녕하세요! 반갑습니다~ 오늘 어떤 솔루션을 함께 둘러볼까요?";
        appendMessage("ai", greet);
        speakFemaleVoice(greet, () => {
          startListening();
        });
      } else {
        // Barge-in support: if speaking, interrupt immediately and start listening
        if (synth && isSpeaking) {
          synth.cancel();
          isSpeaking = false;
          startListening();
        } else {
          toggleListening();
        }
      }
    }

    document.getElementById("axideFloatingOrb").addEventListener("click", handleOrbOrSphereClick);
    document.getElementById("axideSphereTrigger").addEventListener("click", handleOrbOrSphereClick);

    document.getElementById("axideVoiceCloseBtn").addEventListener("click", function () {
      closeVoicePanel();
    });

    document.getElementById("axideVoiceMuteBtn").addEventListener("click", function () {
      if (synth && isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        setWidgetState(isListening ? "listening" : "idle");
      } else {
        closeVoicePanel();
      }
    });

    document.getElementById("axideVoiceForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const input = document.getElementById("axideVoiceInput");
      const val = input.value.trim();
      if (!val) {
        handleOrbOrSphereClick();
        return;
      }
      input.value = "";
      if (synth && isSpeaking) {
        synth.cancel();
        isSpeaking = false;
      }
      processUserCommand(val);
    });

    // Barge-in when typing in input while AI is speaking
    document.getElementById("axideVoiceInput").addEventListener("keydown", function () {
      if (synth && isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        setWidgetState("idle");
      }
    });

    widget.querySelectorAll(".sims-action-tile").forEach((tile) => {
      tile.addEventListener("click", function () {
        const cmd = this.getAttribute("data-cmd");
        if (synth && isSpeaking) {
          synth.cancel();
          isSpeaking = false;
        }
        if (cmd) processUserCommand(cmd);
      });
    });

    // Also allow clicking the Reference Architecture image to open the zoom modal
    document.querySelectorAll(".arch-blueprint-frame a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openArchModal(this.getAttribute("href"));
      });
    });

    // Restore open state & speak pending utterance after page navigation
    if (sessionStorage.getItem(STORAGE_KEY_OPEN) === "true") {
      openVoicePanel();
    }
    const pending = sessionStorage.getItem(STORAGE_KEY_PENDING);
    if (pending) {
      sessionStorage.removeItem(STORAGE_KEY_PENDING);
      setTimeout(() => {
        appendMessage("ai", pending);
        speakFemaleVoice(pending);
      }, 450);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
})();
