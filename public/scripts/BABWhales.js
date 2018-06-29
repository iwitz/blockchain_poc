$(document).ready(function(){
  $('#loading').show();
  $('#corps').hide();

  // Query the API
  $.get("api/getAllBABHolders", function(holders){
    $('#grass').css('visibility', 'visible');
    $('#loading').hide();
    $('#corps').show();

    // Sort the users by amount of BaboucheCoin owned
    let lambo = 0, prolo = 1000, lambo_login, prolo_login;
    for(let i=0; i < holders.length; i++){
      // Ignore the server's wallet
      if(holders[i].user_desc.login != "boucheba"){
        if(holders[i]["BABBalance"] > lambo) { lambo = holders[i]["BABBalance"]; lambo_login = [holders[i].user_desc.login];}
        else if(holders[i]["BABBalance"] == lambo) { lambo_login.push(holders[i].user_desc.login); }
        if(holders[i]["BABBalance"] < prolo) { prolo = holders[i]["BABBalance"]; prolo_login = [holders[i].user_desc.login];}
        else if(holders[i]["BABBalance"] == prolo) { prolo_login.push(holders[i].user_desc.login); }
      }
    }
    // Place the users according to what they own
    let sizeRange = lambo - prolo;
    let lambo_login_text = lambo_login[0];
    let prolo_login_text = prolo_login[0];
    for(let i=1; i < lambo_login.length; i++){
      lambo_login_text += ", "+lambo_login[i];
    }
    for(let i=1; i < prolo_login.length; i++){
      prolo_login_text += ", "+prolo_login[i];
    }
    $('#winner').html("The fattest whale is " + lambo_login_text + "<br>" + "The plankton : " + prolo_login_text + "</br>");

    // Assign left shifts to the holders and group identical shifts
    let groups = {};
    $.each(holders, function(index, value){
      let left_shift = parseInt((parseFloat(value.BABBalance - prolo) / sizeRange) * 90);
      if(groups[left_shift.toString()]){
        groups[left_shift.toString()].push(value.id_user);
      }
      else{
        groups[left_shift.toString()] = [value.id_user];
      }
    });

    // Iterate over the groups to create the images
    for (var property in groups) {
      if (groups.hasOwnProperty(property)) {
        let left_shift = parseInt(property);
        let class_user = "images/clio.gif";
        if (left_shift < 20) {class_user = "images/prolo.gif";}
        if (left_shift > 80) {class_user = "images/lambo.gif";}
        // Build the title of the image with the names of the users represented by this image
        let title = "";
        for(let i = 0; i < groups[property].length ; i++){
          let login = holders.find(h => h.id_user === groups[property][i])["user_desc"]["login"];
          title = title + login + "\n";
        }
        let img_user = new Image();
        img_user.src = class_user;
        img_user.id = "shift_" + property;
        img_user.title = title;
        img_user.alt = title;
        $('#avatars').prepend(img_user);
        $('#shift_' + property).css('left', property + "%");
      }
    }
  })
})
