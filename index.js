const cron = require('node-cron')
const mysql = require('mysql2')
const md5 = require('md5')
const request = require("node-fetch")

const fs = require('fs')

function init(){
    let output = []
    request("https://emergencyos.de/.cron/sync_conn.php").then(response=>response.text()).then(async res=>{
        let data = JSON.parse(res)

        let promises = []


        for (let i = 0; i < data.length; i++) {
            try{
               
                const row = data[i];
                const connectionString = JSON.parse(row['connectionString'])
                const tableinfo = JSON.parse(row['criminalSync'])
                const instanceID = row['instanceID']
    
       

               const sql = `SELECT 
                        ${tableinfo['uniquePlayer']} as id, 
                        ${tableinfo['fullnamePlayer']} as playername, 
                        ${tableinfo['telephonePlayer'] || "''"} as telephonePlayer ,
                        ${tableinfo['birthday'] || "''"} as birthday ,
                        ${tableinfo['sex'] || "''"} as sex 
                    FROM ${tableinfo['table']}`
    
    
    
                const instanceConncection = mysql.createConnection({
                    host: connectionString.hostname.split(":")[0],
                    port: connectionString.hostname.split(":")?.[1] || undefined,
                    user: connectionString.username,
                    password: connectionString.password,
                    database: connectionString.database,
                })



                let instancePromise = instanceConncection.promise().query(sql)
                .then( ([rows,fields]) => {
                    let players = []
                    for (let i = 0; i <  rows.length;i++){
                        let player = rows[i]
                        let out = {
                            instanceid: instanceID,
                            host:       md5(connectionString.hostname + connectionString.database + tableinfo['table'] ),
                            id:         player['id'].replace("Char1:","steam:"),
                            name:       player['playername'],
                            phone:      player['telephonePlayer'] || "",
                            birthday:   player['birthdayPlayer'] || "",
                            sex:        player['genderPlayer'] || ""
                        }
                        //console.log(out)
                        players.push(out)
                    }

                    return players  
                        

                })
                promises.push(instancePromise)
            }catch(e){
                console.log(e)
            }
            
                            
        }


        Promise.allSettled(promises).then((result) => {
            let clean = result.filter(res=> res.status == 'fulfilled').reduce((acc , res) =>{
                return [...acc  , ...res.value]
            },[])
            fs.writeFileSync('h.json', JSON.stringify(clean), 'utf8')
            request("https://emergencyos.de/.cron/sync_save.php",{
                headers: {'Content-Type': 'application/json'},
                method:"POST",
                body: JSON.stringify(clean)
            }).then(response=> response.text()).then(data=>{
                console.log(data)
            })

        })

        
    })

}


init()





cron.schedule('*/5 * * * *', async () => {
    init()
});