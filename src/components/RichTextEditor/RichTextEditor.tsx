'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
} from 'lucide-react'
import formStyles from '../ui/EditorialForm.module.css'
import styles from './RichTextEditor.module.css'

type RichTextEditorProps = {
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Event details...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.editorContent,
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  const toolBtn = (active: boolean) =>
    `${styles.toolBtn}${active ? ` ${styles.toolBtnActive}` : ''}`

  return (
    <div className={formStyles.field}>
      {label && <label className={formStyles.label}>{label}</label>}
      <div className={styles.editor}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={toolBtn(editor.isActive('bold'))}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('italic'))}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('heading', { level: 2 }))}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('heading', { level: 3 }))}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3"
          >
            <Heading3 size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('bulletList'))}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('orderedList'))}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered list"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            className={toolBtn(editor.isActive('blockquote'))}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
          >
            <Quote size={16} />
          </button>
          <span className={styles.toolbarDivider} aria-hidden />
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
