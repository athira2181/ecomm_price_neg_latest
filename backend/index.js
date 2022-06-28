const express = require("express");
const body_parser = require('body-parser');
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt")

const app = express();
app.use(cors());

app.use(express.json());
app.use(body_parser.json());

const chat_bot = require("./new")();
app.use("/webhook",chat_bot);

const test_bot = require("./chat")();
app.use("/chat_in",test_bot);

const getProd = require("./cust_getproduct")();
app.use("/getproducts",getProd);

const vendorfns = require("./vendor_fns")();
app.use("/vendor",vendorfns);
// const fulfillmentRoutes = require('./fulfillment');

// let jsonParser = express.json()
// let urlEncoded = express.urlencoded({ extended: true })
const userReg = require("./Userindex")();//for conecting with index.js
app.use("/handleSubmits", userReg);

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "price_neg"
})

// app.post('/chat_in', jsonParser, urlEncoded, async (req, res) => {
//     const message = req.body.message
//     //console.log('message' + message)
  
//     test_bot(message)
//       .then((response) => {
//         res.send({ message: response })
//       })
//       .catch((error) => {
//         console.log('Something went wrong: ' + error)
//         res.send({
//           error: 'Error occured here',
//         })
//       })
//   })
//   app.use(fulfillmentRoutes)


app.post('/handleSubmit', async(req, res) =>{//here handle submit given to indicate index.js
    
    console.log(req.body);
    const adm_name=req.body.adm_name;
    const shop_name=req.body.shop_name;
    const shop_addr=req.body.shop_addr;
    const email=req.body.email;
    const phno=req.body.phno;
    const username=req.body.username;
    const password = req.body.password;
    // const salt=await bcrypt.genSalt(10);
    // const password=await bcrypt.hash(req.body.password,salt);
    // bcrypt.hash(password,saltRounds,fuction(err,hash){
    // // var hashedPassword = hash
    
    db.query("INSERT INTO shop(adm_name,shop_name,shop_addr,email,phno,username,password) VALUE (?,?,?,?,?,?,?)",
    [adm_name,shop_name,shop_addr,email,phno,username,password],
    (err,result)=>{
        console.log(result);
        if(err){
            return console.log(err);
        }
        res.send({result});
    }
    ); 
}); 

app.post('/login', async(req, res) =>{
    const username = req.body.username;
    const password=req.body.password;
    console.log(password)
    
    db.query("SELECT * FROM shop WHERE username = ? ",[username],
    async(err,result)=>{

        
        
        // console.log(result)

        if(err){
            res.send({err: err});
        }
       
        if (result.length > 0){
        //  { const validp=  await bcrypt.compare(password,result[0].password);   
            // console.log(result[0])
            // console.log(password)
            if(password == result[0].password)
              {
                console.log("---------> Login Successful");
                // res.send({ message: "Successful login" });
                shopid= result[0].shop_id;
                res.status(200).send({shopid}); 
                
              } 
       else {
         
            res.send({ message: "Password does not match" });
          }
        }
        else
        {
            res.send({ message: "User doesn't exist" });
        }
}
);
        
      
      
    });

app.post('/displayProd',(req,res)=>{
    const item = req.body.item;
    // console.log(item);
    
    if(item=="products" || item=="product"){
        db.query("SELECT p.p_name, p.pid,p.qnty, p.img, s.subcatg_name,p.price,case when p.pid not in (select bf.pid from buffer bf) then 0 else (select b.qty from buffer b where b.pid=p.pid) end as qty  FROM products p, category c, subcategory s WHERE ( p.catg_id = c.catg_id AND p.subcatg_id = s.subcatg_id) GROUP by p.p_name",
    (err,result)=>{
        // if(err){
        //     res.send({err: err});
        // }
        // else{
            // console.log(result[1])
            res.send(result)
        
    })
    }
    else{
        db.query("SELECT p.p_name, p.pid,p.qnty, p.img, sc.subcatg_name,p.price,case when p.pid not in (select bf.pid from buffer bf) then 0 else (select b.qty from buffer b where b.pid=p.pid) end as qty  FROM products p, category c, subcategory sc, shop s WHERE ( p.catg_id = c.catg_id AND p.subcatg_id = sc.subcatg_id AND p.shop_id=s.shop_id) AND( p.p_name LIKE '%"+item+"%' OR c.catg_name LIKE '%"+item+"%' OR sc.subcatg_name LIKE '%"+item+"%' OR p.brand LIKE '%"+item+"' OR s.shop_name LIKE '%"+item+"% GROUP by p.p_name')",
    (err,result)=>{
        if(err){
            res.send({err: err});
            console.log(err)
        }
        else{
            // console.log(result.length)
            res.send(result)
        }
    })
    }
    

})

