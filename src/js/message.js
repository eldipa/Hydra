define(function () {
   'use strict';

    var ByteMax  = 0x000000ff;
    var ShortMax = 0x0000ffff;

    function pack_introduce_myself_msg(params) {
        var name = params.name;
        var name_length = name.length;

        if (! (0 <= name_length && name_length <= ByteMax)) {
            throw new Error();
        }

        return new Buffer(name);
    }

    function unpack_introduce_myself_msg(raw_buf) {
        return b.toString();  // the name
    }


    function pack_publish_msg(params) {
        var topic = params.topic;
        var obj   = params.obj;

        var topic_length = topic.length;
        try {
           var obj_raw = JSON.stringify(obj);
        } catch(e) {
            throw new Error("Serialization of the object failed (json stringify): " + e);
        }

        var obj_lenth = obj_raw.length;

        if ((! (0 <= topic_length && topic_length <= ShortMax)) ||
            (! (0 <= obj_lenth && obj_lenth <= ShortMax))) {
                throw new Error();
            }

        var raw = new Buffer(2 + topic_length + obj_lenth);
        raw.writeUInt16BE(topic_length);
        raw.write(topic,   2);
        raw.write(obj_raw, 2 + topic_length);

        return raw;
    }

    function unpack_publish_msg(raw) {
        var topic_length = raw.readUInt16BE();
        var topic   = raw.slice(2, 2+topic_length);
        var obj_raw = raw.slice(2+topic_length);

        try {
            var obj = JSON.parse(obj_raw);
        } catch(e) {
            throw new Error("Deserialization of the object failed (json parse): " + e);
        }

        return {topic: topic.toString(), obj: obj};
    }


    function pack_subscribe_unsubscribe_msg(params) {
        var topic = params.topic;
        var topic_length = topic.length;

        if (! (0 <= topic_length && topic_length <= ShortMax)) {
            throw new Error();
        }
        
        return new Buffer(topic);
    }

    function unpack_subscribe_unsubscribe_msg(raw) {
        return raw.toString(); // the topic
    }


    function pack_message(message_type, params) {
        if (message_type === 'publish') {
            var op = 0x1;
            var message_body = pack_publish_msg(params);
        }
        else if (message_type === 'subscribe') {
            var op = 0x2;
            var message_body = pack_subscribe_unsubscribe_msg(params);
        }
        else if (message_type === 'introduce_myself') {
            var op  = 0x3;
            var message_body = pack_introduce_myself_msg(params);
        }
        else if (message_type === 'unsubscribe') {
            var op = 0x4;
            var message_body = pack_subscribe_unsubscribe_msg(params);
        }
        else {
            throw new Error();
        }

        var message_body_len = message_body.length;

        var msg = new Buffer(1 + 2 + message_body_len);
        msg.writeUInt8(op);
        msg.writeUInt16BE(message_body_len, 1);
        msg.write(message_body.toString(), 1+2);

        if (msg.length > ShortMax) {
            throw new Error();
        }

        return msg;
    }


    function unpack_message_header(raw) {
        if (raw.length !== 3) {
            throw new Error();
        }

        var op = raw.readUInt8();
        var message_body_len = raw.readUInt16BE(1);

        var message_type = {
            0x1: "publish",
            0x2: "subscribe",
            0x3: "introduce_myself",
            0x4: "unsubscribe",
            }[op];

        if (!message_type) {
            throw new Error();
        }

        return {message_type: message_type, message_body_len: message_body_len};
    }


    function unpack_message_body(message_type, message_body) {
        if (message_type === 'publish') {
            return unpack_publish_msg(message_body);
        }
        else if (message_type === 'subscribe') {
            return unpack_subscribe_unsubscribe_msg(message_body);
        }
        else if (message_type === 'introduce_myself') {
            return unpack_introduce_myself_msg(message_body);
        }
        else if (message_type === "unsubscribe") {
            return unpack_subscribe_unsubscribe_msg(message_body);
        }
        else {
            throw new Error();
        }
    }

    return {
        pack_message: pack_message,
        unpack_message_header: unpack_message_header,
        unpack_message_body: unpack_message_body,
    };
});
