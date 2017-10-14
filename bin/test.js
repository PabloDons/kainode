var i = 30;
process.stdin.on("data", (data) => {console.log(data.toString())});
for (let k = 0; k < i; k++) {
    setTimeout(() => {console.log(k)}, 1000*k);
}
setTimeout(process.exit, 1000*i);