app.post('/cart',(req,res)=>{
    const command = req.body.command;
    // db.query("DELETE FROM cart WHERE cart_id in (select cart_id from cart where TIME_TO_SEC(timediff(now(),arrival))>300)",
    // (err,result)=>{
    //     if(err){
    //         console.log(err);
    //     }
    // })
    db.query("select cart_id,pid from cart where TIME_TO_SEC(timediff(now(),arrival))>300",(err,result)=>{
        if(err){
            console.log(err);
         }
         let i=0
         for(;i<result.length;i++){
             db.query("DELETE FROM cart WHERE cart_id =?",[result[i].cart_id])
             db.query("update buffer set qty = (select sum(c.qty) from cart c where pid=?) where pid=?",[result[i].pid,result[i].pid])
         }
    })
    // db.query("update buffer set qty = (select total(c.qty) from cart c where pid=?) where pid=?",[pid,pid],(err1,result1)=>{
    //     if(err1){
    //         console.log(err1)
    //     }
    //  })
    db.query("delete from cart where pid in (select pid from products where qnty=0)")
    db.query("select pid from cart",(err,result)=>{
        if(err){
            console.log(err)
        }
        let i=0;
        for(;i<result.length;i++){
            db.query("update buffer set qty = (select sum(c.qty) from cart c where pid=?) where pid=?",[result[i].pid,result[i].pid])
        }
    })
    db.query("delete from buffer where qty=0")
    db.query("SELECT b.qty,c.cart_id,c.user_id FROM buffer b, cart c WHERE b.pid=c.pid and b.qty<c.qty",(err,result)=>{
        if(err){
            console.log(err)
        }
        else if(result.length>0){
            for(i=0;i<result.length;i++){
                console.log(result[i])
                let qty = result[i].qty
                const cart_id = result[i].cart_id
                const user_id = result[i].user_id
                db.query("UPDATE cart set qty= ? where cart_id =? and user_id=?",[qty,cart_id,user_id],(err,result)=>{
                    if(err){
                        console.log(err)
                    }
                })
            }
        }
    })
    
    if(command=="insert"){
        const pid = req.body.pid;
        const user_id = req.body.user_id;
        const price = req.body.price;
        const qnty = req.body.qnty;
        console.log(req.body); 
    db.query("SELECT * from cart where user_id=? and pid = ?",[user_id,pid],(err,result)=>{
        if(err){
            return console.log(err);
        }
        else if(result.length==0){
            db.query("INSERT INTO cart(user_id,pid,qty,price,arrival) VALUE(?,?,?,?,now())",[user_id,pid,qnty,price],
          (err,result)=>{
        // console.log(result);
          if(err){
            return console.log(err);
        }
        
        })
        }
        else if(result.length>0){
            db.query("SELECT now()",(err,result)=>{
                // if(err){
                //     return console.log(err);
                // }
                console.log(result);
            })
            db.query("UPDATE cart set qty = (qty+?), arrival= now() where user_id=? and pid = ?",[qnty,user_id,pid],
          (err,result)=>{
        // console.log(result);
        if(err){
            return console.log(err);
        }
        })
        } 
        db.query("select * from buffer where pid=?",[pid],(err,result)=>{
            if(err){
                return console.log(err);
            }
            else if(result.length==0){
                db.query("insert into buffer(pid,qty) values(?,?)",[pid,qnty],(err1,result1)=>{
                    if(err1){
                        console.log(err1)
                    }
                })
            }
            else if(result.length>0){
                db.query("update buffer set qty =(qty+?) where pid=?",[qnty,pid],(err1,result1)=>{
                   if(err1){
                       console.log(err1)
                   }
                })
            }
        })
    })
   }
   if(command=="display"){
    const user_id = req.body.user_id;
    db.query("SELECT p.img, p.p_name, p.brand,p.qnty,c.pid,c.cart_id, c.price,p.minprice, c.qty,gst from products p, cart c, user u,subcategory s where u.user_id = c.user_id and c.pid=p.pid and s.subcatg_id=p.subcatg_id and c.user_id = ?",[user_id],
    (err,result)=>{
        if(err){
            return console.log(err)
        }
        // console.log(result)
        res.send(result)
    })}

})

