import {LocalDataFile} from './LocalDataFile';
import {LocalFileSourceDeno} from '../types';

/**
 * Represents a data file on the deno platform.
 */
export class LocalDataFileDeno extends LocalDataFile {
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    public static async fromSource(source: LocalFileSourceDeno): Promise<LocalDataFileDeno> {
        if (!(source instanceof URL) && typeof source !== 'string') {
            throw `A LocalDataFileDeno cannot be created from a ${typeof source} instance`;
        }

        const stats = await Deno.stat(source);
        if (!stats.isFile) {
            throw `The path "${source} does not point to a file"`;
        }

        const file = await Deno.open(source, { read: true, write: false });

        return new LocalDataFileDeno(file, stats);
    }

    /**
     * Deno's internal file handle representation.
     */
    private file: Deno.File;
    /**
     * Information about this file.
     */
    private info: Deno.FileInfo;

    /**
     * @param file - A deno file instance
     * @param info - Info for the file instance
     */
    constructor(file: Deno.File, info: Deno.FileInfo) {
        super();
        this.file = file;
        this.info = info;
    }

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength(): Promise<number> {
        return Promise.resolve(this.info.size);
    }

    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    public close(): void {
        Deno.close(this.file.rid);
        this.file = null;
        this.info = null;
    }

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public async loadData(start: number = 0, end: number = this.info.size): Promise<ArrayBuffer> {
        const normalizedEnd = Math.min(end, this.info.size);
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
    private async loadDataIntoBuffer(buffer: Uint8Array, offset: number, start: number, end: number): Promise<number> {
        const cursorPosition = await this.file.seek(start, Deno.SeekMode.Start);
        if (cursorPosition !== start) {
            throw 'ERROR: Cannot seek to the desired position';
        }

        const result = new Uint8Array(end - start);
        const bytesRead = await this.file.read(result);
        buffer.set(result, offset);
        return bytesRead;
    }
}
