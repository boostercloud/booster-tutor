import Database from "better-sqlite3";
import csvtojson from "csvtojson";
import path from "path";

// Paths to your CSV files relative to the project root
const pagesCSVPath = path.resolve(
  __dirname,
  "../../../src/core/database/page_v1_rows.csv"
);
const pagesMatchCSVPath = path.resolve(
  __dirname,
  "../../../src/core/database/page_section_v1_rows.csv"
);

// Open SQLite database
const db = new Database("database.sqlite");

// Create tables with explicit IDs
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    path TEXT,
    title TEXT,
    checksum TEXT
  );

  CREATE TABLE IF NOT EXISTS page_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id TEXT,
    content TEXT,
    token_count INTEGER,
    embedding BLOB,
    FOREIGN KEY (page_id) REFERENCES pages(id)
  );
`);

export async function importCSV() {
  try {
    // Read and insert pages CSV data
    const pagesData = await csvtojson().fromFile(pagesCSVPath);
    const insertPageStmt = db.prepare(
      "INSERT INTO pages (id, path, title, checksum) VALUES (?, ?, ?, ?)"
    );
    const insertPageTransaction = db.transaction((rows: any[]) => {
      for (const row of rows) {
        // Convert to correct types
        const id = String(row.id);
        const path = String(row.path);
        const title = String(row.title);
        const checksum = String(row.checksum);

        // Check if the page id already exists
        const pageExists = db
          .prepare("SELECT 1 FROM pages WHERE id = ?")
          .get(id);
        if (!pageExists) {
          insertPageStmt.run(id, path, title, checksum);
        } else {
          console.warn(`Page ID ${id} already exists. Skipping.`);
        }
      }
    });
    insertPageTransaction(pagesData);

    console.log("Pages data imported successfully");

    // Now insert page_sections CSV data
    const pagesMatchData = await csvtojson().fromFile(pagesMatchCSVPath);
    const insertPagesMatchStmt = db.prepare(
      "INSERT INTO page_sections (page_id, content, token_count, embedding) VALUES (?, ?, ?, ?)"
    );
    const insertPagesMatchTransaction = db.transaction((rows: any[]) => {
      for (const row of rows) {
        // Convert to correct types
        const page_id = String(row.page_id);
        const content = String(row.content);
        const token_count = parseInt(row.token_count, 10);
        const embeddingArray = row.embedding.split(",").map(Number);
        const embeddingBuffer = Buffer.from(
          new Float32Array(embeddingArray).buffer
        );

        // Check if the page_id exists in the pages table
        const pageExists = db
          .prepare("SELECT 1 FROM pages WHERE id = ?")
          .get(page_id);
        if (pageExists) {
          insertPagesMatchStmt.run(
            page_id,
            content,
            token_count,
            embeddingBuffer
          );
        } else {
          console.error(`Page ID ${page_id} does not exist in pages table.`);
        }
      }
    });
    insertPagesMatchTransaction(pagesMatchData);

    console.log("Page sections data imported successfully");
  } catch (error) {
    console.error("Failed to import CSV data:", error);
  } finally {
    db.close();
  }
}
