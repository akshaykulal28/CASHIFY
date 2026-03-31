import '../CSS/Footer.css';
import Twitter from '../assets/Twitter.avif';
import FB from '../assets/FB.avif';
import Insta from '../assets/Insta.avif';
import YT from '../assets/YT.avif';


function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img
            className="footer-logo"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRznP4XfObqQ-OSu0LpLfK4pGZgihPK7hBPlg&s"
            alt="Cashify Logo"
          />
          <p className="follow-text">Follow us on</p>
          <div className="social-icons">
            <a href="#" className="social-icon"><img src={Twitter} alt="Twitter" /></a>
            <a href="#" className="social-icon"><img src={FB} alt="Facebook" /></a>
            <a href="#" className="social-icon"><img src={Insta} alt="Instagram" /></a>
            <a href="#" className="social-icon"><img src={YT} alt="YouTube" /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Services</h4>
          <a href="#">Sell Phone</a>
          <a href="#">Sell Television</a>
          <a href="#">Sell Smart Watch</a>
          <a href="#">Sell Smart Speakers</a>
          <a href="#">Sell DSLR Camera</a>
          <a href="#">Sell Earbuds</a>
          <a href="#">Repair Phone</a>
          <a href="#">Buy Gadgets</a>
          <a href="#">Recycle Phone</a>
          <a href="#">Find New Phone</a>
          <a href="#">Partner With Us</a>
        </div>
       
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Articles</a>
          <a href="#">Press Releases</a>
          <a href="#">Become Cashify Partner</a>
          <a href="#">Become Supersale Partner</a>
          <a href="#">Corporate Information</a>
        </div>

        
        <div className="footer-col">
          <h4>Sell Device</h4>
          <a href="#">Mobile Phone</a>
          <a href="#">Laptop</a>
          <a href="#">Tablet</a>
          <a href="#">iMac</a>
          <a href="#">Gaming Consoles</a>
        </div>

      
        <div className="footer-col">
          <h4>Help & Support</h4>
          <a href="#">FAQ</a>
          <a href="#">Contact Us</a>
          <a href="#">Warranty Policy</a>
          <a href="#">Refund Policy</a>
        </div>

       
        <div className="footer-col">
          <h4>More Info</h4>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">E-Waste Policy</a>
          <a href="#">Cookie Policy</a>
          <a href="#">What is Refurbished</a>
          <a href="#">Device Safety</a>

          <div className="chat-btn">
            <span className="chat-icon">💬</span>
            <div className="chat-text">
              <strong>Chat with Us</strong>
              <span>Got questions? Just ask.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © 2026 Cashify. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;