
// require('dotenv').config({ path: 'process.env' });
// const fs = require('fs');


// const connectionOptions = {
//     host: '67.20.109.153', // process.env.FTP_HOST,
//     user: 'imb@pattonkiehl.com', // process.env.FTP_USER,
//     password: 'Inkjet88FTP!!', // process.env.FTP_PASS,
//     secure: true, //process.env.FTP_PORT,
//   }

// const connect = async () => {
//     const client = new ftp.Client()
//     client.ftp.verbose = true
//     try {
//         await client.access(connectionOptions)
//         console.log(await client.list())
//         // await client.uploadFrom("README.md", "README_FTP.md")
//         // await client.downloadTo("README_COPY.md", "README_FTP.md")
        
//     }
//     catch(err) {
//         console.log(err)
//     }
//     client.close()
// }

// module.exports = connect;