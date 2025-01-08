'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Button } from "@/components/ui/button"
import { Bold, Italic, UnderlineIcon } from 'lucide-react'

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (content: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: {
          keepMarks: true,
        },
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] w-full',
      },
    },
    immediatelyRender: false, 
  })

  if (!editor) {
    return null
  }

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
  }
  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <div className="border rounded-md flex flex-col">
      <div className="flex items-center border-b p-2 gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-secondary' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-secondary' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-secondary' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <input
            type="color"
            onChange={(e) => setColor(e.target.value)}
            value={currentColor}
            className="w-6 h-6 p-0 border-none"
          />
        </div>
      </div>
      <EditorContent editor={editor} className="flex-grow p-4 overflow-y-auto" />
    </div>
  )
}

export default RichTextEditor

