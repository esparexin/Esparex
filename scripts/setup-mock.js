const fs = require('fs');
const proxyScript = `
const handler = {
    get(target, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return module.exports;
        
        try {
            const individualModule = require('@esparex/core/models/' + prop);
            if (individualModule && individualModule[prop]) {
                return individualModule[prop];
            }
            if (individualModule && individualModule.default) {
                return individualModule.default;
            }
            return individualModule;
        } catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                console.error(e);
            }
        }
        
        if (!target[prop]) {
            target[prop] = new Proxy({}, {
                get(modelTarget, method) {
                    if (method === 'then') return undefined;
                    if (!modelTarget[method]) {
                        modelTarget[method] = jest.fn();
                    }
                    return modelTarget[method];
                }
            });
        }
        return target[prop];
    }
};
module.exports = new Proxy({}, handler);
`;
fs.writeFileSync('backend/user/src/tests/models.mock.ts', proxyScript);
console.log('Created models.mock.ts');
