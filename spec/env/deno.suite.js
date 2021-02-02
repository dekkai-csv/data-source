import '../../node_modules/chai/chai.js';

import specDataFile from '../DataFile.spec.js';
import specDataChunk from '../DataChunk.spec.js';

// create the environment
function noOpPromise(result) {
    return new Promise(resolve => resolve(result));
}

function getTestFilePackage() {
    const filePath = './package.json';
    const local = [
        {type: 'string', source: noOpPromise(filePath)},
        {type: 'url', source: noOpPromise(new URL(`../.${filePath}`, import.meta.url))},
    ];

    const remoteBaseURL = 'http://localhost:8967';
    const fileURL = `${remoteBaseURL}/file/package.json`;
    const remote = [
        {type: 'string', source: fileURL},
        {type: 'url', source: new URL(fileURL)},
    ];

    const info = Deno.stat(filePath);
    const buffer = Deno.readFile(filePath);

    return {
        local,
        remote,
        remoteBaseURL,
        info,
        buffer,
    }
}

const names = [];

const test = {
    describe: async (n, fn) => { names.push(n); fn(); names.pop(); },
    it: async (n, fn) => await Deno.test({ name: `${names.join('::')}::${n}`, fn, sanitizeOps: false, sanitizeResources: false }),
    before: async fn => await fn(),
};

const env = {
    test,
    chai,
    getTestFilePackage,
};

// register tests
await specDataFile(env);
await specDataChunk(env);
