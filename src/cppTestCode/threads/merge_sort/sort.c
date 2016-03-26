#include "sort.h"

void *sort(void *range_ptr) {
    Range *range = (Range*) range_ptr;

    int *values = range->start;
    int cant_elements = (range->end - range->start);

    int min_position = 0;
    int tmp = 0;

    for(int i = 0; i < cant_elements; ++i) {
        min_position = i;

        for(int j = i; j < cant_elements; ++j) {
            if(values[j] < values[min_position]) {
                min_position = j;
            }
        }

        tmp = values[i];
        values[i] = values[min_position];
        values[min_position] = tmp;
    }
}

void merge(Range *first_half, Range *second_half, int *destination) {
    int i = 0, j = 0, k = 0;
    int *first_current = first_half->start;
    int *second_current = second_half->start;

    while ((first_current < first_half->end) && (second_current < second_half->end)) {
        if (*first_current < *second_current) {
            destination[k] = *first_current;
            first_current += 1;
        }
        else {
            destination[k] = *second_current;
            second_current += 1;
        }

        k += 1;
    }

    while (first_current < first_half->end) {
        destination[k] = *first_current;
        first_current += 1;
        k += 1;
    }

    while (second_current < second_half->end) {
        destination[k] = *second_current;
        second_current += 1;
        k += 1;
    }
}
