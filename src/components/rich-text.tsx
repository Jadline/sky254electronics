import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shows page text written in the dashboard. A small, safe subset of Markdown:
 *
 *   ## Heading          ### Smaller heading
 *   - List item         **bold**          [link text](/delivery)
 *
 * A blank line starts a new paragraph. Nothing is ever rendered as HTML.
 */

type Block =
  | { kind: "h2" | "h3" | "p"; text: string }
  | { kind: "ul"; items: string[] };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
    if (list.length) blocks.push({ kind: "ul", items: list });
    paragraph = [];
    list = [];
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (/^#{2,3}\s/.test(line)) {
      flush();
      blocks.push({ kind: line.startsWith("###") ? "h3" : "h2", text: line.replace(/^#+\s*/, "") });
    } else if (/^[-*]\s/.test(line)) {
      if (paragraph.length) flush();
      list.push(line.slice(2).trim());
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

/** The text without Markdown marks, for search engines' structured data. */
export function plainText(text: string) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1");
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const key = `${at}`;
    if (match[3] != null) {
      parts.push(<strong key={key} className="font-medium text-text">{match[3]}</strong>);
    } else {
      const href = safeHref(match[2]);
      if (!href) parts.push(match[1]);
      else if (href.startsWith("/"))
        parts.push(<Link key={key} href={href} className="font-medium text-brand hover:underline">{match[1]}</Link>);
      else
        parts.push(<a key={key} href={href} className="font-medium text-brand hover:underline">{match[1]}</a>);
    }
    last = at + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function RichText({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-body">
      {parseBlocks(source).map((block, i) => {
        if (block.kind === "h2") return <h2 key={i} className="mt-4 text-xl font-medium text-text first:mt-0">{inline(block.text)}</h2>;
        if (block.kind === "h3") return <h3 key={i} className="mt-2 text-base font-medium text-text">{inline(block.text)}</h3>;
        if (block.kind === "ul")
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-brand">
              {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
            </ul>
          );
        return <p key={i}>{inline(block.text)}</p>;
      })}
    </div>
  );
}

/** Each "## Question" and the text under it, for the FAQs page. */
export function faqPairs(source: string) {
  const pairs: { question: string; blocks: Block[] }[] = [];
  for (const block of parseBlocks(source)) {
    if (block.kind === "h2") pairs.push({ question: block.text, blocks: [] });
    else pairs.at(-1)?.blocks.push(block);
  }
  return pairs;
}

export function blocksToPlainText(blocks: Block[]) {
  return blocks.map((b) => plainText(b.kind === "ul" ? b.items.join(". ") : b.text)).join("\n\n");
}

export function blocksToSource(blocks: Block[]) {
  return blocks
    .map((b) => (b.kind === "ul" ? b.items.map((item) => `- ${item}`).join("\n") : b.kind === "p" ? b.text : `${b.kind === "h2" ? "##" : "###"} ${b.text}`))
    .join("\n\n");
}
