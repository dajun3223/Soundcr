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

    const promptContent = `Abstract album cover art for ${style} music, dreamy, motion blur effect, soft focus, ethereal, atmospheric, blurred movement, cinematic, artistic photography, defocused, gaussian blur`;
    const encodedPrompt = encodeURIComponent(promptContent);

    const headers: Record<string, string> = {};

    // Add API key if available (optional for Pollinations AI)
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Warning: Based on previous errors, 'zimage' might be an invalid model for Pollinations AI.
    // Proceeding as per user's explicit request.
    console.warn("[v0] Using 'zimage' model as per user request. Previous errors indicated it might be an invalid option for other endpoints.");

    const response = await fetch(`https://gen.pollinations.ai/image/${encodedPrompt}?model=zimage`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Read response body for more details
      console.error(`[v0] Pollinations AI API Error (Image Endpoint): ${response.status} ${response.statusText} - ${errorBody}`);
      throw new Error(`Failed to generate cover image: ${response.statusText}`);
    }

    // Return the image as a blob
    const blob = await response.blob();
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
      },
    });
  } catch (error) {
    console.error('[v0] Error generating cover:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate cover' },
      { status: 500 }
    );
  }
}
