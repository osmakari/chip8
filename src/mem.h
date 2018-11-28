#ifndef MEM_H
#define MEM_H
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

extern uint8_t registers[0x10];

extern uint16_t memory_address;

extern uint16_t delay_timer;

extern uint16_t sound_timer;

extern uint16_t program_counter;

extern uint16_t stack[0x10];

extern uint8_t stack_depth;

extern uint8_t memory[0x1000];

// Intialize fonts...
int memory_intialize ();

#endif