# starknet-test
Скрипт и точка

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
4. Мост с Starknet в Mainet [*Записывает сумму ETH в файл amountBridge.txt*]
5. Вывод ETH со смарт-контракта Starkgate [*Берет сумму с файла amountBridge.txt*] **Удалите этот файл после использования функции!!!**
6. Выводит все ETH на нужные адреса [*Файл subWallet.txt*]
7. Deploy нового аккаунта [*Использует немного ETH*]
8. Выводит ваш Starknet адрес
9. Погашение/Вывод если остались в Nostra Finance [*Если будут сбои/ошибка в кол-ве комиссии блока*]
0. Отмена
    
## Установка
```
git clone https://github.com/d4rk4444/starknet-test.git
cd starknet-test
npm i
```

## Настройка
Все нужные настройки в файле .env    
1. Время для паузы между действиями в секундах     
2. Количество ETH для бриджа в сеть Starknet        
3. Количество ETH для свапа в сети Starknet (MySwap)      

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