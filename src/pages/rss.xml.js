import rss from '@astrojs/rss';
import fs from 'fs';
import path from 'path';

export async function GET(context) {
  const filePath = path.resolve('data/fallback-data.js');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  let news = [];
  try {
    const window = {};
    const runner = new Function('window', fileContent + '\nreturn NEWS;');
    news = runner(window);
  } catch (e) {
    console.error('Failed to parse news for RSS:', e);
  }

  return rss({
    title: 'San Anselmo Publications — News',
    description: 'Latest news and announcements from San Anselmo Publications, Inc.',
    site: context.site || 'https://sananselmopress.com',
    items: news.map((item) => ({
      title: item.title,
      pubDate: new Date(item.date),
      description: item.content,
      link: `/news.html`,
    })),
    customData: `<language>en</language>`,
  });
}
