"use strict"

/**@type {FreeCalcElements} */
var theElements = null;

function initializeElements() {
  theElements = new FreeCalcElements();
  window.freecalc = {};
  window.freecalc.elements = theElements;
}

function FreeCalcAdditionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {HighlightedContent} */
  this.solution = null;
  /**@type {string} */
  this.topInput = "";
  /**@type {string} */
  this.bottomInput = "";
  /**@type {string} */
  this.inputBase = "";
  /**@type {ColumnsReversedHighlighted} */
  this.topNumber = null;
  /**@type {ColumnsReversedHighlighted} */
  this.bottomNumber = null;
  /**@type {ColumnsReversedHighlighted} */
  this.resultNumber = null;
  /**@type {ColumnsReversedHighlighted} */
  this.carryOvers = null;
  /**@type {HighlightedContent[][]} */
  this.intermediates = null;
  /**@type {HighlightedContent[][]} */
  this.intermediatesBaseConversions = null;
  /**@type {HighlightedContent[]} */
  this.result = null
  this.plusSign = null;
  this.startingFrameNumber = 1;
  this.base = 10;
  this.numberOfDigits = 0;
  this.currentFrameNumber = 0;
  this.problemStatement = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    top: null,
    /**@type {HighlightedContent} */
    bottom: null, 
  };
  /**@type {OperationTable} */
  this.additionTableExternal = null;
}

FreeCalcAdditionAlgorithm.prototype.getDigitSymbol = function (/**@type {number} */ input) {
  if (input >= this.base) {
    return input;
  }
  if (input < 10) {
    return input;
  }
  if (input - 9 > 25) {
    return input;
  }
  return String.fromCharCode((input - 10) + 'a'.charCodeAt(0));
}

function ColumnsReversedHighlighted(
  /** @type {String|String[]} */ 
  input
) {
  /** @type {HighlightedContent[]} */
  this.digits = [];
  if (Array.isArray(input)) {
    this.input = "";
    for (var i = 0; i < input.length; i ++) {
      this.digits.push(new HighlightedContent({content: input[i]}));
    }
  } else {
    this.inputString = input;
    this.sanitizeInput();
  } 
  this.digitPrefix = "";
  this.digitSuffix = "";
  /** @type {number} */
  this.extraColumnsStart = 0;
}

ColumnsReversedHighlighted.prototype.isGreaterThanOrEqualTo = function (/**@type {ColumnsReversedHighlighted} */ other) {
  if (this.digits.length > other.digits.length) {
    return true;
  }
  return this.hasGreaterThanOrEqualToStart(other);
}

ColumnsReversedHighlighted.prototype.hasGreaterThanOrEqualToStart = function (/**@type {ColumnsReversedHighlighted} */ other) {
  var numberOfDigits = this.getNumberSignificantDigits();
  var otherNumberOfDigits = other.getNumberSignificantDigits();
  if (numberOfDigits < otherNumberOfDigits) {
    return false;
  }
  for (var counter = otherNumberOfDigits - 1; counter >= 0; counter --) {
    var leftDigit = this.digits[numberOfDigits - otherNumberOfDigits + counter].getDigit();
    var rightDigit = other.digits[counter].getDigit();
    if (leftDigit > rightDigit) {
      return true;
    }
    if (leftDigit < rightDigit) {
      return false;
    }
  }
  return true;
}

ColumnsReversedHighlighted.prototype.greaterThan = function (/**@type {ColumnsReversedHighlighted} */ other) {
  var numberOfDigits = this.getNumberSignificantDigits();
  var otherNumberOfDigits = other.getNumberSignificantDigits();
  if (numberOfDigits > otherNumberOfDigits) {
    return true;
  }
  if (numberOfDigits < otherNumberOfDigits) {
    return false;
  }
  for (var counter = numberOfDigits - 1; counter >= 0; counter --) {
    var leftDigit = this.digits[counter].getDigit();
    var rightDigit = other.digits[counter].getDigit();
    if (leftDigit > rightDigit) {
      return true;
    }
    if (leftDigit < rightDigit) {
      return false;
    }
  }
  return false;
}

ColumnsReversedHighlighted.prototype.getNumberSignificantDigits = function () {
  for (var counter = this.digits.length - 1; counter >= 0; counter --) {
    var potentialResult = this.digits[counter].getDigit();
    if (potentialResult !== undefined) {
      if (potentialResult > 0) {
        return counter + 1;
      }
    }
  }
  return 0;
}

ColumnsReversedHighlighted.prototype.getDigit = function (integerIndex) {
  if (integerIndex >= this.digits.length) {
    return 0;
  }
  return this.digits[integerIndex].getDigit();
}

ColumnsReversedHighlighted.prototype.allocateDigits = function(numberOfDigits) {
  for (var i = 0; i < numberOfDigits; i ++) {
    this.digits[i] = new HighlightedContent();
  }  
}

ColumnsReversedHighlighted.prototype.fillGaps = function(/**@type {HighlightedContent} */ input) {
  for (var i = 0; i < this.digits.length; i ++) {
    if (this.digits[i] === null || this.digits[i] === undefined) {
      this.digits[i] = input;
      continue;
    } 
    if (this.digits[i].getDigit() === undefined) {
      this.digits[i] = input;
      continue;
    }
  }  
}

/** @returns {boolean} */
ColumnsReversedHighlighted.prototype.hasGaps = function() {
  for (var i = 0; i < this.digits.length; i ++) {
    if (this.digits[i] === null || this.digits[i] === undefined) {
      return true;
    }
    if (this.digits[i] instanceof HighlightedContent) { 
      if (this.digits[i].getDigit() === undefined) {
        return true;
      }
    }
  }
  return false;
}

ColumnsReversedHighlighted.prototype.highlightAll = function(frameNumber) {
  if (typeof frameNumber !== "number") {
    throw `Error: highlight all called with non-number argument: ${frameNumber}`;
  }
  for (var i = 0; i < this.digits.length; i ++) {
    if (this.digits[i] === null || this.digits[i] === undefined) {
      continue;
    }
    if (! this.digits[i] instanceof HighlightedContent) {
      continue;
    }
    this.digits[i].highlightFrames.push(frameNumber);
  }  
}

ColumnsReversedHighlighted.prototype.hideAll = function(frameNumber) {
  for (var i = 0; i < this.digits.length; i ++) {
    if (this.digits[i] === null || this.digits[i] === undefined) {
      continue;
    }
    if (!(this.digits[i] instanceof HighlightedContent)) {
      continue;
    }
    this.digits[i].hideFrame = frameNumber;
  }  
}

ColumnsReversedHighlighted.prototype.setAnswerFrame = function(frameNumber) {
  for (var i = 0; i < this.digits.length; i ++) {
    this.digits[i].answerFrame = frameNumber;
  }
}

ColumnsReversedHighlighted.prototype.setShowFrame = function(frameNumber) {
  for (var i = 0; i < this.digits.length; i ++) {
    if (!(this.digits[i] instanceof HighlightedContent)) {
      continue;
    } 
    this.digits[i].showFrame = frameNumber;
  }
}

ColumnsReversedHighlighted.prototype.highlightDigitOnFrame = function(integerIndex, frameNumber) {
  if (integerIndex >= this.digits.length) {
    return;
  }
  return this.digits[integerIndex].highlightFrames.push(frameNumber);
}

ColumnsReversedHighlighted.prototype.getTableRow = function(numExtraColumns, separator) {
  var result = "";
  if (separator === undefined || separator === null) {
    separator = "&";
  }
  var numExtraColumnsAdjusted = numExtraColumns + this.extraColumnsStart;
  for (var counterColumn = 0; counterColumn < numExtraColumnsAdjusted; counterColumn ++) {
    result += separator;
  }
  for (var counterColumn = 0; counterColumn < this.digits.length; counterColumn ++) {
    var indexCurrent = this.digits.length - 1 - counterColumn; 
    if (this.digits[indexCurrent] !== undefined) {
      if (!this.digits[indexCurrent].isEmpty()) {
        result += this.digitPrefix + this.digits[indexCurrent].toString() + this.digitSuffix; 
      }
    }
    if (counterColumn !== this.digits.length - 1) {
      result += separator;
    }
  }
  return result;
}

ColumnsReversedHighlighted.prototype.getTableArrayHighlightedContent = function(numExtraColumns) {
  var result = [];
  var numExtraColumnsAdjusted = numExtraColumns + this.extraColumnsStart;
  for (var counterColumn = 0; counterColumn < numExtraColumnsAdjusted; counterColumn ++) {
    result.push("&");
  }
  for (var counterColumn = 0; counterColumn < this.digits.length; counterColumn ++) {
    var indexCurrent = this.digits.length - 1 - counterColumn; 
    if (this.digits[indexCurrent] !== undefined) {
      if (!this.digits[indexCurrent].isEmpty()) {
        result.push(this.digitPrefix);
        result.push(this.digits[indexCurrent]);
        result.push(this.digitSuffix); 
      }
    }
    result.push("&");
  }
  return result;
}

/**
 * @returns {HighlightedContent}
 */
ColumnsReversedHighlighted.prototype.leadingColumnContainer = function () {
  return this.digits[this.digits.length - 1];
}

/**
 * @returns {HighlightedContent}
 */
ColumnsReversedHighlighted.prototype.constDigit = function () {
  return this.digits[0];
}

ColumnsReversedHighlighted.prototype.removeLeadingZeroesAccountRemovedAsExtraColumns = function() {
  for (var i = this.digits.length - 1; i > 0; i --) {
    var currentDigit = this.digits[i].getDigit(); 
    if (currentDigit === undefined || currentDigit === 0) {
      this.digits.length --;
      this.extraColumnsStart ++;
      continue;
    }
    break;
  }
}

ColumnsReversedHighlighted.prototype.sanitizeInput = function () {
  if (typeof this.inputString !== "string") {
    this.inputString = "";
  }
  this.digits = [];
  for (var counter = this.inputString.length - 1; counter >= 0; counter --) {
    if (this.inputString[counter] < "0") {
      continue;
    }
    if (this.inputString[counter] > "9") {
      continue;
    }
    var theDigit = this.inputString[counter] - '0';
    var currentDigit = new HighlightedContent({content: theDigit});
    this.digits.push(currentDigit);
  }
}

function OneDigitSubtractionWithCarryOver(
  /**@type {{base: number, top: HighlightedContent, bottom: HighlightedContent, startingFrame: number, newCarryOver: HighlightedContent, oldCarryOver: HighlightedContent, resultDigit: HighlightedContent, useColumns: boolean}} */
  inputData
) {
  /** @type {boolean} */
  this.flagIsNonTrivial = true;
  this.base = inputData.base;
  /** @type {HighlightedContent} */
  this.topInput = inputData.top;
  /** @type {HighlightedContent} */
  this.top = null;
  /** @type {HighlightedContent} */
  this.bottomInput = inputData.bottom;
  /** @type {HighlightedContent} */
  this.resultDigitInput = inputData.resultDigit;
  /** @type {HighlightedContent} */
  this.resultDigit = null;
  /** @type {number} */
  this.startingFrame = inputData.startingFrame;
  /** @type {number} */
  this.endFrame = this.startingFrame;
  if (this.bottomInput === undefined || this.bottomInput === null) {
    if (inputData.oldCarryOver === null || inputData.oldCarryOver === undefined) {
      this.flagIsNonTrivial = false;
      return;
    }
    if (inputData.oldCarryOver.getDigit() === undefined || inputData.oldCarryOver.getDigit() === null || inputData.oldCarryOver.getDigit() === 0) {
      this.flagIsNonTrivial = false;
      return;
    }
  }

  if (this.bottomInput === null || this.bottomInput === undefined) {
    this.bottomInput = new HighlightedContent(0);
  }
  /** @type {HighlightedContent} */
  this.bottom = null;
  /** @type {HighlightedContent} */
  this.newCarryOver = inputData.newCarryOver;
  /** @type {HighlightedContent} */
  this.newCarryOverExtraZero = null;
  /** @type {HighlightedContent} */
  this.resultDigitNegative = null;
  /** @type {HighlightedContent} */
  this.rightHandSidePlus = null;
  /** @type {boolean} */
  this.flagUseColumns = inputData.useColumns;
  this.newCarryOverContent = 0;
  if (this.newCarryOver !== null && this.newCarryOver !== undefined) {
    this.newCarryOverContent = this.newCarryOver.getDigit();
  }
  this.oldCarryOver = inputData.oldCarryOver;
  /** @type {HighlightedContent} */
  this.content = null;
  /** @type {HighlightedContent} */
  this.leftHandSide = null;
  /** @type {HighlightedContent} */
  this.equalityFirst = null;
  /** @type {HighlightedContent} */
  this.equalitySecond = null;
  /** @type {HighlightedContent} */
  this.rightHandSide = null;
  if (typeof this.top === "number") {
    this.top = new HighlightedContent(this.top);
  }
  if (typeof this.bottom === "number") {
    this.bottom = new HighlightedContent(this.bottom);
  }
  if (this.startingFrame === undefined || this.startingFrame === null) {
    this.startingFrame = 1;
  } 
}

OneDigitSubtractionWithCarryOver.prototype.computeContent = function () {
  this.content = new HighlightedContent();
  if (!this.flagIsNonTrivial) {
    return;
  }
  if (!this.flagUseColumns) {
    this.content.push("<br><br>\\hfil\\hfil$");
  }
  this.leftHandSide = new HighlightedContent();
  this.equalityFirst = new HighlightedContent("=")
  this.rightHandSide = new HighlightedContent();
  this.top = new HighlightedContent(this.topInput.getDigit());
  this.bottom = new HighlightedContent(this.bottomInput.getDigit());
  this.resultDigit = new HighlightedContent(this.resultDigitInput.getDigit());
  this.content.push(this.leftHandSide);
  if (this.flagUseColumns) {
    this.content.push(" & ");
  }
  this.content.push(this.equalityFirst);
  if (this.flagUseColumns) {
    this.content.push(" & ");
  }
  this.content.push(this.rightHandSide);
  var oldCarryOverContent = 0;
  if (this.oldCarryOver !== undefined && this.oldCarryOver !== null) {
    oldCarryOverContent = this.oldCarryOver.getDigit(); 
    if (oldCarryOverContent !== 0 && oldCarryOverContent !== undefined) {
      this.leftHandSide.push(this.oldCarryOver);
      this.leftHandSide.push(new HighlightedContent("+"));
    } else {
      oldCarryOverContent = 0;
    }
  }
  this.leftHandSide.push(this.top);
  this.leftHandSide.push("-");
  this.leftHandSide.push (this.bottom);
  this.resultDigitNegative = null;
  if (this.base === 10) {
    if (this.newCarryOver !== undefined && this.newCarryOver !== null) {
      var theDigit = this.newCarryOver.getDigit(); 
      if (theDigit !== 0 && theDigit !== undefined) {
        this.newCarryOverExtraZero = new HighlightedContent(0);
      }
    }
    if (this.newCarryOverExtraZero !== null) {
      this.resultDigitNegative = new HighlightedContent(this.top.getDigit() - this.bottom.getDigit() + oldCarryOverContent);
      this.rightHandSide.push(this.resultDigitNegative);
      this.equalitySecond = new HighlightedContent("=");
      this.rightHandSide.push(this.equalitySecond)
      this.rightHandSide.push(this.newCarryOver);
      this.rightHandSide.push(this.newCarryOverExtraZero);
      this.rightHandSidePlus = new HighlightedContent("+");
      this.rightHandSide.push(this.rightHandSidePlus);
      this.rightHandSide.push(this.resultDigit);
    } else {
      this.rightHandSide.push(this.resultDigit);
    }
  } 
  if (!this.flagUseColumns) {
    this.content.push("$");
  } else {
    this.content.push(" \\\\ ");
  }
}

OneDigitSubtractionWithCarryOver.prototype.highlightContent = function () {
  if (!this.flagIsNonTrivial) {
    this.resultDigitInput.showFrame = this.startingFrame;
    this.resultDigitInput.highlightFrames.push(this.startingFrame);
    this.topInput.highlightFrames.push(this.startingFrame);
    this.endFrame = this.startingFrame;
    return;
  }
  this.content.showFrame = this.startingFrame;
  if (this.oldCarryOver !== null && this.oldCarryOver !== undefined) {
    if (this.oldCarryOver.getDigit() !== 0) {
      this.oldCarryOver.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
    }
  }
  this.leftHandSide.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.equalityFirst.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.topInput.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.top.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.bottom.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.bottomInput.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.endFrame = this.startingFrame + 1;
  this.resultDigit.answerFrame = this.startingFrame + 1;
  this.resultDigitInput.answerFrame = this.startingFrame + 1;
  if (this.resultDigitNegative !== null) {
    this.resultDigitNegative.answerFrame = this.startingFrame + 1;

    this.equalitySecond.showFrame = this.startingFrame + 2;
    this.equalitySecond.highlightFrames.push(this.startingFrame + 2, this.startingFrame + 3);

    this.newCarryOverExtraZero.showFrame = this.startingFrame + 2;
    this.rightHandSidePlus.showFrame = this.startingFrame + 2;
    this.newCarryOver.showFrame = this.startingFrame + 2;

    this.newCarryOver.highlightFrames.push(this.startingFrame + 2, this.startingFrame + 3);
    this.rightHandSidePlus.highlightFrames.push(this.startingFrame + 2, this.startingFrame + 3);
    this.resultDigitNegative.highlightFrames.push(this.startingFrame + 2, this.startingFrame + 3);
    this.newCarryOverExtraZero.highlightFrames.push(this.startingFrame + 2, this.startingFrame + 3);
    this.resultDigit.answerFrame = this.startingFrame + 3;
    this.resultDigitInput.answerFrame = this.startingFrame + 3;

    this.resultDigit.highlightFrames.push(this.startingFrame + 4);
    this.resultDigitInput.highlightFrames.push(this.startingFrame + 4);
    this.newCarryOver.highlightFrames.push(this.startingFrame + 5);
    this.endFrame = this.startingFrame + 5;
  } 
}

/**  
 * @returns {HighlightedContent} 
 * */
OneDigitSubtractionWithCarryOver.prototype.getContentNoHighlight = function () {
  this.computeContent();
  return this.content;
}

function OneDigitMultiplicationWithCarryOverSplit(
  /**@type {{base: number, left: HighlightedContent, right: HighlightedContent, startingFrame: number, newCarryOver: HighlightedContent, oldCarryOver: HighlightedContent, resultDigit: HighlightedContent, useColumns: boolean}}*/ 
  inputData
) {
  this.base = inputData.base;
  this.left = inputData.left; 
  this.right = inputData.right;
  this.flagUseColumns = inputData.useColumns;
  /** @type {HighlightedContent} */
  this.newCarryOver = inputData.newCarryOver;
  this.newCarryOverContent = 0;
  if (this.newCarryOver !== null && this.newCarryOver !== undefined) {
    this.newCarryOverContent = this.newCarryOver.getDigit();
  }
  this.oldCarryOver = inputData.oldCarryOver;
  this.resultDigit = inputData.resultDigit;
  this.startingFrame = inputData.startingFrame;
  this.endFrame = this.startingFrame;
  /** @type {HighlightedContent} */
  this.content = null;
  /** @type {HighlightedContent} */
  this.leftHandSide = null;
  /** @type {HighlightedContent} */
  this.equalityFirst = null;
  /** @type {HighlightedContent} */
  this.rightHandSide = null;
  if (typeof this.left === "number") {
    this.left = new HighlightedContent(this.left);
  }
  if (typeof this.right === "number") {
    this.right = new HighlightedContent(this.right);
  }
  if (this.startingFrame === undefined || this.startingFrame === null) {
    this.startingFrame = 1;
  } 
}

OneDigitMultiplicationWithCarryOverSplit.prototype.computeContent = function () {
  this.content = new HighlightedContent();
  if (!this.flagUseColumns) {
    this.content.push("<br><br>\\hfil\\hfil$");
  }
  this.leftHandSide = new HighlightedContent();
  this.equalityFirst = new HighlightedContent("=")
  this.rightHandSide = new HighlightedContent();
  this.content.push(this.leftHandSide);
  if (this.flagUseColumns) {
    this.content.push("&");
  }
  this.content.push(this.equalityFirst);
  if (this.flagUseColumns) {
    this.content.push("&");
  }
  this.content.push(this.rightHandSide);
  if (this.left !== null && this.left !== undefined) {
    if (this.left.getDigit() !== undefined) {
      this.leftHandSide.push(this.left);
      this.leftHandSide.push("\\cdot");
    }
  }
  this.leftHandSide.push (this.right);
  if (this.oldCarryOver !== null && this.oldCarryOver !== undefined) {
    if (this.oldCarryOver.getDigit() !== 0) {
      if (this.left !== null && this.left !== undefined) {
        if (this.left.getDigit() !== undefined) {
          this.leftHandSide.push("+");
        }
      }
      this.leftHandSide.push(this.oldCarryOver);
    } 
  }
  if (this.base === 10) {
    if (this.newCarryOver !== undefined && this.newCarryOver !== null) {
      if (this.newCarryOver.getDigit() !== 0) {
        this.rightHandSide.push(this.newCarryOver);
      }
    }
    this.rightHandSide.push(this.resultDigit);
  } 
  if (this.flagUseColumns) {
    this.content.push("\\\\");
  } else {
    this.content.push("$");
  }
}

OneDigitMultiplicationWithCarryOverSplit.prototype.highlightContent = function () {
  if (this.content === null) {
    this.computeContent();
  }
  this.content.showFrame = this.startingFrame;
  if (this.right === undefined || this.left === undefined) {
    return;
  }
  if (this.oldCarryOver !== null && this.oldCarryOver !== undefined) {
    if (this.oldCarryOver.getDigit() !== 0) {
      this.oldCarryOver.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
    }
  }
  this.leftHandSide.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.equalityFirst.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.left.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.right.highlightFrames.push(this.startingFrame, this.startingFrame + 1);
  this.rightHandSide.answerFrame = this.startingFrame + 1;
  this.resultDigit.answerFrame = this.startingFrame + 1;
  this.endFrame = this.startingFrame + 1;
  if (this.newCarryOverContent !== 0) {
    this.newCarryOver.answerFrame = this.startingFrame + 1;
    this.resultDigit.highlightFrames.push(this.startingFrame + 2);
    this.newCarryOver.highlightFrames.push(this.startingFrame + 3);
    this.endFrame = this.startingFrame + 3;
  }
}

