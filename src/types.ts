/**
 * The minimal interface needed for an object to be considered a data source
 */
export interface DataSource {
    /**
     * The total length, in bytes, of the data source.
     */
    byteLength: Promise<number>;

    /**
     * Slices the data source and returns a new data source pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    slice(start: number, end: number): DataSource;

    /**
     * Loads the data source into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the
     * data.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    loadData(start?: number, end?: number): Promise<ArrayBuffer>;
}
