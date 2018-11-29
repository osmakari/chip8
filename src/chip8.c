#include <stdio.h>

#include "opc.h"
#include "mem.h"
#include "disp.h"
#include <unistd.h>


int main (int argc, char *argv[]) {
    //for(int x = 0; x < 80; x++) {
    //    printf("0x%x ", memory[x]);
    //}
    //return 0;
    disp_initialize();

    uint8_t timer_counter = 6;
    if(argc > 1) {
        FILE *f = fopen(argv[1], "rb");
        fread(memory + 0x200, 0x1000 - 0x200, 1, f);
        while(program_counter < 0x1000) {
            if(delay_timer > 0) {
                if(timer_counter == 0) {

                    delay_timer--;

                    timer_counter = 6;
                }
                timer_counter--;
            }
            opcode_process(); // Process opcodes
            program_counter += 2;
            usleep(1670);
        }
    }
    endwin();
    return 0;
}