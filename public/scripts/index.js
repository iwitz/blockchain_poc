const unit = 10E3; // miliBAB

function processHoldersList(holdersList){
  // Parses the BAB to mBAB and removes the server from the list
  const serverWallet = "0x3fC4e4724453D6a93001D7873A3dC0D470366491";
  res = [];
  holdersList.forEach(function(n){
    if(n["address"] != serverWallet){
      res.push({
        "address" : n["address"],
        "BABBalance" : fromBAB(n["BABBalance"]),
        "ETHBalance" : n["ETHBalance"],
        "id_user" : n["id_user"],
        "user_desc" : n["user_desc"]
      });
    }
  });
  return res;
}

function toBAB(amount){
  // Parses uBAB to BABlet wei = web3.utils.toWei(amount);
  return parseFloat(amount) / parseFloat(unit);
}

function fromBAB(amount){
  // Parses BAB to uBAB
  return Math.round(amount * unit * 1000) / 1000;
}
