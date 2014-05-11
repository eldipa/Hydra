The *doctest* module that can be found in the standard library of Python searches
for pieces of texts that look like interactive Python sessions and then execute them, 
checking the result obtained with the expected.

The *doctestpyjs* module extends the *doctest* module to search interactive Javascript sessions.

This is an example of an interactive Python session:

::

   >>> print "Hello world!"
   Hello world!

For Javascript:

::

   js> console.log("Hello world!")
   Hello world!

Both kind of sessions can be mixed in the same file and are executed in the same order

::

   >>> "a string"
   'a string'

   >>> 1
   1

   >>> f = lambda: 2
   >>> f()
   2

::

   js> "a string"
   'a string'

   js> 1
   1

   js> function f() { return 2; }
   js> f()
   2

