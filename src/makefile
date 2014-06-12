all: Shared TestCode

Shared:
	$(MAKE) -C ./shared
	
TestCode:
	$(MAKE) -C ./cppTestCode
	
clean:
	$(MAKE) -C ./shared clean
	$(MAKE) -C ./cppTestCode clean