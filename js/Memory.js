/**
 * CPU Emulation Suites for JavaScript
 */

/**
 * Memory prototype
 *
 * This prototype provides a memory access interfaces.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function Memory () {
}

/**
 * Write 8-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
Memory.prototype.writeChar = function (address, data) {
    throw new RangeError("not implemented.")
};

/**
 * Read 8-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
Memory.prototype.readChar = function (address) {
    throw new RangeError("not implemented.")
};

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
Memory.prototype.writeShort = function (address, data) {
    throw new RangeError("not implemented.")
};

/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
Memory.prototype.readShort = function (address) {
    throw new RangeError("not implemented.")
};
