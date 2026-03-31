// import '../CSS/OurService.css';
// import SellPhone from '../assets/Sell phone.avif';
// import BuyGadgets from '../assets/Buy gadgets.avif';
// import BuyPhone from '../assets/Buy Phone.avif';
// import BuyLaptops from '../assets/Buy Laptops.avif';
// import RepairPhone from '../assets/Repair Phone.avif';
// import RepairLaptop from '../assets/Repair Laptop.avif';
// import FindNewPhone from '../assets/Find New Phone.avif';
// import NearbyStores from '../assets/Nearby Stores.avif';
// import BuySmartwatch from '../assets/Buy Smartwatch.avif';
// import Recycle from '../assets/Recycle.avif';

// const services = [
//   { img: SellPhone, label: 'Sell Phone' },
//   { img: BuyGadgets, label: 'Buy Gadgets' },
//   { img: BuyPhone, label: 'Buy Phone' },
//   { img: BuyLaptops, label: 'Buy Laptops' },
//   { img: RepairPhone, label: 'Repair Phone' },
//   { img: RepairLaptop, label: 'Repair Laptop' },
//   { img: FindNewPhone, label: 'Find New Phone' },
//   { img: NearbyStores, label: 'Nearby Stores' },
//   { img: BuySmartwatch, label: 'Buy Smartwatches' },
//   { img: Recycle, label: 'Recycle' },
// ];


import '../CSS/OurService.css';
import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const API = process.env.API

function OurService() {

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=> {fetchProducts();},[]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try{
      const res = await fetch(`${API}/api/services/all`);
      const data =await res.json();
      if(res.ok) setProducts(data);
      else setError(data.message || 'Failed to fetch Products');
    }catch{
      setError('server error. Makesure backend is running')
    }finally {
            setLoading(false);
        }
    };
    

  return (
    <section className="our-service-section">
      <h2 className="section-title">Our Services</h2>
      <div className="our-service-grid">
        {products.map((product) => (
          <div className="service-card">
            <div className="service-card-img">
              <img src={`${API}/uploads/${product.ImageUrl}`} alt={product.Title} />
            </div>
            <span className="service-card-label">{product.Title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OurService;

