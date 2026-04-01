import { useState } from 'react';
import './AddProduct.css';
import { useEffect } from 'react';

function AddProduct() {
    // const [formData, setFormData] = useState({
    //     image: null,
    //     name: '',
    //     description: '',
    //     price: '',
    //     category: '',
    //     brand: ''
    // });

    const [image ,Setimage] = useState(null);
    const [name ,Setname] = useState('');
    const [type ,Settype] =useState('');
    const [description ,Setdescription] = useState('');
    const [price ,Setprice] = useState('');
    const [originalPrice ,SetoriginalPrice] = useState('');
    const [rating ,Setrating] = useState('');
    const [tag ,Settag] = useState('');
    const [category ,Setcategory] = useState('');
    const [brand ,Setbrand] = useState('');

    const API = import.meta.env.VITE_API;

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [products, Setproducts] = useState([]);
    const [loading, setLoading] = useState(true);


    // const handleChange = (e) => {
    //     setFormData({ ...formData, [e.target.name]: e.target.value });
    // };

    // const handlephoto = (e) => {
    //     setFormData({ ...formData, image: e.target.files[0] });
    // };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const payload = new FormData();
            payload.append('image', image);
            payload.append('name', name);
            payload.append('type',type);
            payload.append('description', description);
            payload.append('price', price);
            payload.append('originalPrice', originalPrice);
            payload.append('rating', rating);
            payload.append('tag', tag);
            payload.append('category', category);
            payload.append('brand', brand);


            const response = await fetch(`${API}/api/products/add`, {
                method: 'POST',
                body: payload
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Product added successfully!');
            } else {
                setError(data.message || 'Failed to add product');
            }
        } catch (err) {
            setError('Server error. Make sure backend is running.');
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API}/api/services/all`);
            const data = await res.json();
            if (res.ok) Setproducts(data);
            else setError(data.message || 'Failed to fetch products');
        } catch {
            setError('Server error. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2>Add Product</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form className="addproduct-form" onSubmit={handleSubmit} encType='multipart/form-data'>
                <label className="addproduct-label">Image URL</label>
                <input
                    type="file"
                    accept="image/*"
                    className="addproduct-input"
                    onChange={(e) => Setimage(e.target.files[0])}
                    required
                />

                <label className="addproduct-label">Product Name</label>
                <input
                    type="text"
                    value={name}
                    className="addproduct-input"
                    onChange={(e) => Setname(e.target.value)}
                    required
                />
                <label className='addproduct-label'>Product Type</label>
                <select value={type} onChange={(e) =>Settype(e.target.value)} className='addproduct-label' required>
                    <option value="">Select Product Type</option>
                    <option value="Phone">Phone</option>
                    <option value="Laptop">Laptop</option>
                </select>

                <label className="addproduct-label">Description</label>
                <textarea
                    className="addproduct-textarea"
                    value={description}
                    onChange={(e) => Setdescription(e.target.value)}
                    required
                ></textarea>

                <label className="addproduct-label">Price</label>
                <input
                    type="number"
                    name="price"
                    className="addproduct-input"
                    value={price}
                    onChange={(e) => Setprice(e.target.value)}
                    required
                />
                <label className="addproduct-label">Original Price</label>
                <input
                    type="number"
                    name="originalPrice"
                    className="addproduct-input"
                    value={originalPrice}
                    onChange={(e) => SetoriginalPrice(e.target.value)}
                    required
                />

                <label className="addproduct-label">Rating</label>
                <input
                    type="number"
                    name="rating"
                    className="addproduct-input"
                    value={rating}
                    onChange={(e) => Setrating(e.target.value)}
                    required
                />
                <label className="addproduct-label">Tag</label>
                <input
                    type="text"
                    name="tag"
                    className="addproduct-input"
                    value={tag}
                    onChange={(e) => Settag(e.target.value)}
                    required
                />


                <label className="addproduct-label">Category</label>

                <select value={category} onChange={(e) =>Setcategory(e.target.value)} className="addproduct-label" required>
                    <option  value="">Select Category</option>
                    {products.map((service) => (
                        <option key={service._id} value={service.Title} >{service.Title}</option>
                    ))
                }

                </select>


                <label className="addproduct-label">Brand</label>
                <select value={brand} onChange={(e) =>Setbrand(e.target.value)} className="addproduct-label" required>
                    <option value="">Select Brands</option>
                    <option value="Apple">Apple</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                    <option value="OnePlus">onePlus</option>
                    <option value="Realme">Realme</option>
                    <option value="Nothing">Nothing</option>
                    <option value="Dell">Dell</option>
                    <option value="Acer">Acer</option>
                    <option value="LG">LG</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="HP">HP</option>
                    <option value="Asus">Asus</option>
            

                </select>

                <button className="addproduct-btn" type="submit">Add Product</button>
            </form>
        </div>
    );
}

export default AddProduct;