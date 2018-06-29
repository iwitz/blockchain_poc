# BaboucheCoin
This project was developped as a POC for a larger application that included a marketplace. As such, its main purpose was to provide other parts of the application with a REST API to allow them to interact with the blockchain used to perform financial transactions, since they did not have enough time to write code to interact with the blockchain themselves.
<br><br>
It contains code for an ERC20 token (BaboucheCoin, or BAB) on the Ropsten Ethereum network, the REST API's code as well as a few HTML pages to show information about the holders of the token.
<br>
To link wallets with users, this API had to interact with another REST API that allowed for interaction with a centralized users database.
<br><br>
Since this is the source code of a POC, we did not take proper security measures and a variety of potential bugs remain. For example, the server could use mutexes to prevent a transaction from being performed on an account that is alreaduy performing a transaction, which currently raises an error.
<br><br>
As such, you are strongly advised **not to use this code in production environment**. This code is provided for **educational purposes only**.
<br><br>
This project was written by Noan Cloarec, Bastien Cochini, Alexandre Garcia and Igor Witz. To create the token we used this [tutorial](https://steemit.com/ethereum/@maxnachamkin/how-to-create-your-own-ethereum-token-in-an-hour-erc20-verified).


# API Usage
## Send BaboucheCoin to another user
```
https://babouche.chim.bzh/api/sendBAB (POST)
```
Params :
- **amount** (float) : The amount of BAB to be sent
- **id_user_from** (string) : The user giving BAB
- **id_user_to** (string) : The user receiving BAB  

Returns :   
A 200 http status code once the transaction is completed

## Babouche coin balance for 1 user
The amount of BAB owned by 1 user
```
https://babouche.chim.bzh/api/balance (POST)
```
Params :
- **id_user** (string) : The user

Returns :   
```javascript
16 //The user currently has 16 BAB  
```

## Babouche coin transactions for 1 user
All BAB transactions for the user (given or received)
```
https://babouche.chim.bzh/api/usertransactions (POST)
```
Params :
- **id_user** (string) : The user

Returns :   
```javascript
[
    {
        id_user_to : "5678",//The user who received BAB
        id_user_from : "1234",//The user who gave BAB
        amount : 16,//1234 gave 16 BAB to 5678
    },
    ...
]
```

## All Babouche coin holders
```
https://babouche.chim.bzh/api/getAllBABHolders (GET)
```
Retrieve all Babouche coin holders and their account balance.  
Returns :
```javascript
[
    {
        id_user : "1234",
        BABBalance : "16", //The BaboucheCoins available for the user
    },
    ...
]
```
## Create a wallet
```
https://babouche.chim.bzh/api/createWallet (GET)
```
Create a wallet and fund it with the initial amounts of ETH and BAB.<br>
Returns :
```javascript
{
  address : "0x1932738...",
  privateKey : "0x12121212...", //The Babouche coins available for the user
}
```
## Empty a user's wallet
```
https://babouche.chim.bzh/api/emptyUserWallet (POST)
```
Send all ETH and BAB funds from a user's wallet to the server. Calling this route is important before deleting an account so the associated funds are not lost.<br>
Params :
- **id_user** (string) : User that owns the wallet to be emptied

Returns :<br>
* 200 HTTP status code if the transaction is completed
* 304 HTTP status code if the request attempted to empty the server's wallet
* 500 HTTP status code if the request failed


## Empty any wallet
```
https://babouche.chim.bzh/api/byMacroned (POST)
```
Send all ETH and BAB funds from a wallet to the server. This route is for development use only, the use of the /emptyUserWallet endpoint is preferred.<br>
Params :
- **wallet** (string) : Address of the wallet to be emptied
- **privateKey** (string) : Private key associated with that address.

Returns :<br>
* 200 HTTP status code if the transaction is completed
* 304 HTTP status code if the request attempted to empty the server's wallet
* 500 HTTP status code if the request failed
