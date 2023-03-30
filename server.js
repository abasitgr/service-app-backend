require('dotenv').config({ path: `./src/environment/${process.env.NODE_ENV}.env` })
require("./src/config/db");
require("./src/utils/passportAuth");
const { batchTesting } = require("./src/utils/batch")

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./src/routes");

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Custom-header");
  res.header("Access-Control-Expose-Headers", "X-Custom-header");
  next();
});

app.use(cors());
app.get("",(req,res)=>{
  res.send("server is running");
})
app.use("/api/user", routes.userRoutes);
app.use("/api/admin", routes.adminRoutes);
app.use("/api/services/category", routes.serviceCategory);
app.use("/api/services", routes.services);
app.use("/api/supplier", routes.supplier);

app.use("/api/wallet", routes.wallet);
app.use("/api/job", routes.job);
app.use("/api/appointment", routes.appointment);
app.use("/api/chat", routes.chat);
app.use("/api/notification", routes.notification);




batchTesting();


// app.listen(process.env.PORT, () => {
//   console.log(`server is running on port ${process.env.PORT}`)
// })



const server = require('http').createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"],
        allowedHeaders: ["my-custom-header"],
        credentials:true
    }
})
server.listen(process.env.PORT,()=>{
  console.log("server is running!")

})

const chatController = require('./src/controller/chat.Controller')
io.sockets.on('connection', chatController.respond);