function HighlightedContent(
  /** @type {{content: any, useOnly: boolean, showFrame: number, hideFrame: number, answerFrame: number}} */ 
  input
) {
  /** @type {HighlightedContent[]} */
  this.content = [];
  /**@type {Number[]} */
  this.highlightFrames = [];
  this.redFrames = [];
  this.answerFrame = - 1;
  this.questionMarkFrame = - 1;
  this.showFrame = - 1; 
  this.hideFrame = - 1; 
  this.flagUseOnly = false;
  if (typeof input === "string" || typeof input === "number") {
    this.content.push(input);
    return;
  }
  if (input === undefined) {
    return;
  }
  this.content = input.content;
  if (input.questionMarkFrame != undefined) {
    this.questionMarkFrame = input.questionMarkFrame;
  }
  if (input.highlightFrames !== undefined) {
    this.highlightFrames = input.highlightFrames.slice();
  }
  if (input.answerFrame !== undefined) {
    this.answerFrame = input.answerFrame;
  }
  if (input.hideFrame !== undefined) {
    this.hideFrame = input.hideFrame;
  }
  if (input.showFrame !== undefined) {
    this.showFrame = input.showFrame;
  }
  if (input.useOnly !== undefined) {
    this.flagUseOnly = input.useOnly;
  }
}

/**@returns {boolean} */
HighlightedContent.prototype.hasHighlight = function() {
  if (this.showFrame > 0 ) {
    return true;
  }
  if (this.answerFrame > 0) {
    return true;
  }
  if (this.highlightFrames.length > 0) {
    return true;
  }
  return false;
}

HighlightedContent.prototype.isEmpty = function () {
  if (typeof this.content === "string") {
    return this.content === "";
  }
  if (this.content === null || this.content === undefined) {
    return true;
  }
  if (Array.isArray(this.content)) {
    return this.content.length === 0;
  }
  return false;
}

HighlightedContent.prototype.pushArray = function(input) {
  if (! Array.isArray(input)) {
    throw ("HighlightedContent.prototype.pushArray called on a non-array. ");
  }
  for (var i = 0; i < input.length; i ++) {
    this.content.push(input[i]);
  }
}

HighlightedContent.prototype.push = function(input) {
  if (input === null || input === undefined) {
    return;
  }
  this.content.push(input);
}

HighlightedContent.prototype.getDigit = function () {
  var digitContainer = this.getDigitContainer();
  if (digitContainer === undefined) {
    return undefined;
  }
  if (typeof digitContainer.content === "number") {
    return digitContainer.content;
  }
  if (Array.isArray(digitContainer.content)) {
    for (var i = 0; i < digitContainer.content.length; i ++) {
      if (typeof this.content[i] === "number") {
        return this.content[i];
      }
    }
  }
  return undefined;
}

HighlightedContent.prototype.getDigitContainer = function () {
  if (typeof this.content === "number") {
    return this;
  }
  if (Array.isArray(this.content)) {
    for (var i = 0; i < this.content.length; i ++) {
      var currentCandidate = this.content[i];
      if (typeof currentCandidate === "number") {
        return this;
      }
      if (typeof currentCandidate === "object") {
        currentCandidate = currentCandidate.getDigitContainer();
        if (currentCandidate !== undefined) {
          return currentCandidate;
        }
      }
    }
  }
  return undefined;
}

HighlightedContent.prototype.toString = function () {
  var result = "";
  if (this.content === "") {
    return result;
  }
  var highlightFramesBeforeAnswerFrame = [];
  if (this.answerFrame >= 0) {
    for (var i = 0; i < this.highlightFrames.length; i ++ ) {
      if (this.highlightFrames[i] < this.answerFrame) {
        highlightFramesBeforeAnswerFrame.push (this.highlightFrames[i]);
      }
    }
    if (highlightFramesBeforeAnswerFrame.length > 0) {
      result += "\\alertNoH{";
      result += highlightFramesBeforeAnswerFrame.join(", ");
      result += "}{{";
    }
    if (this.questionMarkFrame < 0) {
      result += `\\fcAnswer{${this.answerFrame}}{{`;
    } else {
      result += `\\fcAnswerUncover{${this.questionMarkFrame}}{${this.answerFrame}}{{`;
    }
  }
  if (this.showFrame >= 0 || this.hideFrame >= 0) {
    if (!this.flagUseOnly) {
      result += `\\uncover<`;
    } else {
      result += "\\onlyNoH{";
    }
    if (this.showFrame >= 0) { 
      result += this.showFrame;
    }
    result += "-";
    if (this.hideFrame >= 0) { 
      result += `${this.hideFrame - 1}`;
    }
    if (!this.flagUseOnly) {
      result += ">{";
    } else {
      result += `}{`;
    }
  }

  if (this.redFrames.length > 0) {
    result += `\\onlyNoH{${this.redFrames.join(", ")}}{\\color{red}}`;
  }
  if (this.highlightFrames.length > 0) {
    //console.log("DEBUG: Highlight frames: " + this.highlightFrames);
    result += "\\alertNoH{";
    result += this.highlightFrames.join(", ");
    //for (var counterHighlight = 0; counterHighlight < this.highlightFrames.length; counterHighlight ++) {
    //  result += this.highlightFrames[counterHighlight];
    //  if (counterHighlight != this.highlightFrames.length - 1) {
    //    result += ", ";
    //  }
    //}
    result += "}{{";
  }
  if (!Array.isArray(this.content)) {
    result += this.content;
  } else {
    for (var counter = 0; counter < this.content.length; counter ++) {
      if (typeof (this.content[counter]) === "object") {
        result += this.content[counter].toString();
      } else {
        result += this.content[counter];
      }
    }
  }
  if (this.highlightFrames.length > 0) {
      result += "}}";
  }
  if (this.redFrames.length > 0) {
    result += `\\onlyNoH{${this.redFrames.join(", ")}}{\\color{black}}`;
  }
  if (this.showFrame >= 0 || this.hideFrame >= 0) {
    result += `}`;
}
if (this.answerFrame >= 0) {
    result += "}}";
    if (highlightFramesBeforeAnswerFrame.length > 0) {
      result += "}}";
    }
  }
  return result;
}

FreeCalcAdditionAlgorithm.prototype.processColumnBase10 = function(
  topDigit, 
  bottomDigit, 
  carryOverOld,
  /**@type {HighlightedContent} */ 
  carryOverOldContent,
  /**@type {HighlightedContent} */ 
  topContent,
  /**@type {HighlightedContent} */ 
  bottomContent,
  /**@type {HighlightedContent} */ 
  resultDigitContent,
  /**@type {HighlightedContent} */ 
  carryOverContent,
  /**@type {HighlightedContent} */ 
  intermediateContent,
  /**@type {HighlightedContent} */
  plusSign,
) {
  var carryOver = 0;
  var digitSum = topDigit + bottomDigit + carryOverOld;
  if (digitSum >= this.base) {
    carryOver = 1;
    carryOverContent.content = 1;
  }
  var nextDigit = (topDigit + bottomDigit + carryOverOld) % this.base;
  intermediateContent.flagUseOnly = true;
  intermediateContent.showFrame = this.currentFrameNumber;
  if (topContent !== undefined) {
    topContent.content = topDigit;
    topContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }
  if (bottomContent !== undefined) {
    bottomContent.content = bottomDigit;
    bottomContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }
  resultDigitContent.content = this.getDigitSymbol(nextDigit);
  resultDigitContent.questionMarkFrame = this.currentFrameNumber;
  resultDigitContent.highlightFrames.push(this.currentFrameNumber + 2);
  carryOverContent.highlightFrames.push(this.currentFrameNumber + 3);
  plusSign.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  intermediateContent.content = [];
  var leftSide = new HighlightedContent();
  leftSide.content = [];
  leftSide.highlightFrames.push(this.currentFrameNumber);
  if (carryOverOld > 0) {
    carryOverOldContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    leftSide.content.push(carryOverOldContent);
    leftSide.content.push(` + `);
  }
  if (topContent !== undefined) {
    leftSide.content.push(topContent);
    leftSide.content.push(" + ");
  }
  if (bottomContent !== undefined) {
    leftSide.content.push(bottomContent);
  }
  leftSide.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  var middle = new HighlightedContent();
  middle.content = " = ";
  middle.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  middle.showFrame = this.currentFrameNumber ;
  var rightSide = new HighlightedContent();
  var resultWithCarryOver = new HighlightedContent();
  resultWithCarryOver.answerFrame = this.currentFrameNumber + 1;
  carryOverContent.answerFrame = this.currentFrameNumber + 1;
  resultDigitContent.answerFrame = this.currentFrameNumber + 1;
  resultWithCarryOver.content = [carryOverContent, resultDigitContent];
  rightSide.content.push(resultWithCarryOver);
  
  if (this.additionTableExternal !== null && carryOverOld === 0) {
    this.additionTableExternal.operationSign.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    this.additionTableExternal.contentOperation[topDigit][bottomDigit].answerFrame = this.currentFrameNumber + 1;
    this.additionTableExternal.rowLabels[topDigit].highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    this.additionTableExternal.columnLabels[bottomDigit].highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }

  intermediateContent.content = [leftSide, middle, rightSide];
  this.currentFrameNumber += 3 + carryOver;
  intermediateContent.hideFrame = this.currentFrameNumber;
}

FreeCalcAdditionAlgorithm.prototype.processColumnNonBase10 = function(
  topDigit, 
  bottomDigit, 
  carryOverOld,
  /**@type {HighlightedContent} */ 
  carryOverOldContent,
  /**@type {HighlightedContent} */ 
  topContent,
  /**@type {HighlightedContent} */ 
  bottomContent,
  /**@type {HighlightedContent} */ 
  resultDigitContent,
  /**@type {HighlightedContent} */ 
  carryOverContent,
  /**@type {HighlightedContent} */ 
  intermediateContent,
  /**@type {HighlightedContent} */ 
  intermediateBaseConversion,
  /**@type {HighlightedContent} */
  plusSign,
) {
  var carryOver = 0;
  var digitSum = topDigit + bottomDigit + carryOverOld;
  if (digitSum >= this.base) {
    carryOver = 1;
    carryOverContent.content = 1;
  }
  var nextDigit = (topDigit + bottomDigit + carryOverOld) % this.base;
  intermediateContent.flagUseOnly = true;
  intermediateContent.showFrame = this.currentFrameNumber;
  if (topContent !== undefined) {
    topContent.content = topDigit;
    topContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  }
  if (bottomContent !== undefined) {
    bottomContent.content = bottomDigit;
    bottomContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  }
  resultDigitContent.content = this.getDigitSymbol(nextDigit);
  resultDigitContent.questionMarkFrame = this.currentFrameNumber;
  resultDigitContent.highlightFrames.push(this.currentFrameNumber + 4);
  carryOverContent.highlightFrames.push(this.currentFrameNumber + 5);
  plusSign.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  intermediateContent.content = [];
  var leftSide = new HighlightedContent();
  leftSide.content = [];
  leftSide.highlightFrames.push(this.currentFrameNumber);
  if (carryOverOld > 0) {
    carryOverOldContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
    leftSide.content.push(carryOverOldContent);
    leftSide.content.push(` + `);
  }
  if (topContent !== undefined) {
    leftSide.content.push(topContent);
    leftSide.content.push("+");
  }
  if (bottomContent !== undefined) {
    leftSide.content.push(bottomContent);
  }
  leftSide.content.push("=");
  leftSide.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  var middle = new HighlightedContent();
  middle.content = [];    
  var rightDecimal = new HighlightedContent();
  rightDecimal.content = `\\underbrace{\\overline{${digitSum}} }_{\\text{base }10}`;
  if (digitSum >= 10 || digitSum >= this.base) {
    intermediateBaseConversion.content = [];
    intermediateBaseConversion.content.push(`Because $${digitSum} =`);
    if (digitSum >= this.base) {
      intermediateBaseConversion.content.push(carryOverContent);
      intermediateBaseConversion.content.push(`\\cdot ${this.base} + `);
      intermediateBaseConversion.content.push(resultDigitContent);
      intermediateBaseConversion.content.push("$");
      intermediateBaseConversion.hideFrame = this.currentFrameNumber + 6;
    } else {
      intermediateBaseConversion.content.push(resultDigitContent);
      intermediateBaseConversion.content.push("$");
      intermediateBaseConversion.hideFrame = this.currentFrameNumber + 5;
    }
    intermediateBaseConversion.flagUseOnly = true;
    intermediateBaseConversion.showFrame = this.currentFrameNumber + 3;
    intermediateBaseConversion.highlightFrames.push(this.currentFrameNumber + 3);
  }
  rightDecimal.showFrame = this.currentFrameNumber + 1;
  rightDecimal.answerFrame = this.currentFrameNumber + 1;
  rightDecimal.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  middle.content.push(rightDecimal);
  var equality = new HighlightedContent();
  equality.content = "=";
  equality.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  equality.showFrame = this.currentFrameNumber + 2;
  middle.content.push(equality);
  var rightSide = new HighlightedContent();
  rightSide.content = [];
  rightSide.showFrame = this.currentFrameNumber + 2;
  rightSide.content.push("\\underbrace{ ");
  rightSide.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  var resultWithCarryOver = new HighlightedContent();
  resultWithCarryOver.answerFrame = this.currentFrameNumber + 3;
  carryOverContent.answerFrame = this.currentFrameNumber + 3;
  resultDigitContent.answerFrame = this.currentFrameNumber + 3;
  resultWithCarryOver.content = [carryOverContent, resultDigitContent];
  rightSide.content.push(resultWithCarryOver);
  rightSide.content.push(`}_{\\text{base } ${this.base}}`);    
  intermediateContent.content = [leftSide, middle, rightSide];
  intermediateContent.hideFrame = this.currentFrameNumber + 5 + carryOver;
  this.currentFrameNumber += 5 + carryOver;
}

FreeCalcAdditionAlgorithm.prototype.toString = function () {
  if (this.slideContent === null) {
    return "(uninitialized)";
  }
  return this.slideContent.toString();
}

FreeCalcAdditionAlgorithm.prototype.computeResultDigits = function () {
  this.resultNumber = new ColumnsReversedHighlighted();
  this.carryOvers = new ColumnsReversedHighlighted();
  this.carryOvers.digits.push(new HighlightedContent({content: ""}));
  this.carryOvers.digitPrefix = "\\text{\\tiny{$";
  this.carryOvers.digitSuffix = "$}}";
  this.intermediates = [];
  this.intermediatesBaseConversions = [];
  var carryOver = 0;
  this.currentFrameNumber ++;
  this.plusSign = new HighlightedContent({content: "+"})
  for (var counterInteger = 0; counterInteger < this.numberOfDigits; counterInteger ++) {
    var topDigit = this.topNumber.getDigit(counterInteger);
    var bottomDigit = this.bottomNumber.getDigit(counterInteger);
    this.intermediates.push(new HighlightedContent());
    this.carryOvers.digits.push(new HighlightedContent());
    this.resultNumber.digits.push(new HighlightedContent());
    this.intermediatesBaseConversions.push(new HighlightedContent());
    if (this.base !== 10 && this.base !== "10") {
      this.processColumnNonBase10(
        topDigit, bottomDigit, carryOver, 
        this.carryOvers.digits[this.carryOvers.digits.length - 2],
        this.topNumber.digits[counterInteger], 
        this.bottomNumber.digits[counterInteger],
        this.resultNumber.digits[counterInteger],
        this.carryOvers.digits[this.carryOvers.digits.length - 1],
        this.intermediates[this.intermediates.length - 1],
        this.intermediatesBaseConversions[this.intermediatesBaseConversions.length - 1],
        this.plusSign
      );
    } else {
      this.processColumnBase10(
        topDigit, bottomDigit, carryOver, 
        this.carryOvers.digits[this.carryOvers.digits.length - 2],
        this.topNumber.digits[counterInteger], 
        this.bottomNumber.digits[counterInteger],
        this.resultNumber.digits[counterInteger],
        this.carryOvers.digits[this.carryOvers.digits.length - 1],
        this.intermediates[this.intermediates.length - 1],
        this.plusSign
      );
    }
    if (carryOver + topDigit + bottomDigit >= this.base) {
      carryOver = 1;
    } else {
      carryOver = 0;
    }
  }
  if (carryOver > 0) {
    var finalDigit = new HighlightedContent();
    this.carryOvers.digits[this.carryOvers.digits.length - 1].highlightFrames.push(this.currentFrameNumber);
    finalDigit.content =  this.carryOvers.digits[this.carryOvers.digits.length - 1].content;
    finalDigit.showFrame = this.currentFrameNumber;
    finalDigit.highlightFrames.push (this.currentFrameNumber);
    this.resultNumber.digits.push(finalDigit);
  }
  this.currentFrameNumber ++;
  for (var counter = 0; counter < this.resultNumber.digits.length; counter ++) {
    this.resultNumber.highlightDigitOnFrame(counter, this.currentFrameNumber);
    this.topNumber.highlightDigitOnFrame(counter, this.currentFrameNumber);
    this.bottomNumber.highlightDigitOnFrame(counter, this.currentFrameNumber);
  }
}

FreeCalcAdditionAlgorithm.prototype.computeIntermediateNotes = function (/** @type {HighlightedContent[]}*/ inputNotes) {
  var result = "";
  result += `\n<br>\n<br>\n`;
  result += "$\\displaystyle \\phantom{ \\underbrace{\\int}_{\\text{base } 10}}${}";
  for (var counter = inputNotes.length - 1; counter >= 0; counter --) {
    result += "$";
    result += inputNotes[counter].toString();
    result += " ${}";
  }
  return result;
}

FreeCalcAdditionAlgorithm.prototype.computeIntermediateBaseConversions = function (/** @type {HighlightedContent[]}*/ inputNotes) {
  var result = "";
  result += `\n<br>\n<br>\n`;
  result += "$\\displaystyle \\phantom{ \\underbrace{\\int}_{\\text{base } 10}}${}";
  for (var counter = inputNotes.length - 1; counter >= 0; counter --) {
    result += inputNotes[counter].toString();
  }
  return result;
}

