/**
 * TOYOSHIMA-HOUSE Library for JavaScript
 */

/**
 * Log prototype
 *
 * This prototype provide common log interfaces.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 *
 */

/**
 * Log prototype function. This prototype provide three kinds of Log
 * mechanisms. User can specify its type by id argument.
 * @param id Log type
 *     undefined: Use native console.log if it's available.
 *     null: Eliminate all logs.
 *     <string>: Output as pre element under DOM object which has <string> id.
 * @param reverse logging order
 *     true: Newer logs will be added to tail.
 *     false: Newer logs will be added to head.
 */
function Log (id, reverse) {
    this.lastLevel = "";
    this.reverse = reverse;
    this.lastMessage = "";
    this.lastMessageCount = 0;
    this.logLevel = Log.INFO;

    // Set default log scheme.
    this.print = function (object) { /* Do nothing. */ };

    if (id == undefined) {
        // Try to use native console.
        if (window.console != undefined) {
            this.print = function (object) {
                console.log(object);
            }
        }
    } else if (id != null) {
        // Try to output under specified DOM object.
        this.frameDiv = document.getElementById(id);
        if (this.frameDiv == undefined)
            return;
        this.framePre = document.createElement('pre');
        this.frameDiv.appendChild(this.framePre);

        this.print = function (object) {
            if (window.console != undefined) {
                console.log(object);
            }
            var element;
            if (object instanceof Object) {
                element = document.createElement('pre');
                var text = object.toString();
                var textNode = document.createTextNode(text);
                element.appendChild(textNode);
                var title = "";
                for (var item in object) {
                    title += item + ":" + object[item] + "; \n";
                }
                element.setAttribute('title', title);
            } else {
                element = document.createTextNode(object + "\n");
            }
            if (this.reverse && this.framePre.firstChild)
                this.framePre.insertBefore(element, this.framePre.firstChild);
            else
                this.framePre.appendChild(element);
        }
    }
}

/**
 * Public constants.
 */

Log.FATAL = 0;
Log.ERROR = 1;
Log.WARN = 2;
Log.WARNING = 2;
Log.INFO = 3;
Log.INFORMATION = 3;

Log._log = new Log();

/**
 * Set default log instance.
 * @param newLog Log instance to set
 */
Log.setLog = function (newLog) {
    Log._log = newLog;
};

/**
 * Get default log instance.
 * @return default Log instance
 */
Log.getLog = function () {
    return Log._log;
};

/**
 * Convert to hex string.
 * @param number number to convert
 * @param digit result value's digit
 */
Log.toHex = function (number, digit) {
    var sign = number & 0x80000000;
    var result;
    if (sign != 0) {
        result = "fffffff" + (number >> 16).toString(16) +
                (number & 0xffff).toString(16);
    } else {
        result = "0000000" + (number >> 16).toString(16) +
                (number & 0xffff).toString(16);

    }
    return result.slice(-digit);
};

/**
 * Convert to oct string.
 * @param number number to convert
 * @param digit result value's digit
 */
Log.toOct = function (number, digit) {
    var result = "0000000000" + number.toString(8);
    return result.slice(-digit);
};

/**
 * Set log filter level
 * @param level log level
 */
Log.prototype.setLevel = function (level) {
    this.logLevel = level;
};

/**
 * Filter print message.
 * @param message message to print
 */
Log.prototype.prettyPrint = function (message) {
    if (this.lastMessage == message) {
        this.lastMessageCount++;
        return;
    }
    if (this.lastMessageCount != 0) {
        this.print("... repeated " + this.lastMessageCount + "times");
        this.lastMessageCount = 0;
    }
    this.lastMessage = message;
    this.print(message);
};

/**
 * Log fatal message.
 * @param message fatal message
 */
Log.prototype.fatal = function (message) {
    if (this.logLevel < Log.FATAL) return;
    if (this.LastLevel != "FATAL") {
        this.LastLevel = "FATAL";
        this.prettyPrint("*FATAL*");
    }
    this.prettyPrint(message);
};

/**
 * Log error message.
 * @param message error message
 */
Log.prototype.error = function (message) {
    if (this.logLevel < Log.ERROR) return;
    if (this.LastLevel != "ERROR") {
        this.LastLevel = "ERROR";
        this.prettyPrint("*ERROR*");
    }
    this.prettyPrint(message);
};

/**
 * Log warning message.
 * @param message warning message
 */
Log.prototype.warn = function (message) {
    if (this.logLevel < Log.WARN) return;
    if (this.LastLevel != "WARN") {
        this.LastLevel = "WARN";
        this.prettyPrint("*WARN*");
    }
    this.prettyPrint(message);
};

/**
 * Log information message.
 * @param message information message
 */
Log.prototype.info = function (message) {
    if (this.logLevel < Log.INFO) return;
    if (this.LastLevel != "INFO") {
        this.LastLevel = "INFO";
        this.prettyPrint("*INFO*");
    }
    this.prettyPrint(message);
};
