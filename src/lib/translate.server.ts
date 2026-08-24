import { VertexAI } from '@google-cloud/vertexai'
import { localeByCode } from './i18n'
import { DEFAULT_LABELS, type LandingData, type LandingLabels } from './landing'

// Server-only: imports the Vertex SDK. Machine-only translation (no human
// review) tuned to stay faithful and keep a journalistic tone. Results are
// cached in-process so a given (locale, string) is only translated once.

const cache = new Map<string, string>() // `${locale}::${text}` -> translation

// Developer-API model (a free API key, independent of GCP project billing);
// override with GEMINI_MODEL. Vertex uses its own model id as a fallback.
const DEV_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
const VERTEX_MODEL = 'gemini-2.5-flash'

/** Run one prompt through whichever Gemini backend is configured, preferring
 *  the Gemini Developer API (an API key — independent of GCP project billing)
 *  and falling back to Vertex AI. Returns null if neither is available or both
 *  error, so callers keep the original English text. */
async function generateText(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
  if (apiKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEV_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      )
      if (resp.ok) {
        const data: any = await resp.json()
        const parts = data?.candidates?.[0]?.content?.parts
        const text = Array.isArray(parts) ? parts.map((p: any) => p?.text ?? '').join('') : ''
        if (text.trim()) return text
      }
    } catch {
      // fall through to Vertex
    }
  }

  const project = process.env.VERTEX_PROJECT
  if (project) {
    try {
      const location = process.env.VERTEX_LOCATION || 'us-central1'
      const model = new VertexAI({ project, location }).getGenerativeModel({ model: VERTEX_MODEL })
      const resp = await model.generateContent(prompt)
      return resp.response.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    } catch {
      return null
    }
  }
  return null
}

/** Translate an ordered batch of strings into `localeCode`. Cache hits are
 *  returned immediately; misses go to Vertex in a single call. On any error or
 *  if Vertex is unavailable, the original English strings are returned so the
 *  page never breaks. */
export async function translateBatch(texts: string[], localeCode: string): Promise<string[]> {
  if (localeCode === 'en' || texts.length === 0) return texts

  const langName = localeByCode(localeCode).label
  const result = [...texts]
  const missIdx: number[] = []
  const missTexts: string[] = []

  texts.forEach((t, i) => {
    if (!t || !t.trim()) return
    const key = `${localeCode}::${t}`
    const cached = cache.get(key)
    if (cached !== undefined) result[i] = cached
    else {
      missIdx.push(i)
      missTexts.push(t)
    }
  })

  if (missTexts.length === 0) return result

  try {
    const prompt = `You are a professional news translator for an investigative-journalism publication. Translate each string in the following JSON array from English into ${langName}. Translate faithfully: preserve the exact meaning and a serious, precise journalistic tone. Do NOT add, omit, summarise, soften, or editorialise. Keep people's names, organisation names and place names in their standard ${langName} form (transliterate where there is no established translation). Return ONLY a JSON array of the translated strings, in the same order and the same length as the input, with no commentary or code fences.

${JSON.stringify(missTexts)}`

    let text = await generateText(prompt)
    if (text == null) return result
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const arr = JSON.parse(text)

    if (Array.isArray(arr) && arr.length === missTexts.length) {
      arr.forEach((tr: unknown, k: number) => {
        const i = missIdx[k]
        const val = typeof tr === 'string' && tr.trim() ? tr : texts[i]
        result[i] = val
        cache.set(`${localeCode}::${missTexts[k]}`, val)
      })
    }
  } catch {
    // fall through — originals already in `result`
  }

  return result
}

/** translateBatch, but split into chunks so a large set (e.g. the 127-entry
 *  archive index) never overflows a single model prompt. Chunks run in parallel
 *  and results are cached per string, so later requests are instant. */
export async function translateBatchChunked(
  texts: string[],
  localeCode: string,
  chunkSize = 40,
): Promise<string[]> {
  if (localeCode === 'en' || texts.length === 0) return texts
  const chunks: string[][] = []
  for (let i = 0; i < texts.length; i += chunkSize) chunks.push(texts.slice(i, i + chunkSize))
  const out = await Promise.all(chunks.map((c) => translateBatch(c, localeCode)))
  return out.flat()
}

