import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, prompt } = await req.json();
    
    console.log('Generate video request received:', { imageUrl: imageUrl?.substring(0, 100), prompt });
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Generate 4 variation frames from the original image to create animation effect
    const variationPrompts = [
      `${prompt || 'Divine ethereal scene'} with soft glowing particles floating upward, sacred light rays emanating from center`,
      `${prompt || 'Divine ethereal scene'} with gentle golden sparkles dancing, ethereal mist swirling gracefully`,
      `${prompt || 'Divine ethereal scene'} with luminous aura pulsing outward, celestial energy waves rippling`,
      `${prompt || 'Divine ethereal scene'} with radiant light beams cascading, divine blessing descending from above`,
    ];

    console.log('Generating video frames with divine variations...');

    // Generate multiple frames for animation
    const framePromises = variationPrompts.map(async (framePrompt, index) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Transform this image into frame ${index + 1} of a 6-second divine video sequence. Add: ${framePrompt}. Keep the main subject but add ethereal animation elements like floating light particles, gentle glow effects, and sacred energy. Style: ultra high quality, 5D spiritual, celestial, divine light.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Frame ${index + 1} generation failed:`, response.status, errorText);
        throw new Error(`Frame ${index + 1} generation failed: ${response.status}`);
      }

      const data = await response.json();
      const frameImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      console.log(`Frame ${index + 1} generated successfully`);
      return frameImage;
    });

    const frames = await Promise.all(framePromises);
    
    // Filter out any failed frames
    const validFrames = frames.filter(frame => frame);
    
    if (validFrames.length === 0) {
      throw new Error('Failed to generate any video frames');
    }

    console.log(`Successfully generated ${validFrames.length} frames for video`);

    return new Response(
      JSON.stringify({ 
        success: true,
        frames: validFrames,
        duration: 6,
        frameCount: validFrames.length,
        message: 'Video frames generated successfully. Display as animated sequence.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating video:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Video generation failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
