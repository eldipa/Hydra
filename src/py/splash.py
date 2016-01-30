import Tkinter as tkinter
import time

################################################################################
# Almost all the code of the Splash object is from https://code.activestate.com/recipes/576936/
# It was helpful also https://code.activestate.com/recipes/577271-tkinter-splash-screen/

class Splash(object):
    def __init__(self, file, event_to_wait, loading_event_signal, loading_event_holder, wait_timeout):
        self.__log = None
        self.__file = file
        self.__event_to_wait = event_to_wait
        self.__loading_event_signal = loading_event_signal
        self.__loading_event_holder = loading_event_holder
        self.__wait_timeout = wait_timeout

    def __enter__(self):
        self.__splash_opened = True
        root = tkinter.Tk()

        self.__time_when_entered = time.time()

        # Hide the root while it is built.
        root.withdraw()

        # Create components of splash screen.
        window = tkinter.Toplevel(root)
        canvas = tkinter.Canvas(window)
        splash = tkinter.PhotoImage(master=window, file=self.__file)
        log    = tkinter.StringVar()
        label  = tkinter.Label(window, textvariable=log)

        # Get the screen's width and height.
        scrW = window.winfo_screenwidth()
        scrH = window.winfo_screenheight()

        # Get the images's width and height.
        imgW = splash.width()
        imgH = splash.height()

        # Compute positioning for splash screen.
        Xpos = (scrW - imgW) // 2
        Ypos = (scrH - imgH) // 2

        # Configure the window showing the logo.
        window.overrideredirect(True)
        window.geometry('+{}+{}'.format(Xpos, Ypos))

        # Setup canvas on which image is drawn.
        canvas.configure(width=imgW, height=imgH, highlightthickness=0)
        canvas.pack(side=tkinter.TOP, fill=tkinter.BOTH, expand=tkinter.YES)
        #canvas.grid()

        label.pack(side=tkinter.BOTTOM, expand=tkinter.YES)
        label.config(font=("calibri", 11))

        # Show the splash screen on the monitor.
        canvas.create_image(imgW // 2, imgH // 2, image=splash)
        window.update()

        # Save the variables for later cleanup
        self.__root   = root
        self.__window = window
        self.__canvas = canvas
        self.__splash = splash
        self.__label  = label

        # Save this to be updated later
        self.__log = log

        return self

    def enter(self):
        return self.__enter__()

    def update_state(self, text):
        if self.__log is not None:
            self.__log.set(text)
            self.__window.update()

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not self.__splash_opened:
            return

        remain_timeout = self.__wait_timeout - (time.time() - self.__time_when_entered)
        while not self.__event_to_wait.is_set() and remain_timeout > 0:
            self.__loading_event_signal.acquire()
            try:
                self.__loading_event_signal.wait(remain_timeout)
                self.update_state(self.__loading_event_holder['ev'])
                remain_timeout = self.__wait_timeout - (time.time() - self.__time_when_entered)
            except:
                remain_timeout = 0   # exit now
            finally:
                self.__loading_event_signal.release()

        # Free used resources in reverse order.
        del self.__splash
        self.__label.destroy()
        self.__canvas.destroy()
        self.__window.destroy()

        del self.__label
        del self.__canvas
        del self.__window

        self.__log = None
        
        self.__root.destroy()
        del self.__root

        self.__splash_opened = False

    def exit(self):
        return self.__exit__(None, None, None)


