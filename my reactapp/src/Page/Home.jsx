import Header from './Header';
import SellOld from './SellOld';
import Footer from './Footer';
import OurServices from './OurService';
import Carasel from './Carosel';
import BuyRefurbishedProducts from './BuyRefurbishedProducts';
import BuyRefurbishedLaptop from './BuyRefurbishedLaptop';


function Home(){
//     const [Products , setproducts]=useState('')
// useEffect(() => {
//     const fetchdata = async () => {
//         const res =await fetch(`${API}/all`);
//         const data= await res.json();
//         setproducts(data);
//     };
//     fetchdata();
// }, []);
    return(
        <div>
            <Header />
            <Carasel />
            <OurServices />
            <SellOld />
            <BuyRefurbishedProducts /> 
            <BuyRefurbishedLaptop />
            <Footer />
            

            {/* { Product && Product ? data.map ((Product) => {
                <>
                id ={product._id}
                ImageURL ={Product.ImageURL}
                Name ={Product.Name}
                Price ={Product.Price}
                Description ={Product.Description}

                </>
            })} */}

        </div>      
    );

}

export default Home;