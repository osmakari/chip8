/*
    Processor
*/

var registers = new Uint8Array(0x10);

var stack = new Uint16Array(0x10);
var stack_depth = -1;

var memory = new Uint8Array(0x1000);

var program_counter = 0x200;

var memory_address = 0x0;

var delay_timer = 0x0;

/*
    Front end
*/

var canvas;
var ctx;
var graphics_multi = 10;

var key_list = [
    /*0*/ 'x',	
    /*1*/ '1',	/*2*/ '2',	/*3*/ '3',
    /*4*/ 'q',	/*5*/ 'w',	/*6*/ 'e',	
    /*7*/ 'a',  /*8*/ 's',	/*9*/ 'd',	
    /*A*/ 'z',	/*B*/ 'c',
    /*C*/ '4',	/*D*/ 'r',	/*E*/ 'f',	/*F */'v'
];

var cur_key = 0xFF;

var keycode = null;

var key_blocking = false;
var timer_counter = 16;
function get_key (block) {
    
    key_blocking = block;
    if(keycode == null) {
        return -1;
    }
    console.log(keycode);
    for(var x = 0; x < 0xF; x++) {
        if(keycode == key_list[x]) {
            cur_key = x;
            key_blocking = false;
            return x;
        }
    }
    cur_key = 0xFF;
    return -1;
}

function init () {
    canvas = document.getElementById("c8canvas");
    ctx = canvas.getContext("2d");
    
    canvas.width = 64 * graphics_multi + graphics_multi;
    canvas.height = 32 * graphics_multi + graphics_multi;

    canvas.style.backgroundColor = "#000";
    ctx.fillStyle = "#FFF";

    memory[0]  = 0xF0; memory[1]  = 0x90; memory[2]  = 0x90; memory[3]  = 0x90; memory[4]  = 0xF0; // 0
    memory[5]  = 0x20; memory[6]  = 0x60; memory[7]  = 0x20; memory[8]  = 0x20; memory[9]  = 0x70; // 1
    memory[10] = 0xF0; memory[11] = 0x10; memory[12] = 0xF0; memory[13] = 0x80; memory[14] = 0xF0; // 2
    memory[15] = 0xF0; memory[16] = 0x10; memory[17] = 0xF0; memory[18] = 0x10; memory[19] = 0xF0; // 3
    memory[20] = 0x90; memory[21] = 0x90; memory[22] = 0xF0; memory[23] = 0x10; memory[24] = 0x10; // 4
    memory[25] = 0xF0; memory[26] = 0x80; memory[27] = 0xF0; memory[28] = 0x10; memory[29] = 0xF0; // 5
    memory[30] = 0xF0; memory[31] = 0x80; memory[32] = 0xF0; memory[33] = 0x90; memory[34] = 0xF0; // 6
    memory[35] = 0xF0; memory[36] = 0x10; memory[37] = 0x20; memory[38] = 0x40; memory[39] = 0x40; // 7
    memory[40] = 0xF0; memory[41] = 0x90; memory[42] = 0xF0; memory[43] = 0x90; memory[44] = 0xF0; // 8
    memory[45] = 0xF0; memory[46] = 0x90; memory[47] = 0xF0; memory[48] = 0x10; memory[49] = 0xF0; // 9
    memory[50] = 0xF0; memory[51] = 0x90; memory[52] = 0xF0; memory[53] = 0x90; memory[54] = 0x90; // A
    memory[55] = 0xE0; memory[56] = 0x90; memory[57] = 0xE0; memory[58] = 0x90; memory[59] = 0xE0; // B
    memory[60] = 0xF0; memory[61] = 0x80; memory[62] = 0x80; memory[63] = 0x80; memory[64] = 0xF0; // C
    memory[65] = 0xE0; memory[66] = 0x90; memory[67] = 0x90; memory[68] = 0x90; memory[69] = 0xE0; // D
    memory[70] = 0xF0; memory[71] = 0x80; memory[72] = 0xF0; memory[73] = 0x80; memory[74] = 0xF0; // E
    memory[75] = 0xF0; memory[76] = 0x80; memory[77] = 0xF0; memory[78] = 0x80; memory[79] = 0x80; // F
    document.onkeydown = function(e) {
        keycode = e.key;
    };
    document.onkeyup = function (e) {
        keycode = null;
    };
    
    
}

function getFile (file) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", file, true);
    oReq.responseType = "arraybuffer";
    console.log("requesting " + file);
    oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            console.log("Loaded a " + byteArray.byteLength + " array");
            for (var i = 0; i < byteArray.byteLength; i++) {
                memory[0x200 + i] = byteArray[i];
            }
            setInterval(function () {
                if(key_blocking) {
                    get_key(true);
                    return;
                }
                if(delay_timer > 0) {
                    if(timer_counter == 0) {
        
                        delay_timer--;
        
                        timer_counter = 16;
                    }
                    timer_counter--;
                }
                opcode_process(); // Process opcodes
                program_counter += 2;
        
            }, 1);
        }
    };
    
    oReq.send(null);

    
}

