import React, {useEffect,useState} from 'react'
import Axios from 'axios'
import { Link } from "react-router-dom";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {  faCartShopping, faTrash} from '@fortawesome/free-solid-svg-icons'
import {Container,Row ,Card, Col, Button} from 'react-bootstrap';
import "../styles/cart2.css"
import { useNavigate } from 'react-router-dom';

function Cart2() {

  let [prods,setProducts]= useState([]);
  let [order,setOrder]= useState([]);
  // let [od,setOD]= useState([]);
  // let [oprod,setOProd]= useState([]);
  let index = 0;
  let index2 =0;
  const [total_price,setTotal]= useState("");
  let cart_price=0
  // const [disable,setDisabled] = useState("");
  let disable
  let navigate= useNavigate();
  // const [cqty,setCQty] = useState("");
  // const [pqnty,setPqnty] = useState("");
  // const [p_name,setProd_name]=useState("");
  // const [pid,setPid]= useState("")
  // const [user_id,setUserId]=useState("");
  // const [price,setPrice]= useState("")
  // const [qnty,setQnty]=useState("");
  // const [brand,setBrand]= useState("")
  
  useEffect( ()=>{
    refresh();
    setTimeout(function() {
      // window.location.reload();
      refresh()
    }, 35000);
  },[])

  const refresh =()=>{
    prod_display();
    order_display();
    total();
  }

  const prod_display = ()=>{
    // setPid(localStorage.getItem("pid")) 
    // setUserId(localStorage.getItem("user_id"))
    // setQnty(localStorage.getItem("qnty")) 
    // setPrice(localStorage.getItem("price")) 

    // console.log("local",pid);
    Axios.post("http://localhost:3002/cart",{
      command: "display",
      user_id: localStorage.getItem("user_id")
    }).then((response)=>{
      setProducts(response.data)
      
      console.log(response.data)
      // itemRemove();
      // card_display(prod)
      
      
    })
       
        // card_display(prod[i]);
      }
  const order_display=()=>{
    Axios.post("http://localhost:3002/orderlist",{
      command: "user",
      user_id: localStorage.getItem("user_id")
    }).then((response)=>{
      console.log(response.data)
      setOrder(response.data)
    })
  }
  const total = ()=>{
    Axios.post("http://localhost:3002/total_price",{
      user_id:localStorage.getItem("user_id")
    }).then((response)=>{
       setTotal(response.data[0].total)
       console.log(total_price)
    })
  }

  const discount=(minprice,price,qty)=>{
    
     let single_profit = price-minprice
     let qty_profit = (price*qty)-(minprice*qty)
     let extra_profit = (qty_profit)-(single_profit)
     
     cart_price = (price*qty)-(extra_profit*0.1)
     
     console.log("cartprice",cart_price,minprice)
  }
  // const itemRemove = ()=>{
  //   localStorage.removeItem("pid");
  //   localStorage.removeItem("qnty");
  //   localStorage.removeItem("price")
  // }
  const inc_btn = (prod,pid)=>{
    increase(prod);
    btn_disable(prod);
  }

  const dec_btn = (prod,pid)=>{
    decrease(prod);
    btn_disable(prod);
  }
  const btn_disable = (prod)=>{

    let qty = prod.qty;
    let qnty = prod.qnty; 
    let cid = prod.cart_id
    if(qnty==qty){
     document.getElementById(cid).disabled =true}
    else{
       document.getElementById(cid).disabled =false
     
  }
  console.log(disable==prod.cart_id,"jio")
    
    // if(qty==qnty){
    //       showDisabled(true)
    //    }
    // else{
    //      showDisabled(false)
    //    }
  }
  const increase= (prod)=>{
     let val
    //  qty = qty+1
    //  console.log(qty)
     Axios.post("http://localhost:3002/qtyChange",{
     change: "increase",
     cart_id: prod.cart_id,
     user_id: localStorage.getItem("user_id")
    }).then((response)=>{
      console.log(response.data[0].qnty)

      refresh()

      
    })
    
  }
  const decrease= (prod)=>{
    
    if(prod.qty!=1){
      
      Axios.post("http://localhost:3002/qtyChange",{
     change: "decrease",
     cart_id: prod.cart_id,
     user_id: localStorage.getItem("user_id")
    }).then((response)=>{
      console.log(response)
      // window.location.reload();
      refresh()

    })
    }
    else if(prod.qty==1){
        removetocart(prod);
    }
    
  }
  const removetocart= (prod)=>{
    console.log(prod.pid)
    if(window.confirm("Are you sure you want to remove this item?")){
    Axios.post("http://localhost:3002/removetocart",{
     cart_id: prod.cart_id,
     pid: prod.pid
    }).then((response)=>{
      console.log(response)
      // window.location.reload();
      refresh()
    })}
 }

 const buyNow = (pid)=>{
  localStorage.setItem("buyNow","cart")
  Axios.post("http://localhost:3002/block",{
    user_id: localStorage.getItem("user_id"),
    command: "cart"
   }).then((response)=>{
     
     console.log("blocked")
     // window.location.reload();
    //  refresh()
   })
   navigate('/buy')
 }
 const showOrder=(ord)=>{
    if(order.length==0){
      return <div>No Orders</div>
    }
    else{
      return <table className="table table-hover text-center table-responsive-sm caption-top">
      <caption className='text-dark bg-light'>Your Orders</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Ordered Product</th>
          <th scope="col">Product Name</th>
          <th scope="col">Date and Time</th>
          <th scope="col">Delivered</th>
          <th scope="col">More Details</th>
          
        </tr>
      </thead>
      <tbody>
        {
          order.map((ord =>

            < tr key={ord.order_id}>
              {/* {showOrder(ord)} */}
              <th scope="row">{++index2}</th>
              <td><img src={ord.img} style={{ width: '4rem' }} /></td>
              <td>{ord.p_name}</td>
              <td>{dateTime(ord.order_date)}</td>
              <td>{ord.delivered}</td>
              <td><button onClick={()=>localStorage.setItem('order_id',ord.order_id)}><Link to="/bill">View Details</Link></button></td>
            </tr >
          ))}
      </tbody>
    </table>
    }
    
  
 }

//  const order_products =(ord)=>{
//   Axios.post("http://localhost:3002/order_prod",{
//       order_id: ord.order_id
//     }).then((response)=>{
      
//       setOProd(response.data);
//       console.log(oprod)
//       // itemRemove();
//       // card_display(prod)
      
      
//     })
// }
const dateTime=(s)=>{
  let d = new Date(s);
  return (d.toLocaleString('en-IN')) 
  // console.log(d.toUTCString())
}

  return (
    <div className='cart-div'>
    
      <Container className='mt-2'>
        {/* <Row className='row justify-content-center'> */}
        {/* {products.map((item) => ( */}
          {/* <Col className='col-3'>
            <Card  >
              <Card.Img src="https://m.media-amazon.com/images/I/617SMwcS4HS._AC_UL480_FMwebp_QL65_.jpg" variant='top' style={{maxWidth: "150px", maxHeight: "300px"}} />
              <Card.Body>
                <Card.Title>
                  ProductName - Rs 300
                </Card.Title> */}
                {/* {
                  item.cart == false
                  &&
                  <button className='btn btn-primary' onClick={() => addtocart(item)}>
                    Add to cart
                </button>
                } */}
                {/* {
                  item.cart == true
                  &&
                  <button className='btn btn-success' onClick={() => addtocart(item)}>
                    Added
                </button>
                } */}
              {/* </Card.Body>
            </Card>
          </Col> */}

        {/* ))} */}
        {/* </Row> */}
      
      <Row className='mt-3'>
        <table className="table table-hover text-center table-responsive-sm caption-top">
          <caption className='text-dark bg-light'>Shopping Cart <FontAwesomeIcon icon={faCartShopping} /></caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Product</th>
              <th scope="col">Product Name</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Remove</th>
            </tr>
          </thead>
          <tbody>
            {
              prods.map((prod =>

                < tr key={prod.pid}>
                  {discount(prod.minprice,prod.price,prod.qty)}
                  
                  <th scope="row">{++index}</th>
                  <th scope="row">
                    <img src={prod.img} style={{ width: '4rem' }} />
                  </th>
                  <td>{prod.p_name}</td>
                  <td>
                    {/* {(prod.price)*(prod.qty)} */}
                    
                    {cart_price}
                  </td>
                  <td><tr>
                  <td>
                    <button
                      onClick={() => dec_btn(prod)}
                      className="btn btn-primary btn-sm"
                    >
                      -
                      </button></td><td>
                      <button className='btn btn-light btn-sm' disabled>
                      {prod.qty}
                      </button>
                    </td><td>
                      
                    <button
                      onClick={() => inc_btn(prod)}
                      id = {prod.cart_id}
                      
                      className="btn btn-primary btn-sm"
                      size="sm"
                    >
                      +
                      </button>
                      {/* {btn_disable(prod)} */}
                  </td>
                  </tr></td>
                  <td>
                    <button onClick={() => removetocart(prod)} className="btn btn-danger">
                      <FontAwesomeIcon icon={faTrash} />
                      </button>
                  </td >
                </tr >
              ))}
          </tbody>
        </table>
      </Row>
      <Row>
        <Col className="text-center">
          <h4>TOTAL: {total_price}</h4>
        </Col>
        
      </Row>
      <Row>
      <Col className="text-center">
        <button onClick={() => buyNow()} className='btn btn-success'>Buy Now</button>
        </Col>
      </Row>
      <Row className='mt-3'>
        {showOrder()}
      </Row>
      
      </Container>
    </div>
  )
}

export default Cart2
