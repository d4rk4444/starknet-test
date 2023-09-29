import Web3 from 'web3';
import { timeout, generateRandomAmount, rpc, chainContract, explorerTx } from './other.js';
import { abiToken, abiStarknetId } from './abi.js';
import { Account, Contract, ec, json, stark, Provider, hash, num, SequencerProvider, RpcProvider, CallData, cairo } from 'starknet';

//UTILS
export const privateToAddress = (privateKey) => {
    const w3 = new Web3();
    return w3.eth.accounts.privateKeyToAccount(privateKey).address;
}

export const privateToStarknetAddress = async(privateKey) => {
    //new Argent X account v0.2.3 :
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";  # 0x03e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328

    //const starkKeyPairAX = ec.getKeyPair(privateKey);
    //const starkKeyPubAX = ec.getStarkKey(starkKeyPairAX); 
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKey);

    // Calculate future address of the ArgentX account
    const AXproxyConstructorCallData = CallData.compile({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: starkKeyPubAX, guardian: "0" }),
    });

    let AXcontractAddress = hash.calculateContractAddressFromHash(
        starkKeyPubAX,
        argentXproxyClassHash,
        AXproxyConstructorCallData,
        0
    );
    AXcontractAddress = stark.makeAddress(AXcontractAddress);

    return AXcontractAddress;
}

export const toWei = (amount, type) => {
    const w3 = new Web3();
    return w3.utils.toWei(w3.utils.numberToHex(amount), type);
}

export const fromWei = (amount, type) => {
    const w3 = new Web3();
    return w3.utils.fromWei(w3.utils.numberToHex(amount), type);
}

export const numberToHex = (amount) => {
    const w3 = new Web3();
    return w3.utils.numberToHex(amount);
}

//TX
export const getETHAmount = async(rpc, walletAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const data = await w3.eth.getBalance(walletAddress);
    return data;
}

export const getAmountToken = async(rpc, tokenAddress, walletAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const token = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await token.methods.balanceOf(
        walletAddress
    ).call();

    return data;
}

export const checkAllowance = async(rpc, tokenAddress, walletAddress, spender) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const token = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await token.methods.allowance(
        walletAddress,
        spender
    ).call();

    return data;
}

export const getGasPrice = async(rpcProvider) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpcProvider));
    const gasPrice = await w3.eth.getGasPrice();
    const gasPriceInGwei = w3.utils.fromWei(gasPrice, 'Gwei');
    return gasPriceInGwei;
}

export const sendEVMTX = async(rpcProvider, typeTx, gasLimit, gasPrice, maxFee, maxPriorityFee, toAddress, value, data, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpcProvider));
    const fromAddress = privateToAddress(privateKey);
    
    const tx = {
        0: {
            'from': fromAddress,
            'gas': gasLimit,
            'gasPrice': w3.utils.toWei(gasPrice, 'Gwei'),
            'chainId': await w3.eth.getChainId(),
            'to': toAddress,
            'nonce': await w3.eth.getTransactionCount(fromAddress),
            'value': value,
            'data': data
        },
        2: {
            'from': fromAddress,
            'gas': gasLimit,
            'maxFeePerGas': w3.utils.toWei(maxFee, 'Gwei'),
            'maxPriorityFeePerGas': w3.utils.toWei(maxPriorityFee, 'Gwei'),
            'chainId': await w3.eth.getChainId(),
            'to': toAddress,
            'nonce': await w3.eth.getTransactionCount(fromAddress),
            'value': value,
            'data': data
        }
    };

    const signedTx = await w3.eth.accounts.signTransaction(tx[typeTx], privateKey);
    await w3.eth.sendSignedTransaction(signedTx.rawTransaction, async(error, hash) => {
        if (!error) {
            const chain = Object.keys(rpc)[Object.values(rpc).findIndex(e => e == rpcProvider)];
            console.log(`${chain} TX: ${explorerTx[chain] + hash}`);
        } else {
            console.log(`Error Tx: ${error}`);
        }
    });
}

//STARKNET
export const deployStarknetWallet = async(rpc, privateKeyStarknet) => {
    // connect provider
    const provider = new RpcProvider({ nodeUrl: rpc });

    //new Argent X account v0.2.3 :
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

    // Generate public and private key pair.
    //const starkKeyPairAX = ec.getKeyPair(privateKeyStarknet);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyStarknet);

    // Calculate future address of the ArgentX account
    const AXproxyConstructorCallData = CallData.compile({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: starkKeyPubAX, guardian: "0" }),
    });
    const AXcontractAddress = hash.calculateContractAddressFromHash(
        starkKeyPubAX,
        argentXproxyClassHash,
        AXproxyConstructorCallData,
        0
    );

    const accountAX = new Account(provider, AXcontractAddress, privateKeyStarknet);

    const deployAccountPayload = {
        classHash: argentXproxyClassHash,
        constructorCalldata: AXproxyConstructorCallData,
        contractAddress: AXcontractAddress,
        addressSalt: starkKeyPubAX };

    const { transaction_hash: AXdAth, contract_address: AXcontractFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    console.log(`✅ ArgentX wallet deployed at: ${AXcontractFinalAdress}`);
    console.log(`Transaction Hash: ${explorerTx.Starknet + AXdAth}`);
}

export const sendTransactionStarknet = async(rpc, payload, privateKey) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    const address = await privateToStarknetAddress(privateKey);
    const account = new Account(provider, address, privateKey, '1');

    try {
        const executeHash = await account.execute(payload);
        console.log(`Send TX: ${explorerTx.Starknet + executeHash.transaction_hash}`);
        const res = await provider.waitForTransaction(executeHash.transaction_hash);
        console.log(`Fee: ${parseFloat(num.hexToDecimalString(res.actual_fee) / 10**18).toFixed(6)}ETH`);
    } catch (err) {
        console.log(`Error Starknet TX: ${err}`);
    }
}

export const estimateInvokeMaxFee = async(rpc, payload, privateKey) => {
    const provider = new RpcProvider({ nodeUrl: rpc });
    const address = await privateToStarknetAddress(privateKey);
    const account = new Account(provider, address, privateKey, '1');

    const res = await account.estimateInvokeFee(payload);
    return cairo.uint256(res.suggestedMaxFee).low;
}

export const estimateMsgFee = async(l2Recipient, amountDeposit) => {
    const w3 = new Web3();
    const provider = new RpcProvider({ nodeUrl: rpc });

    const responseEstimateMessageFee = await provider.estimateMessageFee({
        from_address: '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419',
        to_address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        entry_point_selector: "handle_deposit",
        payload: [w3.utils.hexToNumberString(l2Recipient), amountDeposit, '0']
    });

    const msgFee = responseEstimateMessageFee.overall_fee;

    return msgFee;
}

export const getAmountTokenStark = async(rpc, walletAddress, tokenAddress, abiAddress) => {
    const provider = new RpcProvider({ nodeUrl: rpc });

    if (!abiAddress) { abiAddress = tokenAddress };
    const { abi: abi } = await provider.getClassAt(abiAddress);
    if (abi === undefined) { throw new Error("no abi.") };
    const contract = new Contract(abi, tokenAddress, provider);
    const balance = await contract.balanceOf(walletAddress);

    return cairo.uint256(balance.balance.low).low;
}
