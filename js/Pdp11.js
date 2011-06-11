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
        Uint32Array = function (obj) {
            var result;
            if (obj instanceof Array) {
                var length = ~~(obj.length / 4);
                result = new Array(length);
                result.byteLength = obj.length;
                for (var i = 0; i < length; i++)
                    result[i] = (obj[i * 4 + 3] << 24) | (obj[i * 4 + 2] << 16) |
                            (obj[i * 4 + 1] << 8) | obj[i * 4];
            } else {
                result = new Array(obj);
                result.byteLength = obj * 4;
            }
            return result;
        };
    }

    // Initializations.
    this.memory = new MemoryUnibus();
    this.cpu = new CpuPdp11();
    this.cpu.setMemory(this.memory);
    this.logging = false;
}

/**
 * Run emulation.
 */
Pdp11.prototype.run = function () {
    for (var i = 0; i < 10000; i++) {
        if (this.logging)
            this._dump();
        this.cpu.runStep();
    }
};

/**
 * Boot from RK0.
 */
Pdp11.prototype.bootRk0 = function () {
    this.cpu.writeRegister(CpuPdp11.REGISTER_FILE_R04, 0x0410);
    this.memory.writeShort(DeviceRk.ADDRESS_RKWC, 0x10000 - 512);  // 512 Word
    this.memory.writeShort(DeviceRk.ADDRESS_RKBA, 0);  // Bus Address
    this.memory.writeShort(DeviceRk.ADDRESS_RKDA, 0);  // Disk Address
    this.memory.writeShort(DeviceRk.ADDRESS_RKCS,
            DeviceRk.FUNCTION_READ | DeviceRk.CONTROL_GO);
};

/**
 * Mount URI as RK0.
 * @param uri disk image uri
 */
Pdp11.prototype.mountRk0 = function (uri) {
    this.memory.rk.mount(this._load(uri));
};

/**
 * Dump register information.
 */
Pdp11.prototype._dump = function () {
    var dump = "";
    dump += "PC:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_PC), 4) + ",";
    dump += "R0:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R00), 4) + ",";
    dump += "R1:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R01), 4) + ",";
    dump += "R2:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R02), 4) + ",";
    dump += "R3:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R03), 4) + ",";
    dump += "R4:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R04), 4) + ",";
    dump += "R5:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_R05), 4) + ",";
    dump += "R6:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_KSP), 4) + ",";
    dump += "R7:$" + Log.toHex(
            this.cpu.readRegister(CpuPdp11.REGISTER_FILE_PC), 4);
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
