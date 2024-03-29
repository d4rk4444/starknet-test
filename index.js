import { rpc, chainContract, timeout, shuffle, parseFile, generateRandomAmount } from './tools/other.js';
import { sendEVMTX,
    deployStarknetWallet,
    privateToStarknetAddress,
    getAmountTokenStark,
    sendTransactionStarknet,
    getETHAmount, privateToAddress, estimateInvokeMaxFee, estimateMsgFee, getGasPrice } from './tools/web3.js';
import { dataSwapEthToUsdc,
    dataSwapUsdcToEth,
    dataAddLiquidity,
    dataDeleteLiquidity,
    getETHAmountStarknet } from './tools/DEX.js';
import { dataDepositNostra,
    dataBorrowNostra,
    dataRepayNostra,
    dataWithdrawNostra,
    dataDepositUSDCNostra,
    dataBorrowUSDCNostra,
    dataRepayUSDCNostra,
    dataWithdrawUSDCNostra } from './tools/DeFi.js';
import { dataBridgeETHToStarknet, dataBridgeETHToStarknetAmount, dataBridgeETHFromStarknet, dataWithdrawFromBridge } from './tools/bridge.js';
import { getApprovedStarknetId, dataMintStarknetId } from './tools/starkId.js';
import { subtract, multiply, divide, composition, add } from 'mathjs';
import fs from 'fs';
import readline from 'readline-sync';
import consoleStamp from 'console-stamp';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { starknetId } from 'starknet';
dotenv.config();

const output = fs.createWriteStream(`history.log`, { flags: 'a' });
const logger = new console.Console(output);
consoleStamp(console, { format: ':date(HH:MM:ss)' });
consoleStamp(logger, { format: ':date(yyyy/mm/dd HH:MM:ss)', stdout: output });

const pauseTime = generateRandomAmount(process.env.TIMEOUT_ACTION_SEC_MIN * 1000, process.env.TIMEOUT_ACTION_SEC_MAX * 1000, 0);
const pauseWalletTime = generateRandomAmount(process.env.TIMEOUT_WALLET_SEC_MIN * 1000, process.env.TIMEOUT_WALLET_SEC_MAX * 1000, 0);
const slippage = generateRandomAmount(1 - process.env.SLIPPAGE_MIN / 100, 1 - process.env.SLIPPAGE_MAX / 100, 3);

const bridgeETHToStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);
    const amountETH = generateRandomAmount(process.env.ETH_BRIDGE_MIN * 10**18, process.env.ETH_BRIDGE_MAX * 10**18, 0);

    const balanceETH = await getETHAmount(rpc.Ethereum, addressEthereum);
    if (Number(balanceETH) < amountETH) {
        console.log(chalk.red('Not enough ETH'));
        logger.log('Not enough ETH');
        return;
    };

    //BRIDGE ETH TO STARKNET
    console.log(chalk.yellow(`Bridge ${amountETH / 10**18}ETH to Starknet`));
    logger.log(`Bridge ${amountETH / 10**18}ETH to Starknet`);
    try {
        await estimateMsgFee(addressStarknet, amountETH.toString()).then(async(msgFee) => {
            const value = add(amountETH, msgFee);
            await dataBridgeETHToStarknetAmount(rpc.Ethereum, amountETH, value, addressStarknet, addressEthereum).then(async(res) => {     
                await getGasPrice(rpc.Ethereum).then(async(fee) => {
                    await sendEVMTX(rpc.Ethereum,
                        2,
                        res.estimateGas,
                        '0',
                        (parseInt(multiply(fee, 1.15))).toString(),
                        '1.5',
                        chainContract.Ethereum.StarknetBridge,
                        value,
                        res.encodeABI,
                        privateKeyEthereum);
                });
            });
        });
        await timeout(pauseTime);
    } catch (err) {
        logger.log(err);
        throw new Error(err);
    }
}

const bridgePercentETHToStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);

    //BRIDGE ETH TO STARKNET
    try {
        let amountETH = 1000;
        await estimateMsgFee(addressStarknet, amountETH.toString()).then(async(msgFee) => {
            let value = add(amountETH, msgFee);
            await dataBridgeETHToStarknetAmount(rpc.Ethereum, amountETH, value, addressStarknet, addressEthereum).then(async(res) => {
                await getGasPriceEthereum().then(async(fee) => {
                    const amountFee = parseInt(multiply(res.estimateGas, add((parseInt(multiply(fee.maxFee, 1.15))).toString(), fee.maxPriorityFee * 10**9)) + msgFee);
                    await getETHAmount(rpc.Ethereum, addressEthereum).then(async(amountETH) => {
                        amountETH = subtract(amountETH, amountFee);
                        const random = generateRandomAmount(process.env.PERCENT_BRIDGE_MIN / 100, process.env.PERCENT_BRIDGE_MAX / 100, 3);
                        amountETH = parseInt(multiply(amountETH, random));
                        await estimateMsgFee(addressStarknet, amountETH.toString()).then(async(msgFee1) => {
                            value = add(amountETH, msgFee1);
                            console.log(chalk.yellow(`Bridge ${amountETH / 10**18}ETH to Starknet`));
                            logger.log(`Bridge ${amountETH / 10**18}ETH to Starknet`);
                            await dataBridgeETHToStarknetAmount(rpc.Ethereum, amountETH, value, addressStarknet, addressEthereum).then(async(res1) => {
                                await sendEVMTX(rpc.Ethereum,
                                    2,
                                    res1.estimateGas,
                                    '0',
                                    (parseInt(multiply(fee.maxFee, 1.15))).toString(),
                                    fee.maxPriorityFee,
                                    chainContract.Ethereum.StarknetBridge,
                                    value,
                                    res1.encodeABI,
                                    privateKeyEthereum);
                            });
                        });
                    });
                });
            });
        });
        await timeout(pauseTime);
    } catch (err) {
        logger.log(err);
        throw new Error(err);
    }
}

const mySwapStart = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start MySwap'));
    logger.log('Start MySwap');
    const address = await privateToStarknetAddress(privateKeyStarknet);
    const quantity = generateRandomAmount(process.env.QUANTITY_SWAP_MIN, process.env.QUANTITY_SWAP_MAX, 0);
    let isReady;

    for (let i = 0; i < quantity; i++) {
        if (i == 0) {
            console.log(`Random ${quantity} cicrcles`);
            logger.log(`Random ${quantity} cicrcles`);
        }
        console.log(`Circle #${i+1}`);
        logger.log(`Circle #${i+1}`);
        const amountETH = generateRandomAmount(process.env.ETH_SWAP_MIN * 10**18, process.env.ETH_SWAP_MAX * 10**18, 0);
        const balancerToken = await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi);
        if (Number(balancerToken) < amountETH) {
            console.log(chalk.red('Not enough ETH'));
            logger.log('Not enough ETH');
            return;
        };

        isReady = false;
        while(!isReady) {
            //SWAP ETH -> USDC
            console.log(chalk.yellow(`Swap ETH -> USDC`));
            logger.log(`Swap ETH -> USDC`);
            try {
                await dataSwapEthToUsdc(rpc.Starknet, amountETH, slippage).then(async(res) => {
                    await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }

            await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
                if (res == 0) {
                    console.log(chalk.red(`Error Swap, try again`));
                    logger.log(`Error Swap, try again`);
                } else if (res > 0) {
                    isReady = true;
                    console.log(chalk.magentaBright(`Swap ETH -> USDC Successful`));
                    logger.log(`Swap ETH -> USDC Successful`);
                    await timeout(pauseTime);
                }
            });
        }

        if (i < quantity - 1) {
            isReady = false;
            while(!isReady) {
                //SWAP USDC -> ETH
                console.log(chalk.yellow(`Swap USDC -> ETH`));
                logger.log(`Swap USDC -> ETH`);
                await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
                    try {    
                        await dataSwapUsdcToEth(rpc.Starknet, res, slippage).then(async(res1) => {  
                            await sendTransactionStarknet(rpc.Starknet, res1, privateKeyStarknet); 
                        });
                    } catch (err) {
                        logger.log(err.message);
                        console.log(err.message);
                        await timeout(pauseTime);
                    }
                });

                await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then(async(res) => {
                    if (res == 0) {
                        console.log(chalk.red(`Error Swap, try again`));
                        logger.log(`Error Swap, try again`);
                    } else if (res > 0) {
                        isReady = true;
                        console.log(chalk.magentaBright(`Swap USDC -> ETH Successful`));
                        logger.log(`Swap USDC -> ETH Successful`);
                        await timeout(pauseTime);
                    }
                });
            }
        }
    }

    isReady = false;
    while(!isReady) {
        //ADD LIQ
        console.log(chalk.yellow(`Add Liqidity ETH/USDC`));
        logger.log(`Add Liqidity ETH/USDC`);
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            try {
                await dataAddLiquidity(rpc.Starknet, res, slippage).then(async(res) => {
                    await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }
        });

        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETHUSDCLP, chainContract.Starknet.ETHUSDCLP).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Add Liqidity, try again`));
                logger.log(`Error Add Liqidity, try again`);
            } else if (res > 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Add Liqidity Successful`));
                logger.log(`Add Liqidity Successful`);
                await timeout(pauseTime);
            }
        });
    }
}

