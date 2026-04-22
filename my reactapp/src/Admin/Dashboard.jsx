import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
	const navigate = useNavigate();
	const API = import.meta.env.VITE_API;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [metrics, setMetrics] = useState({
		products: 0,
		services: 0,
		users: 0,
		orders: 0,
		paymentsReceived: 0,
		pendingOrders: 0,
		requests: 0,
		salesToday: 0,
		salesMonth: 0,
		salesYear: 0,
	});

	const quickLinks = useMemo(() => ([
		{ label: 'Add Product', path: '/AddProduct' },
		{ label: 'View Product', path: '/ViewProduct' },
		{ label: 'Manage Users', path: '/ManageUser' },
		{ label: 'Add Service', path: '/AddService' },
		{ label: 'View Service', path: '/ViewService' },
		{ label: 'Manage Orders', path: '/ManageOrder' },
		{ label: 'Manage Requests', path: '/Managerequest' },
		{ label: 'Admin Panel', path: '/adminPanel' },
	]), []);

	const loadDashboard = async () => {
		setLoading(true);
		setError('');

		try {
			const requests = [
				fetch(`${API}/api/products/all`),
				fetch(`${API}/api/services/all`),
				fetch(`${API}/api/auth/users`),
				fetch(`${API}/api/order/all`),
				fetch(`${API}/api/phone-submission/all`),
			];

			const [productsRes, servicesRes, usersRes, ordersRes, requestsRes] = await Promise.all(requests);

			const [products, services, users, orders, requestItems] = await Promise.all([
				productsRes.json(),
				servicesRes.json(),
				usersRes.json(),
				ordersRes.json(),
				requestsRes.json(),
			]);

			if (!productsRes.ok || !servicesRes.ok || !usersRes.ok || !ordersRes.ok || !requestsRes.ok) {
				throw new Error('Failed to load dashboard metrics.');
			}

			const safeOrders = Array.isArray(orders) ? orders : [];
			const pendingOrders = safeOrders.filter((item) => item.deliveryStatus !== 'delivered').length;

			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth();
			const currentDay = now.getDate();

			const paidOrders = safeOrders.filter((item) => {
				if (!item) return false;
				return !item.paymentStatus || String(item.paymentStatus).toLowerCase() === 'paid';
			});

			const salesYear = paidOrders.filter((item) => {
				const orderDate = new Date(item.createdAt);
				return !Number.isNaN(orderDate.getTime()) && orderDate.getFullYear() === currentYear;
			}).length;

			const salesMonth = paidOrders.filter((item) => {
				const orderDate = new Date(item.createdAt);
				return !Number.isNaN(orderDate.getTime())
					&& orderDate.getFullYear() === currentYear
					&& orderDate.getMonth() === currentMonth;
			}).length;

			const salesToday = paidOrders.filter((item) => {
				const orderDate = new Date(item.createdAt);
				return !Number.isNaN(orderDate.getTime())
					&& orderDate.getFullYear() === currentYear
					&& orderDate.getMonth() === currentMonth
					&& orderDate.getDate() === currentDay;
			}).length;

			setMetrics({
				products: Array.isArray(products) ? products.length : 0,
				services: Array.isArray(services) ? services.length : 0,
				users: Array.isArray(users) ? users.length : 0,
				orders: safeOrders.length,
				paymentsReceived: paidOrders.length,
				pendingOrders,
				requests: Array.isArray(requestItems) ? requestItems.length : 0,
				salesToday,
				salesMonth,
				salesYear,
			});
		} catch (err) {
			setError(err.message || 'Unable to load dashboard.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	return (
		<div className="dashboard-page">
			<div className="dashboard-shell">
				<div className="dashboard-header">
					<div>
						<h1>Admin Dashboard</h1>
						<p>Overview of store activity and quick access to admin actions.</p>
					</div>
					<button type="button" className="dashboard-refresh" onClick={loadDashboard}>
						Refresh
					</button>
				</div>

				{error && <p className="dashboard-error">{error}</p>}

				<section className="dashboard-grid" aria-label="Dashboard metrics">
					<article className="dashboard-card">
						<span>Products</span>
						<strong>{loading ? '...' : metrics.products}</strong>
					</article>
					<article className="dashboard-card">
						<span>Services</span>
						<strong>{loading ? '...' : metrics.services}</strong>
					</article>
					<article className="dashboard-card">
						<span>Users</span>
						<strong>{loading ? '...' : metrics.users}</strong>
					</article>
					<article className="dashboard-card">
						<span>Total Orders</span>
						<strong>{loading ? '...' : metrics.orders}</strong>
					</article>
					<article className="dashboard-card">
						<span>Payments Received</span>
						<strong>{loading ? '...' : metrics.paymentsReceived}</strong>
					</article>
					<article className="dashboard-card">
						<span>Pending Orders</span>
						<strong>{loading ? '...' : metrics.pendingOrders}</strong>
					</article>
					<article className="dashboard-card">
						<span>Requests</span>
						<strong>{loading ? '...' : metrics.requests}</strong>
					</article>
					<article className="dashboard-card">
						<span>Sales Today</span>
						<strong>{loading ? '...' : metrics.salesToday}</strong>
					</article>
					<article className="dashboard-card">
						<span>Sales This Month</span>
						<strong>{loading ? '...' : metrics.salesMonth}</strong>
					</article>
					<article className="dashboard-card">
						<span>Sales This Year</span>
						<strong>{loading ? '...' : metrics.salesYear}</strong>
					</article>
				</section>

				<section className="dashboard-actions" aria-label="Quick actions">
					{quickLinks.map((link) => (
						<button key={link.path} type="button" onClick={() => navigate(link.path)}>
							{link.label}
						</button>
					))}
				</section>
			</div>
		</div>
	);
}

export default Dashboard;
