import Web3 from 'web3';
import { stark } from 'starknet';
import { abiStarknetBridge } from './abi.js';
import { chainContract } from './other.js';

//STARKNET
export const dataBridgeETHToStarknet = async(rpc, toStarknetAddress, fromAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contractSwap = new w3.eth.Contract(abiStarknetBridge, w3.utils.toChecksumAddress(chainContract.Ethereum.StarknetBridge));

    const data = await contractSwap.methods.deposit(
        w3.utils.hexToNumberString(toStarknetAddress)
    );

    const encodeABI = data.encodeABI();
    const estimateGas = await data.estimateGas({ from: fromAddress });
    return { encodeABI, estimateGas };
}

export const dataBridgeETHToStarknetAmount = async(rpc, amount, value, toStarknetAddress, fromAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contractSwap = new w3.eth.Contract(abiStarknetBridge, w3.utils.toChecksumAddress(chainContract.Ethereum.StarknetBridge));

    const data = await contractSwap.methods.deposit(
        w3.utils.numberToHex(amount),
        w3.utils.hexToNumberString(toStarknetAddress)
    );

    const encodeABI = data.encodeABI();
    const estimateGas = await data.estimateGas({ from: fromAddress, value: value });
    return { encodeABI, estimateGas };
}

export const dataBridgeETHFromStarknet = async(toAddress, amount) => {
    return [{
        contractAddress: chainContract.Starknet.StargateBridge,
        entrypoint: "initiate_withdraw",
        calldata: stark.compileCalldata({
            l1_recipient: toAddress,
            amount: {type: 'struct', low: amount.toString(), high: '0'}
        })
    }];
}

export const dataWithdrawFromBridge = async(rpc, amount, toAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contractSwap = new w3.eth.Contract(abiStarknetBridge, w3.utils.toChecksumAddress(chainContract.Ethereum.StarknetBridge));

    const data = await contractSwap.methods.withdraw(
        amount,
        toAddress
    );

    const encodeABI = data.encodeABI();
    const estimateGas = await data.estimateGas({ from: toAddress });
    return { encodeABI, estimateGas };
}