app.post('/bufferItem',(req,res)=>{
    const pid = req.body.pid
    let qnty =req.body.qnty
    let qty = 0
    let left=0
    let signal = 0
    db.query("SELECT b.qty from buffer b where b.pid=?",[pid],(err,result)=>{
        if(err){
            console.log(err)

        }
        if(result.length==0){
            left = qnty
        }
        else{
            qty = result[0].qty
            if(qnty>qty){
                left = qnty-qty
            }
            else{
                left = 0
            }

        }
        if(left<=0){
            signal = 1
        }
        result2 = {
            left: left,
            qty: qty,
            signal: signal
        }
        res.send(result2)
    })
})

app.post('/removetocart',(req,res)=>{
    const cart_id = req.body.cart_id;
    const pid = req.body.pid;
    console.log(req.body)
    db.query("DELETE FROM cart where cart_id = ?",[cart_id],(err,result)=>{
        if(err){
            return console.log(err)
        }
        console.log(pid)
        db.query("update buffer set qty = (select sum(c.qty) from cart c where pid=?) where pid=?",[pid,pid],(err1,result1)=>{
           if(err1){
               console.log(err1)
           }
        })
        db.query("delete from buffer where qty=0")
        res.send(result)
    })
})

app.post('/total_price',(req,res)=>{
    const user_id = req.body.user_id;
    db.query("SELECT SUM(qty*price) as total from cart c where c.user_id= ?",[user_id],(err,result)=>{
        if(err){
            return console.log(err)
        }
        // console.log(result)
        res.send(result)
    })
})

app.post('/qtyChange',(req,res)=>{
    const change = req.body.change;
    const cart_id = req.body.cart_id
    const user_id = req.body.user_id
    let qty=0,qnty=0;
    db.query("SELECT qty,qnty from cart c, products p where c.pid=p.pid and cart_id=? and user_id=?",[cart_id,user_id],(err,result)=>{
        if(err){
            console.log(err)
        }
        
       qty = result[0].qty
       qnty = result[0].qnty
       
    
    // console.log(qnty)
    if(change=='increase' && (qnty>qty)){
        console.log("hi")
        db.query("UPDATE cart SET qty=qty+1, arrival=now() where cart_id=? and user_id=?",[cart_id,user_id],(err,result)=>{
            if(err){
                return console.log(err)
            }
            // console.log(result)
            
        })
        
        db.query("SELECT qty,qnty from cart c, products p where p.pid=c.pid and cart_id=? and user_id=?",[cart_id,user_id],(err,result)=>{
            if(err){
                return console.log(err)
            }
            console.log(result)
            res.send(result)
        })
    }
    else if(change=='decrease'){
        db.query("UPDATE cart SET qty=qty-1, arrival=now() where cart_id=? and user_id=?",[cart_id,user_id],(err,result)=>{
            if(err){
                return console.log(err)
            }
            res.send(result)
        })
    }
})
})

