#ifndef KEYS_H
#define KEYS_H

#include <stdint.h>
#include <ncurses.h>

extern uint8_t cur_key;

extern char key_list[0x10];

int get_key ();

#endif