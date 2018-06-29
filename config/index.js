var environment = "dev" // dev or prod
var fs = require('fs');
var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"))[environment];

module.exports = function(){
  this.getServerPort = function(){
      return config["serverport"];
  }

  this.getServerIP = function(){
      return config["serverip"];
  }

  this.getContractAddress = function(){
      return config["contractaddress"];
  }

  this.getServerWallet = function(){
      return config["serverwallet"];
  }

  this.getWeb3HTTPProvider = function(){
      return config["web3httpprovider"];
  }

  this.getServerPrivateKey = function(){
    return config["serverprivatekey"];
  }

  this.getOriginalETHFunding = function(){
    return config["originalethfunding"];
  }

  this.getOriginalBABFunding = function(){
    return config["originalbabfunding"];
  }

  this.getUserAPIIP = function(){
    return config["userAPIIP"];
  }

  this.getUserAPILogin = function(){
    return config["userAPILogin"];
  }

  this.getUserAPIPassword = function(){
    return config["userAPIPassword"]
  }

  return this;
}
