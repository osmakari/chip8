#include "keys.h"
#include <stdio.h>
#include <stdlib.h>
char key_list[0x10] = {
    /*0*/ 'x',	
    /*1*/ '1',	/*2*/ '2',	/*3*/ '3',
    /*4*/ 'q',	/*5*/ 'w',	/*6*/ 'e',	
    /*7*/ 'a',  /*8*/ 's',	/*9*/ 'd',	
    /*A*/ 'z',	/*B*/ 'c',
    /*C*/ '4',	/*D*/ 'r',	/*E*/ 'f',	/*F */'v'
};

uint8_t cur_key = 0xFF;

int get_key () {
    
    char c = getch();
    
    for(int x = 0; x < 0xF; x++) {
        if(c == key_list[x]) {
            cur_key = x;
            return x;
        }
    }
    cur_key = 0xFF;
    return -1;
}