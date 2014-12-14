
def esc(*args):
   '''Return a tuple with its string escaped:
        - if one element is a str object, escape it using 'encode: string_escape'
        - if it is a unicode, use 'encode: unicode_escape'
        - else, don't do anything.
   '''
   escaped = []
   for arg in args:
      if isinstance(arg, str):
         escaped.append(arg.encode('string_escape'))
      elif isinstance(arg, unicode):
         escaped.append(arg.encode('unicode_escape'))
      else:
         escaped.append(arg)

   return tuple(escaped)
