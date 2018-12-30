"use strict";

function Browserifier() {
  this.allModules = {
  };
  this.sanitizedFileNameContents = {};
  this.numLoaded = 0;
  this.numScriptsExpected = 0;
  this.browserificationCalled = false;
  //this.counterClosure = 0;
}

Browserifier.prototype.require = function (inputFileName) {
  var currentSourceBody = this.sanitizedFileNameContents[inputFileName];
  if (! (inputFileName in this.allModules)) {
    this.allModules[inputFileName] = {};
  }
  var currentModule = this.allModules[inputFileName];
  if (!currentModule.flagLoaded) {
    currentModule.flagLoaded = true;
    //this.counterClosure ++;
    //var currentClosureName = `closure${this.counterClosure}`;
    currentModule.closure = new Function('require', 'module', 'exports', currentSourceBody);
    currentModule.closure(this.require.bind(this), currentModule);
  }
  return currentModule.exports;
}

Browserifier.prototype.browserify = function() {
  var theJSContent = document.getElementsByTagName("SCRIPT");
  this.numScriptsExpected = theJSContent.length; 
  for (var i = 0; i < theJSContent.length; i ++) {
    var currentScript = theJSContent[i];
    var splitString = currentScript.src.split("/");
    var newFileName = splitString[splitString.length - 1];
    if (newFileName.endsWith('.js')) {
      newFileName = newFileName.slice(0, newFileName.length - 3);
    }
    newFileName = `./${newFileName}`;
    var http = new XMLHttpRequest();
    http.open('GET', currentScript.src, true);
    http.onload = this.callBackFetchCode.bind(this, http, newFileName);
    http.send();  
  }
}

Browserifier.prototype.browserifyPartTwo = function() {
  this.require('./generate_slides');
}

Browserifier.prototype.callBackFetchCode = function (http, fileName, input) {
  this.sanitizedFileNameContents[fileName] = http.responseText;
  this.numLoaded ++;
  if (this.numLoaded >= this.numScriptsExpected && !this.browserificationCalled) {
    this.browserificationCalled = true;
    this.browserifyPartTwo();
  }
} 

function browserify() {
  window.browserifier = new Browserifier();
  window.browserifier.browserify();
}