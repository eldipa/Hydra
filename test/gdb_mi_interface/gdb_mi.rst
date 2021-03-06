The output of the GDB Machine Interface is compound of small elements
The most basic are the c-strings. As all the objects that can be found in
gdb_mi, the c-string objects support parse a raw string and transform it
into a python-native object.

::
   
   >>> from gdb.gdb_mi import *
   >>> 
   >>> s = CString()
   >>> s.parse('"fooo"', 0)
   6
   >>> s.as_native()
   'fooo'
   >>> s
   'fooo'

The *parse* method take two arguments, the full raw string and the offset where
to start read from it and parse it.
The result of this method is the updated offset.
After the correct parsing, the as_native method will return the simple python objects
representing the data parsed.

In the case of the c-string, the returned native object is, of course, a string.

Note that the c-string expect as a valid input a string like in C, starting with double
quote.

Any incorrect input will raise an exception

::
   
   >>> s.parse('xxx', 0)                                 #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: Wrong begin. Expected a double quote '"'...
   
   >>> s.parse('"f...', 0)                               #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: End of input found without close the c-string. Expecting a '"'...

The c-string support any valid string with the correct escape sequences

::
   
   >>> s.parse('""', 0)
   2
   >>> s.as_native()
   ''

   >>> s.parse(r'"\n"', 0)
   4
   >>> s.as_native()
   '\n'

   >>> s.parse(r'"\\\n"', 0)
   6
   >>> s.as_native()
   '\\\n'

   >>> s.parse(r'"\ \n"', 0)
   6
   >>> s.as_native()
   '\\ \n'

With the c-string implemented, more complex objects can be built like lists or tuples (dicts)

::

   >>> l = List()
   >>> l.parse(r'[]', 0)
   2
   >>> l.as_native()
   []
   >>> l
   []

   >>> l.parse(r'["a"]', 0)
   5
   >>> l.as_native()
   ['a']
   >>> l
   ['a']

   >>> l.parse(r'["a","b"]', 0)
   9
   >>> l.as_native()
   ['a', 'b']
   >>> l
   ['a', 'b']

::
   
   >>> t = Tuple()
   >>> t.parse(r'{}', 0)
   2
   >>> t.as_native()
   {}
   >>> t
   {}

   >>> t.parse(r'{a="b"}', 0)
   7
   >>> t.as_native()
   {'a': 'b'}
   >>> t
   {'a': 'b'}

   >>> t.parse(r'{a=[]}', 0)
   6
   >>> t.as_native()
   {'a': []}

   >>> t.parse(r'{a=["a","b"]}', 0)
   13
   >>> t.as_native()
   {'a': ['a', 'b']}

   >>> t.parse(r'{a={b="c"}}', 0)
   11
   >>> t.as_native()
   {'a': {'b': 'c'}}
   >>> t
   {'a': {'b': 'c'}}

   >>> t.parse(r'{a="b",c="d"}', 0)
   13
   >>> sorted(t.as_native().iteritems()) # we 'sort' the dictionary to make easy the testing
   [('a', 'b'), ('c', 'd')]
   >>> t
   {'a': 'b', 'c': 'd'}


The ugly part of the tuples are the possibility of repeated keys.
In that case, the set of values with the same key are merged into a single entry 
in the dictionary and its value will be the list of the original values.

::

   >>> t = Tuple()
   >>> t.parse(r'{a="b",a="d"}', 0)
   13
   >>> t.as_native()
   {'a': ['b', 'd']}
   >>> t
   {'a': ['b', 'd']}

Of course, wrong inputs are caught

