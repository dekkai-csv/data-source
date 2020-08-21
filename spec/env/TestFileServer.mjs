import http from 'http';
import path from 'path';
import fs from 'fs';

let server;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function send404(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('404 Not Found\n');
    res.end();
}

function sendCSV(file, res) {
    const filePath = path.resolve(path.dirname(''), `./node_modules/csv-spectrum/csvs/${file}`);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            send404(res);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/csv',
                'Content-Length': data.length,
            });
            res.write(data);
            res.end();
        }
    });
}

async function sendSynthetic(res, size = true, slow = false) {
    try {
        const encoder = new TextEncoder();
        const header = encoder.encode('a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z\n');
        let chunk = '';
        for (let i = 1; i <= 26 * 1000; ++i) {
            chunk += `${i}`;
            if (i % 26) {
                chunk += ',';
            } else {
                chunk += '\n';
            }
        }
        const chunkBuffer = encoder.encode(chunk);
        const body = new Uint8Array(header.byteLength + chunkBuffer.byteLength * 100);
        let index = 0;
        body.set(header, index);
        index += header.byteLength;

        for (let i = 0; i < 100; ++i) {
            body.set(chunkBuffer, index);
            index += chunkBuffer.byteLength;
        }

        // deal with size argument
        const head = {
            'Content-Type': 'text/csv',
        };
        if (size) {
            head['Content-Length'] = body.byteLength;
        }
        res.writeHead(200, head);

        // deal with slow argument
        if (slow) {
            const chunkSize = 1024 * 128; // 128 KB
            let sent = 0;
            while (sent < body.byteLength) {
                res.write(Buffer.from(body.subarray(sent, Math.min(sent + chunkSize, body.byteLength))));
                sent += chunkSize;
                await wait(60);
            }
        } else {
            res.write(Buffer.from(body));
        }
        res.end();
    } catch (e) {
        console.log(e);
        send404(res);
    }
}

function requestHandler(req, res) {
    const components = req.url.split('/');
    if (components.length > 1) {
        if (components[1] === 'csv') {
            sendCSV(components[2], res);
        } else if (components[1] === 'synthetic') {
            let size = true;
            let slow = false;

            for (let i = 2; i < components.length; ++i) {
                if (components[i] === 'no_size') {
                    size = false;
                } else if (components[i] === 'send_size') {
                    size = true;
                } else if (components[i] === 'slow_transfer') {
                    slow = true;
                } else if (components[i] === 'fast_transfer') {
                    slow = false;
                }
            }

            sendSynthetic(res, size, slow);
        } else if(components[1] === 'kill') {
            send404(res);
            server.close();
        } else {
            send404(res);
        }
    } else {
        send404(res);
    }
}

function start() {
    server = http.createServer(requestHandler);
    server.listen(8967, err => {
        if (err) {
            console.log(`ERROR: ${err}`);
        }
    });
}

function kill() {
    http.get('localhost:8967/kill', () => {});
}

start();

