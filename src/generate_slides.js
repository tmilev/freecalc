"use strict"

/**@type {FreeCalcElements} */
var theElements = null;

function initializeElements() {
  theElements = new FreeCalcElements();
}

function FreeCalcAdditionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {ColumnsHighlighted} */
  this.topNumber = null;
  /**@type {ColumnsHighlighted} */
  this.bottomNumber = null;
  /**@type {ColumnsHighlighted} */
  this.resultNumber = null;
  /**@type {ColumnsHighlighted} */
  this.carryOvers = null;
  /**@type {HighlightedContent[][]} */
  this.intermediates = null;
  /**@type {HighlightedContent[][]} */
  this.intermediatesBaseConversions = null;
  /**@type {HighlightedContent[]} */
  this.result = null
  this.plusSign = null;
  this.startingFrameNumber =1;
  this.base = 10;
  this.numberOfDigits = 0;
  this.currentFrameNumber = 0;
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

function ColumnsHighlighted(/** @type {string} */ inputString) {
  this.inputString = inputString;
  /** @type {HighlightedContent[]} */
  this.digits = [];
  this.digitPrefix = "";
  this.digitSuffix = "";
  this.sanitizeInput();
}

ColumnsHighlighted.prototype.hasGreaterThanStart = function (/**@type {ColumnsHighlighted} */ other) {
  var numberOfDigits = this.getNumberSignificantDigits();
  var otherNumberOfDigits = other.getNumberSignificantDigits();
  if (numberOfDigits < otherNumberOfDigits) {
    return false;
  }
  for (var counter = otherNumberOfDigits - 1; counter >= 0; counter --) {
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

ColumnsHighlighted.prototype.greaterThan = function (/**@type {ColumnsHighlighted} */ other) {
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

ColumnsHighlighted.prototype.getNumberSignificantDigits = function () {
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

ColumnsHighlighted.prototype.getDigit = function (integerIndex) {
  if (integerIndex >= this.digits.length) {
    return 0;
  }
  return this.digits[integerIndex].getDigit();
}

ColumnsHighlighted.prototype.allocateDigits = function(numberOfDigits) {
  for (var i = 0; i < numberOfDigits; i ++) {
    this.digits[i] = new HighlightedContent();
  }  
}

ColumnsHighlighted.prototype.highlightAll = function(frameNumber) {
  for (var i = 0; i < this.digits.length; i ++) {
    this.digits[i].highlightFrames.push(frameNumber);
  }  
}

ColumnsHighlighted.prototype.highlightDigitOnFrame = function(integerIndex, frameNumber) {
  if (integerIndex >= this.digits.length) {
    return;
  }
  return this.digits[integerIndex].highlightFrames.push(frameNumber);
}

ColumnsHighlighted.prototype.getTableRow = function(numExtraColumns) {
  var result = "";
  for (var counterColumn = 0; counterColumn < numExtraColumns; counterColumn ++) {
    result += "&";
  }
  for (var counterColumn = 0; counterColumn < this.digits.length; counterColumn ++) {
    if (!this.digits[this.digits.length - 1 - counterColumn].isEmpty()) {
      result += this.digitPrefix + this.digits[this.digits.length - 1 - counterColumn].toString() + this.digitSuffix; 
    }
    result += "&";
  }
  return result;
}

function HighlightedContent(/** @type {{content: any, useOnly: boolean, showFrame: number, hideFrame: number, answerFrame: number}} */ input) {
  /** @type {HighlightedContent[]} */
  this.content = [];
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

HighlightedContent.prototype.push = function(input) {
  this.content.push(input);
}

HighlightedContent.prototype.getDigit = function () {
  var digitContainer = this.getDigitContainer();
  if (digitContainer === undefined) {
    return undefined;
  }
  if (typeof this.content === "number") {
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
  if (this.answerFrame >= 0) {
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
    console.log("DEBUG: Highlight frames: " + this.highlightFrames);
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
  }
  return result;
}

/**
 * @returns {HighlightedContent}
 */
ColumnsHighlighted.prototype.leadingColumnContainer = function () {
  return this.digits[this.digits.length - 1];
}

/**
 * @returns {HighlightedContent}
 */
ColumnsHighlighted.prototype.constDigit = function () {
  return this.digits[0];
}

ColumnsHighlighted.prototype.sanitizeInput = function () {
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
  rightSide.content = [];
  rightSide.showFrame = this.currentFrameNumber + 1;
  rightSide.highlightFrames.push(this.currentFrameNumber + 1);
  var resultWithCarryOver = new HighlightedContent();
  resultWithCarryOver.answerFrame = this.currentFrameNumber + 1;
  carryOverContent.answerFrame = this.currentFrameNumber + 1;
  resultDigitContent.answerFrame = this.currentFrameNumber + 1;
  resultWithCarryOver.content = [carryOverContent, resultDigitContent];
  rightSide.content.push(resultWithCarryOver);
  
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
  this.resultNumber = new ColumnsHighlighted();
  this.carryOvers = new ColumnsHighlighted();
  this.carryOvers.digits.push(new HighlightedContent({content: ""}));
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
        this.intermediatesBaseConversions[this.intermediatesBaseConversions.length -1],
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

FreeCalcAdditionAlgorithm.prototype.init = function( 
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.topNumber = new ColumnsHighlighted(inputData.topNumber);
  this.bottomNumber = new ColumnsHighlighted(inputData.bottomNumber);
  this.base = Number(inputData.base);
  if (typeof this.base !== "number") {
    throw (`Failed to convert base to integer`);
  }
}

FreeCalcAdditionAlgorithm.prototype.computeSlideContent = function (inputData) {
  this.init(inputData);
  this.numberOfDigits = Math.max(this.topNumber.digits.length, this.bottomNumber.digits.length);
  this.currentFrameNumber = this.startingFrameNumber;
  this.computeResultDigits();
  this.carryOvers.digitPrefix = "{}^{";
  this.carryOvers.digitSuffix = "}";
  this.slideContent = new HighlightedContent();
  var currentContent = "";
  this.slideContent.content = [];
  currentContent += "\\begin{frame}\n<br>";
  currentContent += "\\[ \\begin{array}{r";
  for (var counterColumn = 0; counterColumn < this.numberOfDigits + 4; counterColumn ++) {
    currentContent += "@{}r";
  }
  currentContent += "}<br>\n";
  this.slideContent.content.push(currentContent)
  this.slideContent.content.push(this.carryOvers.getTableRow(this.numberOfDigits - this.carryOvers.digits.length));
  this.slideContent.content.push("\\\\\n<br>");
  this.slideContent.content.push(`\\multirow{2}{*}{$${this.plusSign.toString()}$} &`);
  this.slideContent.content.push(this.topNumber.getTableRow(this.numberOfDigits - this.topNumber.digits.length));
  this.slideContent.content.push("\\\\\n<br>&");
  this.slideContent.content.push(this.bottomNumber.getTableRow(this.numberOfDigits - this.bottomNumber.digits.length));
  this.slideContent.content.push("\\\\\\hline\n<br>");
  if (this.resultNumber.digits.length == this.numberOfDigits) {
    this.slideContent.content.push("&");
  }
  this.slideContent.content.push(this.resultNumber.getTableRow(this.numberOfDigits - this.resultNumber.digits.length));
  this.slideContent.content.push("\\end{array} \\]");
  this.slideContent.content.push(this.computeIntermediateNotes(this.intermediates));
  this.slideContent.content.push(this.computeIntermediateBaseConversions(this.intermediatesBaseConversions));
  this.slideContent.content.push("\\end{frame}");
}

function FreeCalcElements() {
  this.idInputTop = "idInputTop"; 
  this.idInputBottom = "idInputBottom";
  this.idOutput = "idSpanOutput";
  this.idStartSlideNumber = "idFirstSlideNumber";
  this.idBase = "idBase";
  this.topNumber = "";
  this.bottomNumber = "";
  this.startingFrameNumber = 0;
  this.additionAlgorithm = new FreeCalcAdditionAlgorithm();
  this.multiplicationAlgorithm = new FreeCalcMultiplicationAlgorithm();
  this.divisionAlgorithm = new FreeCalcDivisionAlgorithm();
}

FreeCalcElements.prototype.readInputs = function () {
  this.topNumber = document.getElementById(this.idInputTop).value;
  this.bottomNumber = document.getElementById(this.idInputBottom).value;
  this.startingFrameNumber = document.getElementById(this.idStartSlideNumber).value;
  this.base = document.getElementById(this.idBase).value;
}

FreeCalcElements.prototype.getInputs = function () {
  this.readInputs();
  return {
    topNumber: this.topNumber,
    bottomNumber: this.bottomNumber,
    startingFrameNumber: this.startingFrameNumber,
    base: this.base,
  }
}

FreeCalcElements.prototype.generateAddition = function () {
  this.additionAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.additionAlgorithm.toString();
  this.selectOutput();
}

function FreeCalcMultiplicationAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;

  /**@type {ColumnsHighlighted} */
  this.numberLeft = null;
  /**@type {ColumnsHighlighted} */
  this.numberRight = null;
  /**@type {ColumnsHighlighted} */
  this.resultNumber = null;
  /**@type {ColumnsHighlighted[]} */
  this.carryOvers = null;
  /**@type {ColumnsHighlighted} */
  this.carryOversAddition;
  /**@type {ColumnsHighlighted} */
  this.carryOversCombined = null;
  /**@type {ColumnsHighlighted[]} */
  this.intermediates = null;
  /**@type {HighlightedContent[][]} */
  this.startingFrameNumber = 1;
  /**@type {HighlightedContent} */
  this.plusSign = null;
  /**@type {HighlightedContent} */
  this.multiplicationSign = null;
  /**@type {HighlightedContent} */
  this.multiplicationResult = null;
  /**@type {HighlightedContent} */
  this.notes = null;
  /**@type {number[]} */
  this.carryOverHideFrames = null;
  this.base = 10;
  this.currentFrameNumber = 0;
}

FreeCalcMultiplicationAlgorithm.prototype.toString = FreeCalcAdditionAlgorithm.prototype.toString;

FreeCalcMultiplicationAlgorithm.prototype.init = function( 
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.startingFrameNumber = Number(inputData.startingFrameNumber);
  this.numberLeft = new ColumnsHighlighted(inputData.topNumber);
  this.numberRight = new ColumnsHighlighted(inputData.bottomNumber);
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


FreeCalcMultiplicationAlgorithm.prototype.computeIntermediate = function (rightDigitIndex) {
  this.intermediates[rightDigitIndex] = new ColumnsHighlighted();
  var currentIntermediate = this.intermediates[rightDigitIndex];
  this.carryOvers[rightDigitIndex] = new ColumnsHighlighted();
  var carryOversCurrent = this.carryOvers[rightDigitIndex];
  /**@type {HighlightedContent} */
  var rightDigit = this.numberRight.digits[rightDigitIndex];
  for (var i = 0; i < this.numberLeft.digits.length; i ++) {
    var leftDigit = this.numberLeft.digits[i];
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
  this.carryOversCombined = new ColumnsHighlighted();
  this.carryOversCombined.digits = new Array(this.numberLeft.digits.length);
  this.carryOversCombined.digitPrefix = "\\text{{\\tiny ${{ ";
  this.carryOversCombined.digitSuffix = "}}$}}";
  for (var i = 0; i < this.numberRight.digits.length; i ++ ) {
    this.carryOversCombined.digits[i] = new HighlightedContent();
    var currentCarryOver = this.carryOversCombined.digits[i];
    currentCarryOver.content = [];
    for (var j = 0; j < this.carryOvers.length; j ++) {
      if (this.carryOvers[j].digits[i].isEmpty()) {
        continue;
      }
      this.carryOvers[j].digits[i].hideFrame = this.carryOverHideFrames[j];
      this.carryOvers[j].digits[i].flagUseOnly = true;
      currentCarryOver.push(this.carryOvers[j].digits[i]);
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
    resultDigitContent += column[i].getDigit();
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

FreeCalcMultiplicationAlgorithm.prototype.computeAdditionResult = function () {
  if (this.numberRight.digits.length <= 1) {
    return;
  } 
  this.carryOversAddition.digitPrefix = "\\text{{\\tiny ~ ${{ ";
  this.carryOversAddition.digitSuffix = "}}$}}";
  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 
  var numberOfColumns = lastIntermediateLength + this.numberRight.digits.length - 1;
  for (var i = 0; i < numberOfColumns; i ++) {
    var currentColumn = [];
    for (var j = 0; j < this.intermediates.length; j ++) {
      var currentDigitIndex = i - j;
      if (currentDigitIndex >= 0 && currentDigitIndex < this.intermediates[j].digits.length) {
        currentColumn.push(this.intermediates[j].digits[currentDigitIndex]);
      }
    }
    this.carryOversAddition.digits[i] = new HighlightedContent();
    this.resultNumber.digits[i] = new HighlightedContent();
    this.oneAdditionResult(
      this.resultNumber.digits[i], 
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
    this.resultNumber.digits.push(leadingDigitResult);
  }
}

FreeCalcMultiplicationAlgorithm.prototype.highlightIntermediateFinal = function () {
  if (this.numberRight.digits.length <= 1) {
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
  for (var i = 0; i < this.resultNumber.digits.length; i ++) {
    this.resultNumber.digits[i].highlightFrames.push(this.currentFrameNumber)
  }
}

FreeCalcMultiplicationAlgorithm.prototype.computeSlideResult = function () {
  if (this.numberRight.digits.length <= 1) {
    return;
  }
  this.plusSign.showFrame = this.currentFrameNumber;
  this.plusSign.highlightFrames.push(this.currentFrameNumber);
  var horizontalLine = new HighlightedContent();
  horizontalLine.content = "\\\\\\hline";
  horizontalLine.showFrame = this.currentFrameNumber; 
  this.multiplicationResult.push(horizontalLine);
  this.computeAdditionResult();  
  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 
  var currentLength = this.resultNumber.digits.length;
  var offset = lastIntermediateLength + this.numberRight.digits.length - currentLength + 1;
  this.highlightFinal();
  this.multiplicationResult.push(this.resultNumber.getTableRow(offset));
}

FreeCalcMultiplicationAlgorithm.prototype.computeSlideContent = function (inputData) {
  this.init(inputData);
  this.currentFrameNumber = this.startingFrameNumber;
  this.slideContent = new HighlightedContent();
  this.plusSign = new HighlightedContent();
  this.multiplicationSign = new HighlightedContent();
  this.notes = new HighlightedContent();
  this.multiplicationResult = new HighlightedContent();
  this.slideContent.content = [];
  this.slideContent.push("\\begin{frame}\n<br>\n");
  this.intermediates = new Array(this.numberRight.digits.length);
  this.carryOvers = new Array(this.numberRight.digits.length);
  this.carryOverHideFrames = new Array(this.numberRight.digits.length);
  this.carryOversAddition = new ColumnsHighlighted();
  this.resultNumber = new ColumnsHighlighted();
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    this.computeIntermediate(i);
    this.carryOverHideFrames[i] = this.currentFrameNumber + 1;
  }
  this.highlightIntermediateFinal();
  this.currentFrameNumber ++;
  this.computeSlideResult();

  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 

  var slideStart = "";
  slideStart += "\\[ \\begin{array}{rr";
  for (var i = 0; i < lastIntermediateLength + this.numberRight.digits.length; i ++) {
    slideStart += "@{}r";
  }
  slideStart += "@{~}l@{~}";
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    slideStart += "@{}r";
  }
  slideStart += "}";
  this.slideContent.push(slideStart);
  this.combineCarryOvers();
  if (this.hasCarryOvers()) {
    this.slideContent.push("\\displaystyle \\phantom{\\frac{\\int}{~}}");
    this.slideContent.push(this.carryOversCombined.getTableRow(lastIntermediateLength));
    this.slideContent.push("\\\\\n<br>\n");
  }
  this.slideContent.push(this.numberLeft.getTableRow(lastIntermediateLength + 1));
  this.multiplicationSign.content = "\\cdot";
  this.slideContent.push("&");
  this.slideContent.push(this.multiplicationSign);
  this.slideContent.push(this.numberRight.getTableRow(0));
  this.slideContent.push("\\\\\\hline \n<br>\n");
  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 
  this.slideContent.push(this.carryOversAddition.getTableRow(1));
  this.slideContent.push("\\\\\n<br>\n");

  for (var i = 0; i < this.intermediates.length; i ++) {
    if (i === 0) {
      this.slideContent.push(`\\multirow{${this.numberRight.digits.length}}{*}{$`);
      this.plusSign.content = "+";
      this.slideContent.push(this.plusSign);
      this.slideContent.push(`$}`);  
    }
    var currentLength = this.intermediates[i].digits.length;
    var offset = lastIntermediateLength + this.numberRight.digits.length - currentLength - i + 1;
    this.slideContent.push(this.intermediates[i].getTableRow(offset));
    if (i !== this.intermediates.length - 1) {
      this.slideContent.push("\\\\\n<br>\n");
    }
  }
  if (this.numberRight.digits.length > 1) {
    this.slideContent.push(this.multiplicationResult);
  }

  var flaFinish = "";
  flaFinish += "\\end{array}\\] <br>\n$\\displaystyle \\phantom{\\underbrace{\\int 1}_{a}}$";
  this.slideContent.push(flaFinish);
  this.slideContent.push(this.notes);
  
  this.slideContent.push("\n<br>\n\\end{frame}");
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

FreeCalcElements.prototype.generateMultiplication = function () {
  this.multiplicationAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.multiplicationAlgorithm.toString();
  this.selectOutput();
}

FreeCalcElements.prototype.generateDivision = function () {
  this.divisionAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.divisionAlgorithm.toString();
  this.selectOutput();
}


function FreeCalcDivisionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {ColumnsHighlighted} */
  this.dividend = null;
  /**@type {ColumnsHighlighted} */
  this.divisor = null;
  /**@type {ColumnsHighlighted} */
  this.quotientMain = null;
  /**@type {HighlightedContent[][]} */
  this.quotientExtras = [];

  /**@type {ColumnsHighlighted[]} */
  this.intermediates = [];
  /**@type {ColumnsHighlighted[]} */
  this.intermediateCarryOvers = [];
  /**@type {ColumnsHighlighted[]} */
  this.subtracands = [];
  /**@type {number} */
  this.numberOfColumns = - 1;
  /**@type {number}*/
  this.base = - 1; 
  /**@type {number}*/
  this.startingFrameNumber = - 1; 
  /**@type {number}*/
  this.currentFrameNumber = - 1; 
  /**@type {HighlightedContent} */
  this.notes = null;
  /**@type {HighlightedContent} */
  this.goalNote = null;
  /**@type {number} */
  this.divisorLeadingDigitContent = - 1; 
  /**@type {HighlightedContent} */
  this.divisorLeadingDigitContainer = null; 
  /**@type {number} */
  this.divisorLeadingDigitPlusOne = 0;
  this.flagRoundSmallDivisorLeadingDigitReasoned = false;
  this.flagRoundEqualDivisorLeadingDigitReasoned = false;
  this.flagRoundLargeDivisorLeadingDigitReasoned = false; 
  this.quotientDigitComputation = {
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
    /**@type {ColumnsHighlighted} */
    remainder: null,
    /**@type {number} */
    indexReverseQuotientDigit: - 1,
  };
  this.currentNoteEqualDivisorLeadingDigit = {
    /**@type {HighlightedContent} */
    content: null,
  };
  this.currentNoteSmallDivisor = {
    /**@type {HighlightedContent} */
    content: null,
    /**@type {HighlightedContent} */
    firstPart: null,
    /**@type {HighlightedContent} */
    consequence: {
      /**@type {HighlightedContent} */
      content: null,
      /**@type {HighlightedContent} */
      partOne: null,
      /**@type {HighlightedContent} */
      partTwo: null,
      /**@type {HighlightedContent} */
      partThree: null,
    },
  };
  this.currentComputation = {
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
  };
  /**@type {ColumnsHighlighted}*/
  this.carryOverDivisor = null;
  this.subtracandComputation = {
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
    /**@type {ColumnsHighlighted} */    
    currentSubtracand: null,
    /**@type {HighlightedContent} */
    note: null,
    /**@type {ColumnsHighlighted} */    
    currentCarryOver: null,
  };
  this.subtractionCurrent = {
    /**@type {ColumnsHighlighted} */
    intermediate: null,
    /**@type {ColumnsHighlighted} */
    carryOvers: null,
    /**@type {HighlightedContent} */
    oldCarryOver: null,
    /**@type {number} */
    oldCarryOverContent: -1,
    /**@type {HighlightedContent} */
    newCarryOver: null,
    /**@type {number} */
    newCarryOverContent: -1,
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
    /**@type {ColumnsHighlighted} */    
    result: null,
  };
}

FreeCalcDivisionAlgorithm.prototype.toString = FreeCalcAdditionAlgorithm.prototype.toString;

FreeCalcDivisionAlgorithm.prototype.init = function (inputData) {
  this.dividend = new ColumnsHighlighted(inputData.topNumber);
  this.divisor = new ColumnsHighlighted(inputData.bottomNumber);
  this.startingFrameNumber = inputData.startingFrameNumber;
  this.base = Number(inputData.base);
  if (typeof this.base !== "number") {
    throw (`Failed to convert base ${inputData.base} to integer. `);
  }
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSmallLeadingDigitConsiderations = function () {
  this.currentNoteSmallDivisor.content = new HighlightedContent();
  var currentNoteSmallDivisor = this.currentNoteSmallDivisor.content;
  this.currentNoteSmallDivisor.firstPart = new HighlightedContent("Current leading digit $>$ divisor leading digit");
  var firstPart = this.currentNoteSmallDivisor.firstPart;
  currentNoteSmallDivisor.content.push(firstPart);
  this.currentNoteSmallDivisor.consequence.content = new HighlightedContent();
  var consequence = this.currentNoteSmallDivisor.consequence.content;
  this.currentNoteSmallDivisor.consequence.partOne = new HighlightedContent();
  this.currentNoteSmallDivisor.consequence.partTwo = new HighlightedContent();
  var consequencePartOne = this.currentNoteSmallDivisor.consequence.partOne;
  var consequencePartTwo = this.currentNoteSmallDivisor.consequence.partTwo;
  consequencePartOne.push(" $\\Rightarrow$ divide leading digit by divisor digit");
  consequencePartTwo.push(" plus one");
  consequence.push(consequencePartOne);
  consequence.push(consequencePartTwo);
  consequence.push(". ");
  this.currentNoteSmallDivisor.consequence.partThree = new HighlightedContent();
  var consequencePartThree = this.currentNoteSmallDivisor.consequence.partThree;
  consequencePartThree.push("Round down if needed. ");
  consequence.push(consequencePartThree);
  currentNoteSmallDivisor.push(consequence);
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSmallerLeadingComputationContent = function () {
  var quotientDigitContainer = this.quotientDigitComputation.quotientDigitContainer;
  quotientDigitContainer.questionMarkFrame = this.currentFrameNumber;
  this.quotientDigitComputation.quotientDigitContent = Math.floor(this.quotientDigitComputation.remainderLeadingDigitContent / this.divisorLeadingDigitPlusOne);
  var quotientDigitContent = this.quotientDigitComputation.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;
  
  this.divisorLeadingDigitContainer = this.divisor.leadingColumnContainer();

  this.currentComputation.content = new HighlightedContent();
  this.currentComputation.content.push("\\[");
  var partOne = this.currentComputation.partOne;
  partOne.content = new HighlightedContent();
  partOne.lfloor = new HighlightedContent("\\left\\lfloor");
  partOne.rfloor = new HighlightedContent("\\right\\rfloor");
  partOne.content.push(partOne.lfloor);
  partOne.content.push("\\frac{"); 
  partOne.content.push(this.quotientDigitComputation.remainderLeadingDigitContainer);
  partOne.content.push("}{");
  partOne.denominator = new HighlightedContent();
  partOne.denominator.push(this.divisorLeadingDigitContainer);
  partOne.plusOne = new HighlightedContent("+1");
  partOne.denominator.push(partOne.plusOne);
  partOne.content.push(partOne.denominator);
  partOne.content.push("}");
  partOne.content.push(partOne.rfloor);
  this.currentComputation.content.push(partOne.content);
  this.currentComputation.partOneEqualsPartTwo = new HighlightedContent("=");
  this.currentComputation.partTwo = new HighlightedContent();
  this.currentComputation.content.push(this.currentComputation.partOneEqualsPartTwo);
  var partTwoContent = "";
  partTwoContent += `\\left\\lfloor\\frac{${this.quotientDigitComputation.remainderLeadingDigitContent}}{${this.divisorLeadingDigitPlusOne}}\\right\\rfloor`;
  partTwoContent += " = ";
  partTwoContent += `\\left\\lfloor\\frac{${quotientDigitContent * this.divisorLeadingDigitPlusOne}}{${this.divisorLeadingDigitPlusOne}} `;
  var remainderDigit = this.quotientDigitComputation.remainderLeadingDigitContent - quotientDigitContent * this.divisorLeadingDigitPlusOne;
  if (remainderDigit > 0) {
    partTwoContent += ` + \\frac{${remainderDigit}}{${this.divisorLeadingDigitPlusOne}}`;
  }
  partTwoContent += ` \\right\\rfloor`;
  partTwoContent += `=\\left\\lfloor${quotientDigitContent} `;
  if (remainderDigit > 0) {
    partTwoContent += ` + \\frac{${remainderDigit}}{${this.divisorLeadingDigitPlusOne}}`;
  }
  partTwoContent += ` \\right\\rfloor`;

  this.currentComputation.partTwo.push(partTwoContent);
  this.currentComputation.partTwo.push("=");
  this.currentComputation.content.push(this.currentComputation.partTwo);  
  this.currentComputation.answer = new HighlightedContent(); 
  this.currentComputation.answer.push(quotientDigitContainer);
  this.currentComputation.content.push(this.currentComputation.answer);
  this.currentComputation.content.push("\\]");  
  this.currentNoteSmallDivisor.content.push(this.currentComputation.content);
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSmallerLeadingDigit = function () {
  if (!this.flagRoundSmallDivisorLeadingDigitReasoned) {
    this.computeOneRoundSmallLeadingDigitConsiderations();
    this.notes.push(this.currentNoteSmallDivisor.content);
    console.log(`DEBUG: current frame so far: ${this.currentFrameNumber}`);
  }
  this.computeOneRoundSmallerLeadingComputationContent();
  console.log(`DEBUG: current frame so far: ${this.currentFrameNumber}`);
  console.log(`DEBUG: content show frame: ${this.currentNoteSmallDivisor.content.showFrame}`);
  if (!this.flagRoundSmallDivisorLeadingDigitReasoned) {
    this.currentNoteSmallDivisor.content.showFrame = this.currentFrameNumber + 1;
    this.currentNoteSmallDivisor.firstPart.highlightFrames.push(this.currentFrameNumber + 1);
    this.currentNoteSmallDivisor.firstPart.showFrame = this.currentFrameNumber + 1;
    this.currentNoteSmallDivisor.consequence.content.showFrame = this.currentFrameNumber + 2;
    this.currentNoteSmallDivisor.consequence.partOne.highlightFrames.push(this.currentFrameNumber + 2);
    this.currentComputation.content.showFrame = this.currentFrameNumber + 2;
    this.currentNoteSmallDivisor.consequence.partTwo.highlightFrames.push(this.currentFrameNumber + 3);
    this.currentComputation.partOne.plusOne.highlightFrames.push(this.currentFrameNumber + 3);
    this.currentNoteSmallDivisor.consequence.partThree.highlightFrames.push(this.currentFrameNumber + 4);
    this.currentComputation.partOne.lfloor.redFrames.push(this.currentFrameNumber + 4);
    this.currentComputation.partOne.rfloor.redFrames.push(this.currentFrameNumber + 4);
    this.currentComputation.partOneEqualsPartTwo.showFrame = this.currentFrameNumber + 5;
    this.currentComputation.answer.showFrame = this.currentFrameNumber + 5;
    this.currentComputation.partOneEqualsPartTwo.highlightFrames.push(this.currentFrameNumber + 5, this.currentFrameNumber + 6);
    this.currentComputation.partOne.content.highlightFrames.push(this.currentFrameNumber + 5, this.currentFrameNumber + 6);
    this.currentComputation.partTwo.showFrame = this.currentFrameNumber + 6;
    this.currentComputation.partTwo.highlightFrames.push(this.currentFrameNumber + 6);
    this.quotientDigitComputation.remainderLeadingDigitContainer.highlightFrames.push(
      this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2,
      this.currentFrameNumber + 5, this.currentFrameNumber + 6
    );
    this.divisor.leadingColumnContainer().highlightFrames.push(
      this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2,
      this.currentFrameNumber + 5, this.currentFrameNumber + 6
    );
    this.currentFrameNumber += 6;
  }
  this.quotientDigitComputation.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundSmallDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingComputationContent = function () {
  var quotientDigitContainer = this.quotientDigitComputation.quotientDigitContainer;
  quotientDigitContainer.questionMarkFrame = this.currentFrameNumber;
  this.quotientDigitComputation.quotientDigitContent = Math.floor(this.quotientDigitComputation.remainderLeadingDigitContent / this.divisorLeadingDigitContent);
  var quotientDigitContent = this.quotientDigitComputation.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundLargeDivisorLeadingDigitContent = function () {
  var quotientDigitContainer = this.quotientDigitComputation.quotientDigitContainer;
  quotientDigitContainer.questionMarkFrame = this.currentFrameNumber;
  var numerator = this.quotientDigitComputation.remainderLeadingDigitContent * this.base + this.quotientDigitComputation.remainderSecondToLeadingDigitContent;
  this.quotientDigitComputation.quotientDigitContent = Math.floor(numerator / this.divisorLeadingDigitContent);
  var quotientDigitContent = this.quotientDigitComputation.quotientDigitContent;
  quotientDigitContainer.content = quotientDigitContent;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundEqualLeadingDigit = function () {
  if (!this.flagRoundEqualDivisorLeadingDigitReasoned) {
    console.log(`DEBUG: current frame so far: ${this.currentFrameNumber}`);
  }
  this.computeOneRoundEqualLeadingComputationContent();
  if (!this.flagRoundEqualDivisorLeadingDigitReasoned) {
  }

  this.quotientDigitComputation.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundEqualDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundLargerDivisorLeadingDigit = function () {
  if (!this.flagRoundLargeDivisorLeadingDigitReasoned) {
    console.log(`DEBUG: current frame so far: ${this.currentFrameNumber}`);
  }
  this.computeOneRoundLargeDivisorLeadingDigitContent();
  if (!this.flagRoundLargeDivisorLeadingDigitReasoned) {
  }

  this.quotientDigitComputation.quotientDigitContainer.answerFrame = this.currentFrameNumber;
  this.flagRoundLargeDivisorLeadingDigitReasoned = true;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundMultiplicationOneDigit = function (digitIndex) {
  this.subtracandComputation.currentDivisorDigit = this.divisor.digits[digitIndex];
  this.subtracandComputation.currentDivisorDigitContent = this.subtracandComputation.currentDivisorDigit.getDigit();

  console.log(`DEBUG: digit* digit: ${this.quotientDigitComputation.quotientDigitContent} * ${this.subtracandComputation.currentDivisorDigitContent} `);
  this.subtracandComputation.currentResultDigitContent = this.quotientDigitComputation.quotientDigitContent * this.subtracandComputation.currentDivisorDigitContent;
  this.subtracandComputation.currentResultDigitContent += this.subtracandComputation.oldCarryOverContent;
  this.subtracandComputation.newCarryOverContent = Math.floor(this.subtracandComputation.currentResultDigitContent / this.base);
  this.subtracandComputation.currentResultDigitContent %= this.base;
  this.subtracandComputation.currentResultDigit = new HighlightedContent(this.subtracandComputation.currentResultDigitContent);
  this.subtracandComputation.newCarryOver = new HighlightedContent(this.subtracandComputation.newCarryOverContent);
  if (this.subtracandComputation.newCarryOverContent > 0) {
    this.carryOverDivisor.digits[digitIndex + 1] = (this.subtracandComputation.newCarryOver);
  }
  this.subtracandComputation.currentSubtracand.digits.push(this.subtracandComputation.currentResultDigit);
  this.subtracandComputation.oldCarryOver = this.subtracandComputation.newCarryOver; 
  this.subtracandComputation.oldCarryOverContent = this.subtracandComputation.newCarryOverContent;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSubtractionOneDigit = function (digitIndex) {
  var subtraction = this.subtractionCurrent;
  if (digitIndex == 0) {
    subtraction.oldCarryOver = new HighlightedContent();
    subtraction.oldCarryOverContent = 0;
  }
  subtraction.topDigit = subtraction.intermediate.digits[digitIndex];
  subtraction.topDigitContent = subtraction.topDigit.getDigit();
  subtraction.bottomDigit = this.subtracandComputation.currentSubtracand.digits[digitIndex];
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
  subtraction.oldCarryOver = subtraction.newCarryOver;
  subtraction.oldCarryOverContent = subtraction.newCarryOverContent;
  subtraction.resultDigit.content = subtraction.resultDigitContent;
  subtraction.result.digits.push(subtraction.resultDigit);
}

FreeCalcDivisionAlgorithm.prototype.computeOneRoundSecondPart = function () {
  this.currentFrameNumber ++;
  this.divisor.highlightAll(this.currentFrameNumber);
  this.quotientDigitComputation.quotientDigitContainer.highlightFrames.push(this.currentFrameNumber);
  this.subtracandComputation.currentSubtracand = new ColumnsHighlighted();

  var subtraction = this.subtractionCurrent; 
  
  subtraction.result = new ColumnsHighlighted();
  this.subtracandComputation.currentCarryOver = new ColumnsHighlighted();
  this.subtracandComputation.note = new HighlightedContent();
  subtraction.carryOvers = new ColumnsHighlighted();
  this.subtracandComputation.oldCarryOverContent = 0;
  subtraction.intermediate = this.intermediates[this.intermediates.length - 1];
  for (var counter = 0; counter < this.divisor.digits.length; counter ++) {
    this.computeOneRoundMultiplicationOneDigit(counter); 
  }
  subtraction.carryOvers.allocateDigits(subtraction.intermediate.digits.length);
  subtraction.carryOvers.digitPrefix = "\\text{{\\tiny ${{ ";
  subtraction.carryOvers.digitSuffix = "}}$}}";
  for (var counter = 0; counter < this.subtracandComputation.currentSubtracand.digits.length; counter ++) {
    this.computeOneRoundSubtractionOneDigit(counter); 
  }
  this.subtracands.push(this.subtracandComputation.currentSubtracand);
  this.intermediates.push(subtraction.result);
  this.intermediateCarryOvers.push(this.subtracandComputation.currentCarryOver);
}

FreeCalcDivisionAlgorithm.prototype.computeOneRound = function () {
  this.quotientDigitComputation.remainder = this.intermediates[this.intermediates.length - 1];
  this.quotientDigitComputation.remainderLeadingDigitContainer = this.quotientDigitComputation.remainder.leadingColumnContainer();
  this.quotientDigitComputation.remainderLeadingDigitContent = this.quotientDigitComputation.remainderLeadingDigitContainer.getDigit();

  if (this.quotientDigitComputation.remainder.digits.length > 1) {
    this.quotientDigitComputation.remainderSecondToLeadingDigitContainer = this.quotientDigitComputation.remainder.digits[this.quotientDigitComputation.remainder.digits.length - 2]
    this.quotientDigitComputation.remainderSecondToLeadingDigitContent = this.quotientDigitComputation.remainderLeadingDigitContainer.getDigit();
  } else {
    this.quotientDigitComputation.remainderSecondToLeadingDigitContainer = null;
    this.quotientDigitComputation.remainderSecondToLeadingDigitContent = - 1;
  } 
  this.quotientDigitComputation.quotientDigitContent = - 1;
  this.quotientDigitComputation.quotientDigitContainer = new HighlightedContent();
  this.quotientDigitComputation.showFrame = 1;
  this.quotientDigitComputation.indexReverseQuotientDigit = this.dividend.digits.length - this.quotientDigitComputation.remainder.getNumberSignificantDigits();
  if (this.quotientExtras[this.quotientDigitComputation.indexReverseQuotientDigit] === undefined) {
    this.quotientExtras[this.quotientDigitComputation.indexReverseQuotientDigit] = [];
  }
  this.quotientExtras[this.quotientDigitComputation.indexReverseQuotientDigit].push(this.quotientDigitComputation.quotientDigitContainer);

  if (this.divisorLeadingDigitContent < this.quotientDigitComputation.remainderLeadingDigitContent) {
    this.computeOneRoundSmallerLeadingDigit();
  } else if (this.quotientDigitComputation.remainder.hasGreaterThanStart(this.divisor)) {
    this.computeOneRoundEqualLeadingDigit();
  } else {
    this.computeOneRoundLargerDivisorLeadingDigit();
  }
  this.computeOneRoundSecondPart();
}

FreeCalcDivisionAlgorithm.prototype.computeIntermediateQuotients = function () {
  var numberOfIntermediateQuotients = 0;
  this.quotientMain = new ColumnsHighlighted();
  for (var counterDigit = this.quotientExtras.length - 1; counterDigit >= 0; counterDigit --) {
    numberOfIntermediateQuotients = Math.max(numberOfIntermediateQuotients, this.quotientExtras[counterDigit].length);
    var currentDigit = 0;
    for (var i = 0; i < this.quotientExtras[counterDigit].length; i ++) {
      currentDigit += this.quotientExtras[counterDigit][i].content;
    }
    var currentDigitContainer = new HighlightedContent();
    currentDigitContainer.content = currentDigit;
    this.quotientMain.digits.push(currentDigitContainer);
  }
  if (numberOfIntermediateQuotients <= 1) {
    //this.slideContent.push(this.quotientMain.getTableRow(this.divisor.digits.length + 2));
    //this.slideContent.push("\\\\\n<br>\n");
    return;
  }
  for (var counterRow = numberOfIntermediateQuotients - 1; counterRow >= 0; counterRow --) {
    for (var i = 0; i < this.divisor.digits.length + 1; i ++) {
      this.slideContent.push("&");
    }
    for (var counterDigit = 0; counterDigit < this.quotientExtras.length; counterDigit ++) {
      this.slideContent.push("&");
      if (counterRow >= this.quotientExtras[counterDigit].length) {
        continue;
      }
      var currentDigit = this.quotientExtras[counterDigit][counterRow]; 
      if (currentDigit.isEmpty()) {
        continue;
      }
      this.slideContent.push(currentDigit);
    }
    this.slideContent.push("\\\\\n<br\n>");
  }

}

FreeCalcDivisionAlgorithm.prototype.computeSlideContent = function (inputData) {
  this.init(inputData);
  this.currentFrameNumber = this.startingFrameNumber;
  this.currentFrameNumber ++;
  this.slideContent = new HighlightedContent();
  this.notes = new HighlightedContent();
  this.goalNote = new HighlightedContent();
  this.quotientMain = new ColumnsHighlighted();
  this.quotientExtras = [];
  this.carryOverDivisor = new ColumnsHighlighted();
  this.carryOverDivisor.digitPrefix = "\\text{{\\tiny ${{ ";
  this.carryOverDivisor.digitSuffix = "}}$}}"; 
  this.intermediates = [];
  this.divisorLeadingDigitContent = this.divisor.digits[this.divisor.digits.length - 1].getDigit();
  this.divisorLeadingDigitPlusOne = this.divisorLeadingDigitContent + 1;
  this.carryOverDivisor.allocateDigits(this.divisor.digits.length);
  this.goalNote.push("Find: digit as large as possible so divisor $\\cdot$ digit $\\leq $ dividend");
  
  this.numberOfColumns = this.dividend.digits.length + this.divisor.digits.length + 2;
  this.intermediates.push(this.dividend);
  this.flagRoundEqualDivisorLeadingDigitReasoned = false;
  this.flagRoundLargeDivisorLeadingDigitReasoned = false;
  this.flagRoundSmallDivisorLeadingDigitReasoned = false;
  while(this.intermediates[this.intermediates.length - 1].greaterThan(this.divisor)) {
    this.computeOneRound();
  }
  this.slideContent.push("\\begin{frame}<br>\n");
  this.slideContent.push(this.goalNote);
  this.slideContent.push("\n<br>\n");
  this.slideContent.push("\\[");
  this.slideContent.push("\\setlength\\extrarowheight{-5pt}\n<br>\n"); 
  this.slideContent.push("\\begin{array}{");
  for (var i = 0; i < this.divisor.digits.length; i ++) {
    this.slideContent.push("@{}l");
  }
  this.slideContent.push("@{}l@{}l");
  for (var i = 0; i < this.dividend.digits.length; i ++) {
    this.slideContent.push("@{}l");
  }
  this.slideContent.push("@{}l");
  this.slideContent.push("}");
  this.computeIntermediateQuotients();
  this.slideContent.push(this.quotientMain.getTableRow(this.divisor.digits.length + 2));
  this.slideContent.push("\\\\");
  this.slideContent.push(`\\cline{${this.divisor.digits.length + 1} - ${this.numberOfColumns}}`); 
  this.slideContent.push("\n<br>\n");
  this.slideContent.push(this.carryOverDivisor.getTableRow(0));
  this.slideContent.push(`\\multicolumn{1}{|@{}l@{}}{}& `);
  this.slideContent.push(this.intermediateCarryOvers[0].getTableRow(0));
  this.slideContent.push(`\\\\`);
  this.slideContent.push("\n<br>\n");
  this.slideContent.push(this.divisor.getTableRow(0));
  this.slideContent.push("\\multicolumn{1}{|l@{}}{~}&");
  this.slideContent.push(`~~~&`);
  this.slideContent.push(this.dividend.getTableRow(0));
  for (var counterIntermediate = 0; counterIntermediate < this.intermediates.length; counterIntermediate ++) {
    this.slideContent.push(`\\\\`);
    if (counterIntermediate !== this.intermediates.length - 1) {
      this.slideContent.push(`\\cline{${this.divisor.digits.length + 2}-${this.divisor.digits.length + 2}}\n<br>\n`);
    }
    if (counterIntermediate >= this.subtracands.length) {
      continue;
    }
    this.slideContent.push(this.subtracands[counterIntermediate].getTableRow(this.divisor.digits.length + 2));
    this.slideContent.push(`\\\\\\cline{${this.divisor.digits.length + 3} - ${this.numberOfColumns}}\n<br>\n`);
    var offset = this.divisor.digits.length + 2;
    offset += this.dividend.digits.length - this.subtracands[counterIntermediate].digits.length; 
    this.slideContent.push(this.intermediates[counterIntermediate + 1].getTableRow(offset));
  }
  
  this.slideContent.push("\n<br>\n");
  this.slideContent.push("\\end{array}\\]<br>\n");
  this.slideContent.push("\n\n<br>\n<br>\n");
  this.slideContent.push(this.notes);
  this.slideContent.push("\\end{frame}\n");
}