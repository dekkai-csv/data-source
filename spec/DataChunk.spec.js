import {DataChunk, DataFile} from '../build/dist/mod.js';


function run(env) {
    const {
        chai,
        getTestFilePackage,
    } = env;

    describe('DataChunk', function() {
        const filePackage = getTestFilePackage();

        describe('LocalDataFile Source', function() {
            let dataFile;
            let chunk;
            let start;
            let end;

            before(async function () {
                const source = await filePackage.local[0].source;
                dataFile = await DataFile.fromLocalSource(source);
                start = Math.floor(dataFile.byteLength * 0.5);
                end = dataFile.byteLength;
            });

            it('can be instantiated', function () {
                chunk = new DataChunk(dataFile, start, end);
                chai.expect(chunk instanceof DataChunk).to.equal(true);
            });

            it('reports the expected byte length', function() {
                chai.expect(chunk.byteLength).to.equal(end - start);
            });

            it('has a null buffer before loading', function() {
                chai.expect(chunk.buffer).to.equal(null);
            });

            it('reports its loaded state properly', async function() {
                chai.expect(chunk.loaded).to.equal(false);
                await chunk.load();
                chai.expect(chunk.loaded).to.equal(true);
            });

            it('has a buffer of the expected length after loading', function() {

            });
        });

        describe('RemoteDataFile source', function() {
            it('PENDING');
        });

        describe('DataChunk source', function() {
            it('PENDING');
        });
    });
}

export default run;
