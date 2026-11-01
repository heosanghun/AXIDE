/**
 * AXIDE Cogni-Voice AI (아리아 · Aria)
 * Real Studio-Grade Neural Korean Female Voice (Seraphina HD + Gemini Live Aoede) + Full Website Controller
 * Domain: https://axide.ai | https://heosanghun.github.io/AXIDE/
 */
(function () {
  "use strict";

  const STORAGE_KEY_HISTORY = "axide_voice_history_v1";
  const STORAGE_KEY_OPEN = "axide_voice_panel_open_v1";
  const STORAGE_KEY_PENDING = "axide_voice_pending_utterance_v1";
  const STORAGE_KEY_PENDING_CLIP = "axide_voice_pending_clip_v1";
  const AUDIO_VERSION = "20261101v12";

  const PAGE_LABELS = {
    "index.html": "메인 홈 (방산 폐쇄망 AI 표준)",
    "index-v2.html": "홈 02 (소버린 AI 모션 비디오)",
    "about.html": "회사소개 (AXIDE(법인 설립 준비 중))",
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
   * 1. Real Studio-Grade Neural Korean Female Voice Engine (HTMLAudio + Gemini TTS)
   * -------------------------------------------------------------------------- */
  let synth = window.speechSynthesis || null;
  let selectedVoice = null;
  let currentAudio = null;
  let isSpeaking = false;

  function stopAllAudio() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }
    if (synth) {
      try {
        synth.cancel();
      } catch (e) {}
    }
    isSpeaking = false;
  }

  function selectBestKoreanFemaleVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    // Exclude old robotic desktop SAPI voice (Microsoft Heami) unless nothing else exists
    const koVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().includes("ko") ||
        v.name.toLowerCase().includes("korean") ||
        v.name.includes("한국")
    );
    const nonRoboticKo = koVoices.filter((v) => !/Heami/i.test(v.name));

    const priorityPatterns = [
      /Seraphina.*Natural/i,
      /SunHi.*Natural/i,
      /SunHi/i,
      /SeoHyeon.*Natural/i,
      /InJoon.*Natural/i,
      /Yuna/i,
      /Sora/i,
      /Google.*한국/i,
      /Google.*Korean/i
    ];

    for (const pattern of priorityPatterns) {
      const found = nonRoboticKo.find((v) => pattern.test(v.name)) || koVoices.find((v) => pattern.test(v.name));
      if (found) return found;
    }
    return nonRoboticKo[0] || koVoices[0] || null;
  }

  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = function () {
      selectedVoice = selectBestKoreanFemaleVoice();
    };
  }

  function normalizeForKoreanSpeech(text) {
    return String(text || "")
      .replace(/AXIDE/gi, "액사이드")
      .replace(/Cogni-OS/gi, "코그니 오에스")
      .replace(/Cogni-Vault Pod/gi, "코그니 볼트 파드")
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

  function playHtmlAudioSrc(src, onEndCallback, onErrorFallback) {
    stopAllAudio();
    const audio = new Audio(src);
    audio.preload = "auto";
    currentAudio = audio;
    isSpeaking = true;
    setWidgetState("speaking");

    let finished = false;
    function finishCleanly() {
      if (finished) return;
      finished = true;
      if (currentAudio === audio) {
        currentAudio = null;
        isSpeaking = false;
      }
      setWidgetState(isListening ? "listening" : "idle");
      if (onEndCallback) onEndCallback();
    }

    audio.onended = finishCleanly;
    audio.onerror = function () {
      if (finished) return;
      finished = true;
      if (currentAudio === audio) {
        currentAudio = null;
        isSpeaking = false;
      }
      if (onErrorFallback) {
        onErrorFallback();
      } else {
        setWidgetState("idle");
        if (onEndCallback) onEndCallback();
      }
    };

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        if (finished) return;
        finished = true;
        if (currentAudio === audio) {
          currentAudio = null;
          isSpeaking = false;
        }
        if (onErrorFallback) {
          onErrorFallback();
        } else {
          setWidgetState("idle");
          if (onEndCallback) onEndCallback();
        }
      });
    }
  }

  function speakBrowserFallback(text, onEndCallback) {
    if (!synth) {
      setWidgetState("idle");
      if (onEndCallback) onEndCallback();
      return;
    }
    const cleanText = normalizeForKoreanSpeech(text);
    if (!cleanText) {
      setWidgetState("idle");
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
    // Keep natural 1.0 pitch/rate so browser fallback never sounds artificially warped
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
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

  async function speakDynamicGeminiTtsOrFallback(text, onEndCallback) {
    stopAllAudio();
    const cleanText = normalizeForKoreanSpeech(text);
    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }
    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.audioBase64) {
          const mime = data.mimeType || "audio/wav";
          playHtmlAudioSrc(
            `data:${mime};base64,${data.audioBase64}`,
            onEndCallback,
            () => speakBrowserFallback(text, onEndCallback)
          );
          return;
        }
      }
    } catch (e) {
      // Static host or offline: fall back gracefully
    }
    speakBrowserFallback(text, onEndCallback);
  }

  function speakFemaleVoice(text, onEndCallback, clipKey) {
    stopAllAudio();
    if (clipKey) {
      const mp3Url = `assets/audio/aria/${clipKey}.mp3?v=${AUDIO_VERSION}`;
      playHtmlAudioSrc(mp3Url, onEndCallback, () => {
        speakDynamicGeminiTtsOrFallback(text, onEndCallback);
      });
      return;
    }
    speakDynamicGeminiTtsOrFallback(text, onEndCallback);
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
        clipKey: "stop",
        reply: "네, 안내를 잠시 멈출게요. 필요하실 때 언제든 저를 다시 불러주세요.",
        action: { type: "stop_speaking", target: "" }
      };
    }

    // B. Architecture Blueprint Zoom / Scroll Commands
    if (/참조\s*아키텍처|아키텍처\s*도면|아키텍처\s*크게|아키텍처\s*보여|블루프린트|l0|l4|adas|에이다스|a2a|에이투에이|공간\s*분할/.test(lower)) {
      if (/크게|확대|모달|전체\s*화면|공간\s*분할/.test(q)) {
        return {
          clipKey: "arch_zoom",
          reply: "네! Cogni-OS 참조 아키텍처를 전체 화면으로 크게 띄워드릴게요. 원청에서 부품 공장까지 이어지는 6단계 공급망과, 스스로 진화하는 ADAS 구조를 한눈에 보실 수 있어요.",
          action: { type: "open_arch_modal", target: "assets/images/doc/cogni-os-reference-architecture.jpg" }
        };
      }
      return {
        clipKey: "arch_scroll",
        reply: "Cogni-OS 참조 아키텍처 쪽으로 안내해 드릴게요. NVMe에서 GPU로 바로 연결되는 추론 코어부터, 원청과 공장을 잇는 공급망까지 한눈에 확인해 보세요.",
        action: {
          type: document.querySelector(".arch-blueprint-wrap") ? "scroll" : "navigate",
          target: document.querySelector(".arch-blueprint-wrap") ? ".arch-blueprint-wrap" : "index.html#services"
        }
      };
    }

    // C. Page Navigation Commands (All 13 Pages)
    if (/홈\s*2|버전\s*2|비디오\s*홈|모션\s*홈|v2/.test(lower)) {
      return {
        clipKey: "nav_home2",
        reply: "네, 소버린 AI 모션 영상이 담긴 홈 버전 2 페이지로 바로 이동할게요!",
        action: { type: "navigate", target: "index-v2.html" }
      };
    }
    if (/(메인|홈으로|첫\s*페이지|홈\s*페이지|홈\s*1)/.test(lower) && !/홈페이지에서/.test(lower)) {
      return {
        clipKey: "nav_home1",
        reply: "네, 액사이드 메인 홈 화면으로 바로 이동할게요.",
        action: { type: "navigate", target: "index.html" }
      };
    }
    if (/회사\s*소개|액사이드\s*소개|기업\s*소개|창업\s*미션|허상훈\s*대표|대표이사\s*소개|어바웃|월드\s*모델/.test(lower)) {
      return {
        clipKey: "nav_about",
        reply: "허상훈 대표님과 KAIST, 충북대 산업 AI 연구진이 함께하는 회사소개 페이지로 안내해 드릴게요.",
        action: { type: "navigate", target: "about.html" }
      };
    }
    if (/부품\s*여권|파트\s*패스포트|필드\s*볼트|하드웨어\s*상세|동글|솔루션\s*상세/.test(lower)) {
      if (/이동|열어|가자|가줘|보여줘|페이지/.test(lower) || curPage !== "service-single.html") {
        return {
          clipKey: "nav_passport",
          reply: "방산 부품 여권과 Field Vault 하드웨어 상세 페이지로 이동할게요! 도면 유출 걱정 없이 단 1초 만에 무결성을 증명하는 구조를 보실 수 있어요.",
          action: { type: "navigate", target: "service-single.html" }
        };
      }
    }
    if (/솔루션|제품\s*소개|모듈|서비스\s*페이지/.test(lower)) {
      return {
        clipKey: "nav_service",
        reply: "Cogni-OS의 핵심 아키텍처와 4대 모듈이 정리된 솔루션 페이지로 바로 안내해 드릴게요.",
        action: { type: "navigate", target: "service.html" }
      };
    }
    if (/아주산업|1호\s*계약|일호\s*계약|도면\s*복원|도면\s*296|3d\s*복원|성적표\s*상세|정밀\s*선택/.test(lower)) {
      return {
        clipKey: "nav_ajou",
        reply: "아주산업 1.1억 원 1호 공급계약과, 2D 도면을 3D 모델로 복원한 실증 페이지로 이동할게요!",
        action: { type: "navigate", target: "work-single.html" }
      };
    }
    if (/실증\s*사례|도입\s*사례|레퍼런스|로드맵|5단계|오단계|로보티즈/.test(lower)) {
      if (/이동|페이지|열어|가줘|보여줘/.test(lower) && curPage !== "work.html") {
        return {
          clipKey: "nav_work",
          reply: "아주산업 공급계약부터 부품 여권 파일럿, 신한카드 공동연구, 그리고 로보티즈 로봇팔 로드맵까지 담긴 실증사례 페이지로 안내해 드릴게요.",
          action: { type: "navigate", target: "work.html" }
        };
      }
    }
    if (/2열|2단|이열/.test(lower) && /백서|블로그|아카이브/.test(lower)) {
      return {
        clipKey: "nav_blog2",
        reply: "네, 기술 아카이브 2열 그리드 화면으로 이동할게요.",
        action: { type: "navigate", target: "blog-two-columns.html" }
      };
    }
    if (/3열|3단|삼열/.test(lower) && /백서|블로그|아카이브/.test(lower)) {
      return {
        clipKey: "nav_blog3",
        reply: "네, 기술 아카이브 3열 그리드 화면으로 이동할게요.",
        action: { type: "navigate", target: "blog-three-columns.html" }
      };
    }
    if (/백서\s*상세|백서\s*전문|암호학\s*백서|방산법\s*해설/.test(lower)) {
      return {
        clipKey: "nav_blog_single",
        reply: "방위산업기술 보호법 대응과 암호학 해시 체인 봉인을 다룬 기술 백서 상세 페이지로 이동할게요.",
        action: { type: "navigate", target: "blog-single.html" }
      };
    }
    if (/백서|블로그|인사이트|규제\s*브리핑/.test(lower)) {
      return {
        clipKey: "nav_blog",
        reply: "액사이드의 기술 백서와 방산 규제 브리핑 페이지로 안내해 드릴게요.",
        action: { type: "navigate", target: "blog-standard.html" }
      };
    }
    if (/바이오|무질서\s*단백질|idp|idt|네이처|nature|에일리|알렉스|브론스타인|간암|간섬유화|사이언티스트|co-scientist|세포\s*시뮬레이션|신물질|equiphase/.test(lower)) {
      return {
        clipKey: "nav_bio",
        reply: "네이처 바이오테크놀로지 등재 연구진(에일리 마르크스 박사, 알렉스 브론스타인 교수)과 함께하는 무질서 단백질 공동연구와 폐쇄망 ADAS 간암·세포 시뮬레이션·신물질 AI 테마관으로 바로 안내해 드릴게요!",
        action: { type: "navigate", target: "bio-research.html" }
      };
    }
    if (/문의\s*페이지|도입\s*문의|상담\s*페이지|오시는\s*길|지도\s*보여/.test(lower)) {
      return {
        clipKey: "nav_contact",
        reply: "1시간 현장 설치 데모와 파일럿 실증을 신청하실 수 있는 도입문의 페이지로 이동할게요.",
        action: { type: "navigate", target: "contact.html" }
      };
    }

    // D. In-Page UI Controls (Pricing Switch, FAQ Accordions, Sliders, Scroll, Theme, Form)
    if (/연간\s*갱신|원청\s*구독|1년차\s*도입|초기\s*도입|요금\s*스위치|요금제\s*비교\s*스위치|요금\s*전환|요금\s*바꿔/.test(lower)) {
      return {
        clipKey: "pricing_toggle",
        reply: "요금제 비교 스위치를 전환해 드렸어요! 1년차 도입 비용과 연간 갱신 요금을 한눈에 비교해 보세요.",
        action: { type: "toggle_pricing", target: "#pricing" }
      };
    }
    if (/요금|가격|비용|얼마|구독료|플랜/.test(lower)) {
      return {
        clipKey: "pricing_info",
        reply: "표준 Field Vault 패키지는 1년차 9,000만 원, 2·3년차 연 6,600만 원으로 이용하실 수 있고요, 원청 검증 노드는 연 3,600만 원이에요. 요금제 섹션으로 바로 안내해 드릴게요.",
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
        clipKey: `faq_${idx}`,
        reply: `자주 묻는 질문 ${idx}번 항목을 펼쳐서 보여드릴게요.`,
        action: {
          type: document.querySelector(".section-faqs") ? "open_faq" : "navigate",
          target: document.querySelector(".section-faqs") ? String(idx) : "index.html"
        }
      };
    }
    if (/팀|임원|리더십|안수진|황영배|박해선|키모브|atp|설치/.test(lower)) {
      return {
        clipKey: "team",
        reply: "허상훈 대표님과 KAIST 안수진 CTO, 충북대 황영배 교수님, 주식회사 키모브 이사 박해선 기술멘토, 그리고 Field ATP 및 1시간 설치 & ATP 검수 전문가로 구성된 리더십 섹션으로 안내해 드릴게요.",
        action: {
          type: document.querySelector(".section-team") ? "scroll" : "navigate",
          target: document.querySelector(".section-team") ? ".section-team" : "about.html"
        }
      };
    }
    if (/특허|수상|연혁|pct/.test(lower)) {
      return {
        clipKey: "awards",
        reply: "대한민국 등록특허와 PCT 국제출원, 그리고 1호 공급계약 이력이 담긴 섹션으로 이동할게요.",
        action: {
          type: document.querySelector(".section-awards") ? "scroll" : "navigate",
          target: document.querySelector(".section-awards") ? ".section-awards" : "index.html"
        }
      };
    }
    if (/후기|추천사|고객\s*목소리|조난식/.test(lower)) {
      return {
        clipKey: "testimonials",
        reply: "아주산업 조난식 대표님과 방산 품질보증 수석님의 생생한 도입 후기 섹션으로 안내해 드릴게요.",
        action: {
          type: document.querySelector(".section-testimonials") ? "scroll" : "navigate",
          target: document.querySelector(".section-testimonials") ? ".section-testimonials" : "index.html"
        }
      };
    }
    if (/통계|실측\s*숫자|성능|벤치마크|0\.161|96\.7/.test(lower)) {
      return {
        clipKey: "stats",
        reply: "인터넷을 완전히 차단한 노트북에서 직접 측정한 0.161초 응답속도와, 96.7% 정확도 성적표를 보여드릴게요.",
        action: {
          type: document.querySelector(".section-benefits") ? "scroll" : "navigate",
          target: document.querySelector(".section-benefits") ? ".section-benefits" : "index.html"
        }
      };
    }
    if (/다음\s*슬라이드|오른쪽\s*슬라이드|넘겨/.test(lower)) {
      return {
        clipKey: "slide_next",
        reply: "네, 다음 슬라이드로 넘겨드릴게요.",
        action: { type: "slide_next", target: "" }
      };
    }
    if (/이전\s*슬라이드|왼쪽\s*슬라이드/.test(lower)) {
      return {
        clipKey: "slide_prev",
        reply: "네, 이전 슬라이드로 돌아갈게요.",
        action: { type: "slide_prev", target: "" }
      };
    }
    if (/맨\s*위|최상단|탑으로|위로\s*올려/.test(lower)) {
      return {
        clipKey: "scroll_top",
        reply: "화면 맨 위로 부드럽게 올라갈게요.",
        action: { type: "scroll", target: "top" }
      };
    }
    if (/맨\s*아래|최하단|푸터/.test(lower)) {
      return {
        clipKey: "scroll_bottom",
        reply: "화면 맨 아래 푸터 영역으로 내려갈게요.",
        action: { type: "scroll", target: "footer" }
      };
    }
    if (/아래로|내려|스크롤/.test(lower)) {
      return {
        clipKey: "scroll_down",
        reply: "화면을 아래로 조금 내려드릴게요.",
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
        clipKey: "theme",
        reply: "방금 홈페이지 포인트 테마 색상을 산뜻하게 바꿔드렸어요!",
        action: { type: "change_theme", target: String(colorIdx) }
      };
    }
    if (/데모\s*신청|양식\s*작성|폼\s*작성|상담\s*신청|신청서/.test(lower)) {
      return {
        clipKey: "demo_form",
        reply: "1시간 현장 설치 데모 신청 양식으로 이동해서, 바로 접수하실 수 있게 기본 내용을 미리 채워두었어요.",
        action: {
          type: document.querySelector(".form-contact") ? "fill_contact" : "navigate",
          target: document.querySelector(".form-contact") ? ".form-contact" : "contact.html"
        }
      };
    }

    // E. Conversational Q&A about AXIDE / Cogni-OS / Defense Law / Pod / Mars / Greeting
    if (/안녕|반가워|누구|소개해|뭐하는|아리아/.test(lower)) {
      return {
        clipKey: "qa_intro",
        reply: "안녕하세요! 저는 액사이드의 AI 매니저 아리아예요. 폐쇄망 AI Cogni-OS와 방산 부품 여권 안내부터, 원하시는 화면 이동까지 편하게 말씀만 해 주세요!",
        action: { type: "none", target: "" }
      };
    }
    if (/방위산업|방산법|12월\s*10일|법률|유출|보호법/.test(lower)) {
      return {
        clipKey: "qa_law",
        reply: "2026년 12월 10일 시행되는 방위산업기술 보호법은 도면 유출 시 무거운 처벌을 규정하고 있는데요, 액사이드는 도면을 공장 밖으로 단 1바이트도 내보내지 않고 여권 증명만 전달해서 이 문제를 완벽히 해결해 드려요.",
        action: { type: "none", target: "" }
      };
    }
    if (/래퍼|wrapper|오픈소스|차별점|경쟁력|deq|상수\s*메모리/.test(lower)) {
      return {
        clipKey: "qa_wrapper",
        reply: "액사이드는 단순한 오픈소스 래퍼가 아니에요. 특허받은 상수 메모리 추론 코어와 3D 도면 파서, 그리고 거짓 환각 대신 판단 보류를 선언하는 안전장치까지 갖춘 6계층 소버린 AI 운영체제랍니다.",
        action: { type: "none", target: "" }
      };
    }
    if (/파드|pod|컨테이너|국산\s*반도체|퓨리오사|리벨리온/.test(lower)) {
      return {
        clipKey: "qa_pod",
        reply: "Cogni-Vault Pod는 국산 AI 반도체 서버와 이중 보안 게이트, 로봇팔 측정 모듈을 컨테이너 하나에 담은 자동화 공장 패키지예요. 현장에 꽂기만 하면 당일 바로 가동된답니다.",
        action: { type: "none", target: "" }
      };
    }
    if (/화성|우주|달\s*기지|극지|해상|비전|미래/.test(lower)) {
      return {
        clipKey: "qa_mars",
        reply: "인터넷이 전혀 닿지 않는 극지나 해상, 나아가 달과 화성 기지에서도 지구 도움 없이 스스로 도면을 읽고 부품을 만들어 증명하는 것이 액사이드 Cogni-Vault Pod의 장기 비전이에요.",
        action: { type: "none", target: "" }
      };
    }
    if (/연락처|전화번호|이메일|주소|위치|어디/.test(lower)) {
      return {
        clipKey: null,
        reply: "액사이드 본사 거점은 대전 방산혁신클러스터에 있어요! 공식 이메일이나 도입문의 게시판을 통해 신청해 주시면 당일 바로 안내해 드릴게요!",
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
      executeSiteAction(localMatch.action, localMatch.reply, localMatch.clipKey);
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
          executeSiteAction(data.action || { type: "none", target: "" }, data.reply, null);
          return;
        }
      }
    } catch (e) {
      // Fallback to local studio-grade human female response when static hosting is used
    }

    // 3. Intelligent Contextual Fallback Response (with Studio-Grade Human Female Audio)
    const fallbackReply =
      "말씀하신 내용은 액사이드의 Cogni-OS와 방산 부품 여권에서 핵심으로 다루는 분야예요! '아키텍처 보여줘', '부품 여권으로 이동해줘', 또는 '요금제 알려줘'처럼 편하게 말씀해 주시면 바로 안내해 드릴게요.";
    appendMessage("ai", fallbackReply);
    speakFemaleVoice(fallbackReply, null, "fallback");
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

  function executeSiteAction(action, replyText, clipKey) {
    if (!action || !action.type || action.type === "none") {
      speakFemaleVoice(replyText, null, clipKey);
      return;
    }

    const type = action.type;
    const target = action.target || "";

    if (type === "stop_speaking") {
      stopAllAudio();
      stopListening();
      setWidgetState("idle");
      return;
    }

    if (type === "navigate") {
      const parts = target.split("#");
      const targetFile = parts[0] || "index.html";
      const targetHash = parts[1] ? "#" + parts[1] : "";
      const curPage = getCurrentPage();

      if (targetFile === curPage) {
        if (targetHash) {
          const el = document.querySelector(targetHash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            highlightElement(el);
          }
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        speakFemaleVoice(replyText, null, clipKey);
        return;
      }

      // Save reply & studio-grade clipKey to speak seamlessly right after page transition
      sessionStorage.setItem(STORAGE_KEY_PENDING, replyText);
      if (clipKey) {
        sessionStorage.setItem(STORAGE_KEY_PENDING_CLIP, clipKey);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_PENDING_CLIP);
      }
      sessionStorage.setItem(STORAGE_KEY_OPEN, "true");
      setTimeout(() => {
        window.location.href = targetFile + targetHash;
      }, 220);
      return;
    }

    if (type === "scroll") {
      speakFemaleVoice(replyText, null, clipKey);
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
      speakFemaleVoice(replyText, null, clipKey);
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
      speakFemaleVoice(replyText, null, clipKey);
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
      speakFemaleVoice(replyText, null, clipKey);
      const selector =
        type === "slide_next"
          ? ".nav-next-swiper, .progressbar-next, .testimonials-next"
          : ".nav-prev-swiper, .progressbar-prev, .testimonials-prev";
      const btns = document.querySelectorAll(selector);
      btns.forEach((b) => b.click());
      return;
    }

    if (type === "open_arch_modal") {
      speakFemaleVoice(replyText, null, clipKey);
      openArchModal(target || "assets/images/doc/cogni-os-reference-architecture.jpg");
      return;
    }

    if (type === "change_theme") {
      speakFemaleVoice(replyText, null, clipKey);
      const idx = target || "1";
      document.body.setAttribute("data-color-primary", "color-primary-" + idx);
      localStorage.setItem("selectedColorIndex", idx);
      return;
    }

    if (type === "fill_contact") {
      speakFemaleVoice(replyText, null, clipKey);
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

    speakFemaleVoice(replyText, null, clipKey);
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
    if (isSpeaking) {
      stopAllAudio();
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
    return "안녕하세요, 반갑습니다! 액사이드의 AI 매니저 아리아예요. 오늘 어떤 솔루션을 함께 둘러볼까요?";
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
      updateStatusText("구체를 누르거나 편하게 말씀해 주세요");
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
    stopAllAudio();
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
    } else {
      const img = modal.querySelector(".arch-modal-body img");
      if (img && imgSrc) img.setAttribute("src", imgSrc);
    }
    modal.classList.add("show");
  }

  function triggerGreetingAndListen() {
    openVoicePanel();
    const greet =
      "안녕하세요, 반갑습니다! 액사이드의 AI 매니저 아리아예요. 오늘 어떤 솔루션을 함께 둘러볼까요? 편하게 말씀해 주세요.";
    appendMessage("ai", greet);
    speakFemaleVoice(
      greet,
      () => {
        startListening();
      },
      "greet"
    );
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
      micBtn.setAttribute("title", "AI 음성 대화 및 사이트 제어 (Gemini Live · 아리아)");
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
          triggerGreetingAndListen();
        } else {
          if (isSpeaking) {
            stopAllAudio();
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
            <img src="assets/images/logo/axide-emblem.png?v=20261101v10" alt="AXIDE" class="sims-brand-emblem">
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
            Gemini Live · Aria HD
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
        triggerGreetingAndListen();
      } else {
        // Barge-in support: if speaking, interrupt immediately and start listening
        if (isSpeaking) {
          stopAllAudio();
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
      if (isSpeaking) {
        stopAllAudio();
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
      stopAllAudio();
      processUserCommand(val);
    });

    // Barge-in when typing in input while AI is speaking
    document.getElementById("axideVoiceInput").addEventListener("keydown", function () {
      if (isSpeaking) {
        stopAllAudio();
        setWidgetState("idle");
      }
    });

    widget.querySelectorAll(".sims-action-tile").forEach((tile) => {
      tile.addEventListener("click", function () {
        const cmd = this.getAttribute("data-cmd");
        stopAllAudio();
        if (cmd) processUserCommand(cmd);
      });
    });

    // Also allow clicking the Reference Architecture image or Services image to open the zoom modal
    document.querySelectorAll(".arch-blueprint-frame a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openArchModal(this.getAttribute("href"));
      });
    });

    document.querySelectorAll(".services-image img").forEach((img) => {
      img.addEventListener("click", function () {
        openArchModal(this.getAttribute("src"));
      });
    });

    document.querySelectorAll(".physical-ai-card").forEach((card) => {
      card.addEventListener("click", function () {
        const src = this.getAttribute("data-zoom-src");
        if (src) openArchModal(src);
      });
    });

    // Interactive 8-Infographic Master Deck switcher
    document.querySelectorAll(".axide-deck-card").forEach((card) => {
      card.addEventListener("click", function () {
        const src = this.getAttribute("data-src");
        const wrap = this.closest(".arch-blueprint-wrap");
        if (!wrap || !src) return;
        wrap.querySelectorAll(".axide-deck-card").forEach((c) => c.classList.remove("active"));
        this.classList.add("active");
        const mainImg = wrap.querySelector(".arch-blueprint-frame img");
        const mainLink = wrap.querySelector(".arch-blueprint-frame a");
        if (mainImg) mainImg.setAttribute("src", src);
        if (mainLink) mainLink.setAttribute("href", src);
      });
      card.addEventListener("dblclick", function () {
        const src = this.getAttribute("data-src");
        if (src) openArchModal(src);
      });
    });

    // Restore open state & speak pending utterance after page navigation
    if (sessionStorage.getItem(STORAGE_KEY_OPEN) === "true") {
      openVoicePanel();
    }
    const pending = sessionStorage.getItem(STORAGE_KEY_PENDING);
    const pendingClip = sessionStorage.getItem(STORAGE_KEY_PENDING_CLIP);
    if (pending) {
      sessionStorage.removeItem(STORAGE_KEY_PENDING);
      sessionStorage.removeItem(STORAGE_KEY_PENDING_CLIP);
      setTimeout(() => {
        appendMessage("ai", pending);
        speakFemaleVoice(pending, null, pendingClip || null);
      }, 350);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
  } else {
    injectUI();
  }
})();
