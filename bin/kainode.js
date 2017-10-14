#!/usr/bin/env node
const fs = require('fs');
switch (process.argv[2]) {
    case '-v':
    case '--version':
        process.stdout.write("Kainode version " + require('../package.json').version + '\n', undefined, process.exit);
        break;
    case undefined:
        process.stdout.write(fs.readFileSync("./bin/docs"), undefined, process.exit);
        break;
    default:
        main();
}

function main() {
    const lib = require('../lib/index.js');
    var kainode = lib.run(null, process.argv[2], process.argv.slice(3));
    var app;

    kainode.once("load", newnode);

    kainode.on("newnode", cp=>{
        app.stdout.unpipe(process.stdout);
        process.stdin.unpipe(app.stdin);

        newnode(cp);
    });

    function newnode(cp) {
        console.log("starting new node");
        app = cp;
        app.stdout.pipe(process.stdout);
        process.stdin.pipe(app.stdin);
    }
}