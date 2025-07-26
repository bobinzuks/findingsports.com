const http=require("http");http.createServer((q,s)=>{s.writeHead(200);s.end("OK")}).listen(process.env.PORT||3000,()=>console.log("Started"))
