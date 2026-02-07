import type { Tone, Length, ApiProvider } from '@prisma/client';

interface GenerateArticleParams {
  keyword: string;
  tone: Tone;
  length: Length;
  seoKeywords?: string[];
}

interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  tags?: string[];
}

const TONE_PROMPTS: Record<Tone, string> = {
  FRIENDLY: 'เขียนด้วยน้ำเสียงที่เป็นกันเอง ใกล้ชิด เหมือนเพื่อนคุยกัน ใช้ภาษาที่เข้าใจง่าย',
  FORMAL: 'เขียนด้วยน้ำเสียงที่เป็นทางการ สุภาพ ใช้ภาษาที่เหมาะสมกับบทความวิชาการ',
  EDUCATIONAL: 'เขียนด้วยน้ำเสียงที่ให้ความรู้ อธิบายอย่างละเอียด มีตัวอย่างประกอบ เหมาะสำหรับการสอน',
  SALES: 'เขียนด้วยน้ำเสียงที่ดึงดูด กระตุ้นความสนใจ เน้นประโยชน์และคุณค่า ชักจูงให้ตัดสินใจซื้อ',
  PROFESSIONAL: 'เขียนด้วยน้ำเสียงมืออาชีพ น่าเชื่อถือ ใช้ข้อมูลสนับสนุน แสดงความเชี่ยวชาญในหัวข้อ',
  HUMOROUS: 'เขียนด้วยน้ำเสียงสนุกสนาน มีอารมณ์ขัน แทรกมุกตลก แต่ยังคงให้ข้อมูลที่เป็นประโยชน์',
  INSPIRATIONAL: 'เขียนด้วยน้ำเสียงสร้างแรงบันดาลใจ ให้กำลังใจ กระตุ้นให้ผู้อ่านมีพลังและความหวัง',
  STORYTELLING: 'เขียนด้วยน้ำเสียงเล่าเรื่อง มีการดำเนินเรื่อง มีตัวละคร สถานการณ์ ทำให้ผู้อ่านอินไปกับเนื้อหา',
  NEWS: 'เขียนด้วยน้ำเสียงรายงานข่าว กระชับ ตรงประเด็น เป็นกลาง นำเสนอข้อเท็จจริง ตอบ ใคร ทำอะไร ที่ไหน เมื่อไหร่ อย่างไร',
  REVIEW: 'เขียนด้วยน้ำเสียงรีวิว วิเคราะห์ข้อดีข้อเสีย ให้คะแนน มีความเห็นส่วนตัวแต่ยุติธรรม ช่วยให้ผู้อ่านตัดสินใจ',
};

const LENGTH_TARGETS: Record<Length, { min: number; max: number; words: string }> = {
  SHORT: { min: 400, max: 600, words: '400-600 คำ' },
  MEDIUM: { min: 800, max: 1200, words: '800-1,200 คำ' },
  LONG: { min: 1400, max: 2000, words: '1,400-2,000 คำ' },
};

export class AIService {
  private apiKey: string;
  private provider: ApiProvider;
  private model?: string;

  constructor(apiKey: string, provider: ApiProvider, model?: string) {
    this.apiKey = apiKey;
    this.provider = provider;
    this.model = model;
  }

