import {DataChunk} from '../../chunk/DataChunk';
import {DataSource} from '../../types';

export abstract class RemoteDataFile implements DataSource {
    /**
     * Fired when data loading progresses. Not fired when data loading finishes.
     * @event
     */
    static LOADING_PROGRESS: symbol = Symbol('DataFileEvents::LoadingProgress');

    /**
     * Fired when the data loading finishes.
     * @event
     */
    static LOADING_COMPLETE: symbol = Symbol('DataFileEvents::LoadingComplete');

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    public abstract get byteLength(): number;

    /**
     * Bytes loaded for this file, useful when parsing streaming files.
     */
    public abstract get bytesLoaded(): number;

    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    public abstract async loadData(start?: number, end?: number): Promise<ArrayBuffer>;

    /**
     * Slices the file and returns a data chunk pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    public slice(start: number, end: number): DataChunk {
        return new DataChunk(this, start, end);
    }
}
