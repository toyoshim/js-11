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
}

/**
 * Public constants.
 */
DeviceKw.ADDRESS_LKS = 0777546;

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
            break;
        default:
            result = false;
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
            result = 0x0000;
            Log.getLog().warn("KW LKS => 0x0000 (Not implemented.)");
        default:
            break;
    }
    return result;
};
