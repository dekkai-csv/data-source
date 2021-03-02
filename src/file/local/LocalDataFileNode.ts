import {LocalDataFile} from './LocalDataFile';
import {loadModule} from '@dekkai/env/build/lib/moduleLoader.js';
import {isNodeJS} from '@dekkai/env/build/lib/node.js';
import {LocalFileSourceNode} from '../types';
import {Stats as FSStats} from 'fs';

/**
 * Cached [`fs`](https://nodejs.org/api/fs.html) module in node and `null` in every other platform. If this in null in
 * node, `await` for [[kFsPromise]] to finish.
 * @internal
 */
let gFS: any = null;

/**
 * Promise that resolves to the [`fs`](https://nodejs.org/api/fs.html) module in node and `null` in every other platform.
 * @internal
 */
const kFsPromise: Promise<any> = (isNodeJS() ? loadModule('fs') : Promise.resolve(null)).then(fs => (gFS = fs));

/**
 * Represents a data file on the node platform.
 */
export class LocalDataFileNode extends LocalDataFile {
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    public static async fromSource(source: LocalFileSourceNode): Promise<LocalDataFileNode> {
        // wait for `fs` to be loaded
        await kFsPromise;

        let handle: number;

        if (source instanceof URL || typeof source === 'string') {
            handle = gFS.openSync(source);
        } else if (typeof source === 'number') {
            handle = source;
        } else {
            throw `A LocalDataFileNode cannot be created from a ${typeof source} instance`;
        }

        const stats = gFS.fstatSync(handle);
        return new LocalDataFileNode(handle, stats);
    }

    /**
     * Node file handle returned by the `fs.open` function
     */
    private handle: number;
    /**
     * File stats for the wrapped file, used to obtain the byte length of the file during slicing
     */
    private stats: FSStats;

    /**
     * @param handle - A node file handle
     * @param stats - Stats for the file the handle points at
     */
    constructor(handle: number, stats: FSStats) {
        super();
        this.handle = handle;
        this.stats = stats;
    }

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength(): Promise<number> {
        return Promise.resolve(this.stats.size);
    }

    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    public close(): void {
        const handle = this.handle;
        kFsPromise.then(() => gFS.closeSync(handle));

        this.handle = null;
        this.stats = null;
    }

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public async loadData(start: number = 0, end: number = this.stats.size): Promise<ArrayBuffer> {
        // wait for `fs` to be loaded
        await kFsPromise;

        const normalizedEnd = Math.min(end, this.stats.size);
        const length = normalizedEnd - start;
        const result = new Uint8Array(length);
        let loaded = 0;

        while (loaded < length) {
            loaded += await this.loadDataIntoBuffer(result, loaded, start + loaded, normalizedEnd);
        }

        return result.buffer;
    }

    /**
     * Loads data into a buffer with the specified parameters.
     * @param buffer - The buffer in which the data will be loaded. It must be large enough to fit the data requested
     * @param offset - The byte offset within the buffer at which the data will be written
     * @param start - The byte offset within the file where data will be read
     * @param end - The byte offset within the file at which the data will stop being read
     */
    private loadDataIntoBuffer(buffer: Uint8Array, offset: number, start: number, end: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const length = end - start;
            gFS.read(this.handle, buffer, offset, length, start, (err, bytesRead) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bytesRead);
                }
            });
        });
    }
}
