import { CallData, cairo } from 'starknet';
import { chainContract } from './other.js';

//NOSTRA FINANCE STARKNET ETH
export const dataDepositNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.ETH,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.NostraiETH,
            amount: cairo.uint256('4000000000000000')
        })
    },
    {
        contractAddress: chainContract.Starknet.NostraiETH,
        entrypoint: "mint",
        calldata: CallData.compile({
            to: address,
            amount: cairo.uint256('4000000000000000')
        })
    }];
}

export const dataBorrowNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.NostradETH,
        entrypoint: "mint",
        calldata: CallData.compile({
            to: address,
            amount: cairo.uint256('2880000000000000')
        })
    }];
}

export const dataRepayNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.ETH,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.NostradETH,
            amount: cairo.uint256('2908800000000000')
        })
    },
    {
        contractAddress: chainContract.Starknet.NostradETH,
        entrypoint: "burn",
        calldata: CallData.compile({
            burnFrom: address,
            amount: cairo.uint256('0xffffffffffffffffffffffffffffffff')
        })
    }];
}

export const dataWithdrawNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.NostraiETH,
        entrypoint: "burn",
        calldata: CallData.compile({
            burnFrom: address,
            to: address,
            amount: cairo.uint256('0xffffffffffffffffffffffffffffffff')
        })
    }];
}

//NOSTRA FINANCE STARKNET USDC
export const dataDepositUSDCNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.USDC,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.NostraiUSDC,
            amount: cairo.uint256('5000000')
        })
    },
    {
        contractAddress: chainContract.Starknet.NostraiUSDC,
        entrypoint: "mint",
        calldata: CallData.compile({
            to: address,
            amount: cairo.uint256('5000000')
        })
    }];
}

export const dataBorrowUSDCNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.NostradUSDC,
        entrypoint: "mint",
        calldata: CallData.compile({
            to: address,
            amount: cairo.uint256('4275000')
        })
    }];
}

export const dataRepayUSDCNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.USDC,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.NostradUSDC,
            amount: cairo.uint256('4317750')
        })
    },
    {
        contractAddress: chainContract.Starknet.NostradUSDC,
        entrypoint: "burn",
        calldata: CallData.compile({
            burnFrom: address,
            amount: cairo.uint256('0xffffffffffffffffffffffffffffffff')
        })
    }];
}

export const dataWithdrawUSDCNostra = async(address) => {
    return [{
        contractAddress: chainContract.Starknet.NostraiUSDC,
        entrypoint: "burn",
        calldata: CallData.compile({
            burnFrom: address,
            to: address,
            amount: cairo.uint256('0xffffffffffffffffffffffffffffffff')
        })
    }];
}