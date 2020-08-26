import {LocalDataFile} from './LocalDataFile';
import {LocalFileSourceBrowser} from '../types';

/**
 * Represents a data file on the browser platform.
 */
export class LocalDataFileBrowser extends LocalDataFile {
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    public static async fromSource(source: LocalFileSourceBrowser): Promise<LocalDataFileBrowser> {
        return new LocalDataFileBrowser(source);
    }

    /**
     * Internal representation of the file
     */
    private blob: Blob | File;

    /**
     * @param blob - Container of the file
     */
    constructor(blob: Blob | File) {
        super();
        this.blob = blob;
    }

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength(): number {
        return this.blob.size;
    }

    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    public close(): void {
        this.blob = null;
    }

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public async loadData(start: number = 0, end: number = this.byteLength): Promise<ArrayBuffer> {
        const slice = this.blob.slice(start, end);
        return await this.loadBlob(slice);
    }

    /**
     * Loads the specified blob into an array buffer.
     * @param blob - The blob to load
     */
    private loadBlob(blob): Promise<ArrayBuffer> {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(blob);
        });
    }
}
