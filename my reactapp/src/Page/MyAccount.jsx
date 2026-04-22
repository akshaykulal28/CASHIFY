import React, { useEffect, useState } from "react";
import axios from "axios";
import '../CSS/UserPanel.css';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

function UserPanel() {
    const API = import.meta.env.VITE_API;

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const storedUser = JSON.parse(
        localStorage.getItem("authUser") || localStorage.getItem("user") || "null"
    );
    const userId = storedUser?._id || storedUser?.id;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchDashboard(userId);
    }, []);

    const fetchDashboard = async (id) => {
        try {
            const res = await axios.get(`${API}/api/order/user/dashboard/${id}`, {
                params: {
                    email: storedUser?.email || ""
                }
            });

            setDashboard(res.data);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    const pieColors = [
        "#22c55e",
        "#f59e0b",
        "#ef4444",
        "#3b82f6",
        "#8b5cf6"
    ];

    if (loading) {
        return <h2 className="loading">Loading Dashboard...</h2>;
    }

    if (!dashboard) {
        return <h2 className="loading">No dashboard data available.</h2>;
    }

    return (

        <div className="userPanel">
            <div className="container">

                <h1 className="title">
                    Welcome, {storedUser?.name}
                </h1>

                <div className="cardGrid">

                    <div className="card">
                        <h3>Total Orders</h3>
                        <p>{dashboard.totalOrders}</p>
                    </div>

                    <div className="card">
                        <h3>Total Products Bought</h3>
                        <p>{dashboard.totalProducts}</p>
                    </div>

                    <div className="card">
                        <h3>Total Spent</h3>
                        <p>₹ {dashboard.totalSpent}</p>
                    </div>

                    <div className="card">
                        <h3>Delivered</h3>
                        <p>{dashboard.delivered}</p>
                    </div>

                    <div className="card">
                        <h3>Pending</h3>
                        <p>{dashboard.pending}</p>
                    </div>

                    <div className="card">
                        <h3>Cancelled</h3>
                        <p>{dashboard.cancelled}</p>
                    </div>

                </div>

                <div className="chartGrid">

                    <div className="chartBox">
                        <h2>Order Status</h2>

                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={dashboard.statusChart}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={110}
                                    label
                                >
                                    {dashboard.statusChart.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={pieColors[index % pieColors.length]}
                                        />  
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chartBox">
                        <h2>Monthly Spending</h2>

                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={dashboard.monthChart}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#fc8019" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                <div className="recentBox">
                    <h2>Recent Orders</h2>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {dashboard.recentOrders.map((order, index) => (
                                <tr key={index}>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>

                                    <td>
                                        {Array.isArray(order.items) ? order.items.length : Number(order.quantity || 0)}
                                    </td>

                                    <td>
                                        ₹ {order.totalAmount}
                                    </td>

                                    <td>
                                        {order.status || order.deliveryStatus || "Pending"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>



    );
}

export default UserPanel;