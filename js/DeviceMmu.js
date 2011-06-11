/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * DeviceMmu prototype
 *
 * This prototype provides PDP-11 MMU emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function DeviceMmu () {
    this.kernelPageDescriptorRegister = new Uint16Array(8);
    this.userPageDescriptorRegister = new Uint16Array(8);
    this.kernelPageAddressRegister = new Uint16Array(8);
    this.userPageAddressRegister = new Uint16Array(8);
    this.mmuKernelBases = new Uint16Array(CpuPdp11._PAGE_SIZE);
    this.mmuUserBases = new Uint16Array(CpuPdp11._PAGE_SIZE);
    this.init();
}

/**
 * Public constants.
 */
DeviceMmu.MODE_KERNEL = CpuPdp11._MODE_KERNEL;
DeviceMmu.MODE_USER = CpuPdp11._MODE_USER;

/**
 * Private constants.
 */
DeviceMmu._MEMORY_SPACE_SIZE = 262144;
DeviceMmu._MINIMUM_BYTES_PER_PAGE = 32;
DeviceMmu._MINIMUM_BYTES_PER_PAGE_BITS = 5;
DeviceMmu._MINIMUM_BYTES_PER_PAGE_MASK = 0x1f;
DeviceMmu._PAGE_SIZE = DeviceMmu._MEMORY_SPACE_SIZE / DeviceMmu._MINIMUM_BYTES_PER_PAGE;

/**
 * Initialize the processor.
 */
DeviceMmu.prototype.init = function () {
    var i;
    for (i = 0; i < 8; i++) {
        this.kernelPageDescriptorRegister[i] = 0;
        this.userPageDescriptorRegister[i] = 0;
        this.kernelPageAddressRegister[i] = 0;
        this.userPageAddressRegister[i] = 0;
    }
    this.SR0 = 0;
    this.mmuEnabled = false;
    for (i = 0; i < DeviceMmu._PAGE_SIZE; i++) {
        var base = i * DeviceMmu._MINIMUM_BYTES_PER_PAGE;
        this.mmuKernelBases[i] = base;
        this.mmuUserBases[i] = base;
    }
};

/**
 * Convert virtual address to physical address.
 * @param address virtual address
 * @mode processor mode
 * @return address physical address
 */
