import os, time, sys
from subprocess import check_output
from threading import Lock

sys.path.append("./py")
import publish_subscribe.eventHandler 

def is_running():
    time.sleep(0.01)
    out = check_output(["python", "py/publish_subscribe/notifier.py", "status"])
    return "running" in out


if __name__ == '__main__':
    os.system("python py/publish_subscribe/notifier.py start")
    assert is_running()
    
    try:
        agent1 = publish_subscribe.eventHandler.EventHandler()

        is_done = Lock()
        is_done.acquire()
        def done(e):
            global is_done
            is_done.release()
        agent1.subscribe('bar', done)

        try:
            payload = {chr(k) * 1: {chr(q)*2: range(4) for q in range(ord('A'), ord('z'))}
                            for k in range(ord('A'), ord('z'))}
            for i in range(10000, -1, -1):
                agent1.publish('foo', {'n': i, 'd': payload})
            agent1.publish('bar', {})
            is_done.acquire()

        finally:
            agent1.close()
    finally:
        os.system("python py/publish_subscribe/notifier.py stop")

