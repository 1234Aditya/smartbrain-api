import express from "express";
import { userInfo } from "os";
import cors from 'cors';
import bcrypt from "bcrypt-nodejs";
import knex from 'knex';

const app = express();

const db = knex({
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port : 5432,
      user: 'postgres',
      password: '1234',
      database: 'smart-brain',
    },
  });


app.use(express.json());

app.use(cors());

app.get('/',(req,res)=>{
    res.send('success')
})

app.post('/signin',(req,res)=>{
    if(!email || !password){
        return res.status(400).json("Incorrect Form Submission")
    }
    db.select('email','hash').from('login')
    .where('email' ,'=',req.body.email)
    .then(data =>{
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
        if(isValid){
            return db.select('*').from('users')
            .where('email','=',req.body.email)
            .then(user =>{
                res.json(user[0])
            })
            .catch(err => res.status(400).json("Unable to get user"))
        }else{
            res.status(400).json("Wrong Credentials")
        }
    })
    .catch(err => res.status(400).json('Wrong Credentials'))
})

app.post('/register',(req,res)=>{
    const {email,password,name} = req.body
    if(!email || !name || !password){
        return res.status(400).json("Incorrect Form Submission")
    }
    const hash = bcrypt.hashSync(password)
    db.transaction(trx =>{
        trx.insert({
            hash : hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail =>{
          return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
   .catch(err => res.status(400).json("Unable To Register"))
    
})

app.get('/profile/:id',(req,res)=>{
        const {id} = req.params;
        db.select('*').from('users').where({
            id: id
        }).then(user =>{
            if(user.length){
                res.json(user[0]);
            }else{
                res.status(400).json("Not Found")
            }    
        })
        .catch(err => res.status(400).json("error getting user"))
})

app.put('/image',(req,res)=>{
    const {id} = req.body;
        db('users').where('id',"=",id)
        .increment("entries",1)
        .returning('entries')
        .then(entries =>{
            res.json(entries[0].entries)
        })
        .catch(err => res.status(400).json("Unable To get Entries"))
        
})


// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });
app.listen(process.env.PORT || 3000,()=>{
    console.log(`App is running on port ${process.env.PORT}`)
});

