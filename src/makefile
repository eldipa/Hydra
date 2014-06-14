all: IPC Shared TestCode

IPC:
	$(MAKE) --no-print-directory -C ./ipc

Shared:
	$(MAKE) -C ./shared
	
TestCode:
	$(MAKE) -C ./cppTestCode
	
clean:
	$(MAKE) --no-print-directory -C ./ipc clean
	$(MAKE) -C ./shared clean
	$(MAKE) -C ./cppTestCode clean
