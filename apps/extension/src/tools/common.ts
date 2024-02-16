import { Tool } from "../common";

export type ToolInterface = {
  name: string;
  description: string;
  handle: (input: string) => Promise<string>;
};

export const makeTool = (
  self: ToolInterface
): Tool => ({
  name: self.name,
  description: self.description,
  call: async (rawInput: string): Promise<string> => {
    try {
      return await self.handle(rawInput);
    } catch (error) {
      return JSON.stringify(error)
    }
  },
});
