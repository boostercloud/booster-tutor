import { BaseChatMemory, Tool, BaseChatModel, AgentExecutor } from "../common";

export default async function () {
  const { initializeAgentExecutorWithOptions } = require("langchain/agents");

  return class AgentBuilder {
    static withModel(model: BaseChatMemory): AgentBuilder {
      return new AgentBuilder(model);
    }

    private readonly tools: Tool[] = [];
    private readonly callbacks: ((message: string) => Promise<string>)[] = [];
    private memory!: BaseChatMemory;
    private systemMessage?: string;
    private humanMessage?: string;

    private constructor(private readonly model: BaseChatModel) {}

    withTool(tool: Tool): this {
      this.tools.push(tool);
      return this;
    }

    withSystemMessage(systemMessage: string): this {
      this.systemMessage = systemMessage;
      return this;
    }

    withHumanMessage(humanMessage: string): this {
      this.humanMessage = humanMessage;
      return this;
    }

    withCallback(callback: (message: string) => Promise<string>): this {
      this.callbacks.push(callback);
      return this;
    }

    withMemory(memory: BaseChatMemory): this {
      this.memory = memory;
      return this;
    }

    async build(): Promise<AgentExecutor> {
      const executor = await initializeAgentExecutorWithOptions(
        this.tools,
        this.model,
        {
          agentType: "chat-conversational-react-description",
          callbacks: this.callbacks,
          verbose: true,
          systemMessage: this.systemMessage,
          humanMessage: this.humanMessage,
        }
      );
      executor.memory = this.memory;
      return executor;
    }
  };
}
