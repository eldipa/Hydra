#ifndef SHARED_MEMORY_H_
#define SHARED_MEMORY_H_

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


#include "key.h"
#include <string>

class SharedMemory {
    private:
        int fd;
        const bool owner;
        Key key;
        std::string path;
        int permissions;
        size_t size;

        void *attach_point;

        /* 
         * The memory shared is marked to be destroyed
         * 
         * See man shmctl(2)
         * */
        void mark_to_be_destroyed();

        SharedMemory(const SharedMemory&);
        SharedMemory& operator=(const SharedMemory&);

    protected:
        inline bool is_owner() const throw() {
           return owner;
        }

    public:
        /* 
         * Create or get a shared memory segment of 'size' bytes.
         * When the parameter 'create' is True, a new shared memory is created with 'permissions'
         * with the key id generate from 'absolute_path'.
         * In that case, the instance is owner of the resource and will 
         * 'mark to be deleted it' when the instance is destroyed. (See shmctl(2) )
         *
         * When the parameter 'create' is False, an existing shared memory is obtained.
         * In this case, the instance is not the owner.
         *
         * In both cases, the process is attached in the constructor and deatached 
         * in the destructor.
         *
         * If the parameter 'only_for_read'  is True, only reading operations are
         * allowed. If it is False, writing and reading operations are allowed.
         *
         * See man shmget(2)
         * */
         SharedMemory(const char *absolute_path, char proj_id, size_t size, 
                      int permissions = 0664, bool create = false,
                      bool only_for_read = false);

        /*
         * Pointer access to the shared memory segment
         *
         * */
        inline const void* memory_pointer() const {
           return attach_point;
        }
        
        inline void* memory_pointer() {
           return attach_point;
        }

        virtual ~SharedMemory() throw();
};

#endif
