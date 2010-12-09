var keysharkyListener = {
  
  Grooveshark: function(toggle)
  {
    // Chrome ... WTF did you made me write?
    var elem = document.createElement("script");
    elem.type = "text/javascript";
    elem.innerHTML = "Grooveshark." + toggle + ";";
    
    var append = document.head.appendChild(elem);
    document.head.removeChild(append);
  },
  
  // Init keysharkyListener object
  init: function(){
    
    if (window.location.href.search(/^http\:\/\/(listen|preview|staging|retro)\.grooveshark\.com/) != -1){
      
      chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        var allToggles = {
          "play"      : function(){ keysharkyListener.Grooveshark("togglePlayPause()"); },
          "stop"      : function(){ keysharkyListener.Grooveshark("pause()"); },
          "prev"      : function(){ keysharkyListener.Grooveshark("previous()"); },
          "next"      : function(){ keysharkyListener.Grooveshark("next()"); },
          
          "favorite"  : function(){ keysharkyListener.Grooveshark("favoriteCurrentSong()"); },
          "voteup"    : function(){ keysharkyListener.Grooveshark("voteCurrentSong(1)"); },
          "votedown"  : function(){ keysharkyListener.Grooveshark("voteCurrentSong(-1)"); },
          "voteclear" : function(){ keysharkyListener.Grooveshark("voteCurrentSong(0)"); },
        };
        
        if (request.method == "Grooveshark" && allToggles[request.action] != undefined){
        
          try{
            allToggles[request.action]();
            sendResponse({"result" : 200});
          }catch(e){
            sendResponse({"result" : 500});
          }
          
        }
      });
      
    }
    
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
