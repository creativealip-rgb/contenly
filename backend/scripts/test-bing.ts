import axios from 'axios';
import * as cheerio from 'cheerio';

async function testBingNews() {
    const query = 'Prabowo';
    // Use Indonesian locale
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&cc=id`;

    console.log('Fetching:', url);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const $ = cheerio.load(response.data);
        const results: any[] = [];

        $('.news-card').each((i, el) => {
            if (i >= 5) return;
            const title = $(el).find('a.title').text().trim();
            const link = $(el).find('a.title').attr('href');
            const source = $(el).find('.source a').text().trim() || $(el).find('.source').text().trim();
            const time = $(el).find('span[tabindex="0"]').attr('aria-label') || $(el).find('.time').text().trim();

            if (title && link) {
                results.push({ title, link, source, time });
            }
        });

        console.log('Results:', results);
    } catch (error) {
        console.error('Error fetching Bing News:', error.message);
    }
}

testBingNews();