FreeCalcAdditionAlgorithm.prototype.prepareProblemStatement = function () {
  this.problemStatement.content = new HighlightedContent();
  this.problemStatement.bottom = new HighlightedContent(this.bottomInput);
  this.problemStatement.top = new HighlightedContent (this.topInput);
  this.problemStatement.content.push("Add the numbers ");
  this.problemStatement.content.push(this.problemStatement.top);
  this.problemStatement.content.push(" and ");
  this.problemStatement.content.push(this.problemStatement.bottom);
  this.problemStatement.content.push(". ");
  this.currentFrameNumber ++;
  this.problemStatement.top.highlightFrames.push(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.problemStatement.bottom.highlightFrames.push(this.currentFrameNumber);
}

FreeCalcAdditionAlgorithm.prototype.computeSolution = function () {
  this.solution = new HighlightedContent();
  this.solution.push("$\\begin{array}{");
  for (var counterColumn = 0; counterColumn < this.resultNumber.digits.length + 1; counterColumn ++) {
    this.solution.push("r@{}");
  }
  this.solution.push("}<br>\n");
  this.solution.push(this.carryOvers.getTableRow(this.resultNumber.digits.length - this.carryOvers.digits.length + 1));
  this.solution.push("\\\\\n<br>");
  this.solution.push(`\\multirow{2}{*}{$`);
  this.solution.push(this.plusSign);
  this.solution.push(`$} &`);
  this.solution.push(this.topNumber.getTableRow(this.resultNumber.digits.length - this.topNumber.digits.length));
  this.solution.push("\\\\&");
  this.solution.push(this.bottomNumber.getTableRow(this.resultNumber.digits.length - this.bottomNumber.digits.length));
  this.solution.push(`\\\\\\cline{2-${this.resultNumber.digits.length + 1}} &`);
  this.solution.push(this.resultNumber.getTableRow(this.resultNumber.digits.length - this.resultNumber.digits.length));
  this.solution.push("\\end{array} $");
}

FreeCalcAdditionAlgorithm.prototype.initComputeInputs = function () {
  this.topNumber = new ColumnsReversedHighlighted(this.topInput);
  this.bottomNumber = new ColumnsReversedHighlighted(this.bottomInput);
  this.base = Number(this.inputBase);
  if (typeof this.base !== "number") {
    throw (`Failed to convert base to integer`);
  }
  this.numberOfDigits = Math.max(this.topNumber.digits.length, this.bottomNumber.digits.length);
  this.currentFrameNumber = this.startingFrameNumber;
}

FreeCalcAdditionAlgorithm.prototype.init = function ( 
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.topInput = inputData.topNumber;
  this.bottomInput = inputData.bottomNumber;
  this.inputBase = inputData.base;
}

FreeCalcAdditionAlgorithm.prototype.computeSlideContent = function (
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.init(inputData);
  this.initComputeInputs();
  this.computeResultDigits();
  this.prepareProblemStatement();
  this.computeSolution();
  this.slideContent = new HighlightedContent();
  this.slideContent.push("\\begin{frame}\n<br><br>");
  this.slideContent.push("<br><br>");
  this.slideContent.push("\\hfil\\hfil");
  this.slideContent.push(this.solution);
  this.slideContent.push(this.computeIntermediateNotes(this.intermediates));
  this.slideContent.push(this.computeIntermediateBaseConversions(this.intermediatesBaseConversions));
  this.slideContent.push("\\end{frame}");
}

function FreeCalcElements() {
  this.inputPairs = {
    topNumber: "idInputTop",
    bottomNumber: "idInputBottom",
    output: "idSpanOutput",
    startingFrameNumber: "idFirstSlideNumber",
    base: "idBase",
    baseAdditionTable: "idBaseAdditionTable",
    pairsToAdd: "idPairsToAdd",
    negativeCarryOverPrefix: "idNegativeCarryOverPrefix",
    fontSize: "idFontSize",
  };
  this.idOutput = this.inputPairs.output;
  this.startingFrameNumber = 0;
  this.additionAlgorithm = new FreeCalcAdditionAlgorithm();
  this.multiplicationAlgorithm = new FreeCalcMultiplicationAlgorithm();
  this.divisionAlgorithm = new FreeCalcDivisionAlgorithm();
  this.subtractionAlgorithm = new FreeCalcSubtractionAlgorithm();
  this.oneDigitAdditions = new FreeCalcOneDigitOperationAlgorithm("+");
  this.oneDigitMultiplications = new FreeCalcOneDigitOperationAlgorithm("\\cdot");
  this.oneDigitSubtractions = new FreeCalcOneDigitSubtractionAlgorithm();
}

FreeCalcElements.prototype.generateAddition = function() {
  this.additionAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.additionAlgorithm.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateOneDigitAdditions = function(
  /**@type {{useColumns: Boolean, makeTableNote: Boolean, makeTable: Boolean}} */
  options,
) {
  this.oneDigitAdditions.computeSlideContent(this.getInputs(), options);
  document.getElementById(this.idOutput).innerHTML = this.oneDigitAdditions.slideContent.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateOneDigitMultiplications = function(
  /**@type {{useColumns: Boolean, makeTableNote: Boolean, makeTable: Boolean}} */
  options,
) {
  this.oneDigitMultiplications.computeSlideContent(this.getInputs(), options);
  document.getElementById(this.idOutput).innerHTML = this.oneDigitMultiplications.slideContent.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateOneDigitSubtractions = function(useColumns, makeTableNote, makeTable) {
  this.oneDigitSubtractions.computeSlideContent(this.getInputs(), useColumns, makeTableNote, makeTable);
  document.getElementById(this.idOutput).innerHTML = this.oneDigitSubtractions.slideContent.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateMultiplication = function() {
  this.multiplicationAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.multiplicationAlgorithm.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateDivision = function() {
  this.divisionAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.divisionAlgorithm.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateSubtraction = function() {
  this.subtractionAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.subtractionAlgorithm.slideContent.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.getInputs = function() {
  var result = {};
  for (var label in this.inputPairs) {
    var current = document.getElementById(this.inputPairs[label]);
    if (current === null) {
      continue;
    }
    result[label] = current.value;
  }
  return result;
}

function FreeCalcMultiplicationAlgorithm() {

  /**@type {String} */
  this.inputLeft = "";
  /**@type {String} */
  this.inputRight = "";
  /**@type {ColumnsReversedHighlighted} */
  this.numberLeft = null;
  /**@type {ColumnsReversedHighlighted} */
  this.numberRight = null;
  /**@type {ColumnsReversedHighlighted} */
  this.multiplicationResultNumber = null;
  /**@type {ColumnsReversedHighlighted[]} */
  this.carryOvers = null;
  /**@type {ColumnsReversedHighlighted} */
  this.carryOversAddition;
  /**@type {ColumnsReversedHighlighted} */
  this.carryOversCombined = null;
  /**@type {ColumnsReversedHighlighted[]} */
  this.intermediates = null;
  /**@type {HighlightedContent[][]} */
  this.startingFrameNumber = 1;
  /**@type {HighlightedContent} */
  this.plusSign = null;
  /**@type {HighlightedContent} */
  this.multiplicationSign = null;
  /**@type {HighlightedContent} */
  this.multiplicationResult = null;
  this.content = {
    /**@type {HighlightedContent} */
    computation: null,    
    /**@type {HighlightedContent} */
    computationNotes: null,
    problemStatement: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      leftNumber: null,
      /**@type {HighlightedContent} */
      rightNumber: null,
    },
    /**@type {HighlightedContent} */
    slide: null,
  };
  /**@type {Number[]} */
  this.carryOverHideFrames = null;
  this.base = 10;
  this.currentFrameNumber = 0;
}

FreeCalcMultiplicationAlgorithm.prototype.toString = function () {
  if (this.content.slide === null) {
    return "(uninitialized)";
  }
  return this.content.slide.toString();
}

FreeCalcMultiplicationAlgorithm.prototype.init = function( 
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.startingFrameNumber = Number(inputData.startingFrameNumber);
  this.inputLeft = inputData.topNumber;
  this.inputRight = inputData.bottomNumber;
  this.numberLeft = new ColumnsReversedHighlighted(this.inputLeft);
  this.numberRight = new ColumnsReversedHighlighted(this.inputRight);
  this.numbersIntermediate = [];
  this.base = Number(inputData.base);
}

FreeCalcMultiplicationAlgorithm.prototype.oneProduct = function (
  /**@type {HighlightedContent} */
  leftDigit,
  /**@type {HighlightedContent} */
  rightDigit,
  /**@type {HighlightedContent} */
  resultDigit,
  /**@type {HighlightedContent} */
  currentNote,
  /**@type {HighlightedContent} */
  carryOverDigitContainer, 
  /**@type {HighlightedContent} */
  carryOverOld,
) {
  var carryOverOldContent = 0;
  if (carryOverOld !== undefined) {
    if (Array.isArray(carryOverOld.content)) {
      if (carryOverOld.content.length > 0) {
        if (typeof carryOverOld.content[0].content === "number") {
          carryOverOldContent = carryOverOld.content[0].content;
        }
      }
    }
  }
  var product = carryOverOldContent + leftDigit.content * rightDigit.content;
  var carryOver = Math.floor(product / this.base);
  var digit = product % this.base;
  resultDigit.content = digit;
  resultDigit.answerFrame = this.currentFrameNumber + 2;
  rightDigit.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  leftDigit.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  resultDigit.highlightFrames.push(this.currentFrameNumber + 3);
  var currentNote = new HighlightedContent();
  currentNote.push("$");
  currentNote.push(leftDigit);
  currentNote.push("\\cdot");
  currentNote.push(rightDigit);
  if (carryOverOldContent > 0) {
    currentNote.push("+");
    currentNote.push(carryOverOld);
    carryOverOld.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  }
  currentNote.push("=");
  if (leftDigit.content > 1 && rightDigit.content > 1 && carryOverOldContent > 0) {
    var intermediate = new HighlightedContent();
    intermediate.push(leftDigit.content * rightDigit.content);
    intermediate.push("+");
    intermediate.push(carryOverOldContent);
    intermediate.push("=");
    intermediate.showFrame = this.currentFrameNumber + 2;
    currentNote.push(intermediate);
  }
  if (carryOver > 0) {
    var carryOverDigit = new HighlightedContent();
    carryOverDigit.content = carryOver;
    carryOverDigit.showFrame = this.currentFrameNumber + 2;
    carryOverDigit.answerFrame = this.currentFrameNumber + 2;
    carryOverDigit.highlightFrames.push(this.currentFrameNumber + 4);
    carryOverDigit.flagUseOnly = false;
    carryOverDigitContainer.push(carryOverDigit);
    carryOverDigitContainer.showFrame = this.currentFrameNumber + 2;
    currentNote.push(carryOverDigitContainer);
  }
  currentNote.push(resultDigit);
  currentNote.push("$ ");
  currentNote.showFrame = this.currentFrameNumber + 1;
  currentNote.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  currentNote.flagUseOnly = true;
  this.currentFrameNumber += 3;
  if (carryOver > 0) {
    this.currentFrameNumber ++;
  }
  currentNote.hideFrame = this.currentFrameNumber + 1;
  this.notes.push(currentNote);
}

FreeCalcMultiplicationAlgorithm.prototype.computeIntermediate = function(leftDigitIndex) {
  this.intermediates[leftDigitIndex] = new ColumnsReversedHighlighted();
  var currentIntermediate = this.intermediates[leftDigitIndex];
  this.carryOvers[leftDigitIndex] = new ColumnsReversedHighlighted();
  var carryOversCurrent = this.carryOvers[leftDigitIndex];
  /**@type {HighlightedContent} */
  var leftDigit = this.numberLeft.digits[leftDigitIndex];
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    var rightDigit = this.numberRight.digits[i];
    currentIntermediate.digits[i] = new HighlightedContent();
    var resultDigit = currentIntermediate.digits[i];
    this.notes.push(new HighlightedContent());
    if (carryOversCurrent.digits[i] === undefined) {
      carryOversCurrent.digits[i] = new HighlightedContent();
    }
    this.oneProduct(
      leftDigit, 
      rightDigit, 
      resultDigit,
      this.notes.content[this.notes.content.leftDigit],
      carryOversCurrent.digits[i],
      carryOversCurrent.digits[i - 1]
    );
  }
  var carryOverLast = carryOversCurrent.digits[carryOversCurrent.digits.length - 1];
  if (!carryOverLast.isEmpty()) {
    this.currentFrameNumber ++;
    var carryOverDigitContainer = new HighlightedContent();
    carryOverDigitContainer.push(carryOverLast.content[0]);
    carryOverDigitContainer.showFrame = this.currentFrameNumber;
    carryOverDigitContainer.highlightFrames.push(this.currentFrameNumber);
    carryOverLast.highlightFrames.push(this.currentFrameNumber);
    currentIntermediate.digits.push(carryOverDigitContainer);   
  }
}

FreeCalcMultiplicationAlgorithm.prototype.hasCarryOvers = function() {
  for (var i = 0; i < this.carryOversCombined.digits.length; i ++) {
    if (this.carryOversCombined.digits[i] === undefined) {
      continue;
    }
    if (!this.carryOversCombined.digits[i].isEmpty()) {
      return true;
    }
  }
  return false;
}

FreeCalcMultiplicationAlgorithm.prototype.combineCarryOvers = function() {
  this.carryOversCombined = new ColumnsReversedHighlighted();
  this.carryOversCombined.digits = new Array(this.numberLeft.digits.length);
  this.carryOversCombined.digitPrefix = "\\text{{\\tiny ${{ ";
  this.carryOversCombined.digitSuffix = "}}$}}";
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    this.carryOversCombined.digits[i] = new HighlightedContent();
    var currentCarryOver = this.carryOversCombined.digits[i];
    currentCarryOver.content = [];
    for (var j = 0; j < this.carryOvers.length; j ++) {
      if (this.carryOvers[j] === undefined) {
        continue;
      }
      var currentDigit = this.carryOvers[j].digits[i];
      if (currentDigit === undefined) {
        continue;
      }
      if (currentDigit.isEmpty()) {
        continue;
      }
      currentDigit.hideFrame = this.carryOverHideFrames[j];
      currentDigit.flagUseOnly = true;
      currentCarryOver.push(currentDigit);
    }
  }
}

FreeCalcMultiplicationAlgorithm.prototype.oneAdditionResult = function (
  /**@type {HighlightedContent} */
  resultDigit,
  /**@type {HighlightedContent[]} */
  column,
  /**@type {HighlightedContent} */
  carryOverOld, 
  /**@type {HighlightedContent} */
  carryOver
) {
  this.currentFrameNumber ++;
  var currentNote = new HighlightedContent();
  currentNote.showFrame = this.currentFrameNumber;
  currentNote.flagUseOnly = true;
  var carryOverOldContent = 0;
  var resultDigitContent = 0;
  if (carryOverOld !== undefined) {
    if (typeof carryOverOld.content === "number") {
      carryOverOldContent += carryOverOld.getDigit();
      currentNote.push(carryOverOld);
      currentNote.push("+");
      resultDigitContent += carryOverOldContent;
    }
    carryOverOld.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }
  for (var i = 0; i < column.length; i ++) {
    column[i].highlightFrames.push(this.currentFrameNumber);
    if (column.length > 1 || carryOverOldContent > 0) {
      column[i].highlightFrames.push(this.currentFrameNumber + 1);
    }
    var incomingDigit = column[i].getDigit();
    resultDigitContent += incomingDigit;
  }
  var carryOverContent = Math.floor(resultDigitContent / this.base);
  resultDigitContent %= this.base;
  resultDigit.push(resultDigitContent);
  if (carryOverContent > 0) {
    carryOver.content = carryOverContent;
  }  
  if (carryOverOldContent === 0 && column.length === 1) {
    resultDigit.showFrame = this.currentFrameNumber;
    resultDigit.highlightFrames.push(this.currentFrameNumber);
    return;
  }
  for (var i = 0; i < column.length; i ++) {
    this.plusSign.highlightFrames.push(this.currentFrameNumber);
    currentNote.push(column[i]);
    if (i != column.length - 1) {
      currentNote.push("+");
    }
  }
  currentNote.push("=");
  currentNote.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  if (carryOverContent > 0) {
    var carryOverContainer = new HighlightedContent();
    carryOver.answerFrame = this.currentFrameNumber + 1;
    carryOverContainer.push(carryOver);
    carryOverContainer.showFrame = this.currentFrameNumber + 1;
    currentNote.push(carryOverContainer);
  }
  resultDigit.answerFrame = this.currentFrameNumber + 1;
  resultDigit.highlightFrames.push(this.currentFrameNumber + 2);
  this.currentFrameNumber += 2;
  if (carryOverContent > 0) {
    this.currentFrameNumber ++;
    carryOver.highlightFrames.push (this.currentFrameNumber);
  }
  currentNote.push(resultDigit);
  currentNote.hideFrame = this.currentFrameNumber + 1;
  var currentNoteContainer = new HighlightedContent();
  currentNoteContainer.push("$ ");
  currentNoteContainer.push(currentNote);
  currentNoteContainer.push(" $ ");
  this.notes.push(currentNoteContainer);
}

FreeCalcMultiplicationAlgorithm.prototype.computeAdditionResult = function() {
  if (this.numberLeft.digits.length <= 1) {
    return;
  } 
  this.carryOversAddition.digitPrefix = "\\text{{\\tiny ~ ${{ ";
  this.carryOversAddition.digitSuffix = "}}$}}";
  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 
  var numberOfColumns = lastIntermediateLength + this.numberLeft.digits.length - 1;
  for (var i = 0; i < numberOfColumns; i ++) {
    var currentColumn = [];
    for (var j = 0; j < this.intermediates.length; j ++) {
      var currentDigitIndex = i - j;
      if (currentDigitIndex >= 0 && currentDigitIndex < this.intermediates[j].digits.length) {
        currentColumn.push(this.intermediates[j].digits[currentDigitIndex]);
      }
    }
    this.carryOversAddition.digits[i] = new HighlightedContent();
    this.multiplicationResultNumber.digits[i] = new HighlightedContent();
    this.oneAdditionResult(
      this.multiplicationResultNumber.digits[i], 
      currentColumn, 
      this.carryOversAddition.digits[i - 1], 
      this.carryOversAddition.digits[i]
    );
  }
  var leadingCarryOver = this.carryOversAddition.digits[this.carryOversAddition.digits.length - 1];
  if (leadingCarryOver.getDigit() !== undefined) {
    this.currentFrameNumber ++;
    var leadingDigitResult = new HighlightedContent();
    leadingDigitResult.push(leadingCarryOver);
    leadingDigitResult.showFrame = this.currentFrameNumber;
    leadingCarryOver.highlightFrames.push(this.currentFrameNumber);
    this.multiplicationResultNumber.digits.push(leadingDigitResult);
  }
}

FreeCalcMultiplicationAlgorithm.prototype.highlightIntermediateFinal = function () {
  if (this.numberLeft.digits.length <= 1) {
    return;
  }
  for (var i = 0; i < this.intermediates.length; i ++ ) {
    for (var j = 0; j < this.intermediates[i].digits.length; j ++) {
      this.intermediates[i].digits[j].highlightFrames.push(this.currentFrameNumber + 1);
    }
  }
}

FreeCalcMultiplicationAlgorithm.prototype.highlightFinal = function () {
  this.currentFrameNumber ++;
  for (var i = 0; i < this.numberLeft.digits.length; i ++) {
    this.numberLeft.digits[i].highlightFrames.push(this.currentFrameNumber);
  }
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    this.numberRight.digits[i].highlightFrames.push(this.currentFrameNumber);
  }
  this.multiplicationSign.highlightFrames.push(this.currentFrameNumber);
  for (var i = 0; i < this.multiplicationResultNumber.digits.length; i ++) {
    this.multiplicationResultNumber.digits[i].highlightFrames.push(this.currentFrameNumber)
  }
}

FreeCalcMultiplicationAlgorithm.prototype.computeSlideResult = function () {
  if (this.numberLeft.digits.length <= 1) {
    this.currentFrameNumber ++;
    this.intermediates[this.intermediates.length - 1].highlightAll(this.currentFrameNumber);
    return;
  }
  this.plusSign.showFrame = this.currentFrameNumber;
  this.plusSign.highlightFrames.push(this.currentFrameNumber);
  var horizontalLine = new HighlightedContent();
  horizontalLine.content = "\\\\\\hline";
  horizontalLine.showFrame = this.currentFrameNumber; 
  this.multiplicationResult.push(horizontalLine);
  this.computeAdditionResult();  
  var currentLength = this.multiplicationResultNumber.digits.length;
  var offset = this.numberLeft.digits.length + this.numberRight.digits.length + 3 - currentLength;
  this.highlightFinal();
  this.multiplicationResult.push(this.multiplicationResultNumber.getTableRow(offset));
}

FreeCalcMultiplicationAlgorithm.prototype.computeProblemStatement = function() {
  this.content.problemStatement.content = new HighlightedContent();
  this.content.problemStatement.leftNumber = new HighlightedContent(this.inputLeft);
  this.content.problemStatement.rightNumber = new HighlightedContent(this.inputRight);
  this.content.problemStatement.content.push("Multiply ");
  this.content.problemStatement.content.push(this.content.problemStatement.leftNumber);
  this.content.problemStatement.content.push(" by ");
  this.content.problemStatement.content.push(this.content.problemStatement.rightNumber);
  this.content.problemStatement.content.push(". \n<br>\n");
}

FreeCalcMultiplicationAlgorithm.prototype.highlightProblemStatement = function() {
  this.content.computation.showFrame = this.currentFrameNumber + 1;
  this.numberLeft.highlightAll(this.currentFrameNumber + 1);
  this.content.problemStatement.leftNumber.highlightFrames.push(this.currentFrameNumber + 1);
  this.numberRight.highlightAll(this.currentFrameNumber + 2);
  this.content.problemStatement.rightNumber.highlightFrames.push(this.currentFrameNumber + 2);
  this.currentFrameNumber += 2;
}

FreeCalcMultiplicationAlgorithm.prototype.computeSlideContent = function(inputData) {
  this.init(inputData);
  this.currentFrameNumber = this.startingFrameNumber;
  this.content.slide = new HighlightedContent();
  this.content.computation = new HighlightedContent();
  this.plusSign = new HighlightedContent();
  this.multiplicationSign = new HighlightedContent("\\cdot");
  this.notes = new HighlightedContent();
  this.multiplicationResult = new HighlightedContent();

  this.computeProblemStatement();
  this.highlightProblemStatement();
  this.content.slide.push("\\begin{frame}\n<br>\n\\begin{example}");
  this.content.slide.push(this.content.problemStatement.content);
  this.intermediates = new Array(this.numberLeft.digits.length);
  this.carryOvers = new Array(this.numberRight.digits.length);
  this.carryOverHideFrames = new Array(this.numberRight.digits.length);
  this.carryOversAddition = new ColumnsReversedHighlighted();
  this.multiplicationResultNumber = new ColumnsReversedHighlighted();
  for (var i = 0; i < this.numberLeft.digits.length; i ++) {
    this.computeIntermediate(i);
    this.carryOverHideFrames[i] = this.currentFrameNumber + 1;
  }
  this.highlightIntermediateFinal();
  this.currentFrameNumber ++;
  this.computeSlideResult();

  this.content.slide.push(this.content.computation);
  var slideStart = "";
  slideStart += "\\[ \\begin{array}{@{}r@{}r";
  for (var i = 0; i < this.numberLeft.digits.length; i ++) {
    slideStart += "@{}r";
  }
  slideStart += "@{}r";
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    slideStart += "@{}r";
  }
  slideStart += "}";
  this.content.computation.push(slideStart);
  this.combineCarryOvers();
  if (this.hasCarryOvers()) {
    //this.content.slide.push("\\displaystyle \\phantom{\\frac{\\int}{~}}");
    var offset = 2 + this.numberRight.digits.length + this.numberLeft.digits.length;
    offset -= this.carryOversCombined.digits.length;
    this.content.computation.push(this.carryOversCombined.getTableRow(offset));
    this.content.computation.push("\\\\\n<br>\n");
  }
  this.content.computation.push(this.numberLeft.getTableRow(2));
  this.content.computation.push("&");
  this.content.computation.push(this.multiplicationSign);
  this.content.computation.push("&");
  this.content.computation.push(this.numberRight.getTableRow(0));
  this.content.computation.push("\\\\\\hline \n<br>\n");
  if (this.carryOversAddition.getNumberSignificantDigits() > 0) {
    this.content.computation.push(this.carryOversAddition.getTableRow(3));
    this.content.computation.push("\\\\\n<br>\n");
  }

  for (var i = 0; i < this.intermediates.length; i ++) {
    if (i === 0 && this.intermediates.length > 1) {
      this.content.computation.push(`\\multirow{${this.numberRight.digits.length}}{*}{$`);
      this.plusSign.content = "+";
      this.content.computation.push(this.plusSign);
      this.content.computation.push(`$}`);  
    }
    var currentLength = this.intermediates[i].digits.length;
    var offset = this.numberRight.digits.length + this.numberLeft.digits.length - currentLength - i + 3; 
    this.content.computation.push(this.intermediates[i].getTableRow(offset));
    if (i !== this.intermediates.length - 1) {
      this.content.computation.push("\\\\\n<br>\n");
    }
  }
  if (this.numberLeft.digits.length > 1) {
    this.content.computation.push(this.multiplicationResult);
  }

  var flaFinish = "";
  flaFinish += "\\end{array}\\]$"
  this.content.computation.push(flaFinish);
  this.content.slide.push(" <br>\n \\displaystyle \\phantom{\\underbrace{\\int 1}_{a}}$");
  this.content.slide.push(this.notes);  
  this.content.slide.push("\\end{example}\n<br>\n\\end{frame}");
}

FreeCalcElements.prototype.selectOutput = function () {
  var outputNode = document.getElementById(this.idOutput);
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(outputNode);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(outputNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    console.warn("Could not select text in node: Unsupported browser.");
  }
}

function FreeCalcDivisionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {HighlightedContent} */
  this.solution = null;

  /**@type {string} */
  this.inputDividend = "";
  /**@type {string} */
  this.inputDivisor = "";

  this.options = {
    fontSize: "\\tiny",
    negativeCarryOverPrefix: "\\!\\!",
  };
  
  /**@type {ColumnsReversedHighlighted} */
  this.dividend = null;
  /**@type {ColumnsReversedHighlighted} */
  this.divisor = null;
  /**@type {ColumnsReversedHighlighted} */
  this.quotientMain = null;
  /**@type {ColumnsReversedHighlighted[]} */
  this.quotientExtras = [];
  /** @type {number} */
  this.numberOfIntermediateQuotients = - 1;
  /**@type {ColumnsReversedHighlighted[]} */
  this.intermediates = [];
  /**@type {ColumnsReversedHighlighted[]} */
  this.intermediateCarryOvers = [];
  /**@type {ColumnsReversedHighlighted[]} */
  this.subtracands = [];
  /**@type {HighlightedContent[]} */
  this.minusSigns = [];
  /**@type {HighlightedContent[]} */
  this.resultLines = [];
  /**@type {HighlightedContent[]} */
  this.quotientMainLine = null;
  /**@type {number} */
  this.numberOfColumns = - 1;
  /**@type {number}*/
  this.base = - 1; 
  /**@type {number}*/
  this.startingFrameNumber = - 1; 
  /**@type {number}*/
  this.currentFrameNumber = - 1; 
  /**@type {number} */
  this.divisorLeadingDigitContent = - 1; 
  /**@type {HighlightedContent} */
  this.divisorLeadingDigitContainer = null; 
  /**@type {number} */
  this.divisorLeadingDigitPlusOne = 0;
  this.flagShowAbridgedConsiderations = false;
  this.flagRoundSmallDivisorLeadingDigitReasoned = false;
  this.flagRoundEqualDivisorLeadingDigitReasoned = false;
  this.flagRoundLargeDivisorLeadingDigitReasoned = false; 
  this.flagOneDigitMultiplicationIllustrated = false;
  this.flagOneSubtractionIllustrated = false;
  this.flagIsOneDigitDivision = false;
  this.flagFirstRun = true;
  this.quotientDigitsOffset = - 1;
  this.quotientDigitCurrent = {
    /**@type {HighlightedContent[]} */
    extraZeroesAdded: null,
    /**@type {HighlightedContent} */
    quotientDigitContainer: null,
    /**@type {number} */
    quotientDigitContent: 0,
    /**@type {HighlightedContent} */
    remainderLeadingDigitContainer: null,
    /**@type {number} */
    remainderLeadingDigitContent: - 1,
    /**@type {HighlightedContent} */
    remainderSecondToLeadingDigitContainer: null,
    /**@type {number} */
    remainderSecondToLeadingDigitContent: - 1,
    /**@type {ColumnsReversedHighlighted} */
    remainder: null,
    /**@type {number} */
    indexReverseQuotientDigit: - 1,
    /**@type {number} */
    numberRelevantIntermediateDigits: - 1,
  };
  this.notes = {
    goal: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      inputDividend: null,
      /**@type {HighlightedContent} */
      inputDivisor: null
    },
    quotientDigitPlacement: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      partOne: null,
      /**@type {HighlightedContent} */
      partWeAreDone: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      partThree: null,
    },
    /**@type {HighlightedContent} */
    contentNotes: null,
    /**@type {HighlightedContent} */
    contentComputations: null,
    quotientDigit: {
      /**@type {HighlightedContent} */
      considerations: null,
      /**@type {HighlightedContent} */
      computations: null,
    },
    multiplication: {
      /**@type {HighlightedContent} */
      considerations: null,
      /**@type {HighlightedContent} */
      considerationsResult: null,
      /**@type {HighlightedContent} */
      beefUpZeroesNote: null,
      /**@type {HighlightedContent} */
      computations: null,
    },
    subtraction: {
      /**@type {HighlightedContent} */
      considerations: null,
      /**@type {HighlightedContent} */
      computations: null,
    },
    /**@type {HighlightedContent} */
    finalNotesPartOne: null,
    quotientCollection: {
      /**@type {HighlightedContent} */
      considerations: null,
      /**@type {HighlightedContent} */
      computations: null,
      /**@type {HighlightedContent} */
      plusSign: null,
    },
    finalAnswer: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      dividend: null,
      /**@type {HighlightedContent} */
      divisor: null,
      /**@type {HighlightedContent} */
      quotient: null,
      /**@type {HighlightedContent} */
      remainder: null,
    },
    finalAnswerCheck: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      dividend: null,
      /**@type {HighlightedContent} */
      divisor: null,
      /**@type {HighlightedContent} */
      quotient: null,
      /**@type {HighlightedContent} */
      remainder: null,
    },
  };
  this.currentNoteLargeDivisor = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    firstPart: null,
    consequence: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      partOne: null,
      /**@type {HighlightedContent} */
      partOnePointFive: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      partThree: null,
      /**@type {HighlightedContent} */
    },
    computation: {
      /**@type {HighlightedContent} */
      content: null,
      partOne: {
        /**@type {HighlightedContent} */
        content: null,
        /**@type {HighlightedContent} */
        lfloor: null,
        /**@type {HighlightedContent} */
        rfloor: null,
        /**@type {HighlightedContent} */
        numerator: null,       
        /**@type {number} */
        numeratorContent: - 1,
        /**@type {HighlightedContent} */
        divisorLeadingDigitContainer: null,
        /**@type {HighlightedContent} */
        denominator: null,
        /**@type {HighlightedContent} */
        plusOne: null
      },
      /**@type {HighlightedContent} */
      partOneEqualsPartTwo: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      answer: null,
    }
  };
  this.currentNoteDivisorEqualLeadingDigit = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    firstPart: null,
    /**@type {HighlightedContent} */
    secondPart: null,
    /**@type {HighlightedContent} */
    consequence:  null,
  };
  this.currentNoteDivisorSmallLeadingDigit = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    firstPart: null,
    consequence: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      partOne: null,
      /**@type {HighlightedContent} */
      partOnePointFive: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      partThree: null,
    },
    computation: {
      /**@type {HighlightedContent} */
      content: null,
      partOne: {
        /**@type {HighlightedContent} */
        content: null,
        /**@type {HighlightedContent} */
        lfloor: null,
        /**@type {HighlightedContent} */
        rfloor: null,
        /**@type {HighlightedContent} */
        numeratorContainer: null,
        /**@type {number} */
        numeratorContent: - 1,
        /**@type {HighlightedContent} */
        denominator: null,
        /**@type {HighlightedContent} */
        denominatorNoPlusOne: null,
        /**@type {HighlightedContent} */
        plusOne: null
      },
      /**@type {HighlightedContent} */
      partOneEqualsPartTwo: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      answer: null,
    }
  };
  /**@type {ColumnsReversedHighlighted}*/
  this.carryOverDivisor = null;
  this.multiplicationCurrent = {
    /**@type {HighlightedContent} */
    currentDivisorDigit: null,
    /**@type {number}*/
    currentDivisorDigitContent: - 1, 
    /**@type {HighlightedContent} */
    currentResultDigit: null,
    /**@type {number} */
    currentResultDigitContent: null,
    /**@type {HighlightedContent} */
    oldCarryOver: null,
    /**@type {number} */
    oldCarryOverContent: null,
    /**@type {HighlightedContent} */
    newCarryOver: null,
    /**@type {number} */
    newCarryOverContent: null,
    /**@type {number} */
    numberOfZeroesToBeefUp: 0,
    /**@type {ColumnsReversedHighlighted} */    
    currentSubtracand: null,
    /**@type {HighlightedContent} */
    oneDigitMultiplicationNoteResult: null,
    /**@type {OneDigitMultiplicationWithCarryOverSplit} */
    oneDigitMultiplicationNote: null,
    /**@type {HighlightedContent} */
    note: null,
    /**@type {ColumnsReversedHighlighted} */    
    currentCarryOver: null,
  };
  this.subtractionCurrent = {
    /**@type {ColumnsReversedHighlighted} */
    intermediate: null,
    /**@type {ColumnsReversedHighlighted} */
    carryOvers: null,
    /**@type {HighlightedContent} */
    oldCarryOver: null,
    /**@type {number} */
    oldCarryOverContent: - 1,
    /**@type {HighlightedContent} */
    newCarryOver: null,
    /**@type {number} */
    newCarryOverContent: - 1,
    /**@type {HighlightedContent} */
    topDigit: null,
    /**@type {number} */
    topDigitContent: - 1,
    /**@type {HighlightedContent} */
    bottomDigit: null,
    /**@type {number} */
    bottomDigitContent: - 1,
    /**@type {HighlightedContent} */
    resultDigit: null,
    /**@type {number} */
    resultDigitContent: null,
    /**@type {ColumnsReversedHighlighted} */    
    result: null,
    /**@type {OneDigitSubtractionWithCarryOver} */
    oneDigitSubtractionNote: null,
    /**@type {HighlightedContent} */
    note: null,
  };
}

