function decodeGoogleNewsUrl(encodedUrl: string) {
    try {
        const urlObj = new URL(encodedUrl);
        const pathParts = urlObj.pathname.split('/');

        // The token is usually the last part of the path, e.g., /articles/CBMi...
        let token = pathParts[pathParts.length - 1];

        // Base64URL to Base64
        token = token.replace(/-/g, '+').replace(/_/g, '/');

        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        console.log('Decoded Payload:');
        console.log(decoded);

        // Try to find http or https link using regex match
        const urlMatch = decoded.match(/https?:\/\/[^\s"'\x00-\x1F]+/g);
        if (urlMatch) {
            console.log('Found URLs in payload:');
            urlMatch.forEach(u => console.log(u));
        }
    } catch (e) {
        console.error('Error decoding:', e);
    }
}

const url = 'https://news.google.com/rss/articles/CBMiYEFVX3lxTFBONVMzU2pMa2JNMWptYlh6MGRBaEo0TE01cldIRzdlTVFVTVdocVhTVWlsLWU5YTJleE1PR0x6cm5mNlItQUhiSlFCWW5UcE5VRjhKeW5iTDBTQmR4MXVKZNIBZkFVX3lxTE4tNU5pb2hLUVZHNU1wbktMMnREQkNXZVZMNkxkTjdxZ0E2Mk44Q3B1dTg4M0J4WjVJRGpvaFBUaWdOa3FHNWE2WWNGMGdXd3lKalNtQm1aYnBOdVozalZQT2p0aFUyQQ?oc=5';
decodeGoogleNewsUrl(url);
