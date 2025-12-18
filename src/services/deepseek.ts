export async function analyzeWithDeepSeek(base64Image: string): Promise<string> {
    const response = await fetch("/api/deepseek.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-reasoner",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this floorplan image deeply.
                            1. Read any visible length measurements/labels on the walls (e.g., "3.95m", "5.82m").
                            2. Calculate exactly the total area based on these written dimensions (geometry), not just pixels.
                            3. Respond in JSON format with keys: 
                               - "measurements": array of strings (e.g. ["5.81m", "2.40m"]),
                               - "estimatedArea": string, 
                               - "roomCount": number, 
                               - "summary": string.`
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
        console.error("DeepSeek API Error:", errorText);
        throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
