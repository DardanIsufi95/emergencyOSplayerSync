const cron = require('node-cron')
const mysql = require('mysql2')
const md5 = require('md5')


const connectionDB = mysql.createConnection({
    host: 'sd447418-004.dbaas.ovh.net',
    port: 35319,
    user: 'ancomoulivesync',
    password: 'EmergencyOSDbsEcll1',
    database: 'ancomoulivesync',
});


const pool = mysql.createPool({
    host: 'sd447418-004.dbaas.ovh.net',
    port: 35319,
    user: 'ancomouemergency',
    password: 'EmergencyOSDbsE1',
    database: 'ancomouemergency',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// const db = mysql.createConnection({
//     host: 'ancomouemergency.mysql.db',
//     user: 'ancomouemergency',
//     password: 'EmergencyOSDbsEc1',
//     database: 'ancomouemergency'
// });
function init(){
    connectionDB.query(
        'SELECT * FROM connectionData',
        async function(err, results, fields) {
            for (let i = 0; i < results.length; i++) {
                try {
                    const connectionString = JSON.parse(results[i]['connectionString'])
                    const tableinfo = JSON.parse(results[i]['criminalSync'])
                    const instanceID = results[i]['instanceID']
                    
                    console.log(connectionString,connectionString.hostname.split(":")?.[1] || undefined)
    
    
    
    
                    const sql = `SELECT 
                        ${tableinfo['uniquePlayer']} as id, 
                        ${tableinfo['fullnamePlayer']} as playername, 
                        ${tableinfo['telephonePlayer'] || "''"} as telephonePlayer ,
                        ${tableinfo['birthday'] || "''"} as birthday ,
                        ${tableinfo['sex'] || "''"} as sex 
                    FROM ${tableinfo['table']}`
    
    
                    console.log(sql)
    
    
    
                    const instanceConncection = mysql.createConnection({
                        host: connectionString.hostname.split(":")[0],
                        port: connectionString.hostname.split(":")?.[1] || undefined,
                        user: connectionString.username,
                        password: connectionString.password,
                        database: connectionString.database,
                    })
                    console.log('established')
    
    
    
                    await instanceConncection.promise().query(sql)
                    .then( async ([rows,fields]) => {
                        for (let i = 0; i < rows.length;i++){
    
                            let player = rows[i]
                            let sql = 
                            `INSERT IGNORE INTO sync_player
                                (instanceid, host, id , name, phone,birthday,sex)
                            Select
                                '${instanceID}',
                                '${md5(connectionString.hostname + connectionString.database + tableinfo['table'] )}',
                                '${player['id'].replace("Char1:","steam:")}',
                                '${player['playername']}',
                                '${player['telephonePlayer']}',
                                '${player['birthdayPlayer']}',
                                '${player['genderPlayer']}'
                            ON DUPLICATE KEY UPDATE name ='${player['playername']}' , phone = '${player['telephonePlayer']}'`;
                            
                            console.log(instanceID);
                            await pool.promise().execute(sql);
    
    
    
                        }
                    })
                    .catch(console.log)
                    .then( () => con.end());
    
                }catch (e) {}
                
                
            }
            
        }
    )
}


init()





cron.schedule('*/5 * * * *', async () => {
    init()
});