DeviceMmu.prototype.getPhysicalAddress = function (address, mode) {
    if (address >= 0160000) {
        // UNIBUS I/O device registers
        address |= 0600000;
    }
    if (this.mmuEnabled) {
        if (mode == DeviceMmu.MODE_KERNEL) {
            return this.mmuKernelBases[
                    address >> DeviceMmu._MINIMUM_BYTES_PER_PAGE_BITS] +
                    (address & DeviceMmu._MINIMUM_BYTES_PER_PAGE_MASK);
        } else if (mode == DeviceMmu.MODE_USER) {
            return this.mmuUserBases[
                    address >> DeviceMmu._MINIMUM_BYTES_PER_PAGE_BITS] +
                    (address & DeviceMmu._MINIMUM_BYTES_PER_PAGE_MASK);
        } else {
            throw new Error("MMU: Invalid mode.");
        }
    }
    return address;
};

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
DeviceMmu.prototype.write = function (address, data) {
    switch (address) {
        case 0772300:
        case 0772302:
        case 0772304:
        case 0772306:
        case 0772310:
        case 0772312:
        case 0772314:
        case 0772316:
            // MMU Kernel Instruction / Data PDRs
            this.kernelPageDescriptorRegister[(address - 0772300) >> 1] = data;
            Log.getLog().warn("MMU KPDR[" + ((address - 0772300) >> 1) +
                    "]: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0772320:
        case 0772322:
        case 0772324:
        case 0772326:
        case 0772330:
        case 0772332:
        case 0772334:
        case 0772336:
            // MMU Kernel Data PDRs (separate I/D space is not implemented)
            break;
        case 0772340:
        case 0772342:
        case 0772344:
        case 0772346:
        case 0772350:
        case 0772352:
        case 0772354:
        case 0772356:
            // MMU Kernel Instruction / Data PARs
            this.kernelPageAddressRegister[(address - 0772340) >> 1] = data;
            Log.getLog().warn("MMU KPAR[" + ((address - 0772340) >> 1) +
                    "]: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0772360:
        case 0772362:
        case 0772364:
        case 0772366:
        case 0772370:
        case 0772372:
        case 0772374:
        case 0772376:
            // MMU Kernel Data PARs (separate I/D space is not implemented)
            break;
        case 0777572:
            // MMU SR0
            this.SR0 = data;
            this.mmuEnabled = ((data & 1) == 0) ? false : true;
            if ((data & 0xfffe) != 0)
                Log.getLog().warn("MMU SR0: Write " + Log.toOct(data, 7) +
                        " (not implemented)");
            else
                Log.getLog().info("MMU SR0: Write " + Log.toOct(data, 7));
            return true;
        case 0777574:
            // MMU SR1
            Log.getLog().warn("MMU SR1: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0777576:
            // MMU SR2
            Log.getLog().warn("MMU SR2: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0777600:
        case 0777602:
        case 0777604:
        case 0777606:
        case 0777610:
        case 0777612:
        case 0777614:
        case 0777616:
            // MMU User Instruction / Data PDRs
            this.userPageDescriptorRegister[(address - 0777600) >> 1] = data;
            Log.getLog().warn("MMU UPDR[" + ((address - 0777600) >> 1) +
                    "]: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0777620:
        case 0777622:
        case 0777624:
        case 0777626:
        case 0777630:
        case 0777632:
        case 0777634:
        case 0777636:
            // MMU User Data PDRs (separate I/D space is not implemented)
            break;
        case 0777640:
        case 0777642:
        case 0777644:
        case 0777646:
        case 0777650:
        case 0777652:
        case 0777654:
        case 0777656:
            // MMU User Instruction / Data PARs
            this.userPageAddressRegister[(address - 0777640) >> 1] = data;
            Log.getLog().warn("MMU UPAR[" + ((address - 0777640) >> 1) +
                    "]: Write " + Log.toOct(data, 7) +
                    " (not implemented)");
            return true;
        case 0777660:
        case 0777662:
        case 0777664:
        case 0777666:
        case 0777670:
        case 0777672:
        case 0777674:
        case 0777676:
            // MMU User Data PARs (separate I/D space is not implemented)
            break;
    }
    return false;
};


/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data (-1: failure)
 */
DeviceMmu.prototype.read = function (address) {
    switch (address) {
        case 0772300:
        case 0772302:
        case 0772304:
        case 0772306:
        case 0772310:
        case 0772312:
        case 0772314:
        case 0772316:
            // MMU Kernel Instruction / Data PDRs
            return this.kernelPageDescriptorRegister[(address - 0772300) >> 1];
        case 0772320:
        case 0772322:
        case 0772324:
        case 0772326:
        case 0772330:
        case 0772332:
        case 0772334:
        case 0772336:
            // MMU Kernel Data PDRs (separate I/D space is not implemented)
            break;
        case 0772340:
        case 0772342:
        case 0772344:
        case 0772346:
        case 0772350:
        case 0772352:
        case 0772354:
        case 0772356:
            // MMU Kernel Instruction / Data PARs
            return this.kernelPageAddressRegister[(address - 0772340) >> 1];
        case 0772360:
        case 0772362:
        case 0772364:
        case 0772366:
        case 0772370:
        case 0772372:
        case 0772374:
        case 0772376:
            // MMU Kernel Data PARs (separate I/D space is not implemented)
            break;
        case 0777572:
            // MMU SR0
            Log.getLog().info("MMU SR0: Read not implemented.");
            return this.SR0;
        case 0777574:
            // MMU SR1
            Log.getLog().warn("MMU SR1: Read not implemented.");
            return 0;
        case 0777576:
            // MMU SR2
            Log.getLog().warn("MMU SR2: Read not implemented.");
            return 0;
        case 0777600:
        case 0777602:
        case 0777604:
        case 0777606:
        case 0777610:
        case 0777612:
        case 0777614:
        case 0777616:
            // MMU User Instruction / Data PDRs
            return this.userPageDescriptorRegister[(address - 0777600) >> 1];
        case 0777620:
        case 0777622:
        case 0777624:
        case 0777626:
        case 0777630:
        case 0777632:
        case 0777634:
        case 0777636:
            // MMU User Data PDRs (separate I/D space is not implemented)
            break;
        case 0777640:
        case 0777642:
        case 0777644:
        case 0777646:
        case 0777650:
        case 0777652:
        case 0777654:
        case 0777656:
            // MMU User Instruction / Data PARs
            return this.userPageAddressRegister[(address - 0777640) >> 1];
        case 0777660:
        case 0777662:
        case 0777664:
        case 0777666:
        case 0777670:
        case 0777672:
        case 0777674:
        case 0777676:
            // MMU User Data PARs (separate I/D space is not implemented)
            break;
    }
    return -1;
};
