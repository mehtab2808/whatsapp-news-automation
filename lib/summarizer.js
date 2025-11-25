import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SEBI_SUFFIX = 'This is not investment advice. For educational purposes only, as per SEBI guidelines.';

export async function summarizeNews(articles) {
  // Check if articles array is empty or has no valid content

  if (!articles || articles.length === 0 || !articles[0]?.title) {
    console.log('No news available, generating educational content about mutual funds and investing');
    try {
      return await generateEducationalContent();
    } catch (error) {
      console.error('❌ Error generating educational content:', error.message);
      return getFallbackMessage();
    }
  }

  const newsText = articles.map((a, i) => `${i+1}. ${a.title}: ${a.description}\n 👉 Read more: ${a.url}`).join('\n');

  const prompt = `
  You are an assistant writing for mutual fund clients in India.

Summarize the following financial/business news in a *friendly*, *simple*, and *strictly educational* tone.


**Guidelines**:
- Start with polite warm generic greetings, not specific to mutual clients or like that."
- Structure the response as **numbered bullet points**, one for each news item.
- Keep each point *concise* (2–3 sentences max).
- Include only India specific finance related news 
- There might be some news which are not MF, Fixed income tools, or related to Finance directly. Try to bridge a gap between the news and finance sector and summarize accordingly only if relevant and it makes sense
- Approximately top 10 articles will be shared, cover only the ones which are related to finance/MF. Keep only a maximum of 5 best points
- Focus on *education*, not investment advice.
- Use *bold formatting* via asterisks (e.g., *SEBI*, *mutual fund*, *SIP*) to highlight key terms.
- After each point, add: 👉 Read more: [URL]
- Use WhatsApp formatting: 
  - Use *asterisks* for bold (e.g., *SIP*, *mutual funds*)
  - Use _underscores_ for italics (if needed)
  - Keep line breaks as used in WhatsApp messages for readability
  - Add emojis wherever applicable
- End with:  
  "_This is not investment advice. For educational purposes only, as per SEBI guidelines._"

**News items**:  
${newsText}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const summary = response.text;
    
    if (!summary || !summary.trim()) {
      throw new Error('Empty response from Gemini API');
    }
    
    return summary.trim();
  } catch (error) {
    console.error('❌ Error summarizing news with Gemini:', error.message);
    return getFallbackMessage();
  }
}

async function generateEducationalContent() {
  const educationalTopics = [
    "SIP (Systematic Investment Plan) in mutual funds and its benefits",
    "Diversification strategies for mutual fund portfolios",
    "Tax-saving mutual funds (ELSS) and Section 80C benefits",
    "Emergency fund planning and financial security",
    "Understanding NAV (Net Asset Value) in mutual funds",
    "Power of compounding in long-term investing",
    "Asset allocation between equity and debt funds",
    "Goal-based investing for retirement and education",
    "Risk management in mutual fund investments",
    "SEBI regulations and investor protection"
  ];

  const randomTopic = educationalTopics[Math.floor(Math.random() * educationalTopics.length)];
  
  const prompt = `
  
  Create a short, friendly, and educational WhatsApp message for mutual fund clients on the topic: "${randomTopic}".

Guidelines:
- Start with polite warm greetings"
- Keep it under 100 words
- Use a warm, conversational tone
- Do **not** give any investment advice
- Do not include phrases like "Here's a draft for your whatsapp message"
- Include a helpful insight or practical tip
- Make it relevant for Indian mutual fund investors
- Use WhatsApp formatting: 
  - Use *asterisks* for bold (e.g., *SIP*, *mutual funds*)
  - Use _underscores_ for italics (if needed)
  - Keep line breaks as used in WhatsApp messages for readability
- End the message with: "${SEBI_SUFFIX}"

`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const content = response.text;
    
    if (!content || !content.trim()) {
      throw new Error('Empty response from Gemini API');
    }
    
    return content.trim();
  } catch (error) {
    console.error('❌ Error generating educational content with Gemini:', error.message);
    return getFallbackMessage();
  }
}

function getFallbackMessage() {
  const fallbackMessages = [
    `📚 *Financial Education Tip*

Did you know that *SIP* (Systematic Investment Plan) in mutual funds can help you build wealth over time? 

By investing a fixed amount regularly, you benefit from rupee cost averaging and the power of compounding. Start small, stay consistent! 💪

${SEBI_SUFFIX}`,

    `💡 *Investment Wisdom*

*Diversification* is key to managing investment risk. Consider spreading your mutual fund investments across different categories like equity, debt, and hybrid funds.

Remember: Don't put all your eggs in one basket! 🥚

${SEBI_SUFFIX}`,

    `🎯 *Goal-Based Investing*

Planning for your financial goals? Consider *ELSS* (Equity Linked Savings Scheme) for tax benefits under Section 80C.

Start early, invest regularly, and let time work in your favor! ⏰

${SEBI_SUFFIX}`
  ];

  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
}
