# starknet-test
A script for automating actions on the Starknet network. Interacts with projects such as Starkgate, MySwap, StarknetId, NostraFinance.
Скрипт для автоматизации действий в сети Starknet. Взаимодействует с такими проектами, как Starkgate, MySwap, StarknetId, NostraFinance.

### Языки / Languages

- [English](en/README.md)
- [Русский](ru/README.md)

## Description
Description of all script functions:        

1. Mainnet to Starknet bridge [*Uses Starkgate and current gasPrice on the network*]   
2. Main part with randomized actions in MySwap/StarknetId/NostraFinance      
    - MySwap
        - Swap ETH to USDC
        - Add liquidity ETH/USDC
    - StarknetId
        - Mint Id with random number
    - NostraFinance
        - Deposit ETH
        - Borrow ETH
        - Repay ETH
        - Withdraw ETH
3. Withdraw liquidity from MySwap and swap USDC to ETH
    - Withdraw all liquidity
    - Withdraw random amount of liquidity
4. Starknet to Mainnet bridge [*Writes the amount of ETH to the amountBridge.txt file*]
5. Withdraw ETH from Starkgate smart contract [*Takes the amount from the amountBridge.txt file*] **Delete this file after using the function!!!**
6. Send all ETH to desired addresses [*Uses subWallet.txt file*]
7. Deploy a new account [*Uses some ETH*]
8. Output your Starknet address
0. Cancel
    
## Installation
```
git clone https://github.com/d4rk4444/starknet-test.git
cd starknet-test
npm i
```

## Configuration
All required settings are in the .env file    

1. Pause time between actions          
2. Pause time between wallets   
3. Amount of ETH for the Starknet bridge   
4. Amount of ETH for the exchange on Starknet (MySwap) 
5. Number of rounds for exchanges in MySwap    
6. Slippage for exchange/liquidity in percentage   

Insert private ArgentX addresses in the privateArgnet.txt file in this format:  
```
ключ1
ключ2
```
          
Insert private Metamask addresses in the privateETH.txt file in this format:    
```
ключ1
ключ2
```
## Usage
```
node index
```