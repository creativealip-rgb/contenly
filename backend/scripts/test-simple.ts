import { AdvancedScraperService } from './src/modules/scraper/advanced-scraper.service';

async function testSingleArticle() {
    const scraper = new AdvancedScraperService();

    console.log('\n🚀 Testing Advanced Article Scraper\n');

    // Test with a simple well-known article
    const testUrl = 'https://www.theverge.com/';

    console.log(`Testing URL: ${testUrl}`);
    console.log('Please wait...\n');

    try {
        const result = await scraper.scrapeArticle(testUrl);

        console.log('✅ SUCCESS!');
        console.log('━'.repeat(60));
        console.log(`Tier Used: ${result.extractionTier}`);
        console.log(`Title: ${result.title}`);
        console.log(`Content Length: ${result.content.length} chars`);
        console.log(`Word Count: ~${Math.round(result.content.split(/\s+/).length)} words`);
        console.log(`Images: ${result.images.length}`);
        console.log('━'.repeat(60));
        console.log('\nFirst 500 characters of content:');
        console.log(result.content.substring(0, 500));
        console.log('...\n');

    } catch (error) {
        console.log('❌ FAILED');
        console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

testSingleArticle()
    .then(() => console.log('\n✨ Test complete!'))
    .catch(error => console.error('Test failed:', error));
