"use strict"


function FreeCalcAdditionAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;
  /**@type {NumberHighlighted} */
  this.topNumber = null;
  /**@type {NumberHighlighted} */
  this.bottomNumber = null;
  /**@type {NumberHighlighted} */
  this.resultNumber = null;
  /**@type {NumberHighlighted} */
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

function NumberHighlighted(/** @type {string} */ inputString) {
  this.inputString = inputString;
  /** @type {HighlightedContent[]} */
  this.digits = [];
  this.digitPrefix = "";
  this.digitSuffix = "";
  this.sanitizeInput();
}

NumberHighlighted.prototype.getDigit = function (integerIndex) {
  if (integerIndex >= this.digits.length) {
    return 0;
  }
  return this.digits[integerIndex].content;
}

NumberHighlighted.prototype.highlightDigitOnFrame = function(integerIndex, frameNumber) {
  if (integerIndex >= this.digits.length) {
    return;
  }
  return this.digits[integerIndex].highlightFrames.push(frameNumber);
}

NumberHighlighted.prototype.getTableRow = function(numExtraColumns) {
  var result = "";
  for (var counterColumn = 0; counterColumn < numExtraColumns; counterColumn ++) {
    result += "&";
  }
  for (var counterColumn = 0; counterColumn < this.digits.length; counterColumn ++) {
    result += "&";
    result += this.digitPrefix + this.digits[this.digits.length - 1 - counterColumn].toString() + this.digitSuffix; 
  }
  return result;
}

