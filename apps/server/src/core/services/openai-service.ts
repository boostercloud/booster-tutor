import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import PageSectionMatch from "../types/page-section-match";
import GPT3Tokenizer from "gpt3-tokenizer";

export class OpenAIService {
  private static apiKey = process.env["OPENAI_API_KEY"] ?? "";
  private static endpoint = "https://api.openai.com/v1";
  private static maxTokensCompletion = parseInt(
    process.env["MAX_TOKENS_COMPLETION"] ?? "512"
  );
  private static maxTokensContext = parseInt(
    process.env["MAX_TOKENS_CONTEXT"] ?? "2000"
  );
  private static maxTokensEmbedding = parseInt(
    process.env["MAX_TOKENS_EMBEDDING"] ?? "8000"
  );

  static async isQueryFlagged(query: string): Promise<boolean> {
    const sanitizedQuery = query.trim();
    const response = await fetch(`${this.endpoint}/moderations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: sanitizedQuery,
      }),
    });
    const body = await response.json();
    return body.results[0].flagged;
  }

  static async generateEmbedding(text: string) {
    const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
    const encoded = tokenizer.encode(text);

    if (encoded.text.length > this.maxTokensEmbedding) {
      throw new Error("Input text is too long");
    }

    const response = await fetch(`${this.endpoint}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    });
    const body = await response.json();

    return {
      embedding: body.data[0].embedding,
      tokenCount: encoded.text.length,
    };
  }

  static getMatchingContext(sections: PageSectionMatch[]): string[] {
    if (sections.length === 0) {
      return [];
    }

    const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
    let tokenCount = 0;
    const context: string[] = [];

    for (let i = 0; i < sections.length; i++) {
      const pageSection = sections[i];
      const content =
        `From page [${
          pageSection?.title ?? ""
        }](https://docs.boosterframework.com/${pageSection?.path ?? ""}):\n\n` +
        pageSection?.content;
      const encoded = tokenizer.encode(content);
      const encodedTokens = encoded.text.length;
      const provisionalTokenCount = tokenCount + encodedTokens;

      if (provisionalTokenCount > this.maxTokensContext) {
        const remainingTokens = this.maxTokensContext - tokenCount;
        const length = Math.floor(
          content.length / Math.ceil(encodedTokens / remainingTokens)
        );
        context.push(content.substring(0, length).trim());
        break;
      }

      tokenCount = provisionalTokenCount;
      context.push(content.trim());
    }

    return context;
  }

  static generatePromptFromPagesContext(
    promptGenerator: (content: string) => string,
    question: string,
    matchingSections: PageSectionMatch[]
  ) {
    const context = this.getMatchingContext(matchingSections);
    const prompt = [
      {
        role: "system",
        content: promptGenerator(
          context
            .map((section) => `Documentation section: ${section}`)
            .join("\n\n")
        ),
      },
      { role: "user", content: question },
    ];
    return prompt;
  }

  static async generateCompletionStream(
    prompt: {
      role: string;
      content: string;
    }[]
  ) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let counter = 0;

    const res = await fetch(`${this.endpoint}/chat/completions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: prompt,
        max_tokens: OpenAIService.maxTokensCompletion,
        temperature: 0.05,
        stream: true,
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        function onParse(event: ParsedEvent | ReconnectInterval) {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta.content;
              if (!text) return;
              if (counter < 2 && (text.match(/\n/) || []).length) {
                return;
              }
              const queue = encoder.encode(text);
              controller.enqueue(queue);
              counter++;
            } catch (e) {
              controller.error(e);
            }
          }
        }

        const parser = createParser(onParse);
        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return stream;
  }
}
