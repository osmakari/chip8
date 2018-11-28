#ifndef DISP_H
#define DISP_H

// Display driver
#include <ncurses.h>
#include <stdint.h>

int disp_initialize ();

int disp_clear ();

int disp_draw (uint8_t x, uint8_t y, uint8_t height);

#endif