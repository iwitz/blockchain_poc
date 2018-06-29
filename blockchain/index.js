var path = require('path');
const publicFolder = path.join(path.dirname(__dirname), "public")
var Web3 = require("web3");
const reqprom = require('request-promise-native');

module.exports = function(Config, Utilities){
  const balanceOf = '0x70a08231000000000000000000000000'; // hexadecimal for the "balanceOf" function of the contract
  const contractABI = require("human-standard-token-abi"); // ABI for ERC20 tokens
  const Tx = require('ethereumjs-tx');
  const feeFactor = 1.1; // Coefficient when estimating the fee

  // Initialize the connection
  this.web3 = new Web3(new Web3.providers.HttpProvider(
      Config.getWeb3HTTPProvider()
  ));

  // Get the BAB funds on the wallet at address @address
  this.getBABBalance = async function(address){
    let tknAddress = (address).substring(2); // Remove the 0x beginning to concatenate the string with an other hex string later
    let contractData = ( balanceOf + tknAddress);
    try{
      const data = await this.web3.eth.call({
        to: Config.getContractAddress(),
        data: contractData
      });
      return this.web3.utils.fromWei(this.web3.utils.toBN(data));
    }catch(error){
      Utilities.log("Error occurred when trying to get BAB balance for address " + address + " : \n" + error.toString(), "error");
      return -1;
    }
  }

  // Get the ETH funds on the wallet at address @address
  this.getETHBalance = async function(address){
    try{
      let data = await web3.eth.getBalance(address);
      return this.web3.utils.fromWei(this.web3.utils.toBN(data));
    }catch(error){
      Utilities.log("Error occurred when trying to get ETH balance for address " + address + " : \n" + error.toString(), "error");
      return -1;
    }
  }

  // Get the entire BAB Transaction history
  this.getBABTransactionHistory = async function(){
    let contractObj = new web3.eth.Contract(contractABI, Config.getContractAddress());
    try{
      return await contractObj.getPastEvents('Transfer' || 'allEvents', { fromBlock: 0, toBlock: 'latest' });
    }catch(error){
      Utilities.log("Error occurred when trying to get BAB transaction history :\n" + error.toString(), "error");
      throw error;
    }
  }

  // Get a list of all addresses of holders of BAB token and the amounts of BAB and ETH they own. This procedure can take a while to complete.
  this.getAllBABHolders = async function(){
    // First, get all the transactions involving the contract
    let addressList = [];
    try{
      const transactions = await this.getBABTransactionHistory();
      // Then extract all the addresses involved
      for(let i = 0; i < transactions.length; i++){
        const toAddress = transactions[i]["returnValues"]["_to"];
        const fromAddress = transactions[i]["returnValues"]["_from"];
        if( addressList.indexOf(toAddress) < 0 ){ addressList.push(toAddress); }
        if( addressList.indexOf(fromAddress) < 0 ){ addressList.push(fromAddress); }
      }
    }catch(error){
      Utilities.log("Error while getting all BAB holders : could not retrieve transaction history");
      throw error;
    }
    // Then check their ETH and BAB balances, query the users API to get the accounts' information and build the res object
    let res = [];
    let blockchainRequests = [];
    let userAPIRequests = [];
    for(let address of addressList){
      let current = { "address" : address };
      userAPIRequests.push(this.walletAddressToUserID(address).then(
        userid => current["id_user"] = userid
      ).catch(
        error => current['id_user'] = null
      ));
      blockchainRequests.push(this.getBABBalance(address).then(
        res => current["BABBalance"] = res
      ));
      blockchainRequests.push(this.getETHBalance(address).then(
        res => current["ETHBalance"] = res
      ));
      res.push(current);
    }
    try{
      await Promise.all(userAPIRequests);
      userAPIRequests = [];
      for(const holder of res){
        if(holder.id_user){
          userAPIRequests.push(
            this.getUser(holder.id_user).then(
              user => holder['user_desc'] = { "fname" : user["fname"], "lname" : user["lname"], "login" : user["login"]}
            )
          );
        }
      }
    }catch(error){
      Utilities.log(error)
      throw error;
    }
    try{
      // Wait for all the promises to resolve and return the res object
      await Promise.all(userAPIRequests);
      await Promise.all(blockchainRequests)
      return res.filter(holder => holder.id_user!==null);
    }catch(error){
      Utilities.log(error)
      throw error;
    }
  }

  // Send @amount ETH from the wallet that uses @senderPrivateKey to @receiverAddress. The ETH amount must be given in ETH ( not wei )
  this.sendETH = async function(senderAddress, senderPrivateKey, receiverAddress, amount){
    let privateKey = Buffer.from(senderPrivateKey, 'hex');
    let nonce = await web3.eth.getTransactionCount(senderAddress);
    let txValue = web3.utils.numberToHex(web3.utils.toWei(amount, 'ether'));
    let gasPrice = web3.utils.numberToHex((await web3.eth.getGasPrice()));
    // Estimate the amount of gas needed with a 10% margin
    let gasAmount = web3.utils.numberToHex(Math.round((await web3.eth.estimateGas({from: senderAddress, to: receiverAddress, amount: amount})) * feeFactor));
    let rawTx = {
      'nonce': web3.utils.numberToHex(nonce),
      'gasPrice': gasPrice, // calculated above
      'gasLimit': gasAmount, // normally 21000 * 1.1
      'to': receiverAddress,
      'value': txValue,
      'data': web3.utils.asciiToHex('0x')
    }
    let tx = new Tx(rawTx);
    tx.sign(privateKey);
    let serializedTx = tx.serialize();
    let res = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    return res;
  }

  // Send @amount BAB from the wallet with @senderPrivateKey to @receiverAddress.
  this.sendBAB = async function(senderAddress, senderPrivateKey, receiverAddress, amount){
    let privateKey = Buffer.from(senderPrivateKey, 'hex');
    let nonce = await web3.eth.getTransactionCount(senderAddress);
    let contract = new web3.eth.Contract(contractABI, Config.getContractAddress());
    let contractAddress = Config.getContractAddress();
    let gasPrice = web3.utils.numberToHex((await web3.eth.getGasPrice()));
    var rawTx = {
        "from": senderAddress,
        "nonce": web3.utils.numberToHex(nonce),
        "gasPrice": gasPrice,
        "gasLimit": web3.utils.toHex(60000),
        "to": contractAddress,
        "value": "0x0", // Send 0 ETH
        "data": contract.methods.transfer(receiverAddress, web3.utils.numberToHex(web3.utils.toWei(amount, 'ether'))).encodeABI()
    };
    let tx = new Tx(rawTx);
    tx.sign(privateKey);
    let serializedTx = tx.serialize();
    // Try to carry out the transaction
    try{
      let res = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      return res;
    }
    catch(error){
      if( error.toString() == "Error: Returned error: insufficient funds for gas * price + value"){
        // If the user does not have enough ETH to pay the fees, send it ETH and try again
        Utilities.log("Address " + senderAddress + " attempted to perform a transaction without having enough ETH to pay the fees. Sending it ETH...", "error");
        try{
          await fundNewAccountETH(senderAddress);
          let res = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
          return res;
        }
        catch(error){
          Utilities.log(error);
          throw error;
        }
      }
      else{
        // If the error is not related to the sender's ETH funds, just log it
        Utilities.log(error);
        throw error;
      }
    }
    return res;
  }

  // Send the default amount of ETH for accounts that have just been created to the account with wallet @address
  this.fundNewAccountETH = async function(address){
    return (await this.sendETH(Config.getServerWallet(), Config.getServerPrivateKey(), address, Config.getOriginalETHFunding()));
  }

  // Send the default amount of BAB for accounts that have just been created to the account with wallet @address
   this.fundNewAccountBAB = async function(address){
    return (await this.sendBAB(Config.getServerWallet(), Config.getServerPrivateKey(), address, Config.getOriginalBABFunding()));
  }

  // Create a wallet to be used with an account and return an object containing its address and privatekey
  this.createWallet = function(){
    return web3.eth.accounts.create();
  }

  // Send all ETH and BAB from wallet with address @address to the server's wallet. Useful when deleting an account for example.
  this.emptyWallet = async function(address, privatekey){
    try{
      // First, get BAB and ETH balances
      let BABBalance = await this.getBABBalance(address);
      let ETHBalance = await this.getETHBalance(address);
      // Then send all the BAB funds to the server
      if(BABBalance != 0){
        await this.sendBAB(address, privatekey, Config.getServerWallet(), BABBalance.toString());
      }
      // Finally, calculate how much ETH can be sent by the wallet to be emptied with the fees and send it
      ETHBalance = await this.getETHBalance(address);
      let fee = await this.estimateFee(address, ETHBalance);
      // update the ETH balance
      let amount = ETHBalance - fee;
      return (await this.sendETH(address, privatekey, Config.getServerWallet(), amount.toString()));
    }
    catch(e){
      Utilities.log("An error occurred when trying to empty wallet " + address + ". Error : " + e, "error");
    }
  }

  // Get all BAB transactions involving the user with the ID @user_id
  this.getBABTransactionsForUser = async function(user_id){
    // Get the user's wallet address
    const wallet_adress = await this.userIDToWalletAddress(user_id);
    // Get the transactions involving that address
    const transactions = await this.getBABTransactionHistory();
    const userTransactions = transactions.filter(
      t => t.returnValues._from === wallet_adress || t.returnValues._to === wallet_adress
    );
    let res = [];
    let userAPIRequests = [];
    for(let trans of userTransactions){
      let cleaned = {
        id_user_to : undefined,
        wallet_user_to : trans.returnValues._to,
        id_user_from : undefined,
        wallet_user_from : trans.returnValues._from,
        amount : parseFloat(this.web3.utils.fromWei(trans.returnValues._value))
      }
      res.push(cleaned);
      userAPIRequests.push(this.walletAddressToUserID(trans.returnValues._from).then(
        data => cleaned.id_user_from = data
      ).catch(error => cleaned.id_user_from = null));
      userAPIRequests.push(this.walletAddressToUserID(trans.returnValues._to).then(
        data => cleaned.id_user_to = data
      ).catch(error => cleaned.id_user_to = null));
    }
    await Promise.all(userAPIRequests)
    return res;
  }

  // Wrapper for getBABBalance in order to use the @user_id instead of the address
  this.getUserBalance = async function(user_id){
    const address = await this.userIDToWalletAddress(user_id);
    return await this.getBABBalance(address);
  }

  // Wrapper for sendBAB with user IDs
  this.sendBABHighLevel = async function(id_user_from, id_user_to, amount){
    let senderAddress;
    let senderPrivateKey;
    let receiverAddress;
    let userAPIRequests = [];
    // get the users' addresses
    userAPIRequests.push(this.userIDToWalletAddress(id_user_from).then(res => senderAddress = res));
    userAPIRequests.push(this.userIDToPrivateKey(id_user_from).then(res => senderPrivateKey = res));
    userAPIRequests.push(this.userIDToWalletAddress(id_user_to).then(res => receiverAddress = res));
    await Promise.all(userAPIRequests);
    // Carry out the transaction
    return await this.sendBAB(senderAddress, senderPrivateKey, receiverAddress, amount);
  }

  // Get an authentication token from the users' API to be able to perform queries
  this.getToken = async function(){
    return (await reqprom({
      uri : Config.getUserAPIIP() + '/auth-token',
      method : 'POST',
      body : {
        login : Config.getUserAPILogin(),
        password : Config.getUserAPIPassword(),
      },
      json : true
    })).value;
  }

  // Get a user's account information from his @userid
  this.getUser = async function(userID){
    const token = await this.getToken();
    return JSON.parse(await reqprom({
      uri : Config.getUserAPIIP() + "/users/" + userID,
      method : 'GET',
      headers : {
        "Content-Type" : "application/json",
        "X-Auth-Token": token
      }
    }));
  }

  // Get a user's wallet address from his @userID
  this.userIDToWalletAddress = async function(userID){
    try{
      const user = await this.getUser(userID);
      const wallet_address = user.wallet_address;
      if(!wallet_address)
        throw Error("User "+userID+" does not have a wallet address");
      else
        return wallet_address
    }catch(error){
      Utilities.log(error, "error");
      throw new Error("Could not retrieve the wallet address of "+userID);
    }
  }

  // get a user's private key from his @userID
  this.userIDToPrivateKey = async function(userID){
    try{
      const user = await this.getUser(userID);
      const private_key = user.private_key;
      if(!private_key)
        throw Error("User "+userID+" does not have a private key");
      else
        return private_key

    }catch(error){
      Utilities.log(error, "error");
      throw new Error("Could not retrieve the private key of " + userID);
    }
  }

  // get a user's ID from his wallet address
  this.walletAddressToUserID = async function(walletAddress){
    const token = await this.getToken();
    const users = JSON.parse(await reqprom({
      uri : Config.getUserAPIIP() + "/users",
      method : 'GET',
      headers : {
        "Content-Type" : "application/json",
        "X-Auth-Token": token
      }
    }));
    const user = users.find(u => u.wallet_address === walletAddress);
    if(!user)
      throw Error("Cant find user id for wallet address : " + walletAddress);
    return user.id;
  }

  // Estimate the fee in ETH for an ETH transaction of @amount ETH from @address with a 10% margin
  this.estimateFee = async function(address, amount){
    try{
      let gasPrice = web3.utils.numberToHex(await web3.eth.getGasPrice());
      // Finally, calculate how much ETH can be sent by the wallet to be emptied with the fees and send it
      let fee = (await web3.eth.estimateGas({from: address, to: Config.getServerWallet(), amount: amount})) * feeFactor * web3.utils.fromWei(await web3.eth.getGasPrice());
      return fee;
    }
    catch(e){
      Utilities.log("An error occurred when estimating the fee : " + e, "error");
      throw e;
    }
  }

  // export module
  return this;
}
