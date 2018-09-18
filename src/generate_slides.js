"use strict"


function Slide(
    /** @type {{idInputTop: string, idInputBottom: string, idOutput: string, idStartSlideNumber: string, idBase: idBase}}*/ 
    inputData
) {
    this.idInputTop = inputData.idInputTop;
    this.idInputBottom = inputData.idInputBottom;
    this.idOutput = inputData.idOutput;
    this.idStartSlideNumber = inputData.idStartSlideNumber;
    this.idBase = inputData.idBase;
    this.slideContent = "";
    /**@type {NumberHighlighted} */
    this.topNumber = null;
    /**@type {NumberHighlighted} */
    this.bottomNumber = null;
    /**@type {NumberHighlighted} */
    this.resultNumber = null;
    /**@type {NumberHighlighted} */
    this.carryOvers = null;

    /**@type {DigitHighlighted[][]} */
    this.intermediates = null;
    /**@type {DigitHighlighted[][]} */
    this.intermediatesBaseConversions = null;

    this.plusDigit = new HighlightedContent({content: "+"});
    this.startingFrameNumber =1;
    this.base = 10;
    this.numberOfDigits = 0;
    this.currentFrameNumber = 0;
    this.initializeInputs();
}

Slide.prototype.init = function() {
    this.startingFrameNumber = document.getElementById(this.idStartSlideNumber).value;
    this.base = document.getElementById(this.idBase).value;
}

function NumberHighlighted(/** @type {string} */ inputString) {
    this.inputString = inputString;
    /** @type {DigitHighlighted[]} */
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

NumberHighlighted.prototype.getTableRow = function(totalNumberOfDigits) {
    var result = "";
    var numExtraColumns = totalNumberOfDigits - this.digits.length;
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
    this.content = "";
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

Slide.prototype.initializeInputs = function () {
    this.topNumber = new NumberHighlighted(document.getElementById(this.idInputTop).value);
    this.bottomNumber = new NumberHighlighted(document.getElementById(this.idInputBottom).value);

    this.numberOfDigits = Math.max(this.topNumber.digits.length, this.bottomNumber.digits.length);
}

Slide.prototype.processColumnNonBase10 = function(
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
        topContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
    }
    if (bottomContent !== undefined) {
        bottomContent.content = bottomDigit;
        bottomContent.highlightFrames.push(this.currentFrameNumber, this.currentFrameNumber + 1, this.currentFrameNumber + 2, this.currentFrameNumber + 3);
    }
    resultDigitContent.content = nextDigit;
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
    rightDecimal.showFrame = this.currentFrameNumber + 1;
    rightDecimal.answerFrame = this.currentFrameNumber + 1;
    rightDecimal.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3, this.currentFrameNumber + 4);
    middle.content.push(rightDecimal);    
    var equality = new HighlightedContent();
    equality.content = "=";
    equality.highlightFrames.push(this.currentFrameNumber + 2, this.currentFrameNumber + 3, this.currentFrameNumber + 4);
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

Slide.prototype.computeResultDigits = function () {
    this.resultNumber = new NumberHighlighted();
    this.carryOvers = new NumberHighlighted();
    this.carryOvers.digits.push(new HighlightedContent({content: ""}));
    this.intermediates = [];
    this.intermediatesBaseConversions = [];
    var carryOver = 0;
    this.currentFrameNumber ++;
    for (var counterInteger = 0; counterInteger < this.numberOfDigits; counterInteger ++) {
        var topDigit = this.topNumber.getDigit(counterInteger);
        var bottomDigit = this.bottomNumber.getDigit(counterInteger);
        this.intermediates.push( new HighlightedContent());
        this.carryOvers.digits.push( new HighlightedContent());
        this.resultNumber.digits.push( new HighlightedContent());
        this.intermediatesBaseConversions.push( new HighlightedContent());
        if (this.base !== 10) {
            this.processColumnNonBase10(
                topDigit, bottomDigit, carryOver, 
                this.carryOvers.digits[this.carryOvers.digits.length - 2],
                this.topNumber.digits[counterInteger], 
                this.bottomNumber.digits[counterInteger],
                this.resultNumber.digits[counterInteger],
                this.carryOvers.digits[this.carryOvers.digits.length - 1],
                this.intermediates[this.intermediates.length - 1],
                this.plusDigit
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
                this.plusDigit
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

Slide.prototype.computeIntermediateNotes = function (/** @type {DigitHighlighted[]}*/ inputNotes) {
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

Slide.prototype.computeSlideContent = function () {
    this.init();
    this.currentFrameNumber = this.startingFrameNumber;
    this.initializeInputs();
    this.computeResultDigits();
    this.carryOvers.digitPrefix = "{}^{";
    this.carryOvers.digitSuffix = "}";
    this.slideContent = "";
    this.slideContent += "\\begin{frame}\n<br>";
    this.slideContent += "$ \\begin{array}{r";
    for (var counterColumn = 0; counterColumn < this.numberOfDigits + 4; counterColumn ++) {
        this.slideContent += "@{}r";
    }
    this.slideContent += "}<br>\n";
    this.slideContent += this.carryOvers.getTableRow(this.numberOfDigits) + "\\\\\n<br>";
    this.slideContent += `\\multirow{2}{*}{$${this.plusDigit.toString()}$} &`;
    this.slideContent += this.topNumber.getTableRow(this.numberOfDigits);
    this.slideContent += "\\\\\n<br>&";
    this.slideContent += this.bottomNumber.getTableRow(this.numberOfDigits);
    this.slideContent += "\\\\\\hline\n<br>";
    if (this.resultNumber.digits.length == this.numberOfDigits) {
        this.slideContent += "&";
    }
    this.slideContent += this.resultNumber.getTableRow(this.numberOfDigits);
    this.slideContent += "\\end{array}$";
    this.slideContent += this.computeIntermediateNotes(this.intermediates);
    this.slideContent += this.computeIntermediateNotes(this.intermediatesBaseConversions);

    this.slideContent += "\\end{frame}";
}

Slide.prototype.generate = function () {
    this.computeSlideContent();
    document.getElementById(this.idOutput).innerHTML = this.slideContent;
}

/**@type {Slide} */
var theSlide = null;

function initSlide() {
    theSlide = new Slide({
        idInputTop: "idInputTop", 
        idInputBottom: "idInputBottom", 
        idOutput: "idSpanOutput",
        idStartSlideNumber: "idFirstSlideNumber",
        idBase: "idBase"
    });    
}