  async generateArticle(params: GenerateArticleParams): Promise<GeneratedArticle> {
    switch (this.provider) {
      case 'CLAUDE':
        return this.generateWithClaude(params);
      case 'GEMINI':
        return this.generateWithGemini(params);
      case 'OPENAI':
        return this.generateWithOpenAI(params);
      case 'OPENROUTER':
        return this.generateWithOpenRouter(params);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private buildPrompt(params: GenerateArticleParams) {
    const { keyword, tone, length, seoKeywords } = params;
    const toneInstruction = TONE_PROMPTS[tone];
    const lengthTarget = LENGTH_TARGETS[length];

    const systemPrompt = `คุณเป็นนักเขียนบทความมืออาชีพที่เชี่ยวชาญในการเขียนบทความภาษาไทยที่มีคุณภาพสูง SEO-friendly และน่าสนใจ

กฎการเขียน:
1. ${toneInstruction}
2. ความยาวบทความ: ${lengthTarget.words}
3. ใช้หัวข้อย่อย (H2, H3) เพื่อแบ่งเนื้อหาให้อ่านง่าย
4. เขียนเป็นย่อหน้าสั้นๆ 3-4 ประโยคต่อย่อหน้า
5. ใส่ข้อมูลที่เป็นประโยชน์และถูกต้อง
6. หลีกเลี่ยงการใช้คำซ้ำซาก
7. เขียนเนื้อหาที่เป็นต้นฉบับ ไม่ลอกจากที่อื่น
8. หัวข้อบทความห้ามใช้เครื่องหมาย : (colon) โดยเด็ดขาด ให้ใช้คำเชื่อมหรือเขียนเป็นประโยคแทน
9. สร้าง tags 3-5 คำที่เกี่ยวข้องกับบทความ (คำสั้นๆ เหมาะสำหรับ SEO)

รูปแบบ Output:
- ส่งกลับเป็น JSON เท่านั้น
- ไม่ต้องใส่ code block หรือ markdown
- Format: {"title": "...", "content": "...", "excerpt": "...", "tags": ["tag1", "tag2", "tag3"]}
- content ต้องเป็น HTML ที่ถูกต้อง (ใช้ <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)
- excerpt ต้องเป็นข้อความสั้นๆ 1-2 ประโยค สรุปเนื้อหาบทความ
- tags ต้องเป็น array ของ string 3-5 คำที่เกี่ยวข้อง`;

    const userPrompt = `เขียนบทความเกี่ยวกับ: "${keyword}"
${seoKeywords && seoKeywords.length > 0 ? `\nSEO Keywords ที่ต้องใช้ในบทความ: ${seoKeywords.join(', ')}` : ''}

สร้างบทความที่:
1. มีหัวข้อที่น่าสนใจ ดึงดูดให้คลิก (ห้ามใช้เครื่องหมาย : ในหัวข้อ)
2. เนื้อหาครบถ้วน ตอบคำถามผู้อ่าน
3. SEO-friendly มี keyword หลักอยู่ในหัวข้อและเนื้อหา
4. มีโครงสร้างที่ดี อ่านง่าย`;

    return { systemPrompt, userPrompt };
  }

  private parseResponse(content: string): GeneratedArticle {
    // Clean up the response - remove any markdown code blocks if present
    let cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON object from the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      // If JSON parsing fails, try to fix common issues
      // Sometimes AI returns content with unescaped newlines in strings
      try {
        // Try to parse by extracting fields manually using regex
        const titleMatch = cleanedContent.match(/"title"\s*:\s*"([^"]+)"/);
        const excerptMatch = cleanedContent.match(/"excerpt"\s*:\s*"([^"]+)"/);

        // For content, it's more complex - find the content field and extract until the next field or end
        const contentStart = cleanedContent.indexOf('"content"');
        if (contentStart === -1 || !titleMatch) {
          throw new Error('Could not extract article fields from response');
        }

        // Find where content value starts (after "content": ")
        const contentValueStart = cleanedContent.indexOf(':', contentStart) + 1;
        let contentValue = cleanedContent.slice(contentValueStart).trim();

        // Remove leading quote
        if (contentValue.startsWith('"')) {
          contentValue = contentValue.slice(1);
        }

        // Find the end of content - look for ", "excerpt" or ", "title" or just "}"
        let contentEnd = contentValue.length;
        const excerptPos = contentValue.lastIndexOf('", "excerpt"');
        const endBracePos = contentValue.lastIndexOf('"}');

        if (excerptPos !== -1) {
          contentEnd = excerptPos;
        } else if (endBracePos !== -1) {
          contentEnd = endBracePos;
        }

        const extractedContent = contentValue.slice(0, contentEnd);

        parsed = {
          title: titleMatch[1],
          content: extractedContent,
          excerpt: excerptMatch ? excerptMatch[1] : '',
        };
      } catch (extractError) {
        throw new Error(`Failed to parse AI response: ${(e as Error).message}`);
      }
    }

    if (!parsed.title || !parsed.content) {
      throw new Error('Invalid response format: missing title or content');
    }

    // Clean up the title - remove colons and clean up spacing
    let cleanTitle = parsed.title
      .replace(/:/g, ' ')           // Replace colon with space
      .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
      .trim();

    // Clean up content - handle escaped newlines
    let cleanContent = parsed.content
      .replace(/\\n\\n/g, '</p><p>')  // Double escaped newlines -> paragraph break
      .replace(/\\n/g, '<br>')         // Single escaped newline -> line break
      .replace(/\n\n/g, '</p><p>')     // Double actual newlines -> paragraph break
      .replace(/\n/g, ' ')             // Single actual newlines -> space
      .replace(/<p><\/p>/g, '')        // Remove empty paragraphs
      .replace(/<br>\s*<br>/g, '</p><p>') // Double line breaks -> paragraph
      .trim();

    // Extract tags if present
    let tags: string[] = [];
    if (parsed.tags && Array.isArray(parsed.tags)) {
      tags = parsed.tags.filter((t: any) => typeof t === 'string' && t.trim().length > 0);
    }

    return {
      title: cleanTitle,
      content: cleanContent,
      excerpt: parsed.excerpt || '',
      tags: tags.length > 0 ? tags : undefined,
    };
  }

  private async generateWithClaude(params: GenerateArticleParams): Promise<GeneratedArticle> {
    const { systemPrompt, userPrompt } = this.buildPrompt(params);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate article with Claude');
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    if (!content) {
      throw new Error('No content generated');
    }

    return this.parseResponse(content);
  }

  private async generateWithGemini(params: GenerateArticleParams): Promise<GeneratedArticle> {
    const { systemPrompt, userPrompt } = this.buildPrompt(params);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate article with Gemini');
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content generated');
    }

    return this.parseResponse(content);
  }

  private async generateWithOpenAI(params: GenerateArticleParams): Promise<GeneratedArticle> {
    const { systemPrompt, userPrompt } = this.buildPrompt(params);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate article with OpenAI');
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    return this.parseResponse(content);
  }

  private async generateWithOpenRouter(params: GenerateArticleParams): Promise<GeneratedArticle> {
    const { systemPrompt, userPrompt } = this.buildPrompt(params);

    // Use configured model or default to claude-sonnet-4
    const modelToUse = this.model || 'anthropic/claude-sonnet-4';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://ai-wp-publisher.local',
        'X-Title': 'AI WordPress Publisher',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate article with OpenRouter');
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    return this.parseResponse(content);
  }
}
