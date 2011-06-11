/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * DeviceRk prototype
 *
 * This prototype provides RK device emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function DeviceRk (bus) {
    this.RKDS = 0;  // 0777400: RK Drive Status Register
    this.RKER = 0;  // 0777402: RK Error Register
    this.RKCS = 0;  // 0777404: RK Control Status Register
    this.RKWC = 0;  // 0777406: RK Word Count Register
    this.RKBA = 0;  // 0777410: RK Current Bus Address Register
    this.RKDA = 0;  // 0777412: RK Disk Address Register

    this.image = null;
    this.bus = bus;
}

/**
 * Public constants.
 */
DeviceRk.ADDRESS_RKDS = 0777400;
DeviceRk.ADDRESS_RKER = 0777402;
DeviceRk.ADDRESS_RKCS = 0777404;
DeviceRk.ADDRESS_RKWC = 0777406;
DeviceRk.ADDRESS_RKBA = 0777410;
DeviceRk.ADDRESS_RKDA = 0777412;

DeviceRk.FUNCTION_MASK = 0x0e;
DeviceRk.FUNCTION_READ = 4;

DeviceRk.CONTROL_GO = 1;

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
DeviceRk.prototype.write = function (address, data) {
    var result = true;
    switch (address) {
        case DeviceRk.ADDRESS_RKCS:
            if ((data & 1)) {
                data &= ~1;
                var func = data & DeviceRk.FUNCTION_MASK;
                if (func == DeviceRk.FUNCTION_READ) {
                    var count = 0x10000 - this.RKWC;
                    Log.getLog().info("RK READ");
                    Log.getLog().info("  Word Count: " + count);
                    Log.getLog().info("  Bus Address: " + this.RKBA);
                    Log.getLog().info("  Disk Address: " + this.RKDA);
                    for (var i = 0; i < count; i++) {
                        this.bus.writeShort(this.RKBA, this.image[this.RKDA >> 1]);
                        this.RKBA = (this.RKBA + 2) & 0xffff;
                        this.RKDA = (this.RKDA + 2) & 0xffff;
                        this.RKWC = (this.RKWC + 1) & 0xffff;
                    }
                } else {
                    Log.getLog().warn("RK unimplemented I/O write.");
                }
            }
            this.RKCS = data;
            break;
        case DeviceRk.ADDRESS_RKWC:
            this.RKWC = data;
            break;
        case DeviceRk.ADDRESS_RKBA:
            this.RKBA = data;
            break;
        case DeviceRk.ADDRESS_RKDA:
            this.RKDA = data;
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
DeviceRk.prototype.read = function (address) {
    var result = -1;

    switch (address) {
        case DeviceRk.ADDRESS_RKDS:
            this.RKDS |= 0x0080; // Set Drive Ready (RDY)
            result = this.RKDS;
            Log.getLog().warn("RK unimplemented I/O read.");
            break;
        case DeviceRk.ADDRESS_RKER:
            result = this.RKER;
            break;
        case DeviceRk.ADDRESS_RKCS:
            this.RKCS |= 0x0080; // Set Control Ready (RDY)
            result = this.RKCS;
            Log.getLog().warn("RK unimplemented I/O read.");
            break;
        default:
            break;
    }
    return result;
};

/**
 * Mount disk image.
 * @param image disk image as ArrayBuffer
 */
DeviceRk.prototype.mount = function (image) {
    if (image == null)
        Log.getLog().error("Invalid disk image.");
    this.image = new Uint16Array(image);
};
