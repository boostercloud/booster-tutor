export type BaseChatMemory = any & { readonly _symbol: unique symbol };
export type BaseChatModel = any & { readonly _symbol: unique symbol };
export type AgentExecutor = any & { readonly _symbol: unique symbol };
export interface Tool {
  call(argument: string): Promise<string>;

  name: string;

  description: string;
}

export interface Agent {
  call: (input: string) => Promise<string>;
}
