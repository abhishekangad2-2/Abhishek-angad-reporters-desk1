import { CollectionBeforeChangeHook } from 'payload'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Hardcoded issue tags — must match the issueTags select options in Stories.ts
const AVAILABLE_TAGS = [
  { id: 'corruption',  label: 'Corruption' },
  { id: 'environment', label: 'Environment' },
  { id: 'healthcare',  label: 'Healthcare' },
  { id: 'politics',   label: 'Politics' },
  { id: 'law',        label: 'Law' },
  { id: 'economy',    label: 'Economy' },
]

function extractTextFromLexical(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text') return node.text || ''
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexical).join(' ')
  }
  return ''
}

export const generateReadDeeperHook: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Only proceed if the checkbox is true
  if (!data?.readDeeper?.generateTags) return data

  // Always reset the trigger so it doesn't loop
  data.readDeeper.generateTags = false

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      req.payload.logger.warn('GEMINI_API_KEY is not set. Skipping Read Deeper generation.')
      return data
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Extract text from the article layout blocks (Prose block's content field)
    const layoutText = (data.layout || [])
      .filter((block: any) => block.blockType === 'Prose')
      .map((block: any) => extractTextFromLexical(block.content?.root))
      .join('\n\n')

    const prompt = `
You are an expert journalism editor.
Analyze the following article and suggest 3 to 5 issue tags for "Read Deeper" recommendations.
You MUST ONLY choose tags from this exact list — do not invent tags.

AVAILABLE TAGS:
${JSON.stringify(AVAILABLE_TAGS, null, 2)}

ARTICLE:
Headline: ${data.headline ?? ''}
Strap: ${data.strap ?? ''}
Body:
${layoutText.substring(0, 15000)}

Respond with a JSON object in exactly this format and no other text:
{
  "suggestedTagIds": ["id1", "id2"],
  "reasoning": "A single, compelling sentence explaining why the reader should explore these topics."
}
`
    req.payload.logger.info('Calling Gemini to generate Read Deeper tags...')

    const result = await model.generateContent(prompt)
    let responseText = result.response.text()

    // Strip markdown code fences if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()

    const parsed = JSON.parse(responseText)

    if (Array.isArray(parsed.suggestedTagIds) && parsed.reasoning) {
      // Validate that returned IDs actually exist in our tag list
      const validIds = AVAILABLE_TAGS.map(t => t.id)
      data.readDeeper.suggestedTags = parsed.suggestedTagIds.filter((id: string) =>
        validIds.includes(id),
      )
      data.readDeeper.reasoning = parsed.reasoning
      req.payload.logger.info('Successfully generated Read Deeper tags.')
    }
  } catch (err) {
    req.payload.logger.error('Error generating Read Deeper tags: ' + err)
  }

  return data
}

