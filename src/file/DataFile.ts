import {isNodeJS} from '@dekkai/env/build/lib/node';
import {isDeno} from '@dekkai/env/build/lib/deno';
import {LocalDataFileNode} from './local/LocalDataFileNode';
import {LocalDataFileDeno} from './local/LocalDataFileDeno';
import {LocalDataFileBrowser} from './local/LocalDataFileBrowser';
import {DataSource} from '../types';
import {
    LocalFileSource,
    LocalFileSourceBrowser,
    LocalFileSourceDeno,
    LocalFileSourceNode,
    RemoteFileSource,
} from './types';

/**
 * Base class for data files on all platforms.
 */
export abstract class DataFile {
    /**
     * Utility function to wrap a local file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    public static async fromLocalSource(source: LocalFileSource): Promise<DataSource> {
        if (isNodeJS()) {
            return LocalDataFileNode.fromSource(source as LocalFileSourceNode);
        } else if (isDeno()) {
            return LocalDataFileDeno.fromSource(source as LocalFileSourceDeno);
        }
        return LocalDataFileBrowser.fromSource(source as LocalFileSourceBrowser);
    }

    /**
     * Utility function to wrap a remote file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    public static async fromRemoteSource(source: RemoteFileSource): Promise<DataSource> {
        throw 'Not implemented yet!';
    }
}
