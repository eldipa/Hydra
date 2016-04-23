import os, time, sys
from subprocess import check_output

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

        try:
            payload = ""
            for i in range(10000, -1, -1):
                agent1.publish('foo', {'n': i, 'd': payload})

        finally:
            agent1.close()
    finally:
        os.system("python py/publish_subscribe/notifier.py stop")

