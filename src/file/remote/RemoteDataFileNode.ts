import {isNodeJS} from '@dekkai/env/build/lib/node';
import {loadModule} from '@dekkai/env/build/lib/moduleLoader';
import {RemoteDataFile} from './RemoteDataFile';
import {RemoteFileSourceNode} from '../types';
import {IncomingMessage} from 'http';

/**
 * Cached [`http`](https://nodejs.org/api/http.html) module in node and `null` in every other platform. If this in null
 * in node, `await` for [[kLibPromise]] to finish.
 * @internal
 */
let gHTTP: any = null;

/**
 * Cached [`https`](https://nodejs.org/api/https.html) module in node and `null` in every other platform. If this in
 * null in node, `await` for [[kLibPromise]] to finish.
 * @internal
 */
let gHTTPS: any = null;

/**
 * Cached [`url`](https://nodejs.org/api/url.html) module in node and `null` in every other platform. If this in
 * null in node, `await` for [[kLibPromise]] to finish.
 * @internal
 */
let gURL: any = null;

/**
 * Promise that resolves to the [`http`](https://nodejs.org/api/fs.html) and [`https`](https://nodejs.org/api/https.html)
 * modules in node and `null` in every other platform.
 * @internal
 */
const kLibPromise: Promise<any> = (
    isNodeJS() ?
        Promise.all([loadModule('http'), loadModule('https'), loadModule('url')]) :
        Promise.resolve([null, null])
).then(libs => {
    gHTTP = libs[0];
    gHTTPS = libs[1];
    gURL = libs[2];
});

/**
 * The byte size of 4MB.
 * @internal
 */
const kSizeOf4MB = 1024 * 1024 * 4;

/**
 * Represents a remote data file on node.js.
 */
export class RemoteDataFileNode extends RemoteDataFile {
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * NOTE: This function calls `startDownloading` on the file.
     * @param source - The file to wrap
     */
    public static async fromSource(source: RemoteFileSourceNode): Promise<RemoteDataFileNode> {
        const result = new RemoteDataFileNode(source);
        await result.startDownloading();
        return result;
    }

    /**
     * Variable to hold the byte length of the loaded file.
     */
    private _byteLength: number = null;

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    public get byteLength(): Promise<number> {
        if (this._byteLength === null) {
            return new Promise(resolve => {
                const handleEvent = (e: symbol, byteLength: number): void => {
                    this.off(RemoteDataFile.LOADING_START, handleEvent);
                    this._byteLength = byteLength;
                    resolve(byteLength);
                };
                this.on(RemoteDataFile.LOADING_START, handleEvent);
            });
        }
        return Promise.resolve(this._byteLength);
    }

    /**
     * Variable to hold the bytes loaded so far from the remote file.
     */
    private _bytesLoaded: number = null;

    /**
     * Bytes loaded for this file, useful when parsing streaming files.
     */
    public get bytesLoaded(): number {
        return this._bytesLoaded;
    }

    /**
     * Variable that holds a promise that resolves when the file finishes loading
     */
    private _onLoadingComplete: { promise: Promise<number>, resolve: (n: number) => void, reject: (e: Error) => void, started: boolean } = null;

    /**
     * Promise that resolves when this file has finished downloading from the remote server.
     */
    public get onLoadingComplete(): Promise<number> {
        return this._onLoadingComplete.promise;
    }

    /**
     * Variable that holds a boolean describing if the loading is complete or not.
     */
    private _isLoadingComplete: boolean = false;

    /**
     * Has the file finished downloading from the remote server.
     */
    public get isLoadingComplete(): boolean {
        return this._isLoadingComplete;
    }

    /**
     * An ArrayBuffer instance that holds the data loaded for this file, do not keep a local copy of this variable as
     * it could be replaced as the file loads into memory.
     */
    private buffer: ArrayBuffer = null;

    /**
     * The source from which the file should be loaded.
     */
    private source: RemoteFileSourceNode;

    constructor(source: RemoteFileSourceNode) {
        super();
        this.source = source;
        this._onLoadingComplete = {
            promise: null,
            resolve: null,
            reject: null,
            started: false,
        };
        this._onLoadingComplete. promise = new Promise((resolve, reject) => {
            this._onLoadingComplete.resolve = resolve;
            this._onLoadingComplete.reject = reject;
        });
    }

