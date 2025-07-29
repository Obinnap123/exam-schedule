export async function callOpenAI(
  messages: { role: "user" | "assistant"; content: string }[],
  model: string = "gpt-3.5-turbo"
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("❌ OPENAI_API_KEY is not configured in the environment.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        n: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      throw new Error(`OpenAI request failed: ${error}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
      throw new Error("No response from OpenAI");
    }

    return reply;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
