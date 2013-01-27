keysharkyOptions = {
	init: function(){
		
		this.debug = true;
		this.unAllowedKeys = [16, 17, 18, 91];
		this.defaults = {
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

		this.ws = document.getElementById("ws");
		this.ws_startup = document.getElementById("ws-startup");
		this.socketButton = document.getElementById("socketButton");
		
		this.uiOptions();
		this.log("Options loaded");
		
	},
	
	// Debugging is half of victory!
	log: function(msg){
		if (this.debug && msg){
			console.log("keysharky ---> " + msg);
		}
	},
	
	// Check if Object is Array
	isArray: function(obj){
		return obj.constructor.toString().indexOf("Array") == -1 ? false : true;
	},
	
	// Check if Object is Array
	inArray: function(arr, value){
		var i;
		for (i=0; i < arr.length; i++) {
			if (arr[i] === value) {
				return true;
			}
		}
		return false;
	},
	
	// Check if JSON object is well build
	checkJSON: function(json){
		try{
			if (this.isArray(json["modifiers"]) && json["modifiers"].length && json["keycode"]){
				return true;
			}
		}catch(e){}
		
		return false;
	},
	
	// Update Options UI
	uiOptions: function(){
		var id_arr    = Array();
		var json_arr  = Array();
		var i         = 0;
		
		for(var toggle in this.defaults){
			id_arr[i]   = toggle;
			json_arr[i] = this.getPref(toggle);
			
			i++;
		}
		
		// this.something = json_arr;
		
		this.uiChangeCombos(id_arr, json_arr);

		this.ws.value = localStorage["ws"];
		this.ws.addEventListener("keyup", function(event){
			localStorage["ws"] = keysharkyOptions.ws.value;
		});
		
		if (localStorage["ws-open"] == "true")
			this.ws.setAttribute("disabled", "disabled");
		
		if (localStorage["ws-startup"] == "true")
			this.ws_startup.setAttribute("checked", "checked");
		
		this.socketButton.value = localStorage["ws-open"] == "true" ? "Disconnect" : "Connect";
		
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
			if (request.method == "toggleButton"){
			
				if (keysharkyOptions.socketButton.value == "Connecting ..."){
				
					if (localStorage["ws-open"] == "true"){
							keysharkyOptions.socketButton.removeAttribute("disabled");
							keysharkyOptions.socketButton.value = "Disconnect";
						}else{
							keysharkyOptions.socketButton.value = "Couldn't connect!";

							setTimeout(function(){
								keysharkyOptions.socketButton.value = "Connect";
								keysharkyOptions.socketButton.removeAttribute("disabled");
								
								keysharkyOptions.ws.removeAttribute("disabled");
							}, 1000);
					}
					
				}else{
				
					keysharkyOptions.ws.removeAttribute("disabled");
					keysharkyOptions.socketButton.removeAttribute("disabled");
					
					keysharkyOptions.socketButton.value = "Connect";
					
				}
				
			}
		});

		combos_input = document.getElementsByClassName("combos-input");
		
		for(var i=0; i<combos_input.length; i++){
			if (combos_input[i].getAttribute("readonly") == null) continue;
			combos_input[i].onkeydown = function(e){ keysharkyOptions.applyCombo(e, this.getAttribute("id")) };
		}

		check_input = document.getElementsByClassName("check");

		for(var i=0; i<check_input.length; i++){
			m = check_input[i].getAttribute("id").match(/^keysharky-enabler-(\w+)$/);
			if (m){
				check_input[i].setAttribute("toggle", m[1]);
				check_input[i].onclick = function(e){ keysharkyOptions.toggleEnabled(this, this.getAttribute("toggle")) };
			}
		}

		document.getElementById("ws-startup").onclick = function(e){ keysharkyOptions.toggleOnStartup(this) };
		document.getElementById("socketButton").onclick = function(e){ keysharkyOptions.toggleSocket(this) };
		
		this.log("Options UI updated");
	},
	
	// Apply just selected keyboard shortcut, so user can test it out
	applyCombo: function(event, id){
		if (this.defaults[id]){
			combo = this.recognizeKeys(event);
			
			// If bad combo, let user try new cambo
			if (!this.checkJSON(combo))
				return;
				
			combo["enabled"] = document.getElementById("keysharky-enabler-" + id).checked === true ? true : false;
			
			this.uiChangeCombos(id, combo);
			this.setPref(id, combo);
		}
	},
	
	// Parse keyup event, to get user pressed combo
	recognizeKeys: function(event) {
		var modifiers = new Array();
		var key = '';
		var keycode = '';
		
		// Get the modifiers
		if(event.metaKey) modifiers.push('meta');
		if(event.ctrlKey) modifiers.push('control');
		if(event.altKey) modifiers.push('alt');
		if(event.shiftKey) modifiers.push('shift');
		
		// Get keycode
		if(event.keyCode) {
			keycode = event.keyCode;
		}

		if(modifiers.length > 0 && !this.inArray(this.unAllowedKeys, keycode)) {
			
			return {
				"modifiers" : modifiers,
				"keycode"   : keycode,
			};
			
		}
		return null;
	},
	
	// Get user friendly key names
	fromKeyCode: function(keyCode){
		var key = String.fromCharCode(keyCode);
		
		if (keyCode == 8)   key = "backspace";
		if (keyCode == 9)   key = "tab";
		if (keyCode == 13)  key = "enter";
		if (keyCode == 16)  key = "shift";
		if (keyCode == 17)  key = "ctrl";
		if (keyCode == 18)  key = "alt";
		if (keyCode == 19)  key = "pause";
		if (keyCode == 20)  key = "caps lock";
		if (keyCode == 27)  key = "escape";
		if (keyCode == 33)  key = "page up";         
		if (keyCode == 34)  key = "page down";
		if (keyCode == 35)  key = "end";
		if (keyCode == 36)  key = "home";
		if (keyCode == 37)  key = "left";
		if (keyCode == 38)  key = "up";
		if (keyCode == 39)  key = "right";
		if (keyCode == 40)  key = "down";
		if (keyCode == 45)  key = "insert";
		if (keyCode == 46)  key = "delete";
		if (keyCode == 91)  key = "left window";
		if (keyCode == 92)  key = "right window";
		if (keyCode == 93)  key = "menu";
		if (keyCode == 96)  key = "0";
		if (keyCode == 97)  key = "1";
		if (keyCode == 98)  key = "2";
		if (keyCode == 99)  key = "3";
		if (keyCode == 100) key = "4";
		if (keyCode == 101) key = "5";
		if (keyCode == 102) key = "6";
		if (keyCode == 103) key = "7";
		if (keyCode == 104) key = "8";
		if (keyCode == 105) key = "9";
		if (keyCode == 106) key = "*";
		if (keyCode == 107) key = "+";
		if (keyCode == 109) key = "-";
		if (keyCode == 110) key = ".";
		if (keyCode == 111) key = "/";
		if (keyCode == 112) key = "F1";
		if (keyCode == 113) key = "F2";
		if (keyCode == 114) key = "F3";
		if (keyCode == 115) key = "F4";
		if (keyCode == 116) key = "F5";
		if (keyCode == 117) key = "F6";
		if (keyCode == 118) key = "F7";
		if (keyCode == 119) key = "F8";
		if (keyCode == 120) key = "F9";
		if (keyCode == 121) key = "F10";
		if (keyCode == 122) key = "F11";
		if (keyCode == 123) key = "F12";
		if (keyCode == 144) key = "num lock";
		if (keyCode == 145) key = "scroll lock";
		if (keyCode == 186) key = ";";
		if (keyCode == 187) key = "=";
		if (keyCode == 188) key = ",";
		if (keyCode == 189) key = "-";
		if (keyCode == 190) key = ".";
		if (keyCode == 191) key = "/";
		if (keyCode == 192) key = "`";
		if (keyCode == 219) key = "[";
		if (keyCode == 220) key = "\\";
		if (keyCode == 221) key = "]";
		if (keyCode == 222) key = "'";
		
		return key;
	},
	
	// Update input fields inside Options window
	uiChangeCombos: function(id, json){
		var id_arr    = Array();
		var json_arr  = Array();
		var str       = "";
		var key       = "";
		
		// Check for array arguments
		if (!this.isArray(id) && !this.isArray(json)){
			id_arr[0]   = id;
			json_arr[0] = json;
		}else if (this.isArray(id) && this.isArray(json) && id.length == json.length){
			id_arr    = id;
			json_arr  = json;
		}
		
		// If count on each array is not equal, stop
		if (!id_arr.length || !json_arr.length)
			return;
		
		for(var i in id_arr){
			if (!this.defaults[id_arr[i]])
				continue;
			
			str = "";
			key = this.fromKeyCode(json_arr[i]["keycode"]).toUpperCase();
			
			for(var modifier in json_arr[i]["modifiers"]){
				str += (str.length ? " + " : "") + (json_arr[i]["modifiers"][modifier] == "control" ? "CTRL" : json_arr[i]["modifiers"][modifier].toUpperCase());
			}
			
			str += " + " + (key == " " ? "SPACE" : key);
			
			if (document.getElementById(id_arr[i])){
				document.getElementById(id_arr[i]).value = str;
			}
			
			if (document.getElementById("keysharky-enabler-" + id_arr[i]) && json_arr[i]["enabled"]){
				document.getElementById("keysharky-enabler-" + id_arr[i]).setAttribute("checked", json_arr[i]["enabled"]);
			}
			
		}
	},
	
	// Fetch preference for ID
	getPref: function(id){
		if (this.defaults[id]){
			try{
				var json = JSON.parse(localStorage[id]);
				
				if (this.checkJSON(json)){
					
					if (typeof(json["enabled"]) == "undefined"){
						json["enabled"] = true;
						localStorage[id] = JSON.stringify(json);
					}
						
					return json;
				}
			}catch(e){
				this.setPref(id, JSON.parse(this.defaults[id]));
			}
			
			return JSON.parse(this.defaults[id]);
		}
		
		return null;
	},
	
	// Set preference for ID
	setPref: function(id, json){
		if (this.defaults[id] && this.checkJSON(json)){
			try{
				localStorage[id] = JSON.stringify(json);
				return true;
			}catch(e){
				return false;
			}
		}else{
			return false;
		}
	},
	
	toggleEnabled: function(event, id){
		console.log(event);
		console.log(id);
		if (this.defaults[id]){
			var json = keysharkyOptions.getPref(id);
			
			json["enabled"] = event.checked === true ? true : false;
			keysharkyOptions.setPref(id, json);
		}
	},

	// Set startup connection
	toggleOnStartup: function(event){
		localStorage["ws-startup"] = event.checked === true ? true : false;
	},
	
	// Connect/Disconnect from socket
	toggleSocket: function(button){
		if (button.value == "Connect"){
		
			button.value = "Connecting ...";
			button.setAttribute("disabled", "disabled");
			
			keysharkyOptions.ws.setAttribute("disabled", "disabled");
			
			chrome.extension.sendRequest({"method": "socketConnect"}, function(response){});
			
		}else{
			
			button.value = "Disconnecting ...";
			button.setAttribute("disabled", "disabled");
			
			chrome.extension.sendRequest({"method": "socketDisconnect"}, function(response){ });
			
		}
	}
};

window.addEventListener("load", function(e) { keysharkyOptions.init(e); }, false);