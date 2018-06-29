let holders = [];

// Change the information displayed in the right panel
function displayHolder(id){
  const holder = holders.find(h => h.login === id)
  $('#name').html(holder.name);
  $('#login').html(holder.login);
  $('#id_user').html(holder.id_user);
  $('#address').html(holder.address);
  $('#BABBalance').html(holder.BABBalance);
  $('#ETHBalance').html(holder.ETHBalance);
}

// Query the API and display its information
$(document).ready(function () {
  $('#corps').hide();
    $.get("api/getAllBABHolders", function(unprocessed_result){
      $('#loading').hide();
      $('#corps').show();
      let result = processHoldersList(unprocessed_result);
      holders = result.map(item => {
          return {
            name : item.user_desc.fname + " " + item.user_desc.lname,
            login : item.user_desc.login,
            id_user : item.id_user,
            address : item.address,
            BABBalance : item.BABBalance,
            ETHBalance : item.ETHBalance
        }
      });

      displayHolder(holders[holders.length-1].login);

      var bubbleChart = new d3.svg.BubbleChart({
        supportResponsive: true,
        size: 600,
        innerRadius: 600 / 3.5,
        radiusMin: 40,
        data: {
          items: holders,
          eval: function (item) {return item.BABBalance;},
          classed: function (item) {
            console.log(item.login);
            return item.login;}
        },
        plugins: [
          {
            name: "central-click",
            options: {
              text: "(See more detail)",
              style: {
                "font-size": "12px",
                "font-style": "italic",
                "font-family": "Source Sans Pro, sans-serif",
                "text-anchor": "middle",
                "fill": "white"
              },
              attr: {dy: "65px"},
              centralClick: function() {
                alert("Here is more details!!");
              }
            }
          },
          {
            name: "lines",
            options: {
              format: [
                {// Line #0
                  textField: "BABBalance",
                  classed: {BABBalance: true},
                  style: {
                    "font-size": "20px",
                    "font-family": "Source Sans Pro, sans-serif",
                    "text-anchor": "middle",
                    fill: "white"
                  },
                  attr: {
                    dy: "10px",
                    x: function (d) {return d.cx;},
                    y: function (d) {return d.cy;}
                  }
                },
                {// Line #1
                  textField: "login",
                  classed: {login: true},
                  style: {
                    "font-size": "0px",
                    "font-family": "Source Sans Pro, sans-serif",
                    "text-anchor": "middle",
                    fill: "white"
                  },
                  attr: {
                    dy: "20px",
                    x: function (d) {return d.cx;},
                    y: function (d) {return d.cy;}
                  }
                }
              ],
              centralFormat: [
                {// Line #0
                  style: {"font-size": "50px"},
                  attr: {}
                },
                {// Line #1
                  style: {"font-size": "30px"},
                  attr: {dy: "40px"}
                }
              ]
            }
          }]
      });
    });
});
