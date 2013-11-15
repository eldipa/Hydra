%module ipc
%include "typemaps.i"
%include "std_string.i"

%{
#include "messagequeue.h"
#include <string>
#include <vector>

#include "../os/oserror.h"
#include "../common/valueerror.h"
#include "../common/notimplementederror.h"
%}

%feature("autodoc", "0");

%exception {
  try {
    $action
  } catch(const OSError &e) {
    PyErr_SetString(PyExc_OSError, const_cast<char*>(e.what()));
    return NULL;
  } catch(const ValueError &e) {
    PyErr_SetString(PyExc_ValueError, const_cast<char*>(e.what()));
    return NULL;
  } catch(const NotImplementedError &e) {
    PyErr_SetString(PyExc_NotImplementedError, const_cast<char*>(e.what()));
    return NULL;
  } catch(const std::exception &e) {
    PyErr_SetString(PyExc_Exception, const_cast<char*>(e.what()));
    return NULL;
  } catch(...) {
    PyErr_SetString(PyExc_Exception, "Unknow internal error.");
    return NULL;
  }
}

class MessageQueue {
    public:
        MessageQueue(const char *absolute_path, char proj_id, 
              int permissions = 0664, bool create = false);

        ~MessageQueue() throw();
};

%extend MessageQueue {
   void push(const std::string &msg) {
      $self->push(msg.data(), msg.size());
   }
   std::string pull(long type = 0) {
      std::vector<char> v;
      v.reserve(8192);
      ssize_t s = $self->pull(&v[0], 8192, type);
      
      return std::string(&v[0], s);
   }
};
