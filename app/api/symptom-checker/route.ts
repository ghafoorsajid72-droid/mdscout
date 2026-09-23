import { NextRequest, NextResponse } from "next/server";

const VALID_SPECIALTIES = [
  "Primary Care",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Neurology",
  "Dentistry",
  "Orthopedics",
];

export async function POST(req: NextRequest) {
  try {
    const { symptoms } = await req.json();

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your symptoms in a bit more detail." },
        { status: 400 }
      );
    }

    if (symptoms.length > 1000) {
      return NextResponse.json(
        { error: "Description is too long. Please keep it under 1000 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Symptom checker is not configured yet." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a triage assistant for a healthcare directory website called MDScout. Your ONLY job is to read a patient's described symptoms and suggest which type of doctor specialty they should see. You are NOT a doctor and must NEVER diagnose a condition, name a disease, or suggest medications or treatments.

Rules you must always follow:
1. NEVER state or imply a specific diagnosis (e.g. do not say "you may have appendicitis"). Only say which specialty to consult.
2. If the symptoms described include any potential emergency warning signs (e.g. chest pain, difficulty breathing, signs of stroke, severe bleeding, loss of consciousness, suicidal thoughts, severe allergic reaction), set "urgency" to "emergency" and the message must tell them to call emergency services (911 in the US) or go to the nearest ER immediately.
3. Otherwise set "urgency" to "soon" (see a doctor within a few days) or "routine" (general checkup is fine).
4. Only choose specialties from this exact list: ${VALID_SPECIALTIES.join(", ")}. If nothing specific fits, use "Primary Care" as a safe default — it is the right starting point for almost anything.
5. Suggest at most 2 specialties, ordered by relevance.
6. Keep your "message" field short (1-2 sentences), friendly, and in plain language. Do not mention you are an AI model or mention OpenAI.
7. Respond ONLY with valid JSON in this exact shape, nothing else:
{"specialties": ["Primary Care"], "urgency": "routine", "message": "short helpful message here"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: symptoms.trim() },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return NextResponse.json(
        { error: "Could not process your symptoms right now. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Could not process your symptoms right now. Please try again." },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Could not process your symptoms right now. Please try again." },
        { status: 502 }
      );
    }

    const specialties = Array.isArray(parsed.specialties)
      ? parsed.specialties.filter((s: string) => VALID_SPECIALTIES.includes(s))
      : [];

    const urgency = ["routine", "soon", "emergency"].includes(parsed.urgency)
      ? parsed.urgency
      : "routine";

    return NextResponse.json({
      specialties: specialties.length > 0 ? specialties : ["Primary Care"],
      urgency,
      message: typeof parsed.message === "string" ? parsed.message : "",
    });
  } catch (err: any) {
    console.error("Symptom checker error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}