function HighlightedContent(/** @type {{content: any, useOnly: boolean, showFrame: number, hideFrame: number, answerFrame: number}} */ input) {
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

HighlightedContent.prototype.push = function(input) {
  this.content.push(input);
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
      result += ">{{";
    } else {
      result += `}{{`;
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
  if (! Array.isArray(this.content)) {
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
      result += `}}`;
  }
  if (this.answerFrame >= 0) {
      result += "}}";
  }
  return result;
}

NumberHighlighted.prototype.sanitizeInput = function () {
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
  this.resultNumber = new NumberHighlighted();
  this.carryOvers = new NumberHighlighted();
  this.carryOvers.digits.push(new HighlightedContent({content: ""}));
  this.intermediates = [];
  this.intermediatesBaseConversions = [];
  var carryOver = 0;
  this.currentFrameNumber ++;
  this.plusSign = new HighlightedContent({content: "+"})
  for (var counterInteger = 0; counterInteger < this.numberOfDigits; counterInteger ++) {
    var topDigit = this.topNumber.getDigit(counterInteger);
    var bottomDigit = this.bottomNumber.getDigit(counterInteger);
    this.intermediates.push( new HighlightedContent());
    this.carryOvers.digits.push( new HighlightedContent());
    this.resultNumber.digits.push( new HighlightedContent());
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
  this.topNumber = new NumberHighlighted(inputData.topNumber);
  this.bottomNumber = new NumberHighlighted(inputData.bottomNumber);
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
}

function FreeCalcMultiplicationAlgorithm() {
  /**@type {HighlightedContent} */
  this.slideContent = null;

  /**@type {NumberHighlighted} */
  this.numberLeft = null;
  /**@type {NumberHighlighted} */
  this.numberRight = null;
  /**@type {NumberHighlighted} */
  this.resultNumber = null;
  /**@type {NumberHighlighted} */
  this.carryOvers = null;
  /**@type {NumberHighlighted[]} */
  this.intermediates = null;
  /**@type {HighlightedContent[][]} */
  this.startingFrameNumber = 1;
  /**@type {HighlightedContent} */
  this.plusSign = null;
  /**@type {HighlightedContent} */
  this.notes = null;
  this.base = 10;
  this.currentFrameNumber = 0;
}

FreeCalcMultiplicationAlgorithm.prototype.toString = FreeCalcAdditionAlgorithm.prototype.toString;

FreeCalcMultiplicationAlgorithm.prototype.init = function( 
  /**@type {{startingFrameNumber: number, topNumber: string, bottomNumber: string, base: number}} */
  inputData
) {
  this.startingFrameNumber = Number(inputData.startingFrameNumber);
  this.numberLeft = new NumberHighlighted(inputData.topNumber);
  this.numberRight = new NumberHighlighted(inputData.bottomNumber);
  this.numbersIntermediate = [];
  this.base = Number(inputData.base);
}

FreeCalcMultiplicationAlgorithm.prototype.computeIntermediate = function (rightDigitIndex) {
  console.log(`DEBUG: current frame number: ${this.currentFrameNumber}`);
  this.intermediates[rightDigitIndex] = new NumberHighlighted();
  /**@type {HighlightedContent} */
  var rightDigit = this.numberRight.digits[rightDigitIndex];
  var currentNote;
  for (var i = 0; i < this.numberLeft.digits.length; i ++) {
    var leftDigit = this.numberLeft.digits[i];
    this.intermediates[rightDigitIndex].digits[i] = new HighlightedContent();
    var resultDigit = this.intermediates[rightDigitIndex].digits[i];
    rightDigit.highlightFrames.push(this.currentFrameNumber + 1);
    var product = leftDigit.content * rightDigit.content;
    var carryOver = Math.floor(product / this.base);
    var digit = product % this.base;
    resultDigit.content = digit;
    resultDigit.highlightFrames.push(this.currentFrameNumber + 1);
    leftDigit.highlightFrames.push(this.currentFrameNumber + 1);
    currentNote = new HighlightedContent();
    currentNote.push("$");
    currentNote.push(leftDigit);
    currentNote.push("\\cdot");
    currentNote.push(rightDigit);
    currentNote.push("=");
    var carryOverDigit = new HighlightedContent();
    if (carryOver > 0) {
      carryOverDigit.content = carryOver;
    }
    currentNote.push(carryOverDigit);
    currentNote.push(resultDigit);
    currentNote.push("$ ");
    currentNote.flagUseOnly = true;
    currentNote.hideFrame = this.currentFrameNumber + 4;
    this.notes.push(currentNote);
  }
}

FreeCalcMultiplicationAlgorithm.prototype.computeSlideContent = function (inputData) {
  this.init(inputData);
  this.currentFrameNumber = this.startingFrameNumber;
  this.slideContent = new HighlightedContent();
  this.plusSign = new HighlightedContent();
  this.notes = new HighlightedContent();
  this.slideContent.content = [];
  this.slideContent.push("\\begin{frame}\n<br>\n");
  this.intermediates = new Array(this.numberRight.digits.length);
  for (var i = 0; i < this.numberRight.digits.length; i ++){
    this.computeIntermediate(i);
  }
  var lastIntermediateLength = this.intermediates[this.intermediates.length - 1].digits.length; 

  var slideStart = "";
  slideStart += "\\[ \\begin{array}{l";
  for (var i = 0; i < lastIntermediateLength + this.numberRight.digits.length; i ++) {
    slideStart += "@{}l";
  }
  slideStart += "@{~}l@{~}";
  for (var i = 0; i < this.numberRight.digits.length; i ++) {
    slideStart += "@{}l";
  }
  slideStart += "}"
  this.slideContent.push(slideStart);
  this.slideContent.push(this.numberLeft.getTableRow(lastIntermediateLength));
  this.slideContent.push("&\\cdot");
  this.slideContent.push(this.numberRight.getTableRow(0));
  for (var i = 0; i < this.intermediates.length; i ++) {
    this.slideContent.push ("\\\\");
    if (i === 0) {
      this.slideContent.push("\\hline");
      if (this.numberRight.digits.length > 1) {
        this.slideContent.push(`\\multirow{${this.numberRight.digits.length}}{*}{$`);
        this.plusSign.content = "+";
        this.slideContent.push(this.plusSign);
        this.slideContent.push(`$}`);
      }    
    }
    this.slideContent.push(" \n<br>\n");
    this.slideContent.push(this.intermediates[i].getTableRow(lastIntermediateLength - i));
  }

  var flaFinish = "";
  flaFinish += "\\end{array}\\]";
  this.slideContent.push(flaFinish);
  this.slideContent.push(this.notes);
  
  this.slideContent.push("\n<br>\n\\end{frame}");
}

FreeCalcElements.prototype.generateMultiplication = function () {
  this.multiplicationAlgorithm.computeSlideContent(this.getInputs());
  document.getElementById(this.idOutput).innerHTML = this.multiplicationAlgorithm.toString();
}

/**@type {FreeCalcElements} */
var theElements = null;

function initializeElements() {
  theElements = new FreeCalcElements();
}

