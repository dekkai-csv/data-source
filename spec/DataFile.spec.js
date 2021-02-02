import {DataFile, LocalDataFile, DataChunk, RemoteDataFile} from '../build/dist/mod.js';

function run(env) {
    const {
        test,
        chai,
        getTestFilePackage,
    } = env;

    const filePackage = getTestFilePackage();

    function basicFileTests(target) {
        const space = filePackage[target];
        for (let i = 0, n = space.length; i < n; ++i) {
            test.describe(`From ${space[i].type}`, function() {
                let dataFile;
                test.it('can be instantiated', async function() {
                    const source = await space[i].source;
                    if (target === 'local') {
                        dataFile = await DataFile.fromLocalSource(source);
                        chai.expect(dataFile instanceof LocalDataFile).to.equal(true);
                    } else {
                        dataFile = await DataFile.fromRemoteSource(source);
                        chai.expect(dataFile instanceof RemoteDataFile).to.equal(true);
                    }
                });

                test.it('reports the correct size', async function() {
                    chai.expect(await dataFile.byteLength).to.equal((await filePackage.info).size);
                });

                test.it('can slice a DataChunk of the file', async function () {
                    const chunk = dataFile.slice(0, Math.floor((await filePackage.info).size / 2));
                    chai.expect(chunk instanceof DataChunk).to.equal(true);
                });

                test.it('loads the whole file on demand', async function() {
                    const buffer = await dataFile.loadData();
                    const uint8 = new Uint8Array(buffer);
                    chai.expect(uint8).to.eql(await filePackage.buffer);
                });

                test.it('loads an arbitrary area of the file on demand', async function() {
                    const start = Math.floor((await filePackage.info).size / 3);
                    const end = start * 2;
                    const buffer = await dataFile.loadData(start, end);
                    const uint8 = new Uint8Array(buffer);
                    const subarray = (await filePackage.buffer).subarray(start, end);
                    chai.expect(uint8).to.eql(subarray);
                });

                test.it('loads up to the max file size', async function () {
                    const sizeOf1GB = 1024 * 1024 * 1024;
                    const data = await dataFile.loadData(0, sizeOf1GB);
                    chai.expect(data.byteLength).to.be.lessThan(sizeOf1GB);
                    chai.expect(data.byteLength).to.eql(await dataFile.byteLength);
                });

                if (target === 'local') {
                    test.it('invalidates the file when `close` is called', async function () {
                        let failed = false;
                        dataFile.close();
                        try {
                            await dataFile.loadData();
                        } catch (e) {
                            failed = true;
                        }
                        chai.expect(failed).to.equal(true);
                    });
                }
            });
        }
    }

    test.describe('DataFile', function () {
        test.describe('LocalDataFile', function() {
            basicFileTests('local');
        });

        test.describe('RemoteDataFile', function() {
            basicFileTests('remote');

            const baseURL = `${filePackage.remoteBaseURL}/synthetic`;
            test.describe('Synthetic tests', function () {
                test.it('handles files with no size header', function() {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}/no_size/fast_transfer`);
                            const size = await file.byteLength;
                            chai.expect(size).to.eql(-1);
                            file.on(RemoteDataFile.LOADING_COMPLETE, async () => {
                                const finalSize = await file.byteLength;
                                try {
                                    chai.expect(finalSize).to.not.eql(-1);
                                } catch (e) {
                                    reject(e);
                                }
                                resolve();
                            });
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                test.it('emits loading events', function() {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        let started = false;
                        let progress = false;

                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}`);
                            file.on(RemoteDataFile.LOADING_START, () => {
                                started = true;
                            });
                            file.on(RemoteDataFile.LOADING_PROGRESS, () => {
                                progress = true;
                            });
                            file.on(RemoteDataFile.LOADING_COMPLETE, async () => {
                                try {
                                    chai.expect(started).to.eql(true);
                                    chai.expect(progress).to.eql(true);
                                    chai.expect(await file.byteLength).to.eql(file.bytesLoaded);
                                } catch (e) {
                                    reject(e);
                                }
                                resolve();
                            });
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                test.it('exposes a loading complete promise', function() {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}`);
                            chai.expect(file.isLoadingComplete).to.eql(false);

                            const loadedBytes = await file.onLoadingComplete;
                            chai.expect(loadedBytes).to.eql(file.bytesLoaded);
                            chai.expect(file.isLoadingComplete).to.eql(true);
                        } catch (e) {
                            reject(e);
                        }

                        resolve();
                    });
                });

                test.it('slices the file as it is being loaded', function() {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}`);
                            const sizeOf1MB = 1024 * 1024;
                            const data = await file.loadData(sizeOf1MB, sizeOf1MB * 2);
                            chai.expect(data.byteLength).to.eql(sizeOf1MB);
                        } catch (e) {
                            reject(e);
                        }

                        resolve();
                    });
                });

                test.it('loads up to the max file size while loading', function () {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}`);
                            const sizeOf1GB = 1024 * 1024 * 1024;
                            const data = await file.loadData(0, sizeOf1GB);
                            chai.expect(data.byteLength).to.be.lessThan(sizeOf1GB);
                            chai.expect(data.byteLength).to.eql(await file.byteLength);
                        } catch (e) {
                            reject(e);
                        }

                        resolve();
                    });
                });

                test.it('loads up to the max file size while loading and size unknown', function () {
                    // this.timeout(10000);
                    return new Promise(async (resolve, reject) => {
                        try {
                            const file = await DataFile.fromRemoteSource(`${baseURL}/no_size/fast_transfer`);
                            const sizeOf1GB = 1024 * 1024 * 1024;
                            const data = await file.loadData(0, sizeOf1GB);
                            chai.expect(data.byteLength).to.be.lessThan(sizeOf1GB);
                            chai.expect(data.byteLength).to.eql(await file.byteLength);
                        } catch (e) {
                            reject(e);
                        }

                        resolve();
                    });
                });
            });
        });
    });
}

export default run;
