all:
	gcc -ggdb -o two_pthreads two_pthreads.c -lpthread
	gcc -ggdb -o three_pthreads three_pthreads.c -lpthread
	$(MAKE) --no-print-directory -C ./merge_sort

clean:
	rm -f two_pthreads three_pthreads
	$(MAKE) --no-print-directory -C ./merge_sort clean

