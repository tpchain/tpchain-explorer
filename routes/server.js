var express = require('express');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var router = express.Router();
let config = require('./config');

var BigNumber = require('bignumber.js');
let Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider(config.GETH_HOSTNAME + ":" + config.GETH_RPCPORT));

/**
 * 首页
 */
router.get('/', function (req, res) {
    res.render('index.ejs');
})

/**
 * 链信息
 */
router.get('/chain', function (req, res) {

    getChainInfos(function (chainInfo) {
        res.render('chainInfo.ejs', chainInfo);
    });


})

/**
 * 查询区块
 */
router.get('/block/:blockId', function (req, res) {

    const blockId = req.params.blockId;
    getBlockInfos(blockId, function (info) {

        res.render('blockInfo.ejs', info);
    })

})

/**
 * 获取交易信息
 */
router.get('/tx/:hash', function (req, res) {
    const hash = req.params.hash;

    getTransactionInfos(hash, function (info) {

        res.render('transactionInfos.ejs', info);
    })

})

/**
 * 获取区块信息包含的交易
 */
router.post('/getTransactionReceipt', urlencodedParser, function (req, res) {
    const blockId = req.body.blockId;
    getTransactionReceipt(blockId, function (info) {
        res.send({
            state: true,
            msg: "",
            data: info
        });
    })
})


/**
 * 获取交易hash下的数据
 * @param {*} hash 
 * @param {*} callback 
 */
async function getTransactionInfos(hash, callback) {

    let info = {};
    info.txId = hash;
    var number = await web3.eth.getBlockNumber();
    var txInfo = await web3.eth.getTransaction(hash);

    if (txInfo.blockHash !== undefined) {
        info.blockHash = txInfo.blockHash;
    }
    else {
        info.blockHash = 'pending';
    }
    if (txInfo.blockNumber !== undefined) {
        info.blockNumber = txInfo.blockNumber;
    }
    else {
        info.blockNumber = 'pending';
    }
    info.from = txInfo.from;
    info.gas = txInfo.gas;

    info.gasPrice = web3.utils.fromWei(txInfo.gasPrice, "ether") + " TPCH";
    info.hash = txInfo.hash;
    info.input = txInfo.input.slice(2); // that's a string
    info.inpututf8 = utf8HexToStr(txInfo.input.slice(2));
    info.nonce = txInfo.nonce;
    info.to = txInfo.to;
    info.transactionIndex = txInfo.transactionIndex;
    let _value = web3.utils.fromWei(txInfo.value, "ether");
    info.ethValue = _value;
    txInfo.gasPrice = parseFloat(web3.utils.fromWei(txInfo.gasPrice, "ether"));
    txInfo.gas = parseInt(txInfo.gas);
    info.txprice = txInfo.gas * txInfo.gasPrice + " TPCH";


    if (info.blockNumber !== undefined) {
        info.conf = number - info.blockNumber;
        if (info.conf === 0) {
            info.conf = 'unconfirmed'; //TODO change color button when unconfirmed... ng-if or ng-class
        }

        var tmpinfo = await web3.eth.getBlock(info.blockNumber);
        if (tmpinfo !== undefined) {
            info.time = tmpinfo.timestamp;
        }
    }

    callback(info);
}
/**
 * 获取区块下的信息
 * @param {*} blockId 
 * @param {*} callback 
 */
async function getTransactionReceipt(blockId, callback) {

    let resInfo = [];

    const txCount = await web3.eth.getBlockTransactionCount(blockId);
    for (var blockIdx = 0; blockIdx < txCount; blockIdx++) {

        const result = await web3.eth.getTransactionFromBlock(blockId, blockIdx);

        const receipt = await web3.eth.getTransactionReceipt(result.hash);

        var transaction = {
            index: blockIdx,
            id: receipt.transactionHash,
            hash: receipt.transactionHash,
            from: receipt.from,
            to: receipt.to,
            gas: receipt.gasUsed,
            input: result.input.slice(2),
            inpututf8: utf8HexToStr(result.input.slice(2)),
            value: toNonExponential(parseInt(web3.utils.fromWei(result.value, "ether"))),
            contractAddress: receipt.contractAddress
        }

        resInfo.push(transaction);

    }


    callback(resInfo);


}

/**
 * 获取区块信息
 * @param {*} blockId 
 * @param {*} callback 
 */
