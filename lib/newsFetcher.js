import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || 'pub_0c710b01fcdf47d3886ed01f290ae10c';
const BASE_URL = 'https://newsdata.io/api/1/latest';
const KEYWORDS = ['mutual fund', 'SEBI', 'RBI', 'SIP', 'investment', 'AMC', 'NAV', 'portfolio'];

export async function fetchTopNews() {
  // Build the newsdata.io API URL with query parameters
  const url = `${BASE_URL}?apikey=${NEWSDATA_API_KEY}&q=Mutual%20Fund%20Industry&country=in&language=en&timezone=Asia/Kolkata`;
  console.log('🔗 Fetching news from newsdata.io...');

  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`❌ Failed to fetch news: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  
  // newsdata.io returns articles in 'results' array
  const articles = data.results || [];

  if (articles.length === 0) {
    console.warn('⚠️ No news articles found from newsdata.io API');
    return [];
  }

  const now = new Date();

  // Enrich articles with relevance scoring
  const enriched = articles
    .map(article => {
      // Parse pubDate from newsdata.io format
      const pubDate = new Date(article.pubDate || article.pubDateTZ);
      const ageHours = (now - pubDate) / (1000 * 60 * 60);
      
      // Calculate relevance score based on keywords in title and description
      const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      const score = KEYWORDS.reduce((acc, word) => 
        content.includes(word.toLowerCase()) ? acc + 1 : acc, 0
      );
      
      return { ...article, score, pubDate, ageHours };
    })
    .filter(a => a.score > 0 && a.ageHours <= 48) // Recent and relevant (48 hours)
    .sort((a, b) => b.score - a.score) // Most relevant first
    .slice(0, 5); // Top 5 articles

  if (enriched.length === 0) {
    console.warn('⚠️ No relevant news found in the past 48 hours.');
    return [];
  }

  console.log(`✅ Found ${enriched.length} relevant article(s)`);

  // Map to standardized format
  return enriched.map(({ title, description, link, pubDate }) => ({
    title: title || 'No title',
    description: description || 'No description available',
    url: link, // newsdata.io uses 'link' instead of 'url'
    publishedAt: pubDate
  }));
}

// Optional: Run directly for debugging
if (process.argv[1].includes('newsFetcher.js')) {
  fetchTopNews()
    .then(news => {
      console.log(`\n✅ Found ${news.length} article(s):`);
      news.forEach((a, i) => {
        console.log(`\n${i + 1}. ${a.title}\n   ${a.description}\n   🔗 ${a.url}\n   📅 ${a.publishedAt}`);
      });
    })
    .catch(console.error);
}