app.post('/otherSeller',(req,res)=>{
    const pid = req.body.pid;
    const p_name = req.body.p_name;

    db.query('select p.pid, p.price, s.shop_name from products p, shop s where p.shop_id=s.shop_id and p.pid!=? and p.p_name LIKE "%'+[p_name ]+'%"',
    [pid],(err,result)=>{
        if(err){
            return console.log(err)
        }
        console.log(result)
        res.send(result)
    })
})
app.post('/order_display',(req,res)=>{
    console.log("display")
    const order_id= req.body.order_id
    db.query("select * from order_details where order_id=?",[order_id],(err,result)=>{
      if(err){
          console.log(err)
      }
      res.send(result)
    })
})
app.post('/orderlist',(req,res)=>{
    const command = req.body.command
    if(command=="user"){
    const user_id = req.body.user_id
    db.query("select od.order_id,p.img,p.p_name,od.order_date,case when od.delivered=0 then 'No' else 'Yes' end as delivered from order_details od,ordered_products op, products p where od.order_id=op.order_id and op.pid=p.pid and od.user_id=? order by od.delivered,od.order_date",[user_id],(err,result)=>{
        if(err){
            console.log(err)
        }
        
        res.send(result)
    })}
    else if(command=="delivered"){
        
       const shop_id = req.body.shop_id
       console.log(req.body.shop_id)
       db.query("select od.order_id,s.shop_id,od.total_price,od.ShippingAddress,od.order_date,case when od.delivered=0 then 'No' else 'Yes' end as delivered from order_details od, ordered_products op,products p, shop s where od.order_id=op.order_id and op.pid = p.pid and p.shop_id = s.shop_id and delivered=1 and s.shop_id=? order by od.order_date",[shop_id],
       (err,result)=>{
        if(err){
            console.log(err)
        }
        
        res.send(result)
       })
    }
    else if(command=="not_delivered"){
        const shop_id = req.body.shop_id
        db.query("select od.order_id,s.shop_id,od.total_price,od.ShippingAddress,od.order_date,case when od.delivered=1 then 'Yes' else 'No' end as delivered from order_details od, ordered_products op,products p, shop s where od.order_id=op.order_id and op.pid = p.pid and p.shop_id = s.shop_id and delivered=0 and s.shop_id=? order by od.order_date",[shop_id],
        (err,result)=>{
         if(err){
             console.log(err)
         }
         console.log("del",result)
         res.send(result)
        })
    }
    else if(command=="ordered_products"){
        const order_id = req.body.order_id
        db.query("select op.op_id,op.qty,op.price,p.img,p.p_name from ordered_products op, products p where op.pid=p.pid and op.order_id=?",[order_id],(err,result)=>{
            if(err){
                console.log(err)
            }
            console.log("del",result)
            res.send(result)
           
        })
    }
})

app.post('/order_delivered',(req,res)=>{
    const command= req.body.command
    const order_id = req.body.order_id
    if(command=="delivered"){
    db.query("update order_details set delivered = 1 where order_id=?",[order_id])}
    else if(command=="not_delivered"){
        db.query("update order_details set delivered = 0 where order_id=?",[order_id])
    }
    res.send("updated") 
})

app.post('/order_prod',(req,res)=>{
    const order_id= req.body.order_id
    
        console.log("billlllll")
        // const order_no= (req.body.order_id).toString()
        // console.log(order_no)
        db.query("select o.order_id,o.pid,o.qty,o.price,p.p_name,p.brand,p.price as maxprice,s.shop_name,s.shop_addr,s.phno,sc.gst from ordered_products o,products p,shop s, subcategory sc where o.pid=p.pid and p.shop_id=s.shop_id and p.subcatg_id=sc.subcatg_id and o.order_id = ?",[order_id],(err1,result1)=>{
                    if(err1){
                        console.log(err1)
                    }
                    console.log(result1)
                    res.send(result1)
                })

})

