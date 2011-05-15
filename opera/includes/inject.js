// ==UserScript==
// @name           keySharky Listener
// @namespace      http://keysharky.tldr.lv
// @description    Injects keySharky listener in every tab, so it could handle keyboard action
//                 and talk to Groovesharks player.
// @include        *
// ==/UserScript==

var keysharkyListener = {

  Grooveshark: function(toggle)
  {
    var elem = window.document.createElement("script");
    elem.type = "text/javascript";
    elem.innerHTML = "Grooveshark." + toggle + ";";

    var append = window.document.head.appendChild(elem);
    window.document.head.removeChild(append);
  },

  init: function(){

    if (window.location.href.search(/^http\:\/\/((listen|preview|staging|retro)\.|)grooveshark\.com\/(#\/|$)/) != -1){
      window.addEventListener('load', function(event) {

        opera.extension.onmessage = function(event) {
          var allToggles = {
            "play"      : function(){ keysharkyListener.Grooveshark("togglePlayPause()"); },
            "stop"      : function(){ keysharkyListener.Grooveshark("pause()"); },
            "prev"      : function(){ keysharkyListener.Grooveshark("previous()"); },
            "next"      : function(){ keysharkyListener.Grooveshark("next()"); },

            "favorite"  : function(){ keysharkyListener.Grooveshark("favoriteCurrentSong()"); },
            "voteup"    : function(){ keysharkyListener.Grooveshark("voteCurrentSong(1)"); },
            "votedown"  : function(){ keysharkyListener.Grooveshark("voteCurrentSong(-1)"); },
            "voteclear" : function(){ keysharkyListener.Grooveshark("voteCurrentSong(0)"); },

            "mute"      : function(){ keysharkyListener.Grooveshark("setIsMuted(Grooveshark.getIsMuted() ? false : true)"); },
            "volup"     : function(){ keysharkyListener.Grooveshark("setVolume(Grooveshark.getVolume() + 10)"); },
            "voldown"   : function(){ keysharkyListener.Grooveshark("setVolume(Grooveshark.getVolume() - 10)"); },
          };

          if (event.data["method"] == "Grooveshark" && allToggles[event.data["action"]] != undefined){
            allToggles[event.data["action"]]();
          }
        };

      }, false);
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
        opera.extension.postMessage(request);

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
};

try{

  keysharkyListener.init();

}catch(e){
  // Fail, but with dignity!
}
