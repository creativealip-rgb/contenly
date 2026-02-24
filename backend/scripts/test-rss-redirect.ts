import axios from 'axios';

async function testRssRedirect() {
    // URL from the RSS feed output
    const url = 'https://news.google.com/rss/articles/CBMiYEFVX3lxTFBONVMzU2pMa2JNMWptYlh6MGRBaEo0TE01cldIRzdlTVFVTVdocVhTVWlsLWU5YTJleE1PR0x6cm5mNlItQUhiSlFCWW5UcE5VRjhKeW5iTDBTQmR4MXVKZNIBZkFVX3lxTE4tNU5pb2hLUVZHNU1wbktMMnREQkNXZVZMNkxkTjdxZ0E2Mk44Q3B1dTg4M0J4WjVJRGpvaFBUaWdOa3FHNWE2WWNGMGdXd3lKalNtQm1aYnBOdVozalZQT2p0aFUyQQ?oc=5';

    console.log(`Testing redirect for: ${url}`);
    try {
        const response = await axios.get(url, {
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const finalUrl = response.request.res.responseUrl || response.config.url;
        console.log(`Redirected to: ${finalUrl}`);
        const fs = require('fs');
        fs.writeFileSync('rss-response.html', response.data);
    } catch (error) {
        console.error(`Failed to redirect: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
        }
    }
}

testRssRedirect();
