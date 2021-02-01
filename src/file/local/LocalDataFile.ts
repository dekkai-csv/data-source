import {DataChunk} from '../../chunk/DataChunk';
import {DataSource} from '../../types';

export abstract class LocalDataFile implements DataSource {
    /**
     * The total length, in bytes, of the file this instance represents.
     */
    public abstract get byteLength(): Promise<number>;

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public abstract async loadData(start?: number, end?: number): Promise<ArrayBuffer>;

    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    public abstract close(): void;

    /**
     * Slices the file and returns a data chunk pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    public slice(start: number, end: number): DataSource {
        return new DataChunk(this, start, end);
    }
}
