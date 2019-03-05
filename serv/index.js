const serialport = require('serialport');
const express = require('express');
const log4js = require('log4js');
const moment = require('moment');


/**
 * config
 */
const port = 'COM2';
const logger = log4js.getLogger();
const today = moment().format('YYYY-MM-DD');
const conf = {
    f: [-1, 15], //起始楼层 - 最高楼层
    out: [0] //除去楼层
};

/**
 * serialport
 */
const sp = new serialport(
    port, {
        baudRate: 9600, //波特率
        dataBits: 8, //数据位
        parity: 'none', //奇偶校验
        stopBits: 1, //停止位
        flowControl: false,
        autoOpen: false
    }, false);

sp.open(function (err) {
    if (err) {
        console.log('Cannot open ' + port + '. Error: ' + err);
        return;
    }

    console.log('Port ' + port + ' is connected.');

    sp.on('data', function (data) {
        let buffer = Buffer.from([0x02, 0x80, 0x03, 0x03, 0x91, 0xFF, 0x80, 0x00, 0xEA, 0x03]);
        logger.info(data);
    });
});

/**
 * express
 */
const exp = express();

exp.get('/', function (req, res) {
    res.send('<h1> Welcome to use the elevator control system.</h1>');
});

exp.get('/f', function (req, res) {
    let r = false;
    let f = [];
    let val = 0;
    for (let i = conf.f[0]; i <= conf.f[1]; i++) {
        r = false;
        for (var j = 0; j < conf.out.length; j++) {
            if (i === conf.out[j]) {
                r = true;
                break;
            }
        }
        if (r) continue;
        f.push({
            key: i,
            val: int2hex(val),
            text: i.toString().replace('-', 'B')
        })
        val++;
    }
    res.send(f);
})

exp.get('/go/:here/:there', function (req, res) {
    let buffer = Buffer.from([0x02, 0x00, 0x01, 0x06, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x03]);
    buffer[7] = req.params.here;
    buffer[9] = req.params.there;
    for (let i = 1; i < 10; i++) {
        buffer[10] += buffer[i];
    }
    buffer[10] = ~buffer[10] + 1;

    const data = {
        datetime: new Date().toLocaleString(),
        cmd: '' + buffer,
        success: true,
        error: ""
    }

    sp.write(buffer, function (err, results) {
        if (err) {
            logger.error('Cannot write ' + port + '. Error: ' + err);
            return;
        }
        if (results) {
            logger.info('Write buffer: ' + results);
        }
    });

    res.end(JSON.stringify(data));

    logger.info(JSON.stringify(data));
})

exp.listen(8000, function () {
    console.log("http://%s:%s server is listening...", 'localhost', 8000)
});

exp.use(log4js.connectLogger(logger, {
    level: 'auto',
    format: ':method :url  :status  :response-time ms'
}));

/**
 * logger
 */
log4js.configure({
    appenders: {
        data_file: {
            type: 'dateFile',
            filename: __dirname + '/logs/' + today + '.log',
            daysToKeep: 10,
        }
    },
    categories: {
        default: {
            appenders: ['data_file'],
            level: 'all'
        }
    }
});

/**
 * utils
 */
function int2hex(val) {
    return '0x' + '00'.substr(0, 2 - val.toString(16).length) + val.toString(16);
}