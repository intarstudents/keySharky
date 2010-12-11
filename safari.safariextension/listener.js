var keysharkyListener = {

  Grooveshark: function(toggle)
  {
    
    var elem = document.createElement("script");
    elem.type = "text/javascript";
    elem.innerHTML = "if (typeof(Grooveshark) != 'undefined') Grooveshark." + toggle + ";";
    
    var append = document.head.appendChild(elem);
    document.head.removeChild(append);
  },
  
	init: function(){
    
    if (window.location.href.search(/^http\:\/\/(listen|preview|staging|retro)\.grooveshark\.com/) != -1){
      safari.self.addEventListener("message", function(request){
      
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
        
        if (request.name == "Grooveshark" && allToggles[request.message] != undefined){
          allToggles[request.message]();
        }
        
      }, false);
      
    }
    
    console.log(window.location.href);
    if (window.location.href.search(/^safari\-extension\:\/\/com\.intarstudents\.keysharky/) == -1){
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
          	"modifiers" : modifiers,
          	"keycode"   : keycode,
        	};
        
        	safari.self.tab.dispatchMessage("keyup", request);
        	
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
};

try{

  keysharkyListener.init();
  
}catch(e){
  // Fail, but with dignity!
}