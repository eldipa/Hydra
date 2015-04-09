Doctests for Javascript
-----------------------

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

Basic examples
--------------

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

Multiline code is supported too:

:: 

   >>> def g():
   ...   return 3
   >>> g()
   3


::

   js> function g() {
   ...   return 3;
   ... }
   js> g()
   3

An interesting thing is that the Javascript console has a different prompt for each
level of nesting using '...' for the first level, '.....' for the second, '.......' for
the third and so on.
To simplify, we only request '...' for any level and we will handle the count of dots
internaly.

::

   js> function one() {
   ...    function two() {
   ...       function three() {
   ...          return 1;
   ...       }
   ...       return three() + 1;
   ...    }
   ...    return two() + 1;
   ... }
   
   js> one();
   3

Printing to the console is a *side effect* that can be used in the tests but it's not
very elegant (or very documentative)

:: 

   >>> def side_effect():
   ...   print "effect"
   >>> side_effect()
   effect

::

   js> function side_effect() {
   ...   console.log("effect");
   ... }
   js> side_effect()
   effect


Option flags
------------

The *doctest* module support various flags to customize the behaviour of the comparator
used to check each tests. These same flags can be used for both, Python and Javascript tests.

::

   >>> print range(20)     # doctest: +NORMALIZE_WHITESPACE
   [0,   1,  2,  3,  4,  5,  6,  7,  8,  9,
   10,  11, 12, 13, 14, 15, 16, 17, 18, 19]

   >>> print range(20)      # doctest: +ELLIPSIS
   [0, 1, ..., 18, 19]

   >>> print "hello\n\nworld"
   hello
   <BLANKLINE>
   world


::

   js> function range(stop) {       // javascript version of the python's range function (simplified) 
   ...   var a=[0], b=0;
   ...   while(b<stop-1){ b+=1; a.push(b) }
   ...   return a;
   ... }
   js> console.log(range(20))       // doctest: +NORMALIZE_WHITESPACE
   [ 0,   1,  2,  3,  4,  5,  6,  7,  8,  9,
   10,  11, 12, 13, 14, 15, 16, 17, 18, 19 ]

   js> console.log(range(20))       // doctest: +ELLIPSIS
   [ 0, 1, ..., 18, 19 ]

   js> console.log("hello\n\nworld")
   hello
   <BLANKLINE>
   world

We support one additional flag more: PASS to skip the checks. This is different from
SKIP that doesn't run the test. PASS will run the test but will always pass.

::

   >>> 1     # doctest: +PASS
   2

::

   js> 1     // doctest: +PASS
   2


Checking exceptions
-------------------

Errors and exceptions can be checked too (in python is easy, but in javascript is more weird)

::

   >>> raise Exception("Some reason")
   Traceback (most recent call last):
   Exception: Some reason

   >>> f(]        # invalid syntax
   Traceback (most recent call last):
   SyntaxError: invalid syntax

   >>> non_existent_var        
   Traceback (most recent call last):
   NameError: name 'non_existent_var' is not defined

::

   js> throw "Some reason"       // there is no way to distinguish some output from an exception
   Some reason

   js> // this test cannot be reproduced in javascript!
   js> f(]        // doctest: +SKIP 

   // in this case, is a little more easy to know if it is an exception or not
   js> non_existent_var    // doctest: +ELLIPSIS       
   ReferenceError: non_existent_var is not defined
   ...

