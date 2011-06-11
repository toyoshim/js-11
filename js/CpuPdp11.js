/**
 * CPU Emulation Suites for JavaScript
 */

/**
 * CpuPdp11 prototype
 *
 * This prototype provides PDP-11 emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 * @see Cpu
 */
function CpuPdp11 () {
    Cpu.call(this);
    this.registerSet = new Uint16Array(CpuPdp11.NUM_OF_LOGICAL_REGISTERS);
    this.generalRegisterSet = new Array(2);
    this.generalRegisterSet[0] =
            new Uint16Array(CpuPdp11.NUM_OF_GENERAL_REGISTERS);
    this.generalRegisterSet[1] =
            new Uint16Array(CpuPdp11.NUM_OF_GENERAL_REGISTERS);
    this.stackPointer = new Uint16Array(3);
    this.init();
}

/**
 * Inherit Cpu prototype.
 */
CpuPdp11.prototype = new Cpu();
CpuPdp11.prototype.constructor = CpuPdp11;

/**
 * Public constants.
 */
CpuPdp11.NUM_OF_LOGICAL_REGISTERS = 8;
CpuPdp11.NUM_OF_GENERAL_REGISTERS = 6;
CpuPdp11.NUM_OF_PHYSICAL_REGISTERS = 16;

CpuPdp11.REGISTER_R0 = 0;
CpuPdp11.REGISTER_R1 = 1;
CpuPdp11.REGISTER_R2 = 2;
CpuPdp11.REGISTER_R3 = 3;
CpuPdp11.REGISTER_R4 = 4;
CpuPdp11.REGISTER_R5 = 5;
CpuPdp11.REGISTER_R6 = 6;
CpuPdp11.REGISTER_SP = 6;
CpuPdp11.REGISTER_R7 = 7;
CpuPdp11.REGISTER_PC = 7;
CpuPdp11.REGISTER_FILE_R00 = 0;
CpuPdp11.REGISTER_FILE_R01 = 1;
CpuPdp11.REGISTER_FILE_R02 = 2;
CpuPdp11.REGISTER_FILE_R03 = 3;
CpuPdp11.REGISTER_FILE_R04 = 4;
CpuPdp11.REGISTER_FILE_R05 = 5;
CpuPdp11.REGISTER_FILE_R10 = 6;
CpuPdp11.REGISTER_FILE_R11 = 7;
CpuPdp11.REGISTER_FILE_R12 = 8;
CpuPdp11.REGISTER_FILE_R13 = 9;
CpuPdp11.REGISTER_FILE_R14 = 10;
CpuPdp11.REGISTER_FILE_R15 = 11;
CpuPdp11.REGISTER_FILE_USP = 12;
CpuPdp11.REGISTER_FILE_SSP = 13;
CpuPdp11.REGISTER_FILE_KSP = 14;
CpuPdp11.REGISTER_FILE_PC = 15;

/**
 * Private constants.
 */
CpuPdp11._MODE_KERNEL = 0;
CpuPdp11._MODE_SUPERVISOR = 1;
CpuPdp11._MODE_USER = 2;

CpuPdp11._ADDRESSING_REGISTER = 0;
CpuPdp11._ADDRESSING_REGISTER_DEFERRED = 1;
CpuPdp11._ADDRESSING_AUTOINCREMENT = 2;
CpuPdp11._ADDRESSING_AUTOINCREMENT_DEFERRED = 3;
CpuPdp11._ADDRESSING_AUTODECREMENT = 4;
CpuPdp11._ADDRESSING_AUTODECREMENT_DEFERRED = 5;
CpuPdp11._ADDRESSING_INDEX = 6;
CpuPdp11._ADDRESSING_INDEX_DEFERRED = 7;

CpuPdp11._ADDRESSING_PUSH = (CpuPdp11._ADDRESSING_AUTODECREMENT << 3) |
        CpuPdp11.REGISTER_SP;
CpuPdp11._ADDRESSING_POP = (CpuPdp11._ADDRESSING_AUTOINCREMENT << 3) |
        CpuPdp11.REGISTER_SP;

/**
 * Initialize the processor.
 * @see Cpu
 */
