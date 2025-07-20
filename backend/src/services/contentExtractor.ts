import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  content: string;
  description?: string | undefined;
  author?: string | undefined;
  publishDate?: string | undefined;
  wordCount: number;
}

export class ContentExtractorService {
  private static readonly USER_AGENT = 'Mozilla/5.0 (compatible; IntelliMark/1.0; +https://intellimark.app)';
  private static readonly TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_CONTENT_LENGTH = 200000; // Limit content size

  static async extractContent(url: string): Promise<ExtractedContent> {
    try {
      // Validate URL
      new URL(url);
      
      // Handle PDF URLs specially
      if (url.toLowerCase().includes('.pdf')) {
        throw new Error('PDF content extraction not supported. Please use the HTML version of the article if available.');
      }
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.TIMEOUT,
        maxContentLength: this.MAX_CONTENT_LENGTH,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
      
      // Extract content with multiple strategies
      const content = this.extractMainContent($);
      const title = this.extractTitle($);
      const description = this.extractDescription($);
      const author = this.extractAuthor($);
      const publishDate = this.extractPublishDate($);
      
      // Clean and validate content
      const cleanContent = this.cleanText(content);
      const wordCount = this.getWordCount(cleanContent);
      
      if (cleanContent.length < 100) {
        throw new Error('Insufficient content extracted from URL');
      }

      return {
        title: title || 'Untitled',
        content: cleanContent,
        description,
        author,
        publishDate,
        wordCount,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - URL took too long to respond');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied - website blocks automated access');
        }
        if (error.response?.status === 404) {
          throw new Error('URL not found');
        }
        if (error.response && error.response.status >= 500) {
          throw new Error('Server error - website temporarily unavailable');
        }
      }
      
      if (error instanceof Error) {
        throw new Error(`Content extraction failed: ${error.message}`);
      }
      
      throw new Error('Unknown error during content extraction');
    }
  }

  private static extractMainContent($: cheerio.CheerioAPI): string {
    // Try multiple content extraction strategies
    const strategies = [
      // Strategy 1: Academic paper specific (arXiv, research papers)
      () => {
        const abstract = $('.abstract, .ltx_abstract, #abstract').text();
        const content = $('.ltx_document, .paper-content, .article-body').text();
        return abstract && content ? `${abstract}\n\n${content}` : content || abstract;
      },
      
      // Strategy 2: Article tags
      () => $('article').text(),
      
      // Strategy 3: Main content areas
      () => $('main, [role="main"]').text(),
      
      // Strategy 4: Common content selectors
      () => $('.content, .post-content, .entry-content, .article-content, .post-body').text(),
      
      // Strategy 5: Structured data
      () => $('[itemscope][itemtype*="Article"] [itemprop="articleBody"]').text(),
      
      // Strategy 6: Medium/Substack specific
      () => $('section[data-field="body"], .markup, .post-content').text(),
      
      // Strategy 7: Research paper specific
      () => {
        const sections = $('.section, .ltx_section, .sec').map((_, el) => $(el).text().trim()).get();
        return sections.filter(s => s.length > 100).join('\n\n');
      },
      
      // Strategy 8: Paragraph extraction with better filtering
      () => {
        const paragraphs = $('p').map((_, el) => {
          const text = $(el).text().trim();
          // Filter out navigation, footer, and short paragraphs
          const parent = $(el).parent();
          if (parent.is('nav, footer, aside, .nav, .footer, .sidebar, .advertisement')) {
            return '';
          }
          return text.length > 30 ? text : '';
        }).get();
        return paragraphs.filter(p => p.length > 0).join('\n\n');
      },
    ];

    for (const strategy of strategies) {
      const content = strategy();
      if (content && content.trim().length > 300) {
        return content;
      }
    }

    // Last resort: body text with better cleaning
    const bodyText = $('body').text();
    return this.cleanText(bodyText);
  }

  private static extractTitle($: cheerio.CheerioAPI): string {
    return (
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      ''
    ).trim();
  }

  private static extractDescription($: cheerio.CheerioAPI): string | undefined {
    const desc = (
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
    ).trim();
    
    return desc || undefined;
  }

  private static extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const author = (
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').text() ||
      $('.author, .byline').first().text() ||
      ''
    ).trim();
    
    return author || undefined;
  }

  private static extractPublishDate($: cheerio.CheerioAPI): string | undefined {
    const dateStr = (
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish_date"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      $('time').first().text() ||
      ''
    ).trim();
    
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    return undefined;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up excessive line breaks
      .replace(/^\s*[\n\r]+|[\n\r]+\s*$/g, '') // Remove leading/trailing newlines
      .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1 $2') // Join sentences split across lines
      .replace(/\s+([.!?,:;])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
      .trim();
  }

  private static getWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}