function disp_draw (x, y, height) {
    registers[0xF] = 0;
    for(var _y = 0; _y < height; _y++) {
        for(var _x = 0; _x < 8; _x++) {
            var px = ctx.getImageData((x + _x) * graphics_multi - (graphics_multi/2), (y + _y) * graphics_multi - (graphics_multi/2), 1, 1).data;
            var on = ((memory[memory_address + _y] >> (8 - _x)) & 0x01);
            if(on) {
                if(px[0] > 0 && px[1] > 0 && px[2] > 0) {
                    
                    registers[0xF] = 1;
                    ctx.fillStyle = "#000";
                    ctx.fillRect((x + _x) * graphics_multi - (graphics_multi/2), (y + _y) * graphics_multi - (graphics_multi/2), 1 * graphics_multi, 1 * graphics_multi);
                }
                else {
                    ctx.fillStyle = "#FFF";
                    ctx.fillRect((x + _x) * graphics_multi - (graphics_multi/2), (y + _y) * graphics_multi - (graphics_multi/2), 1 * graphics_multi, 1 * graphics_multi);

                }
            }
        }
    }
}

function disp_clear () {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 64 * graphics_multi, 32 * graphics_multi);
}

function opcode_process () {
    var opcode = memory[program_counter] << 8 | memory[program_counter + 1] & 0xFF;
    //console.log(opcode >> 12);
    switch(opcode >> 12) {
        case 0:
        {
            if(opcode == 0x00EE) {
                // Return
                program_counter = stack[stack_depth] - 2;
                stack_depth--;
                return 0x1; // return = end execution on this subroutine
            }
            else if(opcode == 0x00E0) {
                disp_clear();

            }
            else {
                // 0x0NNN call
            }
            break;
        }
        case 0x1:
        {
            var addr = opcode & 0x0FFF;
            program_counter = addr - 2;
            return 0x2; // GOTO
        }
        case 0x2:
        {
            // Add 1 to stack depth
            stack_depth++;

            // Save current program position to the stack
            stack[stack_depth] = program_counter + 2;

            // Go to subroutine
            program_counter = (opcode & 0xFFF) - 2;
            
            return 0x3; // CALL SUBROUTINE
        }
        case 0x3:
        {
            // R EQUALS N
            var r1 = (opcode >> 8) & 0x0F; // register address

            var v2 = opcode & 0xFF;
            if(registers[r1] == v2) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x4:
        {
            // R DOES NOT EQUAL N
            var r1 = (opcode >> 8) & 0x0F; // register address

            var v2 = opcode & 0xFF;
            if(registers[r1] != v2) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x5:
        {
            // R1 EQUALS R2
            var r1 = (opcode >> 8) & 0x0F; // register address
            var r2 = (opcode >> 4) & 0x0F;
            
            if(registers[r1] == registers[r2]) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x6:
        {
            // SET R TO N
            var r1 = (opcode >> 8) & 0x0F;
            var v = opcode & 0xFF;

            registers[r1] = v;
            break;
        }
        case 0x7:
        {
            // ADD N TO R
            var r1 = (opcode >> 8) & 0x0F;
            registers[r1] += opcode & 0xFF;

            break;
        }
        case 0x8:
        {
            var last_nibble = opcode & 0x0F;
            switch(last_nibble) {
                case 0x00:
                {
                    // SET R1 TO R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;

                    registers[r1] = registers[r2];
                    break;
                }
                case 0x01:
                {
                    // R1 = R1 | R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;

                    registers[r1] = registers[r1] | registers[r2];
                    break;
                }
                case 0x02:
                {
                    // R1 = R1 & R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;

                    registers[r1] = registers[r1] & registers[r2];
                    break;
                }
                case 0x03:
                {
                    // R1 = R1 ^ R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;

                    registers[r1] = registers[r1] ^ registers[r2];
                    break;
                }
                case 0x04:
                {
                    // R1 = R1 + R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;
                    // Carry
                    if(registers[r1] + registers[r2] > 0xFF) {
                        registers[0xF] = 1;
                    }
                    else {
                        registers[0xF] = 0;
                    }
                    registers[r1] = (registers[r1] + registers[r2]) & 0xFF;
                    break;
                }
                case 0x05:
                {
                    // R1 = R1 - R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;
                    // Borrow
                    if(registers[r1] < registers[r2]) {
                        registers[0xF] = 0;
                    }
                    else {
                        registers[0xF] = 1;
                    }
                    registers[r1] = (registers[r1] - registers[r2]) & 0xFF;
                    break;
                }
                case 0x06:
                {
                    // R1 = R1 >> 1, F = lsb
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;
                    registers[0xF] = registers[r2] & 0x01;
                    registers[r2] = (registers[r2] >> 1) & 0xFF;
                    registers[r1] = registers[r2];
                    break;
                }
                case 0x07:
                {
                    // R1 = R1 - R2
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;
                    if(registers[r2] < registers[r1]) {
                        registers[0xF] = 0;
                    }
                    else {
                        registers[0xF] = 1;
                    }
                    
                    registers[r1] = (registers[r2] - registers[r1]) & 0xFF;
                    break;
                }
                case 0x0E:
                {
                    // R1 = R1 << 1, F = msb
                    var r1 = (opcode >> 8) & 0x0F; // register address
                    var r2 = (opcode >> 4) & 0x0F;
                    registers[0xF] = (registers[r2] >> 7) & 0x01;
                    registers[r2] = (registers[r2] << 1) & 0xFF;
                    registers[r1] = registers[r2];
                    break;
                }
            }

            
            break;
        }
        case 0x9:
        {
            // R1 DOES NOT EQUAL R2
            var r1 = (opcode >> 8) & 0x0F; // register address
            var r2 = (opcode >> 4) & 0x0F;
            
            if(registers[r1] != registers[r2]) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0xA:
        {
            // set L to NNN
            var v = opcode & 0x0FFF;
            memory_address = v;
            break;
        }
        case 0xB:
        {
            // JUMP to R0 + NNN
            var v = opcode & 0x0FFF;
            program_counter = registers[0x0] + v - 2;
            return 0x04;
        }
        case 0xC:
        {
            // R1 = rand() & NN
            var r1 = (opcode >> 8) & 0x0F;
            r1 = (Math.random() % 0xFF) & (opcode & 0xFF);
            break;
        }
        case 0xD:
        {   
            var r1 = (opcode >> 8) & 0x0F;
            var r2 = (opcode >> 4) & 0x0F;
            var h = opcode & 0x0F;
            disp_draw(registers[r1], registers[r2], h);
            return 0x05; // DRAW
        }
        case 0xE:
        {  
            if(opcode & 0xFF == 0x9E) {
                // KEY DOWN CHECK
                var r1 = (opcode >> 8) & 0x0F;
                get_key(false); // Non blocking
                if(registers[r1] == cur_key) {
                    program_counter += 2;
                    return 0xFE; // SKIP INSTRUCTION
                }
                return 0xFF; // DON'T SKIP INSTRUCTION
            }
            else if(opcode & 0xFF == 0xA1) {
                // KEY UP CHECK
                var r1 = (opcode >> 8) & 0x0F;
                get_key(false); // Non blocking
                if(registers[r1] == cur_key) {
                    program_counter += 2;
                    return 0xFE; // SKIP INSTRUCTION
                }
                return 0xFF; // DON'T SKIP INSTRUCTION
            }
        }
        case 0xF:
        {
            var lb = opcode & 0xFF;
            switch(lb) {
                case 0x07:
                {
                    var r1 = (opcode >> 8) & 0x0F;
                    registers[r1] = delay_timer & 0xFF;
                    break;
                }
                case 0x0A:
                {
                    var r1 = (opcode >> 8) & 0x0F;
                    get_key(true); // Blocking
                    registers[r1] = cur_key;
                    break;
                }
                case 0x15:
                {
                    // SET TIMER
                    var r1 = (opcode >> 8) & 0x0F;
                    delay_timer = registers[r1] & 0xFF;
                    break;
                }
                case 0x1E:
                {
                    var r1 = (opcode >> 8) & 0x0F;
                    memory_address += registers[r1] & 0xFF;
                    break;
                }
                case 0x29:
                {
                    // Characters
                    // font starts from 0x00
                    var r1 = (opcode >> 8) & 0x0F;
                    memory_address = (registers[r1] * 0x05) & 0xFF;
                    break;
                }
                case 0x33:
                {
                    var r1 = (opcode >> 8) & 0x0F;
                    memory[memory_address] = Math.floor(registers[r1]/100) & 0xFF;
                    memory[memory_address + 1] = (Math.floor(registers[r1]/10) % 10) & 0xFF;
                    memory[memory_address + 2] = ((registers[r1] % 100) % 10) & 0xFF;
                    break;
                }
                case 0x55:
                {
                    // DUMP REGISTERS
                    var offset = 0;
                    var count = (opcode >> 8) & 0x0F;
                    for(var x = 0; x < count + 1; x++) {
                        memory[memory_address + offset] = registers[x] & 0xFF;
                        offset++;
                    }
                    break;
                }
                case 0x65:
                {
                    // LOAD REGISTERS
                    var offset = 0;
                    var count = (opcode >> 8) & 0x0F;
                    for(var x = 0; x < count + 1; x++) {
                        registers[x] = memory[memory_address + offset] & 0xFF;
                        offset++;
                    }
                    break;
                }
            }
            break;
        }

    }
    
    return 0; // DO NOTHING
}