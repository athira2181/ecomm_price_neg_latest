import React, { useEffect, useState } from 'react'
import Axios from 'axios'

function OrderedProducts() {
    let [products,setProd]= useState([]);
    let index2=0
  
    useEffect( () =>{
      ordered_products()
    } , [] )

    const ordered_products=()=>{
       Axios.post("http://localhost:3002/orderlist",{
      command: "ordered_products",
      order_id: localStorage.getItem("order_id")
    }).then((response)=>{
      console.log(response.data)
      setProd(response.data)
    })
    }

  return (
    <div>
      <table className="table table-hover text-center table-responsive-sm caption-top">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Product</th>
          <th scope="col">Product Name</th>
          <th scope="col">Quantity</th>
          <th scope="col">Price</th> 
        </tr>
      </thead>
      <tbody>
        {
          products.map((prod =>

            < tr key={prod.op_id}>
              {/* {showOrder(ord)} */}
              <th scope="row">{++index2}</th>
              
              <td><img src={prod.img} style={{ width: '4rem' }} /></td>
              <td>{prod.p_name}</td>
              <td>{prod.qty}</td>
              <td>{prod.price}</td>
            </tr >
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrderedProducts
