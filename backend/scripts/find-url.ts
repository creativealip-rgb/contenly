import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('rss-response.html', 'utf-8');
const $ = cheerio.load(html);

console.log('--- Anchor Tags ---');
let foundLink = false;
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('accounts.google.com') && !href.includes('support.google.com') && href.startsWith('http')) {
        console.log('Link:', href);
        foundLink = true;
    }
});
if (!foundLink) console.log('No interesting outbound links found.');

console.log('\n--- data-n-v attributes ---');
let foundData = false;
$('[data-n-v]').each((i, el) => {
    const dataNV = $(el).attr('data-n-v');
    if (dataNV && dataNV.length > 10) {
        console.log('data-n-v:', dataNV);
        foundData = true;
    }
});
if (!foundData) console.log('No data-n-v found.');

console.log('\n--- Script content URLs ---');
const scriptText = $('script').text();
const urls = scriptText.match(/https?:\/\/[^\s"'\x00-\x1F\\]+/g);
if (urls) {
    const uniqueUrls = [...new Set(urls)].filter(u =>
        !u.includes('google.com') &&
        !u.includes('gstatic.com') &&
        !u.includes('schema.org')
    );
    if (uniqueUrls.length > 0) {
        uniqueUrls.forEach(u => console.log('URL in script:', u));
    } else {
        console.log('No outbound URLs in scripts.');
    }
} else {
    console.log('No URLs found in scripts.');
}
