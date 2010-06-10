/*

Copyright (c) 2010 Intars Students

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var keysharky = {
  
  // Init keySharky object
  init: function() {
    this.allToggles = {
      "play"      : function(){ keysharky.gsliteswf.togglePlayback(); },
      "stop"      : function(){ keysharky.gsliteswf.pausePlayback(); },
      "previous"  : function(){ keysharky.gsliteswf.previous(); },
      "next"      : function(){ keysharky.gsliteswf.next(); },
      
      "favorite"  : function(){ keysharky.gsliteswf.favoriteSong(); },
      "voteup"    : function(){ keysharky.gsliteswf.voteSong(1); },
      "votedown"  : function(){ keysharky.gsliteswf.voteSong(-1); },
      "voteclear" : function(){ keysharky.gsliteswf.voteSong(0); },
    };
    
    this.defaults = {
      "play"        :  '{"modifiers":["control","alt","shift"],"key":"Z","keycode":""}',
      "stop"        :  '{"modifiers":["control","alt","shift"],"key":"X","keycode":""}',
      "previous"    :  '{"modifiers":["control","alt","shift"],"key":"A","keycode":""}',
      "next"        :  '{"modifiers":["control","alt","shift"],"key":"D","keycode":""}',
      
      "favorite"    :  '{"modifiers":["control","alt"],"key":"S","keycode":""}',
      "voteup"      :  '{"modifiers":["control","alt"],"key":"A","keycode":""}',
      "votedown"    :  '{"modifiers":["control","alt"],"key":"Z","keycode":""}',
      "voteclear"   :  '{"modifiers":["control","alt"],"key":"Q","keycode":""}',
      
      "server_port" : 8800
    }
    
    this.consoleObject = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    
    this.gsliteswf  = undefined;
    this.gsAPI      = undefined;
    this.gsTab      = null;
    this.debug      = true;
    this.readme_url = "http://www.mozilla.org/access/keyboard/";
    
    this.loadJSON();
    this.loadCombos();
    
    if (this.get_server_autostart())
      this.startServer();
    
    this.log("ready to groove");
  },
  
  // What must happen when unload accrue
  unload: function(){
    this.stopServer();
  },
  
  // Start gsAPI server (on users selected port) and register all handlers for it
  startServer: function(){
    
    try{
      this.gsAPI = Components.classes["@mozilla.org/server/jshttp;1"].
                  createInstance(Components.interfaces.nsIHttpServer);
      var port = this.get_server_port();
      
      this.gsAPI.registerErrorHandler(404, this.serverErrorParser);
      this.gsAPI.registerPathHandler("/", this.serverErrorParser);
      this.gsAPI.registerPathHandler("/currentSong", this.serverCurrentSong);
      
      for(var toggle in this.allToggles){
        this.gsAPI.registerPathHandler("/" + toggle, this.serverParser);
      }
      
      this.gsAPI.start(port);
      this.log("gsAPI server started (@ http://localhost:" + port + ")");
      
      return true;
    }catch(e){
      this.log("failed to start gsAPI server");
      return false;
    }
  },
  
  // Stop gsAPI server and unset gsAPI object
  stopServer: function(){
    try {
      this.gsAPI.stop(function(){});
      this.gsAPI = undefined;
      
      this.log("gsAPI server stopped");
      return true;
    }catch(e){
      this.log("failed to stop gsAPI server (" + e + ")");
      return false;
    }
  },
  
  // Parse and execute successful methods of gsAPI
  serverParser: function(request, response){
    var toggle = /\/(\w+)/i.exec(request.path);
    response.setHeader("Cache-Control", "no-cache", false);
    
    if (keysharky.toggle(toggle[1])){
      response.setStatusLine("1.1", 200, "OK");
      response.write("TOGGLING (" + toggle[1] + ") OK");
    }else{
      response.setStatusLine("1.1", 500, "FAILED");
      response.write("TOGGLING (" + toggle[1] + ") FAILED");
    }
  },
  
  // Try to show current song status with gsAPI in simple text format
  serverCurrentSong: function(request, response){
    
    try {
      var currentSong = keysharky.gsliteswf.getCurrentSongStatus();
    }catch(e){
      
      // If no gsliteswf object found, try to search Grooveshark
      try{
        keysharky.findGrooveshark();
        var currentSong = keysharky.gsliteswf.getCurrentSongStatus();
      }catch(e){}
      
    }
    
    response.setHeader("Cache-Control", "no-cache", false);
    
    try{
      var currentSong = keysharky.gsliteswf.getCurrentSongStatus();
      
      response.setStatusLine("1.1", 200, "OK");
      response.write("status: " + currentSong.status + "\n");
      
      for(var status in currentSong.song){
        response.write(status + ": " + currentSong.song[status] + "\n");
      }
    }catch(e){
      response.setStatusLine("1.1", 500, "FAILED");
      response.write("COULDN'T RETRIEVE CURRENT SONG STATUS");
    }
  },
  
  // If user wants to break gsAPI, give him "No-no" message
  serverErrorParser: function(request, response){
    response.setStatusLine("1.1", 501, "Not implemented");
    response.write(
      "<h2>Not implemented</h2>" +
      "<p style=\"width: 240px;\"><code>You tried to run method that doesn't exist in this API.<br />" + 
      "Please read wiki entry, about what you can do with this API :)</code></p>" +
      "<p><a href=\"http://wiki.github.com/intarstudents/keySharky/api-server\"><code>API server</code></a></p>"
    );
  },
  
  get_server_autostart: function(){
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    return pref.getBoolPref("extensions.keysharky.server_autostart");
  },
  
  set_server_autostart: function(s){
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    pref.setBoolPref("extensions.keysharky.server_autostart", (s ? true : false));
  },
  
  get_server_port: function(){
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    var port = pref.getIntPref("extensions.keysharky.server_port");
    
    if (port >= 1024 && port <= 65535){
      return port;
    }else{
      return this.defaults["server_port"];
    }
  },
  
  set_server_port: function(s){
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    var port = parseInt(s);
    
    pref.setIntPref("extensions.keysharky.server_port", (port >= 1024 && port <= 65535 ? port : this.defaults["server_port"]));
  },
  
  // Start or Stop gsAPI server with one click
  toggleServer: function(){
    var toggleButton = this.optionsDoc.getElementById("keysharky-toggleServer");
    var toggleServerPort = this.optionsDoc.getElementById("keysharky-toggleServerPort");
    
    toggleButton.setAttribute("disabled", true);
    
    if (toggleButton.getAttribute("label") == "Start"){
      if (this.startServer()){
        toggleButton.setAttribute("label", "Stop");
        
        toggleButton.setAttribute("disabled", false);
        toggleServerPort.setAttribute("disabled", true);
      }else{
        toggleButton.setAttribute("label", "Couldn't start server!");
        
        setTimeout(function(){
          var toggleButton = keysharky.optionsDoc.getElementById("keysharky-toggleServer");
          toggleButton.setAttribute("label", "Start");
          
          toggleButton.setAttribute("disabled", false);
          toggleServerPort.removeAttribute("disabled");
        }, 3000);
      }
      
    }else{
      if (!this.stopServer())
        this.gsAPI = undefined;
        
      toggleButton.setAttribute("label", "Start");
      
      toggleButton.setAttribute("disabled", false);
      toggleServerPort.removeAttribute("disabled");
    }
  },
  
  // Change gsAPI server autostart option
  toggleServerStartup: function(){
    var toggleServerStartup = this.optionsDoc.getElementById("keysharky-toggleServerStartup");
    this.set_server_autostart(toggleServerStartup.getAttribute("checked"));
  },
  
  // Change gsAPI server port
  toggleServerPort: function(){
    this.set_server_port(this.optionsDoc.getElementById("keysharky-toggleServerPort").value);
  },
  
  // Debugging is half of victory!
  log: function(msg){
    if (this.debug && msg){
      this.consoleObject.logStringMessage("keySharky ---> " + msg);
    }
  },
  
  // Check if Object is Array
  isArray: function(obj){
    return obj.constructor.toString().indexOf("Array") == -1 ? false : true;
  },
  
  // Fix JSON on Firefox 3.0
  loadJSON: function(){
    try{
      this.JSON = {
        JSON: null,
        parse: function(jsonString) { return this.JSON.fromString(jsonString) },
        stringify: function(jsObject) { return this.JSON.toString(jsObject) }
      }
      
      Components.utils.import("resource://gre/modules/JSON.jsm", this.JSON);
      this.log("loaded JSON module");
    }catch(e){
    
      this.JSON = JSON;
      this.log("build-in JSON object linked with keysharky.JSON");
      
    }
  },
  
  // Check if JSON object is well build
	checkJSON: function(json){
	  try{
	    if (this.isArray(json["modifiers"]) && json["modifiers"].length && (json["key"] || json["keycode"])){
	      return true;
	    }
	  }catch(e){}
	  
	  return false;
	},
	
	// Open readme page in new tab
	readme: function(){
	   var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
     var mainWindow = wm.getMostRecentWindow("navigator:browser");
     
     var newTab = mainWindow.gBrowser.addTab(this.readme_url);
	   mainWindow.gBrowser.selectedTab = newTab;
	},
  
  // Calling gsliteswf object build-in external functions
  toggle: function(s){
    if (this.allToggles[s] != undefined){
      this.log("toggling '" + s + "' ...");
      
      try{
        this.allToggles[s]();
        this.log("toggled '" + s + "'");
        
        return true;
      }catch(e){
        this.findGrooveshark();
        
        try{
          this.allToggles[s]();
          this.log("toggled '" + s + "'");
          
          return true;
        }catch(e){
          this.log("couldn't toggle '" + s + "'");
          return false;
        }
      }
    }
  },
  
  // Searching for Grooveshark tab
  findGrooveshark: function(){
    this.log("searching for Grooveshark tab ...");
    
    try{
      
      var mTabs = gBrowser.mTabs;
      delete this.gsliteswf;
      
      for (var i=0; i<mTabs.length; i++){
        var browser = gBrowser.getBrowserForTab(mTabs[i]);
        
        /*
          Search for tab with URL like:
            http://listen.grooveshark.com/
            http://preview.grooveshark.com/
            http://staging.grooveshark.com/
        */
        if (browser.currentURI["spec"].search(/^http\:\/\/(listen|preview|staging)\.grooveshark\.com/) != -1){
          if (browser.contentDocument.getElementById("gsliteswf").wrappedJSObject != undefined){
            
            this.log("found Grooveshark");
            this.gsliteswf = browser.contentDocument.getElementById("gsliteswf").wrappedJSObject;
            this.gsTab = mTabs[i];
            
            break;
          }
        }
      }
      
    }catch(e){}
  },
  
  // Reload all available keyboard shortcuts
  loadCombos: function(){
    var id_arr    = Array();
    var json_arr  = Array();
    var i         = 0;
    
    for(var toggle in this.allToggles){
      id_arr[i]   = toggle;
      json_arr[i] = this.getPref(toggle);
      
      i++;
    }
    
    this.setCombos(id_arr, json_arr);
    this.log("combos loaded");
  },
  
  // Update Options UI
  uiOptions: function(){
    var id_arr    = Array();
    var json_arr  = Array();
    var i         = 0;
    
    for(var toggle in this.allToggles){
      id_arr[i]   = toggle;
      json_arr[i] = this.getPref(toggle);
      
      i++;
    }
    
    this.uiChangeCombos(id_arr, json_arr);
    
    this.optionsDoc.getElementById("keysharky-toggleServer").setAttribute("label", (this.gsAPI == undefined ? "Start" : "Stop"));
    this.optionsDoc.getElementById("keysharky-toggleServerStartup").setAttribute("checked", this.get_server_autostart());

    var toggleServerPort = this.optionsDoc.getElementById("keysharky-toggleServerPort");
    toggleServerPort.value = this.get_server_port();
    
    if (this.gsAPI != undefined)
      toggleServerPort.setAttribute("disabled", true);
    
    this.log("options UI updated");
  },
  
  // Update input fields inside Options window
  uiChangeCombos: function(id, json){
    var id_arr    = Array();
    var json_arr  = Array();
    var str       = "";
    
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
      str = "";
      
      for(var modifier in json_arr[i]["modifiers"]){
        str += (str.length ? " + " : "") + (json_arr[i]["modifiers"][modifier] == "control" ? "CTRL" : json_arr[i]["modifiers"][modifier].toUpperCase());
      }
      
      if (json_arr[i]["keycode"]){
        str += " + " + json_arr[i]["keycode"].replace("VK_", "");
      }else{
        str += " + " + (json_arr[i]["key"] == " " ? "SPACE" : json_arr[i]["key"]);
      }
      
      if (keysharky.optionsDoc.getElementById("keysharky-toggle-" + id_arr[i] + "-shortcut")){
        keysharky.optionsDoc.getElementById("keysharky-toggle-" + id_arr[i] + "-shortcut").value = str;
      }
    }
  },
	
	// Apply just selected keyboard shortcut, so user can test it out
  applyCombo: function(event, id){
    if (id){
      combo = this.recognizeKeys(event);
      // If bad combo, let user try new cambo
      if (!this.checkJSON(combo))
        return;
      
      this.uiChangeCombos(id, combo);
      this.setPref(id, combo);
      this.setCombos(id, combo);
    }
  },
  
  // Append key object inside mainKeyset
  setCombos: function(id, json){
    var id_arr    = Array();
    var json_arr  = Array();
    var str       = "";
    
    // Check for array arguments
    if (!this.isArray(id) && !this.isArray(json)){
      id_arr[0]   = id;
      json_arr[0] = json;
    }else if (this.isArray(id) && this.isArray(json) && id.length == json.length){
      id_arr    = id;
      json_arr  = json;
    }
    
    // If count on each array is not equal - stop
    if (!id_arr.length || !json_arr.length)
      return;
    
    // Find browser window (or windows)
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    var enumerator = wm.getEnumerator("navigator:browser");
    
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      
      try{
        // Look for fake key-bind, if it is there, we are in right place
        var keySet = win.document.getElementById("keysharky_key_fake").parentNode.cloneNode(true);
        var keyParent = win.document.getElementById("keysharky_key_fake").parentNode.parentNode;
        
      }catch(e){
        // Else try next window
        continue;
      }
      
      for(var i in id_arr){
        if (!this.allToggles[id_arr[i]])
          continue;
        
        // Create new key element
        var newKey = win.document.createElement("key");
        newKey.setAttribute("id", "keysharky_key_" + id_arr[i]);
        newKey.setAttribute("command", "keysharky_cmd_" + id_arr[i]);
        newKey.setAttribute("modifiers", json_arr[i]["modifiers"].join(" "));
        newKey.setAttribute(
          (json_arr[i]["keycode"] ? "keycode" : "key"), 
          (json_arr[i]["keycode"] ? json_arr[i]["keycode"] : json_arr[i]["key"])
        );
        
        // Delete exciting key for this ID
        for(var x=0; x<keySet.childNodes.length; x++){
          if (keySet.childNodes[x].getAttribute("id") == "keysharky_key_" + id_arr[i]){
            try{
              keySet.removeChild(keySet.childNodes[x]);
            }catch(e){}
            break;
          }
        }
        
        // And at last append it to cloned object
        keySet.appendChild(newKey);
      }
      
      // When every key is appended, refresh mainKeyset (by deleting it and appending from clone (yes, it's strange))
      keyParent.removeChild(win.document.getElementById("keysharky_key_fake").parentNode);
      keyParent.appendChild(keySet);
      
      this.log("new key element/s appended to mainKeyset");
    }
  },
  
  // Get the list of keycodes from the KeyEvent object
  getKeyCodes: function() {
		var keycodes = new Array();
		
		for(var property in KeyEvent) {
			keycodes[KeyEvent[property]] = property.replace('DOM_','');
		}
		
		// VK_BACK_SPACE (index 8) must be VK_BACK
		keycodes[8] = 'VK_BACK';
		return keycodes;
	},
	
  // Parse keypress event, to get user pressed combo
  recognizeKeys: function(event) {
		var modifiers = new Array();
		var key = '';
		var keycode = '';
		
		// Get the modifiers:
		if(event.metaKey) modifiers.push('meta');
		if(event.ctrlKey) modifiers.push('control');
		if(event.altKey) modifiers.push('alt');
		if(event.shiftKey) modifiers.push('shift');
		
		// Get the key or keycode:
		if(event.charCode) {
			key = String.fromCharCode(event.charCode).toUpperCase();
		} else {
			// Get the keycode from the keycodes list:
			keycode = this.getKeyCodes()[event.keyCode];
			if(!keycode) {
				return null;
			}
		}
		
		if(modifiers.length > 0) {
		  
		  return {
		    "modifiers" : modifiers,
		    "key"       : key,
		    "keycode"   : keycode,
		  };
		  
		}
		return null;
	},
	
	// Fetch preference for ID
	getPref: function(id){
	  if (this.allToggles[id]){
	    try{
	      
	      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefBranch);
        var json = this.JSON.parse(pref.getCharPref("extensions.keysharky." + id));
	      
	      if (this.checkJSON(json)){
	        return json;
	      }
	      
	    }catch(e){
	      this.log(e);
	      this.setPref(id, this.JSON.parse(this.defaults[id]));
	    }
	    
	    
	    return this.JSON.parse(this.defaults[id]);
	  }else{
	    return null;
	  }
	},
	
	// Set preference for ID
	setPref: function(id, json){
	  if (this.allToggles[id]){
	    
	    try{
	      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefBranch);
        if (this.checkJSON(json)){     
          pref.setCharPref("extensions.keysharky." + id, this.JSON.stringify(json));
          return true;
        }else{
          return false;
        }
	    
	    }catch(e){
	      return false;
	    }
	    
	  }else{
	    return false;
	  }
	}

};

window.addEventListener("load", function(e) { keysharky.init(e); }, false);
window.addEventListener("unload", function(e) { keysharky.unload(e); }, false);
