#include "sort.h"

void sort_by_selection(int *values, int cant_elements) {
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

