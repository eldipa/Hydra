import sys

STATUS_CODE_IDX = -2
DEFAULT_COLOR = "none"

color_by_status_code = {
      "200": "bold-green",
      "304": "bold-green",
      "404": "bold-magenta",
      "500": "bold-red",
      }

DEFAULT_COLOR = "bold-cyan"

def coloring(text, color):
   keys = color.split("-")
   escape_code_by_key = {
         'bold': 1,
         'red': 31,
         'green': 32,
         'yellow': 33,
         'blue': 34,
         'magenta': 35,
         'cyan': 36,
         }

   escape_codes = [str(escape_code_by_key[k]) for k in keys]
   prefix = '\033[%sm' % ";".join(escape_codes)
   posfix = '\033[0m'

   return prefix+text+posfix


line = sys.stdin.readline()
while line:
   tokens = line.split(' ')
   if len(tokens) >= 10:
      status_code = tokens[STATUS_CODE_IDX]
      color = color_by_status_code.get(status_code, DEFAULT_COLOR)

      status_code_colored = coloring(status_code, color)
      reassembled_line = " ".join(tokens[:STATUS_CODE_IDX] + [status_code_colored] + tokens[STATUS_CODE_IDX+1:])
   else:
      reassembled_line = line

   sys.stdout.write(reassembled_line)
   sys.stdout.flush()

   line = sys.stdin.readline()
