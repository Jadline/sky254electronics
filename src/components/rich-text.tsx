import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shows page text written in the dashboard. A small, safe subset of Markdown:
 *
 *   ## Heading          ### Smaller heading
 *   - List item         1. Numbered item
 *   **bold**            [link text](/delivery)
 *   | Cookie | Duration |      a table: a header row, a --- row, then the rows
 *   | ------ | -------- |
 *   [Consent Preferences](#consent-preferences)   a button that reopens the cookie banner
 *
 * A blank line starts a new paragraph. Nothing is ever rendered as HTML. The dashboard's
 * Legal pages editor saves exactly this subset.
 */

type Block =
  | { kind: "h2" | "h3" | "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

/** The link that opens the CookieYes consent banner again, for the Cookie policy. */
export const CONSENT_HREF = "#consent-preferences";

/** "| a | b \| c |" → ["a", "b \| c"]. Escaped pipes stay in the cell. */
const tableCells = (line: string) =>
  line
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
const isTableRow = (line: string) => line.startsWith("|");
const isTableRule = (line: string) => /^\|?[\s:|-]+\|?$/.test(line) && line.includes("-") && line.includes("|");

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listKind: "ul" | "ol" = "ul";
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
    if (list.length) blocks.push({ kind: listKind, items: list });
    paragraph = [];
    list = [];
  };

  const lines = source.replace(/\r\n?/g, "\n").split("\n").map((raw) => raw.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const item = /^(?:([-*+])|\d{1,3}[.)])\s+(.*)$/.exec(line);
    if (isTableRow(line) && isTableRule(lines[i + 1] ?? "")) {
      flush();
      const header = tableCells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && isTableRow(lines[i]); i++) {
        const cells = tableCells(lines[i]);
        rows.push(header.map((_, c) => cells[c] ?? ""));
      }
      i--;
      blocks.push({ kind: "table", header, rows });
    } else if (!line) {
      flush();
    } else if (/^#{1,6}\s/.test(line)) {
      flush();
      blocks.push({ kind: /^#{3,}/.test(line) ? "h3" : "h2", text: line.replace(/^#+\s*/, "") });
    } else if (item) {
      const kind = item[1] ? "ul" : "ol";
      if (paragraph.length || (list.length && kind !== listKind)) flush();
      listKind = kind;
      list.push(item[2].trim());
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** Only links to this site, https pages, email and phone. Anything else shows as plain text. */
function safeHref(href: string) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(https:\/\/|mailto:|tel:)/i.test(href)) return href;
  return null;
}

/** "off\_now" → "off_now". The dashboard editor escapes characters that mean something in Markdown. */
const unescape = (text: string) => text.replace(/\\([\\`*_{}[\]()#+\-.!|>~<])/g, "$1");

/** The text without Markdown marks, for search engines' structured data. */
export function plainText(text: string) {
  return unescape(text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1"));
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(unescape(text.slice(last, at)));
    const key = `${at}`;
    if (match[3] != null) {
      parts.push(<strong key={key} className="font-medium text-text">{unescape(match[3])}</strong>);
    } else {
      const label = unescape(match[1]);
      const href = safeHref(match[2]);
      if (match[2] === CONSENT_HREF) {
        // CookieYes opens its preferences on a click on anything with this class.
        parts.push(
          <button
            key={key}
            type="button"
            className="cky-banner-element cursor-pointer border border-line bg-tint px-[30px] py-2.5 text-[15px] text-brand transition-colors hover:border-brand"
          >
            {label}
          </button>,
        );
      } else if (!href) parts.push(label);
      else if (href.startsWith("/"))
        parts.push(<Link key={key} href={href} className="font-medium text-brand hover:underline">{label}</Link>);
      else
        parts.push(<a key={key} href={href} className="font-medium text-brand hover:underline">{label}</a>);
    }
    last = at + match[0].length;
  }
  if (last < text.length) parts.push(unescape(text.slice(last)));
  return parts;
}

/** A table cell: the editor saves a line break inside a cell as <br>. */
function cellContent(text: string): ReactNode[] {
  return text.split(/<br\s*\/?>/i).flatMap((line, i) => (i === 0 ? inline(line) : [<br key={`br${i}`} />, ...inline(line)]));
}

export function RichText({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-body">
      {parseBlocks(source).map((block, i) => {
        if (block.kind === "h2") return <h2 key={i} className="mt-4 text-xl font-medium text-text first:mt-0">{inline(block.text)}</h2>;
        if (block.kind === "h3") return <h3 key={i} className="mt-2 text-base font-medium text-text">{inline(block.text)}</h3>;
        if (block.kind === "table") {
          return (
            // Scrolls sideways on phones instead of squashing the columns.
            <div key={i} className="overflow-x-auto">
              <table className="w-full min-w-[480px] border border-line text-left text-sm">
                <thead className="bg-tint text-text">
                  <tr>
                    {block.header.map((cell, c) => (
                      <th key={c} scope="col" className="border border-line px-4 py-3 font-medium">{cellContent(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className="border border-line px-4 py-3 align-top">{cellContent(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if ("items" in block) {
          const items = block.items.map((item, j) => <li key={j}>{inline(item)}</li>);
          return block.kind === "ol" ? (
            <ol key={i} className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-medium marker:text-brand">{items}</ol>
          ) : (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-brand">{items}</ul>
          );
        }
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}

export function blocksToPlainText(blocks: Block[]) {
  return blocks
    .map((b) =>
      plainText(
        b.kind === "table"
          ? [b.header, ...b.rows].map((row) => row.join(", ").replace(/<br\s*\/?>/gi, " ")).join(". ")
          : "items" in b
            ? b.items.join(". ")
            : b.text,
      ),
    )
    .join("\n\n");
}

/** The "## " headings, in order. The Legal pages editor lists them as the page's sections. */
export function headings(source: string) {
  return parseBlocks(source).flatMap((b) => (b.kind === "h2" ? [plainText(b.text)] : []));
}
