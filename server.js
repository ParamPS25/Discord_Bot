const express = require("express");

const app = express();

const PORT = process.env.PORT || 8000

app.get("/",(req,res)=>{
    const url = "https://discord.com/oauth2/authorize?client_id=1296589881874583562"
    return res.send(`url for disord : ${url} ,paste this url on your chrome to add this bot to you Discord server`)
})

app.listen(PORT,()=>{
    console.log("server started on port"+PORT)
})
