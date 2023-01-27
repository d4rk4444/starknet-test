import { rpc, chainContract, timeout, shuffle, parseFile, generateRandomAmount } from 'tools-d4rk444/other.js';
import { sendEVMTX,
    privateToStarknetAddress,
    getAmountTokenStark,
    sendTransactionStarknet,
    getGasPriceEthereum,
    getApprovedStarknetId, dataMintStarknetId, numberToHex, getETHAmount, privateToAddress, estimateInvokeMaxFee } from 'tools-d4rk444/web3.js';
import { dataSwapEthToUsdc, dataSwapUsdcToEth, dataAddLiquidity, dataDeleteLiquidity } from 'tools-d4rk444/DEX.js';
import { dataDepositNostra, dataBorrowNostra, dataRepayNostra, dataWithdrawNostra } from 'tools-d4rk444/DEFI.js';
import { dataBridgeETHToStarknet, dataBridgeETHFromStarknet, dataWithdrawFromBridge } from 'tools-d4rk444/bridge.js';
import { subtract, multiply, divide, composition } from 'mathjs';
import fs from 'fs';
import readline from 'readline-sync';
import consoleStamp from 'console-stamp';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config();

consoleStamp(console, { format: ':date(HH:MM:ss)' });
const pauseTime = generateRandomAmount(process.env.TIMEOUT_SEC_MIN * 1000, process.env.TIMEOUT_SEC_MAX * 1000, 0);

const bridgeETHToStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);
    const amountETH = generateRandomAmount(process.env.ETH_BRIDGE_MIN * 10**18, process.env.ETH_BRIDGE_MAX * 10**18, 0);

    await getETHAmount(rpc.Ethereum, addressEthereum).then((res) => {
        if (Number(res) < amountETH) { throw new Error('Not enough ETH') };
    });

    //BRIDGE ETH TO STARKNET
    console.log(chalk.yellow(`Bridge ${amountETH / 10**18}ETH to Starknet`));
    await dataBridgeETHToStarknet(rpc.Ethereum, addressStarknet, addressEthereum).then(async(res) => {
        await getGasPriceEthereum().then(async(fee) => {
            await sendEVMTX(rpc.Ethereum,
                2,
                res.estimateGas,
                null,
                fee.maxFee,
                fee.maxPriorityFee,
                chainContract.Ethereum.StarknetBridge,
                amountETH,
                res.encodeABI,
                privateKeyEthereum);
        });
    });
    await timeout(pauseTime);
}

const mySwapStart = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start MySwap'));
    const address = await privateToStarknetAddress(privateKeyStarknet);
    const amountETH = generateRandomAmount(process.env.ETH_SWAP_MIN * 10**18, process.env.ETH_SWAP_MAX * 10**18, 0);

    await getAmountTokenStark(address, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then((res) => {
        if (Number(res) < amountETH) { throw new Error('Not enough ETH') };
    });

    //SWAP ETH -> USDC
    console.log(chalk.yellow(`Swap ETH -> USDC`));
    await dataSwapEthToUsdc(amountETH, 0.99).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);

    //ADD LIQ
    console.log(chalk.yellow(`Add Liqidity ETH/USDC`));
    await getAmountTokenStark(address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
        await dataAddLiquidity(res, 0.99).then(async(res) => {
            await sendTransactionStarknet(res, privateKeyStarknet);
        });
    });
    await timeout(pauseTime);
}

const mintStarknetId = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start StarknetId'));
    let status;
    let starknetId;

    while (!status) {
        starknetId = generateRandomAmount(1 * 10**11, 9 * 10**12 - 1, 0);
        await getApprovedStarknetId(starknetId).then((res) => {
            if (res) { status = true };
        });
    }

    console.log(chalk.yellow(`Mint StarknetId: ${starknetId}`));
    await dataMintStarknetId(starknetId).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);
}

const nostraFinance = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start Nostra Finance'));
    const address = await privateToStarknetAddress(privateKeyStarknet);

    console.log(chalk.yellow(`Deposit ETH`));
    await dataDepositNostra(address).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);
    
    console.log(chalk.yellow(`Borrow ETH`));
    await dataBorrowNostra(address).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);

    console.log(chalk.yellow(`Repay ETH`));
    await dataRepayNostra(address).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);

    console.log(chalk.yellow(`Withdraw ETH`));
    await dataWithdrawNostra(address).then(async(res) => {
        await sendTransactionStarknet(res, privateKeyStarknet);
    });
    await timeout(pauseTime);
}