CpuPdp11.prototype.init = function () {
    this.previousMode = CpuPdp11._MODE_KERNEL;
    this.currentMode = CpuPdp11._MODE_KERNEL;
    this.generalRegisterSetSelect = 0;
    var i;
    for (i = 0; i < CpuPdp11.NUM_OF_LOGICAL_REGISTERS; i++)
        this.registerSet[i] = 0;
    for (i = 0; i < CpuPdp11.NUM_OF_GENERAL_REGISTERS; i++) {
        this.generalRegisterSet[0][i] = 0;
        this.generalRegisterSet[1][i] = 0;
    }
    for (i = CpuPdp11._MODE_KERNEL; i <= CpuPdp11._MODE_USER; i++)
        this.stackPointer[i] = 0;
    this.flagN = 0;
    this.flagZ = 0;
    this.flagV = 0;
    this.flagC = 0;
};

/**
 * Read internal register values.
 * @param index register index
 * @return register value
 * @see Cpu
 */
CpuPdp11.prototype.readRegister = function (index) {
    if ((index < 0) || (index >= CpuPdp11.NUM_OF_PHYSICAL_REGISTERS))
        throw new RangeError();

    this._storeRegister();

    if (index <= CpuPdp11.REGISTER_FILE_R05)
        return this.generalRegisterSet[0][index];
    if (index <= CpuPdp11.REGISTER_FILE_R15)
        return this.generalRegisterSet[1][index - CpuPdp11.REGISTER_FILE_R10];
    if (index == CpuPdp11.REGISTER_FILE_USP)
        return this.stackPointer[CpuPdp11._MODE_USER];
    if (index == CpuPdp11.REGISTER_FILE_SSP)
        return this.stackPointer[CpuPdp11._MODE_SUPERVISOR];
    if (index == CpuPdp11.REGISTER_FILE_KSP)
        return this.stackPointer[CpuPdp11._MODE_KERNEL];
    if (index == CpuPdp11.REGISTER_FILE_PC)
        return this.registerSet[CpuPdp11.REGISTER_PC];

    throw new Error("Should not be reached.");
};

/**
 * Write internal register values.
 * @param index register index
 * @param value register value
 * @see Cpu
 */
CpuPdp11.prototype.writeRegister = function (index, value) {
    if ((index < 0) || (index >= CpuPdp11.NUM_OF_PHYSICAL_REGISTERS))
        throw new RangeError();

    this._storeRegister();

    if (index <= CpuPdp11.REGISTER_FILE_R05)
        this.generalRegisterSet[0][index] = value;
    if (index <= CpuPdp11.REGISTER_FILE_R15)
        this.generalRegisterSet[1][index - CpuPdp11.REGISTER_FILE_R10] = value;
    if (index == CpuPdp11.REGISTER_FILE_USP)
        this.stackPointer[CpuPdp11._MODE_USER] = value;
    if (index == CpuPdp11.REGISTER_FILE_SSP)
        this.stackPointer[CpuPdp11._MODE_SUPERVISOR] = value;
    if (index == CpuPdp11.REGISTER_FILE_KSP)
        this.stackPointer[CpuPdp11._MODE_KERNEL] = value;
    if (index == CpuPdp11.REGISTER_FILE_PC)
        this.registerSet[CpuPdp11.REGISTER_PC] = value;

    this._loadRegister();
};

/**
 * Execute one step.
 * @see Cpu
 */
