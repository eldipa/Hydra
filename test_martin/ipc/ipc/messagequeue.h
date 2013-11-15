#ifndef MESSAGE_QUEUE_H_
#define MESSAGE_QUEUE_H_

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

class MessageQueue {
    private:
        int fd;
        const bool owner;
        Key key;
        std::string path;
        int permissions;

        /* 
         * Destroy the queue, awakening all the process waiting in this queue
         * with an error.
         * 
         * See man msgctl(2)
         * */
        void destroy();

        MessageQueue(const MessageQueue&);
        MessageQueue& operator=(const MessageQueue&);

    public:
        /* 
         * Create or get a message queue.
         * When the parameter 'create' is True, a new queue is created with 'permissions'
         * with the key id generate from 'absolute_path'.
         * In that case, the instance is owner of the resource and will delete it when
         * the instance is destroyed.
         *
         * When the parameter 'create' is False, an existing queue is obtained.
         * In this case, the instance is not the owner.
         *
         * See man msgget(2)
         * */
        MessageQueue(const char *absolute_path, char proj_id, 
              int permissions = 0664, bool create = false);

        MessageQueue(const char *absolute_path, char proj_id, 
                     int permissions, bool create, bool is_owner);

        void push(const void *msg, size_t size_txt);
        ssize_t pull(void *msg, size_t max_size_txt, long type = 0);
        
        ~MessageQueue() throw();

};

#endif