const mySwapEnd = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start MySwapEnd'));
    const address = await privateToStarknetAddress(privateKeyStarknet);

    //WITHDRAW LIQ
    console.log(chalk.yellow(`Delete liquidity`));
    await getAmountTokenStark(address, chainContract.Starknet.ETHUSDCLP, chainContract.Starknet.ETHUSDCLP).then(async(res) => {
        await dataDeleteLiquidity(res, 0.99).then(async(res1) => {
            await sendTransactionStarknet(res1, privateKeyStarknet);
        });
    });
    await timeout(pauseTime);

    //SWAP USDC -> ETH
    console.log(chalk.yellow(`Swap USDC -> ETH`));
    await getAmountTokenStark(address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
        await dataSwapUsdcToEth(res, 0.99).then(async(res1) => {
            await sendTransactionStarknet(res1, privateKeyStarknet);
        });
    });
    await timeout(pauseTime);
}

const bridgeETHFromStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);

    console.log(chalk.yellow(`Bridge ETH to Starknet`));
    await getAmountTokenStark(addressStarknet, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then(async (res) => {
        if (Number(res) < 0.001 * 10**18) { throw new Error('Not enough ETH') };

        await dataBridgeETHFromStarknet(addressEthereum, 1).then(async(payload) => {
            await estimateInvokeMaxFee(payload, privateKeyStarknet).then(async(maxFee) => {
                const randomAmount = generateRandomAmount(2 * 10**8, 5 * 10**8, 0);
                const amountETH = subtract( subtract(res, maxFee), randomAmount);
                payload = await dataBridgeETHFromStarknet(addressEthereum, amountETH);
                await sendTransactionStarknet(payload, privateKeyStarknet);
                fs.writeFileSync("amountBridge.txt", `${amountETH}\n`, { flag: 'a+' });
            });
        });
    });
    await timeout(pauseTime);
}

const withdrawETHFromBridge = async(amountETH, privateKeyEthereum) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);

    console.log(chalk.yellow(`Withdraw ${amountETH / 10**18}ETH from Stargate`));
    await dataWithdrawFromBridge(amountETH, addressEthereum).then(async(res) => {
        await getGasPriceEthereum().then(async(fee) => {
            await sendEVMTX(rpc.Ethereum,
                2,
                res.estimateGas,
                null,
                fee.maxFee,
                fee.maxPriorityFee,
                chainContract.Ethereum.StarknetBridge,
                null,
                res.encodeABI,
                privateKeyEthereum);
        });
    });
    await timeout(pauseTime);
}

(async() => {
    const walletETH = parseFile('privateETH.txt');
    const walletSTARK = parseFile('privateArgent.txt');
    const mainPart = [mySwapStart, mintStarknetId, nostraFinance];
    const stage = [
        'Bridge to Starknet',
        'Main part [MySwap/StarknetId/Nostra Finance]',
        'Withdraw liquidity/Swap USDC to ETH [MySwap]',
        'Bridge to Ethereum',
        'Withdraw ETH from Stargate'
    ];
    const index = readline.keyInSelect(stage, 'Choose stage!');
    if (index == -1) { process.exit() };
    console.log(chalk.green(`Start ${stage[index]}`));

    for (let i = 0; i < walletSTARK.length; i++) {
        try {
            console.log(`Wallet ETH: ${privateToAddress(walletETH[i])}, Wallet Starknet: ${await privateToStarknetAddress(walletSTARK[i])}`);
        } catch (err) {
            throw new Error('Error: Add Private Keys!');
        }
        await timeout(pauseTime);

        if (stage[index] == stage[0]) {
            await bridgeETHToStarknet(walletETH[i], walletSTARK[i]);
            console.log('Process End!');
        } else if (stage[index] == stage[1]) {
            shuffle(mainPart);
            for (let s = 0; s < mainPart.length; s++) {
                await mainPart[s](walletSTARK[i]);
                await timeout(pauseTime);
            }
            console.log('Process End!');
        } else if (stage[index] == stage[2]) {
            await mySwapEnd(walletSTARK[i]);
            console.log('Process End!');
        } else if (stage[index] == stage[3]) {
            await bridgeETHFromStarknet(walletETH[i], walletSTARK[i]);
            console.log('Process End!');
        } else if (stage[index] == stage[4]) {
            const amountBridge = parseFile('amountBridge.txt');
            await withdrawETHFromBridge(amountBridge[i], walletETH[i]);
            console.log('Process End!');
        }
    }
})();