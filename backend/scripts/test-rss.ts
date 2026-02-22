import axios from 'axios';
import * as cheerio from 'cheerio';
import * as xml2js from 'xml2js';

async function testRSS() {
    const query = 'Prabowo';
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;

    console.log(`Fetching RSS: ${rssUrl}`);
    try {
        const response = await axios.get(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(response.data, (err, result) => {
            if (err) {
                console.error('Failed to parse XML', err);
                return;
            }

            const items = result.rss.channel.item;
            if (items && items.length > 0) {
                console.log(`Found ${items.length} items`);
                // Check the first 3 items
                for (let i = 0; i < Math.min(3, items.length); i++) {
                    console.log(`\nItem ${i + 1}:`);
                    console.log(`Title: ${items[i].title}`);
                    console.log(`Link: ${items[i].link}`);
                    console.log(`Source: ${items[i].source?._ || items[i].source}`);
                    console.log(`PubDate: ${items[i].pubDate}`);
                }
            } else {
                console.log('No items found in RSS feed');
            }
        });
    } catch (error) {
        console.error('Failed to fetch RSS', error.message);
    }
}

testRSS();
