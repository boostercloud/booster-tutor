import getAgentBuilder from "./agent-builder";
import Tools from "../tools";
import { Agent } from "../common";

export default async function (communicator: Agent) {
  const AgentBuilder = await getAgentBuilder();
  const callbacks = [];
  callbacks.push({
    handleAgentAction: async (action: any) => {
      await communicator.call(
        `Give me some time, I need to use the tool ${action.tool} to help you.`
      );
    },
  });
  const { ChatOpenAI } = require("langchain/chat_models/openai");
  const { BufferMemory } = require("langchain/memory");
  // const replacer = await Tools.Replacer();
  const executor = await AgentBuilder.withModel(
    new ChatOpenAI({ temperature: 0 })
  )
    .withTool(Tools.FileReader)
    .withTool(Tools.FileWriter)
    .withMemory(
      new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
        inputKey: "input",
      })
    )
    .build();

  return {
    async call(
      currentFilePath: string | undefined,
      request: string
    ): Promise<string> {
      const instructions =
        "Before giving a final answer, always make sure that you have thoroughly searched for the information you need using the tools you've got available. E.g. if the user is asking about information about a specific file, make sure you've checked the file before giving an answer. If a tool responds with an error, you should try to fix the error and try again. If you're unable to perform an operation, or the tool doesn't respond with a success confirmation message, you should tell me that something went wrong. You can use multiple tools in a row in order to perform a complex operation. For example, to modify the contents of a file, you can use the file-reader tool to read the contents of the file, modify the contents yourself, and then use the file-writer tool to write the new contents into the file.";
      const prompt = currentFilePath
        ? `If I talk about doing actions over code, but don't mention a file, I mean the current file, whose path is ${currentFilePath}, please respond to the following: ${request}`
        : request;
      const input = `${instructions}
      ${prompt}`;
      const result = await executor.call({ input });
      return result["output"] as string;
    },
  };
}
