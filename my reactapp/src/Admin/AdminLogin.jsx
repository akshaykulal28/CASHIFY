import { useState } from 'react';
import '../Admin/AdminLogin.css'
import { useNavigate } from 'react-router-dom';

function AdminLogin(){
    const navigate = useNavigate();
    const [UserName ,setUserName] =useState('')
    const [Password, setPassword] = useState('')

    const handellogin = () =>{
        if(UserName == 'Akshay@gmail.com' && Password == '12345678')
            navigate('/AdminPanel')
    }
    return(
        <div className="admin-container">
            <h2>Admin Login</h2>
            <form className="admin-form">
                <label className="admin-label">UserName</label>
                <input
                    type="text"
                    className="admin-input"
                    value={UserName } onChange={(e) => setUserName(e.target.value)}
                    required/>


                <label className="admin-label">Password</label>
                <input
                    type="password"
                    className="admin-input"
                    value={Password} onChange={(e) => setPassword (e.target.value)}
                    required/>
                <button className="admin-button" onClick={() => handellogin() } >Login</button>

            </form>
            

        </div>
    );
}

export default AdminLogin;