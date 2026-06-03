import { AdvancedScraperService } from './src/modules/scraper/advanced-scraper.service';

async function testScraper() {
    const scraper = new AdvancedScraperService();

    console.log('🚀 Testing Advanced Article Scraper\n');
    console.log('='.repeat(80));

    // Test 1: Selular.id
    console.log('\n📰 TEST 1: Selular.id Article');
    console.log('-'.repeat(80));
    try {
        // Using a recent URL from the RSS feed we successfully fetched
        const selularUrl = 'https://selular.id/2025/01/cara-buat-dan-pakai-stiker-ai-ios-18-2/';
        console.log(`URL: ${selularUrl}\n`);

        const result1 = await scraper.scrapeArticle(selularUrl);

        console.log('✅ EXTRACTION SUCCESSFUL!');
        console.log(`📊 Tier Used: ${result1.extractionTier} (1=Readability, 2=Heuristics, 3=Selectors)`);
        console.log(`📝 Title: ${result1.title}`);
        console.log(`📏 Content Length: ${result1.content.length} characters`);
        console.log(`📄 Word Count: ~${Math.round(result1.content.split(/\s+/).length)} words`);
        console.log(`🖼️  Images Found: ${result1.images.length}`);
        console.log(`👤 Author: ${result1.metadata.author || 'N/A'}`);
        console.log(`📅 Published: ${result1.metadata.publishedDate || 'N/A'}`);
        console.log(`\n📖 Content Preview (first 300 chars):`);
        console.log(`"${result1.content.substring(0, 300)}..."\n`);
    } catch (error) {
        console.log('❌ EXTRACTION FAILED');
        console.log(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    // Test 2: TechCrunch (regression)
    console.log('='.repeat(80));
    console.log('\n📰 TEST 2: TechCrunch Article (Regression Test)');
    console.log('-'.repeat(80));
    try {
        const techcrunchUrl = 'https://techcrunch.com/2025/01/17/how-claude-became-more-than-chatgpt/';
        console.log(`URL: ${techcrunchUrl}\n`);

        const result2 = await scraper.scrapeArticle(techcrunchUrl);

        console.log('✅ EXTRACTION SUCCESSFUL!');
        console.log(`📊 Tier Used: ${result2.extractionTier} (1=Readability, 2=Heuristics, 3=Selectors)`);
        console.log(`📝 Title: ${result2.title}`);
        console.log(`📏 Content Length: ${result2.content.length} characters`);
        console.log(`📄 Word Count: ~${Math.round(result2.content.split(/\s+/).length)} words`);
        console.log(`🖼️  Images Found: ${result2.images.length}`);
        console.log(`👤 Author: ${result2.metadata.author || 'N/A'}`);
        console.log(`📅 Published: ${result2.metadata.publishedDate || 'N/A'}`);
        console.log(`\n📖 Content Preview (first 300 chars):`);
        console.log(`"${result2.content.substring(0, 300)}..."\n`);
    } catch (error) {
        console.log('❌ EXTRACTION FAILED');
        console.log(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    // Test 3: Telset.id (Indonesian tech site)
    console.log('='.repeat(80));
    console.log('\n📰 TEST 3: Telset.id Article (Additional Test)');
    console.log('-'.repeat(80));
    try {
        const telsetUrl = 'https://telset.id/news/ponsel-android-xiaomi-redmi-note-14-pro-plus-5g/';
        console.log(`URL: ${telsetUrl}\n`);

        const result3 = await scraper.scrapeArticle(telsetUrl);

        console.log('✅ EXTRACTION SUCCESSFUL!');
        console.log(`📊 Tier Used: ${result3.extractionTier} (1=Readability, 2=Heuristics, 3=Selectors)`);
        console.log(`📝 Title: ${result3.title}`);
        console.log(`📏 Content Length: ${result3.content.length} characters`);
        console.log(`📄 Word Count: ~${Math.round(result3.content.split(/\s+/).length)} words`);
        console.log(`🖼️  Images Found: ${result3.images.length}`);
        console.log(`👤 Author: ${result3.metadata.author || 'N/A'}`);
        console.log(`📅 Published: ${result3.metadata.publishedDate || 'N/A'}`);
        console.log(`\n📖 Content Preview (first 300 chars):`);
        console.log(`"${result3.content.substring(0, 300)}..."\n`);
    } catch (error) {
        console.log('❌ EXTRACTION FAILED');
        console.log(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    console.log('='.repeat(80));
    console.log('\n✨ Testing Complete!\n');
}

// Run tests
testScraper()
    .then(() => {
        console.log('🎉 All tests finished successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
