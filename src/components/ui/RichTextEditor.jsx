import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Unlink, Undo, Redo, RemoveFormatting,
} from "lucide-react"

const CSS = `
.molek-rte .ProseMirror { min-height: 240px; padding: 1rem 1.1rem; outline: none; }
.molek-rte .ProseMirror p { margin: 0 0 0.75rem; line-height: 1.7; }
.molek-rte .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #111827; }
.molek-rte .ProseMirror h3 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.4rem; color: #111827; }
.molek-rte .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 0.75rem; }
.molek-rte .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 0.75rem; }
.molek-rte .ProseMirror li { margin: 0.25rem 0; }
.molek-rte .ProseMirror li p { margin: 0; }
.molek-rte .ProseMirror blockquote { border-left: 4px solid #93c5fd; padding-left: 1rem; color: #475569; font-style: italic; margin: 0 0 0.75rem; }
.molek-rte .ProseMirror a { color: #2563eb; text-decoration: underline; }
.molek-rte .ProseMirror:focus { outline: none; }
`

const looksLikeHtml = (s) => /<\/?[a-z][\s\S]*>/i.test(s || "")
const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Convert legacy plain-text posts (with \n) into paragraphs so they
// load into the editor without collapsing into one blob.
const toEditorHtml = (s) => {
  if (!s) return ""
  if (looksLikeHtml(s)) return s
  return s
    .split(/\n{2,}/)
    .map((block) => `<p>${block.split(/\n/).map(escapeHtml).join("<br>")}</p>`)
    .join("")
}

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        active ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="w-px h-6 bg-gray-200 mx-1" />

export function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content: toEditorHtml(value),
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  // Sync external value (e.g. async fetch on edit) without clobbering typing.
  useEffect(() => {
    if (!editor) return
    const incoming = toEditorHtml(value)
    if (incoming && incoming !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(incoming, false)
    }
  }, [value, editor])

  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes("link").href
    const url = window.prompt("Link URL", prev || "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="molek-rte border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
      <style>{CSS}</style>
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
        <Btn title="Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={18} />
        </Btn>
        <Btn title="Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={18} />
        </Btn>
        <Btn title="Underline" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={18} />
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={18} />
        </Btn>
        <Divider />
        <Btn title="Heading" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={18} />
        </Btn>
        <Btn title="Subheading" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={18} />
        </Btn>
        <Divider />
        <Btn title="Bullet list" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={18} />
        </Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={18} />
        </Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={18} />
        </Btn>
        <Divider />
        <Btn title="Add link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon size={18} />
        </Btn>
        <Btn title="Remove link" disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink size={18} />
        </Btn>
        <Btn title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting size={18} />
        </Btn>
        <Divider />
        <Btn title="Undo" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={18} />
        </Btn>
        <Btn title="Redo" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={18} />
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
