"use strict"


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

ColumnsHighlighted.prototype.getDigit = function (integerIndex) {
  if (integerIndex >= this.digits.length) {
    return 0;
  }
  return this.digits[integerIndex].getDigit();
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
  this.answerFrame = - 1;
  this.questionMarkFrame = - 1;
  this.showFrame = - 1; 
  this.hideFrame = - 1; 
  this.flagUseOnly = false;
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
  if (this.highlightFrames.length > 0) {
    console.log("DEBUG: Highlight frames: " + this.highlightFrames);
    result += "\\alertNoH{";
    for (var counterHighlight = 0; counterHighlight < this.highlightFrames.length; counterHighlight ++) {
      result += this.highlightFrames[counterHighlight];
      if (counterHighlight != this.highlightFrames.length - 1) {
        result += ", ";
      }
    }
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
ColumnsHighlighted.prototype.leadingDigitContainer = function () {
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
  this.base = inputData.base;
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

/**@type {FreeCalcElements} */
var theElements = null;

function initializeElements() {
  theElements = new FreeCalcElements();
}

function FreeCalcDivisionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {ColumnsHighlighted} */
  this.dividend = null;
  /**@type {ColumnsHighlighted} */
  this.divisor = null;
  /**@type {ColumnsHighlighted} */
  this.quotient = null;
  /**@type {ColumnsHighlighted[]} */
  this.intermediates = [];
  /**@type {number} */
  this.numberOfColumns = - 1;
  /**@type {number}*/
  this.startingFrameNumber = - 1; 
  /**@type {number}*/
  this.currentFrameNumber = - 1; 
  /**@type {HighlightedContent} */
  this.notes = null;
  /**@type {HighlightedContent} */
  this.goalNote = null;
  /**@type {number} */
  this.divisorLeadingDigit = - 1; 
  /**@type {number} */
  this.divisorLeadingDigitPlusOne = 0;
}

FreeCalcDivisionAlgorithm.prototype.toString = FreeCalcAdditionAlgorithm.prototype.toString;

FreeCalcDivisionAlgorithm.prototype.init = function (inputData) {
  this.dividend = new ColumnsHighlighted(inputData.topNumber);
  this.divisor = new ColumnsHighlighted(inputData.bottomNumber);
  this.startingFrameNumber = inputData.startingFrameNumber;
}

FreeCalcDivisionAlgorithm.prototype.computeOneRound = function () {
  var currentRemainder = this.intermediates[this.intermediates.length - 1];

  var currentRemainderLength = currentRemainder.digits.length;
  var divisorLength = this.divisor.digits.length;
  var currentNote = new HighlightedContent();
  if (divisorLength === currentRemainderLength) {
    currentNote.push("\\# digits divisor $=$ \\# digits intermediate");
  } else {
    currentNote.push("\\# digits divisor $<$ \\# digits intermediate");
  }
  var remainderLeadingDigit = currentRemainder.leadingDigitContainer().getDigit();
  var remainderLeadingDigitContainer = currentRemainder.leadingDigitContainer();

  var quotientDigit = new HighlightedContent();
  if (remainderLeadingDigit >= this.divisorLeadingDigit + 1) {
    quotientDigit.content = Math.floor(remainderLeadingDigit / this.divisorLeadingDigitPlusOne);
    this.quotient.digits.push(quotientDigit);
    quotientDigit.answerFrame = this.currentFrameNumber + 1;
  
    remainderLeadingDigitContainer.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
    this.divisor.leadingDigitContainer().highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1);
  }

  this.goalNote.highlightFrames.push(this.currentFrameNumber);
  this.notes.push(currentNote);
}

FreeCalcDivisionAlgorithm.prototype.computeSlideContent = function (inputData) {
  this.init(inputData);
  this.currentFrameNumber = this.startingFrameNumber;
  this.currentFrameNumber ++;
  this.slideContent = new HighlightedContent();
  this.notes = new HighlightedContent();
  this.goalNote = new HighlightedContent();
  this.quotient = new ColumnsHighlighted();
  this.slideContent.push("\\begin{frame}<br>\n");
  this.slideContent.push("\\[\\begin{array}{@{}l");
  this.intermediates = [];
  this.divisorLeadingDigit = this.divisor.digits[this.divisor.digits.length - 1].getDigit();
  this.divisorLeadingDigitPlusOne = this.divisorLeadingDigit + 1;

  this.goalNote.push("Find: largest digit so divisor $\\cdot$ digit $\\leq $ dividend");
  this.numberOfColumns = this.dividend.digits.length + this.divisor.digits.length + 1;
  var numberOfRounds = this.dividend.digits.length - this.divisor.digits.length + 1;
  this.intermediates.push(this.dividend);

  for (var i = 0; i < numberOfRounds; i ++) {
    this.computeOneRound(i);
  }
  for (var i = 0; i < this.divisor.digits.length; i ++) {
    this.slideContent.push("@{}l");
  }
  this.slideContent.push("l");
  for (var i = 0; i < this.dividend.digits.length; i ++) {
    this.slideContent.push("@{}l");
  }
  this.slideContent.push("}");
  this.slideContent.push(this.quotient.getTableRow(this.divisor.digits.length + 1));
  this.slideContent.push("\\\\");
  this.slideContent.push(`\\cline{${this.divisor.digits.length + 2} - ${this.numberOfColumns}}`); 
  this.slideContent.push("\n<br>\n");
  this.slideContent.push(this.divisor.getTableRow(0));
  this.slideContent.push("&");
  var leadingDividendDigitWithLeftLine = new HighlightedContent();
  var leadingDividendDigitContainer = new HighlightedContent();
  leadingDividendDigitContainer.content = this.dividend.leadingDigitContainer();
  leadingDividendDigitWithLeftLine.push("\\multicolumn{1}{|l@{}}{");
  leadingDividendDigitWithLeftLine.push(leadingDividendDigitContainer);
  leadingDividendDigitWithLeftLine.push("}");
  this.dividend.digits[this.dividend.digits.length - 1] = leadingDividendDigitWithLeftLine;
  
  this.slideContent.push(this.dividend.getTableRow(0));

  
  this.slideContent.push("\n<br>\n");
  this.slideContent.push("\\end{array}\\]<br>\n");
  this.slideContent.push(this.goalNote);
  this.slideContent.push("\n\n<br>\n<br>\n");
  this.slideContent.push(this.notes);
  this.slideContent.push("\\end{frame}\n");
}