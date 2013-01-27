var keysharky = {

	// Init keysharky object
	init: function(){

		keysharky.groovesharkTabID = null;
		keysharky.debug = true;

		if (!localStorage["ws"])
			localStorage["ws"] = "ws://";
		
		localStorage["ws-open"] = false;

		if (localStorage["ws-startup"])
			keysharky.socketConnect();

		keysharky.defaults = {
			"play"      : '{"modifiers":["control","alt","shift"],"keycode":90,"enabled":true}',
			"stop"      : '{"modifiers":["control","alt","shift"],"keycode":88,"enabled":true}',
			"prev"      : '{"modifiers":["control","alt","shift"],"keycode":65,"enabled":true}',
			"next"      : '{"modifiers":["control","alt","shift"],"keycode":68,"enabled":true}',
			"favorite"  : '{"modifiers":["control","alt"],"keycode":83,"enabled":true}',
			"voteup"    : '{"modifiers":["control","alt"],"keycode":65,"enabled":true}',
			"votedown"  : '{"modifiers":["control","alt"],"keycode":90,"enabled":true}',
			"voteclear" : '{"modifiers":["control","alt"],"keycode":81,"enabled":true}',
			"mute"      : '{"modifiers":["control","shift"],"keycode":77,"enabled":true}',
			"volup"     : '{"modifiers":["control","shift"],"keycode":190,"enabled":true}',
			"voldown"   : '{"modifiers":["control","shift"],"keycode":188,"enabled":true}'
		};

		// Wait for keyup in another tab and then toggle gsliteswf object in Grooveshark flash player page.
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
			if (request.method == "keyup"){

				// Check localStorage for missing link
				for(var toggle in keysharky.defaults){
					if (!localStorage[toggle]){
						localStorage[toggle] = keysharky.defaults[toggle];
						keysharky.log("localStorage fix: " + toggle + " reset");
					}
				}

				var t = null;
				var dismatch = null;
				var action = null;

				// Is this combo valid?
				try{

					for(var toggle in localStorage){
						dismatch = false;
						t = JSON.parse(localStorage[toggle]);
						
						if (typeof(t["enabled"]) == "undefined"){
							t["enabled"] = true;
							localStorage[toggle] = JSON.stringify(t);
						}

						if (!t["enabled"])
							continue;

						if (t["modifiers"].length != request["modifiers"].length)
							continue;

						for(var i in t["modifiers"]){
							if (t["modifiers"][i] != request["modifiers"][i]){
								dismatch = true;
								break;
							}
						}

						if (dismatch)
							continue;

						if (t["keycode"] != request["keycode"])
							continue;

						action = toggle;
					}

				}catch(e){}

				// Yup, it is, so continue toggling
				if (action){

					keysharky.log("Toggling '" + action + "' ...");

					if (keysharky.groovesharkTabID != null){
						keysharky.toggle(action);
					}else{
						keysharky.searchGrooveshark(action);
					}

				}

			}else if (request.method == "socketConnect"){
				keysharky.socketConnect();
			}else if (request.method == "socketDisconnect"){
				keysharky.socketDisconnect();
			}

			sendResponse({});
		});

		// When tab is removed, check if it wasn't Grooveshark tab
		chrome.tabs.onRemoved.addListener(function(tabID){
			if (tabID == keysharky.groovesharkTabID){
				keysharky.log("Grooveshark tab removed!");
				keysharky.groovesharkTabID = null;
			}
		});

	},

	searchGrooveshark: function(action){
		keysharky.log("Searching for Grooveshark ...");

		chrome.windows.getCurrent(function(currentWindow){
			chrome.tabs.getAllInWindow(currentWindow.id, function(tabs){
				for (var i=0; i<tabs.length; i++){

					if (tabs[i].url.search(/^http\:\/\/((listen|preview|staging|retro)\.|)grooveshark\.com/) != -1){
						keysharky.groovesharkTabID = tabs[i].id;
						keysharky.log("The groove is found!");

						keysharky.toggle(action);
						break;
					}
				}

				if (keysharky.groovesharkTabID == null){
					keysharky.log("Where is groove?!");
				}
			});
		});
	},

	socketConnect: function(){
		
		keysharky.socketCloseForced = true;
		
		// Before opening new socket, close connected socket
		try{ keysharky.socket.close(); }catch(e){ keysharky.socketCloseForced = false; };
		
		try{
			keysharky.socket = new WebSocket(localStorage["ws"]);
		}catch(e){
			// Fail with dignity
			localStorage["ws-open"] = false;
			chrome.extension.sendRequest({"method": "toggleButton"}, function(response){});
		}
		
		keysharky.socket.onopen = function(){
			keysharky.socketCloseForced = false;
			localStorage["ws-open"] = true;
			
			chrome.extension.sendRequest({"method": "toggleButton"}, function(response){});
			keysharky.log("Socket opened (" + localStorage["ws"] + ")");
		}
		
		keysharky.socket.onmessage = function(msg){
			if (keysharky.defaults[msg.data]){
				if (keysharky.groovesharkTabID == null){
				
					keysharky.log("Searching for Grooveshark ...");
					keysharky.searchGrooveshark(msg.data);
					
				}else{
					
					keysharky.toggle(msg.data);
					
				}
			}
		}
		
		keysharky.socket.onclose = function(e){
			if (!keysharky.socketCloseForced){
				keysharky.socketConnect();
			}else{
				localStorage["ws-open"] = false;
				keysharky.log("Socket closed");
			}
			
			chrome.extension.sendRequest({"method": "toggleButton"}, function(response){})
		}
		
	},
	
	socketDisconnect: function(){
		keysharky.log("Closing socket ...");
		
		keysharky.socketCloseForced = true;
		try{ keysharky.socket.close(); }catch(e){ };
	},

	// Debugging is half of victory!
	log: function(msg){
		if (keysharky.debug && msg){
			console.log("keysharky ---> " + msg);
		}
	},

	// Send toggle to Grooveshark tab
	toggle: function(request){
		if (request){
			chrome.tabs.sendRequest(keysharky.groovesharkTabID, {method : "Grooveshark", action: request}, function(response){
				if (response.result == 200){
					keysharky.log("Toggled '" + request + "' !");
				}else{
					keysharky.groovesharkTabID = null;
					keysharky.log("Couldn't toggle '" + request +"' !");
				}
			});
		}
	}

}

keysharky.init();