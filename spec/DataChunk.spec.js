import {DataChunk, DataFile} from '../build/dist/mod.js';


function run(env) {
    const {
        test,
        chai,
        getTestFilePackage,
    } = env;

    test.describe('DataChunk', function() {
        const filePackage = getTestFilePackage();

        function basicChunkTests(target) {
            let dataFile;
            let chunk;
            let start;
            let end;

            test.before(async function () {
                const pack = target === 'remote' ? 'remote' : 'local';
                const source = await filePackage[pack][0].source;
                if (target === 'local' || target === 'chunk') {
                    dataFile = await DataFile.fromLocalSource(source);
                    if (target === 'chunk') {
                        const length = await dataFile.byteLength;
                        dataFile = await dataFile.slice(Math.floor(length * 0.15), length);
                    }
                } else {
                    dataFile = await DataFile.fromRemoteSource(source);
                }
                end = await dataFile.byteLength;
                start = Math.floor(end * 0.5);
            });

            test.it('can be instantiated', function () {
                chunk = new DataChunk(dataFile, start, end);
                chai.expect(chunk instanceof DataChunk).to.eql(true);
            });

            test.it('reports the expected byte length', async function() {
                chai.expect(await chunk.byteLength).to.eql(end - start);
            });

            test.it('has a null buffer before loading', function() {
                chai.expect(chunk.buffer).to.eql(null);
            });

            test.it('reports its loaded state properly', async function() {
                chai.expect(chunk.loaded).to.eql(false);
                await chunk.load();
                chai.expect(chunk.loaded).to.eql(true);
            });

            test.it('has a buffer of the expected length after loading', function() {
                chai.expect(chunk.buffer.byteLength).to.eql(end - start);
            });

            test.it('loads the max file size when out of bounds end', async function() {
                const newChunk = new DataChunk(dataFile, start, end * 3);
                await newChunk.load();
                chai.expect(await chunk.byteLength).to.eql(end - start);
            });
        }

        test.describe('LocalDataFile Source', function() {
            basicChunkTests('local');
        });

        test.describe('RemoteDataFile source', function() {
            basicChunkTests('remote');
        });

        test.describe('DataChunk source', function() {
            basicChunkTests('chunk');
        });
    });
}

export default run;