async function getBlockInfos(blockId, callback) {

    let info = {};
    var number = await web3.eth.getBlockNumber();

    const blockInfo = await web3.eth.getBlock(blockId);

    info.numberOfUncles = blockInfo.uncles.length;
    if (blockInfo.hash !== undefined) {
        info.hash = blockInfo.hash;
    }
    else {
        info.hash = 'pending';
    }
    if (blockInfo.miner !== undefined) {
        info.miner = blockInfo.miner;
    }
    else {
        info.miner = 'pending';
    }
    info.gasLimit = blockInfo.gasLimit;
    info.gasUsed = blockInfo.gasUsed;
    info.nonce = blockInfo.nonce;
    var diff = ("" + blockInfo.difficulty).replace(/['"]+/g, '') / 1000000000000;
    info.difficulty = diff.toFixed(3) + " T";
    info.gasLimit = new BigNumber(blockInfo.gasLimit).toFormat(0) + " m/s"; // that's a string
    info.gasUsed = new BigNumber(blockInfo.gasUsed).toFormat(0) + " m/s";
    info.nonce = blockInfo.nonce;
    info.number = blockInfo.number;
    info.parentHash = blockInfo.parentHash;
    info.uncledata = blockInfo.sha3Uncles;
    info.rootHash = blockInfo.stateRoot;
    info.blockNumber = blockInfo.number;
    info.timestamp = new Date(blockInfo.timestamp * 1000).toUTCString();
    var data = blockInfo.extraData.slice(2);
    info.extraData = (data == 'da83010900846765746888676f312e31332e338777696e646f7773' ? '' : data);
    var dataFromHex = (blockInfo.extraData.slice(2) == 'da83010900846765746888676f312e31332e338777696e646f7773' ? '' : hex2a(blockInfo.extraData.slice(2)));
    info.dataFromHex = dataFromHex;
    info.size = blockInfo.size;
    info.firstBlock = false;
    info.lastBlock = false;
    if (info.blockNumber !== undefined) {
        info.conf = number - info.blockNumber;
        if (number === info.blockNumber) {
            info.conf = 'Unconfirmed';
            info.lastBlock = true;
        }
        if (info.blockNumber === 0) {
            info.firstBlock = true;
        }
    }

    if (info.blockNumber !== undefined) {
        var tmpinfo = await web3.eth.getBlock(info.blockNumber);
        if (tmpinfo !== undefined) {
            var newDate = new Date();
            newDate.setTime(info.timestamp * 1000);
            info.time = newDate.toUTCString();
        }
    }

    const txCount = await web3.eth.getBlockTransactionCount(blockId);
    info.numberOfTransactions = txCount;

    callback(info);
}

/**
 * 获取链信息
 * @param {*} callbacke 
 */
async function getChainInfos(callbacke) {
    let info = {};

    info.blockNum = await web3.eth.getBlockNumber();

    if (info.blockNum != undefined) {
        var blockNewest = await web3.eth.getBlock(info.blockNum);
        if (blockNewest !== undefined) {

            info.difficulty = parseInt(blockNewest.difficulty);
            info.difficultyToExponential = info.difficulty.toExponential(3);

            info.totalDifficulty = parseInt(blockNewest.totalDifficulty);
            info.totalDifficultyToExponential = info.totalDifficulty.toExponential(3);

            // Gas Limit
            info.gasLimit = new BigNumber(blockNewest.gasLimit).toFormat(0) + " m/s";

            // Time
            var newDate = new Date();
            newDate.setTime(blockNewest.timestamp * 1000);
            info.time = newDate.toUTCString();

            info.secondsSinceBlock1 = blockNewest.timestamp - 1438226773;
            info.daysSinceBlock1 = (info.secondsSinceBlock1 / 86400).toFixed(2);

            try {
                var blockBefore = await web3.eth.getBlock(info.blockNum - 1);
                if (blockBefore !== undefined) {
                    info.blocktime = blockNewest.timestamp - blockBefore.timestamp;
                }
                info.range1 = 100;
                range = info.range1;
                var blockPast = await web3.eth.getBlock(Math.max(info.blockNum - range, 0));
                if (blockBefore !== undefined) {
                    info.blocktimeAverage1 = ((blockNewest.timestamp - blockPast.timestamp) / range).toFixed(2);
                }
                info.range2 = 1000;
                range = info.range2;
                var blockPast = await web3.eth.getBlock(Math.max(info.blockNum - range, 0));
                if (blockBefore !== undefined) {
                    info.blocktimeAverage2 = ((blockNewest.timestamp - blockPast.timestamp) / range).toFixed(2);
                }
                info.range3 = 10000;
                range = info.range3;
                var blockPast = await web3.eth.getBlock(Math.max(info.blockNum - range, 0));
                if (blockBefore !== undefined) {
                    info.blocktimeAverage3 = ((blockNewest.timestamp - blockPast.timestamp) / range).toFixed(2);
                }
                info.range4 = 100000;
                range = info.range4;
                var blockPast = await web3.eth.getBlock(Math.max(info.blockNum - range, 0));
                if (blockBefore !== undefined) {
                    info.blocktimeAverage4 = ((blockNewest.timestamp - blockPast.timestamp) / range).toFixed(2);
                }

                range = info.blockNum;
                var blockPast = await web3.eth.getBlock(1);
                if (blockBefore !== undefined) {
                    info.blocktimeAverageAll = ((blockNewest.timestamp - blockPast.timestamp) / range).toFixed(2);
                }
            } catch (ex) {
                console.log(ex.toString());
            }
        }



    }

    info.versionApi = await web3.eth.getNodeInfo();

    try { info.versionWhisper = web3.version.whisper; }
    catch (err) { info.versionWhisper = err.message; }

    callbacke(info);
}


function toNonExponential(num) {
    var m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
    return num.toFixed(Math.max(0, (m[1] || '').length - m[2]));
}

function utf8HexToStr(str) {
    var buf = [];
    for (var i = 0; i < str.length; i += 2) {
        buf.push(parseInt(str.substring(i, i + 2), 16));
    }
    return readUTF(buf);
}


function readUTF(arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    var UTF = '', _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2)
            }
            UTF += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1
        } else {
            UTF += String.fromCharCode(_arr[i])
        }
    }
    return UTF;
}

module.exports = router;