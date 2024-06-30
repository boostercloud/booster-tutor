import {
  BoosterService,
  CompletionStatus,
} from "../../../core/services/booster-service";
import { productionEnvironment } from "../../../core/types/environment";
import { OpenAIService } from "../../../core/services/openai-service";
// import { SupabaseService } from "../../../core/services/supabase-service";
import * as CodeCompletion from "../../../core/prompts/code-completion";
import { SQLiteService } from "../../../core/services/sqlite-service";

export const config = {
  runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200 });
  }

  const { question } = (await req.json()) as {
    question?: string;
  };

  if (!question) return new Response("No question provided", { status: 400 });

  const { sectionMatchThreshold, sectionMatchCount, sectionMinContentLength } =
    req.body as {
      sectionMatchThreshold?: string;
      sectionMatchCount?: string;
      sectionMinContentLength?: string;
    };

  const boosterService = new BoosterService(
    productionEnvironment.boosterEndpoint
  );
  const questionId = await boosterService.askQuestion(question);

  const { embedding } = await OpenAIService.generateEmbedding(question);
  const matchingSections = await SQLiteService.getMatchingContext(
    embedding,
    sectionMatchThreshold,
    sectionMatchCount,
    sectionMinContentLength
  );
  const prompt = OpenAIService.generatePromptFromPagesContext(
    CodeCompletion.systemInstruction,
    question,
    matchingSections
  );
  const stream = await OpenAIService.generateCompletionStream(prompt);
  const observedStream = answerStream(questionId, stream, boosterService);

  return new Response(observedStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Question-Id": questionId,
      "Access-Control-Expose-Headers": "X-Question-Id",
    },
  });
};

function answerStream(
  questionId: string,
  stream: ReadableStream,
  boosterService: BoosterService
): ReadableStream {
  let result = "";
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await boosterService.answerQuestion(
              questionId,
              result,
              CompletionStatus.Completed
            );
            break;
          }
          result += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }
      } catch (err) {
        await boosterService.answerQuestion(
          questionId,
          result,
          CompletionStatus.Failed
        );
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

export default handler;
