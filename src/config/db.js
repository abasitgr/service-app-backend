const mongoose = require("mongoose");
console.log(process.env.DB_URI);

mongoose.connect(process.env.DB_URI , { useNewUrlParser: true,useUnifiedTopology: true, } , ( err ) => {
 if(err) {
     console.log(err)
     console.log("Error Occured while Connection wih Database");
 }
 else {
     console.log("connection successfully established");
 }
})

// 10.0.0.4 private Ip Azure
// 40.117.119.32 public Ip Azure