import { chainContract } from './other.js';
import { abiStarknetId } from './abi.js';
import { Contract, stark, RpcProvider, CallData } from 'starknet';

export const getApprovedStarknetId = async(rpc, starknetId) => {
    const provider = new RpcProvider({ nodeUrl: rpc });
    const contract = new Contract(abiStarknetId, chainContract.Starknet.StarknetId, provider);
    try {
        await contract.getApproved({type: 'struct', low: starknetId, high: '0'});
        return false;
    } catch (err) {
        return true;
    }
}

export const dataMintStarknetId = async(starknetId) => {
    return [{
        contractAddress: chainContract.Starknet.StarknetId,
        entrypoint: "mint",
        calldata: CallData.compile({
            starknet_id: starknetId.toString()
        })
    }];
}