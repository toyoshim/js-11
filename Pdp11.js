/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * PDP-11 Emulator.
 */
function Pdp11 () {
    // Browser compatibility hacks.
    var ua = navigator.userAgent.toLowerCase();
    this.isChrome = ua.indexOf("chrome") != -1;
    this.isSafari = !this.isChrome && ua.indexOf("safari") != -1;
    if (this.isSafari && ua.indexOf("mobile") == -1) {
        // Safari for Desktop doesn't support ArrayBuffer.
        // Define pseudo Uint8Array prototype.
        Uint8Array = function (obj) {
            var result;
            if (obj instanceof Array) {
                result = new Array(obj.length);
                result.byteLength = obj.length;
                for (var i = 0; i < result.byteLength; i++)
                    result[i] = obj[i];
            } else {
                result = new Array(obj);
                result.byteLength = obj;
            }
            return result;
        };
        Uint16Array = function (obj) {
            var result;
            if (obj instanceof Array) {
                var length = ~~(obj.length / 2);
                result = new Array(length);
                result.byteLength = obj.length;
                for (var i = 0; i < length; i++)
                    result[i] = (obj[i * 2 + 1] << 8) | obj[i * 2];
            } else {
                result = new Array(obj);
                result.byteLength = obj * 2;
            }
            return result;
        };
    }

    // Initializations.
    this.memory = new MemoryUnibus();
    this.memory.rk.mount(this._load("../data/unix0_v6_rk.dsk"));
    this.cpu = new CpuPdp11();
    this.cpu.setMemory(this.memory);
    this.cpu.writeRegister(CpuPdp11.REGISTER_FILE_PC, 0002002);
}

/**
 * Run emulation.
 */
Pdp11.prototype.run = function () {
    for (var i = 0; i < 1024; i++) {
/*
        var log = "";
        log += "PC:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_PC), 4) + ",";
        log += "R0:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R00), 4) + ",";
        log += "R1:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R01), 4) + ",";
        log += "R2:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R02), 4) + ",";
        log += "R3:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R03), 4) + ",";
        log += "R4:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R04), 4) + ",";
        log += "R5:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R05), 4) + ",";
        log += "R6:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_KSP), 4) + ",";
        log += "R7:$" + Log.toHex(
                this.cpu.readRegister(CpuPdp11.REGISTER_FILE_PC), 4);
        Log.getLog().info(log);
*/
        this.cpu.runStep();
//        this._dump();
    }
};

/**
 * Dump register information.
 */
Pdp11.prototype._dump = function () {
    var dump = "-----------\n";
    dump += "R0: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R00), 7) + "\n";
    dump += "R1: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R01), 7) + "\n";
    dump += "R2: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R02), 7) + "\n";
    dump += "R3: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R03), 7) + "\n";
    dump += "R4: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R04), 7) + "\n";
    dump += "R5: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_R05), 7) + "\n";
    dump += "SP: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_KSP), 7) + "\n";
    dump += "PC: " + Log.toOct(this.cpu.readRegister(
            CpuPdp11.REGISTER_FILE_PC ), 7) + "\n";
    dump += "-----------";
    Log.getLog().info(dump);
};

/**
 * Load data from URI as ArrayBuffer.
 * @param uri URI
 * @return loaded data as ArrayBuffer
 */
Pdp11.prototype._load = function (uri) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", uri, false);
    xhr.responseType = "arraybuffer";
    if (this.isSafari)
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send("");
    if (xhr.status != 200) return null;
    if (this.isSafari) {
        // Safari doesn't support ArrayBuffer response.
        // Use x-user-defined charset as pseudo binary
        // and convert it to Array.
        var data = xhr.responseText;
        var length = data.length;
        var array = new Array(length);
        for (var i = 0; i < length; i++)
            array[i] = data.charCodeAt(i) & 0xff;
        return array;
    }
    if (xhr.response instanceof ArrayBuffer) // Chrome
        return xhr.response;
    if (xhr.mozResponseArrayBuffer instanceof ArrayBuffer) // Firefox
        return xhr.mozResponseArrayBuffer;
    return null;
};
