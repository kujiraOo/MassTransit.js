var serializer = require('./serializer'),
		subscribers = {},
		transport,
		isReady = false,
		readyCallback;

var callbackIfReady = function() {
	if(isReady && readyCallback) {
		readyCallback();
	}
};

var deliver = function(env) {
	var message = JSON.parse(env.data),
			callbacks = subscribers[message.MessageType];
	if(callbacks) {
		callbacks.forEach(function(cb) {
			cb(serializer.deserialize(message.Message));
		});
	}
};
	
var initializeTransport = function(config) {
	transport = require('./transports/' + config.transport);
	transport.open(config);

	transport.addListener('open', function() {
		isReady = true;
		callbackIfReady();
	});

	transport.addListener('messageReceived', deliver);
};

var publish = function(msg) {
	var envelope = {
				MessageType: msg.MessageType,
				Message: serializer.serialize(msg)
			};
	transport.publish(envelope);
};
	
var ready = function(config, callback) {
	initializeTransport(config);
	readyCallback = callback;
	callbackIfReady();
};

var subscribe = function (messageName, callback) {
	subscribers[messageName] = subscribers[messageName] || [];
	subscribers[messageName].push(callback);
	transport.bind(messageName);
};


module.exports.deliver = deliver;
module.exports.publish = publish;
module.exports.ready = ready;
module.exports.subscribe = subscribe;