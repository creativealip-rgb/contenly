import { AdvancedScraperService } from './src/modules/scraper/advanced-scraper.service';
import * as fs from 'fs';

async function comprehensiveTest() {
    const scraper = new AdvancedScraperService();
    const results: any[] = [];

    console.log('\n' + '='.repeat(80));
    console.log(' 🚀 ADVANCED ARTICLE SCRAPER - COMPREHENSIVE TEST');
    console.log('='.repeat(80) + '\n');

    const testUrls = [
        {
            name: 'Selular.id (Indonesian Tech News)',
            url: 'https://selular.id/feed/', // Using feed URL to get latest
            isRss: true
        },
        {
            name: 'The Verge (English Tech News)',
            url: 'https://www.theverge.com/tech',
            isRss: false
        },
    ];

    for (const test of testUrls) {
        console.log(`\n📰 Testing: ${test.name}`);
        console.log('-'.repeat(80));
        console.log(`URL: ${test.url}`);
        console.log('Status: Fetching...\n');

        try {
            const start = Date.now();
            const result = await scraper.scrapeArticle(test.url);
            const duration = Date.now() - start;

            console.log('✅ EXTRACTION SUCCESSFUL!');
            console.log(`⏱️  Duration: ${duration}ms`);
            console.log(`📊 Extraction Tier: ${result.extractionTier} ${getTierName(result.extractionTier)}`);
            console.log(`📝 Title: ${result.title.substring(0, 100)}${result.title.length > 100 ? '...' : ''}`);
            console.log(`📏 Content Length: ${result.content.length.toLocaleString()} characters`);
            console.log(`📄 Word Count: ${Math.round(result.content.split(/\s+/).length).toLocaleString()} words`);
            console.log(`🖼️  Images Found: ${result.images.length}`);
            console.log(`👤 Author: ${result.metadata.author || 'N/A'}`);
            console.log(`📅 Published: ${result.metadata.publishedDate || 'N/A'}`);
            console.log(`📝 Excerpt: ${result.excerpt.substring(0, 150)}...`);

            results.push({
                name: test.name,
                success: true,
                tier: result.extractionTier,
                contentLength: result.content.length,
                wordCount: Math.round(result.content.split(/\s+/).length),
                duration
            });

        } catch (error) {
            console.log('❌ EXTRACTION FAILED');
            console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);

            results.push({
                name: test.name,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(' 📊 TEST SUMMARY');
    console.log('='.repeat(80) + '\n');

    const successful = results.filter(r => r.success).length;
    const total = results.length;

    console.log(`Tests Run: ${total}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${total - successful}`);
    console.log(`Success Rate: ${Math.round((successful / total) * 100)}%\n`);

    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        if (result.success) {
            console.log(`   ✅ Tier ${result.tier} | ${result.wordCount} words | ${result.duration}ms`);
        } else {
            console.log(`   ❌ ${result.error}`);
        }
    });

    // Save detailed results
    const detailedResults = {
        timestamp: new Date().toISOString(),
        summary: {
            total,
            successful,
            failed: total - successful,
            successRate: Math.round((successful / total) * 100)
        },
        results
    };

    fs.writeFileSync('test-results.json', JSON.stringify(detailedResults, null, 2));
    console.log('\n💾 Detailed results saved to: test-results.json');

    console.log('\n' + '='.repeat(80));
    console.log(` ✨ Testing Complete!`);
    console.log('='.repeat(80) + '\n');
}

function getTierName(tier: number): string {
    switch (tier) {
        case 1: return '(Mozilla Readability)';
        case 2: return '(Content Heuristics)';
        case 3: return '(CSS Selectors)';
        default: return '';
    }
}

// Run tests
comprehensiveTest()
    .then(() => {
        console.log('🎉 All tests completed successfully!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
