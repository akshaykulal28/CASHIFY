import '../CSS/SellOld.css';

import SellPhone from '../assets/Sell phone.avif';
import SellLaptop from '../assets/Sell Laptop.avif';
import SellTv from '../assets/Sell Tv.avif';
import SellTablet from '../assets/Sell Tablet.avif';
import SellGamingConsoles from '../assets/Sell Gaming Consoles.avif';
import SellSmartwatch from '../assets/Sell Smartwatch.avif';
import SellSmartSpeakers from '../assets/Sell smart speakers.avif';
import SellMore from '../assets/sell more.avif';

const sellItems = [
  { img: SellPhone, label: 'Sell Phone' },
  { img: SellLaptop, label: 'Sell Laptop' },
  { img: SellTv, label: 'Sell TV' },
  { img: SellTablet, label: 'Sell Tablet' },
  { img: SellGamingConsoles, label: 'Sell Gaming Consoles' },
  { img: SellSmartwatch, label: 'Sell Smartwatch' },
  { img: SellSmartSpeakers, label: 'Sell Smart Speakers' },
  { img: SellMore, label: 'Sell More' },
];

function SellOld() {
  return (
    <section className="sell-old-section">
      <h2 className="sell-section-title">Sell Your Old Device Now</h2>
      <div className="sell-old-grid">
        {sellItems.map((item, index) => (
          <div className="sell-card" key={index}>
            <div className="sell-card-img">
              <img src={item.img} alt={item.label} />
            </div>
            <span className="sell-card-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SellOld;