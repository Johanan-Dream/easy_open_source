const geminiApi = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class GeminiClient {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateStructured<T>(prompt: string, responseSchema: object): Promise<T> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is required.");
    const response = await fetch(`${geminiApi}/models/${encodeURIComponent(this.model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new GeminiApiError(`Gemini API ${response.status}: ${body.slice(0, 300)}`, response.status);
    }
    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error("Gemini returned no structured output.");
    return JSON.parse(text) as T;
  }
}
