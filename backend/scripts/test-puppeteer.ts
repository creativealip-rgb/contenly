import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testPuppeteerRedirect() {
    const url = 'https://news.google.com/rss/articles/CBMiYEFVX3lxTFBONVMzU2pMa2JNMWptYlh6MGRBaEo0TE01cldIRzdlTVFVTVdocVhTVWlsLWU5YTJleE1PR0x6cm5mNlItQUhiSlFCWW5UcE5VRjhKeW5iTDBTQmR4MXVKZNIBZkFVX3lxTE4tNU5pb2hLUVZHNU1wbktMMnREQkNXZVZMNkxkTjdxZ0E2Mk44Q3B1dTg4M0J4WjVJRGpvaFBUaWdOa3FHNWE2WWNGMGdXd3lKalNtQm1aYnBOdVozalZQT2p0aFUyQQ?oc=5';

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        console.log(`Navigating to ${url}...`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        let currentUrl = page.url();
        console.log(`Current URL after load: ${currentUrl}`);

        if (currentUrl.includes('news.google.com')) {
            console.log('Waiting for network idle to catch JS redirect...');
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            } catch (err) {
                console.log('Timeout waiting for redirect, maybe it did not happen.');
            }
            currentUrl = page.url();
            console.log(`Final URL: ${currentUrl}`);
        } else {
            console.log(`Final URL: ${currentUrl}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

testPuppeteerRedirect();
