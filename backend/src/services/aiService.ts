import OpenAI from 'openai';
import { ExtractedContent } from './contentExtractor';

export interface SummaryRequest {
  urls?: string[];
  titles?: string[];
  contents?: any[];
  options?: {
    maxLength?: number;
    style?: 'brief' | 'detailed' | 'bullet-points';
    includeKeyPoints?: boolean;
  };
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  categories: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  totalWordsProcessed: number;
  estimatedReadingTime: number;
}

export class AIService {
  private openai: OpenAI | null = null;
  private static readonly MAX_TOKENS = 4000;
  private static readonly MODEL = 'gpt-4o'; // Use GPT-4o for better analysis

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      // Fallback to environment variable for backward compatibility
      const envApiKey = process.env.OPENAI_API_KEY;
      if (envApiKey) {
        this.openai = new OpenAI({ apiKey: envApiKey });
      }
    }
  }

  // Static method to create service with user's API key
  static withApiKey(apiKey: string): AIService {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key. API key must start with "sk-"');
    }
    return new AIService(apiKey);
  }

  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please provide a valid API key.');
    }

    try {
      const { urls, titles, contents, options = {} } = request;
      const {
        maxLength = 500,
        style = 'detailed',
        includeKeyPoints = true,
      } = options;

      if (contents && contents.length > 0) {
        // Use content-based analysis if content is provided
        const prompt = this.buildContentAnalysisPrompt(contents, style, maxLength, includeKeyPoints);
        
        const completion = await this.openai.chat.completions.create({
          model: AIService.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert content analyst. Analyze the provided article content and create intelligent summaries that capture research findings, methodologies, key insights, and conclusions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: AIService.MAX_TOKENS,
          temperature: 0.3,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response received from OpenAI');
        }

        const parsed = this.parseAIResponse(response);
        
        return {
          ...parsed,
          totalWordsProcessed: contents.reduce((sum, content) => sum + (content.wordCount || 0), 0),
          estimatedReadingTime: Math.ceil(parsed.summary.split(' ').length / 200),
        };
      } else if (urls && urls.length > 0) {
        // Fallback to URL-based prompt (though GPT-4o can't actually browse)
        throw new Error('URL-only analysis not supported. Please provide extracted content.');
      } else {
        throw new Error('No content or URLs provided for summarization');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI summarization failed: ${error.message}`);
      }
      throw new Error('Unknown error during AI summarization');
    }
  }

  private buildContentAnalysisPrompt(
    contents: any[],
    style: string,
    maxLength: number,
    includeKeyPoints: boolean
  ): string {
    const isMultipleArticles = contents.length > 1;

    const styleInstructions = {
      brief: 'Create a concise summary focusing on the main points from each article',
      detailed: 'Create a comprehensive summary that covers the key insights from each article',
      'bullet-points': 'Create a summary using bullet points that clearly separates insights from each article',
    };

    const summaryFormat = isMultipleArticles 
      ? `For each article, provide a separate paragraph or section summarizing its main content, findings, and conclusions. Clearly identify which points come from which article (e.g., "Article 1 - [Title]: ...", "Article 2 - [Title]: ...").`
      : `Provide a comprehensive summary of the article's main content, findings, and conclusions.`;

    const contentList = contents.map((content, index) => 
      `=== ARTICLE ${index + 1}: ${content.title} ===\nURL: ${content.url}\nWord Count: ${content.wordCount}\n\nCONTENT:\n${content.content}`
    ).join('\n\n' + '='.repeat(80) + '\n\n');

    const basePrompt = `Please analyze the following ${isMultipleArticles ? `${contents.length} articles` : 'article'} and create an intelligent summary that captures the essence of the ACTUAL ARTICLE CONTENT.

IMPORTANT: You are analyzing the ACTUAL ARTICLE CONTENT that has been extracted from web pages. Focus on the substance, research findings, methodologies, conclusions, and key insights from the articles themselves.

${styleInstructions[style as keyof typeof styleInstructions]} (approximately ${maxLength} words).

${summaryFormat}

Content to analyze:
${contentList}

Please respond with a JSON object containing:
{
  "summary": "Your ${style} summary of the actual article content here",
  ${includeKeyPoints ? '"keyPoints": ["key insight 1", "key insight 2", "key insight 3"],' : ''}
  "categories": ["research-field", "methodology", "topic"],
  "sentiment": "positive|neutral|negative"
}

Guidelines:
- Focus on the ACTUAL CONTENT of the articles, not metadata
- Summarize research findings, methodologies, conclusions, and key insights
- If multiple articles: clearly separate insights from each article with proper attribution
- Extract 3-5 relevant academic/research categories based on the content
- Analyze sentiment based on the research content and findings
${includeKeyPoints ? '- Include 3-5 key insights from the actual research content' : ''}
- Ensure all text is properly escaped for JSON`;

    return basePrompt;
  }

  private buildWebAnalysisPrompt(
    urls: string[],
    titles: string[],
    style: string,
    maxLength: number,
    includeKeyPoints: boolean
  ): string {
    const isMultipleArticles = urls.length > 1;

    const styleInstructions = {
      brief: 'Create a concise summary focusing on the main points from each article',
      detailed: 'Create a comprehensive summary that covers the key insights from each article',
      'bullet-points': 'Create a summary using bullet points that clearly separates insights from each article',
    };

    const summaryFormat = isMultipleArticles 
      ? `For each article, provide a separate paragraph or section summarizing its main content, findings, and conclusions. Clearly identify which points come from which article (e.g., "Article 1 - [Title]: ...", "Article 2 - [Title]: ...").`
      : `Provide a comprehensive summary of the article's main content, findings, and conclusions.`;

    const urlList = urls.map((url, index) => 
      `${index + 1}. ${titles[index] || 'Article'}: ${url}`
    ).join('\n');

    const basePrompt = `Please analyze the following ${isMultipleArticles ? `${urls.length} web articles` : 'web article'} by accessing their URLs and reading their actual content. Your task is to create an intelligent summary that captures the essence of the ACTUAL ARTICLE CONTENT.

IMPORTANT: Use your web browsing capabilities to access these URLs and read the full content. Focus on the substance, research findings, methodologies, conclusions, and key insights from the articles themselves.

${styleInstructions[style as keyof typeof styleInstructions]} (approximately ${maxLength} words).

${summaryFormat}

URLs to analyze:
${urlList}

Please respond with a JSON object containing:
{
  "summary": "Your ${style} summary of the actual article content here",
  ${includeKeyPoints ? '"keyPoints": ["key insight 1", "key insight 2", "key insight 3"],' : ''}
  "categories": ["research-field", "methodology", "topic"],
  "sentiment": "positive|neutral|negative"
}

Guidelines:
- ACCESS each URL and read the ACTUAL CONTENT of the articles
- Summarize research findings, methodologies, conclusions, and key insights
- If multiple articles: clearly separate insights from each article with proper attribution
- Extract 3-5 relevant academic/research categories based on the content
- Analyze sentiment based on the research content and findings
${includeKeyPoints ? '- Include 3-5 key insights from the actual research content' : ''}
- Handle PDF URLs by accessing their content if possible
- If a URL is inaccessible, note this in your response
- Ensure all text is properly escaped for JSON`;

    return basePrompt;
  }

  private parseAIResponse(response: string): Omit<SummaryResponse, 'totalWordsProcessed' | 'estimatedReadingTime'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        summary: parsed.summary || 'Summary not available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) 
          ? parsed.sentiment 
          : 'neutral',
      };
    } catch (error) {
      // Fallback parsing if JSON fails
      return {
        summary: response.slice(0, 1000),
        keyPoints: [],
        categories: [],
        sentiment: 'neutral',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch {
      return false;
    }
  }

  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length >= 40;
  }
}