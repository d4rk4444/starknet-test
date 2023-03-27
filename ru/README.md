# starknet-test
A script for automating actions on the Starknet network. Interacts with projects such as Starkgate, MySwap, StarknetId, NostraFinance.
Скрипт для автоматизации действий в сети Starknet. Взаимодействует с такими проектами, как Starkgate, MySwap, StarknetId, NostraFinance.

### Языки / Languages

- [English](en/README.md)
- [Русский](ru/README.md)

## Описание
Описание всех функций скрипта      

1. Мост с Mainet в Starknet [*Использует Starkgate и текущий gasPrice в сети*]   
2. Главная часть с рандомизацией действий в MySwap/StarknetId/NostraFinance    
    - MySwap
        - Свап ETH в USDC
        - Добавление ликвидности ETH/USDC
    - StarknetId
        - Минт Id с рандомным номером
    - NostraFinance
        - Депозит ETH
        - Заем ETH
        - Погашения ETH
        - Вывод ETH
3. Вывод ликвидности с MySwap и свап USDC в ETH
    - Вывод всей ликвидности
    - Вывод рандомного кол-ва ликвидности
4. Мост с Starknet в Mainet [*Записывает сумму ETH в файл amountBridge.txt*]
5. Вывод ETH со смарт-контракта Starkgate [*Берет сумму с файла amountBridge.txt*] **Удалите этот файл после использования функции!!!**
6. Выводит все ETH на нужные адреса [*Файл subWallet.txt*]
7. Deploy нового аккаунта [*Использует немного ETH*]
8. Выводит ваш Starknet адрес
0. Отмена
    
## Установка
```
git clone https://github.com/d4rk4444/starknet-test.git
cd starknet-test
npm i
```

## Настройка
Все нужные настройки в файле .env    
    
1. Время для паузы между действиями        
2. Время для паузы между кошельками       
3. Количество ETH для моста в сеть Starknet        
4. Количество ETH для обмена в сети Starknet (MySwap)    
5. Количество кругов для обменов в MySwap  
6. Проскальзывание для обмена/ликвидности в процентах

В файл privateArgnet.txt вставляете приватные адреса с ArgentX в таком формате:     
```
ключ1
ключ2
```
          
В файл privateETH.txt вставляете приватные адреса с Metamask в таком формате:    
```
ключ1
ключ2
```
## Запуск
```
node index
```