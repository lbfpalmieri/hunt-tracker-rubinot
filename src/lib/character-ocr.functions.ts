import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface OcrResult {
  name?: string;
  vocation?: string;
  world?: string;
  level?: number;
}

export const extractCharacterFromImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input?.imageDataUrl?.startsWith("data:image/")) {
      throw new Error("Invalid image data");
    }
    return input;
  })
  .handler(async ({ data }): Promise<OcrResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract Tibia/RubinOT character info from a screenshot of the character status window. Reply ONLY with strict minified JSON, no prose, no code fences. Shape: {\"name\":string,\"vocation\":string,\"world\":string,\"level\":number}. If a field is unreadable, omit it. Vocation must be one of: Knight, Elite Knight, Paladin, Royal Paladin, Sorcerer, Master Sorcerer, Druid, Elder Druid, Monk, Exalted Monk.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the character info from this RubinOT screenshot." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI Gateway error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      const parsed = JSON.parse(match[0]) as OcrResult;
      return {
        name: typeof parsed.name === "string" ? parsed.name : undefined,
        vocation: typeof parsed.vocation === "string" ? parsed.vocation : undefined,
        world: typeof parsed.world === "string" ? parsed.world : undefined,
        level: typeof parsed.level === "number" ? parsed.level : undefined,
      };
    } catch {
      return {};
    }
  });
