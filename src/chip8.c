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
    
    

    if(argc > 1) {
        FILE *f = fopen(argv[1], "rb");
        fread(memory + 0x200, 0x1000 - 0x200, 1, f);
        while(program_counter < 0x1000) {
            usleep(10000);
            while(delay_timer > 0) {
                
                delay_timer--;
                if(sound_timer > 0) {
                    sound_timer--;
                }
                usleep(16000);
            }
            if(sound_timer > 0) {
                sound_timer--;
            }
            opcode_process(); // Process opcodes
            program_counter += 2;
        }
    }
    endwin();
    return 0;
}