CpuPdp11.prototype.runStep = function () {
    var currentPc = this.registerSet[CpuPdp11.REGISTER_PC];
    var instruction = this._fetchWord();
    try {
        switch (instruction & 0170000) {  // Double operand instructions
            case 0010000:  // MOV
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this.flagN = (src >> 15) & 1;
                this.flagZ = (src == 0) ? 1 : 0;
                this.flagV = 0;
                this._storeWordByMode(instruction & 0000077, src);
                return;
            case 0020000:  // CMP
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                var dst = this._loadWordByMode(instruction & 0000077);
                var result = src - dst;
                this.flagN = (result >> 15) & 1;
                this.flagZ = (result == 0) ? 1 : 0;
                this.flagV = (((src ^ dst) & (~dst ^ result)) >> 15) & 1;
                this.flagC = (src < dst) ? 1 : 0;
                return;
            case 0030000:  // BIT
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = src & dst;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = 0;
                            return result;
                        });
                return;
            case 0040000:  // BIC
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = ~src & dst;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = 0;
                            return result;
                        });
                return;
            case 0050000:  // BIS
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = src ^ dst;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = 0;
                            return result;
                        });
                return;
            case 0060000:  // ADD
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = src + dst;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = ((~(src ^ dst) & (src ^ result)) >> 15) & 1;
                            this.flagC = (result > 0xffff) ? 1 : 0;
                            result &= 0xffff;
                            return result;
                        });
                return;
            case 0110000:  // MOVB
                var src = this._loadCharByMode((instruction & 0007700) >> 6);
                this.flagN = (src >> 7) & 1;
                this.flagZ = (src == 0) ? 1 : 0;
                this.flagV = 0;
                this._storeCharByMode(instruction & 0000077, src);
                return;
            case 0120000:  // CMPB
                var src = this._loadCharByMode((instruction & 0007700) >> 6);
                var dst = this._loadCharByMode(instruction & 0000077);
                var result = src - dst;
                this.flagN = (result >> 7) & 1;
                this.flagZ = (result == 0) ? 1 : 0;
                this.flagV = (((src ^ dst) & (~dst ^ result)) >> 7) & 1;
                this.flagC = (src < dst) ? 1 : 0;
                return;
            case 0130000:  // BITB
            case 0140000:  // BICB
            case 0150000:  // BISB
                break;
            case 0160000:  // SUB
                var src = this._loadWordByMode((instruction & 0007700) >> 6);
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = src - dst;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = (((src ^ dst) & (~dst ^ result)) >> 15) & 1;
                            this.flagC = (src < dst) ? 1 : 0;
                            return result & 0xffff;
                        });
                return;
            default:
                break;
        }
        switch (instruction & 0177000) {  // Misc instructions
            case 0004000:  // JSR
                var pc = this._indexByMode(instruction & 0000077);
                var r = (instruction & 0000700) >> 6;
                this._storeWordByMode(CpuPdp11._ADDRESSING_PUSH,
                        this.registerSet[r]);
                this.registerSet[r] = this.registerSet[CpuPdp11.REGISTER_PC];
                this.registerSet[CpuPdp11.REGISTER_PC] = pc;
                return;
            case 0070000:  // MUL
                break;
            case 0071000:  // DIV
                var r = (instruction & 0000600) >> 6;
                var dst = (this.registerSet[r] << 16) | this.registerSet[r + 1];
                var src = this._loadWordByMode(instruction & 0000077);
                if (src == 0) {
                    this.flagN = 0;
                    this.flagZ = 1;
                    this.flagV = 1;
                    this.flagC = 1;
                } else if ((dst == 0x80000000) && (src == 0177777)) {
                    this.flagN = 0;
                    this.flagZ = 0;
                    this.flagV = 1;
                    this.flagC = 0;
                } else {
                    var result = ~~(dst / src);
                    this.flagN = (result >> 15) & 1;
                    if ((result > 0777777) || (result < -0100000)) {
                        this.flagZ = 0;
                        this.flagV = 1;
                        this.flagC = 0;
                    } else {
                        this.registerSet[r + 0] = result;
                        this.registerSet[r + 1] = dst % src;
                        this.flagZ = (result == 0) ? 1 : 0;
                        this.flagV = 0;
                        this.flagC = 0;
                    }
                }
                return;
            case 0072000:  // ASH
                var src = this._loadWordByMode(instruction & 0000077);
                var offset = src & 0000037;
                var sign = (src & 0000040) >> 5;
                var r = (instruction & 0000700) >> 6;
                if (sign == 0) {
                    // Shift to left
                    var result = this.registerSet[r] << offset;
                    this.flagN = (result >> 15) & 1;
                    this.flagZ = (result == 0) ? 1 : 0;
                    this.flagV = ((result ^ this.registerSet[r]) >> 15) & 1;
                    this.flagC = (result >> 16) & 1;
                    this.registerSet[r] = result & 0xffff;
                } else {
                    // Shift to right
                    offset = 32 - offset;
                    if (offset > 16)
                        offset = 16;
                    var result = this.registerSet[r] >> offset;
                    if ((this.registerSet[r] & 0x8000) != 0)
                        result |= (0xffff << (16 - offset)) & 0xffff;
                    this.flagN = (result >> 15) & 1;
                    this.flagZ = (result == 0) ? 1 : 0;
                    this.flagV = ((result ^ this.registerSet[r]) >> 15) & 1;
                    this.flagC = (this.registerSet[r] >> (offset - 1)) & 1;
                    this.registerSet[r] = result & 0xffff;
                }
                return;
            case 0076000:  // XOR
            default:
                break;
        }
        switch (instruction & 0177400) {  // Program control instructions
            case 0000400:  // BR
                var offset = instruction & 0000377;
                if ((offset & 0x80) != 0)
                    offset = -(0x100 - offset);
                this.registerSet[CpuPdp11.REGISTER_PC] =
                        (this.registerSet[CpuPdp11.REGISTER_PC] +
                                offset * 2) & 0xffff;
                return;
            case 0001000:  // BNE
                if (this.flagZ == 0) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0001400:  // BEQ
                if (this.flagZ == 1) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0002000:  // BGE
                if (this.flagN == this.flagV) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0100000:  // BPL
                if (this.flagN == 0) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0101000:  // BHI
                if (this.flagC == 0 && this.flagZ == 0) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0103000:  // BCC
                if (this.flagC == 0) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            case 0103400:  // BCS
                if (this.flagC == 1) {
                    var offset = instruction & 0000377;
                    if ((offset & 0x80) != 0)
                        offset = -(0x100 - offset);
                    this.registerSet[CpuPdp11.REGISTER_PC] =
                            (this.registerSet[CpuPdp11.REGISTER_PC] +
                                    offset * 2) & 0xffff;
                }
                return;
            default:
                break;
        }
        switch (instruction & 0177700) {  // Single operand instructions
            case 0000100:  // JMP
                var pc = this._indexByMode(instruction & 0000077);
                this.registerSet[CpuPdp11.REGISTER_PC] = pc;
                return;
            case 0000300:  // SWAB
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var high = dst & 0xff;
                            var low = (dst >> 8) & 0xff;
                            var result = (high << 8) | low;
                            this.flagN = (low >> 7) & 1;
                            this.flagZ = (low == 0) ? 1 : 0;
                            this.flagV = 0;
                            this.flagC = 0;
                            return result;
                        });
                return;
            case 0005000:  // CLR
                this.flagN = 0;
                this.flagZ = 1;
                this.flagV = 0;
                this.flagC = 0;
                this._storeWordByMode(instruction & 0000077, 0);
                return;
            case 0005200:  // INC
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            var result = (dst + 1) & 0xffff;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = this.flagZ;
                            return result;
                        });
                return;
            case 0005700:  // TST
                var test = this._loadWordByMode(instruction & 0000077);
                this.flagN = (test >> 15) & 1;
                this.flagZ = (test == 0) ? 1 : 0;
                this.flagV = 0;
                this.flagC = 0;
                return;
            case 0006300:  // ASL
                this._operationWordByMode(instruction & 0000077,
                        function (dst) {
                            this.flagC = (dst >> 15) & 1;
                            var result = (dst << 1) & 0xffff;
                            this.flagN = (result >> 15) & 1;
                            this.flagZ = (result == 0) ? 1 : 0;
                            this.flagV = this.flagN ^ this.flagC;
                            return result;
                        });
                return;
            case 0105000:  // CLRB
                this.flagN = 0;
                this.flagZ = 1;
                this.flagV = 0;
                this.flagC = 0;
                this._storeCharByMode(instruction & 0000077, 0);
                return;
            case 0105700:  // TSTB
                var test = this._loadCharByMode(instruction & 0000077);
                this.flagN = (test >> 7) & 1;
                this.flagZ = (test == 0) ? 1 : 0;
                this.flagV = 0;
                this.flagC = 0;
                return;
            case 0106300:  // ASLB
                break;
            default:
                break;
        }
        switch (instruction & 0177770) {
            case 0000200:  // RTS
                var r = instruction & 7;
                this.registerSet[CpuPdp11.REGISTER_PC] = this.registerSet[r];
                this.registerSet[r] =
                        this._loadWordByMode(CpuPdp11._ADDRESSING_POP);
                return;
            default:
                break;
        }
        switch (instruction) {
            case 0000000:  // HALT
                Log.getLog().info("HALT");
                return;
            default:
                throw new Error("Unknown");
        }
    } catch (e) {
        if (instruction == undefined)
            instruction = 0;
        throw new Error(e.message + " on instruction " +
                Log.toOct(instruction, 7) + " at PC " +
                Log.toOct(currentPc, 7));
    }
};

