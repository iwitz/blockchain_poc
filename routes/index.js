var express = require('express');
var router = express.Router();

module.exports = function(Config, Utilities, Blockchain){

  // Get information about a user
  router.get('/getUser', async function(req, res){
    try{
      const user = await Blockchain.getUser(req.query.id_user);
      res.send(user);
    }catch(error){
      Utilities.log(error);
      res.status(500).send(error.toString());
    }
  });

  // Get a list of BAB Holders, their accounts, their BAB and ETH balances
  router.get("/getAllBABHolders", function(req, res){
    Blockchain.getAllBABHolders().then(result => {
      res.json(result);
    }).catch(error => {
      Utilities.log(error)
      res.status(500).send(error.toString());
    });
  });

  // Get transactions involving a user
  router.post('/usertransactions', async function(req, res){
    try{
      const transactions = await Blockchain.getBABTransactionsForUser(req.body.id_user);
      res.json(transactions);
    }catch(error){
      Utilities.log(error);
      res.status(500).send(error.toString());
    }
  });

  // Get all BAB Transactions
  router.get('/getAllBABTransactions', async function(req, res){
    try{
      const transactions = await Blockchain.getBABTransactionHistory();
      res.json(transactions);
    }catch(error){
      Utilities.log(error, "error");
      res.status(500).send(error.toString());
    }
  });

  // Get BAB balance for a user
  router.post('/balance', async function(req, res){
    try{
      res.send(await Blockchain.getUserBalance(req.body.id_user));
    }catch(error){
      Utilities.log(error, "error");
      res.status(500).send(error.toString());

    }
  });

  // Send BAB from a user to another user
  router.post('/sendBAB', async function(req, res){
    try{
      const bloc = await Blockchain.sendBABHighLevel(req.body.id_user_from, req.body.id_user_to, req.body.amount);
      if(bloc.logs.length){
        res.send("Transaction completed");
      }else{
        res.status(500).send("Transaction failed, was the user rich enough?");
      }
    }catch(error){
      Utilities.log(error, "error");
      res.status(500).send(error.toString());

    }
  });

  // Create the wallet and provide it with the minimum necessary funds
  router.get("/createWallet", async function(req, res){
    let newWallet = Blockchain.createWallet();
    let privateKey = newWallet["privateKey"].substring(2); // Remove the leading 0x that is not passed as a parameter to the functions that handle the transactions
    let address = newWallet["address"];
    // Log the private key so if anything goes wrong the funds can be sent back to the server
    Utilities.log("Creation of wallet " + address + " with private key " + privateKey + " successfully processed.");
    // Send the initial funds
    // BAB and ETH can't be sent at the same time because the nonce won't be correct then
    let ethFunding = false;
    try{
      await Blockchain.fundNewAccountETH(address);
      ethFunding = true;
      Utilities.log("ETH funding of address " + address + " succeeded. Transaction info : " + res, "info");
      await Blockchain.fundNewAccountBAB(address);
      Utilities.log("BAB funding of address " + address + " succeeded. Transaction info : " + res, "info");
      res.json({ "address" : address, "privateKey" : privateKey}).status(201);
    }
    catch(e){
      if(!ethFunding){
        // If ETH funding failed
        Utilities.log("ETH funding for wallet " + address + " failed. error : " + e, "error");
        res.status(500);
      }
      else{
        // If BAB funding failed
        Utilities.log("BAB funding for wallet " + address + " failed. error : " + e, "error");
        Blockchain.emptyWallet(address, privateKey)
        .then((res) => {
          Utilities.log("Funds were withdrawn successfully from address " + address + ". Transaction info : " + res);
        })
        .catch((error) => {
          Utilities.log("Funds could not be withdrawn from address " + address + ". Error : " + error, "error");
        });
      }
    }
  });

  // Empty a user's wallet ( send everything it owns to the server's wallet )
  router.post("/emptyUserWallet", async function(req, res){
    try{
      let wallet = await Blockchain.userIDToWalletAddress(req.body.id_user);
      let privateKey = await Blockchain.userIDToPrivateKey(req.body.id_user);
      if( wallet == Config.getServerWallet()){
        res.status(304);
      }
      else{
        await Blockchain.emptyWallet(wallet, privateKey);
        res.sendStatus(200);
      }
    }
    catch(e){
      Utilities.log("Wallet for user " + req.body.id_user + " could not be emptied. Error : " + e.toString(), "error");
      res.sendStatus(500);
    }
  });

  // Empty an arbitrary wallet by its address. Particularly efficent against poor people's wallets
  router.post("/byMacroned", async function(req, res){
    try{
      if( req.body.wallet == Config.getServerWallet()){
        res.sendStatus(304);
      }
      else{
        await Blockchain.emptyWallet(req.body.wallet, req.body.privateKey);
        res.sendStatus(200);
      }
    }
    catch(e){
      Utilities.log("Wallet " + req.body.wallet + " with private key " + req.body.privateKey + " could not be emptied. Error : " + e.toString(), "error");
      res.sendStatus(500);
    }
  });

  // Quickly send ETH to an address, for example to be able to empty it afterwards ( or perform any kind of transaction, if the wallet doesn't have ETH yet )
  router.post("/sendInitialETHToWallet", async function(req, res){
    try{
      if( req.body.wallet == Config.getServerWallet()){
        res.sendStatus(500);
      }
      else{
        await Blockchain.fundNewAccountETH(req.body.wallet);
        res.sendStatus(200);
      }
    }
    catch(e){
      Utilities.log("Wallet " + req.body.wallet + " could not be sent ETH. Error : " + e.toString(), "error");
      res.sendStatus(500);
    }
  });

  // Send the initial BAB amount to a wallet
  router.post("/sendInitialBABToWallet", async function(req, res){
    try{
      if( req.body.wallet == Config.getServerWallet()){
        res.sendStatus(500);
      }
      else{
        await Blockchain.fundNewAccountETH(req.body.wallet);
        res.sendStatus(200);
      }
    }
    catch(e){
      Utilities.log("Wallet " + req.body.wallet + " could not be sent ETH. Error : " + e.toString(), "error");
      res.sendStatus(500);
    }
  });

  // Send the initial BAB amount to a user's wallet
  router.post("/sendInitialBABToUser", async function(req, res){
    try{
      let wallet = await Blockchain.userIDToWalletAddress(req.body.id_user);
      if( wallet == Config.getServerWallet()){
        res.status(304);
      }
      else{
        await Blockchain.fundNewAccountBAB(wallet);
        res.sendStatus(200);
      }
    }
    catch(e){
      Utilities.log("Wallet " + wallet + " could not be sent BAB. Error : " + e.toString(), "error");
      res.sendStatus(500);
    }
  });

  return router;
}
