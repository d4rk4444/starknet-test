import fs from 'fs';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config()

export const timeout = ms => new Promise(res => setTimeout(res, ms));

export const shuffle = (array) => {
    let currentIndex = array.length,  randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const generateRandomAmount = (min, max, num) => {
    const amount = Number(Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min));
    return Number(parseFloat(amount).toFixed(num));
}

export const parseFile = (file) => {
    const data = fs.readFileSync(file, "utf-8");
    const array = (data.replace(/[^a-zA-Z0-9\n]/g,'')).split('\n');
    return array;
}

export const rpc = {
    Ethereum: 'https://rpc.ankr.com/eth',
    Starknet: process.env.RPC_STARKNET,
}

export const explorerTx = {
    Ethereum: 'https://etherscan.io/tx/',
    Starknet: 'https://voyager.online/tx/',
}

export const chainContract = {
    Ethereum: {
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        StarknetBridge: '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419',
    },
    Starknet: {
        ETH: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        ETHAbi: '0x48624e084dc68d82076582219c7ed8cb0910c01746cca3cd72a28ecfe07e42d',
        USDC: '0x053C91253BC9682c04929cA02ED00b3E423f6710D2ee7e0D5EBB06F3eCF368A8',
        USDCAbi: '0x048624E084dc68D82076582219C7eD8Cb0910c01746cca3cd72a28eCFE07e42d',
        ETHUSDCLP: '0x022b05f9396d2c48183f6deaf138a57522bcc8b35b67dee919f76403d1783136',
        MySwapRouter: '0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28',
        StarknetId: '0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af',
        NostraiETH: '0x070f8a4fcd75190661ca09a7300b7c93fab93971b67ea712c664d7948a8a54c6',
        NostradETH: '0x040b091cb020d91f4a4b34396946b4d4e2a450dbd9410432ebdbfe10e55ee5e5',
        StargateBridge: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        NostraiUSDC: '0x029959a546dda754dc823a7b8aa65862c5825faeaaf7938741d8ca6bfdc69e4e',
        NostradUSDC: '0x03b6058a9f6029b519bc72b2cc31bcb93ca704d0ab79fec2ae5d43f79ac07f7a'
    },
    approveAmount: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
}