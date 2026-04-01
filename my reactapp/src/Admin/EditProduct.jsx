import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditProduct.css';



function EditProduct() {
    const navigate = useNavigate();
    const { id } = useParams();

    const API = import.meta.env.VITE_API;

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [rating, setRating] = useState('');
    const [tag, setTag] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [productRes, servicesRes] = await Promise.all([
                fetch(`${PRODUCT_API}/api/products/${id}`),
                fetch(`${SERVICE_API}/api/services/all`)
            ]);

            const productData = await productRes.json();
            const servicesData = await servicesRes.json();

            if (!productRes.ok) {
                setError(productData.message || 'Failed to fetch product details');
                setLoading(false);
                return;
            }

            if (!servicesRes.ok) {
                setError(servicesData.message || 'Failed to fetch categories');
                setLoading(false);
                return;
            }

            setName(productData.name || '');
            setType(productData.type || '');
            setDescription(productData.description || '');
            setPrice(productData.price || '');
            setOriginalPrice(productData.originalPrice || '');
            setRating(productData.rating || '');
            setTag(productData.tag || '');
            setCategory(productData.category || '');
            setBrand(productData.brand || '');
            setImagePreview(productData.imageUrl ? `${API}/uploads/${productData.imageUrl}` : '');
            setServices(servicesData);
        } catch {
            setError('Server error. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = new FormData();
            if (image) payload.append('image', image);
            payload.append('name', name);
            payload.append('type', type);
            payload.append('description', description);
            payload.append('price', price);
            payload.append('originalPrice', originalPrice);
            payload.append('rating', rating);
            payload.append('tag', tag);
            payload.append('category', category);
            payload.append('brand', brand);

            const res = await fetch(`${PRODUCT_API}/${id}`, {
                method: 'PUT',
                body: payload
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to update product');
                return;
            }

            navigate('/ViewProduct', { state: { message: 'Product updated successfully!' } });
        } catch {
            setError('Server error. Make sure backend is running.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="status">Loading product details...</p>;

    return (
        <div className="container">
            <div className="header1 edit-header">
                <button className="back-btn" onClick={() => navigate('/ViewProduct')}>Back</button>
                <h2>Edit Product</h2>
            </div>

            {error && <p className="status-error">{error}</p>}

            <form className="addproduct-form" onSubmit={handleSubmit} encType="multipart/form-data">
                <label className="addproduct-label">Current Image</label>
                {imagePreview && (
                    <img src={imagePreview} alt={name} className="edit-preview" />
                )}

                <label className="addproduct-label">Replace Image (optional)</label>
                <input
                    type="file"
                    accept="image/*"
                    className="addproduct-input"
                    onChange={(e) => setImage(e.target.files[0] || null)}
                />

                <label className="addproduct-label">Product Name</label>
                <input
                    type="text"
                    value={name}
                    className="addproduct-input"
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label className="addproduct-label">Product Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="addproduct-label" required>
                    <option value="">Select Product Type</option>
                    <option value="Phone">Phone</option>
                    <option value="Laptop">Laptop</option>
                </select>

                <label className="addproduct-label">Description</label>
                <textarea
                    className="addproduct-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                ></textarea>

                <label className="addproduct-label">Price</label>
                <input
                    type="number"
                    className="addproduct-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />

                <label className="addproduct-label">Original Price</label>
                <input
                    type="number"
                    className="addproduct-input"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    required
                />

                <label className="addproduct-label">Rating</label>
                <input
                    type="number"
                    className="addproduct-input"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    required
                />

                <label className="addproduct-label">Tag</label>
                <input
                    type="text"
                    className="addproduct-input"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    required
                />

                <label className="addproduct-label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="addproduct-label" required>
                    <option value="">Select Category</option>
                    {services.map((service) => (
                        <option key={service._id} value={service.Title}>{service.Title}</option>
                    ))}
                </select>

                <label className="addproduct-label">Brand</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="addproduct-label" required>
                    <option value="">Select Brands</option>
                    <option value="Apple">Apple</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Realme">Realme</option>
                    <option value="Nothing">Nothing</option>
                    <option value="Dell">Dell</option>
                    <option value="Acer">Acer</option>
                    <option value="LG">LG</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="HP">HP</option>
                    <option value="Asus">Asus</option>
                </select>

                <button className="addproduct-btn" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}

export default EditProduct;
