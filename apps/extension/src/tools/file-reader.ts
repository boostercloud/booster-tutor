import * as fs from "node:fs/promises";
import { makeTool } from "./common";

export default makeTool({
  name: "file-reader",

  description: "Reads the contents of file",

  async handle(input: string) {
    const enumerateLines = input.startsWith("[ENUM]");
    const file = input.replace("[ENUM]", "");
    const contents = await fs.readFile(file, { encoding: "utf8" });
    if (enumerateLines) {
      return contents
        .split("\n")
        .map((line, index) => `${index}: ${line}`)
        .join("\n");
    }
    return contents;
  },
});
