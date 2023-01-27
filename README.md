# starknet-test
Скрипт и точка

## Установка
```
git clone https://github.com/d4rk4444/starknet-test.git
cd starknet-test
npm i
```
## Настройка
Все нужные настройки в файле .env    
1. Время для паузы между действиями в секундах     
2. Количество Эфира для бриджа в сеть Starknet        
3. Количество Эфира для свапа в сети Starknet (MySwap)      
      
В файл privateArgnet.txt вставляете приватные адреса с Argent в таком формате:     
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