const mintStarknetId = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start StarknetId'));
    logger.log('Start StarknetId');
    let status;
    let starknetId;
    let isReady;

    while(!status) {
        starknetId = generateRandomAmount(1 * 10**11, 9 * 10**12 - 1, 0);
        await getApprovedStarknetId(rpc.Starknet, starknetId).then((res) => {
            if (res) { status = true };
        });
    }

    while(!isReady) {
        console.log(chalk.yellow(`Mint StarknetId: ${starknetId}`));
        logger.log(`Mint StarknetId: ${starknetId}`);
        try {
            await dataMintStarknetId(starknetId).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
                isReady = true;
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }
    }
}

const nostraFinance = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start Nostra Finance ETH'));
    logger.log('Start Nostra Finance ETH');
    const address = await privateToStarknetAddress(privateKeyStarknet);
    let isReady;

    while(!isReady) {
        console.log(chalk.yellow(`Deposit ETH`));
        logger.log(`Deposit ETH`);
        await dataDepositNostra(address).then(async(res) => {
            await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
        });

        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostraiETH, chainContract.Starknet.NostraiETH).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Deposit, try again`));
                logger.log(`Error Deposit, try again`);
            } else if (res > 0) {
                isReady = true;
                await timeout(pauseTime);
            }
        });
    }
    
    isReady = false;
    while(!isReady) {
        console.log(chalk.yellow(`Borrow ETH`));
        logger.log(`Borrow ETH`);
        await dataBorrowNostra(address).then(async(res) => {
            await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
        });
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostradETH, chainContract.Starknet.NostradETH).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Borrow, try again`));
                logger.log(`Error Borrow, try again`);
            } else if (res > 0) {
                isReady = true;
                await timeout(pauseTime);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        console.log(chalk.yellow(`Repay ETH`));
        logger.log(`Repay ETH`);
        await dataRepayNostra(address).then(async(res) => {
            await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
        });
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostradETH, chainContract.Starknet.NostradETH).then(async(res) => {
            if (res == 0) {
                isReady = true;
                await timeout(pauseTime);
            } else if (res > 0) {
                console.log(chalk.red(`Error Repay, try again`));
                logger.log(`Error Repay, try again`);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        console.log(chalk.yellow(`Withdraw ETH`));
        logger.log(`Withdraw ETH`);
        await dataWithdrawNostra(address).then(async(res) => {
            await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
        });
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostraiETH, chainContract.Starknet.NostraiETH).then(async(res) => {
            if (res == 0) {
                isReady = true;
                await timeout(pauseTime);
            } else if (res > 0) {
                console.log(chalk.red(`Error Withdraw, try again`));
                logger.log(`Error Withdraw, try again`);
            }
        });
    }
}

