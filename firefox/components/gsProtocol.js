const GSPROT_HANDLER_CONTRACTID = "@mozilla.org/network/protocol;1?name=gs";
const GSPROT_HANDLER_CID        = Components.ID("{1df55c70-7ed4-11df-8c4a-0800200c9a66}");

const URI_CONTRACTID 			= "@mozilla.org/network/simple-uri;1";

const nsIProtocolHandler  = Components.interfaces.nsIProtocolHandler;
const nsIURI              = Components.interfaces.nsIURI;
const nsISupports         = Components.interfaces.nsISupports;
const nsIIOService        = Components.interfaces.nsIIOService;

function GSProtocolHandler(){
  this.scheme = "gs";
}

GSProtocolHandler.prototype.defaultPort = -1;
GSProtocolHandler.prototype.protocolFlags = nsIProtocolHandler.URI_NORELATIVE;

GSProtocolHandler.prototype.allowPort = function(aPort, aScheme){
  return false;
}

GSProtocolHandler.prototype.newURI = function(aSpec, aCharset, aBaseURI){

  var uri = Components.classes[URI_CONTRACTID].createInstance(nsIURI);
  uri.spec = aSpec;
  return uri;
  
}

GSProtocolHandler.prototype.newChannel = function(aURI){

  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
  var mainWindow = wm.getMostRecentWindow("navigator:browser");
  
  // Neat, right?
  var keysharky = mainWindow.keysharky;
  
  /* Just begining */
  keysharky.log("Toggle play from gs:// protocol");
  keysharky.toggle("play");
  
  return false;

}

function GSProtocolHandlerFactory(){}

GSProtocolHandlerFactory.prototype.createInstance = function(outer, iid){

  if(outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  if(!iid.equals(nsIProtocolHandler) && !iid.equals(nsISupports))
      throw Components.results.NS_ERROR_INVALID_ARG;

  return new GSProtocolHandler();
    
}

var factory_gs = new GSProtocolHandlerFactory();

var GSModule = new Object();

GSModule.registerSelf = function(compMgr, fileSpec, location, type){

    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    // register protocol handlers
    compMgr.registerFactoryLocation(GSPROT_HANDLER_CID,
                                    "Grooveshark protocol handler",
                                    GSPROT_HANDLER_CONTRACTID,
                                    fileSpec, location, type);

}

GSModule.getClassObject = function(compMgr, cid, iid){

  if(!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

  if(cid.equals(GSPROT_HANDLER_CID)) return factory_gs;

  throw Components.results.NS_ERROR_NO_INTERFACE;
    
}

GSModule.canUnload = function(compMgr){
  return true;    // our objects can be unloaded
}

function NSGetModule(compMgr, fileSpec)
{
  Components.utils.reportError("GSModule (0.1) is loading!");
  return GSModule;
}
