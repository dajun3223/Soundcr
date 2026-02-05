import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { style } = await request.json();

    if (!style) {
      return NextResponse.json(
        { error: 'Music style is required' },
        { status: 400 }
      );
    }

    // Call Pollinations AI to generate music composition JSON using qwen-coder
    const prompt = `Generate a JSON music composition for a ${style} style song. 
The JSON should have this structure:
{
  "bpm": <tempo number between 60-180>,
  "duration": <duration in seconds, 20-40>,
  "tracks": [
    {
      "instrument": "<one of: synth, amsynth, fmsynth, duosynth, membrane, metal, pluck>",
      "volume": <volume in dB, -20 to 0>,
      "notes": [
        {"note": "<note like C4, D#5, etc>", "duration": "<duration like 4n, 8n, 2n>", "time": "<time in format 0:0:0>"}
      ]
    }
  ]
}

Create a rich composition with at least 3-5 different instruments playing harmonically. Include melody, bass, chords, and percussion. Use varied note durations and create interesting musical phrases. Ensure the music fills the entire specified duration (20-40 seconds) and that all tracks contain notes throughout that period. Make it sound like ${style} music. Only respond with valid JSON, no additional text.`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available (optional for Pollinations AI)
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'qwen-coder',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Read response body for more details
      console.error(`[v0] Pollinations AI API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      throw new Error(`Failed to generate music composition: ${response.statusText}`);
    }

    const result = await response.json();
    
    let composition;
    try {
      // Extract content from OpenAI-compatible response format
      const content = result.choices?.[0]?.message?.content || result;
      
      if (typeof content === 'string') {
        // Try to parse JSON from string
        composition = JSON.parse(content);
      } else {
        composition = content;
      }
    } catch (parseError) {
      // Fallback: try to extract JSON from text
      const content = result.choices?.[0]?.message?.content || JSON.stringify(result);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        composition = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from AI response');
      }
    }

    console.log('[v0] Generated music composition:', composition);

    return NextResponse.json({ composition });
  } catch (error) {
    console.error('[v0] Error generating music:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music' },
      { status: 500 }
    );
  }
}
