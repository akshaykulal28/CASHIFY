import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import '../CSS/Header.css';

function Header() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, clearUserProfile } = useContext(AuthContext);

  const navItems = [
    { 
      title: 'All', 
      content: [
        { category: 'Sell', items: ['Phone','Laptop','Smartwatch','Tab'] },
      ] 
    },


 { title: 'Sell Phone', content: [
      {category: 'Top Brands' ,items:[ 'Apple','Samsung','xiomi','Oneplus','Nokia','Poco','Other Brands']},
      {category: 'Popular Models' ,items:[ 'iPhone 14 Series','iPhone 13 Series','iPhone 12 Series','Samsung S22 Series','Samsung S21 Series','Oneplus 10 Series']},
    ] },


    { title: 'Sell Gadgets', content: [

    ] },



    { title: 'Buy Refurbished Devices', content: [
      {items:['Refurbished Mobiles','Refurbished Laptops','Refurbished Smartwatches','Refurbished Tabs','Refurbished Cameras']},
      {category: 'Top Brands' ,items:[ 'Apple','Samsung','xiomi','Oneplus','Nokia','Poco','Other Brands']},
    ] },


    { title: 'Find New Gadget', content: [] },


    { title: 'Buy Laptop', content: [] },


    { title: 'Cashify Store', content: [
      {category:['More in Cashify stores'], items:['Delhi','Mumbai','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Surat','Jaipur']},
    ] },


    { title: 'More', content: [
      {items: ['New offers','Partner with us','Contact us','warranty policy','Refer &Earn']}
    ] },
  ];



  return (
    <header className="header">
      <nav className="main-nav">
        <Link to="/" className="logo">
          <img id='logo1' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLNBNRoRkj5nLsz1k2_zLJVjp2IZpk4sU9XA&s" alt="Cashify Logo" />
        </Link>

        <div className="search-bar">
          <span className="search-icon"></span>
          <input
            type="text"
            placeholder="Search for mobiles, accessories & More"
          />
        </div>

        {/* <div className="nav-right">
          <div className="location">
            <span className="location-icon"></span>
            <span>Mangalore</span>
            <span className="dropdown-arrow">▾</span>
          </div>
          {isAuthenticated && userEmail ? (
            <>
              <span className="login-btn" title={userEmail}>{userEmail}</span>
              <button
                className="login-btn"
                onClick={() => {
                  clearUserProfile();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={() => navigate('/Myaccount')}>My Account</button>
          )}
        </div> */}
        <button className="login-btn" onClick={() => navigate('/Myaccount')}>My Account</button>
      </nav>

      <nav className="bottom-nav">
        {navItems.map((item, index) => (
          <div 
            className="nav-item" 
            key={index}
            onMouseEnter={() => setActiveDropdown(index)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <span className={`nav-link ${index === 0 ? 'active' : ''}`}>
              {item.title}
              <span className="dropdown-arrow">▾</span>
            </span>
            
            {activeDropdown === index && item.content.length > 0 && (
              <div className="dropdown-menu">
                {item.content.map((section, idx) => (
                  <div key={idx} className="dropdown-section">
                    <div className="dropdown-category">{section.category}</div>
                    {section.items.map((subItem, subIdx) => (
                      <a href="#" key={subIdx} className="dropdown-item">
                        {subItem}
                        <span className="arrow-right">›</span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}

export default Header;