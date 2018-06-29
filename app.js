var path = require('path');
var express = require('express');
var app = express();
var Config = require('./config')();
var Utilities = require("./utilities")();
var Blockchain = require("./blockchain")(Config, Utilities);

// Display available BAB and ETH funds in the server wallet at startup
Blockchain.getBABBalance(Config.getServerWallet()).then((result) => {
	Utilities.log("Server wallet BAB funds : " + result);
});
Blockchain.getETHBalance(Config.getServerWallet()).then((result) => {
	Utilities.log("Server wallet ETH funds : " + result);
});

// Support for JSON-encoded POST parameters
app.use(express.json({limit : '50mb'}))
app.use(express.urlencoded({extended : true}))

// Handle all API routes with the routers defined in ./routes
var routes = require("./routes")(Config, Utilities, Blockchain)
app.use('/api', routes)

// Serve client code
const publicFolder = path.join(__dirname, "public");
app.set('views', publicFolder);
app.set('view engine', 'ejs');

// Render pages using EJS templates
app.get("/", function(req,res) {
	res.render("pages/index");
});
app.get("/api", function(req,res) {
	res.render("pages/apiDoc");
});
app.get("/BABHolders", function(req,res) {
	res.render("pages/BABHolders");
});
app.get("/BABTransactions", function(req,res) {
	res.render("pages/BABTransactions");
});
app.get("/virements", function(req,res) {
	res.render("pages/virements");
});
app.get("/BABWhales", function(req,res) {
	res.render("pages/BABWhales");
});

app.use('/', express.static(publicFolder));
app.use('/', function(req, res)
{
	res.sendFile(path.join(publicFolder, "index.html"));
});

// Create the HTTP server
var http = require("http");
server = http.createServer(app);

// Start the HTTP server
var listeningServer = server.listen(Config.getServerPort(), Config.getServerIP(), function () {
   var host = listeningServer.address().address
   var port = listeningServer.address().port
	 Utilities.log("Listening on https://" + host + ":" + port)
 });