/** Translate a single short label (e.g. "Editor login"). Cached. */
export async function tr(label: string, localeCode: string): Promise<string> {
  if (localeCode === 'en' || !label) return label
  const [out] = await translateBatch([label], localeCode)
  return out
}

/** Read the user's locale from ?lang= (search params) or the rd_lang cookie. */
export async function readLocale(searchLang?: string | string[] | undefined): Promise<string> {
  const { cookies } = await import('next/headers')
  const { isLocale, DEFAULT_LOCALE, LOCALE_COOKIE } = await import('./i18n')
  const sp = typeof searchLang === 'string' ? searchLang : undefined
  if (sp && isLocale(sp)) return sp
  const c = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(c) ? c : DEFAULT_LOCALE
}

/** Translate the text fields of the landing data (story headlines/straps/desk
 *  names) so every template renders in the reader's language. */
export async function translateLandingData(data: LandingData, localeCode: string): Promise<LandingData> {
  if (localeCode === 'en') return data

  const storyTexts: string[] = []
  data.stories.forEach((s) => storyTexts.push(s.headline, s.strap, s.sectionName))
  const sectionTexts: string[] = []
  data.sections.forEach((s) => sectionTexts.push(s.name, s.description || ''))

  const [st, sec] = await Promise.all([
    translateBatch(storyTexts, localeCode),
    translateBatch(sectionTexts, localeCode),
  ])

  const stories = data.stories.map((s, i) => ({
    ...s,
    headline: st[i * 3] ?? s.headline,
    strap: st[i * 3 + 1] ?? s.strap,
    sectionName: st[i * 3 + 2] ?? s.sectionName,
  }))
  const sections = data.sections.map((s, i) => ({
    ...s,
    name: sec[i * 2] ?? s.name,
    description: sec[i * 2 + 1] || s.description,
  }))

  // Translate the small UI chrome strings (masthead + buildCards backfills).
  const [editorialDesk, deskStrap, est, editor] = await translateBatch(
    [DEFAULT_LABELS.editorialDesk, DEFAULT_LABELS.deskStrap, DEFAULT_LABELS.est, DEFAULT_LABELS.editor],
    localeCode,
  )
  const labels: LandingLabels = {
    editorialDesk: editorialDesk || DEFAULT_LABELS.editorialDesk,
    deskStrap: deskStrap || DEFAULT_LABELS.deskStrap,
    est: est || DEFAULT_LABELS.est,
    editor: editor || DEFAULT_LABELS.editor,
  }

  return { stories, sections, labels }
}

/** Translate a Lexical rich-text value in place-of-structure: deep-clone, swap
 *  only the text-node strings, leave headings/lists/links/formatting intact. */
async function translateLexical(content: any, localeCode: string): Promise<any> {
  if (!content?.root) return content
  const clone = JSON.parse(JSON.stringify(content))
  const nodes: any[] = []
  const walk = (n: any) => {
    if (!n) return
    if (n.type === 'text' && typeof n.text === 'string') nodes.push(n)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  walk(clone.root)
  if (nodes.length === 0) return clone
  // Chunked + parallel so a long article body doesn't block on one huge call.
  const translated = await translateBatchChunked(nodes.map((n) => n.text), localeCode, 20)
  nodes.forEach((n, i) => {
    n.text = translated[i] ?? n.text
  })
  return clone
}

/** Translate a full story document (headline/strap/caption/section name + the
 *  Prose blocks in the body) for the story templates. */
export async function translateStory(story: any, localeCode: string): Promise<any> {
  if (localeCode === 'en' || !story) return story

  const sectionObj = story.section && typeof story.section === 'object' ? story.section : null
  const [tHead, tStrap, tCap, tSec] = await translateBatch(
    [story.headline ?? '', story.strap ?? '', story.caption ?? '', sectionObj?.name ?? ''],
    localeCode,
  )

  const out: any = {
    ...story,
    headline: tHead || story.headline,
    strap: tStrap || story.strap,
    caption: tCap || story.caption,
  }
  if (sectionObj) out.section = { ...sectionObj, name: tSec || sectionObj.name }

  if (Array.isArray(story.layout)) {
    out.layout = await Promise.all(
      story.layout.map(async (block: any) =>
        block?.blockType === 'Prose' && block.content?.root
          ? { ...block, content: await translateLexical(block.content, localeCode) }
          : block,
      ),
    )
  }

  return out
}
