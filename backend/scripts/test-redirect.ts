import axios from 'axios';
import * as cheerio from 'cheerio';

async function resolveRealUrl(googleNewsUrl) {
    console.log(`Resolving: ${googleNewsUrl}`);
    try {
        const response = await axios.get(googleNewsUrl, {
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                'Cookie': 'CONSENT=YES+cb.20230101-14-p0.en+FX+0'
            }
        });

        const targetUrl = response.request.res.responseUrl || response.config.url || googleNewsUrl;
        console.log(`Resolved to: ${targetUrl}`);

        // Google News often wraps the link in an anchor tag with the text 'continue' or similar
        // if it detects an automated request and shows a consent/redirect page.
        const $ = cheerio.load(response.data);
        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
            console.log(`Found meta refresh: ${metaRefresh}`);
            const urlPart = metaRefresh.split('url=')[1];
            if (urlPart) {
                console.log(`Extracted from meta: ${urlPart}`);
                return urlPart;
            }
        }

        // Look for the actual link in the page if it's a redirect interstitial
        const anchorUrl = $('a').attr('href');
        if (targetUrl.includes('news.google.com') && anchorUrl && !anchorUrl.includes('google.com')) {
            console.log(`Found anchor link: ${anchorUrl}`);
            return anchorUrl;
        }

        console.log(`HTML Preview: ${response.data.substring(0, 500)}`);

        return targetUrl;
    } catch (error) {
        console.error(`Failed to resolve real URL: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Headers:`, error.response.headers);
            console.error(`Data:`, (error.response.data || '').toString().substring(0, 500));
        }
        return googleNewsUrl;
    }
}

async function test() {
    // Example Google News URL
    const url = 'https://news.google.com/articles/CBMisAFBVV95cUxQU3pYa1p6UE5lZUJqS0hRNVBqVzRfR084RXZjN3VfWkFqUzlxUFZ0YlpSZTlpUUlfcW1PQUJjN1p6UHFqZzVfWkFqUzlxUFZ0YlpSZTlpUUlfcW1PQUJjN1p6UHFqZzVfWkFqUzlxUFZ0YlpSZTlpUUlfcW1PQUJjN1p6UHFqZzVfWkFqUzlxUFZ0YlpSZTlpUUlfcW1PQUJjN1p6UHFqZzVfWkFqUzlxUFZ0?hl=id-ID&gl=ID&ceid=ID%3Aid';
    await resolveRealUrl(url);
}

test();
