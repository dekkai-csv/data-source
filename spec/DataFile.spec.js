import {DataFile, LocalDataFile, DataChunk} from '../build/dist/mod.js';

function run(env) {
    const {
        chai,
        getTestFilePackage,
    } = env;

    const filePackage = getTestFilePackage();

    describe('DataFile', function () {
        describe('LocalDataFile', function() {

            const local = filePackage.local;
            for (let i = 0, n = local.length; i < n; ++i) {
                describe(`From ${local[i].type}`, function() {
                    let dataFile;
                    it('can load a local file', async function() {
                        const source = await local[i].source;
                        dataFile = await DataFile.fromLocalSource(source);
                        chai.expect(dataFile instanceof LocalDataFile).to.equal(true);
                    });

                    it('reports the correct size', async function() {
                        chai.expect(dataFile.byteLength).to.equal((await filePackage.info).size);
                    });

                    it('can slice a DataChunk of the file', async function () {
                        const chunk = dataFile.slice(0, Math.floor((await filePackage.info).size / 2));
                        chai.expect(chunk instanceof DataChunk).to.equal(true);
                    });

                    it('loads the whole file on demand', async function() {
                        const buffer = await dataFile.loadData();
                        const uint8 = new Uint8Array(buffer);
                        chai.expect(uint8).to.eql(await filePackage.buffer);
                    });

                    it('loads an arbitrary area of the file on demand', async function() {
                        const start = Math.floor(await filePackage.info.size / 3);
                        const end = start * 2;
                        const buffer = await dataFile.loadData(start, end);
                        const uint8 = new Uint8Array(buffer);
                        const subarray = (await filePackage.buffer).subarray(start, end);
                        chai.expect(uint8).to.eql(subarray);
                    });

                    it('invalidates the file when `close` is called', async function() {
                        let failed = false;
                        dataFile.close();
                        try {
                            await dataFile.loadData();
                        } catch (e) {
                            failed = true;
                        }
                        chai.expect(failed).to.equal(true);
                    });
                });
            }
        });
    });
}

export default run;
