import {DataChunk} from '../../chunk/DataChunk';
import {DataSource} from '../../types';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/mod';

export abstract class RemoteDataFile extends EventEmitter implements DataSource {
    /**
     * Fired when data loading progresses. Not fired when data loading finishes.
     * @event
     */
    public static LOADING_START: symbol = Symbol('DataFileEvents::LoadingStart');

    /**
     * Fired when data loading progresses. Not fired when data loading finishes.
     * @event
     */
    public static LOADING_PROGRESS: symbol = Symbol('DataFileEvents::LoadingProgress');

    /**
     * Fired when the data loading finishes.
     * @event
     */
    public static LOADING_COMPLETE: symbol = Symbol('DataFileEvents::LoadingComplete');

    /**
     * The total length, in bytes, of the file this instance represents.
     */
    public abstract get byteLength(): Promise<number>;

    /**
     * Bytes loaded for this file, useful when parsing streaming files.
     */
    public abstract get bytesLoaded(): number;

    /**
     * Promise that resolves when this file has finished downloading from the remote server.
     */
    public abstract get onLoadingComplete(): Promise<number>;

    /**
     * Has the file finished downloading from the remote server.
     */
    public abstract get isLoadingComplete(): boolean;

    /**
     * This function must ba called in order to start downloading the file, if this function fail the file cannot be
     * fetched from the server.
     */
    public abstract async startDownloading(): Promise<void>;

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
