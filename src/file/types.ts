/**
 * Represents any valid local file source type in node.
 */
export type LocalFileSourceNode = string | URL | number;

/**
 * Represents any valid remote file source type in node.
 */
export type RemoteFileSourceNode = string | URL;

/**
 * Represents any valid local file source type in the browser.
 */
export type LocalFileSourceBrowser = Blob | File;

/**
 * Represents any valid remote file source type in the browser.
 */
export type RemoteFileSourceBrowser = string | URL;

/**
 * Represents any valid local file source type in deno.
 */
export type LocalFileSourceDeno = string | URL;

/**
 * Represents any valid remote file source type in deno.
 */
export type RemoteFileSourceDeno = string | URL;

/**
 * Represents any valid local file source type across platforms.
 */
export type LocalFileSource = LocalFileSourceNode | LocalFileSourceBrowser | LocalFileSourceDeno;

/**
 * Represents any valid remote file source type across platforms.
 */
export type RemoteFileSource = RemoteFileSourceNode | RemoteFileSourceBrowser | RemoteFileSourceDeno;

/**
 * Represents any valid file source type across platforms.
 */
export type FileSource = LocalFileSource | RemoteFileSource;
