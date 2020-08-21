import {DataSource} from '../types';

/**
 * [[DataSource]] that represents a section (chunk) of a larger data source (parent). Useful when chunking a data source to
 * parallelize processing.
 */
export class DataChunk implements DataSource {
    /**
     * The parent data source this chunk belongs to.
     */
    private source: DataSource;

    /**
     * The start of the data, in bytes, this chunk represents within its parent data source.
     */
    private start: number;

    /**
     * The end of the data, in bytes, this chunk represents within its parent data source.
     */
    private end: number;

    /**
     * Variable to store the loaded data for this chunk.
     */
    private _buffer: ArrayBuffer = null;

    /**
     * When this chunk is loaded, returns the buffer containing the data for this chunk, `null` otherwise.
     */
    public get buffer(): ArrayBuffer {
        return this._buffer;
    }

    /**
     * The total byte length this chunk represents.
     *
     * NOTE: This value can change after a chunk is loaded for the first time if the chunk belongs to a remote data
     * source for which the total size is unknown.
     */
    public get byteLength(): number {
        return this.end - this.start;
    }

    /**
     * Is this chunk loaded in memory.
     */
    public get loaded(): boolean {
        return Boolean(this._buffer);
    }

    /**
     * @param source - The parent data source for this chunk
     * @param start - The start of this chunk, in bytes, within the parent data source
     * @param end - The end of this chunk, in bytes, within the parent data source
     */
    constructor(source: DataSource, start: number, end: number) {
        this.source = source;
        this.start = start;
        this.end = end;
    }

    /**
     * Loads this chunk into memory.
     *
     * NOTE: If this chunk belongs to a remote [[DataSource]], this function waits until the data for this chunk has been
     * transferred from the remote and into memory. Also, if the final size for the remote [[DataSource]] is unknown,
     * the [[byteLength]] of this chunk could change after it finishes loading.
     */
    public async load(): Promise<void> {
        if (!this._buffer) {
            this._buffer = await this.loadData();
            // if we don't know the total size of remote files, the actual size of the chunk could change
            if (this._buffer === null) { // the chunk could not be loaded
                this.start = 0;
                this.end = 0;
            } else if (this.byteLength > this._buffer.byteLength) { // the actual data is smaller than the requested size
                this.end -= this.byteLength - this._buffer.byteLength;
            }
        }
    }

    /**
     * Unloads this chunk from memory.
     */
    public unload(): void {
        this._buffer = null;
    }

    /**
     * Slices this chunk and returns a new data chunk pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    public slice(start: number, end: number): DataSource {
        return new DataChunk(this, start, end);
    }

    /**
     * Loads the data source into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the
     * data.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    loadData(start: number = 0, end: number = this.byteLength): Promise<ArrayBuffer> {
        return this.source.loadData(this.start + start, this.start + end);
    }
}
