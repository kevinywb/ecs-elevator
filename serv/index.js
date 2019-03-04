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

exp.get('/cmd/:cmd', function (req, res) {
    //req.params.cmd
    var buffer = Buffer.from([0x02, 0x00, 0x01, 0x06, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x03]);

    const data = {
        datetime: new Date().toLocaleString(),
        cmd: '' + buffer,
        success: true,
        error: ""
    }

    sp.write(data.cmd, function (err, results) {
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