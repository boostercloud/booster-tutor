const path = require("path");

export const dbDirectory = path.join(__dirname, "data");
export const dbPath = path.join(dbDirectory, "database.sqlite");
