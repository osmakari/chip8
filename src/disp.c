#include "disp.h"
#include "mem.h"

int disp_initialize () {
    initscr();
    clear();
    noecho();
    cbreak();
    timeout(1);

    return 0;
}

int disp_clear () {
    clear();
    refresh();
    return 0;
}

int disp_draw (uint8_t x, uint8_t y, uint8_t height) {
    registers[0xF] = 0;
    for(int _y = 0; _y < height; _y++) {
        for(int _x = 0; _x < 8; _x++) {
            move(y + _y, x + _x);
            char c = ((memory[memory_address + _y] >> (8 - _x)) & 0x01) ? '.' : ' ';
            char g = ' ';
            if(c == '.') {
                if(inch() == '.') {
                    
                    registers[0xF] = 1;
                    g = ' ';
                }
                else {
                    g = '.';
                }
                printw("%c", g);
            }
        }
    }
    refresh(); // TODO: Optimize
    return 0;
}