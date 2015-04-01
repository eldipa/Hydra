all:
	gcc -ggdb -o example_with_debugging_symbol example.c
	gcc       -o example_without_debugging_symbol example.c
	gcc       -o example_stripped example.c
	strip -s example_stripped

clean:
	rm -f example_with_debugging_symbol
	rm -f example_without_debugging_symbol
	rm -f example_stripped