app.post('/block',(req,res)=>{
    const user_id = req.body.user_id
    const command = req.body.command
    if(command=="cart"){
        db.query("select b.pid,b.qty from products p, buffer b where p.pid=b.pid and (p.qnty-b.qty)=0",(err,result)=>{
            if(err){
                console.log(err)
            }
            if(result.length>0){
                for(let i=0;i<result.length;i++){
                    db.query("update cart c set c.qty =? where c.pid=? and c.qty>?",[result[i].qty,result[i].pid,result[i].qty])
                    db.query("update cart c set reserve = ? where c.pid =? and user_id=?",[1,result[i].pid,user_id])
                    db.query("update buffer b set block=block+(select c.qty from cart c where c.pid=? and user_id=?) where b.pid=?",[result[i].pid,user_id,result[i].pid])
                }
            }
        })
    }
    else if(command=="direct"){
        const pid = req.body.pid
        db.query("select b.qty from products p, buffer b where p.pid=b.pid and b.pid=? and (p.qnty-b.qty)=0",[pid],(err,result)=>{
            if(err){
                console.log(err)
            }
            if(result.length>0){
                // for(let i=0;i<result.length;i++){
                    db.query("update cart c set c.qty =? where c.pid=? and c.qty>?",[result[0].qty,pid,result[0].qty])
                    // db.query("update cart c set reserve = ? where c.pid =? and user_id=?",[1,result[i].pid,user_id])
                    db.query("update buffer b set block=block+? where b.pid=?",[1,pid,user_id])
                // }
            }
        })
    }
      
})

