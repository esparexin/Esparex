const fs = require('fs');
const path = require('path');

const testFiles = [
    'backend/user/src/__tests__/routes/chatRoutes.auth.spec.ts',
    'backend/user/src/__tests__/routes/listingRoutes.auth.spec.ts',
    'backend/user/src/__tests__/routes/middleware.batch1.parity.spec.ts',
    'backend/user/src/__tests__/routes/chatRoutes.validation.spec.ts',
    'backend/user/src/__tests__/routes/catalogRequestRoutes.auth.spec.ts'
];

testFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace single quotes version
    content = content.replace(
        /jest\.mock\('@esparex\/core\/utils\/redisCache',\s*\(\)\s*=>\s*\(\{/g,
        "jest.mock('@esparex/core/utils/redisCache', () => { const actual = jest.requireActual('@esparex/core/utils/redisCache'); return { ...actual,"
    );
    // Replace double quotes version
    content = content.replace(
        /jest\.mock\("@esparex\/core\/utils\/redisCache",\s*\(\)\s*=>\s*\(\{/g,
        'jest.mock("@esparex/core/utils/redisCache", () => { const actual = jest.requireActual("@esparex/core/utils/redisCache"); return { ...actual,'
    );
    // Also we need to close the curly brace that we opened in the arrow function: `() => {`
    // The original ended with `}));`. We need to replace it with `}; });` for this mock specifically.
    // Wait, it is safer to just replace `jest.mock(..., () => ({` with `jest.mock(..., () => ({ ...jest.requireActual(...),`
    // Because that keeps the syntax identical! Let's do that!
    
    content = fs.readFileSync(filePath, 'utf8'); // reload
    
    content = content.replace(
        /jest\.mock\('@esparex\/core\/utils\/redisCache',\s*\(\)\s*=>\s*\(\{/g,
        "jest.mock('@esparex/core/utils/redisCache', () => ({\n    ...jest.requireActual('@esparex/core/utils/redisCache'),"
    );
    content = content.replace(
        /jest\.mock\("@esparex\/core\/utils\/redisCache",\s*\(\)\s*=>\s*\(\{/g,
        'jest.mock("@esparex/core/utils/redisCache", () => ({\n    ...jest.requireActual("@esparex/core/utils/redisCache"),'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${file}`);
});
