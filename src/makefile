all: IPC Shared TestCode

IPC:
	$(MAKE) --no-print-directory -C ./ipc

Shared:
	$(MAKE) --no-print-directory -C ./shared
	
TestCode:
	$(MAKE) --no-print-directory -C ./cppTestCode
	
clean:
	$(MAKE) --no-print-directory -C ./ipc clean
	$(MAKE) --no-print-directory -C ./shared clean
	$(MAKE) --no-print-directory -C ./cppTestCode clean
