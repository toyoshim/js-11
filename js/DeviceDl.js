/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * DeviceDl prototype
 *
 * This prototype provides DL device emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function DeviceDl (bus) {
    this.bus = bus;
}

/**
 * Public constants.
 */
DeviceDl.ADDRESS_RCSR = 0777560;
DeviceDl.ADDRESS_RBUF = 0777562;
DeviceDl.ADDRESS_XCSR = 0777564;
DeviceDl.ADDRESS_XBUF = 0777566;

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
DeviceDl.prototype.write = function (address, data) {
    var result = true;
    switch (address) {
        case DeviceDl.ADDRESS_XCSR:  // DL11 Transmitter Status Register
            Log.getLog().warn("DL11 XCSR <= " + Log.toHex(data, 4));
            break;
        case DeviceDl.ADDRESS_XBUF:  // DL11 Transmitter Data Buffer Register
            Log.getLog().info("CONSOLE: '" + String.fromCharCode(data) + "'");
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
DeviceDl.prototype.read = function (address) {
    var result = -1;

    switch (address) {
        case DeviceDl.ADDRESS_RBUF:  // DL11 Receiver Data Buffer Register
            reslut = 0xffff;
        case DeviceDl.ADDRESS_XCSR:  // DL11 Transmitter Status Register
            result = 0x0080;  // TRANSMITTER READY
        default:
            break;
    }
    return result;
};
