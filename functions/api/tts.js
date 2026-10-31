/**
 * Cloudflare Pages Function: /api/tts
 * Synthesizes high-tension, lively, smiling 20s Korean female speech using:
 * 1. Qwen3-TTS 1.7B Instruct ("Sohee" Korean Female + cheerful high-tension instruction)
 * 2. Gemini 2.5 Native Audio TTS ("Kore" / "Aoede") via `env.Gemini`
 */

function pcm24kToWavBase64(pcmBase64, sampleRate = 24000) {
  const raw = atob(pcmBase64);
  const pcmLen = raw.length;
  const wavLen = 44 + pcmLen;
  const buf = new ArrayBuffer(wavLen);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcmLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcmLen, true);

  for (let i = 0; i < pcmLen; i++) {
    bytes[44 + i] = raw.charCodeAt(i);
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  try {
    const body = await context.request.json();
    const text = (body.text || "").trim();
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Empty text", fallback: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 1. Try Gemini 2.5 Native Audio TTS with high-tension smiling 20s Korean female direction
    const apiKey =
      context.env.Gemini ||
      context.env.GEMINI_API_KEY ||
      context.env.GOOGLE_API_KEY;

    if (apiKey) {
      const ttsModels = [
        "gemini-2.5-flash-preview-tts",
        "gemini-2.5-pro-preview-tts"
      ];
      const prompt = `밝고 텐션이 높으며 미소가 가득한 20대 한국 여성 매니저의 생동감 넘치고 다정한 목소리로 다음 문장을 읽어주세요: ${text}`;

      for (const model of ttsModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Kore"
                  }
                }
              }
            }
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData && inlineData.data) {
            const wavBase64 = pcm24kToWavBase64(inlineData.data, 24000);
            return new Response(
              JSON.stringify({ audioBase64: wavBase64, mimeType: "audio/wav" }),
              { status: 200, headers: corsHeaders }
            );
          }
        }
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
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