FreeCalcDivisionAlgorithm.prototype.toString = FreeCalcAdditionAlgorithm.prototype.toString;

FreeCalcDivisionAlgorithm.prototype.init = function (inputData) {
  this.inputDividend = inputData.topNumber;
  this.inputDivisor = inputData.bottomNumber;
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.base = Number(inputData.base);
  if (typeof this.base !== "number") {
    throw (`Failed to convert base ${inputData.base} to integer. `);
  }
  if (inputData.fontSize !== undefined) {
    this.options.fontSize = inputData.fontSize;
  }
  if (inputData.negativeCarryOverPrefix !== undefined) {
    this.options.negativeCarryOverPrefix = inputData.negativeCarryOverPrefix;
  }

}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitSmallDivisorDigitConsiderations = function () {
  this.currentNoteDivisorSmallLeadingDigit.content = new HighlightedContent();
  var currentNoteDivisorSmallLeadingDigit = this.currentNoteDivisorSmallLeadingDigit.content;
  this.currentNoteDivisorSmallLeadingDigit.firstPart = new HighlightedContent("$~~-$ Current leading digit $>$ divisor leading digit");
  var firstPart = this.currentNoteDivisorSmallLeadingDigit.firstPart;
  currentNoteDivisorSmallLeadingDigit.content.push(firstPart);
  var remarks = this.currentNoteDivisorSmallLeadingDigit.consequence; 
  remarks.content = new HighlightedContent();
  var consequence = this.currentNoteDivisorSmallLeadingDigit.consequence.content;
  remarks.partOne = new HighlightedContent(" $\\Rightarrow$ divide leading digit");
  remarks.partOnePointFive = new HighlightedContent(" by divisor digit");
  if (!this.flagIsOneDigitDivision) {
    remarks.partTwo = new HighlightedContent(" plus one");
  }
  consequence.push(remarks.partOne);
  consequence.push(remarks.partOnePointFive);
  consequence.push(remarks.partTwo);
  consequence.push(". ");
  if (this.flagIsOneDigitDivision) {
    consequence.push("Unlike division by multi-digit divisor, don't add one to divisor leading digit. ");
  }
  this.currentNoteDivisorSmallLeadingDigit.consequence.partThree = new HighlightedContent();
  var consequencePartThree = this.currentNoteDivisorSmallLeadingDigit.consequence.partThree;
  consequencePartThree.push("Round down if needed. ");
  consequence.push(consequencePartThree);
  currentNoteDivisorSmallLeadingDigit.push(consequence);
  this.notes.quotientDigit.considerations.push(this.currentNoteDivisorSmallLeadingDigit.content);
  this.notes.quotientDigit.considerations.push("<br><br>");
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingDigitConsiderations = function () {
  this.currentNoteDivisorEqualLeadingDigit.content = new HighlightedContent();
  var currentNote = this.currentNoteDivisorEqualLeadingDigit;
  var currentNoteContent = currentNote.content;
  currentNote.firstPart = new HighlightedContent("$~~-$ Equal leading digits;");
  currentNote.secondPart = new HighlightedContent(" larger divisor start has same \\# of digits  ");
  currentNote.content.push(currentNote.firstPart);
  currentNote.content.push(currentNote.secondPart);
  currentNote.consequence = new HighlightedContent();
  var consequence = currentNote.consequence;
  consequence.push(" $\\Rightarrow$ set quotient digit to $1$. ");
  currentNoteContent.push(consequence);
  this.notes.quotientDigit.considerations.push(currentNoteContent);
  this.notes.quotientDigit.considerations.push("<br><br>");
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitLargerDivisorConsiderations = function () {
  var currentNote = this.currentNoteLargeDivisor;
  currentNote.content = new HighlightedContent();
  currentNote.firstPart = new HighlightedContent("$~~-$ Larger divisor start has more digits ");
  var firstPart = currentNote.firstPart;

  currentNote.content.push(firstPart);
  var consequence = currentNote.consequence;
  consequence.content = new HighlightedContent();
  consequence.partOne = new HighlightedContent(" $\\Rightarrow$ divide leading two digits ");
  consequence.partOnePointFive = new HighlightedContent(" by divisor digit");
  consequence.partThree = new HighlightedContent("Round down if needed. ");
  consequence.content.push(consequence.partOne);
  consequence.content.push(consequence.partOnePointFive);
  if (!this.flagIsOneDigitDivision) {
    consequence.partTwo = new HighlightedContent(" plus one");
    consequence.content.push(consequence.partTwo);
  } 
  consequence.content.push(". ");
  if (this.flagIsOneDigitDivision) {
    consequence.content.push("Unlike division by multi-digit divisor, don't add one to divisor leading digit. ");
  }
  consequence.content.push(consequence.partThree);
  currentNote.content.push(consequence.content);
  currentNote.content.push(currentNote.finalPart);
  this.notes.quotientDigit.considerations.push(currentNote.content);
  this.notes.quotientDigit.considerations.push("<br><br>");
}

FreeCalcDivisionAlgorithm.prototype.quotientDigitPlacementCompute = function() {

  this.quotientDigitCurrent.quotientDigitContainer = new HighlightedContent();
  this.quotientDigitCurrent.extraZeroesAdded = [];
  this.quotientDigitCurrent.remainder = this.intermediates[this.intermediates.length - 1];
  var currentNote = this.notes.quotientDigitPlacement; 

  this.multiplicationCurrent.numberOfZeroesToBeefUp = this.quotientDigitCurrent.remainder.digits.length - this.divisor.digits.length;
  if (!this.quotientDigitCurrent.remainder.hasGreaterThanOrEqualToStart(this.divisor)) {
    this.multiplicationCurrent.numberOfZeroesToBeefUp --;
  }
  this.placeCurrentQuotientDigit(this.quotientDigitCurrent.extraZeroesAdded);
  if (currentNote.content.content.length > 0) {
    return;
  }
  currentNote.partOne = new HighlightedContent("$\\bullet$ Find shortest dividend start larger than divisor. ");
  currentNote.partWeAreDone = new HighlightedContent(" If none, we're done. ");
  currentNote.partTwo = new HighlightedContent(" $\\bullet$ Next quotient digit: put above last digit of that start. ");
  currentNote.partThree = new HighlightedContent(" If this leaves gaps: fill with $0$. ");


  currentNote.content.push(currentNote.partOne);
  currentNote.content.push(currentNote.partWeAreDone);
  currentNote.content.push("\n<br>\n<br>");
  currentNote.content.push(currentNote.partTwo);
  currentNote.content.push(currentNote.partThree);
}

FreeCalcDivisionAlgorithm.prototype.quotientDigitPlacementHighlight = function() {
  var currentNote = this.notes.quotientDigitPlacement;
  if (currentNote.partOne.showFrame < 0) {
    currentNote.partOne.showFrame = this.currentFrameNumber;
  }
  var numberOfDigitsToHighlight = this.divisor.digits.length;
  var remainderCurrent = this.quotientDigitCurrent.remainder; 
  if (!remainderCurrent.hasGreaterThanOrEqualToStart(this.divisor)) {
    numberOfDigitsToHighlight ++;
  }
  this.divisor.highlightAll(this.currentFrameNumber);
  
  for (var counter = 0; counter < numberOfDigitsToHighlight; counter ++) {
    var digitIndex = remainderCurrent.digits.length - 1 - counter;
    remainderCurrent.digits[digitIndex].highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }
  currentNote.partOne.highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.quotientDigitContainer.questionMarkFrame = this.currentFrameNumber + 1;
  this.quotientDigitCurrent.quotientDigitContainer.showFrame = this.currentFrameNumber + 1;
  this.quotientDigitCurrent.quotientDigitContainer.highlightFrames.push(this.currentFrameNumber + 1);
  currentNote.partTwo.highlightFrames.push(this.currentFrameNumber + 1);
  if (currentNote.partTwo.showFrame < 0) {
    currentNote.partTwo.showFrame = this.currentFrameNumber + 1;
    currentNote.partThree.showFrame = this.currentFrameNumber + 1;
  }
  this.quotientDigitCurrent.showFrame = this.currentFrameNumber + 1;  
  this.currentFrameNumber += 2;
  if (this.quotientDigitCurrent.extraZeroesAdded.length > 0) {
    if (currentNote.partThree.showFrame <= currentNote.partTwo.showFrame) {
      currentNote.partThree.showFrame = this.currentFrameNumber;
    }
    currentNote.partThree.highlightFrames.push (this.currentFrameNumber);
    for (var i = 0; i < this.quotientDigitCurrent.extraZeroesAdded.length; i ++) {
      this.quotientDigitCurrent.extraZeroesAdded[i].highlightFrames.push(this.currentFrameNumber);
      this.quotientDigitCurrent.extraZeroesAdded[i].showFrame = this.currentFrameNumber;
    }
    this.currentFrameNumber ++;
  }
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitSmallDivisorDigitContent = function () {
  var quotientDigitContainer = this.quotientDigitCurrent.quotientDigitContainer;
  var divisor = this.divisorLeadingDigitPlusOne;
  if (this.flagIsOneDigitDivision) {
    divisor --;
  }

  this.quotientDigitCurrent.quotientDigitContent = Math.floor(this.quotientDigitCurrent.remainderLeadingDigitContent / divisor);
  var quotientDigitContent = this.quotientDigitCurrent.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;
  var computation = this.currentNoteDivisorSmallLeadingDigit.computation;

  computation.content = new HighlightedContent();
  computation.content.push("\\hfil\\hfil$ \\displaystyle ");
  var partOne = computation.partOne;
  partOne.content = new HighlightedContent();
  partOne.lfloor = new HighlightedContent("\\left\\lfloor");
  partOne.rfloor = new HighlightedContent("\\right\\rfloor");
  partOne.content.push(partOne.lfloor);
  partOne.content.push("\\frac{"); 
  partOne.numeratorContainer = new HighlightedContent(this.quotientDigitCurrent.remainderLeadingDigitContent);
  partOne.content.push(partOne.numeratorContainer);
  partOne.content.push("}{");
  partOne.denominator = new HighlightedContent();
  partOne.denominatorNoPlusOne = new HighlightedContent(this.divisorLeadingDigitContent);
  partOne.denominator.push(partOne.denominatorNoPlusOne);
if (!this.flagIsOneDigitDivision) {
    partOne.plusOne = new HighlightedContent("+ 1");
    partOne.denominator.push(partOne.plusOne);
  }
  partOne.content.push(partOne.denominator);
  partOne.content.push("}");
  partOne.content.push(partOne.rfloor);
  computation.content.push(partOne.content);
  computation.partTwo = new HighlightedContent();
  var partTwoContent = "";
  computation.partOneEqualsPartTwo = new HighlightedContent("=");
  computation.content.push(computation.partOneEqualsPartTwo);
  var endsInEquality = true;
  if (!this.flagIsOneDigitDivision) {
    partTwoContent += `\\left\\lfloor\\frac{${this.quotientDigitCurrent.remainderLeadingDigitContent}}{${divisor}}\\right\\rfloor`;
    endsInEquality = false;
  }
  var remainderDigit = this.quotientDigitCurrent.remainderLeadingDigitContent - quotientDigitContent * divisor;
  if (remainderDigit > 0 && quotientDigitContent > 0) {
    if (!endsInEquality) {
      partTwoContent += " = ";
    }
    partTwoContent += `\\left\\lfloor\\frac{${quotientDigitContent * divisor}}{${divisor}} `;
    partTwoContent += ` + \\frac{${remainderDigit}}{${divisor}}`;
    partTwoContent += ` \\right\\rfloor`;
    endsInEquality = false;
  }
  if (!endsInEquality) {
    partTwoContent += `=`;
  }
  partTwoContent += `\\left\\lfloor${quotientDigitContent} `;
  if (remainderDigit > 0) {
    partTwoContent += ` + \\frac{${remainderDigit}}{${divisor}}`;
  }
  partTwoContent += ` \\right\\rfloor`;

  computation.partTwo.push(partTwoContent);
  computation.partTwo.push("=");
  computation.content.push(computation.partTwo);  
  computation.answer = new HighlightedContent(); 
  computation.answer.push(quotientDigitContainer);
  computation.content.push(computation.answer);
  computation.content.push("$");  
  this.notes.quotientDigit.computations.push("\n<br>\n<br>\n<br>\n");
  this.notes.quotientDigit.computations.push(computation.content);
  computation.content.flagUseOnly = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingComputationContent = function () {
  var quotientDigitContainer = this.quotientDigitCurrent.quotientDigitContainer;
  this.quotientDigitCurrent.quotientDigitContent = Math.floor(this.quotientDigitCurrent.remainderLeadingDigitContent / this.divisorLeadingDigitContent);
  var quotientDigitContent = this.quotientDigitCurrent.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundLargeDivisorContent = function () {
  var quotientDigitContainer = this.quotientDigitCurrent.quotientDigitContainer;
  var currentComputation = this.currentNoteLargeDivisor.computation;
  var partOne = currentComputation.partOne;
  var divisor = this.divisorLeadingDigitPlusOne;
  if (this.flagIsOneDigitDivision) {
    divisor = this.divisorLeadingDigitContent;
  }
  partOne.numeratorContent = this.quotientDigitCurrent.remainderLeadingDigitContent * this.base + this.quotientDigitCurrent.remainderSecondToLeadingDigitContent;
  this.quotientDigitCurrent.quotientDigitContent = Math.floor(partOne.numeratorContent / divisor);
  var quotientDigitContent = this.quotientDigitCurrent.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;

  currentComputation.content = new HighlightedContent();
  currentComputation.content.push("<br>\\hfil\\hfil$ \\displaystyle");
  partOne.content = new HighlightedContent();
  partOne.lfloor = new HighlightedContent("\\left\\lfloor");
  partOne.rfloor = new HighlightedContent("\\right\\rfloor");
  partOne.numerator = new HighlightedContent(partOne.numeratorContent);
  partOne.divisorLeadingDigitContainer = new HighlightedContent(this.divisorLeadingDigitContent);
  partOne.content.push(partOne.lfloor);
  partOne.content.push("\\frac{"); 
  if (this.base !== 10) {
    partOne.content.push(this.quotientDigitCurrent.remainderLeadingDigitContainer);
    partOne.content.push("\\cdot");
    partOne.content.push(this.base);
    partOne.content.push("+");
    partOne.content.push(this.quotientDigitCurrent.remainderSecondToLeadingDigitContainer);
  } else {
    partOne.content.push(partOne.numerator);
  }
  partOne.content.push("}{");
  partOne.denominator = new HighlightedContent();
  partOne.denominator.push(partOne.divisorLeadingDigitContainer);
  if (!this.flagIsOneDigitDivision) {
    partOne.plusOne = new HighlightedContent("+ 1");
    partOne.denominator.push(partOne.plusOne);
  }
  partOne.content.push(partOne.denominator);
  partOne.content.push("}");
  partOne.content.push(partOne.rfloor);
  currentComputation.content.push(partOne.content);
  currentComputation.partOneEqualsPartTwo = new HighlightedContent("=");
  currentComputation.content.push(currentComputation.partOneEqualsPartTwo);
  currentComputation.partTwo = new HighlightedContent();

  var partTwoContent = new HighlightedContent();
  if (! this.flagIsOneDigitDivision) {
    partTwoContent.push(partOne.lfloor);
    partTwoContent.push(`\\frac{`);
    partTwoContent.push(partOne.numeratorContent);
    partTwoContent.push(`}{`);
    partTwoContent.push(divisor);
    partTwoContent.push(`}`);
    partTwoContent.push(partOne.rfloor);
    partTwoContent.push(" = ");
  }
  var remainderDigit = partOne.numeratorContent - quotientDigitContent * divisor;
  if (remainderDigit > 0) {
    partTwoContent.push(`\\left\\lfloor\\frac{${quotientDigitContent * divisor}}{${divisor}} `);
    partTwoContent.push(` + \\frac{${remainderDigit}}{${divisor}}`);
    partTwoContent.push(` \\right\\rfloor=`);
  }
  partTwoContent.push(`\\left\\lfloor${quotientDigitContent} `);
  if (remainderDigit > 0) {
    partTwoContent.push(` + \\frac{${remainderDigit}}{${divisor}}`);
  }
  partTwoContent.push(` \\right\\rfloor`);
  currentComputation.partTwo.push(partTwoContent);
  currentComputation.partTwo.push("=");
  currentComputation.content.push(currentComputation.partTwo);  
  currentComputation.answer = new HighlightedContent(quotientDigitContent); 
  currentComputation.content.push(currentComputation.answer);
  currentComputation.content.push("$");  
  this.notes.quotientDigit.computations.push("\n<br>\n<br>\n<br>\n");
  this.notes.quotientDigit.computations.push(currentComputation.content);
  currentComputation.content.flagUseOnly = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingComputationHighlightFirstTime = function () {
  var currentNote = this.currentNoteDivisorEqualLeadingDigit; 
  currentNote.content.showFrame = this.currentFrameNumber;
  currentNote.firstPart.highlightFrames.push(this.currentFrameNumber);
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.remainder.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  currentNote.secondPart.highlightFrames.push(this.currentFrameNumber + 1);
  currentNote.secondPart.showFrame = this.currentFrameNumber + 1;

  var offset = this.quotientDigitCurrent.remainder.digits.length - this.divisor.digits.length;
  for (var i = this.divisor.digits.length - 1; i >= 0; i --) {
    this.divisor.digits[i].highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
    this.quotientDigitCurrent.remainder.digits[i + offset].highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  }
  currentNote.consequence.highlightFrames.push(this.currentFrameNumber + 2);
  currentNote.consequence.showFrame = this.currentFrameNumber + 2;
  this.currentFrameNumber += 2;
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitLargerDivisorHighlight = function () {
  var currentNote = this.currentNoteLargeDivisor;
  var computation = this.currentNoteLargeDivisor.computation;

  currentNote.content.showFrame = this.currentFrameNumber;
  currentNote.firstPart.highlightFrames.push(this.currentFrameNumber);
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.remainder.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);

  var offset = this.quotientDigitCurrent.remainder.digits.length - this.divisor.digits.length;
  for (var i = this.divisor.digits.length - 1; i >= 0; i --) {
    this.divisor.digits[i].highlightFrames.push(this.currentFrameNumber);
  }
  offset --;
  for (var i = 0; i <= this.divisor.digits.length; i ++) {
    this.quotientDigitCurrent.remainder.digits[i + offset].highlightFrames.push(this.currentFrameNumber);
  }
  this.currentFrameNumber ++;
  computation.content.showFrame = this.currentFrameNumber;
  
  currentNote.consequence.content.showFrame = this.currentFrameNumber;
  this.quotientDigitCurrent.remainderLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.remainderSecondToLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber);
  computation.partOne.numerator.highlightFrames.push(this.currentFrameNumber);
  currentNote.consequence.partOne.highlightFrames.push(this.currentFrameNumber);
  currentNote.consequence.partOnePointFive.highlightFrames.push(this.currentFrameNumber + 1);
  this.divisorLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber + 1);
  computation.partOne.divisorLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber + 1);
  computation.answer.highlightFrames.push(this.currentFrameNumber);
  if (!this.flagIsOneDigitDivision) {
    currentNote.consequence.partTwo.highlightFrames.push(this.currentFrameNumber + 2);
    computation.partOne.plusOne.highlightFrames.push(this.currentFrameNumber + 2);
    this.currentFrameNumber += 3;
  } else {
    this.currentFrameNumber += 2;
  }
  computation.partTwo.answerFrame = this.currentFrameNumber + 2;
  currentNote.consequence.partThree.highlightFrames.push(this.currentFrameNumber);
  computation.partOne.lfloor.redFrames.push(this.currentFrameNumber);
  computation.partOne.rfloor.redFrames.push(this.currentFrameNumber);
  computation.partOne.content.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  computation.partOneEqualsPartTwo.showFrame = this.currentFrameNumber + 1;
  computation.partOneEqualsPartTwo.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2)
  computation.answer.highlightFrames.push(this.currentFrameNumber + 2);
  computation.answer.showFrame = this.currentFrameNumber + 2;
  this.currentFrameNumber += 2;
  computation.content.hideFrame = this.currentFrameNumber + 1;
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitLargerDivisorHighlightAgain = function () {
  var currentNote = this.currentNoteLargeDivisor;

  currentNote.firstPart.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  currentNote.consequence.content.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);

  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  var remainder = this.quotientDigitCurrent.remainder; 
  remainder.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  for (var i = this.divisor.digits.length - 1; i >= 0; i --) {
    this.divisor.digits[i].highlightFrames.push(this.currentFrameNumber);
  }
  var offset = remainder.digits.length - this.divisor.digits.length - 1;
  for (var i = 0; i <= this.divisor.digits.length; i ++) {
    remainder.digits[i + offset].highlightFrames.push(this.currentFrameNumber);
  }
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  remainder.digits[remainder.digits.length - 2].highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  remainder.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);

  var computation = this.currentNoteLargeDivisor.computation;
  computation.content.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  computation.content.showFrame = this.currentFrameNumber + 1;
  computation.partTwo.showFrame = this.currentFrameNumber + 2;
  computation.answer.showFrame = this.currentFrameNumber + 2;
  computation.answer.highlightFrames.push(this.currentFrameNumber + 2);
  computation.partTwo.answerFrame = this.currentFrameNumber + 2;
  computation.content.hideFrame = this.currentFrameNumber + 3;
  this.currentFrameNumber += 2;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingComputationHighlightAgain = function () {
  var currentNote = this.currentNoteDivisorEqualLeadingDigit; 
  currentNote.secondPart.highlightFrames.push(this.currentFrameNumber + 1);

  var offset = this.quotientDigitCurrent.remainder.digits.length - this.divisor.digits.length;
  for (var i = this.divisor.digits.length - 1; i >= 0; i --) {
    this.divisor.digits[i].highlightFrames.push(this.currentFrameNumber + 1);
    this.quotientDigitCurrent.remainder.digits[i + offset].highlightFrames.push(this.currentFrameNumber + 1);
  }
  currentNote.content.highlightFrames.push(this.currentFrameNumber + 1);
  currentNote.content.hideFrame = (this.currentFrameNumber + 2);
  this.currentFrameNumber += 1;
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitSmallDivisorDigitHighlight = function () {
  //frame 0
  var remarks = this.currentNoteDivisorSmallLeadingDigit;
  remarks.firstPart.showFrame = this.currentFrameNumber;
  remarks.firstPart.highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.remainderLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber);
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber);
  //frame 1
  remarks.consequence.content.showFrame = this.currentFrameNumber + 1;
  remarks.consequence.partOne.highlightFrames.push(this.currentFrameNumber + 1);
  var computation = remarks.computation;
  computation.content.showFrame = this.currentFrameNumber + 1;
  this.quotientDigitCurrent.remainderLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber + 1);
  computation.partOne.numeratorContainer.highlightFrames.push(this.currentFrameNumber + 1);
  //frame 2
  remarks.consequence.partOnePointFive.highlightFrames.push(this.currentFrameNumber + 2);
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber + 2);
  computation.partOne.denominatorNoPlusOne.highlightFrames.push(this.currentFrameNumber + 2);
  //frame 3
  if (!this.flagIsOneDigitDivision) {
    remarks.consequence.partTwo.highlightFrames.push(this.currentFrameNumber + 3);
    computation.partOne.plusOne.highlightFrames.push(this.currentFrameNumber + 3);
    this.currentFrameNumber += 3;
  } else {
    this.currentFrameNumber += 2;
  }
  
  remarks.consequence.partThree.highlightFrames.push(this.currentFrameNumber + 1);
  computation.partOne.lfloor.redFrames.push(this.currentFrameNumber + 1);
  computation.partOne.rfloor.redFrames.push(this.currentFrameNumber + 1);
  computation.partOneEqualsPartTwo.showFrame = this.currentFrameNumber + 2;
  computation.answer.showFrame = this.currentFrameNumber + 2;
  computation.partOneEqualsPartTwo.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  computation.partOne.content.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3);
  computation.partTwo.showFrame = this.currentFrameNumber + 3;
  computation.partTwo.highlightFrames.push(this.currentFrameNumber + 3);
  computation.partOne.numeratorContainer.highlightFrames.push(
    this.currentFrameNumber + 2, this.currentFrameNumber + 3
  );
  this.divisor.leadingColumnContainer().highlightFrames.push(
    this.currentFrameNumber + 2, this.currentFrameNumber + 3
  );
  this.currentFrameNumber += 3;
  computation.content.hideFrame = this.currentFrameNumber + 1;
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientDigitSmallDivisorDigitHighlightAgain = function () {
  //frame 0
  var remarks = this.currentNoteDivisorSmallLeadingDigit;
  var computation = remarks.computation;
  remarks.content.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  this.divisor.leadingColumnContainer().highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  this.quotientDigitCurrent.remainderLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  computation.content.showFrame = this.currentFrameNumber;
  computation.partTwo.answerFrame = this.currentFrameNumber + 1;
  computation.answer.showFrame = this.currentFrameNumber + 1;
  computation.content.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  computation.content.hideFrame = this.currentFrameNumber + 2;
  this.currentFrameNumber += 1;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSmallerLeadingDigit = function () {
  if (!this.flagRoundSmallDivisorLeadingDigitReasoned) {
    this.computeQuotientDigitSmallDivisorDigitConsiderations();
  }
  this.computeQuotientDigitSmallDivisorDigitContent();
  if (!this.flagRoundSmallDivisorLeadingDigitReasoned) {
    this.computeQuotientDigitSmallDivisorDigitHighlight();
  } else {
    this.computeQuotientDigitSmallDivisorDigitHighlightAgain();
  }
  this.quotientDigitCurrent.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundSmallDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingDigit = function () {
  if (!this.flagRoundEqualDivisorLeadingDigitReasoned) {
    this.computeOneRoundEqualLeadingDigitConsiderations();
  }
  this.computeOneRoundEqualLeadingComputationContent();
  if (!this.flagRoundEqualDivisorLeadingDigitReasoned) {
    this.computeOneRoundEqualLeadingComputationHighlightFirstTime();
  } else {
    this.computeOneRoundEqualLeadingComputationHighlightAgain();
  }
  this.quotientDigitCurrent.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundEqualDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundLargerDivisor = function () {
  if (!this.flagRoundLargeDivisorLeadingDigitReasoned) {
    this.computeQuotientDigitLargerDivisorConsiderations();
  }
  this.computeOneRoundLargeDivisorContent();
  if (!this.flagRoundLargeDivisorLeadingDigitReasoned) {
    this.computeQuotientDigitLargerDivisorHighlight();
  } else {
    this.computeQuotientDigitLargerDivisorHighlightAgain();
  }
  this.quotientDigitCurrent.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundLargeDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeMultiplicationOneDigit = function (digitIndex) {
  var computation = this.multiplicationCurrent;
  computation.currentDivisorDigit = this.divisor.digits[digitIndex];
  if (digitIndex < this.divisor.digits.length) {
    computation.currentDivisorDigitContent = computation.currentDivisorDigit.getDigit();
  } else {
    computation.currentDivisorDigitContent = 0;
  }
  //console.log(`DEBUG: digit* digit: ${this.quotientDigitCurrent.quotientDigitContent} * ${this.multiplicationCurrent.currentDivisorDigitContent} `);
  computation.currentResultDigitContent = this.quotientDigitCurrent.quotientDigitContent * computation.currentDivisorDigitContent;
  computation.currentResultDigitContent += computation.oldCarryOverContent;
  computation.newCarryOverContent = Math.floor(computation.currentResultDigitContent / this.base);
  computation.currentResultDigitContent %= this.base;
  computation.currentResultDigit = new HighlightedContent(computation.currentResultDigitContent);
  computation.newCarryOver = new HighlightedContent(computation.newCarryOverContent);
  computation.newCarryOver.flagUseOnly = true;
  computation.newCarryOver.showFrame = this.currentFrameNumber;
  if (computation.newCarryOverContent > 0) {
    this.carryOverDivisor.digits[digitIndex + 1].push(computation.newCarryOver);
    computation.currentCarryOver.digits[digitIndex + 1] = computation.newCarryOver;
  }
  computation.currentSubtracand.digits.push(computation.currentResultDigit);
  computation.oneDigitMultiplicationNote = new OneDigitMultiplicationWithCarryOverSplit({
    base: this.base,
    left: this.quotientDigitCurrent.quotientDigitContainer,
    right: computation.currentDivisorDigit,
    startingFrame: this.currentFrameNumber,
    oldCarryOver: computation.oldCarryOver,
    newCarryOver: computation.newCarryOver,
    resultDigit: computation.currentResultDigit, 
    useColumns: true,
  });  
  
  computation.oldCarryOver = computation.newCarryOver; 
  computation.oldCarryOverContent = computation.newCarryOverContent;
  computation.oneDigitMultiplicationNote.computeContent();
  computation.oneDigitMultiplicationNoteResult = computation.oneDigitMultiplicationNote.content;
  computation.note.push(computation.oneDigitMultiplicationNoteResult);
  //this.currentFrameNumber = computation.oneDigitMultiplicationNote.endFrame;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSubtractionOneDigit = function (digitIndex) {
  var subtraction = this.subtractionCurrent;
  if (digitIndex == 0) {
    subtraction.oldCarryOver = new HighlightedContent();
    subtraction.oldCarryOverContent = 0;
  }
  subtraction.topDigit = subtraction.intermediate.digits[digitIndex];
  subtraction.topDigitContent = subtraction.topDigit.getDigit();
  subtraction.bottomDigit = this.multiplicationCurrent.currentSubtracand.digits[digitIndex];
  subtraction.bottomDigitContent = subtraction.bottomDigit.getDigit();
  subtraction.resultDigit = new HighlightedContent();
  subtraction.resultDigitContent = subtraction.topDigitContent - subtraction.bottomDigitContent + subtraction.oldCarryOverContent;
  subtraction.newCarryOverContent = 0;
  subtraction.newCarryOver = new HighlightedContent();
  if (subtraction.resultDigitContent < 0) {
    subtraction.resultDigitContent += this.base;
    subtraction.newCarryOverContent = - 1;
    subtraction.newCarryOver.content = subtraction.newCarryOverContent;
    subtraction.carryOvers.digits[digitIndex + 1] = subtraction.newCarryOver;
  } 
  subtraction.resultDigit.content = subtraction.resultDigitContent;
  subtraction.result.digits.push(subtraction.resultDigit);
  subtraction.oneDigitSubtractionNote = new OneDigitSubtractionWithCarryOver({
    base: this.base,
    top: subtraction.topDigit,
    bottom: subtraction.bottomDigit,
    startingFrame: this.currentFrameNumber,
    newCarryOver: subtraction.newCarryOver,
    oldCarryOver: subtraction.oldCarryOver,
    resultDigit: subtraction.resultDigit,
    useColumns: true,
  });
  var oneDigitSubtractionResult = subtraction.oneDigitSubtractionNote.getContentNoHighlight();
  subtraction.oldCarryOver = subtraction.newCarryOver;
  subtraction.oldCarryOverContent = subtraction.newCarryOverContent;
  subtraction.note.push(oneDigitSubtractionResult);
}

FreeCalcDivisionAlgorithm.prototype.beefupRemainderWithZeroes = function () {
  /** @type {ColumnsReversedHighlighted} */
  var subtracand = this.multiplicationCurrent.currentSubtracand;
  /** @type {number} */
  var numberOfZeroesToBeefUp = this.multiplicationCurrent.numberOfZeroesToBeefUp;
  for (var i = subtracand.digits.length - 1; i >= 0; i --) {
    subtracand.digits[i + numberOfZeroesToBeefUp] = subtracand.digits[i];    
  }
  for (var i = 0; i < numberOfZeroesToBeefUp; i ++) {
    subtracand.digits[i] = new HighlightedContent(0);
  }
}

FreeCalcDivisionAlgorithm.prototype.beefupRemainderWithZeroesHighlight = function () {
  /** @type {number} */
  var numberOfZeroesToBeefUp = this.multiplicationCurrent.numberOfZeroesToBeefUp;
  if (numberOfZeroesToBeefUp === 0) {
    if (this.notes.multiplication.beefUpZeroesNote.showFrame < 0) {
      //<- above check means we haven't had to beef up zeroes so far.
      //We the hide beef-up step: we don't show unless it's actually used. 
      this.notes.multiplication.beefUpZeroesNote.hideFrame = 1; 
    }
    return;
  }
  this.currentFrameNumber ++;
  /** @type {ColumnsReversedHighlighted} */
  var subtracand = this.multiplicationCurrent.currentSubtracand;
  for (var i = 0; i < numberOfZeroesToBeefUp; i ++) {
    subtracand.digits[i].showFrame = this.currentFrameNumber;
    subtracand.digits[i].highlightFrames.push(this.currentFrameNumber);
  }
  if (this.notes.multiplication.beefUpZeroesNote.showFrame < 0) {
    this.notes.multiplication.beefUpZeroesNote.showFrame = this.currentFrameNumber;
    // since we have a step that beefs up zeroes, we need to unhide the zero beef-up note:
    this.notes.multiplication.beefUpZeroesNote.hideFrame = - 1;
  }
  this.notes.multiplication.beefUpZeroesNote.highlightFrames.push(this.currentFrameNumber);
}

FreeCalcDivisionAlgorithm.prototype.computeResultLine = function () {
  var newLineWithMinusSign = new HighlightedContent(); 
  this.minusSigns.push(newLineWithMinusSign);
  newLineWithMinusSign.push(`\\\\`);
  newLineWithMinusSign.push(`\\cline{${this.divisor.digits.length + 3}-${this.divisor.digits.length + 3}}<br>`);
  this.currentFrameNumber ++;
  newLineWithMinusSign.showFrame = this.currentFrameNumber;
  var newResultLine = new HighlightedContent(`\\\\\\cline{${this.divisor.digits.length + 4} - ${this.numberOfColumns}}<br>`);
  this.resultLines.push(newResultLine);
  newResultLine.showFrame = this.currentFrameNumber;
  this.multiplicationCurrent.currentSubtracand.highlightAll(this.currentFrameNumber);
  this.quotientDigitCurrent.remainder.highlightAll(this.currentFrameNumber);
  //newResultLine.redFrames.push (this.currentFrameNumber);
  //newLineWithMinusSign.redFrames.push(this.currentFrameNumber);
}

FreeCalcDivisionAlgorithm.prototype.highlightSubtraction = function () {
  this.currentFrameNumber ++;
  this.subtractionCurrent.result.highlightAll(this.currentFrameNumber);
  this.quotientDigitCurrent.remainder.highlightAll(this.currentFrameNumber);
  this.multiplicationCurrent.currentSubtracand.highlightAll(this.currentFrameNumber);
  this.notes.subtraction.considerations.highlightFrames.push(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.subtractionCurrent.note.highlightFrames.push(this.currentFrameNumber);
  this.subtractionCurrent.carryOvers.highlightAll(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.subtractionCurrent.carryOvers.hideAll(this.currentFrameNumber);
  this.subtractionCurrent.note.hideFrame = this.currentFrameNumber;
  this.subtractionCurrent.note.flagUseOnly = true;
  this.currentFrameNumber ++;
}

FreeCalcDivisionAlgorithm.prototype.hideMultiplicationIntermediates = function() {
  this.multiplicationCurrent.note.highlightFrames.push(this.currentFrameNumber + 1);
  this.multiplicationCurrent.currentCarryOver.highlightAll(this.currentFrameNumber + 1);
  this.multiplicationCurrent.note.hideFrame = this.currentFrameNumber + 2;
  this.multiplicationCurrent.note.flagUseOnly = true;
  this.multiplicationCurrent.currentCarryOver.hideAll(this.currentFrameNumber + 2);
  this.currentFrameNumber += 2;
}

FreeCalcDivisionAlgorithm.prototype.computeRoundPartTwo = function () {
  this.currentFrameNumber ++;
  var showFullDetails = ! this.flagOneDigitMultiplicationIllustrated;
  if (this.quotientDigitCurrent.quotientDigitContent === 1) {
    showFullDetails = false;
  }
  var showMultiplicationNotes = true;
  if (this.quotientDigitCurrent.quotientDigitContent === 1 || this.divisor.digits.length <= 0) {
    showMultiplicationNotes = false;
  }
  this.divisor.highlightAll(this.currentFrameNumber + 1);
  this.quotientDigitCurrent.quotientDigitContainer.highlightFrames.push(this.currentFrameNumber + 1);
  var multiplicationCurrent = this.multiplicationCurrent; 
  multiplicationCurrent.currentSubtracand = new ColumnsReversedHighlighted();
  multiplicationCurrent.currentCarryOver = new ColumnsReversedHighlighted();

  multiplicationCurrent.currentCarryOver = new ColumnsReversedHighlighted();
  multiplicationCurrent.note = new HighlightedContent();
  multiplicationCurrent.oldCarryOverContent = 0;
  multiplicationCurrent.carryOversCurrentDivisor = new ColumnsReversedHighlighted();
  multiplicationCurrent.oldCarryOver = null;

  if (this.flagFirstRun) {
    this.notes.multiplication.considerationsResult.push("$\\bullet$ Multiply quotient digit by divisor, put result under current dividend.");
    this.notes.multiplication.beefUpZeroesNote.push(" Fill gaps with zeroes. ");
    this.notes.multiplication.considerations.push(this.notes.multiplication.considerationsResult);
    this.notes.multiplication.considerations.push(this.notes.multiplication.beefUpZeroesNote);
    this.notes.multiplication.considerations.push("<br><br>");
    this.notes.multiplication.considerations.showFrame = this.currentFrameNumber;
  }
  this.notes.multiplication.considerationsResult.highlightFrames.push(this.currentFrameNumber);
  this.quotientDigitCurrent.quotientDigitContainer.highlightFrames.push(this.currentFrameNumber);
  this.divisor.highlightAll(this.currentFrameNumber);
  if (showMultiplicationNotes) {
    multiplicationCurrent.note.push ("<br><br>\\hfil\\hfil$\\begin{array}{r@{~}c@{~}l}");
  }
  for (var counter = 0; counter < this.divisor.digits.length; counter ++) {
    if (showFullDetails) {
      this.currentFrameNumber ++;
    }
    this.computeMultiplicationOneDigit(counter);
    if (showFullDetails) {
      multiplicationCurrent.oneDigitMultiplicationNote.highlightContent();
      this.currentFrameNumber = multiplicationCurrent.oneDigitMultiplicationNote.endFrame;
      this.flagOneDigitMultiplicationIllustrated = true;
    }
  }
  if (multiplicationCurrent.oldCarryOverContent !== 0) {    
    var mostSignificantDigit = new HighlightedContent(multiplicationCurrent.oldCarryOverContent);
    multiplicationCurrent.currentSubtracand.digits.push(mostSignificantDigit);
    if (showFullDetails) {
      mostSignificantDigit.answerFrame = this.currentFrameNumber;
      mostSignificantDigit.highlightFrames.push(this.currentFrameNumber);
    }
  }
  this.subtracands.push(multiplicationCurrent.currentSubtracand);
  if (!showFullDetails) {
    this.multiplicationCurrent.currentSubtracand.setAnswerFrame(this.currentFrameNumber + 1);
    multiplicationCurrent.currentCarryOver.setShowFrame(this.currentFrameNumber + 1);
    multiplicationCurrent.currentCarryOver.highlightAll(this.currentFrameNumber + 1);
  }
  if (showMultiplicationNotes) {
    if (!showFullDetails) {
      multiplicationCurrent.note.showFrame = this.currentFrameNumber + 1;
    }
    multiplicationCurrent.note.push ("\\end{array} $<br><br>");
    this.notes.multiplication.computations.push(multiplicationCurrent.note);
    this.hideMultiplicationIntermediates();
  }
  this.currentFrameNumber ++;
  this.quotientDigitCurrent.quotientDigitContainer.highlightFrames.push(this.currentFrameNumber);
  this.divisor.highlightAll(this.currentFrameNumber);
  multiplicationCurrent.currentSubtracand.highlightAll(this.currentFrameNumber);
  this.notes.multiplication.considerationsResult.highlightFrames.push(this.currentFrameNumber);
 
  this.beefupRemainderWithZeroes();
  this.beefupRemainderWithZeroesHighlight();
  this.computeRoundPartThree();
}

FreeCalcDivisionAlgorithm.prototype.computeRoundPartThree = function () {
  var subtraction = this.subtractionCurrent; 
  subtraction.result = new ColumnsReversedHighlighted();
  subtraction.carryOvers = new ColumnsReversedHighlighted();
  subtraction.note = new HighlightedContent();
  subtraction.intermediate = this.intermediates[this.intermediates.length - 1];
  this.computeResultLine();
  var showNotes = !this.flagOneSubtractionIllustrated;
  this.flagOneSubtractionIllustrated = true;
  if (this.flagFirstRun) {
    this.notes.subtraction.considerations.showFrame = this.currentFrameNumber;
    this.notes.subtraction.considerations.highlightFrames.push(this.currentFrameNumber);
    this.notes.subtraction.considerations.push("<br><br>$\\bullet$ Subtract.");
  }
  if (this.flagFirstRun) {
    this.notes.subtraction.considerations.highlightFrames.push(this.currentFrameNumber);
  }
  subtraction.carryOvers.allocateDigits(this.quotientDigitCurrent.remainder.digits.length);
  subtraction.carryOvers.digitPrefix = `\\text{{\\tiny $${this.options.negativeCarryOverPrefix}`;
  subtraction.carryOvers.digitSuffix = "$}}";
  subtraction.note.push("<br><br>\\hfil\\hfil$\\begin{array}{@{}r@{~}c@{~}l}");
  for (var counter = 0; counter < this.multiplicationCurrent.currentSubtracand.digits.length; counter ++) {
    if (showNotes) {
      this.currentFrameNumber ++;
    }
    this.computeOneRoundSubtractionOneDigit(counter); 
    if (showNotes) {
      subtraction.oneDigitSubtractionNote.highlightContent();
      this.currentFrameNumber = subtraction.oneDigitSubtractionNote.endFrame;
    }
  }
  subtraction.note.push("\\end{array}$");
  subtraction.result.removeLeadingZeroesAccountRemovedAsExtraColumns();
  this.currentFrameNumber = subtraction.oneDigitSubtractionNote.endFrame + 1;
  this.intermediates.push(subtraction.result);
  this.intermediateCarryOvers.push(subtraction.carryOvers);
  if (!showNotes) {
    subtraction.intermediate.highlightAll(this.currentFrameNumber);
    this.multiplicationCurrent.currentSubtracand.highlightAll(this.currentFrameNumber);
    subtraction.result.setAnswerFrame(this.currentFrameNumber + 1);
    subtraction.carryOvers.highlightAll(this.currentFrameNumber + 1);
    subtraction.carryOvers.setShowFrame(this.currentFrameNumber + 1);
    subtraction.note.showFrame = this.currentFrameNumber + 1;
    subtraction.note.highlightFrames.push(this.currentFrameNumber + 1);
  }
  this.highlightSubtraction();
  this.notes.subtraction.computations.push(subtraction.note);
  if (this.flagFirstRun) {
    this.notes.finalNotesPartOne.push("<br><br>$\\bullet$ Repeat. ");
  }
  this.highlightRepeat();
}

FreeCalcDivisionAlgorithm.prototype.highlightRepeat = function () {
  if (this.notes.finalNotesPartOne.showFrame < 0) {
    this.notes.finalNotesPartOne.showFrame = this.currentFrameNumber;
  }
  this.subtractionCurrent.result.highlightAll(this.currentFrameNumber);
  this.notes.finalNotesPartOne.highlightFrames.push(this.currentFrameNumber);
  this.multiplicationCurrent.carryOversCurrentDivisor.hideAll(this.currentFrameNumber);
  this.divisor.highlightAll(this.currentFrameNumber);
  this.currentFrameNumber ++;
}

FreeCalcDivisionAlgorithm.prototype.placeCurrentQuotientDigit = function (
  /**@type {HighlightedContent[]} */
  outputArrayZeroesThatWereAdded
) {
  var currentIndex = this.multiplicationCurrent.numberOfZeroesToBeefUp;
  var quotientIndex = this.quotientExtras.length;
  for (var counterRow = this.quotientExtras.length - 1; counterRow >= 0; counterRow --) {
    var currentRow = this.quotientExtras[counterRow];
    if (currentRow.digits[currentIndex] !== null && currentRow.digits[currentIndex] !== undefined) {
      break;
    }
    quotientIndex = counterRow;
  }
  if (quotientIndex >= this.quotientExtras.length) {
    this.quotientExtras.push(new ColumnsReversedHighlighted());
  }
  var currentQuotient = this.quotientExtras[quotientIndex];
  currentQuotient.digits[currentIndex] = this.quotientDigitCurrent.quotientDigitContainer;
  for (var i = currentIndex + 1; i < currentQuotient.digits.length; i ++) {
    var currentDigit = undefined;
    if (currentQuotient.digits[i] instanceof HighlightedContent) {
      currentDigit =  currentQuotient.digits[i].getDigit();
    } 
    if (currentDigit !== undefined) {
      break;
    }
    currentQuotient.digits[i] = new HighlightedContent(0);
    outputArrayZeroesThatWereAdded.push (currentQuotient.digits[i]);
  }
}

FreeCalcDivisionAlgorithm.prototype.computeRound = function () {
  this.quotientDigitCurrent.remainderLeadingDigitContainer = this.quotientDigitCurrent.remainder.leadingColumnContainer();
  this.quotientDigitCurrent.remainderLeadingDigitContent = this.quotientDigitCurrent.remainderLeadingDigitContainer.getDigit();
  if (this.quotientDigitCurrent.remainder.digits.length > 1) {
    this.quotientDigitCurrent.remainderSecondToLeadingDigitContainer = this.quotientDigitCurrent.remainder.digits[this.quotientDigitCurrent.remainder.digits.length - 2];
    this.quotientDigitCurrent.remainderSecondToLeadingDigitContent = this.quotientDigitCurrent.remainderSecondToLeadingDigitContainer.getDigit();
  } else {
    this.quotientDigitCurrent.remainderSecondToLeadingDigitContainer = null;
    this.quotientDigitCurrent.remainderSecondToLeadingDigitContent = - 1;
  } 
  this.quotientDigitCurrent.quotientDigitContent = - 1;
  if (
    this.divisorLeadingDigitContent < this.quotientDigitCurrent.remainderLeadingDigitContent //|| 
    //(this.flagIsOneDigitDivision && this.divisorLeadingDigitContent === this.quotientDigitCurrent.remainderLeadingDigitContent)
  ) {
    this.quotientDigitCurrent.numberRelevantIntermediateDigits = 1;
    this.computeOneRoundSmallerLeadingDigit();
  } else if (this.quotientDigitCurrent.remainder.hasGreaterThanOrEqualToStart(this.divisor)) {
    this.quotientDigitCurrent.numberRelevantIntermediateDigits = 1;
    this.computeOneRoundEqualLeadingDigit();
  } else {
    this.quotientDigitCurrent.numberRelevantIntermediateDigits = 2;
    this.computeOneRoundLargerDivisor();
  }
  if (this.quotientDigitsOffset < 0) {
    this.quotientDigitsOffset = 1;
  }
  this.computeRoundPartTwo();
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientFinal = function () {
  this.numberOfIntermediateQuotients = this.quotientExtras.length;
  if (this.quotientExtras.length === 1) {
    this.quotientMain = this.quotientExtras[0];
    return;
  }

  this.quotientMain = new ColumnsReversedHighlighted();
  var numberOfQuotientDigits = this.quotientExtras[0].digits.length;
  for (var i = 0; i < numberOfQuotientDigits; i ++) {
    var currentDigit = 0;
    for (var counterRow = 0; counterRow < this.numberOfIntermediateQuotients; counterRow ++) {
      var currentRow = this.quotientExtras[counterRow];
      if (currentRow.digits[i] === undefined || currentRow.digits[i] === null) {
        continue;
      }
      var incomingDigit = currentRow.digits[i].getDigit();
      if (incomingDigit !== undefined)  { 
        currentDigit += incomingDigit;
      }
    }
    this.quotientMain.digits[i] = new HighlightedContent(currentDigit);
  }
  this.quotientMain.removeLeadingZeroesAccountRemovedAsExtraColumns();
}

FreeCalcDivisionAlgorithm.prototype.computeQuotientExtras = function () {
  if (this.numberOfIntermediateQuotients <= 1) {
    //this.solution.push(this.quotientMain.getTableRow(this.divisor.digits.length + 2));
    //this.solution.push("\\\\\n<br>\n");
    return;
  }
  var first = true;
  for (var counterRow = this.numberOfIntermediateQuotients - 1; counterRow >= 0; counterRow --) {
    for (var i = 0; i < this.divisor.digits.length + 1; i ++) {
      this.solution.push("&");
    }
    if (first) {
      this.notes.quotientCollection.plusSign = new HighlightedContent(`$+$`);
      this.solution.push(`\\multirow{${this.numberOfIntermediateQuotients}}{*}{`);
      this.solution.push(this.notes.quotientCollection.plusSign);
      this.solution.push("}");
    }
    first = false;
    var currentQuotient = this.quotientExtras[counterRow];
    var offset = this.dividend.digits.length - currentQuotient.digits.length;
    //var offset = this.quotientDigitsOffset + this.quotientMain.digits.length - currentQuotient.digits.length;
    this.solution.pushArray(currentQuotient.getTableArrayHighlightedContent(offset + 2));
    if (counterRow > 0) {
      this.solution.push("\\\\\n<br>");
    }
  }
  this.quotientMainLine.push(`\\\\\\cline{${this.divisor.digits.length + 2} - ${this.numberOfColumns}}`);
  this.solution.push(this.quotientMainLine); 
}

function DigitAddition(
  /**@type {{digits: number[], }} */
  inputData
) {
  this.digits = inputData.digits;

} 

FreeCalcDivisionAlgorithm.prototype.computeIntermediateQuotientConsiderationsFillGaps = function() {
  var gapsExist = false;
  for (var i = 0; i < this.quotientExtras.length; i ++) {
    this.quotientExtras[i].highlightAll(this.currentFrameNumber);
    if (this.quotientExtras[i].hasGaps()) {
      gapsExist = true;
    }
  }
  if (!gapsExist) {
    return;
  }
  var considerations = this.notes.quotientCollection.considerations;
  this.currentFrameNumber ++;
  var gapsExistConsideration = new HighlightedContent("<br><br>$\\bullet$ If any, fill gaps in quotients with zeroes.");
  gapsExistConsideration.showFrame = this.currentFrameNumber;
  gapsExistConsideration.highlightFrames.push (this.currentFrameNumber);
  considerations.push(gapsExistConsideration);
  var fillerZero = new HighlightedContent(0);
  fillerZero.showFrame = this.currentFrameNumber;
  fillerZero.highlightFrames.push(this.currentFrameNumber);
  for (var i = 0; i < this.quotientExtras.length; i ++) {
    this.quotientExtras[i].fillGaps(fillerZero);
  }
}

FreeCalcDivisionAlgorithm.prototype.computeIntermediateQuotientConsiderations = function() {
  if (this.numberOfIntermediateQuotients <= 1) {
    return;
  }
  this.currentFrameNumber ++;
  var considerations = this.notes.quotientCollection.considerations;
  var moreThanOneQuotient = new HighlightedContent("<br><br>$\\bullet$ If more than one quotient row, add them. ")
  considerations.push(moreThanOneQuotient);
  var computations = this.notes.quotientCollection.computations;
  computations.push("<br><br> \\hfil\\hfil $\\begin{array}{r@{~}c@{~}l}");

  var considerations = this.notes.quotientCollection.considerations;
  moreThanOneQuotient.highlightFrames.push(this.currentFrameNumber);
  moreThanOneQuotient.showFrame = this.currentFrameNumber;
  this.quotientMainLine.showFrame = this.currentFrameNumber;
  this.notes.quotientCollection.plusSign.showFrame = this.currentFrameNumber;
  for (var i = 0; i < this.quotientExtras.length; i ++) {
    this.quotientExtras[i].highlightAll(this.currentFrameNumber);
  }

  for (var counterDigit = 0; counterDigit < this.quotientMain.digits.length; counterDigit ++) {
    this.currentFrameNumber ++;
    var monomialsFound = [];
    for (var counterQuotient = 0; counterQuotient < this.numberOfIntermediateQuotients; counterQuotient ++) {
      var currentMonomials = this.quotientExtras[counterQuotient];
      if (
        currentMonomials.digits[counterDigit] === undefined ||
        currentMonomials.digits[counterDigit] === null
      ) {
        continue;
      }
      currentMonomials.digits[counterDigit].highlightFrames.push(this.currentFrameNumber);
      monomialsFound.push (currentMonomials.digits[counterDigit]);
    }
    
    this.quotientMain.digits[counterDigit].showFrame = this.currentFrameNumber;
    this.quotientMain.digits[counterDigit].highlightFrames.push(this.currentFrameNumber);
    if (monomialsFound.length > 0) {
      var newComputation = new HighlightedContent();
      var left = new HighlightedContent();
      var right = new HighlightedContent();
      var equality = new HighlightedContent("="); 
      for (var i = 0; i < monomialsFound.length; i ++) {
        left.push(monomialsFound[i].content);
        if (i != monomialsFound.length - 1) {
          left.push("+");
        }
      }
      right.push(this.quotientMain.digits[counterDigit].content);
      newComputation.push(left);
      newComputation.push(" & ");
      newComputation.push(equality);
      newComputation.push(" & ");
      newComputation.push(right);
      left.highlightFrames.push(this.currentFrameNumber);
      equality.highlightFrames.push(this.currentFrameNumber);
      right.highlightFrames.push(this.currentFrameNumber);
      newComputation.push("\\\\");
      newComputation.showFrame = this.currentFrameNumber;
      computations.push(newComputation);
    }
  }
  computations.push("\\end{array}$ ");
  computations.hideFrame = this.currentFrameNumber + 1;
}

FreeCalcDivisionAlgorithm.prototype.computeAbridgedDisplayConsiderations = function () {
  if (!this.flagShowAbridgedConsiderations) {
    return;
  }
  this.currentFrameNumber ++;

  for (var counterRow = 0; counterRow < this.quotientExtras.length; counterRow ++) {
    this.quotientExtras[counterRow].highlightAll(this.currentFrameNumber);
    this.quotientExtras[counterRow].hideAll(this.currentFrameNumber + 1);
  }
  //for (var counterCarryOvers = 0; counterCarryOvers < this.intermediateCarryOvers.length; counterCarryOvers ++) {
  //  this.intermediateCarryOvers[counterCarryOvers].highlightAll(this.currentFrameNumber);
  //  this.intermediateCarryOvers[counterCarryOvers].hideAll(this.currentFrameNumber + 1);
  //}
  this.notes.quotientCollection.computations.hideFrame = this.currentFrameNumber;
  this.notes.quotientCollection.computations.flagUseOnly = true;
  if (this.notes.quotientCollection.plusSign !== null) {
    this.notes.quotientCollection.plusSign.highlightFrames.push(this.currentFrameNumber);
    this.notes.quotientCollection.plusSign.hideFrame = this.currentFrameNumber + 1;
  }
  this.quotientMainLine.hideFrame = this.currentFrameNumber + 1;
  var shortenTableouxConsideration = new HighlightedContent();
  shortenTableouxConsideration.push ("<br><br>$\\bullet$ Many textbooks teach a slightly different that skips multiple quotient digits. ");

  shortenTableouxConsideration.push ("<br><br>$\\bullet$ This algorithm however involves a lot of guesswork and is not suitable for computers. ");
  shortenTableouxConsideration.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  shortenTableouxConsideration.showFrame = this.currentFrameNumber;
  this.notes.quotientCollection.considerations.push(shortenTableouxConsideration);
  //this.notes.quotientCollection.considerations.push(moreConsiderations);
  //var makeSureLastFrameIsShown = new HighlightedContent(" ");
  //makeSureLastFrameIsShown.showFrame = this.currentFrameNumber;
  //this.notes.quotientCollection.considerations.push(makeSureLastFrameIsShown);
}

FreeCalcDivisionAlgorithm.prototype.computeFinalAnswerContent = function () {
  var finalAnswer       = this.notes.finalAnswer;
  finalAnswer.content   = new HighlightedContent();
  finalAnswer.dividend  = new HighlightedContent();
  finalAnswer.divisor   = new HighlightedContent();
  finalAnswer.quotient  = new HighlightedContent();
  finalAnswer.remainder = new HighlightedContent();
  finalAnswer.content.push("<br><br>$\\bullet$ Final answer. ");
  finalAnswer.content.push(finalAnswer.dividend);
  finalAnswer.content.push(". ");
  finalAnswer.content.push(finalAnswer.divisor);
  finalAnswer.content.push(". ");
  finalAnswer.content.push(finalAnswer.quotient);
  finalAnswer.content.push(". ");
  finalAnswer.content.push(finalAnswer.remainder);
  finalAnswer.content.push(". ");

  finalAnswer.dividend.push("Dividend = $");
  finalAnswer.dividend.push(this.dividend.getTableRow(0, ""));
  finalAnswer.dividend.push("$");  
  finalAnswer.divisor.push("Divisor = $");
  finalAnswer.divisor.push(this.divisor.getTableRow(0, ""));
  finalAnswer.divisor.push("$");  
  finalAnswer.quotient.push("Quotient = $");
  finalAnswer.quotient.push(this.quotientMain.getTableRow(0, ""));
  finalAnswer.quotient.push("$");  
  finalAnswer.remainder.push("Remainder = $");
  finalAnswer.remainder.push(this.intermediates[this.intermediates.length - 1].getTableRow(0, ""));
  finalAnswer.remainder.push("$");  
}

FreeCalcDivisionAlgorithm.prototype.highlightFinalAnswer = function() {
  this.currentFrameNumber ++;
  var finalAnswer = this.notes.finalAnswer;
  finalAnswer.content.showFrame = this.currentFrameNumber;
  finalAnswer.dividend.highlightFrames.push(this.currentFrameNumber);
  this.dividend.highlightAll(this.currentFrameNumber);
  finalAnswer.divisor.highlightFrames.push(this.currentFrameNumber + 1);
  this.divisor.highlightAll(this.currentFrameNumber + 1);
  finalAnswer.quotient.highlightFrames.push(this.currentFrameNumber + 2);
  this.quotientMain.highlightAll(this.currentFrameNumber + 2);
  finalAnswer.remainder.highlightFrames.push(this.currentFrameNumber + 3);
  this.intermediates[this.intermediates.length - 1].highlightAll(this.currentFrameNumber + 3);
  this.currentFrameNumber += 3;
}

FreeCalcDivisionAlgorithm.prototype.computeFinalAnswerCheckContent = function () {
  var finalAnswerCheck       = this.notes.finalAnswerCheck;
  finalAnswerCheck.content   = new HighlightedContent();
  finalAnswerCheck.dividend  = new HighlightedContent();
  finalAnswerCheck.divisor   = new HighlightedContent();
  finalAnswerCheck.quotient  = new HighlightedContent();
  finalAnswerCheck.remainder = new HighlightedContent();
  finalAnswerCheck.content.push("<br><br>$\\bullet$ Check. ")

  finalAnswerCheck.content.push("$");
  finalAnswerCheck.content.push(finalAnswerCheck.dividend);
  finalAnswerCheck.content.push(" \\stackrel{?}{=} ");
  finalAnswerCheck.content.push(finalAnswerCheck.divisor);
  finalAnswerCheck.content.push("\\cdot")
  finalAnswerCheck.content.push(finalAnswerCheck.quotient);
  finalAnswerCheck.content.push(" + ");
  finalAnswerCheck.content.push(finalAnswerCheck.remainder);
  finalAnswerCheck.content.push(" $ ");

  finalAnswerCheck.dividend.push(this.dividend.getTableRow(0, ""));
  finalAnswerCheck.divisor.push(this.divisor.getTableRow(0, ""));
  finalAnswerCheck.quotient.push(this.quotientMain.getTableRow(0, ""));
  finalAnswerCheck.remainder.push(this.intermediates[this.intermediates.length - 1].getTableRow(0, ""));
}

FreeCalcDivisionAlgorithm.prototype.highlightFinalAnswerCheck = function() {
  this.currentFrameNumber ++;
  var finalAnswer = this.notes.finalAnswer;
  var finalAnswerCheck = this.notes.finalAnswerCheck;
  finalAnswerCheck.content.showFrame = this.currentFrameNumber;
  finalAnswer.dividend.highlightFrames.push(this.currentFrameNumber);
  finalAnswerCheck.dividend.highlightFrames.push(this.currentFrameNumber);
  this.dividend.highlightAll(this.currentFrameNumber);
  finalAnswer.divisor.highlightFrames.push(this.currentFrameNumber + 1);
  finalAnswerCheck.divisor.highlightFrames.push(this.currentFrameNumber + 1);
  this.divisor.highlightAll(this.currentFrameNumber + 1);
  finalAnswer.quotient.highlightFrames.push(this.currentFrameNumber + 2);
  finalAnswerCheck.quotient.highlightFrames.push(this.currentFrameNumber + 2);
  this.quotientMain.highlightAll(this.currentFrameNumber + 2);
  finalAnswer.remainder.highlightFrames.push(this.currentFrameNumber + 3);
  finalAnswerCheck.remainder.highlightFrames.push(this.currentFrameNumber + 3);
  this.intermediates[this.intermediates.length - 1].highlightAll(this.currentFrameNumber + 3);
}

FreeCalcDivisionAlgorithm.prototype.computeProblemSetup = function () {
  var goal = this.notes.goal;
  goal.content.push("Divide $");
  goal.inputDividend = new HighlightedContent(this.inputDividend);
  goal.inputDivisor = new HighlightedContent(this.inputDivisor);
  goal.content.push(goal.inputDividend);
  goal.content.push("$ by $");
  goal.content.push(goal.inputDivisor);
  goal.content.push("$ with quotient and remainder.");
  goal.content.highlightFrames.push(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.solution.showFrame = this.currentFrameNumber;
  this.dividend.highlightAll(this.currentFrameNumber);
  goal.inputDividend.highlightFrames.push(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.divisor.highlightAll(this.currentFrameNumber);
  goal.inputDivisor.highlightFrames.push(this.currentFrameNumber);
  this.currentFrameNumber ++;
}

FreeCalcDivisionAlgorithm.prototype.computeSlideContent = function(inputData) {
  this.init(inputData);
  this.dividend = new ColumnsReversedHighlighted(inputData.topNumber);
  this.divisor = new ColumnsReversedHighlighted(inputData.bottomNumber);
  this.flagIsOneDigitDivision = false;
  if (this.divisor.digits.length === 1) {
    this.flagIsOneDigitDivision = true;
  }
  this.currentFrameNumber = Number(this.startingFrameNumber);
  this.slideContent = new HighlightedContent();
  this.solution = new HighlightedContent(); 
  this.notes.contentNotes = new HighlightedContent();
  this.notes.contentComputations = new HighlightedContent();
  this.notes.quotientDigit.computations = new HighlightedContent();
  this.notes.quotientDigit.considerations = new HighlightedContent();
  this.notes.multiplication.computations = new HighlightedContent();
  this.notes.multiplication.considerations = new HighlightedContent();
  this.notes.multiplication.considerationsResult = new HighlightedContent();
  this.notes.multiplication.beefUpZeroesNote = new HighlightedContent();
  this.notes.subtraction.computations = new HighlightedContent();
  this.notes.subtraction.considerations = new HighlightedContent();
  this.notes.finalNotesPartOne = new HighlightedContent();
  this.notes.quotientCollection.computations = new HighlightedContent();
  this.notes.quotientCollection.considerations = new HighlightedContent();
  this.quotientMainLine = new HighlightedContent();
  this.notes.quotientDigitPlacement.content = new HighlightedContent();
  this.quotientDigitsOffset = - 1;


  this.notes.goal.content = new HighlightedContent();
  this.quotientMain = new ColumnsReversedHighlighted();
  this.quotientExtras = [new ColumnsReversedHighlighted()];
  this.carryOverDivisor = new ColumnsReversedHighlighted();
  this.carryOverDivisor.digitPrefix = "\\text{{\\tiny $\\phantom{1}\\!\\!\\!\\!\\!~{{ ";
  this.carryOverDivisor.digitSuffix = "}}$}}"; 
  this.intermediates = [];
  this.intermediateCarryOvers = [];
  this.minusSigns = [];
  this.resultLines = [];
  this.subtracands = [];
  this.divisorLeadingDigitContainer = this.divisor.leadingColumnContainer();
  this.divisorLeadingDigitContent = this.divisorLeadingDigitContainer.getDigit();
  this.divisorLeadingDigitPlusOne = this.divisorLeadingDigitContent + 1;
  this.carryOverDivisor.allocateDigits(this.divisor.digits.length + 1);
  this.computeProblemSetup();
  
  this.numberOfColumns = this.dividend.digits.length + this.divisor.digits.length + 3;
  this.intermediates.push(this.dividend);
  this.flagRoundEqualDivisorLeadingDigitReasoned = false;
  this.flagRoundLargeDivisorLeadingDigitReasoned = false;
  this.flagRoundSmallDivisorLeadingDigitReasoned = false;
  this.flagOneDigitMultiplicationIllustrated = false;
  this.flagOneSubtractionIllustrated = false;
  this.flagFirstRun = true;
  var emergencyCounter = 0;
  var maxNumberOfRounds = 15;
  while(this.intermediates[this.intermediates.length - 1].isGreaterThanOrEqualTo(this.divisor)) {
    this.quotientDigitPlacementCompute();
    this.quotientDigitPlacementHighlight();
    this.computeRound();
    this.flagFirstRun = false;
    emergencyCounter ++;
    if (emergencyCounter > maxNumberOfRounds) {
      console.log("Too many rounds. ");
      break;
    }
  }
  this.notes.quotientDigitPlacement.partWeAreDone.showFrame = this.currentFrameNumber;
  this.notes.quotientDigitPlacement.partWeAreDone.highlightFrames.push(this.currentFrameNumber);
  this.notes.finalNotesPartOne.highlightFrames.push(this.currentFrameNumber);
  
  this.solution.push("\\hfil\\hfil$");
  this.solution.push("\\setlength\\extrarowheight{-5pt}<br>"); 
  this.solution.push("\\begin{array}{@{}r");
  for (var i = 0; i < this.divisor.digits.length; i ++) {
    this.solution.push("@{}r");
  }
  this.solution.push("@{}r@{}r");
  for (var i = 0; i < this.dividend.digits.length; i ++) {
    this.solution.push("@{}r");
  }
  this.solution.push("@{}r");
  this.solution.push("}");

  this.computeIntermediateQuotientConsiderationsFillGaps();
  this.computeQuotientFinal();
  this.computeQuotientExtras();
  this.computeIntermediateQuotientConsiderations();
  this.computeAbridgedDisplayConsiderations();
  this.computeFinalAnswerContent();
  this.highlightFinalAnswer();
  this.computeFinalAnswerCheckContent();
  this.highlightFinalAnswerCheck();

  this.solution.push("{~~}");
  this.solution.push(this.quotientMain.getTableRow(this.divisor.digits.length + 3 + this.dividend.digits.length - this.quotientMain.digits.length));
  this.solution.push("\\\\");
  this.solution.push(`\\cline{${this.divisor.digits.length + 2} - ${this.numberOfColumns}}`); 
  this.solution.push("<br>");
  this.solution.push(this.carryOverDivisor.getTableRow(0));
  this.solution.push(`&\\multicolumn{1}{|@{}l@{}}{}& `);
  this.solution.push(this.intermediateCarryOvers[0].getTableRow(1));
  this.solution.push(`\\\\`);
  this.solution.push("\n<br>\n");
  this.solution.push("\\phantom{m}");
  this.solution.push(this.divisor.getTableRow(1));
  this.solution.push("&\\multicolumn{1}{|l@{}}{~}&");
  this.solution.push(`~~~&`);
  this.solution.push(this.dividend.getTableRow(0));
  for (var counterIntermediate = 0; counterIntermediate < this.intermediates.length; counterIntermediate ++) {
    if (counterIntermediate < this.minusSigns.length) {
      this.solution.push(this.minusSigns[counterIntermediate]);
    }
    if (counterIntermediate >= this.subtracands.length) {
      continue;
    }
    var nextIntermediate = this.intermediates[counterIntermediate + 1];
    var currentSubtracand = this.subtracands[counterIntermediate];
    var offset = this.dividend.digits.length - currentSubtracand.digits.length;
    this.solution.push(currentSubtracand.getTableRow(this.divisor.digits.length + 3 + offset));
    if (counterIntermediate < this.resultLines.length) {
      this.solution.push(this.resultLines[counterIntermediate]);
    }
    if (counterIntermediate + 1 < this.intermediateCarryOvers.length) {
      var currentCarryOver = this.intermediateCarryOvers[counterIntermediate + 1];
      var offsetCarryOver = this.divisor.digits.length + 3;
      offsetCarryOver += this.dividend.digits.length - nextIntermediate.digits.length; 
      this.solution.push(currentCarryOver.getTableRow(offsetCarryOver));
      this.solution.push("\\\\<br>");
    }
    var offsetIntermediate = this.divisor.digits.length + 3;
    offsetIntermediate += this.dividend.digits.length - currentSubtracand.digits.length; 
    this.solution.push(nextIntermediate.getTableRow(offsetIntermediate));
  }
  this.solution.push("\\end{array} $ <br>\n");
  
  this.notes.contentNotes.push(this.notes.quotientDigitPlacement.content);
  this.notes.contentNotes.push("\n<br>\n<br>");    
  this.notes.contentNotes.push(this.notes.quotientDigit.considerations);
  this.notes.contentNotes.push("\n<br>\n<br>");
  this.notes.contentNotes.push(this.notes.multiplication.considerations);
  this.notes.contentNotes.push(this.notes.subtraction.considerations);
  this.notes.contentNotes.push(this.notes.finalNotesPartOne);
  this.notes.contentNotes.push(this.notes.quotientCollection.considerations);
  this.notes.contentNotes.push(this.notes.finalAnswer.content);
  this.notes.contentNotes.push(this.notes.finalAnswerCheck.content);

  this.notes.contentComputations.push(this.notes.quotientDigit.computations);
  this.notes.contentComputations.push(this.notes.multiplication.computations);
  this.notes.contentComputations.push(this.notes.subtraction.computations);
  this.notes.contentComputations.push(this.notes.quotientCollection.computations);
  this.slideContent.push(`\\begin{frame} ${this.options.fontSize}<br>`);
  this.slideContent.push(this.notes.goal.content);
  this.slideContent.push("<br><br>\\begin{columns}");
  this.slideContent.push("<br><br>\\column{0.4\\textwidth}");
  this.slideContent.push(this.solution);
  this.slideContent.push("<br><br>\\column{0.6\\textwidth}");
  this.slideContent.push(this.notes.contentNotes);
  this.slideContent.push("<br><br>");
  this.slideContent.push("\\end{columns}");
  this.slideContent.push("\n\n<br>\n<br>\n");
  this.slideContent.push(this.notes.contentComputations);
  this.slideContent.push ("<br><br>\\vskip 10 cm<br>");
  this.slideContent.push("\\end{frame}\n");
}


function FreeCalcSubtractionAlgorithm() {
  /**@type {string} */
  this.inputSummand = "";
  /**@type {string} */
  this.inputSubtracand = "";

  /** @type {string} */
  this.startingFrameNumber = "";
  /** @type {number} */
  this.currentFrameNumber = - 1;

  /** @type {string} */
  this.inputBase = "";
  /** @type {number} */
  this.base = - 1;
  
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {HighlightedContent} */
  this.algorithmMain = null;
  /**@type {HighlightedContent} */
  this.minusSign = null;
  /**@type {HighlightedContent} */
  this.lineSubtraction = null;
  /**@type {ColumnsReversedHighlighted} */
  this.summand = null;
  /**@type {ColumnsReversedHighlighted} */
  this.subtracand = null;
  /**@type {ColumnsReversedHighlighted} */
  this.result = null;
  /**@type {ColumnsReversedHighlighted} */
  this.carryOvers = null;

  this.oneRound = {
    /**@type {OneDigitSubtractionWithCarryOver} */
    computation: null,
    /** @type {number} */
    oldCarryOverContent: - 1,
    /** @type {number} */
    newCarryOverContent: - 1,
    /** @type {HighlightedContent} */
    newCarryOverContainer: null,
    /** @type {number} */
    resultDigitContent: - 1,
    /** @type {HighlightedContent} */
    resultDigitContainer: null,    
  };

  this.notes = {
    considerations: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      removeLeadingZeroes: null,
      /**@type {HighlightedContent} */
      ensureSummandLarger: null,
    },
    /**@type {HighlightedContent} */
    computationsWithEquationStartAndEnd: null,
    /**@type {HighlightedContent} */
    computations: null,
    problemStatement: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      subtracand: null,
      /**@type {HighlightedContent} */
      summand: null,
    }
  };
}

FreeCalcSubtractionAlgorithm.prototype.computeOneRound = function(digitIndex) {
  this.oneRound.newCarryOverContainer = new HighlightedContent();
  this.oneRound.resultDigitContainer = new HighlightedContent();
  this.result.digits[digitIndex] = this.oneRound.resultDigitContainer;
  //computations here
  this.oneRound.newCarryOverContent = 0;
  this.oneRound.resultDigitContent = this.oneRound.oldCarryOverContent + this.summand.getDigit(digitIndex) - this.subtracand.getDigit(digitIndex);
  if (this.oneRound.resultDigitContent < 0) {
    this.oneRound.resultDigitContent += this.base;
    this.oneRound.newCarryOverContent = - 1;
  }
  this.oneRound.newCarryOverContainer.push(this.oneRound.newCarryOverContent);
  this.oneRound.resultDigitContainer.push(this.oneRound.resultDigitContent);

  if (this.oneRound.newCarryOverContent !== 0) {
    this.carryOvers.digits[digitIndex + 1] = this.oneRound.newCarryOverContainer;
  }

  /** @type {{base: number, top: HighlightedContent, bottom: HighlightedContent, startingFrame: number, newCarryOver: HighlightedContent, oldCarryOver: HighlightedContent, resultDigit: HighlightedContent, useColumns: boolean}} */
  var subtractionData = {
    base: this.base,
    top: this.summand.digits[digitIndex],
    bottom: this.subtracand.digits[digitIndex],
    startingFrame: this.currentFrameNumber,
    newCarryOver: this.oneRound.newCarryOverContainer,
    oldCarryOver: this.carryOvers.digits[digitIndex],
    resultDigit: this.result.digits[digitIndex],
    useColumns: true
  };
  this.oneRound.computation = new OneDigitSubtractionWithCarryOver(subtractionData);
  this.oneRound.computation.computeContent();
  this.notes.computations.push(this.oneRound.computation.content);
  this.oneRound.oldCarryOverContent = this.oneRound.newCarryOverContent;
}

FreeCalcSubtractionAlgorithm.prototype.computeProblemStatement = function(){
  var problemStatement = this.notes.problemStatement; 
  problemStatement.content.push("Subtract ");
  problemStatement.subtracand = new HighlightedContent(this.inputSubtracand);
  problemStatement.summand = new HighlightedContent(this.inputSummand);
  problemStatement.content.push(problemStatement.subtracand);
  problemStatement.content.push(" from ");
  problemStatement.content.push(problemStatement.summand);
  problemStatement.content.push(". ");
  this.currentFrameNumber ++;
  this.algorithmMain.showFrame = this.currentFrameNumber;
  problemStatement.subtracand.highlightFrames.push(this.currentFrameNumber);
  this.subtracand.highlightAll(this.currentFrameNumber);
  this.currentFrameNumber ++;
  problemStatement.summand.highlightFrames.push(this.currentFrameNumber);
  this.summand.highlightAll(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.notes.considerations.ensureSummandLarger = new HighlightedContent("$\\bullet$ Ensure summand $>$ subtracand. ");
  this.notes.considerations.ensureSummandLarger.highlightFrames.push(this.currentFrameNumber);
  this.notes.considerations.ensureSummandLarger.showFrame = this.currentFrameNumber;
  this.notes.considerations.content.push(this.notes.considerations.ensureSummandLarger);
  this.subtracand.highlightAll(this.currentFrameNumber);
  this.summand.highlightAll(this.currentFrameNumber);
  this.currentFrameNumber ++;
  this.lineSubtraction.showFrame = this.currentFrameNumber;
  this.minusSign.showFrame = this.currentFrameNumber;
}

FreeCalcSubtractionAlgorithm.prototype.removeLeadingZeroesAndHighlight = function() {
  var found = false;
  for (var i = this.result.digits.length - 1; i >= 1; i --) {
    if (!(this.result.digits[i].getDigit() === 0)) {
      break;
    }
    found = true;
    this.result.digits[i].hideFrame = this.currentFrameNumber + 2;
    this.result.digits[i].highlightFrames.push(this.currentFrameNumber + 1);
  }
  if (!found) {
    return;
  }
  this.notes.considerations.removeLeadingZeroes = new HighlightedContent("<br><br>$\\bullet$ Remove leading zeroes. ");
  this.notes.considerations.removeLeadingZeroes.showFrame = this.currentFrameNumber + 1;
  this.notes.considerations.removeLeadingZeroes.highlightFrames.push(this.currentFrameNumber + 1, this.currentFrameNumber + 2);
  this.currentFrameNumber += 2;
  this.notes.considerations.content.push(this.notes.considerations.removeLeadingZeroes);
}

FreeCalcSubtractionAlgorithm.prototype.init = function(
  /** @type{{topNumber: string, bottomNumber: string, startingFrameNumber: string, base: string}} */ 
  inputData
) {
  this.inputSummand = inputData.topNumber;
  this.inputSubtracand = inputData.bottomNumber;
  this.inputBase = inputData.base;
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.base = Number(this.inputBase);
  if (typeof this.base !== "number") {
    throw (`Failed to convert base to integer`);
  }
  this.currentFrameNumber = Number(this.startingFrameNumber);
}

/**@returns {String[]} */
function NumberToStringLittleEndian(
  /**@type {Number} */
  input,
  /**@type {String[]} */
  digits
) {
  var resultDigitsReversed = [];
  var base = digits.length;
  for (;;) {
    if (input === 0) {
      break;
    }
    resultDigitsReversed.push(input % base);
    input = Math.floor(input / base);
  }
  return resultDigitsReversed;
}

/**@returns {String[]} */
function NumberToStringLittleEndianDefaultDigits(
  /**@type {Number} */
  input,
  /**@type {Number} */
  base
) {
  var digits = null;
  if (base === 16) {
    digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  } else {
    digits = [];
    for (var i = 0; i < base; i ++) {
      digits.push(`${i}`);
    }
  }
  var result = NumberToStringLittleEndian(input, digits);
  console.log("DEBUG: And the result is: " + result);
  return result;
}

FreeCalcSubtractionAlgorithm.prototype.computeSlideContent = function(inputData) {
  this.init(inputData);
  this.summand = new ColumnsReversedHighlighted(NumberToStringLittleEndianDefaultDigits(Number(this.inputSummand), this.base));
  this.subtracand = new ColumnsReversedHighlighted(NumberToStringLittleEndianDefaultDigits(Number(this.inputSubtracand), this.base));
  this.result = new ColumnsReversedHighlighted();
  this.carryOvers = new ColumnsReversedHighlighted();
  this.oneRound.computation = null;
  this.slideContent = new HighlightedContent();
  this.algorithmMain = new HighlightedContent();
  this.minusSign = new HighlightedContent("\\\\\\cline{1-1}");
  this.lineSubtraction = new HighlightedContent(`\\\\\\cline{2-${this.summand.digits.length + 1}}`);
  this.notes.considerations.content = new HighlightedContent();


  this.notes.computations = new HighlightedContent();
  this.notes.computationsWithEquationStartAndEnd = new HighlightedContent();
  this.notes.problemStatement.content = new HighlightedContent();


  this.carryOvers.digits[0] = new HighlightedContent();
  this.oneRound.oldCarryOverContent = 0;
  this.computeProblemStatement();
  this.notes.computationsWithEquationStartAndEnd.push("\\begin{array}{@{}r@{~}c@{~}l}");
  for (var i = 0; i < this.summand.digits.length; i ++) {
    this.currentFrameNumber ++;
    this.computeOneRound(i);
    this.oneRound.computation.highlightContent();
    this.currentFrameNumber = this.oneRound.computation.endFrame;
  }
  this.removeLeadingZeroesAndHighlight();
  this.notes.computationsWithEquationStartAndEnd.push(this.notes.computations);
  this.notes.computationsWithEquationStartAndEnd.push("\\end{array}");

  this.slideContent.push("\\begin{frame}");
  
  this.slideContent.push (this.notes.problemStatement.content);
  this.slideContent.push("<br><br> \\begin{columns}");

  this.slideContent.push("\\column{0.4\\textwidth}");

  this.slideContent.push("\\hfil\\hfil");

  this.algorithmMain.push("$\\begin{array}{c");
  for (var i = 0; i < this.summand.digits.length + 1; i ++) {
    this.algorithmMain.push("r");
  }
  this.algorithmMain.push("}");
  var offset = this.summand.digits.length - this.carryOvers.digits.length;
  this.algorithmMain.push(this.carryOvers.getTableRow(1 + offset));
  this.algorithmMain.push("\\\\");
  this.algorithmMain.push(this.summand.getTableRow(1));
  this.algorithmMain.push(this.minusSign);
  offset = this.summand.digits.length - this.subtracand.digits.length;
  this.algorithmMain.push(this.subtracand.getTableRow(1 + offset));
  this.algorithmMain.push(this.lineSubtraction);
  offset = this.summand.digits.length - this.result.digits.length;
  this.algorithmMain.push(this.result.getTableRow(1 + offset));
  this.algorithmMain.push("\\end{array}$");
  this.slideContent.push(this.algorithmMain);

  this.slideContent.push("\\column{0.6\\textwidth}")
  this.slideContent.push(this.notes.considerations.content);
  this.slideContent.push("\\end{columns}");
  this.slideContent.push("<br><br>\\vskip 2cm<br><br>");
  this.slideContent.push("\\hfil\\hfil $");
  
  this.slideContent.push(this.notes.computationsWithEquationStartAndEnd);
  this.slideContent.push("$");
  var emptyContent = new HighlightedContent("");
  emptyContent.showFrame = this.currentFrameNumber;
  this.slideContent.push(emptyContent);
  this.slideContent.push("<br>\\end{frame}");
}

function OperationTable(operationSymbol, base) {
  this.operationFunction = null;
  /**@type {String} */
  this.operationSymbol = operationSymbol;
  /** @type {boolean} */
  this.flagOperationInTheBottom = false;
  /**@type {HighlightedContent}*/
  this.base = - 1;
  /**@type {HighlightedContent} */
  this.content = new HighlightedContent();
  /**@type {HighlightedContent} */
  this.operationSign = new HighlightedContent();
  /**@type {HighlightedContent[][]} */
  this.contentOperation = null;
  /**@type {HighlightedContent[]} */
  this.rowLabels = null;
  /**@type {HighlightedContent[]} */
  this.columnLabels = null;
  /**@type {HighlightedContent} */
  this.note = new HighlightedContent();
  switch (this.operationSymbol) {
    case "+":
      this.init(this.addition, this.operationSymbol, base);
      break;
    case "\\cdot":
      this.init(this.multiplication, this.operationSymbol, base);
      break;
    default:
      throw (`Uknown operation ${this.operationSymbol}`);
  }
}

OperationTable.prototype.init = function(operationFunction, operationSymbol, base) {
  this.operationFunction = operationFunction;
  this.operationSymbol = operationSymbol;
  this.base = base;
}

OperationTable.prototype.addition = function(left, right) {
  return left + right;
}

OperationTable.prototype.multiplication = function(left, right) {
  return left * right;
}

OperationTable.prototype.subtraction = function(left, right) {
  return left - right;
}

OperationTable.prototype.highlightTable = function () {
  this.currentFrameNumber ++;
  for (var i = 0; i < this.base; i ++) {
    for (var j = 0; j < this.base; j ++) {
      var currentEntry = this.contentOperation[i][j];
      if (currentEntry.answerFrame > 0 || currentEntry.highlightFrames.length > 0) {
        continue;
      }
      currentEntry.answerFrame = this.currentFrameNumber;
    }
  }
  for (var i = 0; i < this.base; i ++ ) {
    var currentRow = this.rowLabels[i];
    var currentColumn = this.columnLabels[i];
    if (!currentRow.hasHighlight()) {
      currentRow.answerFrame = this.currentFrameNumber;
    }
    if (!currentColumn.hasHighlight()) {
      currentColumn.answerFrame = this.currentFrameNumber;
    }
  }
}

OperationTable.prototype.prepareTable = function() {
  this.content = new HighlightedContent();
  var content = this.content;
  this.contentOperation = new Array(this.base);
  this.rowLabels = new Array(this.base);
  this.columnLabels = new Array(this.base);
  this.operationSign = new HighlightedContent(this.operationSymbol);
  var rowLabels = this.rowLabels;
  var columnLabels = this.columnLabels;
  var contentOperation = this.contentOperation;
  content.push ("{\\footnotesize$\\begin{array}{@{}|r @{\\vrule width 1pt}|");
  for (var i = 0; i < this.base; i ++) {
    content.push("r@{}|");
  }
  content.push("}");
  content.push("\\hline");
  content.push(this.operationSign);
  for (var i = 0; i < this.base; i ++ ) {
    rowLabels[i] = new HighlightedContent(i);
    columnLabels[i] = new HighlightedContent(i);
    contentOperation[i] = new Array(this.base);
  }
  for (var i = 0; i < this.base; i ++) {
    content.push("&");
    content.push(columnLabels[i]);
  };
  content.push(`\\\\\\hline\\cline{1-${this.base + 1}}`);
  for (var i = 0; i < this.base; i ++) {
    content.push("<br><br>");
    content.push(rowLabels[i]);
    for (var j = 0; j < this.base; j ++) {
      content.push("&");
      contentOperation[i][j] = new HighlightedContent(this.operationFunction(i, j));
      content.push(contentOperation[i][j]);
    }
    content.push("\\\\\\hline");
  }
  content.push("\\end{array}$}");
}

function FreeCalcOneDigitOperationAlgorithm(operation) {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {number} */
  this.base = - 1;
  /**@type {number[][]} */
  this.pairsToAdd = [];
  /**@type {string} */
  this.inputPairs = "";
  /**@type {string} */
  this.inputBase = "";
  /**@type {number} */
  this.currentFrameNumber = null;
  /**@type {string} */
  this.startingFrameNumber = null;
  /**@type {boolean} */
  this.flagUseColumns = false;
  /**@type {boolean} */
  this.flagShowMakeTableNote = false;
  /**@type {boolean} */
  this.flagMakeTable = false;
  this.onePair = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    left: null, 
    /**@type {HighlightedContent} */
    right: null,
    /**@type {HighlightedContent} */
    equality: null,
    /**@type {HighlightedContent} */
    plus: null,
  };
  /**@type {OperationTable} */
  this.operationTable = null;
  this.notes = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    useColumns: null,
  };
  this.operation = {  
    /**@type {String} */
    name: operation,
    /**@type {String} */
    verb: "",
    /**@type {String} */
    noun: "",
    /**@type {function} */
    operator: null,
  };
} 

FreeCalcOneDigitOperationAlgorithm.prototype.computeOnePairHorizontal = function(index) {
  this.onePair.left = new HighlightedContent();
  this.onePair.equality = new HighlightedContent("=");

  var leftNumber = this.pairsToAdd[index][0];
  var rightNumber = this.pairsToAdd[index][1];
  this.onePair.right = new HighlightedContent(this.operation.operator(leftNumber, rightNumber));
  this.onePair.left.push(leftNumber);
  this.onePair.left.push(this.operation.name);
  this.onePair.left.push(rightNumber);
  this.onePair.content = new HighlightedContent();
  this.onePair.content.push(this.onePair.left);
  this.onePair.content.push("&")
  this.onePair.content.push(this.onePair.equality);
  this.onePair.content.push("&")
  this.onePair.content.push(this.onePair.right);
  this.onePair.left.highlightFrames.push (this.currentFrameNumber, this.currentFrameNumber + 1);
  this.onePair.equality.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  this.onePair.right.answerFrame = this.currentFrameNumber + 1;

  if (this.flagMakeTable) {
    var currentRowLabel = this.operationTable.rowLabels[leftNumber];
    var currentColumnLabel = this.operationTable.columnLabels[rightNumber];
    var sumBox = this.operationTable.contentOperation[leftNumber][rightNumber];
    this.operationTable.operationSign.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    sumBox.answerFrame = this.currentFrameNumber + 1;
    currentRowLabel.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    currentColumnLabel.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    if (currentColumnLabel.showFrame <= 0) {
      currentColumnLabel.showFrame = this.currentFrameNumber;
    }
    if (currentRowLabel.showFrame <= 0) {
      currentRowLabel.showFrame = this.currentFrameNumber;
    }
    if (sumBox.showFrame <= 0) {
      sumBox.showFrame = this.currentFrameNumber;
    }
  }
  this.currentFrameNumber += 2;
}

FreeCalcOneDigitOperationAlgorithm.prototype.computeOnePairVertical = function(index) {
 
}

FreeCalcOneDigitOperationAlgorithm.prototype.computeSlideContent = function(
  inputData, 
  /**@type {{makeTable: Boolean, useColumns: Boolean, makeTableNote: Boolean}} */
  inputOptions,
) {
  this.slideContent = new HighlightedContent();
  this.notes.useColumns = new HighlightedContent();
  this.notes.content = new HighlightedContent();
  this.inputBase = inputData.base;
  this.inputPairs = inputData.pairsToAdd;
  this.base = Number(this.inputBase);
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.currentFrameNumber = Number(this.startingFrameNumber);
  this.pairsToAdd = [];
  this.flagUseColumns = inputOptions.useColumns;
  if (this.flagUseColumns === undefined) {
    this.flagUseColumns = false;
  }
  this.flagShowMakeTableNote = inputOptions.makeTableNote;
  if (this.flagShowMakeTableNote === undefined) {
    this.flagShowMakeTableNote = false;
  }
  this.flagMakeTable = inputOptions.makeTable;
  if (this.flagMakeTable === undefined) {
    this.flagMakeTable = false;
  }  
  var splitBySemicolumn = this.inputPairs.split(";");
  switch(this.operation.name) {
    case "+": 
      this.operation.noun = "addition";
      this.operation.verb = "Add";
      this.operation.operator = OperationTable.prototype.addition;
      break;
    case "\\cdot":
      this.operation.noun = "multiplication";
      this.operation.verb = "Multiply";
      this.operation.operator = OperationTable.prototype.multiplication;
      break;
    default:
      throw(`Uknown operation ${this.operation.name}`);
  }
  this.operationTable = new OperationTable(this.operation.name, this.base);
  this.operationTable.prepareTable();
  for (var counter = 0; counter < splitBySemicolumn.length; counter ++) {
    var splitByComma = splitBySemicolumn[counter].split(",");
    if (splitByComma.length < 2) {
      continue; 
    }
    this.pairsToAdd.push([Number(splitByComma[0]), Number(splitByComma[1])]);
  }
  if (this.flagShowMakeTableNote) {
    this.currentFrameNumber ++;
    this.operationTable.note.showFrame = this.currentFrameNumber;
    this.operationTable.content.showFrame = this.currentFrameNumber;
    this.operationTable.content.highlightFrames.push(this.currentFrameNumber);
    this.operationTable.note.highlightFrames.push(this.currentFrameNumber);
    this.operationTable.note.push("<br><br>$\\bullet$ To do one-digit multiplication quickly: make table with all possibilities. ");  
  }
  this.slideContent.push("\\begin{frame}");
  this.slideContent.push("<br><br>\\vskip -0.1cm<br><br>");
  this.slideContent.push("\\begin{example}");
  this.slideContent.push(`${this.operation.verb} the one-digit numbers.`); 
  this.slideContent.push("<br><br>");
  if (!this.flagUseColumns) {
    this.slideContent.push("\\hfil\\hfil$\\begin{array}{rcl}");
    this.currentFrameNumber ++;
    for (var i = 0; i < this.pairsToAdd.length; i ++) {
      this.computeOnePairHorizontal(i);
      this.slideContent.push(this.onePair.content);
      this.slideContent.push("\\\\");
    }
    this.slideContent.push("\\end{array}$");
  } else {
    var notes = new HighlightedContent();
    this.slideContent.push("\\hfil");
    for (var i = 0; i < this.pairsToAdd.length; i ++) {
      var theAlgorithm = new FreeCalcAdditionAlgorithm();
      theAlgorithm.additionTableExternal = this.operationTable;
      var topNumber = this.pairsToAdd[i][0];
      var bottomNumber = this.pairsToAdd[i][1];
      theAlgorithm.init({
        topNumber: `${topNumber}`,
        bottomNumber: `${bottomNumber}`,
        startingFrameNumber: this.currentFrameNumber,
        base: this.base,
      });
      theAlgorithm.initComputeInputs();
      theAlgorithm.computeResultDigits();
      theAlgorithm.computeSolution();
      this.slideContent.push("\\hfil");
      this.slideContent.push(theAlgorithm.solution);
      this.currentFrameNumber = theAlgorithm.currentFrameNumber;
      notes.push(" $");
      notes.push(theAlgorithm.intermediates);
      notes.push("$ ");
    }
    this.slideContent.push("<br><br>");
    this.slideContent.push("$\\displaystyle \\vphantom{\\int}$ ");
    this.slideContent.push(notes);
    this.currentFrameNumber ++;
  }
  this.operationTable.currentFrameNumber = this.currentFrameNumber;
  this.operationTable.highlightTable();
  this.slideContent.push("\\end{example}");
  if (this.flagMakeTable) {
    this.slideContent.push("<br><br>");
    this.slideContent.push("\\begin{columns}");
    this.slideContent.push("\\column{0.5\\textwidth}");
    this.slideContent.push(this.operationTable.content);
    this.slideContent.push("\\column{0.5\\textwidth}");
    this.slideContent.push(this.operationTable.note);
    if (this.flagUseColumns) {
      this.slideContent.push("<br><br>$\\bullet$ Addition can also be written in columns. ");
    }
    this.slideContent.push("\\end{columns}"); 
  } 
  this.slideContent.push("\\vskip 10cm");
  this.slideContent.push("\\end{frame}");
}

function FreeCalcOneDigitSubtractionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {HighlightedContent} */
  this.solution = null;
  /**@type {HighlightedContent} */
  this.horizontalExposition = null;
  /**@type {number} */
  this.base = - 1;
  /**@type {number[][]} */
  this.pairsToOperate = [];
  /**@type {string} */
  this.inputPairs = "";
  /**@type {string} */
  this.inputBase = "";
  /**@type {number} */
  this.currentFrameNumber = null;
  /**@type {string} */
  this.startingFrameNumber = null;
  /**@type {boolean} */
  this.flagUseColumns = false;
  /**@type {boolean} */
  this.flagShowMakeTableNote = true;
  this.onePair = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    left: null, 
    /**@type {HighlightedContent} */
    right: null,
    /**@type {HighlightedContent} */
    equality: null,
    /**@type {HighlightedContent} */
    reason: null,
    /**@type {HighlightedContent} */
    plus: null,
  };
  /**@type {OperationTable} */
  this.additionTable = null;
} 

FreeCalcOneDigitSubtractionAlgorithm.prototype.computeOnePairHorizontal = function(index) {
  this.onePair.left = new HighlightedContent();
  this.onePair.equality = new HighlightedContent("=");
  this.onePair.reason = new HighlightedContent();

  var leftNumber = this.pairsToOperate[index][0];
  var rightNumber = this.pairsToOperate[index][1];
  var reasonContent = new HighlightedContent();
  this.onePair.right = new HighlightedContent(leftNumber - rightNumber);

  this.onePair.reason.push("&")
  this.onePair.reason.push("\\text{because }");
  this.onePair.reason.push(reasonContent);

  reasonContent.push(rightNumber);
  reasonContent.push("+");
  reasonContent.push(this.onePair.right);
  reasonContent.push("=");
  reasonContent.push(leftNumber);
  reasonContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1)
  this.onePair.reason.showFrame = this.currentFrameNumber;

  this.onePair.left.push(leftNumber);
  this.onePair.left.push("-");
  this.onePair.left.push(rightNumber);
  this.onePair.content = new HighlightedContent();
  this.onePair.content.push(this.onePair.left);
  this.onePair.content.push("&")
  this.onePair.content.push(this.onePair.equality);
  this.onePair.content.push("&")
  this.onePair.content.push(this.onePair.right);
  this.onePair.content.push(this.onePair.reason);
  this.onePair.left.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  this.onePair.equality.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  this.onePair.right.answerFrame = this.currentFrameNumber + 1;



  var leftAdditionNumber = leftNumber - rightNumber;
  var topAdditionNumber = rightNumber;

  this.additionTable.operationSign.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  var theSum = this.additionTable.contentOperation[leftAdditionNumber][topAdditionNumber];
  var theRow = this.additionTable.rowLabels[leftAdditionNumber];
  var theColumn = this.additionTable.columnLabels[topAdditionNumber];
  theSum.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  theRow.answerFrame = this.currentFrameNumber + 1;
  theColumn.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  if (!theSum.showFrame <= 0) {
    theSum.showFrame = this.currentFrameNumber;
  }
  if (!theColumn.showFrame <= 0) {
    theColumn.showFrame = this.currentFrameNumber;
  }
  this.currentFrameNumber += 2;
}

FreeCalcOneDigitSubtractionAlgorithm.prototype.computeOnePairVertical = function(
  /** @type {number} */
  index
) {
  var theAlgorithm = new FreeCalcSubtractionAlgorithm();
  //theAlgorithm.additionTableExternal = this.additionTable;
  var topNumber = this.pairsToOperate[index][0];
  var bottomNumber = this.pairsToOperate[index][1];
  theAlgorithm.computeSlideContent({
    topNumber: `${topNumber}`,
    bottomNumber: `${bottomNumber}`,
    startingFrameNumber: this.currentFrameNumber,
    base: this.base,
  });
  this.solution.push("\\hfil");
  this.solution.push(theAlgorithm.algorithmMain);
  this.currentFrameNumber = theAlgorithm.currentFrameNumber;
  var left = new HighlightedContent(topNumber);
  var right = new HighlightedContent(bottomNumber);
  var minus = new HighlightedContent(" ~-~ ");
  var equality = new HighlightedContent("=");
  var result = new HighlightedContent(topNumber - bottomNumber);
  this.horizontalExposition.push(left);
  this.horizontalExposition.push(minus);
  this.horizontalExposition.push(right);
  this.horizontalExposition.push("&");
  this.horizontalExposition.push(equality);
  this.horizontalExposition.push("&");
  this.horizontalExposition.push(result);
  this.horizontalExposition.push("\\\\");  
  result.answerFrame = this.currentFrameNumber;
  var columnEntry = this.additionTable.columnLabels[bottomNumber];
  var sumEntry = this.additionTable.contentOperation[topNumber - bottomNumber][bottomNumber];
  var rowEntry = this.additionTable.rowLabels[topNumber - bottomNumber];
  columnEntry.showFrame = this.currentFrameNumber - 5;
  sumEntry.showFrame = this.currentFrameNumber - 5;
  rowEntry.answerFrame = this.currentFrameNumber;


  right.highlightFrames.push(this.currentFrameNumber - 5, this.currentFrameNumber - 3, this.currentFrameNumber - 1, this.currentFrameNumber);
  columnEntry.highlightFrames.push(this.currentFrameNumber - 5, this.currentFrameNumber - 3, this.currentFrameNumber - 1, this.currentFrameNumber);
  left.highlightFrames.push (this.currentFrameNumber - 4, this.currentFrameNumber - 3, this.currentFrameNumber - 1, this.currentFrameNumber);
  sumEntry.highlightFrames.push(this.currentFrameNumber - 4, this.currentFrameNumber - 3, this.currentFrameNumber - 1, this.currentFrameNumber);
  minus.highlightFrames.push(this.currentFrameNumber - 2, this.currentFrameNumber - 1, this.currentFrameNumber);
  equality.highlightFrames.push(this.currentFrameNumber - 1, this.currentFrameNumber);

}

FreeCalcOneDigitSubtractionAlgorithm.prototype.computeSlideContent = function(inputData, useColumns, makeTableNote, makeTable) {
  this.slideContent = new HighlightedContent();
  this.solution = new HighlightedContent();

  this.horizontalExposition = new HighlightedContent();

  this.inputBase = inputData.base;
  this.inputPairs = inputData.pairsToAdd;
  this.base = Number(this.inputBase);
  this.baseAdditionTable = Number(inputData.baseAdditionTable);
  if (isNaN(this.baseAdditionTable)) {
    this.baseAdditionTable = this.base;
  }
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.currentFrameNumber = Number(this.startingFrameNumber);
  this.pairsToOperate = [];
  this.flagUseColumns = useColumns;
  this.flagShowMakeTableNote = makeTableNote;
  var splitBySemicolumn = this.inputPairs.split(";");
  this.additionTable = new OperationTable("+", this.baseAdditionTable);
  this.additionTable.prepareTable();
  for (var counter = 0; counter < splitBySemicolumn.length; counter ++) {
    var splitByComma = splitBySemicolumn[counter].split(",");
    if (splitByComma.length < 2) {
      continue; 
    }
    this.pairsToOperate.push([Number(splitByComma[0]), Number(splitByComma[1])]);
  }
  this.slideContent.push("\\begin{frame}");
  if (!this.flagUseColumns) {
    this.slideContent.push("<br><br>\\vskip -0.1cm<br><br>");
    this.slideContent.push("\\begin{example}[One digit subtraction, result $>0$]")
    this.slideContent.push("Subtract the one-digit numbers."); 
    this.slideContent.push("<br><br>");
    this.slideContent.push("\\hfil\\hfil$\\begin{array}{rcl@{~~~~}|l}");
    this.currentFrameNumber ++;
    for (var i = 0; i < this.pairsToOperate.length; i ++) {
      this.computeOnePairHorizontal(i);
      this.slideContent.push(this.onePair.content);
      this.slideContent.push("\\\\");
    }
    this.slideContent.push("\\end{array}$");
  } else {
    this.slideContent.push("<br><br>\\vskip -0.15cm<br><br>");
    this.slideContent.push("\\begin{example}[One digit subtraction, result $>0$]")
    this.slideContent.push("Subtract the one-digit numbers.<br><br>\n\n"); 
    this.horizontalExposition.push(" \\hfil\\hfil $\\begin{array}{rcl}");
    this.solution.push("\\hfil");
    for (var i = 0; i < this.pairsToOperate.length; i ++) {
      this.computeOnePairVertical(i);
    }
    this.horizontalExposition.push("\\end{array}$");
    //this.slideContent.push("Subtract the one-digit numbers."); 
    this.slideContent.push(this.horizontalExposition);
    this.slideContent.push("<br><br>\\vskip -0.35cm");
    //this.slideContent.push("$\\displaystyle \\vphantom{\\int}$ ");
    this.slideContent.push(this.solution);
    this.currentFrameNumber ++;
  }
  this.additionTable.currentFrameNumber = this.currentFrameNumber;
  this.additionTable.highlightTable();
  this.slideContent.push("\\end{example}");
  if (makeTable) {
    this.slideContent.push("<br><br>");
    this.slideContent.push("\\begin{columns}");
    this.slideContent.push("\\column{0.5\\textwidth}");
    this.slideContent.push(this.additionTable.content);
    this.slideContent.push("\\column{0.5\\textwidth}");
    if (this.flagShowMakeTableNote) {
      this.slideContent.push("<br><br>$\\bullet$ To do one-digit subtraction: guess from addition table. ");
    }
    if (this.flagUseColumns) {
      var note = new HighlightedContent("<br><br>$\\bullet$ Subtraction can also be written in columns. ");
      note.showFrame = 2;
      this.slideContent.push(note);
    }
    this.slideContent.push("\\end{columns}");
  }
  this.slideContent.push("\\end{frame}");
}
initializeElements();
