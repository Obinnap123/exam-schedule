export async function callOpenAI(
  messages: { role: "user" | "assistant"; content: string }[],
  model?: string
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
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      throw new Error(`OpenAI request failed: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? ""; // The actual reply
  } catch (error) {
    console.error(error);
    throw error;
  }
}