const nostraFinanceUSDC = async(privateKeyStarknet) => {
    console.log(chalk.cyan('Start Nostra Finance USDC'));
    logger.log('Start Nostra Finance USDC');
    const address = await privateToStarknetAddress(privateKeyStarknet);
    let isReady;

    while(!isReady) {
        //SWAP ETH -> USDC
        console.log(chalk.yellow(`Swap ETH -> USDC`));
        logger.log(`Swap ETH -> USDC`);
        const amountETH = await getETHAmountStarknet(rpc.Starknet, '5150000', 0.98);
        try {
            await dataSwapEthToUsdc(rpc.Starknet, amountETH, slippage).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }

        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            if (res < 5 * 10**6) {
                console.log(chalk.red(`Error Swap, try again`));
                logger.log(`Error Swap, try again`);
            } else if (res >= 5 * 10**6) {
                isReady = true;
                console.log(chalk.magentaBright(`Swap ETH -> USDC Successful`));
                logger.log(`Swap ETH -> USDC Successful`);
                await timeout(pauseTime);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        //DEPOSIT USDC
        console.log(chalk.yellow(`Deposit USDC`));
        logger.log(`Deposit USDC`);
        try {
            await dataDepositUSDCNostra(address).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }
        
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostraiUSDC, chainContract.Starknet.NostraiUSDC).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Deposit USDC, try again`));
                logger.log(`Error Deposit USDC, try again`);
            } else if (res > 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Deposit USDC Successful`));
                logger.log(`Deposit USDC Successful`);
                await timeout(pauseTime);
            }
        });
    }
    
    isReady = false;
    while(!isReady) {
        //BORROW USDC
        console.log(chalk.yellow(`Borrow USDC`));
        logger.log(`Borrow USDC`);
        try {
            await dataBorrowUSDCNostra(address).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }
        
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostradUSDC, chainContract.Starknet.NostradUSDC).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Borrow, try again`));
                logger.log(`Error Borrow, try again`);
            } else if (res > 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Borrow USDC Successful`));
                logger.log(`Borrow USDC Successful`);
                await timeout(pauseTime);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        //REPAY USDC
        console.log(chalk.yellow(`Repay USDC`));
        logger.log(`Repay USDC`);
        try {
            await dataRepayUSDCNostra(address).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }
        
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostradUSDC, chainContract.Starknet.NostradUSDC).then(async(res) => {
            if (res == 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Repay USDC Successful`));
                logger.log(`Repay USDC Successful`);
                await timeout(pauseTime);
            } else if (res > 0) {
                console.log(chalk.red(`Error Repay, try again`));
                logger.log(`Error Repay, try again`);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        //WITHDRAW USDC
        console.log(chalk.yellow(`Withdraw USDC`));
        logger.log(`Withdraw USDC`);
        try {
            await dataWithdrawUSDCNostra(address).then(async(res) => {
                await sendTransactionStarknet(rpc.Starknet, res, privateKeyStarknet);
            });
        } catch (err) {
            logger.log(err.message);
            console.log(err.message);
            await timeout(pauseTime);
        }
        
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.NostraiUSDC, chainContract.Starknet.NostraiUSDC).then(async(res) => {
            if (res == 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Withdraw USDC Successful`));
                logger.log(`Withdraw USDC Successful`);
                await timeout(pauseTime);
            } else if (res > 0) {
                console.log(chalk.red(`Error Withdraw, try again`));
                logger.log(`Error Withdraw, try again`);
            }
        });
    }

    isReady = false;
    while(!isReady) {
        //SWAP USDC -> ETH
        console.log(chalk.yellow(`Swap USDC -> ETH`));
        logger.log(`Swap USDC -> ETH`);
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            try {
                await dataSwapUsdcToEth(rpc.Starknet, res, slippage).then(async(res1) => {
                    await sendTransactionStarknet(rpc.Starknet, res1, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }
        });

        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            if (res > 0) {
                console.log(chalk.red(`Error Swap, try again`));
                logger.log(`Error Swap, try again`);
            } else if (res == 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Swap USDC -> ETH Successful`));
                logger.log(`Swap USDC -> ETH Successful`);
                await timeout(pauseTime);
            }
        });
    }
}

const mySwapEnd = async(privateKeyStarknet, workType) => {
    console.log(chalk.cyan('Start MySwapEnd'));
    logger.log('Start MySwapEnd');
    const address = await privateToStarknetAddress(privateKeyStarknet);
    let isReady;

    while(!isReady) {
        //WITHDRAW LIQ
        console.log(chalk.yellow(`Delete liquidity`));
        logger.log(`Delete liquidity`);
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETHUSDCLP, chainContract.Starknet.ETHUSDCLP).then(async(res) => {
            if (workType == 1) {
                res = parseInt(multiply(res, generateRandomAmount(0.97, 0.99, 3)));
            }
            try {
                await dataDeleteLiquidity(rpc.Starknet, res, slippage).then(async(res1) => {
                    await sendTransactionStarknet(rpc.Starknet, res1, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }
            
            await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETHUSDCLP, chainContract.Starknet.ETHUSDCLP).then(async(res1) => {
                const needAmountLP = parseInt(multiply(res, 0.03));
                if (res1 > needAmountLP) {
                    console.log(chalk.red(`Error Delete liquidity, try again`));
                    logger.log(`Error Delete liquidity, try again`);
                } else if (res1 <= needAmountLP) {
                    isReady = true;
                    console.log(chalk.magentaBright(`Delete liquidity Successful`));
                    logger.log(`Delete liquidity Successful`);
                    await timeout(pauseTime);
                }
            });
        });
    }

    isReady = false;
    while(!isReady) {
        //SWAP USDC -> ETH
        console.log(chalk.yellow(`Swap USDC -> ETH`));
        logger.log(`Swap USDC -> ETH`);
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            try {
                await dataSwapUsdcToEth(rpc.Starknet, res, slippage).then(async(res1) => {
                    await sendTransactionStarknet(rpc.Starknet, res1, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }
        });

        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            if (res > 0) {
                console.log(chalk.red(`Error Swap, try again`));
                logger.log(`Error Swap, try again`);
            } else if (res == 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Swap USDC -> ETH Successful`));
                logger.log(`Swap USDC -> ETH Successful`);
                await timeout(pauseTime);
            }
        });
    }
}

const bridgeETHFromStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);
    let isReady;

    while(!isReady) {
        console.log(chalk.yellow(`Bridge ETH to Ethereum`));
        logger.log(`Bridge ETH to Ethereum`);
        const balanceETH = await getAmountTokenStark(rpc.Starknet, addressStarknet, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi);
        if (Number(balanceETH) < 0.001 * 10**18) { 
            console.log(chalk.red('Not enough ETH'));
            logger.log('Not enough ETH');
            return;
        };
        await getAmountTokenStark(rpc.Starknet, addressStarknet, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then(async (res) => {
            try {
                await dataBridgeETHFromStarknet(addressEthereum, 1).then(async(payload) => {
                    await estimateInvokeMaxFee(rpc.Starknet, payload, privateKeyStarknet).then(async(maxFee) => {
                        const randomAmount = generateRandomAmount(2 * 10**12, 5 * 10**12, 0);
                        const amountETH = subtract( subtract(res, maxFee), randomAmount);
                        payload = await dataBridgeETHFromStarknet(addressEthereum, amountETH);
                        console.log(payload)
                        await sendTransactionStarknet(rpc.Starknet, payload, privateKeyStarknet);
                        fs.writeFileSync("amountBridge.txt", `${amountETH}\n`, { flag: 'a+' });
                        isReady = true;
                        await timeout(pauseTime);
                    });
                });
            } catch (err) {
                logger.log(err);
                console.log(err.message);
                await timeout(pauseTime);
            };
        });   
    }
}

const withdrawETHFromBridge = async(amountETH, privateKeyEthereum) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);

    console.log(chalk.yellow(`Withdraw ${amountETH / 10**18}ETH from Stargate`));
    logger.log(`Withdraw ${amountETH / 10**18}ETH from Stargate`);
    try {
        await dataWithdrawFromBridge(rpc.Ethereum, amountETH, addressEthereum).then(async(res) => {
            await getGasPrice(rpc.Ethereum).then(async(fee) => {
                await sendEVMTX(rpc.Ethereum,
                    2,
                    res.estimateGas,
                    '0',
                    (parseInt(multiply(fee, 1.15))).toString(),
                    '1',
                    chainContract.Ethereum.StarknetBridge,
                    null,
                    res.encodeABI,
                    privateKeyEthereum);
            });
        });
        await timeout(pauseTime);
    } catch (err) {
        console.log(err);
        logger.log(err);
    }
}

const swapUSDCToETH = async(privateKeyStarknet) => {
    const address = await privateToStarknetAddress(privateKeyStarknet);
    
    let isReady;
    while(!isReady) {
        //SWAP USDC -> ETH
        console.log(chalk.yellow(`Swap USDC -> ETH`));
        logger.log(`Swap USDC -> ETH`);
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.USDC, chainContract.Starknet.USDCAbi).then(async(res) => {
            console.log(res)
            try {
                await dataSwapUsdcToEth(rpc.Starknet, res, slippage).then(async(res1) => {
                    await sendTransactionStarknet(rpc.Starknet, res1, privateKeyStarknet);
                });
            } catch (err) {
                logger.log(err.message);
                console.log(err.message);
                await timeout(pauseTime);
            }
        });
        
        await getAmountTokenStark(rpc.Starknet, address, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then(async(res) => {
            if (res == 0) {
                console.log(chalk.red(`Error Swap, try again`));
                logger.log(`Error Swap, try again`);
            } else if (res > 0) {
                isReady = true;
                console.log(chalk.magentaBright(`Swap USDC -> ETH Successful`));
                logger.log(`Swap USDC -> ETH Successful`);
                await timeout(pauseTime);
            }
        });
    }
}

