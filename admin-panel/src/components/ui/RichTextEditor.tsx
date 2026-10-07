'use client';

import { useEffect } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { toArticleHtml } from '@/lib/articleContent';

interface RichTextEditorProps {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (html: string) => void;
}

// Word-processor-style editor that stores HTML. Formatting pasted from Word
// or Google Docs (headings, bold, lists, links) is kept; anything the
// toolbar can't produce is dropped, so the stored HTML stays clean.
export default function RichTextEditor({ label, helperText, value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    // Next.js renders this on the server first; let the editor mount on the client.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    content: toArticleHtml(value),
    editorProps: {
      // Word and Google Docs use Heading 1 for section titles, but the page
      // already has the article title as its H1 — map pasted heading levels
      // onto the two the editor offers instead of dropping them.
      transformPastedHTML: (html) =>
        html.replace(/<(\/?)h1\b/gi, '<$1h2').replace(/<(\/?)h[4-6]\b/gi, '<$1h3'),
      attributes: {
        class:
          'prose max-w-none dark:prose-invert min-h-[320px] px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  });

  // Content can arrive after mount (e.g. the article loads once the form is
  // open). Only replace it when it really differs, so typing is unaffected.
  useEffect(() => {
    if (!editor) return;
    const incoming = toArticleHtml(value);
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className="max-h-[60vh] overflow-y-auto" />
      </div>
      {helperText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      link: editor.isActive('link'),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (leave empty to remove the link):', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const buttons: { label: string; title: string; active?: boolean; disabled?: boolean; run: () => void; className?: string }[] = [
    { label: 'H2', title: 'Heading', active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', title: 'Subheading', active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'B', title: 'Bold', active: state.bold, run: () => editor.chain().focus().toggleBold().run(), className: 'font-bold' },
    { label: 'I', title: 'Italic', active: state.italic, run: () => editor.chain().focus().toggleItalic().run(), className: 'italic' },
    { label: 'U', title: 'Underline', active: state.underline, run: () => editor.chain().focus().toggleUnderline().run(), className: 'underline' },
    { label: '• List', title: 'Bullet list', active: state.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: '1. List', title: 'Numbered list', active: state.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: '❝ Quote', title: 'Quote', active: state.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: '🔗 Link', title: 'Add or edit link', active: state.link, run: setLink },
    { label: '↶', title: 'Undo', disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: '↷', title: 'Redo', disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() },
    { label: 'Clear', title: 'Clear formatting', run: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-1.5">
      {buttons.map((b) => (
        <button
          key={b.title}
          type="button"
          title={b.title}
          aria-label={b.title}
          aria-pressed={b.active}
          disabled={b.disabled}
          // Keep the text selection when clicking a toolbar button.
          onMouseDown={(e) => e.preventDefault()}
          onClick={b.run}
          className={`min-w-8 rounded px-2 py-1 text-sm transition-colors disabled:opacity-40 ${
            b.active
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          } ${b.className ?? ''}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
