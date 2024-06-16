import Database from "better-sqlite3";
import PageSectionMatch from "../types/page-section-match";
import Page from "../types/page";
import PageSection from "../types/page-section";

// Open SQLite database
const db = new Database("database.sqlite");

export class SQLiteService {
  static sectionMatchThreshold = parseFloat(
    process.env["SECTION_MATCH_THRESHOLD"] || "0.78"
  );
  static sectionMatchCount = parseInt(
    process.env["SECTION_MATCH_COUNT"] || "10"
  );
  static sectionMinContentLength = parseInt(
    process.env["SECTION_MIN_CONTENT_LENGTH"] || "50"
  );

  static async getPage(id: string): Promise<Page | undefined> {
    const stmt = db.prepare("SELECT * FROM pages WHERE id = ?");
    const row = stmt.get(id) as Page;

    if (!row) {
      return undefined;
    }

    return {
      id: row.id.toString(),
      path: row.path,
      title: row.title,
      checksum: row.checksum,
    };
  }

  static async insertPage(
    path: string,
    title: string,
    checksum: string
  ): Promise<Page> {
    const stmt = db.prepare(
      "INSERT INTO pages (path, title, checksum) VALUES (?, ?, ?)"
    );
    const info = stmt.run(path, title, checksum);

    return {
      id: info.lastInsertRowid.toString(),
      path: path,
      title: title,
      checksum: checksum,
    };
  }

  static async insertPageSection(
    pageId: string,
    content: string,
    tokenCount: number,
    embedding: number[]
  ): Promise<PageSection> {
    const buffer = Buffer.from(new Float32Array(embedding).buffer);
    const stmt = db.prepare(
      "INSERT INTO page_sections (page_id, content, token_count, embedding) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(pageId, content, tokenCount, buffer);

    return {
      id: info.lastInsertRowid.toString(),
      pageId: pageId,
      content: content,
      tokenCount: tokenCount,
      embedding: embedding,
    };
  }

  static async getMatchingContext(
    embedding: number[]
  ): Promise<PageSectionMatch[]> {
    const buffer = Buffer.from(new Float32Array(embedding).buffer);

    const stmt = db.prepare(`
      SELECT p.path, p.title, ps.content, 
      (ps.embedding - ?) AS similarity 
      FROM page_sections ps
      JOIN pages p ON ps.page_id = p.id
      WHERE LENGTH(ps.content) >= ? 
      ORDER BY similarity 
      LIMIT ?
    `);

    const rows = stmt.all(
      buffer,
      this.sectionMinContentLength,
      this.sectionMatchCount
    );

    return rows.map((row: any) => ({
      path: row.path,
      title: row.title,
      content: row.content,
      similarity: row.similarity,
    }));
  }
}
