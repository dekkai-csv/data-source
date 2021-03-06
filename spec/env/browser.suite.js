/* global chai */

import specDataFile from '../DataFile.spec.js';
import specDataChunk from '../DataChunk.spec.js';

function getPendingPromise() {
    let resolve;
    const promise = new Promise(r => (resolve = r));
    return {
        promise,
        resolve,
    };
}

function getFilePromises() {
    const bufferPromise = getPendingPromise();
    const blobPromise = getPendingPromise();
    const filePromise = getPendingPromise();

    fetch('/base/package.json').then(response => response.arrayBuffer()).then(buffer => {
        bufferPromise.resolve(buffer);

        const blob = new Blob([buffer]);
        blobPromise.resolve(blob);

        const file = new File([blob], 'package.json');
        filePromise.resolve(file);
    });

    return {
        buffer: bufferPromise.promise,
        blob: blobPromise.promise,
        file: filePromise.promise,
    };
}

function getTestFilePackage() {
    const promises = getFilePromises();

    const local = [
        {type: 'Blob', source: promises.blob},
        {type: 'File', source: promises.file},
    ];

    const remoteBaseURL = 'http://localhost:9876/file_server';
    const fileURL = `${remoteBaseURL}/file/package.json`;
    const remote = [
        {type: 'string', source: fileURL},
        {type: 'url', source: new URL(fileURL)},
    ];

    const info = promises.blob.then(blob => ({
        size: blob.size,
    }));

    return {
        local,
        remoteBaseURL,
        remote,
        info,
        buffer: promises.buffer.then(buffer => new Uint8Array(buffer)),
    };
}

const env = {
    test: window,
    chai,
    getTestFilePackage,
};

specDataFile(env);
specDataChunk(env);
