function Pebble() {
	var self = this;
	var listeners = {}

	console.log("Pebble interface is starting");

	checkArrayBufferSupport = function() {
		try {
			var array = new ArrayBuffer(4);
			var view = new DataView(array);
			
			return array && view;
		} catch (e) {
			return false;
		}
	};
	if(!checkArrayBufferSupport()) {
		alert("ArrayBuffer is not supported, you'll need to do something about this");
	}

	self.addEventListener = function(eventName, cb) {
		if (!listeners[eventName]) {
			listeners[eventName] = [];
		}

		console.log(eventName + " registered");

		listeners[eventName].push(cb);
	}

	self.emit = function(eventName, obj) {
		if (listeners[eventName]) {
			for (var i = listeners[eventName].length - 1; i >= 0; i--) {
				listeners[eventName][i](obj);
			}
		}
	}
}

window.Pebble = new Pebble();