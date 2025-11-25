import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || 'pub_0c710b01fcdf47d3886ed01f290ae10c';
const BASE_URL = 'https://newsdata.io/api/1/latest';

export async function fetchTopNews() {
  // Build the newsdata.io API URL with query parameters
  const url = `${BASE_URL}?apikey=${NEWSDATA_API_KEY}&q=Mutual%20Fund%20Industry%20OR%20Finance&country=in&language=en&timezone=Asia/Kolkata`;
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

  // Return all articles from the API response
  const topArticles = articles;

  console.log(`✅ Found ${topArticles.length} articles`);

  // Map to standardized format
  return topArticles.map(article => {
    const pubDate = new Date(article.pubDate || article.pubDateTZ);
    
    return {
      title: article.title || 'No title',
      description: article.description || 'No description available',
      url: article.link, // newsdata.io uses 'link' instead of 'url'
      publishedAt: pubDate
    };
  });
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