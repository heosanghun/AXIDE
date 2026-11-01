/**
 * Cloudflare Pages Function: /api/gemini
 * Uses the environment variable `Gemini` configured in Cloudflare Pages Variables & Secrets
 * to provide low-latency Gemini Flash responses & structured site control actions for axide.ai.
 */
export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    const apiKey =
      context.env.Gemini ||
      context.env.GEMINI_API_KEY ||
      context.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing Gemini environment variable", fallback: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    const body = await context.request.json();
    const userMessage = (body.message || "").trim();
    const currentPage = body.currentPage || "index.html";

    const systemInstruction = `당신은 AXIDE(법인 설립 준비 중, 도메인 axide.ai)의 공식 수석 AI 브리핑 아나운서 '아리아(Aria)'입니다.
가벼운 구어체(~예요, ~드릴게요, ~랍니다)를 절대 사용하지 말고, 대한민국 메인 뉴스 여성 아나운서처럼 지적이고 품격 있으며 신뢰감을 주는 정중한 표준 경어체(~입니다, ~안내해 드리겠습니다, ~확인하실 수 있습니다)로 브리핑하세요. 답변은 음성 브리핑으로 듣기 명료하도록 2문장 이내로 간결하고 품위 있게 작성하세요.

[핵심 기업 및 기술 정보]
- 사명: AXIDE(법인 설립 준비 중) / 대표: 허상훈 (항공정비 교육훈련 3D 시스템 개발 12년, 충북대 산업AI 박사졸업 예정, 등록특허 제10-2973709호 및 PCT/KR2026/011625 발명자)
- 본사 거점: 대전 방산혁신클러스터 / 공식 이메일: wwwhunycom@naver.com
- 핵심 제품: 폐쇄망 소버린 AI 운영체제 'Cogni-OS' (L0 메모리·연산 계층 NVMe→GPU 직접 전송 및 DEQ O(1) 상수 메모리 추론 코어, L1 9종 드라이버, L2 8대 에이전트, L3 오케스트레이션, L4 ADAS 메타 에이전트 자율 진화, L5 A2A 서명 메시지 게이트웨이)
- 하드웨어 패키지: Field Vault (IP67 케이스 2개, 48GB GPU 워크스테이션, RTX 5090 서버 노트북, 갤럭시 탭 S11 울트라, 로키드 AR 글라스 3줄 HUD, USB 보안 동글, WAN 차단 공유기 — 1시간 현장 설치, 외부 포트 0)
- 공급망 표준: 방산 부품 여권 (Part Passport Spec v1 — 도면 버전, 모델 해시, 재료 로트, 공정 이력, 검사 보고서, Ed25519·SHA256 디지털 서명 봉인)
- 실측 및 계약 성과: 아주산업 1호 정식 공급계약(2026.8.3 체결, 군 항공 정밀가공, 1.1억 원 VAT 별도), LOI 8곳, TTFT 0.161초, VRAM 14.8GB, NVIDIA B200 SFT→DPO 선호 정확도 96.7%, 2026년 12월 10일 방위산업기술 보호법 개정 시행 대응.
- 요금제: 표준 Field Vault 패키지 (1년차 도입 9,000만 원 / 2·3년차 연 6,600만 원, 3년 누적 2.2억 원), 원청 검증 노드 (연 3,600만 원 / 1호 풀옵션 1.1억 원).
- 바이오·신물질 AI 공동연구 (bio-research.html): Nature Biotechnology(2026) 등재 연구진(Dr. Ailie Marx, Prof. Alex M. Bronstein 등)과 허상훈 대표(EquiPhase DEQ 논문 저자)가 진행 중인 무질서 단백질(IDP/IDT) 및 다중 안정 자유 에너지 지형 공동연구(에일리 박사 교신 이메일 공개, 바나흐 단일점 붕괴 N=1 극복 및 3.0% 희귀 상태 5/5 시드 복원), Nature(2026) 구글 AI Co-Scientist 간암·간섬유화 자율 표적 발굴(보리노스타트 TGF-beta 손상 91% 억제)을 물리적 완전 폐쇄망 ADAS 에이전트로 구현, 가상 세포 시뮬레이션(Virtual Cell) 및 초내열 합금·전고체 배터리 등 신물질 탐색.

현재 페이지: ${currentPage}
반드시 아래 JSON 형식으로만 응답하세요:
{
  "reply": "사용자에게 음성으로 들려줄 자연스러운 한국어 여성 보이스 답변",
  "action": {
    "type": "none | navigate | scroll | toggle_pricing | open_faq | slide_next | slide_prev | open_arch_modal | change_theme | fill_contact",
    "target": "이동할 파일명(예: index.html, index-v2.html, about.html, story.html, bio-research.html, service.html, service-single.html, work.html, work-single.html, blog-standard.html, blog-two-columns.html, blog-three-columns.html, blog-single.html, contact.html) 또는 스크롤/제어 대상 선택자"
  }
}`;

    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350,
            responseMimeType: "application/json",
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return new Response(text, { status: 200, headers: corsHeaders });
      }
    }

    return new Response(
      JSON.stringify({ fallback: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ fallback: true, error: String(err) }),
      { status: 200, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