app.post('/direct',(req,res)=>{
    const user_id=req.body.user_id;
    const pid = req.body.pid
    db.query("select p.pid,p.p_name,p.minprice,p.price,p.img,sc.gst,1 as qty from products p,subcategory sc where p.subcatg_id=sc.subcatg_id and pid =?",[pid],(err,result)=>{
        if(err){
            console.log(err)
        }
        res.send(result)
    })
})
app.post('/buy',(req,res)=>{
    let command = req.body.command;
    
    // const pid = req.body.pid;
    // const qty = req.body.qty;
    // const price = req.body.price;
   
    
    const user_id =req.body.user_id;
    const ShippingAddress = req.body.ShippingAddress;
    const payment_type = req.body.payment_type;
    const delivered = req.body.delivered;
    const random = Math.floor(Math.random()*8999+1000)
    const new_id = String(user_id).padStart(3,'0')
    const order_id = new_id+"-"+ random.toString()
    const total_price = req.body.total_price
    // let new_price=0
    console.log(order_id)
    if(command=="cart"){
       db.query("select * from cart where user_id=?",[user_id],(err,result)=>{
        if(err){
            return console.log(err)
        }
        if(result.length==0){
            res.send("No products left in your cart")
        }
        else{
            for(let i=0;i<result.length;i++){
                var pqty
                db.query("select qnty,minprice from products where pid=?",[result[i].pid],(err1,result1)=>{
                    if(err1){
                        return console.log(err1)
                    }
                    console.log("min",result1[0].minprice)
                    pqty = result1[0].qnty
                    console.log("pqty",pqty)
                
                // if(pqty>=result[i].qty){
                    console.log("min",result1[0].minprice)
                    let single_profit = result[i].price-result1[0].minprice
                    let qty_profit = (result[i].price*result[i].qty)-(result1[0].minprice*result[i].qty)
                    let extra_profit = (qty_profit)-(single_profit)
                let new_price = (result[i].price*result[i].qty)-(extra_profit*0.1)
                console.log(new_price)
                
                db.query("insert into order_details(order_id,user_id,total_price,ShippingAddress,payment_type,order_date,delivered) values(?,?,?,?,?,now(),?)",[order_id,user_id,total_price,ShippingAddress,payment_type,delivered],(err1,result1)=>{
                    if(err1){
                        console.log(err)
                    }
                    console.log(result1)
                })
                db.query("insert into ordered_products(order_id,pid,qty,price) values(?,?,?,?)",[order_id,result[i].pid,result[i].qty,new_price],(err1,result1)=>{
                    if(err1){
                        console.log(err)
                    }
                    console.log(result1)
                })
                db.query("delete from cart where user_id=?",[user_id],(err1,result1)=>{
                    if(err1){
                        console.log(err1)
                    }
                })
                db
                if(result[i].reserve==0){
                db.query("update products set qnty=(qnty-?) where pid=?",[result[i].qty,result[i].pid],(err1,result1)=>{
                    if(err1){
                        console.log(err1)
                    }
                    
                    
                })
                db.query("update buffer set qty = (select sum(c.qty) from cart c where c.pid= ?) where pid=?",[result[i].pid,result[i].pid])
            }
            else if(result[i].reserve==1){
                db.query("update products set qnty=(qnty-?) where pid=?",[result[i].qty,result[i].pid],(err1,result1)=>{
                    if(err1){
                        console.log(err1)
                    }
                    
                    
                })
                db.query("update buffer set qty = (select sum(c.qty) from cart c where c.pid= ?),block=(block-?) where pid=?",[result[i].pid,result[i].qty,result[i].pid])
                // db.query("update buffer set qty = (select sum(c.qty) from cart c where c.pid= ?) where pid=?",[result[i].pid,result[i].pid])    
            }
            // }
                // db.query("select * from order_details od, ordered_products op where od.order_id=op.order_id and op.order_id = ?",[order_id],(err1,result1)=>{
                //     if(err1){
                //         console.log(err1)
                //     }
                    
                // })
            })
        } }
       })
       res.send(order_id)
    }
    else if(command=="direct"){
        // db.query("select qnty,minprice from products where pid=?",[result[i].pid],(err1,result1)=>{
        //     if(err1){
        //         return console.log(err1)
        //     }
        //     console.log("min",result1[0].minprice)
        //     pqty = result1[0].qnty
        //     console.log("pqty",pqty)
        
        // // if(pqty>=result[i].qty){
        //     console.log("min",result1[0].minprice)
        //     let single_profit = result[i].price-result1[0].minprice
        //     let qty_profit = (result[i].price*result[i].qty)-(result1[0].minprice*result[i].qty)
        //     let extra_profit = (qty_profit)-(single_profit)
        // let new_price = (result[i].price*result[i].qty)-(extra_profit*0.1)
        // console.log(new_price)
        
        const pid =req.body.pid
        db.query("select qnty from products p where pid = ?",[pid],(errq,resultq)=>{
            if(errq){
                console.log(errq)
            }
            if(resultq[0].qnty>0){

           
        const price = req.body.price
        db.query("insert into order_details(order_id,user_id,total_price,ShippingAddress,payment_type,order_date,delivered) values(?,?,?,?,?,now(),?)",[order_id,user_id,total_price,ShippingAddress,payment_type,delivered],(err1,result1)=>{
            if(err1){
                console.log(err)
            }
            console.log(result1)
        })
        db.query("insert into ordered_products(order_id,pid,qty,price) values(?,?,?,?)",[order_id,pid,1,price],(err1,result1)=>{
            if(err1){
                console.log(err)
            }
            console.log(result1)
        })
        
        db.query("select b.qty from products p, buffer b where p.pid=b.pid and b.pid=? and (p.qnty-b.qty)>0",[pid],(err2,result2)=>{
            if(err2){
                console.log(err2)
            }
        if(result2.length>0){
        db.query("update products set qnty=(qnty-?) where pid=?",[1,pid],(err1,result1)=>{
            if(err1){
                console.log(err1)
            }
            
            
        })
        db.query("update buffer set qty = (select sum(c.qty) from cart c where c.pid= ?) where pid=?",[pid,pid])
    }
    else if(result2.length==0){
        db.query("update cart set qty=(qty-?) where pid=?",[1,pid])
        db.query("update products set qnty=(qnty-?) where pid=?",[1,pid])
        db.query("update buffer set qty = (select sum(c.qty) from cart c where c.pid= ?),block=(block-?) where pid=?",[pid,1,pid])
        
        }
    })
    if(resultq[0].qnty==0){
        db.query("delete from cart where pid=?",[pid])
        db.query("delete from buffer where pid=?",[pid])
    }
    
    // }
        // db.query("select * from order_details od, ordered_products op where od.order_id=op.order_id and op.order_id = ?",[order_id],(err1,result1)=>{
        //     if(err1){
        //         console.log(err1)
        //     }
            
        // })
     }
    })
    res.send(order_id)
    }


})

