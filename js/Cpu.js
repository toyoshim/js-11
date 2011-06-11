/**
 * CPU Emulation Suites for JavaScript
 */

/**
 * Cpu prototype
 *
 * This prototype provides a processor interfaces.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function Cpu () {
    this.memory = null;
}

/**
 * Set memory access object.
 * @param memory Memory object to set
 */
Cpu.prototype.setMemory = function (memory) {
    this.memory = memory;
};

/**
 * Initialize the processor.
 */
Cpu.prototype.init = function () {
};

/**
 * Read internal register values.
 * @param index register index
 * @return register value
 */
Cpu.prototype.readRegister = function (index) {
    throw new RangeError("not implemented.");
};

/**
 * Write internal register values.
 * @param index register index
 * @param value register value
 */
Cpu.prototype.writeRegister = function (index, value) {
    throw new RangeError("not implemented.");
};

/**
 * Execute one step.
 */
Cpu.prototype.runStep = function () {
    throw new Error("not implemented.");
};
