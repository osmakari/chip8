#include "opc.h"
#include "mem.h"
#include "disp.h"
#include "keys.h"
/*
    Return list:
        0x01: RETURN
        0x02: GOTO NNN
        0x03: CALL SUBROUTINE
        0x04: JUMP TO ADDRESS R0 + NNN
        0x05: DRAW X Y N
        *************************************
        0xFE: SKIP INSTRUCTION
        0xFF: DON'T SKIP THE NEXT INSTRUCTION

*/

int opcode_process () {
    uint16_t opcode = memory[program_counter] << 8 | memory[program_counter + 1];
    
    move(0, 0);
    printw("COMMAND: 0x%x 0x%x  ", (uint8_t)(opcode >> 8), (uint8_t)(opcode));
    move(1, 0);
    printw("STACKD: %i ", stack_depth);
    refresh();
    
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
            uint16_t addr = opcode & 0x0FFF;
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
            uint8_t r1 = (opcode >> 8) & 0x0F; // register address

            uint8_t v2 = opcode;
            if(registers[r1] == v2) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x4:
        {
            // R DOES NOT EQUAL N
            uint8_t r1 = (opcode >> 8) & 0x0F; // register address

            uint8_t v2 = opcode;
            if(registers[r1] != v2) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x5:
        {
            // R1 EQUALS R2
            uint8_t r1 = (opcode >> 8) & 0x0F; // register address
            uint8_t r2 = (opcode >> 4) & 0x0F;
            r2 = r2 >> 4;
            
            if(registers[r1] == registers[r2]) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0x6:
        {
            // SET R TO N
            uint8_t r1 = (opcode >> 8) & 0x0F;
            uint8_t v = opcode;

            registers[r1] = v;
            break;
        }
        case 0x7:
        {
            // ADD N TO R
            uint8_t r1 = (opcode >> 8) & 0x0F;
            registers[r1] += (uint8_t)opcode;

            break;
        }
        case 0x8:
        {
            uint8_t last_nibble = opcode & 0x0F;
            switch(last_nibble) {
                case 0x00:
                {
                    // SET R1 TO R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;

                    registers[r1] = registers[r2];
                    break;
                }
                case 0x01:
                {
                    // R1 = R1 | R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;

                    registers[r1] = registers[r1] | registers[r2];
                    break;
                }
                case 0x02:
                {
                    // R1 = R1 & R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;

                    registers[r1] = registers[r1] & registers[r2];
                    break;
                }
                case 0x03:
                {
                    // R1 = R1 ^ R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;

                    registers[r1] = registers[r1] ^ registers[r2];
                    break;
                }
                case 0x04:
                {
                    // R1 = R1 + R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;
                    // Carry
                    if((uint16_t)registers[r1] + (uint16_t)registers[r2] > 0xFF) {
                        registers[0xF] = 1;
                    }
                    else {
                        registers[0xF] = 0;
                    }
                    registers[r1] = registers[r1] + registers[r2];
                    break;
                }
                case 0x05:
                {
                    // R1 = R1 + R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;
                    // Borrow
                    if(registers[r1] < registers[r2]) {
                        registers[0xF] = 0;
                    }
                    else {
                        registers[0xF] = 1;
                    }
                    registers[r1] = registers[r1] - registers[r2];
                    break;
                }
                case 0x06:
                {
                    // R1 = R1 >> 1, F = lsb
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;
                    registers[0xF] = registers[r2] & 0x01;
                    registers[r2] = registers[r2] >> 1;
                    registers[r1] = registers[r2];
                    break;
                }
                case 0x07:
                {
                    // R1 = R1 - R2
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;
                    if(registers[r2] < registers[r1]) {
                        registers[0xF] = 0;
                    }
                    else {
                        registers[0xF] = 1;
                    }
                    
                    registers[r1] = registers[r2] - registers[r1];
                    break;
                }
                case 0x0E:
                {
                    // R1 = R1 << 1, F = msb
                    uint8_t r1 = (opcode >> 8) & 0x0F; // register address
                    uint8_t r2 = (opcode >> 4) & 0x0F;
                    r2 = r2 >> 4;
                    registers[0xF] = (registers[r2] >> 7) & 0x01;
                    registers[r2] = registers[r2] << 1;
                    registers[r1] = registers[r2];
                    break;
                }
            }

            
            break;
        }
        case 0x9:
        {
            // R1 EQUALS R2
            uint8_t r1 = (opcode >> 8) & 0x0F; // register address
            uint8_t r2 = (opcode >> 4) & 0x0F;
            r2 = r2 >> 4;
            
            if(registers[r1] != registers[r2]) {
                program_counter += 2;
                return 0xFE; // SKIP INSTRUCTION
            }
            return 0xFF; // DON'T SKIP INSTRCUTION
        }
        case 0xA:
        {
            // set L to NNN
            uint16_t v = opcode & 0x0FFF;
            memory_address = v;
            break;
        }
        case 0xB:
        {
            // JUMP to R0 + NNN
            uint16_t v = opcode & 0x0FFF;
            program_counter = registers[0x0] + v - 2;
            return 0x04;
        }
        case 0xC:
        {
            // R1 = rand() & NN
            uint8_t r1 = (opcode >> 8) & 0x0F;
            r1 = (rand() % 0xFF) & (opcode & 0xFF);
            break;
        }
        case 0xD:
        {   
            uint8_t r1 = (opcode >> 8) & 0x0F;
            uint8_t r2 = (opcode >> 4) & 0x0F;
            uint8_t h = opcode & 0x0F;
            disp_draw(registers[r1], registers[r2], h);
            return 0x05; // DRAW
        }
        case 0xE:
        {  
            if((uint8_t)opcode == 0x9E) {
                // KEY DOWN CHECK
                uint8_t r1 = (opcode >> 8) & 0x0F;
                get_key();
                if(registers[r1] == cur_key) {
                    program_counter += 2;
                    return 0xFE; // SKIP INSTRUCTION
                }
                return 0xFF; // DON'T SKIP INSTRUCTION
            }
            else if((uint8_t)opcode == 0xA1) {
                // KEY UP CHECK
                uint8_t r1 = (opcode >> 8) & 0x0F;
                get_key();
                if(registers[r1] == cur_key) {
                    program_counter += 2;
                    return 0xFE; // SKIP INSTRUCTION
                }
                return 0xFF; // DON'T SKIP INSTRUCTION
            }
        }
        case 0xF:
        {
            uint8_t lb = opcode & 0xFF;
            switch(lb) {
                case 0x07:
                {
                    uint8_t r1 = (opcode >> 8) & 0x0F;
                    registers[r1] = delay_timer;
                    break;
                }
                case 0x0A:
                {
                    uint8_t r1 = (opcode >> 8) & 0x0F;
                    timeout(-1);
                    get_key();
                    timeout(1);
                    registers[r1] = cur_key;
                    break;
                }
                case 0x15:
                {
                    // SET TIMER
                    uint8_t r1 = (opcode >> 8) & 0x0F;
                    delay_timer = registers[r1];
                    break;
                }
                case 0x1E:
                {
                    uint8_t r1 = (opcode >> 8) & 0x0F;
                    memory_address += registers[r1];
                    break;
                }
                case 0x29:
                {
                    // Characters
                    // font starts from 0x00
                    uint8_t r1 = (opcode >> 8) & 0x0F;
                    memory_address = (registers[r1] * 0x05);
                    break;
                }
                case 0x33:
                {
                    // TODO:
                    break;
                }
                case 0x55:
                {
                    // DUMP REGISTERS
                    uint8_t offset = 0;
                    uint8_t count = (opcode >> 8) & 0x0F;
                    for(int x = 0; x < count + 1; x++) {
                        memory[memory_address + offset] = registers[x];
                        offset++;
                    }
                    break;
                }
                case 0x65:
                {
                    // LOAD REGISTERS
                    uint8_t offset = 0;
                    uint8_t count = (opcode >> 8) & 0x0F;
                    for(int x = 0; x < count + 1; x++) {
                        registers[x] = memory[memory_address + offset];
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