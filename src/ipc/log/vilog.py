import sys

colors = map(lambda c: "\x1b[%im" % c, range(31, 38))
colors += map(lambda c: "\x1b[7m%s" % c, colors)
bold = "\x1b[1m"
end = "\x1b[0m"

def enter(expecteds):
    assert len(expecteds) < len(colors) + 1,  "Hay demasiados nombres, no se podra distingirlos a todos." 
    color_by_process = dict(zip(expecteds, colors))

    for process in expecteds: 
        print " -", color_by_process[process], process, end

    print
    return color_by_process

if __name__ == '__main__':
    if len(sys.argv) <= 1:
       print "Se debe espeficificar el nombre de los procesos que se quiere tracear."
       print "Use _ para ignorar el color"
       print "Ejemplo: python vilog.py foo bar zar qar qwerty zety hilo _ pala"
       enter(["foo", "bar", "zar", "qar", "qwerty", "zety", "hilo", "_", "pala"])
       sys.exit(1)

    expecteds = sys.argv[1:]
    color_by_process = enter(expecteds)

    expecteds = filter(lambda p: p != '_', expecteds)
    
    while True:
        line = sys.stdin.readline()
        if not line:
           break

        try:
           _, _, time, d, process = line.split()[:5]

           if d.endswith(":"):
              process = d

           process = process[:-1]
           try:
               process_name, _ = process.split("[")[:2]
           except:
               process_name = process
           msg = " ".join(line.split()[5:])

           best = ""
           for prefix in expecteds:
               if process_name.startswith(prefix) and len(best) < len(prefix):
                   best = prefix
    
           if not best:
              continue

           color = color_by_process[best]
           high = bold if any(map(lambda tag: msg.startswith(tag), ["[Emerg]", "[Alert]", "[Crit]", "[Err]", "[Warning]", "[Notice]"])) else ""

           print time, color, process, high, msg, end
        except KeyboardInterrupt:
           raise
        except:
           pass
