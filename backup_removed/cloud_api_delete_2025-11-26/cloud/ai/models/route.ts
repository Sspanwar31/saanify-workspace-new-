import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock AI models data
    const models = [
      { 
        id: '1', 
        name: 'GPT-4', 
        type: 'Language Model', 
        status: 'active', 
        usage: '45%', 
        description: 'OpenAI GPT-4 Turbo model for advanced language tasks',
        created: '2024-01-01'
      },
      { 
        id: '2', 
        name: 'Claude-3', 
        type: 'Language Model', 
        status: 'active', 
        usage: '30%', 
        description: 'Anthropic Claude-3 Opus for reasoning and analysis',
        created: '2024-01-02'
      },
      { 
        id: '3', 
        name: 'DALL-E 3', 
        type: 'Image Generation', 
        status: 'active', 
        usage: '15%', 
        description: 'DALL-E 3 for high-quality image generation',
        created: '2024-01-03'
      },
      { 
        id: '4', 
        name: 'Embeddings', 
        type: 'Vector Search', 
        status: 'active', 
        usage: '10%', 
        description: 'Text embedding model for semantic search',
        created: '2024-01-04'
      }
    ]
    
    return NextResponse.json(models)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI models' },
      { status: 500 }
    )
  }
}