/**
 * Cloudflare Pages Function: /api/tts
 * Synthesizes ultra-lifelike human female speech using Gemini 2.5 Native Audio TTS (Aoede / Kore)
 * and returns a playable WAV audio stream so dynamic responses sound like a real human woman.
 */
function pcm24kToWav(pcmBytes) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBytes));
  return buffer;
}

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const apiKey =
      context.env.Gemini ||
      context.env.GEMINI_API_KEY ||
      context.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await context.request.json();
    const text = (body.text || "").trim();
    if (!text) {
      return new Response(JSON.stringify({ fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `따뜻하고 친근하며 숨결이 살아있는 실제 20~30대 한국인 여성의 자연스러운 대화 톤으로 읽어주세요: ${text}`
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede"
              }
            }
          }
        }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      const b64 =
        data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
      if (b64) {
        const binStr = atob(b64);
        const pcm = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          pcm[i] = binStr.charCodeAt(i);
        }
        const wavBuffer = pcm24kToWav(pcm.buffer);
        return new Response(wavBuffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/wav",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    }

    return new Response(JSON.stringify({ fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ fallback: true, error: String(err) }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
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
