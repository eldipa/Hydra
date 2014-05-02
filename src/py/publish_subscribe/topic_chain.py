def build_topic_chain(topic):
   ''' We build the topic chain:
         if the event's topic is empty, the chain is ['']
         if the event's topic was A, the chain is ['', A]
         if the event's topic was A.B, the chain is ['', A, B]
         and so on

       Then, the chain is reversed, so instead ['', A, B] you get [B, A, ''].
       With this, the more specific topic come first.
       '''

   subtopics = topic.split(".")
   topic_chain = [""] # the empty topic
   for i in range(len(subtopics)):
      topic_chain.append('.'.join(subtopics[:i+1]))

   topic_chain.reverse()

   return topic_chain

