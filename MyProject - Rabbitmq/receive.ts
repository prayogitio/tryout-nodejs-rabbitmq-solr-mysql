import {solrClient} from "./solrclient";

var amqp = require('amqplib/callback_api');

const opt = {
    credentials : require('amqplib').credentials.plain('guest', 'guest')
};
amqp.connect('amqp://localhost', opt, function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'hello';
        channel.assertQueue(queue, {
            durable: false
        });
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function(msg) {
            console.log(" [x] Received %s", msg);
            let data = JSON.parse(msg.content);
            let userId = data.userId;
            let action = data.action;
            if (action == "add") {
                console.log(" Indexing %s to solr", userId);
                addUserToSolr(parseInt(userId));
            } else {
                console.log(" Removing %s from solr", userId);
                removeUserFromSolr(parseInt(userId));
            }     
        }, {
            noAck: true
        });
    });
});
function addUserToSolr(userId:number) {
    console.log(" Getting userId %d from mysql", userId);
    var mysql = require("mysql");
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "users"
    });
    con.connect(function(err) {
        if (err) throw err;
        con.query("SELECT * FROM user where id=" + userId, function (err, result, fields) {
            if (err) throw err;
            var data = {
                "userid": result[0].id,
                "firstname": result[0].firstName,
                "lastname": result[0].lastName,
                "age": result[0].age
            };
            solrClient.update(data, function(err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('Response:', result.responseHeader);
            });
        });
    });
}
function removeUserFromSolr(userId:number) {
    var data = {"userid": userId};
    solrClient.delete(data, function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Response:', result.responseHeader);
    });
}