import '../../node_modules/mocha/mocha.js';
import '../../node_modules/chai/chai.js';

import specDataFile from '../DataFile.spec.js';
import specDataChunk from '../DataChunk.spec.js';

// setup mocha
mocha.setup({ui: 'bdd', reporter: 'spec'});
mocha.checkLeaks();

function onCompleted(failures) {
    if (failures > 0) {
        Deno.exit(1);
    } else {
        Deno.exit(0);
    }
}

// Browser based Mocha requires `window.location` to exist.
window.location = new URL('http://localhost:0');

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

    const fileURL = 'http://localhost:8967/file/package.json';
    const remote = [
        {type: 'string', source: fileURL},
        {type: 'url', source: new URL(fileURL)},
    ];

    const info = Deno.stat(filePath);
    const buffer = Deno.readFile(filePath);

    return {
        local,
        remote,
        info,
        buffer,
    }
}

const env = {
    chai,
    getTestFilePackage,
};

// register tests
await specDataFile(env);
await specDataChunk(env);

// run tests
mocha.color(true);
mocha.run(onCompleted).globals(['onerror']);
