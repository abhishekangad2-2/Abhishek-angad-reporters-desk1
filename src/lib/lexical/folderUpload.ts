import { createServerFeature } from '@payloadcms/richtext-lexical'

// Server registration for the "Upload folder" editor feature. The actual UI
// (slash-menu + add-dropdown item that opens a directory picker, uploads every
// image, and inserts them inline in order) lives in the client component,
// resolved through the admin import map.
export const FolderUploadFeature = createServerFeature({
  key: 'folderUpload',
  feature: {
    ClientFeature:
      '/components/admin/FolderUploadFeature.client#FolderUploadFeatureClient',
  },
})
