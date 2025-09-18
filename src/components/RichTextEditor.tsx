import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EditorContent,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { BubbleMenu } from '@tiptap/react/menus'
import { FloatingMenu } from '@tiptap/react/menus'
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyleKit } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import { apiUploadFile } from '../api/client';

type Props = {
  value: string;
  onChange: (html: string) => void;
  token?: string | null;
  placeholder?: string;
  maxChars?: number;
};

const ToolbarButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
> = ({ active, className, ...rest }) => (
  <button
    type="button"
    className={`px-2 py-1 rounded text-sm transition ${
      active ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-700/60'
    } ${className ?? ''}`}
    {...rest}
  />
);

const Divider = () => <span className="mx-1 h-5 w-px bg-slate-700" />;

function toYoutubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/^(?:www\.)?(youtube\.com|youtu\.be)$/.test(u.hostname)) return null;
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.searchParams.get('v')) id = u.searchParams.get('v') || '';
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/').pop() || '';
    id = id.replace(/[^\w\-]/g, '');
    if (!id) return null;
    const src = `https://www.youtube.com/embed/${id}`;
    return `
      <figure class="my-4">
        <iframe
          src="${src}"
          width="640"
          height="360"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          class="w-full rounded-lg border border-slate-700"
        ></iframe>
      </figure>`;
  } catch {
    return null;
  }
}

