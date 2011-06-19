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
    this.image = null;
    this.bus = bus;
    this.init();
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

DeviceRk.RKCS_FUNCTION_READ = 4;

DeviceRk.RKDS_RDY = 0x0080;
DeviceRk.RKCS_IDE = 0x0040;  // Int.on Done Enable
DeviceRk.RKCS_RDY = 0x0080;  // Control Ready
DeviceRk.RKCS_FUNCTION = 0x000e;  // Function
DeviceRk.RKCS_GO = 0x0001;  // Go

/**
 * Initialize RK device.
 */
DeviceRk.prototype.init = function () {
    this.RKDS = 0;  // 0777400: RK Drive Status Register
    this.RKER = 0;  // 0777402: RK Error Register
    this.RKCS = 0;  // 0777404: RK Control Status Register
    this.RKWC = 0;  // 0777406: RK Word Count Register
    this.RKBA = 0;  // 0777410: RK Current Bus Address Register
    this.RKDA = 0;  // 0777412: RK Disk Address Register
    this.interruptRequest = false;
};

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
            if ((data & DeviceRk.RKCS_GO) != 0) {
                data &= ~1;
                var func = data & DeviceRk.RKCS_FUNCTION;
                if (func == DeviceRk.RKCS_FUNCTION_READ) {
                    var count = 0x10000 - this.RKWC;
                    var drive = this._getDrive(this.RKDA);
                    var sector = this._getSector(this.RKDA);
                    Log.getLog().info("RK READ: 0x" + Log.toHex(data, 4));
                    Log.getLog().info("  Word Count: " + count);
                    Log.getLog().info("  Bus Address: " + Log.toOct(this.RKBA, 7));
                    Log.getLog().info("  Disk Address: " + Log.toOct(this.RKDA, 7));
                    Log.getLog().info("    drive: " + drive);
                    Log.getLog().info("    sector: " + sector);
                    var diskAddress = sector << 8;
                    var logging = this.bus.logging;
                    this.bus.logging = false;
                    for (var i = 0; i < count; i++) {
                        this.bus.writeShort(this.RKBA, this.image[diskAddress++]);
                        this.RKBA = (this.RKBA + 2) & 0xffff;
                        this.RKWC = (this.RKWC + 1) & 0xffff;
                    }
                    this.bus.logging = logging;
                    sector = diskAddress >> 8;
                    this.RKDA = this._encodeAddress(drive, sector);
                    Log.getLog().info("  Word Count: " + count);
                    Log.getLog().info("  Bus Address: " + Log.toOct(this.RKBA, 7));
                    Log.getLog().info("  Disk Address: " + Log.toOct(this.RKDA, 7));
                    Log.getLog().info("    sector: " + sector);
                    Log.getLog().info("  Interrupt on Done: " +
                            (((data & DeviceRk.RKCS_IDE) != 0) ? "ON" : "OFF"));
                    if ((data & DeviceRk.RKCS_IDE) != 0) {
                        this.interruptRequest = true;
                        this.RKDS &= ~DeviceRk.RKDS_RDY;  // Drive Ready
                        data &= ~DeviceRk.RKCS_RDY;  // Control Ready
                    } else {
                        this.RKDS |= DeviceRk.RKDS_RDY;  // Drive Ready
                        data |= DeviceRk.RKCS_RDY;  // Control Ready
                    }
                    Log.getLog().info("RKBA: " + Log.toOct(data, 7));
                    Log.getLog().info("RKDA: " + Log.toOct(data, 7));
                } else {
                    Log.getLog().warn("RK: func=" + func + ",data=" + data + "\n");
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
            result = this.RKDS;
            Log.getLog().warn("RK unimplemented I/O read (RKDS): 0x" +
                    Log.toHex(result, 4));
            break;
        case DeviceRk.ADDRESS_RKER:
            result = this.RKER;
            break;
        case DeviceRk.ADDRESS_RKCS:
            result = this.RKCS;
            Log.getLog().warn("RK unimplemented I/O read (RKCS): 0x" +
                    Log.toHex(result, 4));
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
DeviceRk.prototype.requestInterrupt = function () {
    if (!this.interruptRequest)
        return false;
    this.interruptRequest = false;
    this.RKDS |= DeviceRk.RKDS_RDY;  // Drive Ready
    this.RKCS |= DeviceRk.RKCS_RDY;  // Control Ready
    return true;
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

/**
 * Encode disk address.
 * |Drive|  Track   |Sect|
 * |15.13|12.......4|3..0|
 * Sect: 0~11 (not 0~15)
 * @param drive drive ID
 * @param sector sector ID (Track * 12 + Sect)
 * @return encoded disk address for RKDA
 */
DeviceRk.prototype._encodeAddress = function (drive, sector) {
    var track = ~~(sector / 12);
    var sect = sector % 12;
    return (drive << 13) | (track << 4) | sect;
};

/**
 * Decode disk address and get sector ID.
 * @param address encoded address (raw RKDA address)
 * @return decoded sector ID
 */
DeviceRk.prototype._getSector = function (address) {
    var track = (address >> 4) & 0x01ff;
    var sect = address & 0x000f;
    return track * 12 + sect;
};

/**
 * Decode disk address and get drive ID.
 * @param address encoded address (raw RKDA address)
 * @return decoded drive ID
 */
DeviceRk.prototype._getDrive = function (address) {
    var drive = (address >> 13) & 0x0007;
    return drive;
};