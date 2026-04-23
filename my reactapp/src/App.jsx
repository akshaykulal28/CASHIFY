import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Page/Home'; 
import AdminLogin from './Admin/AdminLogin';
import Login from './Page/login';
import AdminPanel from './Admin/AdminPanel';
import AddProduct from './Admin/AddProduct';
import ViewProduct from './Admin/ViewProduct';
import ManageUser from './Admin/ManageUser';
import AddService from './Admin/AddService';
import ViewService from './Admin/ViewService';
import Products from './Page/Products';
import AddToCart from './Page/AddToCart';
import ManageOrder from './Admin/ManageOrder';
import EditProduct from './Admin/EditProduct';
import CheckOut from './Page/CheckOut';
import PaymentSuccess from './Page/PaymentSuccess';
import PaymentCancel from './Page/PaymentCancel';
import SellPhone from './Page/SellPhone';
import SellLaptop from './Page/SellLaptop';
import ManageRequest from './Admin/ManageRequest';
import Dashboard from './Admin/Dashboard';
import MyAccount from './Page/MyAccount';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Login />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/adminPanel" element={<AdminPanel />} />
        <Route path="/AddProduct" element={<AddProduct />} />
        <Route path="/ViewProduct" element={<ViewProduct />} />
        <Route path="/AdminPanel/edit/:id" element={<EditProduct />} />
        <Route path="/ManageUser" element={<ManageUser />} />
        <Route path="/AddService" element={<AddService />} />
        <Route path="/ViewService" element={<ViewService />} />
        <Route path="/products/:id" element={<Products />} />
        <Route path="/addtocart" element={<AddToCart />} />
        <Route path="/checkout" element={<CheckOut />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
        <Route path="/ManageOrder" element={<ManageOrder />} />
        <Route path="/service/Sell Phone" element={<SellPhone />} />
        <Route path="/service/Sell Laptop" element={<SellLaptop />} />
        <Route path="/Managerequest" element={<ManageRequest />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Myaccount" element={<MyAccount />} />

      </Routes>
    </Router>
  )
}

export default App;