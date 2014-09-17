var amqp = require('amqp');
var connection = amqp.createConnection({ host: "localhost", port: 5672, login: 'guest', password: 'guest', vhost: '/' });
var io = require('socket.io').listen(1337);
var pubsub = require('pubsub-js');
var count = 1;

connection.on('ready', function () {
    connection.exchange("notification", options={type:'fanout'}, function(exchange) {
        //console.log('connected');
        var sendMessage = function(exchange, payload) {
            console.log('about to publish')
            var encoded_payload = JSON.stringify(payload);
            exchange.publish('', encoded_payload, {})
        }

        var broadcastMessage = function(msg,socket){

        }

        // Receive messages
        connection.queue("msgs", function(queue){
            console.log('Created queue')
            queue.bind('#');
            queue.subscribe(function (message) {
                console.log('subscribed to queue');
                console.log(message.data.toString());
                var encoded_payload = unescape(message.data)
                var payload = JSON.parse(encoded_payload)
                console.log('Received a message:');
      	        console.log(payload);
                pubsub.publish('broadcast_message', payload);
            })
        })

        io.sockets.on('connection', function(socket){
            pubsub.subscribe('broadcast_message', function(pubsub_name, msg){
                console.log('trying to broadcast');
                var message = msg;
                socket.emit(message.type, message.data);
            })
        })
    })
})
