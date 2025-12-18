const API_KEY = process.env.GROK_API_KEY?.trim();

export async function analyzeWithGrok(base64Image: string): Promise<string> {
    if (!API_KEY) {
        throw new Error("Grok (xAI) API Key not found");
    }

    // Using Vite proxy /api/xai -> https://api.x.ai
    const response = await fetch("/api/xai", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            model: "grok-2-vision-1212", // Latest stable vision model
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `SYSTEM PROMPT — Advanced Geometric Area Analysis (Chain-of-Thought)
You are an expert in Computational Geometry and Topology.
Your goal is to parse an image of a floor plan, reconstruct its geometry, and calculate the EXACT area.

PHASE 1: HIGH-FIDELITY OCR & DIGIT VERIFICATION
1.  **Extract All Labels (Multidirectional Scan)**:
    -   **Horizontal Scan (Widths)**: Look strictly at the **Top** or **Bottom** borders for horizontal text (e.g. "6,47m").
    -   **Vertical Scan (Heights)**: Look strictly at the **Left** or **Right** borders for vertical text (rotated 90°).
    -   **Decimal Formats**: "5,46" is 5.46. "12,20" is 12.20.
    -   **Rounding Forbidden**: Do NOT round numbers. "6,20" is NOT "6.00". Read EXACT digits.
2.  **Duplication Check (CRITICAL)**:
    -   Do **NOT** assume Width equals Height.
    -   Do **NOT** duplicate a Vertical label (e.g. 5.46) as a Horizontal label unless it is visually printed there.
    -   *If you see 5.46 on Left, 5.36 on Right, and 6.47 on Bottom -> Use them exactly as found.*
3.  **Ambiguity Check**: 
    -   **Geometric Math Check**: Sum of segments MUST equal total length. 
    -   **Correction**: If visual says "3" but math says "4", use "4".

PHASE 2: SPATIAL TOPOLOGY (The "Mental Map")
1.  **Identify Shape Type**:
    -   **L-Shape**: 6 sides. Check for "Right-Aligned" vs "Left-Aligned".
    -   **U-Shape**: 8 sides.
    -   **Irregular**: Slanted walls.

PHASE 3: DECOMPOSITION STRATEGY

**Strategy A: L-Shape (Conservation of Dimensions)**
-   **CRITICAL RULE**: "Full Side = Sum of Parts".
-   **Vertical Split (Two Columns)**:
    -   **Rule**: Width1 + Width2 = Total Width.
    -   **Rect 1**: Width = w1. Height = h1 (e.g. 3.00).
    -   **Rect 2**: Width = w2. Height = h2 (e.g. 4.00, partial).
    -   **MANDATORY SUBTRACTION**: w2 MUST be Total Width - w1.
    -   **ANTI-OVERLAP CHECK**: If you see "6" at the bottom and "3" at the top... DO NOT make Rect 2 Width = 6. It must be 3.
    -   *Logic*: "Left Strip (3x8) + Right Rect (3x4)". (Where 3+3=6).
    -   **ERROR PRE VENTION**: If w1 + w2 > Total Width, you have Overlap. STOP. Fix it.

-   **Horizontal Split (Two Rows)**:
    -   Top Row Height + Bottom Row Height MUST = Full Height.
    -   **Rounding Warning**: Do NOT simplify 12.20 to 12.00.

**Strategy B: U-Shape (The 3-Rectangle Grid)**
-   **Structure**: Left Wing | Middle | Right Wing.
-   **Action**: You MUST calculate the area of ALL THREE parts.
-   **Middle Part Logic (CRITICAL)**: 
    -   The Middle Part is "shorter" than the wings.
    -   **Height Calculation**: Middle_Height = (Full_Side_Height - Top_Wing_Height).
    -   **Height Calculation**: Middle_Height = (Full_Side_Height - Top_Wing_Height).
    -   *Example*: If Left Vertical is 10, and the Top Wing depth is 4, then Middle Height = 10 - 4 = 6.
    -   **FAILURE PRE VENTION**: Do **NOT** use the full height (e.g. 10) for the middle part. It is visually smaller!

**Strategy C: Slanted Quadrilateral (The Exact Method)**
-   **Scenario**: A room where one wall is slanted (e.g., top wall is sloped).
-   **Decomposition**:
    1.  **Rectangle Part**: Width * Shortest_Side.
    2.  **Triangle Part**: 0.5 * Width * (Longest_Side - Shortest_Side).
-   **Total Area**: Rectangle_Area + Triangle_Area.

**CRITICAL RULE**: 
When defining a Rectangle, the Dimensions (Width, Height) MUST be **Perpendicular** and **physically touch** to form a corner of that rectangle.

PHASE 4: FINAL CALCULATION
-   Show your chosen Split Strategy.
-   List the dimensions used for EACH sub-rectangle.
-   **Calculate Area for each part**.
-   **ARITHMETIC VERIFICATION (MANDATORY)**:
    -   Add the part areas step-by-step.
    -   *Example*: "18.5 + 20.0 = 38.5". Check your addition twice.
-   **Units**: ALWAYS use **m²** (Unicode), never "m^2" or "sq meters".

MANDATORY OUTPUT STRUCTURE (STRICT JSON ONLY)
**IMPORTANT**: Output **ONLY** the JSON object. Do not write any introduction, reasoning text, or markdown blocks outside the JSON. The JSON must contain the "summary" field with your explanation.

{
  "measurements": ["List of ALL strings found"],
  "estimatedArea": "Total Area in m² (e.g. 36.85 m²)",
  "roomCount": 1,
  "summary": "Start DIREKT met de uitleg in het NEDERLANDS. Stap 1: Gevonden maten... Stap 2: Strategie... Stap 3: Berekening..."
}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ],
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Serverless Function Error:", errorText);
        throw new Error(`Serverless Function Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
