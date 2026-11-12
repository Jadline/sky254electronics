"use client";

// A "what you see is what you get" editor for long documents (the legal pages): headings look
// like headings and lists like lists, and pasting from Word, Google Docs or a policy generator
// keeps them. Built on TipTap (ProseMirror).
//
// What's saved is still Markdown (## heading, - item, **bold**), so the website keeps its small,
// safe renderer (components/rich-text.tsx). The editor only offers what that renderer can show:
// two heading sizes, bold, links, and bullet and numbered lists.
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  LinkIcon,
  LinkSlashIcon,
  ListBulletIcon,
  NumberedListIcon,
} from "@heroicons/react/24/outline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type ComponentType, type FormEvent, type SVGProps } from "react";
import { buttonClass } from "@/components/admin/ui";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** The class on the editable area. The guide beside the editor finds headings inside it. */
export const EDITOR_CONTENT_CLASS = "legal-editor-content";

// The page already has its title, so a pasted h1 becomes a heading and anything smaller than
// h3 becomes a subheading: nothing pasted is lost or turned into plain text.
const normalizeHeadings = (html: string) => html.replace(/<(\/?)h1\b/gi, "<$1h2").replace(/<(\/?)h[4-6]\b/gi, "<$1h3");

export function RichTextEditor({ value, onChange, label }: { value: string; onChange: (markdown: string) => void; label: string }) {
  // The Markdown this editor last reported. When `value` changes to something else (e.g. "Reset
  // to starter text"), it's loaded in; when it's just our own change coming back, nothing happens.
  const emitted = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // The website can't show these, so they'd be lost or appear as stray symbols.
        italic: false,
        strike: false,
        underline: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        hardBreak: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: { "aria-label": label, class: EDITOR_CONTENT_CLASS },
      transformPastedHTML: normalizeHeadings,
    },
    onUpdate: ({ editor: current }) => {
      const markdown = current.getMarkdown();
      emitted.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="rounded-[20px] border border-adm-line bg-white">
      {editor ? <Toolbar editor={editor} /> : <div className="h-[57px] rounded-t-[20px] border-b border-adm-line bg-adm-surface" />}
      {/* The text, styled like the page on the website */}
      <div
        className="cursor-text px-5 py-8 md:px-12 md:py-10 [&_.legal-editor-content]:mx-auto [&_.legal-editor-content]:min-h-[30rem] [&_.legal-editor-content]:max-w-[720px] [&_.legal-editor-content]:space-y-4 [&_.legal-editor-content]:text-[15px] [&_.legal-editor-content]:leading-relaxed [&_.legal-editor-content]:text-adm-body [&_.legal-editor-content]:outline-none [&_a]:font-medium [&_a]:text-adm-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-adm-ink [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-adm-ink [&_li]:my-1 [&_li]:pl-1 [&_li_p]:m-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_li]:marker:text-adm-primary [&_strong]:font-semibold [&_strong]:text-adm-ink [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:marker:text-adm-primary"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ---------------- Toolbar ----------------

const BLOCK_TYPES = [
  { key: "paragraph", label: "Text" },
  { key: "h2", label: "Heading" },
  { key: "h3", label: "Subheading" },
] as const;

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render when the cursor moves, so the buttons show what's active where you're typing.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : "paragraph",
      bold: e.isActive("bold"),
      link: e.isActive("link"),
      bullets: e.isActive("bulletList"),
      numbers: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);

  function setBlock(key: (typeof BLOCK_TYPES)[number]["key"]) {
    const chain = editor.chain().focus();
    if (key === "paragraph") chain.setParagraph().run();
    else chain.toggleHeading({ level: key === "h2" ? 2 : 3 }).run();
  }

  return (
    <div className="sticky top-0 z-20 rounded-t-[20px] border-b border-adm-line bg-adm-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-2" role="toolbar" aria-label="Formatting">
        {/* What the line the cursor is on should be */}
        <div className="flex rounded-full border border-adm-line-strong bg-white p-0.5 text-sm" role="group" aria-label="Line style">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setBlock(type.key)}
              aria-pressed={state.block === type.key}
              className={`cursor-pointer rounded-full px-3.5 py-1 transition-colors ${type.key !== "paragraph" ? "font-semibold" : ""} ${
                state.block === type.key ? "bg-adm-primary text-white" : "text-adm-body hover:bg-adm-surface"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <Divider />
        <ToolButton label="Bold" icon={BoldIcon} active={state.bold} run={() => editor.chain().focus().toggleBold().run()} />
        <ToolButton label="Link" icon={LinkIcon} active={state.link} run={() => setLinkOpen((open) => !open)} />
        <Divider />
        <ToolButton label="Bullet list" icon={ListBulletIcon} active={state.bullets} run={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolButton label="Numbered list" icon={NumberedListIcon} active={state.numbers} run={() => editor.chain().focus().toggleOrderedList().run()} />
        <div className="ml-auto flex">
          <ToolButton label="Undo" icon={ArrowUturnLeftIcon} active={false} disabled={!state.canUndo} run={() => editor.chain().focus().undo().run()} />
          <ToolButton label="Redo" icon={ArrowUturnRightIcon} active={false} disabled={!state.canRedo} run={() => editor.chain().focus().redo().run()} />
        </div>
      </div>
      {linkOpen && <LinkForm editor={editor} onClose={() => setLinkOpen(false)} />}
    </div>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-adm-line-strong" aria-hidden />;

function ToolButton({ label, icon: Icon, active, run, disabled = false }: { label: string; icon: Icon; active: boolean; run: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid size-9 cursor-pointer place-items-center rounded-full transition-colors disabled:cursor-default disabled:opacity-35 ${
        active ? "bg-adm-primary text-white" : "text-adm-body hover:bg-white hover:text-adm-ink"
      }`}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}

/** Add, change or remove the link on the selected words. */
function LinkForm({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [href, setHref] = useState(() => (editor.getAttributes("link").href as string | undefined) ?? "");
  const hasLink = editor.isActive("link");

  function apply(event: FormEvent) {
    event.preventDefault();
    const target = href.trim();
    if (!target) return;
    // "sky254.co.ke/delivery" → https://…; "/delivery", "mailto:" and "tel:" stay as typed.
    const url = /^(https?:\/\/|\/|mailto:|tel:)/.test(target) ? target : target.includes("@") ? `mailto:${target}` : `https://${target}`;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !hasLink) chain.insertContent({ type: "text", text: target, marks: [{ type: "link", attrs: { href: url } }] }).run();
    else chain.setLink({ href: url }).run();
    onClose();
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-center gap-2 border-t border-adm-line px-3 py-2">
      <label htmlFor="rte-link" className="text-sm font-semibold text-adm-ink">
        Link to
      </label>
      <input
        id="rte-link"
        autoFocus
        value={href}
        onChange={(e) => setHref(e.target.value)}
        placeholder="/delivery, https://… or an email address"
        className="h-9 min-w-0 flex-1 rounded-full border border-adm-line-strong bg-white px-3.5 text-sm outline-none focus:border-adm-primary"
      />
      <button type="submit" className={buttonClass.small}>
        {hasLink ? "Update link" : "Add link"}
      </button>
      {hasLink && (
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onClose();
          }}
          className={buttonClass.smallOutline}
        >
          <LinkSlashIcon className="size-4" aria-hidden /> Remove
        </button>
      )}
      <button type="button" onClick={onClose} className={buttonClass.smallOutline}>
        Cancel
      </button>
    </form>
  );
}