/**
 * Synchronize logical registers to physical registers.
 */
CpuPdp11.prototype._storeRegister = function () {
    for (var r = CpuPdp11.REGISTER_R0; r <= CpuPdp11.REGISTER_R5; r++) {
        this.generalRegisterSet[this.generalRegisterSetSelect][r] =
                this.registerSet[r];
    }
    this.stackPointer[this.currentMode] =
            this.registerSet[CpuPdp11.REGISTER_SP];
};

/**
 * Synchronize logical registers from physical registers.
 */
CpuPdp11.prototype._loadRegister = function () {
    for (var r = CpuPdp11.REGISTER_R0; r <= CpuPdp11.REGISTER_R5; r++) {
        this.registerSet[r] =
                this.generalRegisterSet[this.generalRegisterSetSelect][r];
    }
    this.registerSet[CpuPdp11.REGISTER_SP] =
            this.stackPointer[this.currentMode];
};

/**
 * Convert 16-bit address by MMU configuration.
 * @param address virtual address
 * @return address physical address
 */
CpuPdp11.prototype._convertAddress = function (address) {
    if (address >= 0160000) {
        // UNIBUS I/O device registers
        address |= 0600000;
    }
    return address;
};

/**
 * Load 8-bit value from memory.
 * @param address memory address
 * @return loaded value
 */
