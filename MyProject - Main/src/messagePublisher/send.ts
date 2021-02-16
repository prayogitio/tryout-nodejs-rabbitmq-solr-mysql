#!/usr/bin/env node
const opt = { credentials: require('amqplib').credentials.plain('guest', 'guest') };
export const publishToRabbitmq = function(message) {
    console.log("creating rabbitmq client..");
    var amqp = require('amqplib/callback_api');
    amqp.connect('amqp://localhost:5672', opt, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            var queue = 'hello';
            var msg = message;
            channel.assertQueue(queue, {
                durable: false
            });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
            console.log(" [x] Sent %s", msg);
        })
    });
};
