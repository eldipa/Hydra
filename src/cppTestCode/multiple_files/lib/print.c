#include <stdio.h>
#include "print.h"

void print_array(int *values, int count_elements) {
   for(int i = 0; i < count_elements; ++i) {
      printf("%i", values[i]);
      if(i + 1 < count_elements) {
         printf(" ");
      }
      else {
         printf("\n");
      }
   }
}