CpuPdp11.prototype._loadChar = function (address) {
    address = this._convertAddress(address);
    return this.memory.readChar(address);
};

/**
 * Load 16-bit value from memory.
 * @param address memory address
 * @return loaded value
 */
CpuPdp11.prototype._loadWord = function (address) {
    address = this._convertAddress(address);
    return this.memory.readShort(address);
};

/**
 * Store 8-bit value to memory.
 * @param address memory address
 * @param value value to store
 */
CpuPdp11.prototype._storeChar = function (address, value) {
    address = this._convertAddress(address);
    this.memory.writeChar(address, value);
};

/**
 * Store 16-bit value to memory.
 * @param address memory address
 * @param value value to store
 */
CpuPdp11.prototype._storeWord = function (address, value) {
    address = this._convertAddress(address);
    this.memory.writeShort(address, value);
};

/**
 * Load 16-bit value from PC.
 * @return fetched value
 */
CpuPdp11.prototype._fetchWord = function () {
    var value = this._loadWord(this.registerSet[CpuPdp11.REGISTER_PC]);
    this.registerSet[CpuPdp11.REGISTER_PC] += 2;
    return value;
};

/**
 * Calculate address by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @return address
 */
CpuPdp11.prototype._indexByMode = function (modeAndR) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    var result;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            throw new Error("Invalid indexing.");
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            result = this.registerSet[r];
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            throw new Error("Invalid indexing.");
        case CpuPdp11._ADDRESSING_INDEX:
            result = (this._fetchWord() + this.registerSet[r]) & 0xffff;
            break;
        default:
            throw new RangeError("Invalid indexing mode: " + mode);
    }
    return result;
};

/**
 * Load 8-bit value by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @return loaded value
 */
