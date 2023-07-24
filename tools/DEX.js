import { subtract, multiply, divide } from 'mathjs';
import { chainContract } from './other.js';
import { abiMySwapStarknet} from './abi.js';
import { Account, Contract, stark, cairo, RpcProvider, CallData } from 'starknet';
import * as dotenv from 'dotenv';
dotenv.config()

//MYSWAP STARKNET
export const getUSDCAmountStarknet = async(rpc, amountETH, slippage) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    const contract = new Contract(abiMySwapStarknet, chainContract.Starknet.MySwapRouter, provider);
    const pool = (await contract.get_pool('0x01')).pool;
    const poolETH = cairo.uint256(pool.token_a_reserves.low).low;
    const poolUSDC = cairo.uint256(pool.token_b_reserves.low).low;
    const price = parseInt( multiply( parseInt( (poolUSDC / 10**6) / (poolETH / 10**18) * 10**6 ) * (amountETH / 10**18), slippage ) );

    return price;
}

export const getETHAmountStarknet = async(rpc, amountUSDC, slippage) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    const contract = new Contract(abiMySwapStarknet, chainContract.Starknet.MySwapRouter, provider);
    const pool = (await contract.get_pool('0x01')).pool;
    const poolETH = cairo.uint256(pool.token_a_reserves.low).low;
    const poolUSDC = cairo.uint256(pool.token_b_reserves.low).low;
    const price = parseInt( multiply( parseInt( (poolETH / 10**18) / (poolUSDC / 10**6) * 10**18 ) * (amountUSDC / 10**6), slippage ) );

    return price;
}

export const dataSwapEthToUsdc = async(rpc, amountETH, slippage) => {
    const amountUSDC = await getUSDCAmountStarknet(rpc, amountETH, slippage);

    const payload = [{
        contractAddress: chainContract.Starknet.ETH,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.MySwapRouter,
            amount: cairo.uint256(amountETH)
        })
    },
    {
        contractAddress: chainContract.Starknet.MySwapRouter,
        entrypoint: "swap",
        calldata: CallData.compile({
            pool_id: '0x01',
            token_from_addr: chainContract.Starknet.ETH,
            amount_from: cairo.uint256(amountETH),
            amount_to_min: cairo.uint256(amountUSDC)
        })
    }];

    return payload;
}

export const dataSwapUsdcToEth = async(rpc, amountUSDC, slippage) => {
    const amountETH = await getETHAmountStarknet(rpc, amountUSDC, slippage);

    const payload = [{
        contractAddress: chainContract.Starknet.USDC,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.MySwapRouter,
            amount: cairo.uint256(amountUSDC)
        })
    },
    {
        contractAddress: chainContract.Starknet.MySwapRouter,
        entrypoint: "swap",
        calldata: CallData.compile({
            pool_id: '0x01',
            token_from_addr: chainContract.Starknet.USDC,
            amount_from: cairo.uint256(amountUSDC),
            amount_to_min: cairo.uint256(amountETH)
        })
    }];

    return payload;
}

export const dataAddLiquidity = async(rpc, amountUSDC, slippage) => {
    const amountETH = await getETHAmountStarknet(rpc, amountUSDC, 1);
    const minAmountETH = parseInt( multiply(amountETH, slippage) );
    const minAmountUSDC = parseInt( multiply(amountUSDC, slippage) );

    const payload = [{
        contractAddress: chainContract.Starknet.ETH,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.MySwapRouter,
            amount: cairo.uint256(amountETH)
        })
    },
    {
        contractAddress: chainContract.Starknet.USDC,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.MySwapRouter,
            amount: cairo.uint256(amountUSDC)
        })
    },
    {
        contractAddress: chainContract.Starknet.MySwapRouter,
        entrypoint: "add_liquidity",
        calldata: CallData.compile({
            a_address: chainContract.Starknet.ETH,
            a_amount: cairo.uint256(amountETH),
            a_min_amount: cairo.uint256(minAmountETH),
            b_address: chainContract.Starknet.USDC,
            b_amount: cairo.uint256(amountUSDC),
            b_min_amount: cairo.uint256(minAmountUSDC)
        })
    }];

    return payload;
}

export const getValueTokensLPMySwap = async(rpc, amountLP, slippage) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    const contract = new Contract(abiMySwapStarknet, chainContract.Starknet.MySwapRouter, provider);
    let totalLP = (await contract.get_total_shares('0x01')).total_shares;
    totalLP = cairo.uint256(totalLP.low).low;

    const pool = (await contract.get_pool('0x01')).pool;
    const totalPool = multiply( cairo.uint256(pool.token_b_reserves.low).low, 2);
    let amountUSDC = parseInt( divide( multiply( divide(totalPool, totalLP), amountLP), 2 ) );

    const amountETH = await getETHAmountStarknet(rpc, amountUSDC, slippage);
    amountUSDC = parseInt( multiply(amountUSDC, slippage) );

    return { amountETH, amountUSDC };
}

export const dataDeleteLiquidity = async(rpc, amountLP, slippage) => {
    const valueLP = await getValueTokensLPMySwap(rpc, amountLP, slippage);

    const payload = [{
        contractAddress: chainContract.Starknet.ETHUSDCLP,
        entrypoint: "approve",
        calldata: CallData.compile({
            spender: chainContract.Starknet.MySwapRouter,
            amount: cairo.uint256(amountLP) //{type: 'struct', low: .toString(), high: '0'},
        })
    },
    {
        contractAddress: chainContract.Starknet.MySwapRouter,
        entrypoint: "withdraw_liquidity",
        calldata: CallData.compile({
            pool_id: '0x01',
            shares_amount: cairo.uint256(amountLP),
            amount_min_a: cairo.uint256(valueLP.amountETH),
            amount_min_b: cairo.uint256(valueLP.amountUSDC)
        })
    }];

    return payload;
}