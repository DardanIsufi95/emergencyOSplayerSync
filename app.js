const cron = require('node-cron')
const mysql = require('mysql2')
const md5 = require('md5')
const request = require("node-fetch")
const moment = require('moment'); // require

const fs = require('fs')

function init(){
    let dbdata = []
    request("https://emergencyos.de/.cron/sync_conn.php").then(response=>response.text()).then(async res=>{
        let data = JSON.parse(res)
        console.log(data)
        let promises = []

        for (let i = 0; i < data.length ; i++) {
   

                const row = data[i];
                const connectionString = JSON.parse(row['connectionString'])
                const tableinfo = JSON.parse(row['criminalSync'])
                const instanceID = row['instanceID']



                if(instanceID == 1140 || true){
                    const instanceConncection = mysql.createConnection({
                        host: connectionString.hostname.split(":")[0],
                        port: connectionString.hostname.split(":")?.[1] || undefined,
                        user: connectionString.username,
                        password: connectionString.password,
                        database: connectionString.database,
                    })

                    const sql = `SELECT 
                        ${tableinfo['uniquePlayer']} as id, 
                        ${tableinfo['fullnamePlayer']} as playername, 
                        ${tableinfo['telephonePlayer'] || "''"} as telephonePlayer ,
                        ${tableinfo['birthdayPlayer'] || "''"} as birthday ,
                        ${tableinfo['genderPlayer'] || "''"} as sex 
                    FROM ${tableinfo['table']}`


                    instanceConncection.promise().query(sql)
                    .then( ([rows,fields]) => {
                        let players = []
                        for (let i = 0; i <  rows.length;i++){
                            let player = rows[i]
                            let out = {
                                instanceid: instanceID,
                                host:       md5(connectionString.hostname + connectionString.database + tableinfo['table'] ),
                                id:         typeof player['id'] == 'string' ? player['id'].replace("steam:","Char1:") : player['id'],
                                name:       player['playername'],
                                phone:      player['telephonePlayer'] || "",
                                birthday:   tableinfo['birthday'] ? moment(player['birthday']).format("DD.MM.YYYY") : "",
                                sex:        typeof player['sex'] != 'undefined' ? (player['sex'] == tableinfo['genderPlayerMale'] ? 'male' : 'female') : "",
                                SQL:sql
                            }
                            console.log(tableinfo['birthday'] ? moment(player['birthday']).format("DD.MM.YYYY") : "")

                            players.push(out)
                        }
                        fs.writeFileSync('players.json', JSON.stringify(players), 'utf8')
                        request("https://emergencyos.de/.cron/sync_save.php",{
                            headers: {'Content-Type': 'application/json'},
                            method:"POST",
                            body: JSON.stringify(players)
                        }).then(response=> response.text()).then(data=>{
                            // console.log(data)
                            fs.writeFileSync('rueckgabe.json', data, 'utf8')
                        })
    
                        //fs.writeFileSync('rueckgabe.json', JSON.stringify(dbdata), 'utf8')
                            
    
                    }).catch(e=>{
                        console.log("error")
                    })


                    
                }

    
    
                


                


 
                            
        }

        
    })

}


init()





cron.schedule('*/5 * * * *', async () => {
    init()
});