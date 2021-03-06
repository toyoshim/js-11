/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * MemoryUnibus prototype
 *
 * This prototype provides a UNIBUS memory system.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 * @see Memory
 */
function MemoryUnibus () {
    this.rk = new DeviceRk(this);
    this.tt = new DeviceTt(this);
    this.kw = new DeviceKw(this);
    this.mmu = new DeviceMmu(this);
    this.ram = new Uint16Array(MemoryUnibus.MEMORY_SIZE >> 1);
    this.init();
}

/**
 * Public constants.
 */
MemoryUnibus.IOCONTROL_RESET = 0;
MemoryUnibus.MEMORY_SIZE = 0x3e000;  // ~256KB

/**
 * Inherit Memory prototype.
 */
MemoryUnibus.prototype = new Memory();
MemoryUnibus.prototype.constructor = MemoryUnibus;

/**
 * Initialize I/O system.
 * @see CpuPdp11
 */
MemoryUnibus.prototype.init = function () {
    this.rk.init();
    this.tt.init();
    this.kw.init();
    this.mmu.init();
    for (var i = 0; i < (MemoryUnibus.MEMORY_SIZE >> 1); i++)
        this.ram[i] = 0;
};

/**
 * Write 8-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
MemoryUnibus.prototype.writeChar = function (address, data) {
    var result = this._read(address);
    if (result < 0)
        throw new RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
    if ((address & 1) == 0)
        result = (result & 0xff00) | data;
    else
        result = (result & 0x00ff) | (data << 8);
    if (!this._write(address, result))
        throw new RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
};

/**
 * Read 8-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
MemoryUnibus.prototype.readChar = function (address) {
    var result = -1;
    result = this._read(address);
    if (result >= 0) {
        if ((address & 1) == 0)
            result &= 0xff;
        else
            result = (result >> 8) & 0xff;
    }
    if (result < 0)
        throw new RangeError("Memory " + Log.toOct(address, 7) +
                " read not implemented.");
    return result;
};

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
MemoryUnibus.prototype.writeShort = function (address, data) {
    if ((address & 1) != 0)
        throw new RangeError("Memory alignment error to " +
                Log.toOct(address, 7) + ".");
    if (!this._write(address, data))
        throw new RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
};

/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
MemoryUnibus.prototype.readShort = function (address) {
    var result = this._read(address);
    if ((address & 1) != 0)
        throw new RangeError("Memory alignment error to " +
                Log.toOct(address, 7));
    if (result < 0)
        throw new RangeError("Memory " + Log.toOct(address, 7) +
                " read not implemented.");
    return result;
};

/**
 * Internally write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
MemoryUnibus.prototype._write = function (address, data) {
    if (data < 0)
        Log.getLog().fatal("Internal error: write negative value.");
    if (address < MemoryUnibus.MEMORY_SIZE) {
        this.ram[address >> 1] = data;
        return true;
    }
    if (this.mmu.write(address, data)) return true;
    if (this.rk.write(address, data)) return true;
    if (this.tt.write(address, data)) return true;
    if (this.kw.write(address, data)) return true;
    return false;
};

/**
 * Internally read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data (-1: failure)
 */
MemoryUnibus.prototype._read = function (address) {
    if (address < MemoryUnibus.MEMORY_SIZE)
        return this.ram[address >> 1];
    var result = this.mmu.read(address);
    if (result < 0)
        result = this.rk.read(address);
    if (result < 0)
        result = this.tt.read(address);
    if (result < 0)
        result = this.kw.read(address);
    return result;
};

/**
 * Do bus specific 16-bit data transaction.
 * Unibus provides;
 *  address 0: BUS reset
 * @param address address to action
 * @param data data to action
 * @return result
 */
MemoryUnibus.prototype.ioControl = function (address, data) {
    if (address == MemoryUnibus.IOCONTROL_RESET) {
        Log.getLog().info("UNIBUS RESET.");
        return 0;
    }
    throw new RangeError("Not implemented.")
};
