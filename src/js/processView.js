define([ 'jquery', 'layout', 'shortcuts', 'event_handler', 'd3' ], function($, layout, shortcuts, event_handler, d3) {

    function ProcessView() {
        this.super("Process View");

        this._$container = $('<div style="width: 100%; height: 100%;"> </div>');

        this._$out_of_dom = this._$container;

        this.EH = event_handler.get_global_event_handler();
        
        var my_self = this;
        
        
        
//        var sys = require('sys')
//        var exec = require('child_process').exec;
//        var child;
//        child = exec("ps -e --forest | awk '{printf $1 " "; for (i=4; i<NF; i++) printf $i " "; print $NF}'", function (error, stdout, stderr) {
//        	console.log('stdout: ' + stdout);
//        	if (error !== null) {
//        		console.log('exec error: ' + error);
//        	}
//        });
        
        

        var mis = '{"nodes": [{"group": 10, "name": "0"}, {"group": 1, "name": "1"}, {"group": 1, "name": "2"}, {"group": 1, "name": "3"}, {"group": 1, "name": "4"}, {"group": 1, "name": "5"}, {"group": 1, "name": "6"}, {"group": 1, "name": "7"}, {"group": 1, "name": "8"}, {"group": 1, "name": "9"}, {"group": 1, "name": "10"}, {"group": 1, "name": "11"}, {"group": 1, "name": "12"}, {"group": 1, "name": "13"}, {"group": 1, "name": "14"}, {"group": 1, "name": "15"}, {"group": 1, "name": "16"}, {"group": 1, "name": "17"}, {"group": 1, "name": "18"}, {"group": 1, "name": "19"}, {"group": 1, "name": "20"}, {"group": 1, "name": "21"}, {"group": 1, "name": "22"}, {"group": 1, "name": "23"}, {"group": 1, "name": "24"}, {"group": 1, "name": "25"}, {"group": 1, "name": "26"}, {"group": 1, "name": "27"}, {"group": 1, "name": "28"}, {"group": 1, "name": "29"}, {"group": 1, "name": "30"}, {"group": 1, "name": "31"}, {"group": 1, "name": "32"}, {"group": 1, "name": "33"}, {"group": 1, "name": "34"}, {"group": 1, "name": "35"}, {"group": 1, "name": "36"}, {"group": 1, "name": "37"}, {"group": 1, "name": "38"}, {"group": 1, "name": "39"}, {"group": 1, "name": "40"}, {"group": 1, "name": "41"}, {"group": 1, "name": "42"}, {"group": 1, "name": "43"}, {"group": 1, "name": "44"}, {"group": 1, "name": "45"}, {"group": 1, "name": "46"}, {"group": 1, "name": "47"}, {"group": 1, "name": "48"}, {"group": 1, "name": "49"}, {"group": 1, "name": "50"}, {"group": 1, "name": "51"}, {"group": 1, "name": "52"}, {"group": 1, "name": "53"}, {"group": 1, "name": "54"}, {"group": 1, "name": "55"}, {"group": 1, "name": "56"}, {"group": 1, "name": "57"}, {"group": 1, "name": "58"}, {"group": 1, "name": "59"}, {"group": 1, "name": "60"}, {"group": 1, "name": "61"}, {"group": 1, "name": "62"}, {"group": 1, "name": "63"}, {"group": 1, "name": "64"}, {"group": 1, "name": "65"}, {"group": 1, "name": "66"}, {"group": 1, "name": "67"}, {"group": 1, "name": "68"}, {"group": 1, "name": "69"}, {"group": 1, "name": "70"}, {"group": 1, "name": "71"}, {"group": 1, "name": "72"}, {"group": 1, "name": "73"}, {"group": 1, "name": "74"}, {"group": 1, "name": "75"}, {"group": 1, "name": "76"}, {"group": 1, "name": "77"}, {"group": 1, "name": "78"}, {"group": 1, "name": "79"}, {"group": 1, "name": "80"}, {"group": 1, "name": "81"}, {"group": 1, "name": "82"}, {"group": 1, "name": "83"}, {"group": 1, "name": "84"}, {"group": 1, "name": "85"}, {"group": 1, "name": "86"}, {"group": 1, "name": "87"}, {"group": 1, "name": "88"}, {"group": 1, "name": "89"}, {"group": 1, "name": "90"}, {"group": 1, "name": "91"}, {"group": 1, "name": "92"}, {"group": 1, "name": "93"}, {"group": 1, "name": "94"}, {"group": 1, "name": "95"}, {"group": 1, "name": "96"}, {"group": 1, "name": "97"}, {"group": 1, "name": "98"}, {"group": 1, "name": "99"}, {"group": 1, "name": "100"},' + 
                             '{"group": 10, "name": "101"}, {"group": 1, "name": "102"}, {"group": 1, "name": "103"}, {"group": 1, "name": "104"}, {"group": 1, "name": "105"}, {"group": 1, "name": "106"}, {"group": 1, "name": "107"}, {"group": 1, "name": "108"}, {"group": 1, "name": "109"}, {"group": 1, "name": "110"}, {"group": 1, "name": "111"}, {"group": 1, "name": "112"}, {"group": 1, "name": "113"}, {"group": 1, "name": "114"}, {"group": 1, "name": "115"}, {"group": 1, "name": "116"}, {"group": 1, "name": "117"}, {"group": 1, "name": "118"}, {"group": 1, "name": "119"}, {"group": 1, "name": "120"}, {"group": 1, "name": "121"}, {"group": 1, "name": "122"}, {"group": 1, "name": "123"}, {"group": 1, "name": "124"}, {"group": 1, "name": "125"}, {"group": 1, "name": "126"}, {"group": 1, "name": "127"}, {"group": 1, "name": "128"}, {"group": 1, "name": "129"}, {"group": 1, "name": "130"}, {"group": 1, "name": "131"}, {"group": 1, "name": "132"}, {"group": 1, "name": "133"}, {"group": 1, "name": "134"}, {"group": 1, "name": "135"}, {"group": 1, "name": "136"}, {"group": 1, "name": "137"}, {"group": 1, "name": "138"}, {"group": 1, "name": "139"}, {"group": 1, "name": "140"}, {"group": 1, "name": "141"}, {"group": 1, "name": "142"}, {"group": 1, "name": "143"}, {"group": 1, "name": "144"}, {"group": 1, "name": "145"}, {"group": 1, "name": "146"}, {"group": 1, "name": "147"}, {"group": 1, "name": "148"}, {"group": 1, "name": "149"}, {"group": 1, "name": "150"}, {"group": 1, "name": "151"}, {"group": 1, "name": "152"}, {"group": 1, "name": "153"}, {"group": 1, "name": "154"}, {"group": 1, "name": "155"}, {"group": 1, "name": "156"}, {"group": 1, "name": "157"}, {"group": 1, "name": "158"}, {"group": 1, "name": "159"}, {"group": 1, "name": "160"}, {"group": 1, "name": "161"}, {"group": 1, "name": "162"}, {"group": 1, "name": "163"}, {"group": 1, "name": "164"}, {"group": 1, "name": "165"}, {"group": 1, "name": "166"}, {"group": 1, "name": "167"}, {"group": 1, "name": "168"}, {"group": 1, "name": "169"}, {"group": 1, "name": "170"}, {"group": 1, "name": "171"}, {"group": 1, "name": "172"}, {"group": 1, "name": "173"}, {"group": 1, "name": "174"}, {"group": 1, "name": "175"}, {"group": 1, "name": "176"}, {"group": 1, "name": "177"}, {"group": 1, "name": "178"}, {"group": 1, "name": "179"}, {"group": 1, "name": "180"}, {"group": 1, "name": "181"}, {"group": 1, "name": "182"}, {"group": 1, "name": "183"}, {"group": 1, "name": "184"}, {"group": 1, "name": "185"}, {"group": 1, "name": "186"}, {"group": 1, "name": "187"}, {"group": 1, "name": "188"}, {"group": 1, "name": "189"}, {"group": 1, "name": "190"}, {"group": 1, "name": "191"}, {"group": 1, "name": "192"}, {"group": 1, "name": "193"}, {"group": 1, "name": "194"}, {"group": 1, "name": "195"}, {"group": 1, "name": "196"}, {"group": 1, "name": "197"}, {"group": 1, "name": "198"}, {"group": 1, "name": "199"}, {"group": 1, "name": "200"},'+ 
                             '{"group": 10, "name": "201"}, {"group": 1, "name": "202"}, {"group": 1, "name": "203"}, {"group": 1, "name": "204"}, {"group": 1, "name": "205"}, {"group": 1, "name": "206"}, {"group": 1, "name": "207"}, {"group": 1, "name": "208"}, {"group": 1, "name": "209"}, {"group": 1, "name": "210"}, {"group": 1, "name": "211"}, {"group": 1, "name": "212"}, {"group": 1, "name": "213"}, {"group": 1, "name": "214"}, {"group": 1, "name": "215"}, {"group": 1, "name": "216"}, {"group": 1, "name": "217"}, {"group": 1, "name": "218"}, {"group": 1, "name": "219"}, {"group": 1, "name": "220"}, {"group": 1, "name": "221"}, {"group": 1, "name": "222"}, {"group": 1, "name": "223"}, {"group": 1, "name": "224"}, {"group": 1, "name": "225"}, {"group": 1, "name": "226"}, {"group": 1, "name": "227"}, {"group": 1, "name": "228"}, {"group": 1, "name": "229"}, {"group": 1, "name": "230"}, {"group": 1, "name": "231"}, {"group": 1, "name": "232"}, {"group": 1, "name": "233"}, {"group": 1, "name": "234"}, {"group": 1, "name": "235"}, {"group": 1, "name": "236"}, {"group": 1, "name": "237"}, {"group": 1, "name": "238"}, {"group": 1, "name": "239"}, {"group": 1, "name": "240"}, {"group": 1, "name": "241"}, {"group": 1, "name": "242"}, {"group": 1, "name": "243"}, {"group": 1, "name": "244"}, {"group": 1, "name": "245"}, {"group": 1, "name": "246"}, {"group": 1, "name": "247"}, {"group": 1, "name": "248"}, {"group": 1, "name": "249"}, {"group": 1, "name": "250"}, {"group": 1, "name": "251"}, {"group": 1, "name": "252"}, {"group": 1, "name": "253"}, {"group": 1, "name": "254"}, {"group": 1, "name": "255"}, {"group": 1, "name": "256"}, {"group": 1, "name": "257"}, {"group": 1, "name": "258"}, {"group": 1, "name": "259"}, {"group": 1, "name": "260"}, {"group": 1, "name": "261"}, {"group": 1, "name": "262"}, {"group": 1, "name": "263"}, {"group": 1, "name": "264"}, {"group": 1, "name": "265"}, {"group": 1, "name": "266"}, {"group": 1, "name": "267"}, {"group": 1, "name": "268"}, {"group": 1, "name": "269"}, {"group": 1, "name": "270"}, {"group": 1, "name": "271"}, {"group": 1, "name": "272"}, {"group": 1, "name": "273"}, {"group": 1, "name": "274"}, {"group": 1, "name": "275"}, {"group": 1, "name": "276"}, {"group": 1, "name": "277"}, {"group": 1, "name": "278"}, {"group": 1, "name": "279"}, {"group": 1, "name": "280"}, {"group": 1, "name": "281"}, {"group": 1, "name": "282"}, {"group": 1, "name": "283"}, {"group": 1, "name": "284"}, {"group": 1, "name": "285"}, {"group": 1, "name": "286"}, {"group": 1, "name": "287"}, {"group": 1, "name": "288"}, {"group": 1, "name": "289"}, {"group": 1, "name": "290"}, {"group": 1, "name": "291"}, {"group": 1, "name": "292"}, {"group": 1, "name": "293"}, {"group": 1, "name": "294"}, {"group": 1, "name": "295"}, {"group": 1, "name": "296"}, {"group": 1, "name": "297"}, {"group": 1, "name": "298"}, {"group": 1, "name": "299"}, {"group": 1, "name": "300"},'+ 
                             '{"group": 10, "name": "301"}, {"group": 1, "name": "302"}, {"group": 1, "name": "303"}, {"group": 1, "name": "304"}, {"group": 1, "name": "305"}, {"group": 1, "name": "306"}, {"group": 1, "name": "307"}, {"group": 1, "name": "308"}, {"group": 1, "name": "309"}, {"group": 1, "name": "310"}, {"group": 1, "name": "311"}, {"group": 1, "name": "312"}, {"group": 1, "name": "313"}, {"group": 1, "name": "314"}, {"group": 1, "name": "315"}, {"group": 1, "name": "316"}, {"group": 1, "name": "317"}, {"group": 1, "name": "318"}, {"group": 1, "name": "319"}, {"group": 1, "name": "320"}, {"group": 1, "name": "321"}, {"group": 1, "name": "322"}, {"group": 1, "name": "323"}, {"group": 1, "name": "324"}, {"group": 1, "name": "325"}, {"group": 1, "name": "326"}, {"group": 1, "name": "327"}, {"group": 1, "name": "328"}, {"group": 1, "name": "329"}, {"group": 1, "name": "330"}, {"group": 1, "name": "331"}, {"group": 1, "name": "332"}, {"group": 1, "name": "333"}, {"group": 1, "name": "334"}, {"group": 1, "name": "335"}, {"group": 1, "name": "336"}, {"group": 1, "name": "337"}, {"group": 1, "name": "338"}, {"group": 1, "name": "339"}, {"group": 1, "name": "340"}, {"group": 1, "name": "341"}, {"group": 1, "name": "342"}, {"group": 1, "name": "343"}, {"group": 1, "name": "344"}, {"group": 1, "name": "345"}, {"group": 1, "name": "346"}, {"group": 1, "name": "347"}, {"group": 1, "name": "348"}, {"group": 1, "name": "349"}, {"group": 1, "name": "350"}, {"group": 1, "name": "351"}, {"group": 1, "name": "352"}, {"group": 1, "name": "353"}, {"group": 1, "name": "354"}, {"group": 1, "name": "355"}, {"group": 1, "name": "356"}, {"group": 1, "name": "357"}, {"group": 1, "name": "358"}, {"group": 1, "name": "359"}, {"group": 1, "name": "360"}, {"group": 1, "name": "361"}, {"group": 1, "name": "362"}, {"group": 1, "name": "363"}, {"group": 1, "name": "364"}, {"group": 1, "name": "365"}, {"group": 1, "name": "366"}, {"group": 1, "name": "367"}, {"group": 1, "name": "368"}, {"group": 1, "name": "369"}, {"group": 1, "name": "370"}, {"group": 1, "name": "371"}, {"group": 1, "name": "372"}, {"group": 1, "name": "373"}, {"group": 1, "name": "374"}, {"group": 1, "name": "375"}, {"group": 1, "name": "376"}, {"group": 1, "name": "377"}, {"group": 1, "name": "378"}, {"group": 1, "name": "379"}, {"group": 1, "name": "380"}, {"group": 1, "name": "381"}, {"group": 1, "name": "382"}, {"group": 1, "name": "383"}, {"group": 1, "name": "384"}, {"group": 1, "name": "385"}, {"group": 1, "name": "386"}, {"group": 1, "name": "387"}, {"group": 1, "name": "388"}, {"group": 1, "name": "389"}, {"group": 1, "name": "390"}, {"group": 1, "name": "391"}, {"group": 1, "name": "392"}, {"group": 1, "name": "393"}, {"group": 1, "name": "394"}, {"group": 1, "name": "395"}, {"group": 1, "name": "396"}, {"group": 1, "name": "397"}, {"group": 1, "name": "398"}, {"group": 1, "name": "399"}, {"group": 1, "name": "400"},'+ 
                             '{"group": 10, "name": "401"}, {"group": 1, "name": "402"}, {"group": 1, "name": "403"}, {"group": 1, "name": "404"}, {"group": 1, "name": "405"}, {"group": 1, "name": "406"}, {"group": 1, "name": "407"}, {"group": 1, "name": "408"}, {"group": 1, "name": "409"}, {"group": 1, "name": "410"}, {"group": 1, "name": "411"}, {"group": 1, "name": "412"}, {"group": 1, "name": "413"}, {"group": 1, "name": "414"}, {"group": 1, "name": "415"}, {"group": 1, "name": "416"}, {"group": 1, "name": "417"}, {"group": 1, "name": "418"}, {"group": 1, "name": "419"}, {"group": 1, "name": "420"}, {"group": 1, "name": "421"}, {"group": 1, "name": "422"}, {"group": 1, "name": "423"}, {"group": 1, "name": "424"}, {"group": 1, "name": "425"}, {"group": 1, "name": "426"}, {"group": 1, "name": "427"}, {"group": 1, "name": "428"}, {"group": 1, "name": "429"}, {"group": 1, "name": "430"}, {"group": 1, "name": "431"}, {"group": 1, "name": "432"}, {"group": 1, "name": "433"}, {"group": 1, "name": "434"}, {"group": 1, "name": "435"}, {"group": 1, "name": "436"}, {"group": 1, "name": "437"}, {"group": 1, "name": "438"}, {"group": 1, "name": "439"}, {"group": 1, "name": "440"}, {"group": 1, "name": "441"}, {"group": 1, "name": "442"}, {"group": 1, "name": "443"}, {"group": 1, "name": "444"}, {"group": 1, "name": "445"}, {"group": 1, "name": "446"}, {"group": 1, "name": "447"}, {"group": 1, "name": "448"}, {"group": 1, "name": "449"}, {"group": 1, "name": "450"}, {"group": 1, "name": "451"}, {"group": 1, "name": "452"}, {"group": 1, "name": "453"}, {"group": 1, "name": "454"}, {"group": 1, "name": "455"}, {"group": 1, "name": "456"}, {"group": 1, "name": "457"}, {"group": 1, "name": "458"}, {"group": 1, "name": "459"}, {"group": 1, "name": "460"}, {"group": 1, "name": "461"}, {"group": 1, "name": "462"}, {"group": 1, "name": "463"}, {"group": 1, "name": "464"}, {"group": 1, "name": "465"}, {"group": 1, "name": "466"}, {"group": 1, "name": "467"}, {"group": 1, "name": "468"}, {"group": 1, "name": "469"}, {"group": 1, "name": "470"}, {"group": 1, "name": "471"}, {"group": 1, "name": "472"}, {"group": 1, "name": "473"}, {"group": 1, "name": "474"}, {"group": 1, "name": "475"}, {"group": 1, "name": "476"}, {"group": 1, "name": "477"}, {"group": 1, "name": "478"}, {"group": 1, "name": "479"}, {"group": 1, "name": "480"}, {"group": 1, "name": "481"}, {"group": 1, "name": "482"}, {"group": 1, "name": "483"}, {"group": 1, "name": "484"}, {"group": 1, "name": "485"}, {"group": 1, "name": "486"}, {"group": 1, "name": "487"}, {"group": 1, "name": "488"}, {"group": 1, "name": "489"}, {"group": 1, "name": "490"}, {"group": 1, "name": "491"}, {"group": 1, "name": "492"}, {"group": 1, "name": "493"}, {"group": 1, "name": "494"}, {"group": 1, "name": "495"}, {"group": 1, "name": "496"}, {"group": 1, "name": "497"}, {"group": 1, "name": "498"}, {"group": 1, "name": "499"}],' +
                             '"links": [{"source": 81, "target": 386, "value": 1}, {"source": 429, "target": 187, "value": 1}, {"source": 253, "target": 308, "value": 1}, {"source": 317, "target": 227, "value": 1}, {"source": 400, "target": 11, "value": 1}, {"source": 475, "target": 112, "value": 1}, {"source": 261, "target": 195, "value": 1}, {"source": 217, "target": 129, "value": 1}, {"source": 78, "target": 440, "value": 1}, {"source": 396, "target": 481, "value": 1}, {"source": 240, "target": 125, "value": 1}, {"source": 447, "target": 155, "value": 1}, {"source": 395, "target": 94, "value": 1}, {"source": 321, "target": 261, "value": 1}, {"source": 126, "target": 25, "value": 1}, {"source": 322, "target": 214, "value": 1}, {"source": 39, "target": 431, "value": 1}, {"source": 371, "target": 162, "value": 1}, {"source": 9, "target": 182, "value": 1}, {"source": 250, "target": 7, "value": 1}, {"source": 215, "target": 210, "value": 1}, {"source": 325, "target": 242, "value": 1}, {"source": 471, "target": 368, "value": 1}, {"source": 287, "target": 425, "value": 1}, {"source": 323, "target": 244, "value": 1}, {"source": 266, "target": 472, "value": 1}, {"source": 228, "target": 249, "value": 1}, {"source": 450, "target": 116, "value": 1}, {"source": 169, "target": 190, "value": 1}, {"source": 475, "target": 244, "value": 1}, {"source": 234, "target": 41, "value": 1}, {"source": 231, "target": 80, "value": 1}, {"source": 401, "target": 369, "value": 1}, {"source": 269, "target": 21, "value": 1}, {"source": 171, "target": 93, "value": 1}, {"source": 6, "target": 281, "value": 1}, {"source": 360, "target": 415, "value": 1}, {"source": 418, "target": 471, "value": 1}, {"source": 366, "target": 225, "value": 1}, {"source": 297, "target": 287, "value": 1}, {"source": 333, "target": 201, "value": 1}, {"source": 322, "target": 286, "value": 1}, {"source": 171, "target": 351, "value": 1}, {"source": 33, "target": 198, "value": 1}, {"source": 69, "target": 194, "value": 1}, {"source": 266, "target": 324, "value": 1}, {"source": 389, "target": 156, "value": 1}, {"source": 316, "target": 355, "value": 1}, {"source": 96, "target": 370, "value": 1}, {"source": 449, "target": 455, "value": 1}, {"source": 280, "target": 248, "value": 1}, {"source": 249, "target": 449, "value": 1}, {"source": 167, "target": 237, "value": 1}, {"source": 486, "target": 230, "value": 1}, {"source": 193, "target": 127, "value": 1}, {"source": 16, "target": 46, "value": 1}, {"source": 1, "target": 434, "value": 1}, {"source": 44, "target": 239, "value": 1}, {"source": 246, "target": 262, "value": 1}, {"source": 109, "target": 250, "value": 1}, {"source": 44, "target": 418, "value": 1}, {"source": 305, "target": 314, "value": 1}, {"source": 299, "target": 403, "value": 1}, {"source": 410, "target": 481, "value": 1}, {"source": 463, "target": 161, "value": 1}, {"source": 216, "target": 185, "value": 1},'+ 
                                       '{"source": 321, "target": 240, "value": 1}, {"source": 462, "target": 269, "value": 1}, {"source": 398, "target": 150, "value": 1}, {"source": 121, "target": 216, "value": 1}, {"source": 53, "target": 209, "value": 1}, {"source": 68, "target": 208, "value": 1}, {"source": 490, "target": 265, "value": 1}, {"source": 300, "target": 499, "value": 1}, {"source": 272, "target": 125, "value": 1}, {"source": 450, "target": 120, "value": 1}, {"source": 219, "target": 268, "value": 1}, {"source": 474, "target": 61, "value": 1}, {"source": 438, "target": 495, "value": 1}, {"source": 172, "target": 17, "value": 1}, {"source": 483, "target": 112, "value": 1}, {"source": 456, "target": 169, "value": 1}, {"source": 481, "target": 278, "value": 1}, {"source": 101, "target": 493, "value": 1}, {"source": 302, "target": 119, "value": 1}, {"source": 177, "target": 410, "value": 1}, {"source": 403, "target": 233, "value": 1}, {"source": 459, "target": 227, "value": 1}, {"source": 31, "target": 318, "value": 1}, {"source": 486, "target": 23, "value": 1}, {"source": 366, "target": 205, "value": 1}, {"source": 459, "target": 110, "value": 1}, {"source": 342, "target": 224, "value": 1}, {"source": 222, "target": 62, "value": 1}, {"source": 52, "target": 48, "value": 1}, {"source": 181, "target": 406, "value": 1}, {"source": 176, "target": 75, "value": 1}, {"source": 153, "target": 189, "value": 1}, {"source": 156, "target": 92, "value": 1}, {"source": 305, "target": 18, "value": 1}, {"source": 408, "target": 63, "value": 1}, {"source": 253, "target": 17, "value": 1}, {"source": 359, "target": 372, "value": 1}, {"source": 181, "target": 255, "value": 1}, {"source": 326, "target": 430, "value": 1}, {"source": 271, "target": 320, "value": 1}, {"source": 392, "target": 51, "value": 1}, {"source": 347, "target": 291, "value": 1}, {"source": 193, "target": 173, "value": 1}, {"source": 203, "target": 422, "value": 1}, {"source": 383, "target": 401, "value": 1}, {"source": 317, "target": 439, "value": 1}, {"source": 444, "target": 481, "value": 1}, {"source": 350, "target": 186, "value": 1}, {"source": 206, "target": 92, "value": 1}, {"source": 181, "target": 12, "value": 1}, {"source": 457, "target": 22, "value": 1}, {"source": 423, "target": 238, "value": 1}, {"source": 30, "target": 93, "value": 1}, {"source": 144, "target": 358, "value": 1}, {"source": 182, "target": 149, "value": 1}, {"source": 361, "target": 443, "value": 1}, {"source": 4, "target": 103, "value": 1}, {"source": 275, "target": 65, "value": 1}, {"source": 470, "target": 236, "value": 1}, {"source": 449, "target": 149, "value": 1}, {"source": 27, "target": 128, "value": 1}, {"source": 128, "target": 475, "value": 1}, {"source": 151, "target": 486, "value": 1}, {"source": 336, "target": 144, "value": 1}, {"source": 422, "target": 146, "value": 1}, {"source": 226, "target": 490, "value": 1},' +
                                       '{"source": 211, "target": 116, "value": 1}, {"source": 380, "target": 315, "value": 1}, {"source": 352, "target": 467, "value": 1}, {"source": 375, "target": 222, "value": 1}, {"source": 250, "target": 481, "value": 1}, {"source": 187, "target": 169, "value": 1}, {"source": 30, "target": 456, "value": 1}, {"source": 227, "target": 40, "value": 1}, {"source": 435, "target": 434, "value": 1}, {"source": 409, "target": 355, "value": 1}, {"source": 371, "target": 27, "value": 1}, {"source": 187, "target": 120, "value": 1}, {"source": 277, "target": 311, "value": 1}, {"source": 49, "target": 413, "value": 1}, {"source": 439, "target": 245, "value": 1}, {"source": 307, "target": 110, "value": 1}, {"source": 349, "target": 145, "value": 1}, {"source": 287, "target": 308, "value": 1}, {"source": 235, "target": 486, "value": 1}, {"source": 113, "target": 75, "value": 1}, {"source": 15, "target": 290, "value": 1}, {"source": 190, "target": 259, "value": 1}, {"source": 8, "target": 363, "value": 1}, {"source": 382, "target": 268, "value": 1}, {"source": 328, "target": 399, "value": 1}, {"source": 256, "target": 396, "value": 1}, {"source": 92, "target": 121, "value": 1}, {"source": 265, "target": 146, "value": 1}, {"source": 112, "target": 146, "value": 1}, {"source": 10, "target": 115, "value": 1}, {"source": 487, "target": 210, "value": 1}, {"source": 37, "target": 451, "value": 1}, {"source": 485, "target": 5, "value": 1}, {"source": 68, "target": 276, "value": 1}, {"source": 437, "target": 8, "value": 1}, {"source": 491, "target": 52, "value": 1}, {"source": 287, "target": 111, "value": 1}, {"source": 181, "target": 242, "value": 1}, {"source": 207, "target": 335, "value": 1}, {"source": 336, "target": 345, "value": 1}, {"source": 56, "target": 433, "value": 1}, {"source": 331, "target": 478, "value": 1}, {"source": 371, "target": 349, "value": 1}, {"source": 272, "target": 433, "value": 1}, {"source": 87, "target": 379, "value": 1}, {"source": 195, "target": 339, "value": 1}, {"source": 74, "target": 91, "value": 1}, {"source": 326, "target": 99, "value": 1}, {"source": 140, "target": 307, "value": 1}, {"source": 129, "target": 160, "value": 1}, {"source": 171, "target": 115, "value": 1}, {"source": 490, "target": 306, "value": 1}, {"source": 189, "target": 272, "value": 1}, {"source": 254, "target": 413, "value": 1}, {"source": 317, "target": 374, "value": 1}, {"source": 378, "target": 26, "value": 1}, {"source": 258, "target": 390, "value": 1}, {"source": 433, "target": 68, "value": 1}, {"source": 333, "target": 377, "value": 1}, {"source": 435, "target": 289, "value": 1}, {"source": 15, "target": 22, "value": 1}, {"source": 495, "target": 23, "value": 1}, {"source": 437, "target": 332, "value": 1}, {"source": 417, "target": 109, "value": 1}, {"source": 292, "target": 376, "value": 1}, {"source": 234, "target": 442, "value": 1},'+ 
                                       '{"source": 419, "target": 280, "value": 1}, {"source": 141, "target": 359, "value": 1}, {"source": 405, "target": 74, "value": 1}, {"source": 382, "target": 494, "value": 1}, {"source": 225, "target": 92, "value": 1}, {"source": 473, "target": 77, "value": 1}, {"source": 59, "target": 287, "value": 1}, {"source": 130, "target": 309, "value": 1}, {"source": 466, "target": 207, "value": 1}, {"source": 470, "target": 196, "value": 1}, {"source": 31, "target": 311, "value": 1}, {"source": 191, "target": 447, "value": 1}, {"source": 23, "target": 59, "value": 1}, {"source": 76, "target": 90, "value": 1}, {"source": 423, "target": 113, "value": 1}, {"source": 296, "target": 236, "value": 1}, {"source": 227, "target": 239, "value": 1}, {"source": 67, "target": 8, "value": 1}, {"source": 229, "target": 224, "value": 1}, {"source": 62, "target": 67, "value": 1}, {"source": 75, "target": 174, "value": 1}, {"source": 60, "target": 93, "value": 1}, {"source": 145, "target": 450, "value": 1}, {"source": 89, "target": 113, "value": 1}, {"source": 416, "target": 367, "value": 1}, {"source": 243, "target": 348, "value": 1}, {"source": 275, "target": 449, "value": 1}, {"source": 326, "target": 11, "value": 1}, {"source": 61, "target": 143, "value": 1}, {"source": 281, "target": 367, "value": 1}, {"source": 82, "target": 482, "value": 1}, {"source": 465, "target": 183, "value": 1}, {"source": 391, "target": 38, "value": 1}, {"source": 153, "target": 271, "value": 1}, {"source": 155, "target": 264, "value": 1}, {"source": 449, "target": 347, "value": 1}, {"source": 116, "target": 363, "value": 1}, {"source": 202, "target": 241, "value": 1}, {"source": 1, "target": 330, "value": 1}, {"source": 300, "target": 330, "value": 1}, {"source": 473, "target": 421, "value": 1}, {"source": 11, "target": 255, "value": 1}, {"source": 131, "target": 122, "value": 1}, {"source": 232, "target": 110, "value": 1}, {"source": 267, "target": 468, "value": 1}, {"source": 329, "target": 207, "value": 1}, {"source": 354, "target": 79, "value": 1}, {"source": 390, "target": 401, "value": 1}, {"source": 496, "target": 182, "value": 1}, {"source": 65, "target": 325, "value": 1}, {"source": 157, "target": 477, "value": 1}, {"source": 106, "target": 328, "value": 1}, {"source": 288, "target": 198, "value": 1}, {"source": 117, "target": 406, "value": 1}, {"source": 385, "target": 89, "value": 1}, {"source": 72, "target": 420, "value": 1}, {"source": 310, "target": 23, "value": 1}, {"source": 147, "target": 94, "value": 1}, {"source": 406, "target": 177, "value": 1}, {"source": 285, "target": 446, "value": 1}, {"source": 106, "target": 403, "value": 1}, {"source": 104, "target": 188, "value": 1}, {"source": 243, "target": 259, "value": 1}, {"source": 61, "target": 334, "value": 1}, {"source": 110, "target": 223, "value": 1}, {"source": 143, "target": 3, "value": 1},'+ 
                                       '{"source": 428, "target": 93, "value": 1}, {"source": 226, "target": 213, "value": 1}, {"source": 341, "target": 315, "value": 1}, {"source": 398, "target": 255, "value": 1}, {"source": 250, "target": 275, "value": 1}, {"source": 216, "target": 315, "value": 1}, {"source": 324, "target": 49, "value": 1}, {"source": 327, "target": 192, "value": 1}, {"source": 356, "target": 335, "value": 1}, {"source": 264, "target": 293, "value": 1}, {"source": 488, "target": 390, "value": 1}, {"source": 329, "target": 311, "value": 1}, {"source": 271, "target": 84, "value": 1}, {"source": 9, "target": 299, "value": 1}, {"source": 58, "target": 119, "value": 1}, {"source": 261, "target": 381, "value": 1}, {"source": 461, "target": 420, "value": 1}, {"source": 347, "target": 478, "value": 1}, {"source": 212, "target": 481, "value": 1}, {"source": 420, "target": 168, "value": 1}, {"source": 1, "target": 234, "value": 1}, {"source": 473, "target": 272, "value": 1}, {"source": 84, "target": 364, "value": 1}, {"source": 350, "target": 168, "value": 1}, {"source": 436, "target": 129, "value": 1}, {"source": 106, "target": 428, "value": 1}, {"source": 201, "target": 441, "value": 1}, {"source": 249, "target": 213, "value": 1}, {"source": 482, "target": 410, "value": 1}, {"source": 382, "target": 146, "value": 1}, {"source": 50, "target": 438, "value": 1}, {"source": 350, "target": 297, "value": 1}, {"source": 443, "target": 240, "value": 1}, {"source": 499, "target": 478, "value": 1}, {"source": 378, "target": 165, "value": 1}, {"source": 118, "target": 453, "value": 1}, {"source": 94, "target": 463, "value": 1}, {"source": 354, "target": 267, "value": 1}, {"source": 319, "target": 60, "value": 1}, {"source": 443, "target": 265, "value": 1}, {"source": 394, "target": 414, "value": 1}, {"source": 129, "target": 198, "value": 1}, {"source": 151, "target": 302, "value": 1}, {"source": 376, "target": 307, "value": 1}, {"source": 266, "target": 271, "value": 1}, {"source": 414, "target": 420, "value": 1}, {"source": 281, "target": 284, "value": 1}, {"source": 335, "target": 274, "value": 1}, {"source": 331, "target": 11, "value": 1}, {"source": 14, "target": 449, "value": 1}, {"source": 178, "target": 453, "value": 1}, {"source": 457, "target": 13, "value": 1}, {"source": 165, "target": 41, "value": 1}, {"source": 431, "target": 141, "value": 1}, {"source": 480, "target": 267, "value": 1}, {"source": 115, "target": 183, "value": 1}, {"source": 220, "target": 113, "value": 1}, {"source": 253, "target": 97, "value": 1}, {"source": 229, "target": 192, "value": 1}, {"source": 352, "target": 492, "value": 1}, {"source": 362, "target": 63, "value": 1}, {"source": 384, "target": 157, "value": 1}, {"source": 346, "target": 13, "value": 1}, {"source": 192, "target": 460, "value": 1}, {"source": 468, "target": 216, "value": 1}, {"source": 155, "target": 161, "value": 1},'+ 
                                       '{"source": 67, "target": 354, "value": 1}, {"source": 52, "target": 305, "value": 1}, {"source": 224, "target": 97, "value": 1}, {"source": 8, "target": 287, "value": 1}, {"source": 473, "target": 484, "value": 1}, {"source": 240, "target": 120, "value": 1}, {"source": 293, "target": 308, "value": 1}, {"source": 346, "target": 345, "value": 1}, {"source": 6, "target": 258, "value": 1}, {"source": 392, "target": 486, "value": 1}, {"source": 227, "target": 364, "value": 1}, {"source": 374, "target": 211, "value": 1}, {"source": 77, "target": 186, "value": 1}, {"source": 389, "target": 389, "value": 1}, {"source": 464, "target": 181, "value": 1}, {"source": 446, "target": 359, "value": 1}, {"source": 386, "target": 127, "value": 1}, {"source": 86, "target": 253, "value": 1}, {"source": 204, "target": 194, "value": 1}, {"source": 324, "target": 42, "value": 1}, {"source": 319, "target": 440, "value": 1}, {"source": 217, "target": 41, "value": 1}, {"source": 53, "target": 327, "value": 1}, {"source": 431, "target": 260, "value": 1}, {"source": 193, "target": 400, "value": 1}, {"source": 427, "target": 12, "value": 1}, {"source": 471, "target": 301, "value": 1}, {"source": 130, "target": 241, "value": 1}, {"source": 367, "target": 177, "value": 1}, {"source": 103, "target": 496, "value": 1}, {"source": 361, "target": 263, "value": 1}, {"source": 66, "target": 300, "value": 1}, {"source": 266, "target": 26, "value": 1}, {"source": 470, "target": 215, "value": 1}, {"source": 308, "target": 389, "value": 1}, {"source": 298, "target": 197, "value": 1}, {"source": 491, "target": 109, "value": 1}, {"source": 51, "target": 458, "value": 1}, {"source": 439, "target": 426, "value": 1}, {"source": 477, "target": 75, "value": 1}, {"source": 285, "target": 91, "value": 1}, {"source": 91, "target": 369, "value": 1}, {"source": 335, "target": 305, "value": 1}, {"source": 112, "target": 285, "value": 1}, {"source": 399, "target": 435, "value": 1}, {"source": 24, "target": 91, "value": 1}, {"source": 52, "target": 495, "value": 1}, {"source": 455, "target": 37, "value": 1}, {"source": 37, "target": 223, "value": 1}, {"source": 327, "target": 39, "value": 1}, {"source": 176, "target": 191, "value": 1}, {"source": 315, "target": 476, "value": 1}, {"source": 344, "target": 208, "value": 1}, {"source": 352, "target": 373, "value": 1}, {"source": 440, "target": 152, "value": 1}, {"source": 457, "target": 272, "value": 1}, {"source": 258, "target": 53, "value": 1}, {"source": 143, "target": 22, "value": 1}, {"source": 285, "target": 23, "value": 1}, {"source": 449, "target": 370, "value": 1}, {"source": 342, "target": 267, "value": 1}, {"source": 476, "target": 464, "value": 1}, {"source": 430, "target": 426, "value": 1}, {"source": 259, "target": 372, "value": 1}, {"source": 492, "target": 270, "value": 1}, {"source": 252, "target": 401, "value": 1},'+ 
                                       '{"source": 343, "target": 196, "value": 1}, {"source": 290, "target": 337, "value": 1}, {"source": 234, "target": 405, "value": 1}, {"source": 372, "target": 446, "value": 1}, {"source": 339, "target": 255, "value": 1}, {"source": 367, "target": 141, "value": 1}, {"source": 116, "target": 20, "value": 1}, {"source": 477, "target": 339, "value": 1}, {"source": 32, "target": 425, "value": 1}, {"source": 185, "target": 209, "value": 1}, {"source": 443, "target": 309, "value": 1}, {"source": 488, "target": 270, "value": 1}, {"source": 326, "target": 163, "value": 1}, {"source": 387, "target": 181, "value": 1}, {"source": 204, "target": 10, "value": 1}, {"source": 297, "target": 29, "value": 1}, {"source": 473, "target": 253, "value": 1}, {"source": 0, "target": 370, "value": 1}, {"source": 121, "target": 33, "value": 1}, {"source": 340, "target": 384, "value": 1}, {"source": 249, "target": 289, "value": 1}, {"source": 160, "target": 361, "value": 1}, {"source": 434, "target": 36, "value": 1}, {"source": 277, "target": 141, "value": 1}, {"source": 26, "target": 158, "value": 1}, {"source": 417, "target": 172, "value": 1}, {"source": 289, "target": 402, "value": 1}, {"source": 174, "target": 269, "value": 1}, {"source": 243, "target": 54, "value": 1}, {"source": 146, "target": 48, "value": 1}, {"source": 452, "target": 496, "value": 1}, {"source": 160, "target": 446, "value": 1}, {"source": 109, "target": 229, "value": 1}, {"source": 493, "target": 367, "value": 1}, {"source": 455, "target": 471, "value": 1}, {"source": 441, "target": 235, "value": 1}, {"source": 127, "target": 56, "value": 1}, {"source": 481, "target": 242, "value": 1}, {"source": 410, "target": 435, "value": 1}, {"source": 468, "target": 467, "value": 1}, {"source": 427, "target": 419, "value": 1}, {"source": 499, "target": 356, "value": 1}, {"source": 40, "target": 402, "value": 1}, {"source": 365, "target": 118, "value": 1}, {"source": 343, "target": 490, "value": 1}, {"source": 287, "target": 137, "value": 1}, {"source": 185, "target": 465, "value": 1}, {"source": 258, "target": 431, "value": 1}, {"source": 495, "target": 450, "value": 1}, {"source": 415, "target": 284, "value": 1}, {"source": 326, "target": 434, "value": 1}, {"source": 408, "target": 187, "value": 1}, {"source": 34, "target": 161, "value": 1}, {"source": 91, "target": 290, "value": 1}, {"source": 469, "target": 349, "value": 1}, {"source": 300, "target": 411, "value": 1}, {"source": 342, "target": 119, "value": 1}, {"source": 54, "target": 50, "value": 1}, {"source": 487, "target": 272, "value": 1}, {"source": 121, "target": 134, "value": 1}, {"source": 469, "target": 304, "value": 1}, {"source": 217, "target": 70, "value": 1}, {"source": 160, "target": 234, "value": 1}, {"source": 83, "target": 286, "value": 1}, {"source": 27, "target": 133, "value": 1}, {"source": 202, "target": 76, "value": 1},'+ 
                                       '{"source": 155, "target": 150, "value": 1}, {"source": 70, "target": 485, "value": 1}, {"source": 352, "target": 79, "value": 1}, {"source": 316, "target": 114, "value": 1}, {"source": 363, "target": 347, "value": 1}, {"source": 419, "target": 125, "value": 1}, {"source": 75, "target": 339, "value": 1}, {"source": 53, "target": 37, "value": 1}, {"source": 338, "target": 417, "value": 1}, {"source": 204, "target": 404, "value": 1}, {"source": 448, "target": 31, "value": 1}, {"source": 186, "target": 393, "value": 1}, {"source": 245, "target": 246, "value": 1}, {"source": 50, "target": 1, "value": 1}, {"source": 311, "target": 147, "value": 1}, {"source": 363, "target": 279, "value": 1}, {"source": 431, "target": 214, "value": 1}, {"source": 193, "target": 474, "value": 1}, {"source": 274, "target": 210, "value": 1}, {"source": 304, "target": 410, "value": 1}, {"source": 240, "target": 314, "value": 1}, {"source": 347, "target": 409, "value": 1}, {"source": 97, "target": 102, "value": 1}, {"source": 390, "target": 231, "value": 1}, {"source": 480, "target": 61, "value": 1}, {"source": 66, "target": 301, "value": 1}, {"source": 312, "target": 82, "value": 1}, {"source": 25, "target": 255, "value": 1}, {"source": 203, "target": 123, "value": 1}, {"source": 6, "target": 49, "value": 1}, {"source": 111, "target": 449, "value": 1}, {"source": 330, "target": 295, "value": 1}, {"source": 193, "target": 336, "value": 1}, {"source": 24, "target": 140, "value": 1}, {"source": 188, "target": 27, "value": 1}, {"source": 484, "target": 125, "value": 1}, {"source": 128, "target": 87, "value": 1}, {"source": 215, "target": 109, "value": 1}]}';

        //Set up the colour scale
        var color = d3.scale.category20();

        //Set up the force layout
        var force = d3.layout.force().charge(-120).linkDistance(30)
        
        var zoom = d3.behavior.zoom().on("zoom", rescale);
        
        var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

        var margin = {top: -5, right: -5, bottom: -5, left: -5};
        
        //Append a SVG to the body of the html page. Assign this SVG as an object to svg
        var svg = d3.select(this._$container.get(0)).append("svg").attr('style', 'width: 100%; height: 100%;');

        var rect = svg.append("g").append("rect")
            .attr("width", this._$container.width())
            .attr("height", this._$container.height())
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(zoom);
            
        var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")")
            .call(zoom);

        //Read the data from the mis element 
        //                var mis = document.getElementById('mis').innerHTML;
        graph = JSON.parse(mis);

        //Creates the graph data structure out of the json data
        force.nodes(graph.nodes).links(graph.links).start();

        //Create all the line svgs but without locations yet
        var link = g.selectAll(".link").data(graph.links).enter().append("line").attr("class", "link").style(
                "stroke-width", function(d) {
                    return Math.sqrt(d.value);
                });

        //Do the same with the circles for the nodes - no 
        var node = g.selectAll(".node").data(graph.nodes).enter().append("circle").attr("class", "node").attr("r", 8)
                .style("fill", function(d) {
                    return color(d.group);
                }).call(force.drag).on(
                        "mouseover",
                        function(d, i) {
                        	// disable zoom
                            g.on(".zoom", null);
                            tooltip.transition().duration(200).style("opacity", .9);
                            tooltip.html(graph.nodes[i].name).style("left", (d3.event.pageX) + "px").style("top",
                                    (d3.event.pageY - 28) + "px");
                        }).on("mouseout", function(d) {
                    tooltip.transition().duration(500).style("opacity", 0);
                    //reenable zoom
                    g.call(zoom);
                });

        //Codigo para evitar que nodos quedes superpuestos
        var padding = 1, // separation between circles
        radius = 8;
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(graph.nodes);
            return function(d) {
                var rb = 2 * radius + padding, nx1 = d.x - rb, nx2 = d.x + rb, ny1 = d.y - rb, ny2 = d.y + rb;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x, y = d.y - quad.point.y, l = Math.sqrt(x * x + y * y);
                        if (l < rb) {
                            l = (l - rb) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
        var tickCount = 0;
        var skipFrame = 10;//Modificar este valor para saltaear frame de renderizado
        force.on("tick", function() {
            tickCount = tickCount + 1;
            if (tickCount % skipFrame == 0) {
                link.attr("x1", function(d) {
                    return d.source.x;
                }).attr("y1", function(d) {
                    return d.source.y;
                }).attr("x2", function(d) {
                    return d.target.x;
                }).attr("y2", function(d) {
                    return d.target.y;
                });

                node.attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                    return d.y;
                });
                node.each(collide(0.5)); //Added 
            }
            ;
        });

        //Resize: Cambia el tamaño del cuadro donde se dibuja el grafo
        this.resize = function() {
        	
            width = my_self._$container.width(), height = my_self._$container.height();
            svg.attr("width", width).attr("height", height);
            rect.attr("width", width).attr("height", height);
            force.size([ width, height ]).resume();
        }
        ;
        

        function startAnimation() {
            force.start();
        }
        ;

        function stopAnimation() {
            force.stop();
        }
        ;

        var tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
        

        //Rescale: cambia el zoom del grafo segun la rueda del mouse
        function rescale() {
        
        	  trans=d3.event.translate;
        	  scale=d3.event.scale;

        	  g.attr("transform",
        	      "translate(" + trans + ")"
        	      + " scale(" + scale + ")");

        };  
        
        
        this.manualPan = function (dx, dy) {
        	
        	var currentx = d3.transform(g.attr("transform")).translate[0];
        	var currenty = d3.transform(g.attr("transform")).translate[1];
        	var currentScale = d3.transform(g.attr("transform")).scale[0];
        	
        	trans = (currentx + dx) + "," + (currenty + dy);
        	g.attr("transform",
          	      "translate(" + trans + ")"
          	      + " scale(" + currentScale + ")");
        	
        	zoom.scale(currentScale);
        	zoom.translate([currentx + dx, currenty + dy]);

		};
        
        this.manualZoom = function (scale) {
        	
        	var currentx = d3.transform(g.attr("transform")).translate[0];
        	var currenty = d3.transform(g.attr("transform")).translate[1];
        	var currentScale = d3.transform(g.attr("transform")).scale[0];
        	var newScale = scale * currentScale;
        	trans = currentx  + "," +currenty ;
        	
        	g.attr("transform",
            	      "translate(" + trans + ")"
            	      + " scale(" + newScale + ")");
        	
        	zoom.scale(newScale);
        	zoom.translate([currentx, currenty]);

		};
        
        
		
        //Control de zoom y pan manual
        svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 42).attr("fill", "white").attr("opacity", "0.75");
        
        svg.append("path").attr("d", "M50 10 l12   20 a40, 70 0 0,0 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, 50)});
        svg.append("path").attr("d", "M10 50 l20  -12 a70, 40 0 0,0   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( 50, 0)});
        svg.append("path").attr("d", "M50 90 l12  -20 a40, 70 0 0,1 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, -50)});
        svg.append("path").attr("d", "M90 50 l-20 -12 a70, 40 0 0,1   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( -50, 0)});
        
        svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 20).attr("class", "compass");
        svg.append("circle").attr("cx", 50).attr("cy", 41).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(0.8)});
        svg.append("circle").attr("cx", 50).attr("cy", 59).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(1.2)});
        
        svg.append("rect").attr("x", 46).attr("y", 39.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        svg.append("rect").attr("x", 46).attr("y", 57.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        svg.append("rect").attr("x", 48.5).attr("y", 55).attr("width", 3).attr("height", 8).attr("class", "plus-minus");
        
        
        
        function dragstarted(d) {
      	  	d3.event.sourceEvent.stopPropagation();
      	  	d3.select(this).classed("dragging", true);
      	};

      	function dragged(d) {
      		d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      	};

      	function dragended(d) {
      		d3.select(this).classed("dragging", false);
      	};
        

    };
    
    
    
   

    ProcessView.prototype.render = function() {
        if (this._$out_of_dom) {

            this._$out_of_dom.appendTo(this.box);
            this._$out_of_dom = null;

        }
        
        this.resize();

    };

    ProcessView.prototype.unlink = function() {
        if (!this._$out_of_dom) {
            this._$out_of_dom = this._$container.detach();
        }
    };

    ProcessView.prototype.__proto__ = layout.Panel.prototype;

    return {
        ProcessView : ProcessView
    };

});
