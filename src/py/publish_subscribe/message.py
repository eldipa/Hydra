import struct
try:
    import ujson as json
except ImportError:
    import json

ByteMax  =  (2**8)-1
ShortMax = (2**16)-1

def pack_introduce_myself_msg(name):
    name_length = len(name)
    
    if not (0 <= name_length <= ByteMax):
        raise Exception()

    raw = name
    return raw

def unpack_introduce_myself_msg(raw):
    return raw  # the name



def pack_publish_msg(topic, obj, dont_pack_object):
    topic_length = len(topic)

    if dont_pack_object:
        obj_raw = obj
    else:
        obj_raw = json.dumps(obj)

    obj_lenth = len(obj_raw)

    if not (0 <= topic_length <= ShortMax) or not (0 <= obj_lenth <= ShortMax):
        raise Exception()

    raw = struct.pack(">H", topic_length) + topic + obj_raw
    return raw

def unpack_publish_msg(raw, dont_unpack_object):
    topic_length, = struct.unpack(">H", raw[:2])
    topic   = raw[2: 2+topic_length]
    obj_raw = raw[2+topic_length:]

    if dont_unpack_object:
        return topic, obj_raw

    else:
        obj = json.loads(obj_raw)
        return topic, obj


def pack_subscribe_unsubscribe_msg(topic):
    topic_length = len(topic)

    if not (0 <= topic_length <= ShortMax):
        raise Exception()

    raw = topic
    return raw

def unpack_subscribe_unsubscribe_msg(raw):
    return raw  # the topic



def pack_message(message_type, *args, **kargs):
    if message_type == 'publish':
        op = 0x1
        message_body = pack_publish_msg(*args, **kargs)

    elif message_type == 'subscribe':
        op = 0x2
        message_body = pack_subscribe_unsubscribe_msg(*args, **kargs)
    
    elif message_type == 'introduce_myself':
        op  = 0x3
        message_body = pack_introduce_myself_msg(*args, **kargs)
    
    elif message_type == 'unsubscribe':
        op = 0x4
        message_body = pack_subscribe_unsubscribe_msg(*args, **kargs)

    else:
        raise Exception()

    message_body_len = len(message_body)
    msg = struct.pack(">BH", op, message_body_len) + message_body

    if len(msg) > ShortMax:
        raise Exception()

    return msg

def unpack_message_header(raw):
    assert len(raw) == 3

    op, message_body_len = struct.unpack(">BH", raw)

    message_type = {
            0x1: "publish",
            0x2: "subscribe",
            0x3: "introduce_myself",
            0x4: "unsubscribe",
            }[op]

    return message_type, message_body_len

def unpack_message_body(message_type, message_body, **kargs):
    if message_type == 'publish':
        return unpack_publish_msg(message_body, **kargs)
    
    elif message_type == 'subscribe':
        return unpack_subscribe_unsubscribe_msg(message_body, **kargs)
    
    elif message_type == 'introduce_myself':
        return unpack_introduce_myself_msg(message_body, **kargs)

    elif message_type == "unsubscribe":
        return unpack_subscribe_unsubscribe_msg(message_body, **kargs)

    else:
        raise Exception()
