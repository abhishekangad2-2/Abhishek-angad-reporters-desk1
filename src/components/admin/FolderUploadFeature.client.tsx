'use client'

import {
  $createUploadNode,
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarAddDropdownGroupWithItems,
} from '@payloadcms/richtext-lexical/client'
import { toast } from '@payloadcms/ui'
import {
  $getPreviousSelection,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import type { LexicalEditor } from 'lexical'

// Folder-shaped icon for the slash menu / add-dropdown.
function FolderImagesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.5 2h9.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="m7 16 3-2.6 2.2 1.8L15 12l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// Required Media fields get sensible, fully-editable defaults so a bulk folder
// upload never stalls on validation. The writer refines credit/source per photo
// afterwards in the Media collection.
function defaultMediaMeta(file: File) {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  return {
    alt: base || file.name,
    credit: 'Abhishek Angad',
    source: 'Original',
    licenseType: 'original',
  }
}

async function uploadOne(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('_payload', JSON.stringify(defaultMediaMeta(file)))
  const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
  if (!res.ok) return null
  const json = await res.json().catch(() => null)
  return json?.doc?.id ?? null
}

function insertUploads(editor: LexicalEditor, ids: string[]) {
  if (!ids.length) return
  editor.update(() => {
    const nodes = ids.map((id) =>
      $createUploadNode({ data: { fields: {}, relationTo: 'media', value: id } }),
    )
    const selection = $getSelection() ?? $getPreviousSelection()
    if ($isRangeSelection(selection)) {
      // Anchor the first at the cursor's block, then chain the rest after it so
      // the folder's order is preserved top-to-bottom.
      $insertNodeToNearestRoot(nodes[0])
      for (let i = 1; i < nodes.length; i++) nodes[i - 1].insertAfter(nodes[i])
    } else {
      const root = $getRoot()
      nodes.forEach((n) => root.append(n))
    }
  })
}

// Opens a directory picker, uploads every image in the chosen folder to the
// Media library, and drops them all into the editor as inline images — in order.
function pickFolderAndInsert(editor: LexicalEditor) {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.setAttribute('webkitdirectory', '')
  input.setAttribute('directory', '')
  input.style.display = 'none'
  document.body.appendChild(input)

  input.addEventListener(
    'change',
    async () => {
      const files = Array.from(input.files ?? [])
        .filter((f) => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      input.remove()
      if (!files.length) {
        toast.error('No images found in that folder.')
        return
      }

      const loadingId = toast.loading(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}…`)
      const ids: string[] = []
      let failed = 0
      for (const file of files) {
        try {
          const id = await uploadOne(file)
          if (id) ids.push(id)
          else failed++
        } catch {
          failed++
        }
      }
      toast.dismiss(loadingId)

      if (ids.length) {
        insertUploads(editor, ids)
        toast.success(
          `Inserted ${ids.length} image${ids.length > 1 ? 's' : ''}` +
            (failed ? ` (${failed} failed)` : ''),
        )
      } else {
        toast.error('Upload failed — no images were added.')
      }
    },
    { once: true },
  )

  input.click()
}

const label = () => 'Upload folder'

export const FolderUploadFeatureClient = createClientFeature({
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: FolderImagesIcon,
          key: 'uploadFolder',
          keywords: ['folder', 'gallery', 'bulk', 'images', 'photos', 'directory', 'upload'],
          label,
          onSelect: ({ editor }) => pickFolderAndInsert(editor),
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: [
      toolbarAddDropdownGroupWithItems([
        {
          ChildComponent: FolderImagesIcon,
          key: 'uploadFolder',
          label,
          onSelect: ({ editor }) => pickFolderAndInsert(editor),
        },
      ]),
    ],
  },
})