const getStarknetAddress = async(privateKeyStarknet) => {
    const address = await privateToStarknetAddress(privateKeyStarknet);
    console.log(`Address: ${address}`);
}

(async() => {
    const walletETH = parseFile('privateETH.txt');
    const walletSTARK = parseFile('privateArgent.txt');
    const mainPart = [mySwapStart, mintStarknetId];
    const stage = [
        'Bridge to Starknet',
        'Main part [MySwap/StarknetId/Nostra Finance]',
        'Withdraw liquidity/Swap USDC to ETH [MySwap]',
        'Bridge to Ethereum',
        'Withdraw ETH from Stargate',
        'Deploy Account',
        'Get Starknet Address',
        '2/3/4 Stage with 100% withdraw liq',
        'Swap USDC -> ETH',
        'NOSTRA FINANCE USDC',
        'Bridge PERCENT to Starknet'
    ];
    const stageSecond = [
        'Withdraw ALL',
        'Withdraw Random [1-3%]'
    ];

    const index = readline.keyInSelect(stage, 'Choose stage!');
    if (index == -1) { process.exit() };
    console.log(chalk.green(`Start ${stage[index]}`));
    logger.log(`Start ${stage[index]}`);

    for (let i = 0; i < walletETH.length; i++) {
        try {
            console.log(chalk.blue(`Wallet ${i+1} Wallet ETH: ${privateToAddress(walletETH[i])}, Wallet Starknet: ${await privateToStarknetAddress(walletSTARK[i])}`));
            logger.log(`Wallet ${i+1} Wallet ETH: ${privateToAddress(walletETH[i])}, Wallet Starknet: ${await privateToStarknetAddress(walletSTARK[i])}`);
        } catch (err) {
            console.log(err);
            return;
        }

        if (index == 0) {
            await bridgeETHToStarknet(walletETH[i], walletSTARK[i]);
        } else if (index == 1) {
            shuffle(mainPart);
            for (let s = 0; s < mainPart.length; s++) {
                await mainPart[s](walletSTARK[i]);
            }
        } else if (index == 2) {
            const indexSecond = readline.keyInSelect(stageSecond, 'Choose stage!');
            if (indexSecond == -1) { process.exit() };
            console.log(chalk.green(`Start ${stageSecond[indexSecond]}`));
            logger.log(`Start ${stageSecond[indexSecond]}`);

            if (indexSecond == 0) {
                await mySwapEnd(walletSTARK[i], 0);
            } else if (indexSecond == 1) {
                await mySwapEnd(walletSTARK[i], 1);
            }
        } else if (index == 3) {
            await bridgeETHFromStarknet(walletETH[i], walletSTARK[i]);
        } else if (index == 4) {
            const amountBridge = parseFile('amountBridge.txt');
            await withdrawETHFromBridge(amountBridge[i], walletETH[i]);
        } else if (index == 5) {
            await deployStarknetWallet(rpc.Starknet, walletSTARK[i]);
        } else if (index == 6) {
            await getStarknetAddress(walletSTARK[i]);
        } else if (index == 7) {
            console.log(chalk.green(`Start Main part [MySwap/StarknetId/Nostra Finance]`));
            logger.log(`Start Main part [MySwap/StarknetId/Nostra Finance]`);
            shuffle(mainPart);
            for (let s = 0; s < mainPart.length; s++) {
                await mainPart[s](walletSTARK[i]);
            }
            await timeout(pauseTime);

            console.log(chalk.green(`Start Withdraw liquidity/Swap USDC to ETH [MySwap]`));
            logger.log(`Start Withdraw liquidity/Swap USDC to ETH [MySwap]`);
            await mySwapEnd(walletSTARK[i], 0);
            await timeout(pauseTime);

            console.log(chalk.green(`Start Bridge to Ethereum`));
            logger.log(`Start Bridge to Ethereum`);
            await bridgeETHFromStarknet(walletETH[i], walletSTARK[i]);
            await timeout(pauseTime);
        } else if (index == 8) {
            await swapUSDCToETH(walletSTARK[i]);
        } else if (index == 9) {
            await nostraFinanceUSDC(walletSTARK[i]);
        } else if (index == 10) {
            await bridgePercentETHToStarknet(walletETH[i], walletSTARK[i]);
        }

        await timeout(pauseWalletTime);
    }
    console.log(chalk.bgMagentaBright('Process End!'));
    logger.log('Process End!');
})();