app.post('/cart_count',(req,res)=>{
    const user_id =req.body.user_id;
    db.query("SELECT count(*) as count from cart where user_id=?",[user_id],(err,result)=>{
        if(err){
            return console.log(err)
        }
        // console.log(result)
        res.send(result)
    })

    
})

app.post('/edit_profile',(req,res)=>{
    // console.log("edit")
    
    const command = req.body.command;
    if(command=="display_user"){
        const user_id =req.body.user_id;
        db.query("SELECT first_name,middle_name,last_name,home_addr,email,phno from user where user_id=?",[user_id],(err,result)=>{
            if(err){
                return console.log(err)
            }
            // console.log(result)
            res.send(result)  
        })
    }

    if(command=="display_shop"){
        const shop_ID =req.body.shop_ID;
        db.query("SELECT shop_name,adm_name,shop_addr,email,phno,username from shop where shop_ID=?",[shop_ID],(err,result)=>{
            if(err){
                return console.log(err)
            }
            // console.log(result)
            res.send(result)  
        })
    }
    if(command=="update_user"){
        console.log(req.body)
        const user_id = req.body.user_id;
        const fname = req.body.fname
        const mname = req.body.mname
        const lname = req.body.lname
        const addr = req.body.addr
        const phno = req.body.phno

        if(fname!=''){
            db.query("update user set first_name=? where user_id=?",[fname,user_id],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(mname!=''){
            db.query("update user set middle_name=? where user_id=?",[mname,user_id],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(lname!=''){
            db.query("update user set last_name=? where user_id=?",[lname,user_id],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(addr!=''){
            db.query("update user set home_addr=? where user_id=?",[addr,user_id],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(phno!=''){
            db.query("update user set phno=? where user_id=?",[phno,user_id],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        db.query("select * from user where user_id=?",[user_id],(err,result)=>{
            if(err){
                console.log(err)
            }
            res.send(result)
        })
    }

    if(command=="update_shop"){
        console.log(req.body)
        const shop_ID = req.body.shop_ID;
        const sname = req.body.sname
        const name = req.body.name
        // const uname = req.body.uname
        const addr = req.body.addr
        const phno = req.body.phno
        let shop_ID1 = req.body.shop_ID;
        let sname1 = req.body.sname
        let name1 = req.body.name
        // const uname = req.body.uname
        let addr1 = req.body.addr
        let phno1 = req.body.phno
        db.query("select shop_name,adm_name,shop_addr,phno from shop where shop_ID=?",[shop_ID],(err,result)=>{
            if(err){
                console.log(err)
            }
            console.log(result.data)
        })

        if(sname!=''){
            db.query("update shop set shop_name=? where shop_ID=?",[sname,shop_ID],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(name!=''){
            db.query("update user set adm_name=? where shop_ID=?",[name,shop_ID],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        // if(lname!=''){
        //     db.query("update user set username=? where shop_ID=?",[uname,shop_ID],(err,result)=>{
        //         if(err){
        //             console.log(err)
        //         }
        //     })
        // }
        if(addr!=''){
            db.query("update user set shop_addr=? where shop_ID=?",[addr,shop_ID],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        if(phno!=''){
            db.query("update shop set phno=? where shop_ID=?",[phno,shop_ID],(err,result)=>{
                if(err){
                    console.log(err)
                }
            })
        }
        db.query("select * from shop where shop_ID=?",[shop_ID],(err,result)=>{
            if(err){
                console.log(err)
            }
            res.send(result)
        })
    }
    
})

const port = process.env.PORT || 3002;
app.listen(port,()=>{console.log("Server Ready at "+port)});