    /**
     * This function must ba called in order to start downloading the file, if this function fail the file cannot be
     * fetched from the server.
     */
    public startDownloading(): Promise<void> {
        return new Promise((resolve, reject) => {
            // wait for libraries to be loaded
            kLibPromise.then(() => {
                const url = this.source instanceof gURL.URL ? this.source : gURL.parse(this.source);
                const protocol = url.protocol === 'https' ? gHTTPS : gHTTP;

                protocol.get(this.source, response => {
                    if (response.statusCode < 200 || response.statusCode >= 300) {
                        response.resume();

                        const notOK = new Error('Network response was not ok');
                        this._onLoadingComplete.reject(notOK);
                        reject(notOK);
                        return;
                    }
                    resolve();

                    // allow for the calling script to register events, etc
                    setTimeout(() => this.readFileStream(response));
                });
            });
        });
    }

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public async loadData(start: number = 0, end: number = this._byteLength): Promise<ArrayBuffer> {
        if (this._isLoadingComplete && start >= this._byteLength) {
            return new ArrayBuffer(0);
        }

        if (this._bytesLoaded >= end || this._isLoadingComplete) {
            return this.buffer.slice(start, Math.min(end, this._bytesLoaded));
        }

        return new Promise(resolve => {
            const handleEvent = (e: symbol, loaded: number): void => {
                if (loaded >= end || e === RemoteDataFile.LOADING_COMPLETE) {
                    this.off(RemoteDataFile.LOADING_PROGRESS, handleEvent);
                    this.off(RemoteDataFile.LOADING_COMPLETE, handleEvent);
                    resolve(this.buffer.slice(start, Math.min(end, loaded)));
                }
            };
            this.on(RemoteDataFile.LOADING_PROGRESS, handleEvent);
            this.on(RemoteDataFile.LOADING_COMPLETE, handleEvent);
        });
    }

    /**
     * Reads the data from a remote response using streams, this allows for data to be processed even if the file has
     * not been completely loaded.
     * @param response - A response object returned by `fetch`. This object will be used to retrieve the read stream.
     */
    private async readFileStream(response: IncomingMessage): Promise<void> {
        const contentLength = response.headers['content-length'];
        if (contentLength !== null && contentLength !== undefined) {
            this._byteLength = parseInt(contentLength, 10);
            this.buffer = new ArrayBuffer(this._byteLength);
        } else {
            this._byteLength = -1;
            this.buffer = new ArrayBuffer(kSizeOf4MB);
        }
        this._bytesLoaded = 0;
        this.emit(RemoteDataFile.LOADING_START, this._byteLength);

        if (this._byteLength === 0) {
            this.emit(RemoteDataFile.LOADING_PROGRESS, this._bytesLoaded, this._byteLength);
            this._isLoadingComplete = true;
            this.emit(RemoteDataFile.LOADING_COMPLETE, this._byteLength);
            this._onLoadingComplete.resolve(this._byteLength);
            response.resume();
        } else {
            let view = new Uint8Array(this.buffer);

            response.on('error', error => {
                this._onLoadingComplete.reject(error);
                throw error;
            });

            response.on('data', chunk => {
                if (this.buffer.byteLength < this._bytesLoaded + chunk.byteLength) {
                    const oldView = view;
                    this.buffer = new ArrayBuffer(this._bytesLoaded + Math.max(chunk.byteLength, kSizeOf4MB));
                    view = new Uint8Array(this.buffer);
                    view.set(oldView, 0);
                }
                view.set(chunk, this._bytesLoaded);

                this.emit(RemoteDataFile.LOADING_PROGRESS, this._bytesLoaded, this._byteLength);
                this._bytesLoaded += chunk.byteLength;
            });

            response.on('end', () => {
                this._byteLength = this._bytesLoaded;
                this._isLoadingComplete = true;
                this.emit(RemoteDataFile.LOADING_COMPLETE, this._byteLength);
                this._onLoadingComplete.resolve(this._byteLength);
            });
        }
    }
}
