import {
  BoosterService,
  ReactionStatus,
} from "../../../core/services/booster-service";
import { productionEnvironment } from "../../../core/types/environment";

export const config = {
  runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200 });
  }

  const { questionID, reaction } = (await req.json()) as {
    questionID?: string;
    reaction: ReactionStatus;
  };

  if (!questionID)
    return new Response("No question id provided", { status: 400 });
  if (!reaction)
    return new Response("No reaction status provided", { status: 401 });

  const boosterService = new BoosterService(
    productionEnvironment.boosterEndpoint
  );

  const success = await boosterService.reactToAnswer(questionID, reaction);
  if (!success)
    return new Response("Failed to react to answer", { status: 403 });

  return new Response("OK", { status: 200 });
};

export default handler;
