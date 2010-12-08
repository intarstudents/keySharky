var keysharkyListener = {
  
  // Init keysharkyListener object
  init: function(){
    
    if (window.location.href.search(/^http\:\/\/(listen|preview|staging|retro)\.grooveshark\.com/) != -1){
      
      try{
        this.gsliteswf = document.getElementById('gsliteswf');
      }catch(e){}
      
      //Inject in tab gsliteswf object toggler who is waiting to execute keyup actions
      chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        var allToggles = {
          "play"      : function(){ keysharkyListener.gsliteswf.togglePlayback(); },
          "stop"      : function(){ keysharkyListener.gsliteswf.pausePlayback(); },
          "prev"      : function(){ keysharkyListener.gsliteswf.previous(); },
          "next"      : function(){ keysharkyListener.gsliteswf.next(); },
          
          "favorite"  : function(){ keysharkyListener.gsliteswf.favoriteSong(); },
          "voteup"    : function(){ keysharkyListener.gsliteswf.voteSong(1); },
          "votedown"  : function(){ keysharkyListener.gsliteswf.voteSong(-1); },
          "voteclear" : function(){ keysharkyListener.gsliteswf.voteSong(0); },
        };
        
        if (request.method == "gsliteswf" && allToggles[request.action] != undefined){
        
          try{
            allToggles[request.action]();
            sendResponse({"result" : 200});
          }catch(e){
            sendResponse({"result" : 500});
          }
          
        }
      });
      
    }else{
    
      this.unAllowedKeys = [16, 17, 18, 91];
      
      // Inject in tab keyup listener, who will check for (maybe) valid keysharky combo
      window.addEventListener('keyup', function(event){
        
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

        if(modifiers.length > 0 && !keysharkyListener.inArray(keysharkyListener.unAllowedKeys, keycode)) {
          
          var request = {
            "method" : "keyup",
            "modifiers" : modifiers,
            "keycode"   : keycode,
          };
          chrome.extension.sendRequest(request, function(response){});
          
        }
        
      }, false);
      
    }
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
  }
  
}

try{

  keysharkyListener.init();
  
}catch(e){
  // Fail, but with dignity!
}
