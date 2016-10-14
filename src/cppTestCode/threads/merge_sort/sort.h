#ifndef SORT_H_
#define SORT_H_

#include "range.h"

void *sort(void *range_ptr);
void merge(Range *first_half, Range *second_half, int *destination);

#endif
