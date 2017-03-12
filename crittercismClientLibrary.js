// crittercismClientLibrary.js
// Load this file into the page where you want to use Crittercism.
/*jslint indent: 2 */
/*jslint browser: true*/

function CrittercismClass() {

  // Note the lack of device ID. The device ID is generated and set by the
  // server. It is transmitted in a cookie. This is actually better than
  // localStorage, because cookies can be used across subdomains without
  // bumping into the browser's same-origin protection mechanisms.
  var LIB_VERSION = '2.3',
    appId = null,
    libraryInitialized = false,
    debug = true,
    metadata,
    observers = {};

  function getObserver(appId) {
    return observers[appId];
  }
  this.getObserver = getObserver;

  function getObservers() {
    return observers;
  }
  this.getObservers = getObservers;

  function Html5Observer(options) {
    var CRITTERCISM_HTML5 = "com.crittercism.html5",
      LASTSEEN = "lastSeen",
      SESSION_LENGTH_MS = 30 * 60 * 1000,
      appVersion = null,
      appLocator = null,
      apiUrl = null,
      apmUrl = null,
      txnUrl = null,
      breadcrumbs = null,
      metadataThrottle = new Throttle(5, 60 * 1000),
      errorThrottle = new Throttle(5, 60 * 1000);

    function getBreadcrumbs() {
      return breadcrumbs;
    }
    this.getBreadcrumbs = getBreadcrumbs;

    // Observer init

    function init(options) {
      appVersion = options.appVersion || 'unspecified';
      appLocator = new AppLocator(appId);
      if (!appLocator.isValidAppId) {
        throw new Error("Crittercism is disabled because appId '" + appId + "' is invalid");
      } else {
        apiUrl = appLocator.configuredApiUrl;
        apmUrl = appLocator.configuredApmUrl;
        txnUrl = appLocator.configuredTxnUrl;
      }
      breadcrumbs = new Breadcrumbs();
      if (isNewSession() || options.appLoad) {
        sendAppLoad();
      }
      markSeen();
    }

    // AppLocator

    function AppLocator(appId) {
      var appLocatorSequence, domain;

      // AppLocator Properties
      var APPLOCATOR_LENGTH = 8,
        APPID_LENGTH = 40,
        LEGACY_APPID_LENGTH = 24;

      // Location Designators
      var US_WEST_1_PROD_DESIGNATOR = "00555300",
        US_WEST_2_CI_DESIGNATOR = "00555304",
        US_WEST_2_STAGING_DESIGNATOR = "00555305",
        EU_CENTRAL_1_PROD_DESIGNATOR = "00444503";

      // Domain URLs
      var PRODUCTION_DOMAIN = "crittercism.com",
        CI_DOMAIN = "crit-ci.com",
        STAGING_DOMAIN = "crit-staging.com",
        EU_PRODUCTION_DOMAIN = "de.crittercism.com";

      // URL Prefixes
      var API_PREFIX = "https://api.",
        APM_PREFIX = "https://apm.",
        TXN_PREFIX = "https://txn.ingest.";

      this.isValidAppId = false;

      if ((!appId) || appId.match(/^[a-f0-9]{24,40}$/gi) === null) {
        printDebug("Not a valid Crittercism appId == " + appId);
        return;
      }

      if (appId.length === LEGACY_APPID_LENGTH) {
        domain = PRODUCTION_DOMAIN;
      } else if (appId.length === APPID_LENGTH) {
        appLocatorSequence = appId.substring(APPID_LENGTH - APPLOCATOR_LENGTH);
        switch (appLocatorSequence) {
          case US_WEST_1_PROD_DESIGNATOR:
            domain = PRODUCTION_DOMAIN;
            break;
          case US_WEST_2_CI_DESIGNATOR:
            domain = CI_DOMAIN;
            break;
          case US_WEST_2_STAGING_DESIGNATOR:
            domain = STAGING_DOMAIN;
            break;
          case EU_CENTRAL_1_PROD_DESIGNATOR:
            domain = EU_PRODUCTION_DOMAIN;
            break;
          default:
            return;
        }
      } else {
        return;
      }

      this.isValidAppId = true;
      this.configuredApiUrl = API_PREFIX + domain;
      this.configuredApmUrl = APM_PREFIX + domain;
      this.configuredTxnUrl = TXN_PREFIX + domain;
    }

    this.AppLocator = AppLocator;

    // Breadcrumbs

    function Breadcrumbs() {
      var breadcrumbJson = getItem("breadcrumbJson");
      if (!breadcrumbJson) {
        breadcrumbJson = "[]";
      }
      // IMPORTANT: there are only two public variables. This object is
      // formatted this way as part of the breadcrumb protocol (which also
      // requires snake_case)
      try {
        this.previous_session = JSON.parse(breadcrumbJson);
      } catch (e) {
        printDebug("Exception occurred while parsing previous session breadcrumb");
        printDebug(breadcrumbJson);
        this.previous_session = [];
      }

      this.current_session = [];

      this.leaveBreadcrumb = function BreadcrumbsLeaveBreadrumb(text) {
        var MAX_BREADCRUMBS = 100, MAX_CHARS_PER_BREADCRUMB = 140, shortenedCrumb;
        if ((typeof text) != 'string') {
          throw new Error("Invalid breadcrumb type; must be a string");
        }
        printDebug(text);
        shortenedCrumb = text.substr(0, MAX_CHARS_PER_BREADCRUMB);
        // trim the length of the breadcrumb trail
        if (this.current_session.length >= MAX_BREADCRUMBS) {
          this.current_session.splice(1, 1);
        }
        this.current_session.push([shortenedCrumb, getNowISODateString()]);
        setItem("breadcrumbJson", JSON.stringify(this.current_session));
      };

      this.leaveBreadcrumb("session_start");
    }

    this.Breadcrumbs = Breadcrumbs;

    // Throttle

    function Throttle(maxEvents, perUnitTime) {
      /**
       * This class is used to throttle the number of events per unit time to a
       * particular rate.
       * @param maxEvents The maximum events to allow per unit time.
       * @param perUnitTime The time interval
       */
      var maxTokens = maxEvents,
        tokensAccumulated = 1.0,
        timeWindow = perUnitTime,
        lastEventTime = new Date();

      this.tryEvent = function ThrottleTryEvent() {
        var now = new Date(),
          delta = now - lastEventTime,
          newTokens;
        lastEventTime = now;
        // This is a basic token counting system
        // Add tokens for the amount of time that has passed since the last event
        // Must have at least one whole token to allow an event
        newTokens = delta * (maxTokens / timeWindow);
        tokensAccumulated += newTokens;
        // Cap the number of tokens to max events.  We never want to exceed
        // a given rate (as opposed to maintaining an average rate over time).
        if (tokensAccumulated > maxTokens) {
          tokensAccumulated = maxTokens;
        }
        if (tokensAccumulated >= 1) {
          tokensAccumulated -= 1;
          return true;
        }
        return false;
      };
    }

    this.Throttle = Throttle;

    function getNowISODateString() {
      // Returns ISO-formatted DateTime, used because controller methods on server
      // expect ISO datetime in passed breadcrumbs
      var d = new Date();

      function pad(number) {
        if (number < 10) {
          return '0' + number;
        }
        return number;
      }

      return d.getUTCFullYear() +
        '-' + pad(d.getUTCMonth() + 1) +
        '-' + pad(d.getUTCDate()) +
        'T' + pad(d.getUTCHours()) +
        ':' + pad(d.getUTCMinutes()) +
        ':' + pad(d.getUTCSeconds()) +
        'Z';
    }

    /*
     * Sessions
     */
    // newSession method marks session start; returns true if this is a "new session",
    // otherwise returns false.
    function isNewSession() {
      var now, lastSeenAgoMs, lastSeenDate = getLastSeenDate();
      if (lastSeenDate) {
        now = new Date();
        lastSeenAgoMs = now - lastSeenDate;
        return lastSeenAgoMs >= SESSION_LENGTH_MS;
      }
      // No recorded last session, return true (is new session)
      return true;
    }

    function getLastSeenDate() {
      var answer = null;
      var lastSessionStartString = getItem(LASTSEEN);
      if (lastSessionStartString) {
        answer = new Date(lastSessionStartString);
      }
      return answer;
    }

    function markSeen() {
      setItem(LASTSEEN, new Date().toString());
    }

    function makePOSTRequest(url, entityBody, contentType) {
      // makePOSTRequest is a lightweight version of jQuery.post.
      // If url or parameters is empty, we don't do anything.
      if (url && entityBody) {
        var http_request = false;
        if (window.XMLHttpRequest) { // Mozilla, Safari,...
          http_request = new XMLHttpRequest();
          if (http_request.overrideMimeType) {
            http_request.overrideMimeType(contentType);
          }
        } else if (window.ActiveXObject) { // IE
          try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP");
          } catch (e) {
            try {
              http_request = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (ignore) {
            }
          }
        }
        if (!http_request) {
          return false;
        }
        http_request.open('POST', url, true);
        http_request.withCredentials = true;
        http_request.setRequestHeader("Content-type", contentType);
        http_request.send(entityBody);
      }
    }

    function sendAppLoad() {
      printDebug("sendAppLoad");
      var entityBody = JSON.stringify({
        app_id: appId,
        library_version: LIB_VERSION,
        app_state: {
          app_version: appVersion
        }
      });
      makePOSTRequest(apiUrl + '/app_loads', entityBody, 'application/json;charset=UTF-8');
    }

    // Local Storage

    function absolutePath(key) {
      return (CRITTERCISM_HTML5 + "/" + appId + "/" + key);
    }

    function getItem(key) {
      var answer = null;
      try {
        answer = localStorage.getItem(absolutePath(key));
      } catch (e) {
        //console.log(e);
      }
      return answer;
    }

    function setItem(key, value) {
      try {
        localStorage.setItem(absolutePath(key), value);
      } catch (e) {
        //console.log(e);
      }
    }

    // Observer API's

    this.sendHandledException = function sendHandledException(name, reason, stack) {
      if (!errorThrottle.tryEvent()) {
        // Avoid all of the 3rd party stack trace stuff
        // if we can.  It looks expensive.
        return;
      }
      var contents = {
        app_id: appId,
        library_version: LIB_VERSION,
        exceptions: [{
          library_version: LIB_VERSION,
          exception_name: name,
          exception_reason: reason,
          breadcrumbs: breadcrumbs,
          state: {
            app_version: appVersion
          },
          unsymbolized_stacktrace: stack
        }]
      };
      //console.log("sendHandledException SENDING");
      makePOSTRequest(
        apiUrl + '/errors',
        JSON.stringify(contents),
        'application/json;charset=UTF-8');
      markSeen();
    };

    this.sendUnhandledException = function sendUnhandledException(name, reason, stackAsString) {
      // TODO: Implement this method
      markSeen();
    };

    this.logNetworkRequest = function logNetworkRequest(method, url, latency, bytesRead, bytesSent, responseCode, errorCode) {
      // TODO: Implement this method
      markSeen();
    };

    this.leaveBreadcrumb = function leaveBreadcrumb(breadcrumb) {
      breadcrumbs.leaveBreadcrumb(breadcrumb);
      markSeen();
    };

    function sendMetadata() {
      if (metadataThrottle.tryEvent()) {
        var message = JSON.stringify(metadata);
        makePOSTRequest(
          apiUrl + '/metadata',
          message,
          'application/json;charset=UTF-8');
      }
    }

    this.setUsername = function setUsername(username) {
      // NOTE: username already pushed into Crittercism.metadata
      sendMetadata();
      markSeen();
    };

    this.setValue = function setValue(key, value) {
      // NOTE: value, key already pushed into Crittercism.metadata
      sendMetadata();
      markSeen();
    };

    this.setMetadata = function setMetadata(userMetadata) {
      // NOTE: userMetadata already pushed into Crittercism.metadata
      sendMetadata();
      markSeen();
    };

    this.beginTransaction = function beginTransaction(name) {
      // TODO: Implement this method
      markSeen();
    };

    this.endTransaction = function endTransaction(name) {
      // TODO: Implement this method
      markSeen();
    };

    this.failTransaction = function failTransaction(name) {
      // TODO: Implement this method
      markSeen();
    };

    this.setTransactionValue = function setTransactionValue(name, value) {
      // TODO: implement this method
      markSeen();
    };

    this.getTransactionValue = function getTransactionValue(name) {
      // TODO: implement this method
      markSeen();
      // in the meantime, return default value:
      return -1;
    };

    // init
    init(options);
  }
  // Export the Html5Observer class so that it can be unit tested
  this.Html5Observer = Html5Observer;

  // Stack Traces

  // Domain Public by Eric Wendelin http://eriwen.com/ (2008)
  //                  Luke Smith http://lucassmith.name/ (2008)
  //                  Loic Dachary <loic@dachary.org> (2008)
  //                  Johan Euphrosine <proppy@aminche.com> (2008)
  //                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
  //                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)
  /**
   * Main function giving a function stack trace with a forced or passed in Error
   *
   * @cfg {Error} e The error to create a stacktrace from (optional)
   * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
   * @return {Array} of Strings with functions, lines, files, and arguments where possible
   */
  function printStackTrace(options) {
    options = options || {guess: true};
    var ex = options.e || null, guess = !!options.guess;
    var p = new printStackTrace.implementation(), result = p.run(ex);
    return (guess) ? p.guessAnonymousFunctions(result) : result;
  }

  printStackTrace.implementation=function(){};printStackTrace.implementation.prototype={run:function(ex,mode){ex=ex||this.createException();mode=mode||this.mode(ex);if(mode==='other'){return this.other(arguments.callee);}else{return this[mode](ex);}},createException:function(){try{this.undef();}catch(e){return e;}},mode:function(e){if(e['arguments']&&e.stack){return'chrome';}else if(typeof e.message==='string'&&typeof window!=='undefined'&&window.opera){if(!e.stacktrace){return'opera9';}if(e.message.indexOf('\n')>-1&&e.message.split('\n').length>e.stacktrace.split('\n').length){return'opera9';}if(!e.stack){return'opera10a';}if(e.stacktrace.indexOf("called from line")<0){return'opera10b';}return'opera11';}else if(e.stack){return'firefox';}return'other';},instrumentFunction:function(context,functionName,callback){context=context||window;var original=context[functionName];context[functionName]=function instrumented(){callback.call(this,printStackTrace().slice(4));return context[functionName]._instrumented.apply(this,arguments);};context[functionName]._instrumented=original;},deinstrumentFunction:function(context,functionName){if(context[functionName].constructor===Function&&context[functionName]._instrumented&&context[functionName]._instrumented.constructor===Function){context[functionName]=context[functionName]._instrumented;}},chrome:function(e){var stack=(e.stack+'\n').replace(/^\S[^\(]+?[\n$]/gm,'').replace(/^\s+(at eval )?at\s+/gm,'').replace(/^([^\(]+?)([\n$])/gm,'{anonymous}()@$1$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm,'{anonymous}()@$1').split('\n');stack.pop();return stack;},firefox:function(e){return e.stack.replace(/(?:\n@:0)?\s+$/m,'').replace(/^\(/gm,'{anonymous}(').split('\n');},opera11:function(e){var ANON='{anonymous}',lineRE=/^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){var location=match[4]+':'+match[1]+':'+match[2];var fnName=match[3]||"global code";fnName=fnName.replace(/<anonymous function: (\S+)>/,"$1").replace(/<anonymous function>/,ANON);result.push(fnName+'@'+location+' -- '+lines[i+1].replace(/^\s+/,''));}}return result;},opera10b:function(e){var lineRE=/^(.*)@(.+):(\d+)$/;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i++){var match=lineRE.exec(lines[i]);if(match){var fnName=match[1]?(match[1]+'()'):"global code";result.push(fnName+'@'+match[2]+':'+match[3]);}}return result;},opera10a:function(e){var ANON='{anonymous}',lineRE=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){var fnName=match[3]||ANON;result.push(fnName+'()@'+match[2]+':'+match[1]+' -- '+lines[i+1].replace(/^\s+/,''));}}return result;},opera9:function(e){var ANON='{anonymous}',lineRE=/Line (\d+).*script (?:in )?(\S+)/i;var lines=e.message.split('\n'),result=[];for(var i=2,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){result.push(ANON+'()@'+match[2]+':'+match[1]+' -- '+lines[i+1].replace(/^\s+/,''));}}return result;},other:function(curr){var ANON='{anonymous}',fnRE=/function\s*([\w\-$]+)?\s*\(/i,stack=[],fn,args,maxStackSize=10;while(curr&&curr['arguments']&&stack.length<maxStackSize){fn=fnRE.test(curr.toString())?RegExp.$1||ANON:ANON;args=Array.prototype.slice.call(curr['arguments']||[]);stack[stack.length]=fn+'('+this.stringifyArguments(args)+')';curr=curr.caller;}return stack;},stringifyArguments:function(args){var result=[];var slice=Array.prototype.slice;for(var i=0;i<args.length;++i){var arg=args[i];if(arg===undefined){result[i]='undefined';}else if(arg===null){result[i]='null';}else if(arg.constructor){if(arg.constructor===Array){if(arg.length<3){result[i]='['+this.stringifyArguments(arg)+']';}else{result[i]='['+this.stringifyArguments(slice.call(arg,0,1))+'...'+this.stringifyArguments(slice.call(arg,-1))+']';}}else if(arg.constructor===Object){result[i]='#object';}else if(arg.constructor===Function){result[i]='#function';}else if(arg.constructor===String){result[i]='"'+arg+'"';}else if(arg.constructor===Number){result[i]=arg;}}}return result.join(',');},sourceCache:{},ajax:function(url){var req=this.createXMLHTTPObject();if(req){try{req.open('GET',url,false);req.send(null);return req.responseText;}catch(e){}}return'';},createXMLHTTPObject:function(){var xmlhttp,XMLHttpFactories=[function(){return new XMLHttpRequest();},function(){return new ActiveXObject('Msxml2.XMLHTTP');},function(){return new ActiveXObject('Msxml3.XMLHTTP');},function(){return new ActiveXObject('Microsoft.XMLHTTP');}];for(var i=0;i<XMLHttpFactories.length;i++){try{xmlhttp=XMLHttpFactories[i]();this.createXMLHTTPObject=XMLHttpFactories[i];return xmlhttp;}catch(e){}}},isSameDomain:function(url){return typeof location!=="undefined"&&url.indexOf(location.hostname)!==-1;},getSource:function(url){if(!(url in this.sourceCache)){this.sourceCache[url]=this.ajax(url).split('\n');}return this.sourceCache[url];},guessAnonymousFunctions:function(stack){for(var i=0;i<stack.length;++i){var reStack=/\{anonymous\}\(.*\)@(.*)/,reRef=/^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,frame=stack[i],ref=reStack.exec(frame);if(ref){var m=reRef.exec(ref[1]);if(m){var file=m[1],lineno=m[2],charno=m[3]||0;if(file&&this.isSameDomain(file)&&lineno){var functionName=this.guessAnonymousFunction(file,lineno,charno);stack[i]=frame.replace('{anonymous}',functionName);}}}}return stack;},guessAnonymousFunction:function(url,lineNo,charNo){var ret;try{ret=this.findFunctionName(this.getSource(url),lineNo);}catch(e){ret='getSource failed with url: '+url+', exception: '+e.toString();}return ret;},findFunctionName:function(source,lineNo){var reFunctionDeclaration=/function\s+([^(]*?)\s*\(([^)]*)\)/;var reFunctionExpression=/['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function\b/;var reFunctionEvaluation=/['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(?:eval|new Function)\b/;var code="",line,maxLines=Math.min(lineNo,20),m,commentPos;for(var i=0;i<maxLines;++i){line=source[lineNo-i-1];commentPos=line.indexOf('//');if(commentPos>=0){line=line.substr(0,commentPos);}if(line){code=line+code;m=reFunctionExpression.exec(code);if(m&&m[1]){return m[1];}m=reFunctionDeclaration.exec(code);if(m&&m[1]){return m[1];}m=reFunctionEvaluation.exec(code);if(m&&m[1]){return m[1];}}}return'(?)';}};
  /****** end public domain *****/

  function cleanStackTrace(stack) {
    ////////////////////////////////////////////////////////////////
    // Input:
    //    stack = JavaScript array of JavaScript strings (the stack frames)
    // Output:
    //    answer = JavaScript array of JavaScript strings (the stack frames)
    ////////////////////////////////////////////////////////////////
    var cleanStack = [];
    var regexFilters = [/^crittercismErrorHandler/i, /^printStackTrace/i];
    for (var i = 0, l = stack.length; i < l; i++) {
      var line = stack[i];
      var filter = false;
      // run against regex filters, break if doesnt match
      for (var j = 0, r = regexFilters.length; j < r; j++) {
        if (line.match(regexFilters[j])) {
          filter = true;
          break;
        }
      }
      if (!filter) {
        cleanStack.push(line);
      }
    }
    return cleanStack;
  }

  /*
   * End stack trace stuff here
   */

  // Console Log Messages

  function printDebug(msg) {
    if (debug) {
      window.console.log("Crittercism: " + msg);
      //alert("Crittercism: " + msg);
    }
  }
  this.printDebug = printDebug;

  // Custom Error Handler

  function crittercismErrorHandler(errorMsg, url, lineNumber, col, errorObj) {
    // This is the Crittercism exception handler. We wrap window.onerror
    // with this in the init method
    try {
      var name = "Crash";
      var reason = errorMsg;
      var stack = cleanStackTrace(printStackTrace({e: errorObj || errorMsg, guess: true}));
      sendHandledException(name, reason, stack);
    } catch (e) {
    }
    return true;
  }

  // Metadata

  function Metadata(appId) {
    // IMPORTANT: the following keys are part of the wire protocol. DO NOT rename them, and DO NOT add more properties
    this.app_id = appId;
    this.metadata = {};

    function isValidKey(key) {
      return ((typeof key) == 'string');
    }

    function isValidValue(value) {
      return (((typeof value) == 'string') || ((typeof value) == 'number'));
    }

    /**
     * Replaces all of the metadata with the given metadata object.
     * @param userMetadata The object to replace data with
     * @returns {boolean} True if the metadata was changed.
     */
    this.setMetadata = function setMetadata(userMetadata) {
      var key, didMakeChanges = false;
      if ((typeof userMetadata) != 'object') {
        printDebug('Crittercism setMetadata given a parameter that is not an object: ' + userMetadata);
        return false;
      }
      // We don't blow out the username, so if userMetadata doesn't have one but appState
      // does, preserve the one in appState.
      if (this.metadata.username && !userMetadata.username) {
        userMetadata.username = this.metadata.username;
      }
      for (key in this.metadata) {
        if (!userMetadata.hasOwnProperty(key)) {
          delete this.metadata[key];
          didMakeChanges = true;
        }
      }
      // Add all of the keys to our metadata, filtering out invalid items (setValue does validation).
      for (key in userMetadata) {
        if (userMetadata.hasOwnProperty(key)) {
          if (this.setValue(key, userMetadata[key])) {
            didMakeChanges = true;
          }
        }
      }
      return didMakeChanges;
    };

    /**
     * Sets the value for the given key
     * @param key The key to set the vale of
     * @param value The value to set
     * @returns {boolean} True if the value changed
     */
    this.setValue = function setValue(key, value) {
      if (!isValidKey(key)) {
        printDebug('Crittercism setValue given a key that is not a string: ' + key);
        return false;
      }
      if (!isValidValue(value)) {
        printDebug('Crittercism setValue given a value that is not a string or a number: ' + value);
        return false;
      }
      var isNewValue = this.metadata[key] !== value;
      this.metadata[key] = value;
      return isNewValue;
    };

    /**
     * Gets the value of the given key
     * @param key A string of the usermetadata key to lookup
     * @returns {*} null if a non-string key is given, undefined if the key is not set, otherwise the value for the given key
     */
    this.getValue = function getValue(key) {
      if (!isValidKey(key)) {
        printDebug('Crittercism getValue given a key that is not a string: ' + key);
        return null;
      }
      return this.metadata[key];
    };

    /**
     * Sets the value of the special key 'username'
     * @param username The user name to set
     */
    this.setUsername = function setUsername(username) {
      if ((typeof username) != 'string') {
        printDebug('Crittercism setUsername given a name that is not a string: ' + username);
        return false;
      }
      return this.setValue('username', username);
    };

    /**
     * Gets the value of the username property
     * @returns {*} The username if it is set, otherwise return undefined
     */
    this.getUsername = function getUsername() {
      return this.getValue('username');
    };
  }

  this.Metadata = Metadata;

  // Registering Observers

  this.registerObserver = function registerObserver(options) {
    //console.log("registerObserver");
    ////////////////////////////////////////////////////////////////
    // Caller's JavaScript should do one of these:
    //Crittercism.init({appId:'######'});        // for HTML5 app
    //Crittercism.init({platform:'android'});    // for Android hybrid app
    //Crittercism.init({platform:'ios'});        // for iOS hybrid app
    ////////////////////////////////////////////////////////////////
    if ((typeof options) == "undefined") {
      options = {};
    }
    var appId = options.appId;
    if ((typeof appId) != "undefined") {
      if ((typeof observers[appId]) == "undefined") {
        options.platform = "html5";
        observers[appId] = new Html5Observer(options);
      }
    }
  };

  // Version Management

  if ((typeof Crittercism) != "undefined") {
    //console.log("Version Management");
    // Possibly, newer Crittercism library has already been loaded.
    var currentVersion = "1.0";
    try {
      currentVersion = Crittercism.getVersion();
    } catch (e) {
      // Assume an old Crittercism library version < 2.3 which
      // introduces method getVersion().  Calling it "1.0" .
    }
    if (parseFloat(getVersion()) > parseFloat(currentVersion)) {
      Crittercism = this;
    }
  }

  // Public interface starts here

  var initializing = false;
  this.init = function init(options) {
    /**
     * Initializes Crittercism
     * @param options JSON dictionary containing key value pairs
     *      appId = AppId string obtained from Crittercism for registered HTML5 app.
     *              Implies platform = "html5" for HTML5 SDK.  Omit for iOS SDK and Android SDK.
     *      appVersion = Developer-provided application version for HTML5 SDK (optional)
     *                   Omit for iOS SDK and Android SDK.
     *      platform = "html5", "android", "ios" (optional for HTML5 SDK).
     * @returns {boolean} True if successfully initialized.
     */
    try {
      printDebug("init");
      if (!initializing) {
        initializing = true;
        // Initialize "Crittercism" library if not already initialized.
        if (!libraryInitialized) {
          if ((typeof options.debug) != "undefined") {
            debug = options.debug;
          }
          printDebug("Crittercism: LIB_VERSION == " + Crittercism.getVersion());
          libraryInitialized = true;
          // Register unhandled exception handler
          var oldErrorHandler = window.onerror;
          window.onerror = function jsError(msg, url, line, col, errorObj) {
            crittercismErrorHandler(msg, url, line, col, errorObj);
            if (oldErrorHandler) {
              oldErrorHandler(msg, url, line, col, errorObj);
            }
          };
          appId = options.appId;
          printDebug("Crittercism appId == " + appId);
          metadata = new Metadata(appId);
        }
        Crittercism.registerObserver(options);
        initializing = false;
      }
    } catch (e) {
      printDebug("Crittercism init CRASHED!!!");
    }
    //console.log("libraryInitialized == "+libraryInitialized);
  };

  // Public API Methods

  function getVersion() {
    return LIB_VERSION;
  }
  this.getVersion = getVersion;

  this.getUsername = function getUsername() {
    var answer = null;
    try {
      printDebug("getUsername");
      if (libraryInitialized) {
        answer = metadata.getUsername();
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't getUsername.");
      }
    } catch (e) {
      printDebug(e);
    }
    return answer;
  };

  this.setUsername = function setUsername(username) {
    try {
      printDebug("setUsername");
      if (libraryInitialized) {
        if (metadata.setUsername(username)) {
          for (var appId in observers) {
            observers[appId].setUsername(username);
          }
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't setUsername.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.getValue = function getValue(key) {
    var answer = null;
    try {
      printDebug("getValue");
      if (libraryInitialized) {
        answer = metadata.getValue(key);
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't getValue.");
      }
    } catch (e) {
      printDebug(e);
    }
    return answer;
  };

  this.setValue = function setValue(key, value) {
    try {
      printDebug("setValue");
      if (libraryInitialized) {
        if (metadata.setValue(key, value)) {
          for (var appId in observers) {
            observers[appId].setValue(key, value);
          }
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't setValue.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.setMetadata = function setMetadata(userMetadata) {
    try {
      printDebug("setMetadata");
      if (libraryInitialized) {
        if (metadata.setMetadata(userMetadata)) {
          for (var appId in observers) {
            observers[appId].setMetadata(userMetadata);
          }
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't setMetadata.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.leaveBreadcrumb = function leaveBreadcrumb(breadcrumb) {
    try {
      printDebug("leaveBreadcrumb");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].leaveBreadcrumb(breadcrumb);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't leaveBreadcrumb.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  function sendHandledException(name, reason, stackAsString) {
    // Send gray blip
    printDebug("sendHandledException");
    if (libraryInitialized) {
      for (var appId in observers) {
        observers[appId].sendHandledException(name, reason, stackAsString);
      }
    } else {
      printDebug("Crittercism isn't initialized yet.  Can't sendHandledException.");
    }
  }

  function sendUnhandledException(name, reason, stackAsString) {
    // Send red blip, currently unused
    printDebug("sendUnhandledException");
    if (libraryInitialized) {
      for (var appId in observers) {
        observers[appId].sendUnhandledException(name, reason, stackAsString);
      }
    } else {
      printDebug("Crittercism isn't initialized yet.  Can't sendUnhandledException.");
    }
  }

  this.logNetworkRequest = function logNetworkRequest(method, url, latency, bytesRead, bytesSent, responseCode, errorCode) {
    try {
      printDebug("logNetworkRequest");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].logNetworkRequest(method, url, latency, bytesRead, bytesSent, responseCode, errorCode);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't logNetworkRequest.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  function constructorName(e) {
    // Return e.constructor's name extracted from .toString()
    // Tested on Chrome, FireFox, Safari .
    var answer = "null";
    if (e) {
      answer = e.constructor.toString();
      var p1 = answer.indexOf(" ");
      answer = answer.substring(p1 + 1);
      var p2 = answer.search(/\W/);
      answer = answer.substring(0, p2);
      if (navigator && navigator.userAgent.search("Safari") > 0) {
        // Drop "Constructor" suffix.
        var c = "Constructor";
        if (endsWith(answer, c)) {
          answer = answer.substring(0, answer.length - c.length);
        }
      }
    }
    return answer;
  }

  function dictString(e) {
    var answer = "{";
    for (var propertyName in e) {
      answer = answer + propertyName + ":" + e[propertyName] + "\n";
    }
    answer = answer + "}";
    return answer;
  }

  function truncateString(s) {
    var answer = s;
    var maxLength = 800;
    if (s.length > maxLength) {
      answer = s.substring(0, maxLength) + "...";
    }
    return answer;
  }

  this.logHandledException = function logHandledException(exception) {
    try {
      printDebug("logHandledException");
      if (libraryInitialized) {
        var name = null;
        if (exception && ((typeof exception.name) == 'string')) {
          name = exception.name;
        } else {
          name = constructorName(exception);
        }
        var reason = null;
        if (exception && ((typeof exception.message) == 'string')) {
          reason = exception.message;
        } else if ((typeof exception) == "object") {
          reason = truncateString(dictString(exception));
        } else {
          reason = "" + exception;
        }
        var stack = cleanStackTrace(printStackTrace({e: exception, guess: true}));
        printDebug(name);
        printDebug(reason);
        printDebug(stack);

        sendHandledException(name, reason, stack);
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't logHandledException.");
      }
    } catch (e) {
      printDebug(e);
    }
    return this;
  };

  this.beginTransaction = function beginTransaction(name) {
    try {
      printDebug("beginTransaction");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].beginTransaction(name);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't beginTransaction.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.endTransaction = function endTransaction(name) {
    try {
      printDebug("endTransaction");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].endTransaction(name);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't endTransaction.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.failTransaction = function failTransaction(name) {
    try {
      printDebug("failTransaction");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].failTransaction(name);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't failTransaction.");
      }
    } catch (e) {
      printDebug(e);
    }
  };

  this.setTransactionValue = function beginTransaction(name, value) {
    try {
      printDebug("setTransactionValue");
      if (libraryInitialized) {
        for (var appId in observers) {
          observers[appId].setTransactionValue(name, value);
        }
      } else {
        printDebug("Crittercism isn't initialized yet.  Can't setTransactionValue.");
      }
    } catch (e) {
      printDebug(e);
    }
  };
}

try {
  newCrittercism = new CrittercismClass();
  if ((typeof Crittercism) == "undefined") {
    Crittercism = newCrittercism;
    if(!!module) {
      module.exports = Crittercism;
    }
  }
} catch (e) {
    console.log("Crittercism: Unexpected error while loading library.");
}

