const proxy = new Proxy({}, {
    get(target, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return proxy;
        
        if (!target[prop]) {
            target[prop] = new Proxy({}, {
                get(modelTarget, method) {
                    if (method === 'then') return undefined;
                    if (!modelTarget[method]) {
                        modelTarget[method] = function mockFn() {};
                        modelTarget[method]._isMock = true;
                    }
                    return modelTarget[method];
                }
            });
        }
        return target[prop];
    }
});

const { Ad, User } = proxy;
console.log('Ad:', Ad);
console.log('Ad.findOne:', Ad.findOne._isMock);
