export default async function (sendMessage: (message: string) => void) {
  const { ChatOpenAI } = require("langchain/chat_models/openai");
  const { HumanChatMessage } = require("langchain/schema");

  const chat = new ChatOpenAI();
  const prompt =
    "Your task is to convert the input to what a very friendly programming assistant would say to one of their coworkers. Use monkey-related emojis whenever possible, but avoid them in the beginning.Avoid greetings and farewells, be concise and straight to the point.If in the input there's a reference to a name 'Assistant' it should be replaced with 'Orangutina'\n\nInput:";
  return {
    call: async (input: string): Promise<string> => {
      const response = await chat.call([
        new HumanChatMessage(`${prompt}\n${input}`),
      ]);
      const result = response.text;
      await sendMessage(result);
      return result;
    },
  };
}
