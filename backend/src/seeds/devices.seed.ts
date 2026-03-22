
import { bulkImportService } from "../services/BulkImportService";
import logger from "../utils/logger";

const DEVICE_SEED_DATA = [
    // ── Smartphones ─────────────────────────────────────────────────────────
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15 Pro Max', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15 Pro', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 14 Pro', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 13', specs: { storage: '128GB', display: '6.1-inch' } },

    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S24 Ultra', specs: { storage: '256GB', display: '6.8-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S24', specs: { storage: '128GB', display: '6.2-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy Z Fold5', specs: { storage: '256GB', display: '7.6-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy Z Flip5', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy A55', specs: { storage: '128GB', display: '6.6-inch' } },

    { type: 'smartphone', brand: 'Google', name: 'Pixel 8 Pro', specs: { storage: '128GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Google', name: 'Pixel 8', specs: { storage: '128GB', display: '6.2-inch' } },
    { type: 'smartphone', brand: 'Google', name: 'Pixel 7a', specs: { storage: '128GB', display: '6.1-inch' } },

    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus 12', specs: { storage: '256GB', display: '6.82-inch' } },
    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus 12R', specs: { storage: '128GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus Nord 3', specs: { storage: '128GB', display: '6.74-inch' } },

    { type: 'smartphone', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra', specs: { storage: '512GB', display: '6.73-inch' } },
    { type: 'smartphone', brand: 'Xiaomi', name: 'Xiaomi 14', specs: { storage: '256GB', display: '6.36-inch' } },
    { type: 'smartphone', brand: 'Xiaomi', name: 'Xiaomi 13T Pro', specs: { storage: '256GB', display: '6.67-inch' } },

    { type: 'smartphone', brand: 'Redmi', name: 'Redmi Note 13 Pro+', specs: { storage: '256GB', display: '6.67-inch' } },
    { type: 'smartphone', brand: 'Redmi', name: 'Redmi Note 13', specs: { storage: '128GB', display: '6.67-inch' } },
    { type: 'smartphone', brand: 'Redmi', name: 'Redmi 13C', specs: { storage: '128GB', display: '6.74-inch' } },

    { type: 'smartphone', brand: 'Poco', name: 'Poco F6 Pro', specs: { storage: '256GB', display: '6.67-inch' } },
    { type: 'smartphone', brand: 'Poco', name: 'Poco X6 Pro', specs: { storage: '256GB', display: '6.67-inch' } },

    { type: 'smartphone', brand: 'Realme', name: 'Realme GT 5 Pro', specs: { storage: '256GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'Realme', name: 'Realme 12 Pro+', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Realme', name: 'Realme Narzo 60', specs: { storage: '128GB', display: '6.43-inch' } },

    { type: 'smartphone', brand: 'Vivo', name: 'Vivo X100 Pro', specs: { storage: '256GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'Vivo', name: 'Vivo V30 Pro', specs: { storage: '256GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'Vivo', name: 'Vivo Y100', specs: { storage: '128GB', display: '6.38-inch' } },

    { type: 'smartphone', brand: 'Oppo', name: 'Oppo Find X7 Ultra', specs: { storage: '256GB', display: '6.82-inch' } },
    { type: 'smartphone', brand: 'Oppo', name: 'Oppo Reno 11 Pro', specs: { storage: '256GB', display: '6.74-inch' } },
    { type: 'smartphone', brand: 'Oppo', name: 'Oppo A79', specs: { storage: '128GB', display: '6.72-inch' } },

    { type: 'smartphone', brand: 'Motorola', name: 'Motorola Edge 50 Pro', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Motorola', name: 'Moto G84', specs: { storage: '256GB', display: '6.55-inch' } },
    { type: 'smartphone', brand: 'Motorola', name: 'Moto G54', specs: { storage: '128GB', display: '6.5-inch' } },

    { type: 'smartphone', brand: 'Nokia', name: 'Nokia G42', specs: { storage: '128GB', display: '6.56-inch' } },
    { type: 'smartphone', brand: 'Nokia', name: 'Nokia C32', specs: { storage: '64GB', display: '6.52-inch' } },

    { type: 'smartphone', brand: 'Huawei', name: 'Huawei Pura 70 Pro', specs: { storage: '256GB', display: '6.8-inch' } },
    { type: 'smartphone', brand: 'Huawei', name: 'Huawei Nova 12', specs: { storage: '256GB', display: '6.88-inch' } },

    { type: 'smartphone', brand: 'Honor', name: 'Honor Magic6 Pro', specs: { storage: '512GB', display: '6.8-inch' } },
    { type: 'smartphone', brand: 'Honor', name: 'Honor 90', specs: { storage: '256GB', display: '6.78-inch' } },

    { type: 'smartphone', brand: 'Infinix', name: 'Infinix Zero 30', specs: { storage: '256GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'Infinix', name: 'Infinix Hot 40 Pro', specs: { storage: '256GB', display: '6.78-inch' } },

    { type: 'smartphone', brand: 'Tecno', name: 'Tecno Phantom V Fold', specs: { storage: '256GB', display: '7.85-inch' } },
    { type: 'smartphone', brand: 'Tecno', name: 'Tecno Camon 30 Pro', specs: { storage: '256GB', display: '6.77-inch' } },

    { type: 'smartphone', brand: 'iQOO', name: 'iQOO 12', specs: { storage: '256GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'iQOO', name: 'iQOO Neo 9 Pro', specs: { storage: '256GB', display: '6.78-inch' } },

    { type: 'smartphone', brand: 'Nothing', name: 'Nothing Phone (2)', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Nothing', name: 'Nothing Phone (2a)', specs: { storage: '128GB', display: '6.7-inch' } },

    { type: 'smartphone', brand: 'Asus', name: 'Asus ROG Phone 8 Pro', specs: { storage: '512GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'Asus', name: 'Asus Zenfone 10', specs: { storage: '256GB', display: '5.9-inch' } },

    { type: 'smartphone', brand: 'Sony', name: 'Xperia 1 VI', specs: { storage: '256GB', display: '6.5-inch' } },
    { type: 'smartphone', brand: 'Sony', name: 'Xperia 5 V', specs: { storage: '128GB', display: '6.1-inch' } },

    { type: 'smartphone', brand: 'HTC', name: 'HTC U23 Pro', specs: { storage: '256GB', display: '6.76-inch' } },

    { type: 'smartphone', brand: 'BlackBerry', name: 'BlackBerry KEY2', specs: { storage: '64GB', display: '4.5-inch' } },

    { type: 'smartphone', brand: 'Lava', name: 'Lava Blaze 2', specs: { storage: '128GB', display: '6.5-inch' } },
    { type: 'smartphone', brand: 'Micromax', name: 'Micromax In 2c', specs: { storage: '64GB', display: '6.52-inch' } },
    { type: 'smartphone', brand: 'Karbonn', name: 'Karbonn Titanium S9 Lite', specs: { storage: '32GB', display: '5.5-inch' } },
    { type: 'smartphone', brand: 'Gionee', name: 'Gionee G13 Pro', specs: { storage: '64GB', display: '6.5-inch' } },
    { type: 'smartphone', brand: 'Meizu', name: 'Meizu 21 Pro', specs: { storage: '256GB', display: '6.79-inch' } },
    { type: 'smartphone', brand: 'ZTE', name: 'ZTE Axon 50 Ultra', specs: { storage: '256GB', display: '6.8-inch' } },

    // ── Tablets ──────────────────────────────────────────────────────────────
    { type: 'tablet', brand: 'Apple', name: 'iPad Pro 13 (M4)', specs: { storage: '256GB', display: '13-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad Pro 11 (M4)', specs: { storage: '256GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad Air 13 (M2)', specs: { storage: '128GB', display: '13-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad Air 11 (M2)', specs: { storage: '128GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad (10th Gen)', specs: { storage: '64GB', display: '10.9-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad mini (6th Gen)', specs: { storage: '64GB', display: '8.3-inch' } },

    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9 Ultra', specs: { storage: '256GB', display: '14.6-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9+', specs: { storage: '256GB', display: '12.4-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9 FE', specs: { storage: '128GB', display: '10.9-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab A9+', specs: { storage: '64GB', display: '11-inch' } },

    { type: 'tablet', brand: 'Microsoft', name: 'Surface Pro 9', specs: { storage: '128GB', display: '13-inch' } },
    { type: 'tablet', brand: 'Microsoft', name: 'Surface Go 3', specs: { storage: '64GB', display: '10.5-inch' } },

    { type: 'tablet', brand: 'Lenovo', name: 'Tab P12 Pro', specs: { storage: '128GB', display: '12.6-inch' } },
    { type: 'tablet', brand: 'Lenovo', name: 'Tab M10 Plus (3rd Gen)', specs: { storage: '64GB', display: '10.6-inch' } },
    { type: 'tablet', brand: 'Lenovo', name: 'Tab P11 Pro (2nd Gen)', specs: { storage: '128GB', display: '11.2-inch' } },

    { type: 'tablet', brand: 'Google', name: 'Pixel Tablet', specs: { storage: '128GB', display: '10.95-inch' } },

    { type: 'tablet', brand: 'Xiaomi', name: 'Xiaomi Pad 6 Pro', specs: { storage: '256GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Xiaomi', name: 'Xiaomi Pad 6', specs: { storage: '128GB', display: '11-inch' } },

    { type: 'tablet', brand: 'Realme', name: 'Realme Pad 2', specs: { storage: '128GB', display: '11.5-inch' } },
    { type: 'tablet', brand: 'Realme', name: 'Realme Pad X', specs: { storage: '128GB', display: '10.95-inch' } },

    { type: 'tablet', brand: 'Huawei', name: 'MatePad Pro 13.2', specs: { storage: '256GB', display: '13.2-inch' } },
    { type: 'tablet', brand: 'Huawei', name: 'MatePad 11.5', specs: { storage: '128GB', display: '11.5-inch' } },

    { type: 'tablet', brand: 'Honor', name: 'Honor Pad 9', specs: { storage: '256GB', display: '12.1-inch' } },
    { type: 'tablet', brand: 'Honor', name: 'Honor Pad 8', specs: { storage: '128GB', display: '12-inch' } },

    { type: 'tablet', brand: 'Nokia', name: 'Nokia T21', specs: { storage: '64GB', display: '10.36-inch' } },

    { type: 'tablet', brand: 'Amazon', name: 'Fire HD 10 (2023)', specs: { storage: '32GB', display: '10.1-inch' } },
    { type: 'tablet', brand: 'Amazon', name: 'Fire HD 8 (2022)', specs: { storage: '32GB', display: '8-inch' } },

    { type: 'tablet', brand: 'Asus', name: 'Vivobook 13 Slate OLED', specs: { storage: '128GB', display: '13.3-inch' } },
    { type: 'tablet', brand: 'Asus', name: 'Zenpad 10', specs: { storage: '32GB', display: '10.1-inch' } },

    { type: 'tablet', brand: 'Acer', name: 'Chromebook Tab 10', specs: { storage: '32GB', display: '9.7-inch' } },

    { type: 'tablet', brand: 'TCL', name: 'TCL NXTPAPER 11', specs: { storage: '128GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Alcatel', name: 'Alcatel 3T 10', specs: { storage: '16GB', display: '10.1-inch' } },
    { type: 'tablet', brand: 'Chuwi', name: 'Chuwi HiPad X Pro', specs: { storage: '128GB', display: '10.51-inch' } },

    // ── Laptops ──────────────────────────────────────────────────────────────
    { type: 'laptop', brand: 'Apple', name: 'MacBook Pro 16 (M3 Pro)', specs: { storage: '512GB', display: '16.2-inch' } },
    { type: 'laptop', brand: 'Apple', name: 'MacBook Pro 14 (M3)', specs: { storage: '512GB', display: '14.2-inch' } },
    { type: 'laptop', brand: 'Apple', name: 'MacBook Air 15 (M3)', specs: { storage: '256GB', display: '15.3-inch' } },
    { type: 'laptop', brand: 'Apple', name: 'MacBook Air 13 (M2)', specs: { storage: '256GB', display: '13.6-inch' } },

    { type: 'laptop', brand: 'Dell', name: 'XPS 13', specs: { storage: '512GB', display: '13.4-inch' } },
    { type: 'laptop', brand: 'Dell', name: 'XPS 15', specs: { storage: '512GB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Dell', name: 'Inspiron 15', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'HP', name: 'Spectre x360 14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'HP', name: 'Envy 13', specs: { storage: '512GB', display: '13.3-inch' } },
    { type: 'laptop', brand: 'HP', name: 'Pavilion 15', specs: { storage: '256GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'Lenovo', name: 'ThinkPad X1 Carbon', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Lenovo', name: 'IdeaPad Slim 5', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Lenovo', name: 'Yoga 9i', specs: { storage: '1TB', display: '14-inch' } },

    { type: 'laptop', brand: 'Asus', name: 'ROG Zephyrus G14', specs: { storage: '1TB', display: '14-inch' } },
    { type: 'laptop', brand: 'Asus', name: 'ZenBook 14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Asus', name: 'VivoBook 15', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'Acer', name: 'Swift 3', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Acer', name: 'Predator Helios 300', specs: { storage: '1TB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Acer', name: 'Aspire 5', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'MSI', name: 'Raider GE76', specs: { storage: '1TB', display: '17.3-inch' } },
    { type: 'laptop', brand: 'MSI', name: 'Stealth 15M', specs: { storage: '512GB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'MSI', name: 'Prestige 14', specs: { storage: '512GB', display: '14-inch' } },

    { type: 'laptop', brand: 'Samsung', name: 'Galaxy Book4 Pro', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Samsung', name: 'Galaxy Book3 Ultra', specs: { storage: '512GB', display: '16-inch' } },
    { type: 'laptop', brand: 'Samsung', name: 'Galaxy Book3 360', specs: { storage: '256GB', display: '13.3-inch' } },

    { type: 'laptop', brand: 'Microsoft', name: 'Surface Laptop 5', specs: { storage: '256GB', display: '13.5-inch' } },
    { type: 'laptop', brand: 'Microsoft', name: 'Surface Laptop Studio 2', specs: { storage: '512GB', display: '14.4-inch' } },

    { type: 'laptop', brand: 'Razer', name: 'Razer Blade 15', specs: { storage: '1TB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Razer', name: 'Razer Blade 14', specs: { storage: '1TB', display: '14-inch' } },

    { type: 'laptop', brand: 'Huawei', name: 'MateBook X Pro', specs: { storage: '512GB', display: '14.2-inch' } },
    { type: 'laptop', brand: 'Huawei', name: 'MateBook D 15', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'LG', name: 'LG Gram 14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'LG', name: 'LG Gram 16', specs: { storage: '1TB', display: '16-inch' } },

    { type: 'laptop', brand: 'Gigabyte', name: 'Aorus 15', specs: { storage: '1TB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Gigabyte', name: 'Gigabyte G5', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'Avita', name: 'Avita Liber V14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Infinix', name: 'Infinix InBook X2', specs: { storage: '512GB', display: '14-inch' } },

    { type: 'laptop', brand: 'Xiaomi', name: 'Mi Notebook Pro X', specs: { storage: '512GB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Xiaomi', name: 'Redmi Book Pro 15', specs: { storage: '512GB', display: '15.6-inch' } },

    { type: 'laptop', brand: 'Realme', name: 'Realme Book Prime', specs: { storage: '512GB', display: '14-inch' } },

    { type: 'laptop', brand: 'Honor', name: 'Honor MagicBook X14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Honor', name: 'Honor MagicBook 16', specs: { storage: '512GB', display: '16-inch' } },

    { type: 'laptop', brand: 'Chuwi', name: 'Chuwi GemiBook Pro', specs: { storage: '256GB', display: '14-inch' } },

    { type: 'laptop', brand: 'Fujitsu', name: 'Fujitsu Lifebook U7412', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Toshiba', name: 'Toshiba Satellite Pro C50', specs: { storage: '256GB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Panasonic', name: 'Panasonic Toughbook 55', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Sony', name: 'Sony Vaio FE15', specs: { storage: '512GB', display: '15.6-inch' } },
    { type: 'laptop', brand: 'Vaio', name: 'Vaio SX14', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Dynabook', name: 'Dynabook Portege X30L', specs: { storage: '512GB', display: '13.3-inch' } },

    // ── TVs ──────────────────────────────────────────────────────────────────
    { type: 'tv', brand: 'Samsung', name: 'Samsung Neo QLED 8K', specs: { display: '75-inch' } },
    { type: 'tv', brand: 'Samsung', name: 'Samsung QLED 4K Q80C', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Samsung', name: 'Samsung Crystal UHD', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Sony', name: 'Sony Bravia XR A95L', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Sony', name: 'Sony Bravia XR A80L', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Sony', name: 'Sony Bravia X90L', specs: { display: '75-inch' } },

    { type: 'tv', brand: 'LG', name: 'LG OLED C3', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'LG', name: 'LG QNED 85', specs: { display: '75-inch' } },
    { type: 'tv', brand: 'LG', name: 'LG UHD 4K', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Xiaomi', name: 'Xiaomi TV A2 Pro', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Xiaomi', name: 'Xiaomi Smart TV 5A Pro', specs: { display: '43-inch' } },

    { type: 'tv', brand: 'OnePlus', name: 'OnePlus TV 65 Y1S Pro', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'OnePlus', name: 'OnePlus TV 55 U1S', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Realme', name: 'Realme Smart TV 4K', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Realme', name: 'Realme SLED 4K TV', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'TCL', name: 'TCL QLED C835', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'TCL', name: 'TCL 4K UHD P635', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Panasonic', name: 'Panasonic OLED TV TZ2000', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Panasonic', name: 'Panasonic 4K LED TX-55LX700', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Philips', name: 'Philips OLED 807', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Philips', name: 'Philips 4K UHD 7600', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Hisense', name: 'Hisense ULED 4K U8K', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Hisense', name: 'Hisense 4K A7H', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Vu', name: 'Vu 4K Cinema TV', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Vu', name: 'Vu Premium 4K', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Kodak', name: 'Kodak 4K QLED', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Thomson', name: 'Thomson QLED 4K', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Blaupunkt', name: 'Blaupunkt 4K UHD Cybersound', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Motorola', name: 'Motorola ZX2 4K', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Nokia', name: 'Nokia Smart TV 5500A', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'Haier', name: 'Haier 4K QLED LE55S800QT', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Sharp', name: 'Sharp 4K UHD AQUOS', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Toshiba', name: 'Toshiba 4K UHD Fire TV', specs: { display: '55-inch' } },

    { type: 'tv', brand: 'BPL', name: 'BPL 4K Android TV', specs: { display: '43-inch' } },
    { type: 'tv', brand: 'Sansui', name: 'Sansui 4K JSW55ASUHD', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Onida', name: 'Onida 4K Fire TV', specs: { display: '43-inch' } },
    { type: 'tv', brand: 'Weston', name: 'Weston 4K Smart TV', specs: { display: '43-inch' } },
    { type: 'tv', brand: 'Lloyd', name: 'Lloyd 4K UHD LED', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'Redmi', name: 'Redmi Smart TV X65', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Redmi', name: 'Redmi Smart TV X55', specs: { display: '55-inch' } },
];

export async function seedDevices() {
    logger.info("🌱 Seeding devices (Smartphones, Tablets, Laptops & TVs)...");
    const result = await bulkImportService.seedDevices(DEVICE_SEED_DATA);
    logger.info(`✅ Seeding completed: ${result.success} succeeded, ${result.failed} failed.`);
    if (result.errors.length > 0) {
        logger.warn("⚠️ Errors during seeding:", result.errors.slice(0, 5));
    }
}
