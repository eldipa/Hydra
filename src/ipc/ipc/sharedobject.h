#ifndef SHARED_OBJECT_H_
#define SHARED_OBJECT_H_

/*************************************************************************
 *                                                                       *
 *                        This work is licensed under a                  *
 *   CC BY-SA        Creative Commons Attribution-ShareAlike             *
 *                           3.0 Unported License.                       *
 *                                                                       * 
 *  Author: Di Paola Martin Pablo, 2012                                  *
 *                                                                       *
 *************************************************************************/

/*******************************************************************************
 *                                                                             *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS        *
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT          *
 *  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A    *
 *  PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER  *
 *  OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,   *
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,        *
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR         *
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF     *
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING       *
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS         *
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.               *
 *                                                                             *
 *******************************************************************************/


#include "sharedmemory.h"

template<class T>
class SharedObject : private SharedMemory {
   private:
      T* object;

      SharedObject(const SharedObject&);
      SharedObject& operator=(const SharedObject&);

   public:
      /*
       * Create or get an object of type T allocated in the shared memory
       * which key id was generated from 'absolute_path' and with 'permissions'.
       *
       * The object will be only for reading operation if 'only_for_read' is true,
       * else read and write are allowed.
       *
       * For the first constructor, if 'create' is true, a new shared memory will
       * be created and then, a new object of type T is instantiated.
       * If it is false, the memory is obtained and then the object is interpreted
       * from the raw memory.
       *    
       *    - In this case, T must have a constructor by default
       *
       *
       * For the second constructor, the shared memory and the object are allways
       * created.
       * This can be used to put in the shared memory a copy of 'val'.
       *
       *    - In this case, T must have a copy constructor
       *
       *
       * When the SharedObject is destroyed, the destructor of the object is 
       * called and then the memory is deallocated if:
       *    - the constructor used was the first and 'create' was true
       *    - or the constructor used was the second.
       *
       * Note:
       *    The type T must not have any pointer that point at other memory space.
       *    T can reserve and free any amount of memory of a process but this memory
       *    and its address cannot be shared.
       *
       *    As an alternative, you can reserve extra memory using arrays like:
       *    
       *    struct Buffer {         // An idiom to reserve an array of objects.
       *       Element buff[10];
       *    };
       *
       *    ...
       *
       *    SharedObject<Buffer> buffer;
       *    (*buffer)[2];           // Access to the third element
       * */
       SharedObject(const char *absolute_path, char proj_id, int permissions = 0664, 
            bool create = false, bool only_for_read = false) : 
            SharedMemory(absolute_path, proj_id, sizeof(T), permissions, create, only_for_read) {
            if(is_owner()) {
               object = new(this->memory_pointer()) T();
            }
            else {
               object = reinterpret_cast<T*>(this->memory_pointer());
            }
         }

       SharedObject(const T& val, const char *absolute_path, char proj_id, int permissions = 0664, 
                    bool only_for_read = false) : 
          SharedMemory(absolute_path, proj_id, sizeof(T), permissions, true, only_for_read) {
          object = new(this->memory_pointer()) T(val);
         }

      /*
       * Pointer interface to access the shared object.
       * Overloaded the operators -> and *
       *
       * */
      inline T* operator->() {
         return object;
      }

      inline const T* operator->() const {
         return object;
      }
      
      inline T& operator*() {
         return *object;
      }

      inline const T& operator*() const {
         return *object;
      }

      virtual ~SharedObject() throw() {
         if(is_owner()) {
            object->~T();
         }
      }
};
#endif