const RichTextEditor: React.FC<Props> = ({
  value,
  onChange,
  token,
  placeholder,
  maxChars = 0,
}) => {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const suppressNextOnUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Image.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'underline underline-offset-2 decoration-cyan-400',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
      TextStyleKit,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: { resizable: true },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: { class: 'align-top' },
      }),
      CharacterCount.configure({ limit: maxChars > 0 ? maxChars : undefined }),
    ],
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-invert max-w-none min-h-[260px] bg-slate-800/40 rounded-lg p-4 focus:outline-none',
      },
      handleDrop: (_view, event) => {
        const dt = (event as DragEvent).dataTransfer;
        if (!dt?.files?.length) return false;
        const file = dt.files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        void uploadAndInsert(file);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const it of Array.from(items)) {
          if (it.kind === 'file') {
            const f = it.getAsFile();
            if (f && f.type.startsWith('image/')) {
              event.preventDefault();
              void uploadAndInsert(f);
              return true;
            }
          }
        }
        return false;
      },
    },
    content: value && value.trim() !== '' ? value : '<p></p>',
    onUpdate: ({ editor }) => {
      if (suppressNextOnUpdate.current) {
        suppressNextOnUpdate.current = false;
        return;
      }
      const html = editor.getHTML();
      onChange(html);
      if (htmlMode) setRawHtml(html);
    },
  });

  // синхронизация внешнего value → редактор
  useEffect(() => {
    if (!editor) return;
    const normalized = value && value.trim() !== '' ? value : '<p></p>';
    if (editor.getHTML() !== normalized) {
      suppressNextOnUpdate.current = true;
      editor.commands.setContent(normalized, false);
      if (htmlMode) setRawHtml(normalized);
    }
  }, [value, editor, htmlMode]);

  // -------- actions ----------
  const addLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link')?.href || '';
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const pickImage = () => fileInputRef.current?.click();

  const uploadAndInsert = async (file: File) => {
    if (!editor) return;
    try {
      const url = await apiUploadFile(file, token);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err: any) {
      alert(err?.message ?? 'Image upload failed');
    }
  };

  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadAndInsert(file);
  };

  const setImageAlt = () => {
    if (!editor) return;
    const attrs = editor.getAttributes('image');
    if (!attrs?.src) return alert('Select an image first (click it).');
    const promptVal = window.prompt('Alt text', attrs.alt || '');
    const alt = (promptVal ?? attrs.alt) || '';
    editor.chain().focus().updateAttributes('image', { alt }).run();
  };

  const insertYoutube = () => {
    const url = window.prompt('YouTube URL', 'https://www.youtube.com/watch?v=');
    if (!url || !editor) return;
    const html = toYoutubeEmbed(url);
    if (!html) return alert('Invalid YouTube URL');
    editor.chain().focus().insertContent(html).run();
  };

  // quick state
  const [textColor, setTextColor] = useState('#ffffff');
  const [hlColor, setHlColor] = useState('#fde68a');

  // font size via TextStyleKit
  const [fontPx, setFontPx] = useState<number>(18);
  const applyFontPx = (px: number) => {
    if (!editor) return;
    const clamped = Math.max(8, Math.min(128, Math.round(px)));
    setFontPx(clamped);
    editor.chain().focus().setMark('textStyle', { fontSize: `${clamped}px` }).run();
  };
  const presetSize = (px: number) => () => applyFontPx(px);
  const resetFont = () => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: 'inherit' }).run();
  };

  const can = useMemo(
    () => ({
      b: editor?.can().chain().focus().toggleBold().run(),
      i: editor?.can().chain().focus().toggleItalic().run(),
      u: editor?.can().chain().focus().toggleUnderline().run(),
      s: editor?.can().chain().focus().toggleStrike().run(),
      undo: editor?.can().chain().focus().undo().run(),
      redo: editor?.can().chain().focus().redo().run(),
    }),
    [editor, editor?.state]
  );

  const toggleHtmlMode = () => {
    if (!editor) return;
    if (!htmlMode) setRawHtml(editor.getHTML());
    setHtmlMode((v) => !v);
  };

  const applyRawHtml = () => {
    if (!editor) return;
    suppressNextOnUpdate.current = true;
    editor.commands.setContent(rawHtml || '<p></p>', false);
    onChange(rawHtml);
  };

  // stats
  // CharacterCount API может отличаться в разных версиях — оставляем защитные проверки:
  const words =
    (editor?.storage?.characterCount && (editor.storage as any).characterCount.words?.()) ?? 0;
  const chars =
    (editor?.storage?.characterCount && (editor.storage as any).characterCount.characters?.()) ??
    (editor ? editor.getText().length : 0);
  const readTimeMin = Math.max(1, Math.round(words / 200));

  return (
    <div className="space-y-2">
      {/* --- Top toolbar --- */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-800/60 rounded-lg p-2">
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!can.undo}>↶ Undo</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!can.redo}>↷ Redo</ToolbarButton>
        <Divider />

        {/* Headings dropdown */}
        <details className="group relative">
          <summary className="list-none px-2 py-1 rounded text-sm text-slate-200 hover:bg-slate-700/60 cursor-pointer">
            {editor?.isActive('heading', { level: 1 })
              ? 'H1'
              : editor?.isActive('heading', { level: 2 })
              ? 'H2'
              : editor?.isActive('heading', { level: 3 })
              ? 'H3'
              : 'Text'}
          </summary>
          <div className="absolute z-10 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/60" onClick={() => editor?.chain().focus().setParagraph().run()}>Paragraph</button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/60" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/60" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/60" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</button>
          </div>
        </details>

        <Divider />
        <ToolbarButton active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!can.b}><span className="font-bold">B</span></ToolbarButton>
        <ToolbarButton active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!can.i}><span className="italic">I</span></ToolbarButton>
        <ToolbarButton active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} disabled={!can.u}><span className="underline">U</span></ToolbarButton>
        <ToolbarButton active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} disabled={!can.s}><span className="line-through">S</span></ToolbarButton>
        <ToolbarButton active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()}>Code</ToolbarButton>
        <Divider />

        <ToolbarButton active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
        <ToolbarButton active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
        <ToolbarButton active={editor?.isActive('taskList')} onClick={() => editor?.chain().focus().toggleTaskList().run()}>☑ Tasks</ToolbarButton>
        <Divider />

        <ToolbarButton active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()}>⬅</ToolbarButton>
        <ToolbarButton active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()}>⟷</ToolbarButton>
        <ToolbarButton active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()}>➡</ToolbarButton>
        <ToolbarButton active={editor?.isActive({ textAlign: 'justify' })} onClick={() => editor?.chain().focus().setTextAlign('justify').run()}>≋</ToolbarButton>
        <Divider />

        <ToolbarButton onClick={addLink} active={!!editor?.isActive('link')}>Link</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().unsetLink().run()}>Unlink</ToolbarButton>
        <Divider />

        <ToolbarButton onClick={pickImage}>Image</ToolbarButton>
        <ToolbarButton onClick={setImageAlt}>Alt</ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageFile} />
        <Divider />

        {/* Цвета */}
        <label className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-slate-700/60">
          <span>Text</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              editor?.chain().focus().setColor(e.target.value).run();
            }}
            className="w-6 h-6 bg-transparent border-0 p-0"
            title="Text color"
          />
        </label>
        <label className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-slate-700/60">
          <span>Mark</span>
          <input
            type="color"
            value={hlColor}
            onChange={(e) => {
              setHlColor(e.target.value);
              editor?.chain().focus().toggleHighlight({ color: e.target.value }).run();
            }}
            className="w-6 h-6 bg-transparent border-0 p-0"
            title="Highlight color"
          />
        </label>

        <Divider />
        {/* Размер шрифта */}
        <div className="flex items-center gap-1 px-2 py-1 rounded text-sm bg-slate-800/40 border border-slate-700">
          <span className="text-slate-300 mr-1">Font</span>
          <ToolbarButton onClick={presetSize(14)}>S</ToolbarButton>
          <ToolbarButton onClick={presetSize(16)}>M</ToolbarButton>
          <ToolbarButton onClick={presetSize(18)}>L</ToolbarButton>
          <ToolbarButton onClick={presetSize(22)}>XL</ToolbarButton>
          <ToolbarButton onClick={presetSize(28)}>2XL</ToolbarButton>
          <span className="mx-2 text-slate-500">|</span>
          <input
            type="number"
            min={8}
            max={128}
            value={fontPx}
            onChange={(e) => applyFontPx(Number(e.target.value || 16))}
            className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-right"
            title="Custom font size, px"
          />
          <span className="text-slate-400 ml-1">px</span>
          <ToolbarButton className="ml-2" onClick={resetFont}>Reset</ToolbarButton>
        </div>

        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>❝ Quote</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()}>─ HR</ToolbarButton>
        <Divider />

        {/* Таблица (минимальный набор) */}
        <details className="group relative">
          <summary className="list-none px-2 py-1 rounded text-sm text-slate-200 hover:bg-slate-700/60 cursor-pointer">
            Table ▾
          </summary>
          <div className="absolute z-10 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 w-56">
            <div className="grid grid-cols-1 gap-1">
              <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert 3×3</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().addColumnAfter().run()}>Add column</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().addRowAfter().run()}>Add row</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteColumn().run()}>Delete column</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteRow().run()}>Delete row</ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().deleteTable().run()}>Delete table</ToolbarButton>
            </div>
          </div>
        </details>

        <Divider />
        <ToolbarButton onClick={insertYoutube}>YouTube</ToolbarButton>
        <Divider />

        <ToolbarButton onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</ToolbarButton>
        <ToolbarButton onClick={toggleHtmlMode} className={htmlMode ? 'bg-yellow-600 text-white' : ''}>HTML</ToolbarButton>
      </div>

      {/* --- Bubble menu: быстрое форматирование выделенного текста --- */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150 }}
          className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-md p-1"
        >
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><span className="font-bold">B</span></ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><span className="italic">I</span></ToolbarButton>
          <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><span className="underline">U</span></ToolbarButton>
          <Divider />
          <ToolbarButton onClick={addLink} active={!!editor.isActive('link')}>Link</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</ToolbarButton>
        </BubbleMenu>
      )}

      {/* --- Floating menu: контекстное вставление блоков в начале строки --- */}
      {editor && (
        <FloatingMenu
          editor={editor}
          tippyOptions={{ duration: 150, placement: 'right' }}
          className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-md p-1"
        >
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝ Quote</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>─ HR</ToolbarButton>
          <ToolbarButton onClick={pickImage}>Image</ToolbarButton>
        </FloatingMenu>
      )}

      {/* --- Editor or raw HTML --- */}
      {!htmlMode ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="rounded-lg overflow-hidden border border-slate-700">
          <textarea
            className="w-full h-56 bg-slate-900 text-slate-100 p-3 font-mono text-sm outline-none"
            value={rawHtml}
            onChange={(e) => setRawHtml(e.target.value)}
          />
          <div className="flex items-center justify-between p-2 bg-slate-800 border-t border-slate-700">
            <div className="text-xs text-slate-400">Editing raw HTML — be careful</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
                onClick={() => setRawHtml(editor?.getHTML() || '')}
              >
                Reset
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500"
                onClick={applyRawHtml}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Status bar --- */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>
          {maxChars ? (
            <>
              {chars}/{maxChars} chars • {words} words • ~{readTimeMin} min read
            </>
          ) : (
            <>
              {chars} chars • {words} words • ~{readTimeMin} min read
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Paste/Drop images to upload</span>
          <span>Shortcuts: <kbd>Ctrl/Cmd+B</kbd>, <kbd>I</kbd>, <kbd>U</kbd>, <kbd>Z</kbd>, <kbd>Shift+Z</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
