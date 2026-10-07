'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { toArticleHtml } from '@/lib/articleContent';

interface RichTextEditorProps {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (html: string) => void;
  // Uploads an image and resolves to its public URL. When given, the
  // toolbar gets an Image button and images can be dropped or pasted in.
  onUploadImage?: (file: File) => Promise<string>;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageFiles = (files: FileList | null | undefined) =>
  Array.from(files ?? []).filter((f) => IMAGE_TYPES.includes(f.type));

// Word-processor-style editor that stores HTML. Formatting pasted from Word
// or Google Docs (headings, bold, lists, links) is kept; anything the
// toolbar can't produce is dropped, so the stored HTML stays clean.
export default function RichTextEditor({
  label,
  helperText,
  value,
  onChange,
  onUploadImage,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState('');
  // Read by the drop/paste handlers, which the editor captures once.
  const uploadRef = useRef(onUploadImage);
  useEffect(() => {
    uploadRef.current = onUploadImage;
  }, [onUploadImage]);

  // Uploads each file and inserts it at `pos` (or at the cursor).
  const insertImages = async (editor: Editor, files: File[], pos?: number) => {
    const upload = uploadRef.current;
    if (!upload || files.length === 0) return;
    setUploadError('');
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const src = await upload(file);
        const image = { type: 'image', attrs: { src, alt: '' } };
        if (pos === undefined) {
          editor.chain().focus().insertContent(image).run();
        } else {
          editor.chain().focus().insertContentAt(pos, image).run();
          pos += 1;
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

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
      // Images are always uploaded files (base64 is refused, so a pasted
      // screenshot can't bloat the article with megabytes of inline data).
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: toArticleHtml(value),
    editorProps: {
      // Word and Google Docs use Heading 1 for section titles, but the page
      // already has the article title as its H1 — map pasted heading levels
      // onto the two the editor offers instead of dropping them.
      transformPastedHTML: (html) =>
        html.replace(/<(\/?)h1\b/gi, '<$1h2').replace(/<(\/?)h[4-6]\b/gi, '<$1h3'),
      // Image files dropped or pasted into the editor are uploaded and
      // inserted where they land, instead of being ignored.
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (moved || files.length === 0 || !uploadRef.current || !editorRef.current) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(editorRef.current, files, pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length === 0 || !uploadRef.current || !editorRef.current) return false;
        event.preventDefault();
        void insertImages(editorRef.current, files);
        return true;
      },
      attributes: {
        class:
          'prose max-w-none dark:prose-invert min-h-[320px] px-4 py-3 focus:outline-none ' +
          '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto ' +
          '[&_img.ProseMirror-selectednode]:outline [&_img.ProseMirror-selectednode]:outline-4 [&_img.ProseMirror-selectednode]:outline-indigo-500',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  });
  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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
        {editor && (
          <Toolbar
            editor={editor}
            onPickImages={onUploadImage ? (files) => insertImages(editor, files) : undefined}
          />
        )}
        <EditorContent editor={editor} className="max-h-[60vh] overflow-y-auto" />
      </div>
      {uploading > 0 && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Uploading image…</p>
      )}
      {uploadError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
      {helperText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onPickImages,
}: {
  editor: Editor;
  onPickImages?: (files: File[]) => void;
}) {
  const fileInputId = useId();
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
      image: editor.isActive('image'),
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

  // Short description of the selected image, read by screen readers and
  // search engines (and shown if the image can't load).
  const setImageAlt = () => {
    const current = (editor.getAttributes('image').alt as string | undefined) ?? '';
    const alt = window.prompt('Describe this image (optional):', current);
    if (alt === null) return;
    editor.chain().focus().updateAttributes('image', { alt: alt.trim() }).run();
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
    ...(onPickImages
      ? [
          {
            label: '🖼 Image',
            title: 'Insert image',
            run: () => document.getElementById(fileInputId)?.click(),
          },
          ...(state.image
            ? [{ label: 'Alt text', title: 'Describe the selected image', run: setImageAlt }]
            : []),
        ]
      : []),
    { label: '↶', title: 'Undo', disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: '↷', title: 'Redo', disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() },
    { label: 'Clear', title: 'Clear formatting', run: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-1.5">
      {onPickImages && (
        <input
          id={fileInputId}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            const files = imageFiles(e.target.files);
            e.target.value = '';
            if (files.length) onPickImages(files);
          }}
        />
      )}
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
