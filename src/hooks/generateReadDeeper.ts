import { CollectionBeforeChangeHook } from 'payload'
import { GoogleGenerativeAI } from '@google/generative-ai'

function extractTextFromLexical(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text') return node.text || ''
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexical).join(' ')
  }
  return ''
}

export const generateReadDeeperHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Only proceed if the checkbox is true
  if (data?.readDeeper?.generateTags) {
    
    // Always set the trigger back to false so it doesn't loop
    data.readDeeper.generateTags = false

    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        req.payload.logger.warn('GEMINI_API_KEY is not set. Skipping Read Deeper generation.')
        return data
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      // Fetch all issue tags
      const issuesQuery = await req.payload.find({
        collection: 'issues',
        limit: 100,
      })
      const allIssues = issuesQuery.docs.map(doc => ({ id: doc.id, title: doc.title }))

      // Extract text from the article
      const fullText = extractTextFromLexical(data.body?.root)

      const prompt = `
You are an expert journalism editor.
Analyze the following article text and suggest 3 to 5 issue tags that a reader could explore to "read deeper" into the subject.
You MUST ONLY choose tags from the following exact list. Do not invent tags.

AVAILABLE TAGS:
${JSON.stringify(allIssues, null, 2)}

ARTICLE TEXT:
${fullText.substring(0, 15000)}

Respond with a JSON object in exactly this format, and no other text:
{
  "suggestedTagIds": ["id1", "id2"],
  "reasoning": "A single, compelling sentence explaining why the reader should explore these topics based on the article."
}
`
      req.payload.logger.info('Calling Gemini to generate Read Deeper tags...')
      
      const result = await model.generateContent(prompt)
      let responseText = result.response.text()
      
      // Clean up markdown code block wrapping if Gemini includes it
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
      
      const parsed = JSON.parse(responseText)

      if (parsed.suggestedTagIds && parsed.reasoning) {
        data.readDeeper.suggestedTags = parsed.suggestedTagIds
        data.readDeeper.reasoning = parsed.reasoning
        req.payload.logger.info('Successfully generated Read Deeper tags.')
      }

    } catch (err) {
      req.payload.logger.error('Error generating Read Deeper tags: ' + err)
    }
  }

  return data
}
