app.service("pebbleService", function() {

	var self = this;

	

	self.init = function(pebbleInterface) {
		if(pebbleInterface) {
			console.log("real pebble");
		} else {
			console.log("fake pebble");
		}
	}

	self.ready = function() {
		window.Pebble.emit('ready');
	}

	/*
	console.log("hey Pebble is here");
      window.plugins.Pebble.setAppUUID('CED43CB3-3CC4-4C43-9988-D53DDF669D73',
        function(event) {
          console.log("Pebble is connected");
        },
        function(event) {
          console.log('Pebble disconnected');
        }
      );

      window.plugins.Pebble.getVersionInfo(
        function(info){
          console.log(info);
        },
        function(err){
          console.log("Error while getting pebble info");
          console.log(err);
        }
      );

      window.plugins.Pebble.launchApp(
        function(result){
            console.log("launching pebble app");
            console.log(result);
        },
        function(err){
            console.log("could not launch app");
            console.log(err);
        }
      );
*/

});