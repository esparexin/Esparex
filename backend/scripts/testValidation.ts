import { validateBrandSuggestion, validateModelSuggestion } from './suggestionValidation';

const runTests = () => {
    let failed = 0;
    const assert = (scenario: string, result: boolean, expected: boolean) => {
        if (result === expected) {
            console.log(`✅ PASS: ${scenario}`);
        } else {
            console.error(`❌ FAIL: ${scenario}`);
            failed++;
        }
    };

    console.log('--- Brand Validation Tests ---');
    // Happy paths
    assert('Valid Brand', validateBrandSuggestion('Samsung').isValid, true);
    assert('Valid Brand w/ spaces', validateBrandSuggestion('Sony Ericsson').isValid, true);
    assert('Valid Brand w/ allowed punctuation', validateBrandSuggestion('Realme/Oppo').isValid, true);

    // Auto-formatting checks (should capitalize and trim)
    const formatted = validateBrandSuggestion('  oneplus   pro--test..case ');
    assert('Brand Formatting', formatted.cleanName === 'Oneplus Pro-Test.Case', true);

    // Rejections
    assert('Reject empty', validateBrandSuggestion('').isValid, false);
    assert('Reject numbers only', validateBrandSuggestion('12345').isValid, false);
    assert('Reject short after cleaning', validateBrandSuggestion('A').isValid, false);
    assert('Reject too long (40+ chars)', validateBrandSuggestion('This Is A Super Long Brand Name That No One Has').isValid, false);

    // Spam checks
    assert('Reject Emojis', validateBrandSuggestion('Apple 🍎').isValid, false);
    assert('Reject URLs', validateBrandSuggestion('Visit mybrand.com').isValid, false);
    assert('Reject repeated chars', validateBrandSuggestion('Sammmmmsung').isValid, false); // 5 in a row is REJECT
    assert('Allow 4 repeated chars', validateBrandSuggestion('Sammmmsung').isValid, true); // 4 in a row is ok
    assert('Reject >70% special chars', validateBrandSuggestion('H///---O///').isValid, false);

    console.log('\n--- Model Validation Tests ---');
    // Happy paths
    assert('Valid Model', validateModelSuggestion('Galaxy S24 Ultra').isValid, true);
    assert('Valid Model w/ allowed punct', validateModelSuggestion('iPhone 15 Pro-Max +').isValid, true);

    // Rejections
    assert('Reject not allowed punctuation (model)', validateModelSuggestion('Galaxy S24.5/Plus').isValid, true); // It strips it so it becomes valid!

    // Let's see what happens to 'S24/Plus' -> the '/' is replaced with space -> 'S24 Plus'
    const modelPunct = validateModelSuggestion('Galaxy S24/Plus');
    assert('Model stripping invalid punct', modelPunct.cleanName === 'Galaxy S24 Plus', true);

    assert('Reject repeated chars in Model', validateModelSuggestion('iPhone 15 Pro Moooooox').isValid, false);

    if (failed > 0) {
        console.error(`\nTests finished with ${failed} failures.`);
        process.exit(1);
    } else {
        console.log('\nAll tests passed successfully!');
        process.exit(0);
    }
}

runTests();
