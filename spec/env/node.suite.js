import chai from 'chai';
import path from 'path';
import fs from 'fs';
import url from 'url';

import specDataFile from '../DataFile.spec.js';
import specDataChunk from '../DataChunk.spec.js';

function noOpPromise(result) {
    return new Promise(resolve => resolve(result));
}

function getTestFilePackage() {
    const filePath = path.resolve(path.dirname(''), './package.json');
    const fileHandle = fs.openSync(filePath);
    const local = [
        {type: 'string', source: noOpPromise(filePath)},
        {type: 'url', source: noOpPromise(url.pathToFileURL(filePath))},
        {type: 'file handle', source: noOpPromise(fileHandle)},
    ];

    const remoteBaseURL = 'http://localhost:8967';
    const fileURL = `${remoteBaseURL}/file/package.json`;
    const remote = [
        {type: 'string', source: fileURL},
        {type: 'url', source: new URL(fileURL)},
    ];

    const info = noOpPromise(fs.fstatSync(fileHandle));

    const nodeBuffer = fs.readFileSync(filePath);
    const buffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

    return {
        local,
        remote,
        remoteBaseURL,
        info,
        buffer: noOpPromise(new Uint8Array(buffer)),
    };
}

const env = {
    chai,
    getTestFilePackage,
};

specDataFile(env);
specDataChunk(env);