::

   >>> l = List()

   >>> l.parse(r'["x"', 0)                               #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: End of input found without close the list. Expecting a ']'...

   >>> l.parse(r'"xxx"]', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: Wrong begin. Expected a '['...
   
::

   >>> t = Tuple()

   >>> t.parse(r'{x', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: Token '=' not found...

   >>> t.parse(r'{x=', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: End of input...

   >>> t.parse(r'{x=}', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   UnexpectedToken: Unexpected token '}'...

   >>> t.parse(r'{=xx}', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   UnexpectedToken: Unexpected token 'x'...

   >>> t.parse(r'{xx}', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: Token '=' not found...

   >>> t.parse(r'xx}', 0)                             #doctest: +ELLIPSIS
   Traceback (most recent call last):
   ParsingError: Wrong begin. Expected a '{'...

At the top most of the construction, the structured messages returned by GDB are 
AsyncRecords and ResultRecord.
Both are a named list (possibly empty) of key-value pairs where each value 
can be a c-string, a list or a tuple, ending the list with a newline.

::

   >>> r = AsyncRecord()
   >>> r.parse('*foo\n', 0)
   4
   >>> record = r.as_native()
   >>> record.klass, record.type, record.results
   ('foo', 'Exec', {})
   >>> record
   {'klass': 'foo', 'results': {}, 'token': None, 'type': 'Exec'}

   >>> r.parse('+bar,a="b"\n', 0)
   10
   >>> record = r.as_native()
   >>> record.klass, record.type, record.results
   ('bar', 'Status', {'a': 'b'})
   >>> record
   {'klass': 'bar', 'results': {'a': 'b'}, 'token': None, 'type': 'Status'}

   >>> r.parse('=baz,a=[],b={c="d"}\n', 0)
   19
   >>> record = r.as_native()
   >>> record.klass, record.type, record.results
   ('baz', 'Notify', {'a': [], 'b': {'c': 'd'}})
   >>> record                          #doctest: +NORMALIZE_WHITESPACE
   {'klass': 'baz', 
    'results': {'a': [], 'b': {'c': 'd'}}, 
    'token': None, 
    'type': 'Notify'}
   
::

   >>> r = ResultRecord()
   >>> r.parse('^bar,a="b"\n', 0)
   10
   >>> record = r.as_native()
   >>> record.klass, record.type, record.results
   ('bar', 'Sync', {'a': 'b'})
   >>> record
   {'klass': 'bar', 'results': {'a': 'b'}, 'token': None, 'type': 'Sync'}

The other top level construction are the Stream. These are unstructured c-strings.

::

   >>> s = StreamRecord()
   >>> s.parse('~"foo"\n', 0)
   6
   >>> stream = s.as_native()
   >>> stream.type, stream.stream
   ('Console', 'foo')
   >>> stream
   {'stream': 'foo', 'type': 'Console'}

   >>> s.parse('@"bar"\n', 0)
   6
   >>> stream = s.as_native()
   >>> stream.type, stream.stream
   ('Target', 'bar')
   >>> stream
   {'stream': 'bar', 'type': 'Target'}

   >>> s.parse('&"baz"\n', 0)
   6
   >>> stream = s.as_native()
   >>> stream.type, stream.stream
   ('Log', 'baz')
   >>> stream
   {'stream': 'baz', 'type': 'Log'}

Finally, the messages returned by GDB are a sequence (may be empty) of asynchronous 
messages and streams, followed by an optional result record. Then, the special token
'(gdb)' should be found, followed by a newline.

Instead of delivery these big messages one by one, the Output parser will deliver
each asynchronous message / stream / result separately.

::

   >>> o = Output()
   
   >>> text = '(gdb) \n'  #the extra space is not specified in GDB's docs but it's necessary
   >>> o.parse_line(text)
   '(gdb)'

   >>> text = '~"foo"\n'
   >>> stream = o.parse_line(text)
   >>> stream.type, stream.stream
   ('Console', 'foo')
   >>> stream
   {'stream': 'foo', 'type': 'Console'}



As an example, this is the message after setting a breakpoint

Workaround: handle the GDB's bug https://sourceware.org/bugzilla/show_bug.cgi?id=14733
We change the bkpt= by bkpts=, from a tuple/dict to a list of them.

::

   >>> o = Output()

   >>> text = '^done,bkpt={number="1",type="breakpoint",disp="keep",enabled="y",addr="0x08048564",func="main",file="myprog.c",fullname="/home/nickrob/myprog.c",line="68",thread-groups=["i1"],times="0"}\n'
   >>> record = o.parse_line(text)
   >>> record.klass, record.type
   ('done', 'Sync')
   >>> len(record.results)
   1
   >>> record.results['bkpts'][0]             #doctest: +NORMALIZE_WHITESPACE
   {'addr': '0x08048564',
   'disp': 'keep',
   'enabled': 'y',
   'file': 'myprog.c',
   'fullname': '/home/nickrob/myprog.c',
   'func': 'main',
   'line': '68',
   'number': '1',
   'thread-groups': ['i1'],
   'times': '0',
   'type': 'breakpoint'}
   >>> record                          #doctest: +NORMALIZE_WHITESPACE
   {'klass': 'done',
    'results': {'bkpts': [{'addr': '0x08048564',
                           'disp': 'keep',
                           'enabled': 'y',
                           'file': 'myprog.c',
                           'fullname': '/home/nickrob/myprog.c',
                           'func': 'main',
                           'line': '68',
                           'number': '1',
                           'thread-groups': ['i1'],
                           'times': '0',
                           'type': 'breakpoint'}]},
    'token': None,
    'type': 'Sync'}


Or, when a execution is stopped

::

   >>> o = Output()

   >>> text = '*stopped,reason="breakpoint-hit",disp="keep",bkptno="1",thread-id="0",frame={addr="0x08048564",func="main",args=[{name="argc",value="1"},{name="argv",value="0xbfc4d4d4"}],file="myprog.c",fullname="/home/nickrob/myprog.c",line="68"}\n'
   >>> record = o.parse_line(text)
   >>> record.klass, record.type
   ('stopped', 'Exec')
   >>> len(record.results)
   5
   >>> record.results['reason'], record.results['disp'], record.results['bkptno'], record.results['thread-id']
   ('breakpoint-hit', 'keep', '1', '0')
   >>> record                         #doctest: +NORMALIZE_WHITESPACE
   {'klass': 'stopped',
   'results': {'bkptno': '1',
               'disp': 'keep',
               'frame': {'addr': '0x08048564',
                         'args': [{'name': 'argc', 'value': '1'},
                                  {'name': 'argv', 'value': '0xbfc4d4d4'}],
                         'file': 'myprog.c',
                         'fullname': '/home/nickrob/myprog.c',
                         'func': 'main',
                         'line': '68'},
               'reason': 'breakpoint-hit',
               'thread-id': '0'},
   'token': None,
   'type': 'Exec'}

   >>> frame = record.results['frame']
   >>> frame['addr'], frame['func'], frame['file'], frame['fullname'], frame['line']
   ('0x08048564', 'main', 'myprog.c', '/home/nickrob/myprog.c', '68')

   >>> main_args = frame['args']
   >>> main_args[0]['name'], main_args[0]['value']
   ('argc', '1')
   >>> main_args[1]['name'], main_args[1]['value']
   ('argv', '0xbfc4d4d4')


Workaround: handle the GDB's bug https://sourceware.org/bugzilla/show_bug.cgi?id=14733
We change the bkpt= by bkpts=, from a tuple/dict to a list of them. In order to keep consistent names,
we change the event's name breakpoint-modified to breakpoints-modified

::
   >>> text = '=breakpoint-modified,bkpt={number="1",type="breakpoint",disp="keep",enabled="y",addr="<MULTIPLE>",times="1",original-location="roll"},{number="1.1",enabled="y",addr="0x08048563",func="roll",file="two_pthreads.c",fullname="/threads/two_pthreads.c",line="5",thread-groups=["i1"]},{number="1.2",enabled="y",addr="0x08048563",func="roll",file="two_pthreads.c",fullname="/threads/two_pthreads.c",line="5",thread-groups=["i2"]}\n'

   >>> record = o.parse_line(text)
   >>> record.klass, record.type
   ('breakpoints-modified', 'Notify')

   >>> record
   {'klass': 'breakpoints-modified',
    'results': {'bkpts': [{'addr': '<MULTIPLE>',
                           'disp': 'keep',
                           'enabled': 'y',
                           'number': '1',
                           'original-location': 'roll',
                           'times': '1',
                           'type': 'breakpoint'},
                          {'addr': '0x08048563',
                           'enabled': 'y',
                           'file': 'two_pthreads.c',
                           'fullname': '/threads/two_pthreads.c',
                           'func': 'roll',
                           'line': '5',
                           'number': '1.1',
                           'thread-groups': ['i1']},
                          {'addr': '0x08048563',
                           'enabled': 'y',
                           'file': 'two_pthreads.c',
                           'fullname': '/threads/two_pthreads.c',
                           'func': 'roll',
                           'line': '5',
                           'number': '1.2',
                           'thread-groups': ['i2']}]},
    'token': None,
    'type': 'Notify'}


Due the same bug, we need to modify the event BreakpointTable which lists the breakpoints and if some of them are in
the same address, this will trigger the same bug.
Here is the fix:

::

   >>> text = '^done,BreakpointTable={nr_rows="3",nr_cols="6",hdr=[{width="7",alignment="-1",col_name="number",colhdr="Num"},{width="14",alignment="-1",col_name="type",colhdr="Type"},{width="4",alignment="-1",col_name="disp",colhdr="Disp"},{width="3",alignment="-1",col_name="enabled",colhdr="Enb"},{width="18",alignment="-1",col_name="addr",colhdr="Address"},{width="40",alignment="2",col_name="what",colhdr="What"}],body=[bkpt={number="1",type="breakpoint",disp="keep",enabled="y",addr="<MULTIPLE>",times="0",original-location="roll"},{number="1.1",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i1"]},{number="1.2",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i2"]},bkpt={number="2",type="breakpoint",disp="keep",enabled="y",addr="<MULTIPLE>",times="0",original-location="roll"},{number="2.1",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i1"]},{number="2.2",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i2"]},bkpt={number="3",type="breakpoint",disp="keep",enabled="y",addr="<MULTIPLE>",times="0",original-location="roll"},{number="3.1",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i1"]},{number="3.2",enabled="y",addr="0x00000000004006a9",func="roll",file="three_pthreads.c",fullname="/threads/three_pthreads.c",line="5",thread-groups=["i2"]}]}\n'
   
   >>> record = o.parse_line(text)
   >>> record
   {'klass': 'done',
    'results': {'BreakpointTable': {'body': [{'addr': '<MULTIPLE>',
                                              'disp': 'keep',
                                              'enabled': 'y',
                                              'number': '1',
                                              'original-location': 'roll',
                                              'times': '0',
                                              'type': 'breakpoint'},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '1.1',
                                              'thread-groups': ['i1']},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '1.2',
                                              'thread-groups': ['i2']},
                                             {'addr': '<MULTIPLE>',
                                              'disp': 'keep',
                                              'enabled': 'y',
                                              'number': '2',
                                              'original-location': 'roll',
                                              'times': '0',
                                              'type': 'breakpoint'},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '2.1',
                                              'thread-groups': ['i1']},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '2.2',
                                              'thread-groups': ['i2']},
                                             {'addr': '<MULTIPLE>',
                                              'disp': 'keep',
                                              'enabled': 'y',
                                              'number': '3',
                                              'original-location': 'roll',
                                              'times': '0',
                                              'type': 'breakpoint'},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '3.1',
                                              'thread-groups': ['i1']},
                                             {'addr': '0x00000000004006a9',
                                              'enabled': 'y',
                                              'file': 'three_pthreads.c',
                                              'fullname': '/threads/three_pthreads.c',
                                              'func': 'roll',
                                              'line': '5',
                                              'number': '3.2',
                                              'thread-groups': ['i2']}],
                                    'hdr': [{'alignment': '-1',
                                             'col_name': 'number',
                                             'colhdr': 'Num',
                                             'width': '7'},
                                            {'alignment': '-1',
                                             'col_name': 'type',
                                             'colhdr': 'Type',
                                             'width': '14'},
                                            {'alignment': '-1',
                                             'col_name': 'disp',
                                             'colhdr': 'Disp',
                                             'width': '4'},
                                            {'alignment': '-1',
                                             'col_name': 'enabled',
                                             'colhdr': 'Enb',
                                             'width': '3'},
                                            {'alignment': '-1',
                                             'col_name': 'addr',
                                             'colhdr': 'Address',
                                             'width': '18'},
                                            {'alignment': '2',
                                             'col_name': 'what',
                                             'colhdr': 'What',
                                             'width': '40'}],
                                    'nr_cols': '6',
                                    'nr_rows': '3'}},
    'token': None,
    'type': 'Sync'}

