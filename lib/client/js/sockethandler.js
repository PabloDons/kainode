var conn = new WebSocket("ws://" + window.location.host, 'kai-protocol');

var cmd = {};

conn.onmessage = function(event) {
    var ios = event.data.indexOf(" ");
    var command = event.data.substring(0, ios);
    var data = JSON.parse(event.data.substring(ios + 1));
    cmd[command](data);
}

function sockSend(command, data) {
    conn.send(command + " " + JSON.stringify(data));
}