/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * DeviceKw prototype
 *
 * This prototype provides KW device emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function DeviceKw (bus) {
    this.bus = bus;
    this.init();
}

/**
 * Public constants.
 */
DeviceKw.ADDRESS_LKS = 0777546;

DeviceKw.LKS_DONE = 0x80;
DeviceKw.LKS_INTERRUPT_ENABLE = 0x40;
DeviceKw.LKS_FIX = 0x20;
DeviceKw.LKS_UP_DOWN = 0x10;
DeviceKw.LKS_MODE = 0x08;
DeviceKw.LKS_RATE_SELECT = 0x06;
DeviceKw.LKS_RUN = 0x01;

/**
 * Initialize KW device.
 */
DeviceKw.prototype.init = function () {
    this.lks = 0;
};

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
DeviceKw.prototype.write = function (address, data) {
    var result = true;
    switch (address) {
        case DeviceKw.ADDRESS_LKS:
            Log.getLog().warn("KW LKS <= 0x" + Log.toHex(data, 4) +
                " (Not implemented.)");
            this.lks = data;
            break;
        default:
            result = false;
            break;
    }
    return result;
};

/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data (-1: failure)
 */
DeviceKw.prototype.read = function (address) {
    var result = -1;

    switch (address) {
        case DeviceKw.ADDRESS_LKS:  // Clock Status Register
            result = this.lks;
            Log.getLog().warn("KW LKS => 0x" + Log.toHex(result, 4) +
                    " (Not implemented.)");
            break;
        default:
            break;
    }
    return result;
};

/**
 * Check interrupt request.
 * @return request or not
 */
DeviceKw.prototype.requestInterrupt = function () {
    if ((this.lks & DeviceKw.LKS_INTERRUPT_ENABLE) != 0) {
        if ((this.lks & DeviceKw.LKS_MODE) == 0)
            this.lks &= ~DeviceKw.LKS_INTERRUPT_ENABLE;
        return true;
    }
    return false;
};
