import * as fs from "node:fs/promises";
import { makeTool } from "./common";

export default makeTool({
  name: "file-writer",

  description:
    "useful when you want to write content into file. It COMPLETELY OVERWRITES the file with the new content. The input should be two strings separated by a triple dollar sign ($$$), representing the file path and the content to write into the file. For example, `/foo/bar$$$quux` would be the input to write `quux` into the file `/foo/bar`.",

  async handle(input: string) {
    const [file, content] = input.split("$$$");
    if (!file || !content) {
      throw new Error(
        "Invalid input format. It should be [FILEPATH]:[CONTENT]. E.g. /path/to/some/file:Some content to write into the file."
      );
    }
    await fs.writeFile(file, content, { encoding: "utf8" });
    return `Wrote content into file ${file} successfully.`;
  },
});
