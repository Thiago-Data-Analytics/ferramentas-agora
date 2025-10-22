export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { purpose, input } = await req.json();
    const system = "Você é um assistente de social media. Gere hashtags e títulos curtos, prontos para colar.";
    const body = {
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Purpose: ${purpose}\nInput: ${input}` }
      ],
      temperature: 0.7
    };
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: txt }), { status: 500, headers: { "Content-Type":"application/json" } });
      }
    const j = await r.json();
    const output = j.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ output }), { status: 200, headers: { "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type":"application/json" } });
  }
}