CpuPdp11.prototype._loadCharByMode = function (modeAndR) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    var result;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            result = this.registerSet[r] & 0xff;
            break;
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            result = this._loadChar(this.registerSet[r]);
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
            result = this._loadChar(this.registerSet[r]);
            this.registerSet[r] += 1;
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT_DEFERRED:
            result = this._loadWord(this.registerSet[r]);
            this.registerSet[r] += 2;
            result = this._loadChar(result);
            break;
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            this.registerSet[r] -= 1;
            result = this._loadChar(this.registerSet[r]);
            break;
        case CpuPdp11._ADDRESSING_INDEX:
            result = this._loadChar(
                    (this._fetchWord() + this.registerSet[r]) & 0xffff);
            break;
        default:
            throw new RangeError("Invalid indexing mode: bl," + mode);
    }
    return result;
};

/**
 * Load 16-bit value by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @return loaded value
 */
CpuPdp11.prototype._loadWordByMode = function (modeAndR) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    var result;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            result = this.registerSet[r];
            break;
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            result = this._loadWord(this.registerSet[r]);
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
            result = this._loadWord(this.registerSet[r]);
            this.registerSet[r] += 2;
            break;
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            this.registerSet[r] -= 2;
            result = this._loadWord(this.registerSet[r]);
            break;
        case CpuPdp11._ADDRESSING_INDEX:
            result = this._loadWord(
                    (this._fetchWord() + this.registerSet[r]) & 0xffff);
            break;
        default:
            throw new RangeError("Invalid indexing mode: wl," + mode);
    }
    return result;
};

/**
 * Store 8-bit value by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @param value value to store
 */
CpuPdp11.prototype._storeCharByMode = function (modeAndR, value) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            this.registerSet[r] = (this.registerSet[r] & 0xff00) | value;
            break;
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            this._storeChar(this.registerSet[r], value);
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
            this._storeChar(this.registerSet[r], value);
            this.registerSet[r] += 1;
            break;
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            this.registerSet[r] -= 1;
            this._storeChar(this.registerSet[r], value);
            break;
        case CpuPdp11._ADDRESSING_INDEX:
            this._storeChar(
                    (this._fetchWord() + this.registerSet[r]) & 0xffff);
            break;
        default:
            throw new RangeError("Invalid indexing mode: bs," + mode);
    }
};

/**
 * Store 16-bit value by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @param value value to store
 */
CpuPdp11.prototype._storeWordByMode = function (modeAndR, value) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            this.registerSet[r] = value;
            break;
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            this._storeWord(this.registerSet[r], value);
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
            this._storeWord(this.registerSet[r], value);
            this.registerSet[r] += 2;
            break;
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            this.registerSet[r] -= 2;
            this._storeWord(this.registerSet[r], value);
            break;
        case CpuPdp11._ADDRESSING_INDEX:
            this._storeWord(
                    (this._fetchWord() + this.registerSet[r]) & 0xffff, value);
            break;
        default:
            throw new RangeError("Invalid indexing mode: ws," + mode);
    }
};

/**
 * Operate 16-bit value by specified addressing mode and register.
 * @param modeAndR addressing mode and register number
 * @param operation operation to do
 */
CpuPdp11.prototype._operationWordByMode = function (modeAndR, operation) {
    var mode = modeAndR >> 3;
    var r = modeAndR & 7;
    switch (mode) {
        case CpuPdp11._ADDRESSING_REGISTER:
            this.registerSet[r] = operation(this.registerSet[r]);
            break;
        case CpuPdp11._ADDRESSING_REGISTER_DEFERRED:
            this._storeWord(this.registerSet[r],
                    operation(this._loadWord(this.registerSet[r])));
            break;
        case CpuPdp11._ADDRESSING_AUTOINCREMENT:
            this._storeWord(this.registerSet[r],
                    operation(this._loadWord(this.registerSet[r])));
            this.registerSet[r] += 2;
            break;
        case CpuPdp11._ADDRESSING_AUTODECREMENT:
            this.registerSet[r] -= 2;
            this._storeWord(this.registerSet[r],
                    operation(this._loadWord(this.registerSet[r])));
            break;
        case CpuPdp11._ADDRESSING_INDEX:
            var address = (this._fetchWord() + this.registerSet[r]) & 0xffff;
            this._storeWord(address, operation(this._loadWord(address)));
            break;
        default:
            throw new RangeError("Invalid indexing mode: ow," + mode);
    }
};
