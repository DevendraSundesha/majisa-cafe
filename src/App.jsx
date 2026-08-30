import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertTriangle, ArrowDown, ArrowRight, Award, CalendarDays, Check, CheckCircle, ChefHat, ChevronLeft,
  ChevronRight, Clock3, Coffee, Copy, Eye, Film, Gift, Grid, Heart, Image as ImageIcon, Instagram, Key, List, Loader2, MapPin, Navigation,
  Menu as MenuIcon, Minus, Phone, Play, Plus, Quote, ShoppingBag, Sparkles,
  Star, Ticket, Trash2, UploadCloud, UtensilsCrossed, Volume2, VolumeX, X
} from 'lucide-react'
import { clearAllCouponsSupabase, clearAllProductionTestData, hasAppState, hasSupabase, markCouponRedeemed, readAppState, readCoupons, writeAppState, writeCoupons } from './supabaseApi'
import { uploadToCloudinary } from './cloudinaryUpload'
import {
  initSecurityShield,
  getLockoutState,
  saveLockoutState,
  handleFailedAdminLogin,
  handleSuccessfulAdminLogin,
  syncLockoutFromRemote,
  clientApiLimiter
} from './security'

const MENU = [
  // मारवाड़ी स्पेशल
  { id: 1, name: 'दाल बाटी चूरमा', latin: 'Dal Baati Churma', desc: 'पंचमेल दाल • घी वाली बाटी • गुड़ चूरमा', price: 289, cat: 'मारवाड़ी', atlas: 0, tag: 'घर की शान', veg: true },
  { id: 2, name: 'गट्टे की सब्ज़ी', latin: 'Gatte Ki Sabzi', desc: 'बेसन गट्टा • दही की मसालेदार ग्रेवी', price: 219, cat: 'मारवाड़ी', atlas: 1, veg: true },
  { id: 3, name: 'केर सांगरी थाली', latin: 'Ker Sangri Thali', desc: 'रेगिस्तानी केर-सांगरी • बाजरा रोटी • छाछ', price: 329, cat: 'मारवाड़ी', atlas: 2, tag: 'बालोतरा स्पेशल', veg: true },
  { id: 7, name: 'बाजरे की खिचड़ी', latin: 'Bajra Khichdi', desc: 'देसी घी • लहसुन का तड़का • गुड़', price: 189, cat: 'मारवाड़ी', atlas: 0, veg: true },

  // देसी तड़का & सब्ज़ी (DESI TADKA & INDIAN VEGETABLE)
  { id: 1401, name: 'सेव टमाटर', latin: 'Sev Tamatar', desc: 'स्पाइसी सेव • ताज़ा टमाटर तड़का ग्रेवी', price: 120, cat: 'देसी तड़का', atlas: 1, tag: 'देसी तड़का', veg: true },
  { id: 1402, name: 'दाल फ्राई', latin: 'Dal Fry', desc: 'अरहर दाल • बटर लहसुन तड़का', price: 120, cat: 'देसी तड़का', atlas: 0, veg: true },
  { id: 1403, name: 'दाल तड़का', latin: 'Dal Tadka', desc: 'देसी घी • सूखी लाल मिर्च जीरा तड़का', price: 140, cat: 'देसी तड़का', atlas: 0, tag: 'स्पेशल', veg: true },
  { id: 1404, name: 'आलू प्याज', latin: 'Aloo Piyaaz', desc: 'चटपटा आलू प्याज मसाला fry', price: 120, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1405, name: 'लहुसणिया चटनी', latin: 'Lahsuniya Chatni', desc: 'तीखी देसी लहसुन लाल मिर्च चटनी', price: 120, cat: 'देसी तड़का', atlas: 1, tag: 'तीखा', veg: true },
  { id: 1406, name: 'कढ़ी फ्राई', latin: 'Kadi Fry', desc: 'राजस्थानी बेसन कढ़ी विथ राई तड़का', price: 120, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1411, name: 'मिक्स वेज', latin: 'Mix Veg', desc: 'ताज़ा मौसमी सब्ज़ियाँ मसालेदार ग्रेवी', price: 150, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1412, name: 'बेसन गट्टा', latin: 'Besan Gata', desc: 'पारंपरिक बेसन गट्टा करी', price: 120, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1413, name: 'दही गट्टा', latin: 'Dahi Gata', desc: 'खट्टी-मीठी दही ग्रेवी बेसन गट्टा', price: 110, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1414, name: 'आलू मटर', latin: 'Aloo Matar', desc: 'हरी मटर • आलू रसेदार सब्ज़ी', price: 100, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1415, name: 'टमाटर मटर', latin: 'Tamatar Matar', desc: 'टमाटर मटर मलाईदार तड़का', price: 110, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1416, name: 'आलू गोभी', latin: 'Aloo Gobhi', desc: 'सूखी मसालेदार आलू गोभी fry', price: 110, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1417, name: 'भिंडी मसाला', latin: 'Bhindi Masala', desc: 'कुरकुरी भिंडी प्याज मसाला', price: 100, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1418, name: 'जीरा आलू', latin: 'Jeera Aloo', desc: 'जीरा हिंग तड़का सूका आलू', price: 100, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1419, name: 'वेज हांडी', latin: 'Veg Haandi', desc: 'हांडी पकी मिक्स वेज ग्रेवी', price: 130, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1420, name: 'वेज तवा मसाला', latin: 'Veg Tawa Masala', desc: 'तवा भुनी स्पाइसी सब्ज़ी', price: 140, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1421, name: 'वेज जयपुरी', latin: 'Veg Jaipuri', desc: 'जयपुर स्टाइल पापड़ वेज मलाई ग्रेवी', price: 130, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1422, name: 'वेज कोल्हापुरी', latin: 'Veg Kohlapuri', desc: 'तीखा कोल्हापुरी रेड स्पाइसी वेज', price: 140, cat: 'देसी तड़का', atlas: 1, veg: true },
  { id: 1423, name: 'वेज अंगारा', latin: 'Veg Aangra', desc: 'स्मोकी फ्लेवर कोयला अंगारा वेज', price: 150, cat: 'देसी तड़का', atlas: 1, tag: 'स्मोकी', veg: true },

  // शाही पनीर व काजू (INDIAN SHAHI)
  { id: 1501, name: 'पनीर टिक्का मसाला', latin: 'Paneer Tikka Masala', desc: 'तंदूरी पनीर टिक्का • रिच ग्रेवी', price: 210, cat: 'शाही पनीर', atlas: 3, tag: 'स्पेशल', veg: true },
  { id: 1502, name: 'पनीर बटर मसाला', latin: 'Paneer Butter Masala', desc: 'क्रीमी टोमैटो बटर सॉस विथ पनीर', price: 230, cat: 'शाही पनीर', atlas: 3, tag: 'बेस्टसेलर', veg: true },
  { id: 1503, name: 'पनीर अंगारा', latin: 'Paneer Aangara', desc: 'स्मोकी कोयला धुआँ स्पाइसी पनीर', price: 220, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1504, name: "मम्माज़ किचन स्पेशल पनीर", latin: "Mumma's Kitchen Special Paneer", desc: 'चीज लोडेड ड्राई फ्रूट्स मास्टर शेफ स्पेशल', price: 270, cat: 'शाही पनीर', atlas: 3, tag: 'मास्टर शेफ', veg: true },
  { id: 1505, name: 'चीज़ बटर मसाला', latin: 'Cheese Butter Masala', desc: 'अम्यूल चीज़ क्यूब्स क्रीमी बटर ग्रेवी', price: 230, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1506, name: 'शाही पनीर', latin: 'Shahi Paneer', desc: 'काजू मावा मलाई की मीठी-मीठी ग्रेवी', price: 180, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1507, name: 'कड़ाई पनीर', latin: 'Kadai Paneer', desc: 'कड़ाई भुना शिमला मिर्च प्याज पनीर', price: 180, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1508, name: 'पनीर हांडी', latin: 'Paneer Handi', desc: 'मिट्टी की हांडी पका क्रीमी पनीर', price: 180, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1509, name: 'मलाई कोफ़्ता', latin: 'Malai Kofta', desc: 'मावा पनीर कोफ़्ता रिच व्हाइट ग्रेवी', price: 180, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1510, name: 'मलाई प्याज', latin: 'Malai Pyaaz', desc: 'ताज़ा मलाई प्याज की क्रीमी सब्ज़ी', price: 140, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1511, name: 'पनीर पटियाला', latin: 'Paneer Patiyala', desc: 'पापड़ रोल रोस्टेड स्पाइसी पनीर', price: 200, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1512, name: 'पनीर भुर्जी लबाबदार', latin: 'Paneer Burji Lababdar', desc: 'मसाला पनीर भुर्जी रिच लबाबदार', price: 220, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1513, name: 'पनीर तूफ़ानी', latin: 'Paneer Toofani', desc: 'एक्स्ट्रा स्पाइसी रेड सॉस पनीर', price: 220, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1514, name: 'पालक पनीर', latin: 'Palak Paneer', desc: 'ताज़ा पालक प्यूरी बटर पनीर', price: 170, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1515, name: 'पनीर लहुसणिया', latin: 'Paneer Lahsaniya', desc: 'लहसुन तड़का स्पाइसी पनीर ग्रेवी', price: 200, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1516, name: 'काजू करी', latin: 'Kaju Curry', desc: 'फ्राइड काजू रिच यलो ग्रेवी', price: 220, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1517, name: 'काजू मसाला', latin: 'Kaju Masala', desc: 'स्पाइसी रेड ग्रेवी काजू फ्राइड', price: 220, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1518, name: 'खोया काजू', latin: 'Khoya Kaju', desc: 'मावा खोया स्वीट क्रीमी काजू', price: 210, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1519, name: 'काजू बटर मसाला', latin: 'Kaju Butter Masala', desc: 'काजू विथ बटर टोमैटो रिच ग्रेवी', price: 230, cat: 'शाही पनीर', atlas: 3, veg: true },
  { id: 1520, name: 'काजू पनीर मसाला', latin: 'Kaju Paneer Masala', desc: 'काजू व पनीर कॉम्बिनेशन ग्रेवी', price: 230, cat: 'शाही पनीर', atlas: 3, veg: true },

  // रोटी व नान (INDIAN BREADS)
  { id: 1601, name: 'तंदूरी रोटी', latin: 'Tandoori Roti', desc: 'गेहूँ की तंदूरी कड़क रोटी', price: 18, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1602, name: 'तंदूरी बटर रोटी', latin: 'Tandoori Butter Roti', desc: 'अमूल बटर कोटेड तंदूरी रोटी', price: 20, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1603, name: 'मिस्सी रोटी', latin: 'Missi Roti', desc: 'बेसन • अजवाइन • कसूरी मेथी मिस्सी', price: 35, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1604, name: 'प्लेन नान', latin: 'Plain Naan', desc: 'मैदा तंदूरी नान', price: 45, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1605, name: 'बटर नान', latin: 'Butter Naan', desc: 'अमूल बटर सॉफ्ट नान', price: 50, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1606, name: 'गारलिक नान', latin: 'Garlic Naan', desc: 'लहसुन धनिया बटर नान', price: 60, cat: 'रोटी व नान', atlas: 0, tag: 'बेस्ट', veg: true },
  { id: 1607, name: 'चीज़ नान', latin: 'Cheese Naan', desc: 'मोज़ेरेला चीज़ स्टफ्ड बटर नान', price: 70, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1608, name: 'चीज़ गारलिक नान', latin: 'Cheese Garlic Naan', desc: 'चीज़ स्टफ्ड गार्लिक बटर नान', price: 80, cat: 'रोटी व नान', atlas: 0, tag: 'चीज़ी', veg: true },
  { id: 1609, name: 'प्लेन कुलचा', latin: 'Plain Kulcha', desc: 'सॉफ़्ट तंदूरी कुलचा', price: 50, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1610, name: 'बटर कुलचा', latin: 'Butter Kulcha', desc: 'अमूल बटर टोस्टेड कुलचा', price: 60, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1611, name: 'प्लेन पराठा', latin: 'Plain Paratha', desc: 'तंदूरी लच्छा/प्लेन पराठा', price: 50, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1612, name: 'आलू पराठा', latin: 'Aloo Paratha', desc: 'मसाला आलू स्टफ्ड बटर पराठा', price: 60, cat: 'रोटी व नान', atlas: 0, veg: true },
  { id: 1613, name: 'पनीर पराठा', latin: 'Paneer Paratha', desc: 'पनीर मसाला स्टफ्ड अमूल बटर पराठा', price: 100, cat: 'रोटी व नान', atlas: 0, veg: true },

  // चावल व बिरयानी (RICE & BIRYANI)
  { id: 1701, name: 'प्लेन राइस', latin: 'Plain Rice', desc: 'स्टीम्ड बास्मती राइस', price: 80, cat: 'चावल व बिरयानी', atlas: 4, veg: true },
  { id: 1702, name: 'जीरा राइस', latin: 'Jeera Rice', desc: 'जीरा बटर तड़का बास्मती राइस', price: 100, cat: 'चावल व बिरयानी', atlas: 4, veg: true },
  { id: 1703, name: 'मसाला राइस', latin: 'Masala Rice', desc: 'वेजीज स्पाइसी मसाला बास्मती राइस', price: 120, cat: 'चावल व बिरयानी', atlas: 4, veg: true },
  { id: 1704, name: 'वेज बिरयानी', latin: 'Veg Biryani', desc: 'दम पकी वेज बिरयानी विथ रायता', price: 130, cat: 'चावल व बिरयानी', atlas: 4, tag: 'बिरयानी', veg: true },
  { id: 1705, name: 'हैदराबादी बिरयानी', latin: 'Hyderabadi Biryani', desc: 'तीखी दम हैदराबादी स्पाइसी बिरयानी', price: 150, cat: 'चावल व बिरयानी', atlas: 4, tag: 'स्पाइसी', veg: true },
  { id: 1706, name: 'वेज पुलाव', latin: 'Veg Pulaav', desc: 'केसरिया वेज पुलाव विथ गार्निश', price: 130, cat: 'चावल व बिरयानी', atlas: 4, veg: true },

  // रायता व सलाद (RAITA & SALAD)
  { id: 1801, name: 'बूंदी रायता', latin: 'Boondi Raita', desc: 'चटपटा भुना जीरा बूंदी रायता', price: 90, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1802, name: 'मिक्स वेज रायता', latin: 'Mix Veg Raita', desc: 'खीरा प्याज टमाटर मलाईदार रायता', price: 80, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1803, name: 'फ्राई रायता', latin: 'Fry Raita', desc: 'राई कढ़ी पत्ता तड़का रायता', price: 90, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1804, name: 'पाइनएप्पल रायता', latin: 'Pineapple Raita', desc: 'मीठा पाइनएप्पल चंक्स दही रायता', price: 120, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1805, name: 'प्लेन दही', latin: 'Plain Curd', desc: 'ताज़ा गाढ़ा जमा दही', price: 20, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1806, name: 'छाछ (Butter Milk)', latin: 'Butter Milk', desc: 'देसी भुना जीरा कढ़ी पत्ता छाछ', price: 20, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1811, name: 'अनियन सलाद', latin: 'Onion Salad', desc: 'नींबू मिर्च सिरका प्याज स्लाइस', price: 20, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1812, name: 'ग्रीन सलाद', latin: 'Green Salad', desc: 'खीरा टमाटर गाजर नींबू सलाद', price: 40, cat: 'रायता व सलाद', atlas: 5, veg: true },
  { id: 1813, name: 'पनीर सलाद', latin: 'Paneer Salad', desc: 'पनीर क्यूब्स वेजीज ड्रेसिंग सलाद', price: 140, cat: 'रायता व सलाद', atlas: 5, veg: true },

  // पापड़ व खिचिया (PAPAD, LILKA & KHICHIYA)
  { id: 1901, name: 'रोस्टेड पापड़', latin: 'Roasted Papad', desc: 'सेका हुआ उड़द पापड़', price: 20, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1902, name: 'फ्राई पापड़', latin: 'Fry Papad', desc: 'तेल में तला उड़द पापड़', price: 30, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1903, name: 'मसाला पापड़', latin: 'Masala Papad', desc: 'प्याज टमाटर सेवेन मसाला पापड़', price: 40, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1904, name: 'चीज़ मसाला पापड़', latin: 'Cheese Masala Papad', desc: 'मोज़ेरेला चीज़ लोडेड मसाला पापड़', price: 60, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },

  { id: 1911, name: 'लिलका रोस्टेड', latin: 'Lilka Roasted', desc: 'सेका हुआ लिलका पापड़', price: 20, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1912, name: 'लिलका घी मिर्च', latin: 'Lilka Ghee Mirch', desc: 'देसी घी व लाल मिर्च कोटेड लिलका', price: 30, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1913, name: 'लिलका मसाला', latin: 'Lilka Masala', desc: 'चटपटा मसाला वेजीज लिलका', price: 40, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1914, name: 'लिलका चीज़ मसाला', latin: 'Lilka Cheese Masala', desc: 'चीज़ लोडेड स्पाइसी लिलका पापड़', price: 60, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },

  { id: 1921, name: 'खिचिया रोस्टेड', latin: 'Khichiya Roasted', desc: 'सेका हुआ चावल खिचिया', price: 25, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1922, name: 'खिचिया फ्राई', latin: 'Khichiya Fry', desc: 'क्रिस्पी फ्राइड खिचिया', price: 35, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1923, name: 'खिचिया मसाला', latin: 'Khichiya Masala', desc: 'प्याज टमाटर मसाला बटर खिचिया', price: 50, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },
  { id: 1924, name: 'खिचिया चीज़ मसाला', latin: 'Khichiya Cheese Masala', desc: 'एक्स्ट्रा चीज़ लोडेड मसाला खिचिया', price: 70, cat: 'पापड़ व खिचिया', atlas: 0, veg: true },

  // पेय (BEVERAGES)
  { id: 101, name: 'रेगुलर टी', latin: 'Regular Tea', desc: 'ताज़ा कड़क चाय', price: 25, cat: 'पेय', atlas: 5, veg: true },
  { id: 102, name: 'मसाला टी', latin: 'Masala Tea', desc: 'देसी इलायची व अदरक मसाला चाय', price: 30, cat: 'पेय', atlas: 5, tag: 'हॉट', veg: true },
  { id: 103, name: 'हॉट मिल्क', latin: 'Hot Milk', desc: 'गरम केसरिया दूध', price: 25, cat: 'पेय', atlas: 5, veg: true },
  { id: 104, name: 'हॉट कॉफ़ी', latin: 'Hot Coffee', desc: 'गाढ़ी झागदार गरम कॉफ़ी', price: 40, cat: 'पेय', atlas: 5, veg: true },
  { id: 105, name: 'कोल्ड कॉफ़ी', latin: 'Cold Coffee', desc: 'चिल्ड क्रीमी कॉफ़ी विथ आइसक्रीम', price: 150, cat: 'पेय', atlas: 5, tag: 'पॉपुलर', veg: true },
  { id: 6, name: 'अनार पुदीना शरबत', latin: 'Anar Pudina Sharbat', desc: 'ताज़ा अनार • पुदीना • काला नमक', price: 129, cat: 'पेय', atlas: 5, tag: 'ठंडा-ठंडा', veg: true },
  { id: 10, name: 'केसर कुल्हड़ लस्सी', latin: 'Kesar Kulhad Lassi', desc: 'गाढ़ी दही • केसर • पिस्ता', price: 119, cat: 'पेय', atlas: 5, veg: true },

  // सूप (SOUP)
  { id: 201, name: 'टोमैटो सूप', latin: 'Tomato Soup', desc: 'ताज़ा टमाटर सूप विथ क्रिस्पी क्रूटॉन्स', price: 120, cat: 'सूप', atlas: 5, veg: true },
  { id: 202, name: 'मनचाउ सूप', latin: 'Manchow Soup', desc: 'तीखा चाइनीज़ सूप विथ फ्राइड नूडल्स', price: 130, cat: 'सूप', atlas: 5, veg: true },
  { id: 203, name: 'हॉट एंड सॉर सूप', latin: 'Hot & Sour Soup', desc: 'चटाकेदार वेज सूप विथ लेमन गार्निश', price: 150, cat: 'सूप', atlas: 5, veg: true },

  // स्नैक्स (SNACKS)
  { id: 301, name: 'पोटैटो ट्विस्टर', latin: 'Potato Twister', desc: 'क्रिस्पी स्पाइसी स्पाइरल पोटैटो', price: 120, cat: 'स्नैक्स', atlas: 4, veg: true },
  { id: 302, name: 'चीज़ पोटैटो ट्विस्टर', latin: 'Cheese Potato Twister', desc: 'क्रीमी चीज़ सॉस विथ स्पाइरल पोटैटो', price: 140, cat: 'स्नैक्स', atlas: 4, tag: 'चीज़ी', veg: true },
  { id: 303, name: 'पोटैटो वेजी', latin: 'Potato Veggie', desc: 'मसालेदार पोटैटो वेजेज', price: 140, cat: 'स्नैक्स', atlas: 4, veg: true },
  { id: 304, name: 'चीज़ पोटैटो वेजी', latin: 'Cheese Potato Veggie', desc: 'मेल्टेड चीज़ लोड पोटैटो वेजेज', price: 160, cat: 'स्नैक्स', atlas: 4, veg: true },
  { id: 305, name: 'चीज़ भेल', latin: 'Cheese Bhel', desc: 'चटपटी भेल विथ कसा हुआ चीज़', price: 120, cat: 'स्नैक्स', atlas: 4, veg: true },

  // शेक्स (SHAKES)
  { id: 401, name: 'किटकैट शेक', latin: 'Kitkat Shake', desc: 'किटकैट क्रंच विथ थिक चॉकलेट', price: 180, cat: 'शेक्स', atlas: 5, tag: 'स्पेशल', veg: true },
  { id: 402, name: 'ओरियो शेक', latin: 'Oreo Shake', desc: 'ओरियो बिस्किट थिक शेक', price: 180, cat: 'शेक्स', atlas: 5, tag: 'बेस्टसेलर', veg: true },
  { id: 403, name: 'चॉकलेट शेक', latin: 'Chocolate Shake', desc: 'रिच डार्क चॉकलेट थिक शेक', price: 150, cat: 'शेक्स', atlas: 5, veg: true },
  { id: 404, name: 'स्ट्रॉबेरी शेक', latin: 'Strawberry Shake', desc: 'ताज़ा स्ट्रॉबेरी पल्प शेक', price: 160, cat: 'शेक्स', atlas: 5, veg: true },
  { id: 405, name: 'बटरस्कॉच शेक', latin: 'Butterscotch Shake', desc: 'क्रंची बटरस्कॉच फ्लेवर शेक', price: 160, cat: 'शेक्स', atlas: 5, veg: true },
  { id: 406, name: 'मैंगो शेक', latin: 'Mango Shake', desc: 'अल्फांसो आम पल्प थिक शेक', price: 160, cat: 'शेक्स', atlas: 5, veg: true },
  { id: 407, name: 'ब्लूबेरी शेक', latin: 'Blueberry Shake', desc: 'स्वीट एंड टैंगी ब्लूबेरी शेक', price: 160, cat: 'शेक्स', atlas: 5, veg: true },
  { id: 408, name: 'मिक्स फ्रूट शेक', latin: 'Mix Fruit Shake', desc: 'ताज़ा फलों का हेल्दी थिक शेक', price: 180, cat: 'शेक्स', atlas: 5, veg: true },

  // पिज्जा (PIZZA)
  { id: 501, name: 'वेज डिलाइट पिज्जा', latin: 'Veg Delight Pizza', desc: 'शिमला मिर्च • टमाटर • स्वीट कॉर्न', price: 150, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 502, name: 'कॉर्न अनियन कैप्सिकम पिज्जा', latin: 'Corn Onion Capsicum Pizza', desc: 'गोल्डन कॉर्न • क्रिस्प अनियन • कैप्सिकम', price: 170, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 503, name: 'इंडियन चीज़ पिज्जा', latin: 'Indian Cheese Pizza', desc: 'देसी स्टाइल चीज़ विथ इंडियन स्पाइसेस', price: 160, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 504, name: 'टच ऑफ़ कल्चर पिज्जा', latin: 'Touch of Culture Pizza', desc: 'चीज़ी क्रस्ट विथ स्पेशल हर्ब्स एंड वेजीज', price: 180, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 505, name: 'अनियन कैप्सिकम पिज्जा', latin: 'Onion Capsicum Pizza', desc: 'प्याज • शिमला मिर्च • मोज़ेरेला चीज़', price: 150, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 506, name: 'पनीर पंच पिज्जा', latin: 'Paneer Punch Pizza', desc: 'स्पाइसी पनीर क्यूब्स विथ एक्स्ट्रा चीज़', price: 180, cat: 'पिज्जा', atlas: 4, tag: 'पनीर स्पेशल', veg: true },
  { id: 507, name: 'मार्गेरिटा पिज्जा', latin: 'Margherita Pizza', desc: 'क्लासिक 100% मोज़ेरेला चीज़ पिज्जा', price: 180, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 508, name: 'ओटीसी पिज्जा', latin: 'OTC Pizza', desc: 'अनियन • टोमैटो • कैप्सिकम पिज्जा', price: 170, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 509, name: "मम्माज़ किचन स्पेशल पिज्जा", latin: "Mumma's Kitchen Special Pizza", desc: 'चीज लोडेड ऑल टॉपिंग्स मास्टर शेफ स्पेशल', price: 260, cat: 'पिज्जा', atlas: 4, tag: 'मास्टर शेफ', veg: true },
  { id: 510, name: 'चीज़ बस्ट पिज्जा', latin: 'Cheese Burst Pizza', desc: 'लिक्विड चीज़ मेल्टेड डबल क्रस्ट', price: 220, cat: 'पिज्जा', atlas: 4, tag: 'चीज़ी लोडेड', veg: true },
  { id: 511, name: 'सुप्रीम गारलिक पिज्जा', latin: 'Supreme Garlic Pizza', desc: 'गार्लिक बटर बेक्ड चीज़ पिज्जा', price: 160, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 512, name: 'चीज़ नाचोज़', latin: 'Cheese Nachos', desc: 'क्रंची नाचोज़ विथ हॉट चीज़ सॉस', price: 140, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 513, name: 'लसग्ना पिज्जा', latin: 'Lasagna Pizza', desc: 'इटैलियन लसग्ना स्टाइल लेयर्ड पिज्जा', price: 210, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 514, name: 'वेज चीज़ रोल पिज्जा', latin: 'Veg Cheese Roll Pizza', desc: 'रोल स्टाइल क्रिस्पी चीज़ पिज्जा', price: 220, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 515, name: 'पनीर चिली पिज्जा', latin: 'Paneer Chilly Pizza', desc: 'स्पाइसी पनीर चिली टॉपिंग पिज्जा', price: 230, cat: 'पिज्जा', atlas: 4, veg: true },
  { id: 516, name: 'पनीर तंदूरी पिज्जा', latin: 'Paneer Tandoori Pizza', desc: 'तंदूरी पनीर मलाई मोज़ेरेला पिज्जा', price: 210, cat: 'पिज्जा', atlas: 4, veg: true },

  // पास्ता (PASTA)
  { id: 601, name: 'पेने अराबियाटा (रेड सॉस)', latin: 'Penne Arrabiata Red Sauce', desc: 'स्पाइसी इटैलियन टोमैटो अरैबियाटा पास्ता', price: 150, cat: 'पास्ता', atlas: 4, veg: true },
  { id: 602, name: 'पेने अराबियाटा (व्हाइट सॉस)', latin: 'Penne Arrabiata White Sauce', desc: 'क्रीमी बटर सॉस पेने पास्ता', price: 160, cat: 'पास्ता', atlas: 4, veg: true },
  { id: 603, name: 'इटैलियन पास्ता (ग्रीन सॉस)', latin: 'Italian Pasta Green Sauce', desc: 'बेसिल पेस्टो हर्ब ग्रीन पास्ता', price: 160, cat: 'पास्ता', atlas: 4, veg: true },
  { id: 604, name: 'इटैलियन पास्ता (व्हाइट सॉस)', latin: 'Italian Pasta White Sauce', desc: 'रिच चीज सॉस विथ वेजीज पास्ता', price: 170, cat: 'पास्ता', atlas: 4, tag: 'क्रीमी', veg: true },

  // रोल्स & गारलिक ब्रेड (ROLLS & GARLIC BREAD)
  { id: 701, name: 'वेज स्प्रिंग रोल', latin: 'Veg Spring Roll', desc: 'कुरकुरा चाइनीज़ वेज स्प्रिंग रोल', price: 140, cat: 'रोल्स', atlas: 4, veg: true },
  { id: 702, name: 'वेज चीज़ स्प्रिंग रोल', latin: 'Veg Cheese Spring Roll', desc: 'मेल्टेड चीज़ वेज स्प्रिंग रोल', price: 150, cat: 'रोल्स', atlas: 4, veg: true },
  { id: 703, name: 'चीज़ पनीर रोल', latin: 'Cheese Paneer Roll', desc: 'स्टफ्ड पनीर विथ एक्स्ट्रा चीज़ रोल', price: 160, cat: 'रोल्स', atlas: 4, veg: true },
  { id: 704, name: 'पनीर रोल', latin: 'Paneer Roll', desc: 'मसाला पनीर काठी रोल', price: 140, cat: 'रोल्स', atlas: 4, veg: true },
  { id: 705, name: 'गारलिक ब्रेड', latin: 'Garlic Breads', desc: 'बटर गार्लिक हर्ब टोस्ट', price: 80, cat: 'गारलिक ब्रेड', atlas: 4, veg: true },
  { id: 706, name: 'चीज़ गारलिक ब्रेड', latin: 'Cheese Garlic Bread', desc: 'चीजी मोज़ेरेला गार्लिक ब्रेड', price: 110, cat: 'गारलिक ब्रेड', atlas: 4, tag: 'हॉट', veg: true },
  { id: 707, name: 'सुप्रीम गारलिक ब्रेड', latin: 'Supreme Garlic Bread', desc: 'वेजीज एंड ऑलिव्स लोडेड गार्लिक ब्रेड', price: 140, cat: 'गारलिक ब्रेड', atlas: 4, veg: true },

  // स्टार्टर्स (STARTERS)
  { id: 801, name: 'पनीर टिक्का ड्राई', latin: 'Paneer Tikka Dry', desc: 'तंदूरी मसाला मेरिनेटेड पनीर टिक्का', price: 210, cat: 'स्टार्टर्स', atlas: 3, tag: 'तंदूरी', veg: true },
  { id: 802, name: 'हरा भरा कबाब', latin: 'Hara Bhara Kabab', desc: 'पालक • मटर • काजू कटलेट कबाब', price: 150, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 803, name: 'पनीर पकोड़ा', latin: 'Paneer Pakoda', desc: 'बेसन कोटेड फ्राइड पनीर पकोड़े', price: 180, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 804, name: 'वेज सिगार कबाब', latin: 'Veg Cig Kabab', desc: 'क्रिस्पी वेज रोल सिगार कबाब', price: 180, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 805, name: 'लसणिया पनीर टिक्का', latin: 'Lasaniya Paneer Tikka', desc: 'लहसुन चटनी मेरिनेटेड पनीर टिक्का', price: 230, cat: 'स्टार्टर्स', atlas: 3, tag: 'तीखा लहसुनी', veg: true },
  { id: 806, name: 'लसग्ना चीज़ पनीर टिक्का', latin: 'Lasagna Cheese Paneer Tikka', desc: 'चीजी लसग्ना स्टाइल पनीर टिक्का', price: 250, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 807, name: 'पनीर चीज़ गारलिक कबाब', latin: 'Paneer Cheese Garlic Kabab', desc: 'गार्लिक बटर चीज़ स्टफ्ड पनीर कबाब', price: 230, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 808, name: 'पनीर अचारी टिक्का', latin: 'Paneer Achari Tikka', desc: 'चटपटा अचारी मसाला पनीर टिक्का', price: 240, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 809, name: 'पनीर स्पीड टिक्का', latin: 'Paneer Speed Tikka', desc: 'स्पेशल रोस्टेड स्पाइसी पनीर टिक्का', price: 220, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 4, name: 'अंगारा पनीर टिक्का', latin: 'Angara Paneer Tikka', desc: 'कोयले की आँच • देसी मसाला • पुदीना चटनी', price: 269, cat: 'स्टार्टर्स', atlas: 3, veg: true },
  { id: 8, name: 'मलाई सोया चाप', latin: 'Malai Soya Chaap', desc: 'क्रीमी मेरिनेड • तंदूरी धुआँ • सलाद', price: 249, cat: 'स्टार्टर्स', atlas: 3, veg: true },

  // बर्गर (BURGER)
  { id: 901, name: 'आलू टिक्की बर्गर', latin: 'Aloo Tikki Burger', desc: 'देसी आलू टिक्की विथ मेयो एंड अनियन', price: 110, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 902, name: 'वेज बर्गर', latin: 'Veg Burger', desc: 'क्लासिक वेजी पैटी बर्गर', price: 80, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 903, name: 'वेज चीज़ बर्गर', latin: 'Veg Cheese Burger', desc: 'चीज़ स्लाइस लोडेड वेज बर्गर', price: 110, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 904, name: 'पेरी पेरी बर्गर', latin: 'Peri Peri Burger', desc: 'स्पाइसी पेरी पेरी सॉस बर्गर', price: 90, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 905, name: 'पनीर बर्गर', latin: 'Paneer Burger', desc: 'फ्राइड पनीर पैटी बर्गर', price: 110, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 906, name: 'पनीर शेज़वान बर्गर', latin: 'Paneer Schezwan Burger', desc: 'तीखा शेज़वान पनीर बर्गर', price: 120, cat: 'बर्गर', atlas: 4, veg: true },
  { id: 907, name: 'आलू टिक्की शेज़वान बर्गर', latin: 'Aloo Tikki Schezwan Burger', desc: 'स्पाइसी शेज़वान आलू टिक्की बर्गर', price: 130, cat: 'बर्गर', atlas: 4, veg: true },

  // सैंडविच (SANDWICH)
  { id: 1001, name: 'वेज सैंडविच', latin: 'Veg Sandwich', desc: 'ताज़ा खीरा • टमाटर • शिमला मिर्च सैंडविच', price: 100, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1002, name: 'बॉम्बे ग्रिल सैंडविच', latin: 'Bombay Grill Sandwich', desc: 'स्पाइसी आलू मसाला बटर ग्रिल सैंडविच', price: 120, cat: 'सैंडविच', atlas: 4, tag: 'ग्रिल्ड', veg: true },
  { id: 1003, name: 'चीज़ ग्रिल सैंडविच', latin: 'Cheese Grill Sandwich', desc: 'डबल चीज़ बटर ग्रिल्ड सैंडविच', price: 130, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1004, name: 'ब्रेड बटर', latin: 'Bread Butter', desc: 'ताज़ा ब्रेड विथ अमूल बटर', price: 30, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1005, name: 'ब्रेड बटर जैम', latin: 'Bread Butter Jam', desc: 'ब्रेड बटर विथ फ्रूट जैम', price: 50, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1006, name: 'आलू सैंडविच', latin: 'Aloo Sandwich', desc: 'मसालेदार आलू स्टफ्ड सैंडविच', price: 90, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1007, name: 'मेरिकॉन सैंडविच', latin: 'Maricon Sandwich', desc: 'चीज़ी कॉर्न एंड कैप्सिकम सैंडविच', price: 100, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1008, name: 'पनीर तंदूरी सैंडविच', latin: 'Paneer Tandoori Sandwich', desc: 'तंदूरी सॉस पनीर ग्रिल सैंडविच', price: 120, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1009, name: 'कॉर्न सैंडविच', latin: 'Corn Sandwich', desc: 'स्वीट कॉर्न विथ मेयो सैंडविच', price: 90, cat: 'सैंडविच', atlas: 4, veg: true },
  { id: 1010, name: 'जंबो सैंडविच', latin: 'Jumbo Sandwich', desc: '3 लेयर लोडेड वेजी चीज़ जंबो सैंडविच', price: 120, cat: 'सैंडविच', atlas: 4, tag: 'जंबो', veg: true },
  { id: 1011, name: 'वेज चीज़ ग्रिल सैंडविच', latin: 'Veg Cheese Grill', desc: 'ग्रिल्ड वेजीज विथ मोज़ेरेला चीज़ सैंडविच', price: 120, cat: 'सैंडविच', atlas: 4, veg: true },

  // चाइनीज़ (CHINESE ITEM)
  { id: 1101, name: 'वेज चाउमीन', latin: 'Veg Chowmein', desc: 'वोक टॉस्ड वेज नूडल्स चाउमीन', price: 140, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1102, name: 'चीज़ चाउमीन', latin: 'Cheese Chowmein', desc: 'चीज़ी नूडल्स चाउमीन', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1103, name: 'मंचूरियन ड्राई', latin: 'Manchurian Dry', desc: 'क्रिस्पी वेज मंचूरियन बॉल्स ड्राई', price: 140, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1104, name: 'मंचूरियन ग्रेवी', latin: 'Manchurian Gravy', desc: 'स्पाइसी सोया गार्लिक ग्रेवी मंचूरियन', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1105, name: 'मंचूरियन नूडल्स', latin: 'Manchurian Noodles', desc: 'नूडल्स टोप्ड विथ मंचूरियन बॉल्स', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1106, name: 'मंचूरियन राइस', latin: 'Manchurian Rice', desc: 'फ्राइड राइस विथ मंचूरियन ग्रेवी', price: 170, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1107, name: 'गोभी मंचूरियन', latin: 'Gobhi Manchurian', desc: 'कुरकुरी गोभी मंचूरियन ड्राई', price: 170, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1108, name: 'सिंगापुरी नूडल्स', latin: 'Singapure Noodles', desc: 'स्पाइसी यलो करी सिंगापुरी नूडल्स', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1109, name: 'सिंगापुरी शेज़वान राइस', latin: 'Singapure Schezwan Rice', desc: 'हॉट शेज़वान राइस सिंगापुरी स्टाइल', price: 170, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1110, name: 'चाइनीज़ भेल', latin: 'Chinese Bhel', desc: 'क्रिस्पी फ्राइड नूडल्स सेज़वान भेल', price: 170, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1111, name: 'चाइनीज़ चीज़ भेल', latin: 'Chinese Cheese Bhel', desc: 'चीज़ लोडेड क्रिस्पी चाइनीज़ भेल', price: 190, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 5, name: 'देसी हक्का नूडल्स', latin: 'Hakka Noodles', desc: 'वोक टॉस्ड • कुरकुरी सब्ज़ियाँ • तीखा तड़का', price: 150, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1112, name: 'पनीर फ्राइड राइस', latin: 'Paneer Fry Rice', desc: 'पनीर क्यूब्स वोक फ्राइड राइस', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1113, name: 'शेज़वान फ्राइड राइस', latin: 'Schezwan Fried Rice', desc: 'स्पाइसी रेड शेज़वान सॉस फ्राइड राइस', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1114, name: 'कॉर्न भेल', latin: 'Corn Bhel', desc: 'स्वीट कॉर्न चाइनीज़ स्टाइल भेल', price: 180, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1115, name: 'कॉर्न फ्रिटर्स', latin: 'Corn Fitters', desc: 'क्रंची फ्राइड कॉर्न पकोड़े', price: 150, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1116, name: 'अमेरिकन चोकशी', latin: 'American Chokshi', desc: 'स्वीट एंड सॉर अमेरिकन चापसूई', price: 170, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1117, name: 'चीज़ चिली टोस्ट', latin: 'Cheese Chilli Toast', desc: 'बेक्ड चीज़ विथ ग्रीन चिली टोस्ट', price: 190, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1118, name: 'चाइनीज़ सिज़लर', latin: 'Chinese Sizzler', desc: 'हॉट सिज़लिंग प्लेट नूडल्स मंचूरियन', price: 260, cat: 'चाइनीज़', atlas: 4, tag: 'सिज़लर स्पेशल', veg: true },
  { id: 9, name: 'पनीर चिली', latin: 'Paneer Chilli', desc: 'क्रिस्प पनीर • शिमला मिर्च • सोया चिली सॉस', price: 220, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1119, name: 'ड्रैगन पोटैटो', latin: 'Dragon Potato', desc: 'स्पाइसी ड्रैगन सॉस फ्राइड पोटैटो', price: 160, cat: 'चाइनीज़', atlas: 4, veg: true },
  { id: 1120, name: 'हनी चिली पोटैटो', latin: 'Honey Chilli Potato', desc: 'स्वीट एंड स्पाइसी हनी चिली पोटैटो', price: 170, cat: 'चाइनीज़', atlas: 4, tag: 'पॉपुलर', veg: true },
  { id: 1121, name: 'चीज़ बॉल', latin: 'Cheese Ball', desc: 'क्रिस्पी फ्राइड लिक्विड चीज़ बॉल्स', price: 150, cat: 'चाइनीज़', atlas: 4, veg: true },

  // फ्राइज (FRIES)
  { id: 1201, name: 'फ्रेंच फ्राइज', latin: 'French Fries', desc: 'क्लासिक सॉल्टेड क्रिस्पी पोटैटो फ्राइज', price: 120, cat: 'फ्राइज', atlas: 4, veg: true },
  { id: 1202, name: 'पेरी पेरी फ्राइज', latin: 'Peri Peri Fries', desc: 'स्पाइसी पेरी पेरी मसाला फ्राइज', price: 140, cat: 'फ्राइज', atlas: 4, tag: 'स्पाइसी', veg: true },
  { id: 1203, name: 'चीज़ पेरी पेरी फ्राइज', latin: 'Cheese Peri Peri Fries', desc: 'चीज़ सॉस लोडेड पेरी पेरी फ्राइज', price: 160, cat: 'फ्राइज', atlas: 4, veg: true },

  // मैगी (MAGGI)
  { id: 1301, name: 'प्लेन मैगी', latin: 'Plain Maggi', desc: 'क्लासिक मैजिक मसाला मैगी', price: 70, cat: 'मैगी', atlas: 4, veg: true },
  { id: 1302, name: 'वेज मसाला मैगी', latin: 'Veg Masala Maggi', desc: 'मटर शिमला मिर्च टमाटर वेज मैगी', price: 90, cat: 'मैगी', atlas: 4, veg: true },
  { id: 1303, name: 'चीज़ मसाला मैगी', latin: 'Cheese Masala Maggi', desc: 'चीज़ लोडेड स्पाइसी मसाला मैगी', price: 110, cat: 'मैगी', atlas: 4, tag: 'चीज़ी', veg: true },

  // मीठा (DESSERT)
  { id: 11, name: 'घेवर रबड़ी', latin: 'Ghevar Rabdi', desc: 'कुरकुरा घेवर • केसरिया रबड़ी • बादाम', price: 159, cat: 'मीठा', atlas: 0, veg: true },
  { id: 12, name: 'मालपुआ', latin: 'Malpua', desc: 'गरम मालपुआ • इलायची चाशनी • रबड़ी', price: 149, cat: 'मीठा', atlas: 1, veg: true },
]

const DEFAULT_MENU = MENU
const REWARDS = [
  // 1. कम कीमत के ड्रिंक्स व पेय मेन्यू से (60% संभावना - Low Cost Drinks & Beverages directly from Cafe Menu)
  { label: 'FREE BEVERAGE', categoryType: 'beverage', weight: 60 },

  // 2. फ़ूड डिशेस व स्टार्टर्स मेन्यू से (25% संभावना - Food Dishes & Starters directly from Cafe Menu)
  { label: 'FREE DISH', categoryType: 'food', weight: 25 },

  // 3. बिल डिस्काउंट % कूपन्स (15% संभावना - Percentage Discounts)
  { label: '5% OFF', detail: 'पूरे बिल पर 5% छूट', type: 'discount', weight: 5 },
  { label: '10% OFF', detail: 'पूरे बिल पर 10% छूट', type: 'discount', weight: 5 },
  { label: '15% OFF', detail: 'पूरे बिल पर 15% छूट', type: 'discount', weight: 3 },
  { label: '20% OFF', detail: 'पूरे बिल पर 20% छूट', type: 'discount', weight: 2 },
]

const COUPON_KEY = 'majisa-coupons'
const MENU_KEY = 'majisa-menu'
const CATEGORY_KEY = 'majisa-categories'
const MEDIA_KEY = 'majisa-site-media'
const BILLS_KEY = 'majisa-bills'
const ORDERS_KEY = 'majisa-orders'
const ADMIN_PIN_KEY = 'majisa-admin-pin'
const PAYEE_NAME = 'Majisa Cafe and Restaurant'
const UPI_ID = 'majisacafe@paytm'
const DEFAULT_ADMIN_PIN = '1122'
const COUPON_VALID_DAYS = 15

function getAdminPin() {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN
  } catch {
    return DEFAULT_ADMIN_PIN
  }
}

function saveAdminPin(pin) {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, pin)
    writeAppState('admin_pin', pin).catch(e => console.warn('Supabase save admin pin failed', e.message))
  } catch (e) {
    console.warn('Failed to save admin pin locally', e)
  }
}
const SHOW_FLOATING_REWARD_BUTTON = false // Aage jarurat hone par 'true' karke floating "मेरा इनाम" button wapas dikhayein
const CAFE_ADDRESS = '3 no Fatak, By pass road, opp. Azad pump, near Zury Resort, Balotra, Rajasthan 344022'
// Abhi ke liye purani cafe location — baad mein nayi location ki goo.gl link se lat/lng update karna
const GOOGLE_MAPS_PLACE_URL = 'https://maps.app.goo.gl/p2Ca6rehEKntvbbC7'
const CAFE_MAP_LAT = 25.8290724
const CAFE_MAP_LNG = 72.2301668
const GOOGLE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${CAFE_MAP_LAT},${CAFE_MAP_LNG}&hl=hi&z=16&output=embed`
const GOOGLE_MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${CAFE_MAP_LAT},${CAFE_MAP_LNG}&travelmode=driving`
const GOOGLE_MAPS_URL = GOOGLE_MAPS_DIRECTIONS_URL
const PHONE_PRIMARY = '+919725845974'
const PHONE_SECONDARY = '+917073011597'
const INSTAGRAM_URL = 'https://www.instagram.com/majisacafe_restaurant'
const DEFAULT_CATEGORIES = ['मारवाड़ी', 'देसी तड़का', 'शाही पनीर', 'रोटी व नान', 'चावल व बिरयानी', 'रायता व सलाद', 'पापड़ व खिचिया', 'पेय', 'सूप', 'स्नैक्स', 'शेक्स', 'पिज्जा', 'पास्ता', 'रोल्स', 'गारलिक ब्रेड', 'स्टार्टर्स', 'बर्गर', 'सैंडविच', 'चाइनीज़', 'फ्राइज', 'मैगी', 'मीठा']
const DEFAULT_MEDIA = {
  heroImage: '/assets/majisa-hero.png',
  storyImage: '/assets/marwari-thali.png',
  gallery: [
    { id: 'gallery-video-main', label: 'Main gallery video', type: 'video', src: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-on-a-wooden-board-close-up-view-10420-large.mp4', caption: '100% शुद्ध शाकाहारी • चूल्हे से थाली तक', className: 'reel-tall', visible: true },
    { id: 'gallery-dal', label: 'Dal baati image', type: 'atlas', atlas: 0, caption: 'दाल बाटी की खुशबू', className: '', visible: true },
    { id: 'gallery-courtyard', label: 'Courtyard image', type: 'image', src: '/assets/majisa-hero.png', caption: 'शाम की रोशनी, देसी मनुहार', className: 'reel-wide', visible: true },
    { id: 'gallery-paneer', label: 'Angara image', type: 'atlas', atlas: 3, caption: 'अंगारा स्पेशल', className: '', visible: true },
    { id: 'gallery-video-small', label: 'Small gallery video', type: 'video', src: 'https://assets.mixkit.co/videos/preview/mixkit-chili-pepper-falling-into-red-powder-28392-large.mp4', caption: 'ताज़ा मसाला व थाली सा', className: 'reel-video-small', visible: true },
    { id: 'gallery-drink', label: 'Drink image', type: 'atlas', atlas: 5, caption: 'ठंडाई हो जाए?', className: '', visible: true },
  ],
}

function saveCoupons(coupons) {
  localStorage.setItem(COUPON_KEY, JSON.stringify(coupons))
  writeCoupons(coupons).catch(error => console.warn('Supabase coupons save failed', error.message))
}

function getCoupons() {
  try {
    const saved = localStorage.getItem(COUPON_KEY)
    const clearedAt = localStorage.getItem('majisa-coupons-cleared-at')
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    if (clearedAt) {
      const clearedTime = new Date(clearedAt).getTime()
      return parsed.filter(c => c.created && new Date(c.created).getTime() > clearedTime)
    }
    return parsed
  } catch {
    return []
  }
}

function getMenu() {
  try {
    const saved = JSON.parse(localStorage.getItem(MENU_KEY))
    if (!saved || !Array.isArray(saved) || saved.length < DEFAULT_MENU.length) {
      saveMenu(DEFAULT_MENU)
      return DEFAULT_MENU
    }
    return saved
  } catch {
    return DEFAULT_MENU
  }
}

function saveMenu(menu) {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu))
  writeAppState('menu', menu).catch(error => console.warn('Supabase menu save failed', error.message))
}

function getCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_KEY))
    if (!saved || !Array.isArray(saved) || saved.length < DEFAULT_CATEGORIES.length) {
      saveCategories(DEFAULT_CATEGORIES)
      return DEFAULT_CATEGORIES
    }
    return saved
  } catch {
    return DEFAULT_CATEGORIES
  }
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories))
  writeAppState('categories', categories).catch(error => console.warn('Supabase categories save failed', error.message))
}

function getMedia() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEDIA_KEY))
    if (!saved) return DEFAULT_MEDIA
    const gallery = DEFAULT_MEDIA.gallery.map(slot => {
      const found = (saved.gallery || []).find(item => item.id === slot.id)
      if (found && found.src && (found.src.includes('36689957') || found.src.includes('karim'))) {
        return slot
      }
      return { ...slot, ...found }
    })
    return {
      ...DEFAULT_MEDIA,
      ...saved,
      gallery,
    }
  } catch {
    return DEFAULT_MEDIA
  }
}

function saveMedia(media) {
  try {
    localStorage.setItem(MEDIA_KEY, JSON.stringify(media))
  } catch (e) {
    console.warn('LocalStorage quota exceeded for media, syncing to cloud state', e)
  }
  writeAppState('media', media).catch(error => console.warn('Supabase media save failed', error.message))
}

function getBills() {
  try { return JSON.parse(localStorage.getItem(BILLS_KEY)) || [] } catch { return [] }
}

function saveBills(bills) {
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills))
  writeAppState('bills', bills).catch(error => console.warn('Supabase bills save failed', error.message))
}

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [] } catch { return [] }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  writeAppState('orders', orders).catch(error => console.warn('Supabase orders save failed', error.message))
}

const EVENT_BOOKINGS_KEY = 'majisa-event-bookings'

function getEventBookings() {
  try { return JSON.parse(localStorage.getItem(EVENT_BOOKINGS_KEY)) || [] } catch { return [] }
}

function saveEventBookings(bookings) {
  localStorage.setItem(EVENT_BOOKINGS_KEY, JSON.stringify(bookings))
  writeAppState('event_bookings', bookings).catch(error => console.warn('Supabase event_bookings save failed', error.message))
}

const CUSTOMERS_KEY = 'majisa-customers'

function getCustomers() {
  try { return JSON.parse(localStorage.getItem(CUSTOMERS_KEY)) || [] } catch { return [] }
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers))
  writeAppState('customers', customers).catch(error => console.warn('Supabase customers save failed', error.message))
}

function registerOrUpdateCustomer(name, phone) {
  if (!phone) return getCustomers()
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length < 10) return getCustomers()
  const cleanName = (name || 'Guest Customer').trim()
  const existing = getCustomers()
  const now = new Date().toISOString()
  const foundIndex = existing.findIndex(c => (c.phone || c.mobile || '').replace(/\D/g, '').slice(-10) === cleanPhone.slice(-10))
  let updated
  if (foundIndex >= 0) {
    updated = existing.map((c, idx) => idx === foundIndex ? {
      ...c,
      name: cleanName || c.name,
      phone: cleanPhone,
      lastActive: now,
    } : c)
  } else {
    const newCustomer = {
      id: `CUST-${cleanPhone.slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      phone: cleanPhone,
      registeredAt: now,
      lastActive: now,
    }
    updated = [newCustomer, ...existing]
  }
  saveCustomers(updated)
  return updated
}

const GALLERY_KEY = 'majisa-gallery'
const B2_KEY = 'majisa-b2'

function getGallery() {
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [] } catch { return [] }
}

function saveGallery(gallery) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery))
  writeAppState('gallery_items', gallery).catch(error => console.warn('Supabase gallery save failed', error.message))
}

function getB2() {
  try { return JSON.parse(localStorage.getItem(B2_KEY)) || null } catch { return null }
}

function saveB2(credentials) {
  localStorage.setItem(B2_KEY, JSON.stringify(credentials))
  writeAppState('b2_credentials', credentials).catch(error => console.warn('Supabase B2 credentials save failed', error.message))
}

function couponStatus(coupon) {
  if (!coupon) return 'not-found'
  if (coupon.redeemedAt) return 'redeemed'
  if (new Date(coupon.expiresAt).getTime() < Date.now()) return 'expired'
  return 'valid'
}

function statusLabel(status) {
  if (status === 'valid') return 'PENDING'
  if (status === 'redeemed') return 'REDEEMED'
  if (status === 'expired') return 'EXPIRED'
  return 'INVALID'
}

function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.82, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'))
    if (typeof onProgress === 'function') onProgress(15)

    if (!file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') {
          const p = Math.round((e.loaded / e.total) * 90) + 5
          onProgress(p)
        }
      }
      reader.onload = () => {
        if (typeof onProgress === 'function') onProgress(100)
        resolve(reader.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        const p = Math.round((e.loaded / e.total) * 45) + 5
        onProgress(p)
      }
    }
    reader.onload = (e) => {
      if (typeof onProgress === 'function') onProgress(55)
      const img = new Image()
      img.onload = () => {
        if (typeof onProgress === 'function') onProgress(75)
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        if (typeof onProgress === 'function') onProgress(90)
        const compressedDataUrl = canvas.toDataURL('image/webp', quality) || canvas.toDataURL('image/jpeg', quality)
        if (typeof onProgress === 'function') onProgress(100)
        resolve(compressedDataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function atlasPosition(index) {
  const col = index % 3
  const row = Math.floor(index / 3)
  return `${col * 50}% ${row * 100}%`
}

function dishStyle(item) {
  return item.image
    ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundPosition: atlasPosition(item.atlas || 0) }
}

function pickReward(menuList = DEFAULT_MENU) {
  const validMenu = Array.isArray(menuList) && menuList.length ? menuList : DEFAULT_MENU
  const total = REWARDS.reduce((sum, reward) => sum + reward.weight, 0)
  let chance = Math.random() * total
  let chosenReward = REWARDS[REWARDS.length - 1]
  for (const reward of REWARDS) {
    chance -= reward.weight
    if (chance <= 0) {
      chosenReward = reward
      break
    }
  }

  // 1. 60% chance for beverage/drink item chosen directly from active cafe menu
  if (chosenReward.categoryType === 'beverage') {
    const drinkItems = validMenu.filter(item => item && (item.cat === 'पेय' || item.cat === 'ड्रिंक्स' || item.cat === 'शेक्स' || (item.name || '').toLowerCase().includes('drink') || (item.name || '').toLowerCase().includes('coffee') || (item.name || '').toLowerCase().includes('mocktail')))
    const pool = drinkItems.length ? drinkItems : validMenu
    const selectedDrink = pool[Math.floor(Math.random() * pool.length)]
    if (selectedDrink) {
      return {
        label: `FREE ${selectedDrink.latin || selectedDrink.name}`.toUpperCase(),
        detail: `एक ${selectedDrink.name} मुफ़्त (${selectedDrink.cat} • ₹${selectedDrink.price})`,
        type: 'item',
        dishName: selectedDrink.name,
        dishId: selectedDrink.id,
        price: selectedDrink.price,
      }
    }
  }

  // 2. 25% chance for food dish/starter item chosen directly from active cafe menu
  if (chosenReward.categoryType === 'food') {
    const foodDishes = validMenu.filter(item => item && item.cat !== 'पेय' && item.cat !== 'ड्रिंक्स' && item.cat !== 'शेक्स')
    const pool = foodDishes.length ? foodDishes : validMenu
    const selectedDish = pool[Math.floor(Math.random() * pool.length)]
    if (selectedDish) {
      return {
        label: `FREE ${selectedDish.latin || selectedDish.name}`.toUpperCase(),
        detail: `एक ${selectedDish.name} मुफ़्त (${selectedDish.cat} • ₹${selectedDish.price})`,
        type: 'item',
        dishName: selectedDish.name,
        dishId: selectedDish.id,
        price: selectedDish.price,
      }
    }
  }

  return chosenReward
}

function BrandMark({ small = false }) {
  return (
    <div className={`brand-mark ${small ? 'small' : ''}`} aria-label="Majisa Cafe and Restorent">
      <svg viewBox="0 0 90 90" aria-hidden="true">
        <path d="M45 5 56 18 73 17 72 34 85 45 72 56 73 73 56 72 45 85 34 72 17 73 18 56 5 45 18 34 17 17 34 18Z" />
        <circle cx="45" cy="45" r="25" />
        <path className="camel" d="M22 52c5-1 8-4 10-10 2-7 6-10 11-8 4 2 4 8 8 9 4 1 7-6 11-5 5 1 6 7 8 11l-5 1-2 12h-4l-1-10H42l-1 10h-4l-2-12c-5 5-9 6-13 2Z" />
      </svg>
      <div>
        <strong>माजीसा</strong>
        <span>Cafe and Restaurant • BALOTRA</span>
      </div>
    </div>
  )
}

function Navbar({ count, onCart, onWallet, onPartyBooking, customerPhone }) {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 36)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id) => {
    setOpen(false)
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`navbar ${solid ? 'solid' : ''}`}>
      <a href="#home" className="brand-link"><BrandMark small /></a>
      <nav className={open ? 'open' : ''}>
        <button onClick={() => go('#story')}>हमारी कहानी</button>
        <button onClick={() => go('#menu')}>मेन्यू</button>
        <button onClick={() => go('#rewards')}>इनाम</button>
        <button onClick={() => go('#gallery')}>झलकियाँ</button>
        <button onClick={() => go('#visit')}>पधारो सा</button>
        <button onClick={() => { setOpen(false); window.location.hash = '#gallery-page' }}>गैलरी (Photos & Reels)</button>
        <button onClick={() => { setOpen(false); onPartyBooking(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={15} style={{ color: 'var(--marigold)' }} />
          <span>पार्टी / बन्दोला</span>
        </button>
      </nav>
      <div className="nav-actions">
        <button onClick={onWallet} className="cart-pill" style={{ background: 'rgba(216, 168, 67, 0.18)', border: '1px solid var(--marigold)', color: 'var(--ink)' }}>
          <Ticket size={17} style={{ color: 'var(--rust)' }} />
          <span>{customerPhone ? `📱 ...${customerPhone.slice(-4)} (खाता)` : 'साइन-इन / कूपन'}</span>
        </button>
        <button className="cart-pill" onClick={onCart} aria-label="Open cart">
          <ShoppingBag size={18} />
          <span>ITEM ADD</span>
          <b>{count}</b>
        </button>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <MenuIcon />}
        </button>
      </div>
    </header>
  )
}

function Hero({ onOrder, onPartyBooking, media }) {
  const heroRef = useRef(null)
  const onMove = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const { innerWidth, innerHeight } = window
    const x = (event.clientX / innerWidth - 0.5) * 10
    const y = (event.clientY / innerHeight - 0.5) * 8
    heroRef.current?.style.setProperty('--mx', `${x}px`)
    heroRef.current?.style.setProperty('--my', `${y}px`)
  }
  return (
    <section id="home" className="hero" ref={heroRef} onMouseMove={onMove}>
      <div className="hero-bg" style={{ backgroundImage: `url(${media.heroImage || DEFAULT_MEDIA.heroImage})` }} />
      <div className="hero-grain" />
      <div className="arch arch-left" />
      <div className="arch arch-right" />
      <div className="hero-content reveal-up">
        <div className="eyebrow"><Sparkles size={14} /> बालोतरा की मिट्टी • मारवाड़ का स्वाद</div>
        <h1>जहाँ हर कौर में<br /><em>मारवाड़ का स्वाद</em> बसता है</h1>
        <p>चूल्हे की आँच, देसी घी की खुशबू और दिल से की गई मनुहार।<br className="desktop-only" /> आवो सा, जीमण रो आनंद लो।</p>
        <div className="hero-ctas" style={{ flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={() => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' })}>
            मेन्यू देखो <ArrowRight size={18} />
          </button>
          <button className="btn ghost" onClick={() => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' })}>
            <ShoppingBag size={18} /> ऑर्डर करो
          </button>
          <button className="btn outline" onClick={onPartyBooking} style={{ background: 'rgba(244, 182, 61, 0.15)', borderColor: 'var(--marigold)', color: '#fff' }}>
            🎉 पार्टी व बन्दोला बुकिंग
          </button>
        </div>
        <div className="hero-meta">
          <span><Star size={16} fill="currentColor" /> 4.9 <small>2.4k+ मेहमान</small></span>
          <i />
          <span><Clock3 size={16} /> रोज़ाना <small>12 AM – 11.30 PM</small></span>
          <i />
          <span><MapPin size={16} /> बालोतरा <small>राजस्थान</small></span>
        </div>
      </div>
      <div className="heritage-seal" aria-hidden="true">
        <svg className="seal-ring" viewBox="0 0 180 180" aria-hidden="true">
          <defs>
            <path id="seal-text-path" d="M 90 90 m -69 0 a 69 69 0 1 1 138 0 a 69 69 0 1 1 -138 0" />
          </defs>
          <circle className="seal-guide" cx="90" cy="90" r="73" />
          <text>
            <textPath href="#seal-text-path" startOffset="0%">
              {"शुद्ध\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0देसी\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0स्वाद\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0मनुहार\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0शुद्ध\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0देसी\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0स्वाद\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0मनुहार\u00a0\u00a0\u00a0•"}
            </textPath>
          </text>
        </svg>
        <div className="seal-center"><ChefHat /><b>100%</b><span>VEG</span></div>
      </div>
      <button className="scroll-cue" onClick={() => document.querySelector('#story')?.scrollIntoView({ behavior: 'smooth' })}>
        नीचे पधारो <ArrowDown size={18} />
      </button>
    </section>
  )
}

function Marquee() {
  const text = 'दाल बाटी चूरमा ✦ केर सांगरी ✦ बाजरे की रोटी ✦चाइनीज़ ✦ कुल्हड़ लस्सी ✦ पधारो म्हारे देस ✦ '
  return <div className="marquee"><div>{text.repeat(3)}</div></div>
}

function Story({ media }) {
  return (
    <section id="story" className="story section">
      <div className="ornament">॥</div>
      <div className="story-copy">
        <div className="section-kicker">मिट्टी से जुड़ी कहानी</div>
        <h2>सिर्फ़ खाना नहीं,<br /><em>एक मारवाड़ी अनुभव</em></h2>
        <p className="lead">यहाँ रेसिपी किताब से नहीं, दादी-नानी की रसोई से आती है। हर मसाला हाथ से कुटता है और हर थाली मनुहार से परोसी जाती है।</p>
        <div className="story-stats">
          <div><strong>27+</strong><span>देसी व्यंजन</span></div>
          <div><strong>4.9</strong><span>मेहमान रेटिंग</span></div>
          <div><strong>100%</strong><span>शुद्ध शाकाहारी</span></div>
        </div>
        <button className="text-link">हमारी पूरी कहानी <ArrowRight size={17} /></button>
      </div>
      <div className="story-visual">
        <div className="thali-frame">
          <img src={media.storyImage || DEFAULT_MEDIA.storyImage} alt="Traditional Marwari thali" />
          <div className="frame-corner top-left" />
          <div className="frame-corner bottom-right" />
        </div>
        <div className="floating-note"><Heart size={18} fill="currentColor" /><span>घी कम-ज्यादा?<br /><b>बस हुकुम करो सा!</b></span></div>
        <div className="sun-disc" />
      </div>
    </section>
  )
}

function MenuSection({ menu, onAdd }) {
  const categories = ['सब', ...Array.from(new Set(menu.map(item => item.cat).filter(Boolean)))]
  const [active, setActive] = useState('सब')
  const visible = active === 'सब' ? menu.slice(0, 6) : menu.filter(item => item.cat === active)
  return (
    <section id="menu" className="menu-section section-dark">
      <div className="section-heading centered">
        <div className="section-kicker light">आज क्या जीमोगे सा?</div>
        <h2>हमारी <em>रसोई</em> से</h2>
        <p>मारवाड़ के असली स्वाद से लेकर आपका पसंदीदाचाइनीज़ तक।</p>
      </div>
      <div className="category-tabs" role="tablist">
        {categories.map(category => <button key={category} className={active === category ? 'active' : ''} onClick={() => setActive(category)}>{category}</button>)}
      </div>
      <div className="menu-grid">
        {visible.map((item, index) => (
          <article className="menu-card" key={item.id} style={{ '--delay': `${index * 50}ms` }}>
            <div className="dish-image" style={dishStyle(item)}>
              {item.tag && <span className="dish-tag">{item.tag}</span>}
              <span className="veg-dot" title="Vegetarian"><i /></span>
            </div>
            <div className="dish-copy">
              <div className="dish-title">
                <div><h3>{item.name}</h3><span>{item.latin}</span></div>
                <strong>₹{item.price}</strong>
              </div>
              <p>{item.desc}</p>
              <button onClick={() => onAdd(item)}><Plus size={17} /> ITEM ADD करें</button>
            </div>
          </article>
        ))}
      </div>
      <button className="btn outline menu-more" onClick={() => setActive('सब')}>
        पूरा मेन्यू देखें <ArrowRight size={18} />
      </button>
    </section>
  )
}

function Rewards() {
  return (
    <section id="rewards" className="rewards section">
      <div className="reward-visual">
        <div className="reward-card-demo">
          <div className="card-top"><BrandMark small /><span><Gift size={18} /> अगली पधारो</span></div>
          <div className="demo-prize">
            <small>SCRATCH & SHAGUN</small>
            <strong>कुछ तो<br />ख़ास है!</strong>
            <span>यहाँ रगड़ो सा</span>
          </div>
          <div className="demo-code">KD •••• ••••</div>
        </div>
        <div className="coin coin-one">₹</div>
        <div className="coin coin-two"><Sparkles /></div>
        <div className="reward-stamp">हर ऑनलाइन<br /><b>PAYMENT</b><br />पर पक्का इनाम</div>
      </div>
      <div className="reward-copy">
        <div className="section-kicker">अगली बार की मनुहार</div>
        <h2>पैसा भरो,<br /><em>शगुन खुरचो!</em></h2>
        <p className="lead">वेबसाइट से ऑनलाइन पेमेंट करते ही मिलेगा एक डिजिटल स्क्रैच कार्ड—अगली पधारो पर दिखाओ और इनाम ले जाओ।</p>
        <div className="odds">
          <div><span className="odds-num">40%</span><p><b>बिल पर छूट</b><br />5%, 10%, 15% या 20%</p></div>
          <div><span className="odds-num">60%</span><p><b>मुफ़्त ट्रीट</b><br />Mocktail, Coffee, Starter या Sweet</p></div>
        </div>
        <div className="reward-steps">
          <div><span>01</span><p><b>ऑनलाइन ऑर्डर</b><br />वेबसाइट से खाना चुनो</p></div>
          <div><span>02</span><p><b>पेमेंट करो</b><br />UPI या कार्ड से</p></div>
          <div><span>03</span><p><b>स्क्रैच करो</b><br />40% हिस्सा रगड़ो</p></div>
          <div><span>04</span><p><b>अगली बार लो</b><br />कोड दिखाकर claim करो</p></div>
        </div>
      </div>
    </section>
  )
}

function Gallery({ media }) {
  const [muted, setMuted] = useState(true)
  const gallery = media.gallery.filter(item => item.visible)
  return (
    <section id="gallery" className="gallery section-dark">
      <div className="section-heading inline">
        <div>
          <div className="section-kicker light">ढाबे की झलकियाँ</div>
          <h2>महक, माहौल<br />और <em>मस्ती</em></h2>
        </div>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="gallery-caption" aria-label="Instagram profile open karein">
          <Instagram size={21} /><span>रोज़ नई झलकियाँ<br /><b>@majisacafe_restaurant</b></span>
        </a>
      </div>
      <div className="reel-grid">
        {gallery.map(item => (
          <figure key={item.id} className={`reel ${item.className || ''} ${item.type === 'atlas' ? `image-tile atlas-${item.atlas || 0}` : ''}`}>
            {item.type === 'video' && <video src={item.src} autoPlay loop muted={muted} playsInline />}
            {item.type === 'image' && <img src={item.src} alt={item.label} />}
            <figcaption>{item.type === 'video' && <Play fill="currentColor" />} {item.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 30, flexWrap: 'wrap' }}>
        <button className="sound-toggle" style={{ margin: 0 }} onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />} {muted ? 'आवाज़ चालू करें' : 'आवाज़ बंद करें'}
        </button>
        <a href="#gallery-page" className="sound-toggle" style={{ margin: 0, background: 'var(--marigold)', color: 'var(--ink)', border: '1px solid var(--marigold)' }}>
          <Sparkles size={18} style={{ color: 'var(--ink)' }} /> <b>पूरी गैलरी देखें (All Photos & Reels)</b>
        </a>
      </div>
    </section>
  )
}

function Testimonials() {
  const reviews = [
    { quote: 'ऐसा लगा बालोतरा में नहीं, घर के आँगन में बैठकर खा रहे हैं। दाल बाटी और मनुहार—दोनों लाजवाब!', name: 'Priya Rathore', city: 'Jodhpur' },
    { quote: 'पूरा family माहौल, शानदार सजावट और केर सांगरी बिल्कुल authentic. Scratch card में free mocktail भी मिला!', name: 'Amit Soni', city: 'Barmer' },
    { quote: 'Balotra आते हैं तो Majisa Cafe अब fixed stop है. Staff दिल से खिलाता है और बच्चों को माहौल बहुत पसंद आया।', name: 'Nisha Mehta', city: 'Ahmedabad' },
  ]
  const [active, setActive] = useState(0)
  const review = reviews[active]
  return (
    <section className="testimonials section">
      <div className="quote-mark"><Quote /></div>
      <div className="review-stars">{[1, 2, 3, 4, 5].map(i => <Star key={i} fill="currentColor" />)}</div>
      <blockquote>“{review.quote}”</blockquote>
      <div className="reviewer"><span>{review.name.split(' ').map(n => n[0]).join('')}</span><p><b>{review.name}</b><small>{review.city} • Verified Guest</small></p></div>
      <div className="review-nav">
        <button onClick={() => setActive((active - 1 + reviews.length) % reviews.length)}><ChevronLeft /></button>
        <div>{reviews.map((_, i) => <i key={i} className={i === active ? 'active' : ''} />)}</div>
        <button onClick={() => setActive((active + 1) % reviews.length)}><ChevronRight /></button>
      </div>
    </section>
  )
}

function Visit() {
  return (
    <section id="visit" className="visit">
      <div className="map-panel map-panel-live">
        <iframe
          title="Majisa Cafe location on Google Maps"
          src={GOOGLE_MAPS_EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" className="map-directions-fab">
          <Navigation size={18} /> Direction start karo
        </a>
      </div>
      <div className="visit-copy">
        <div className="section-kicker light">अब देर कैसी सा?</div>
        <h2>पधारो म्हारे<br /><em>माजीसा कैफे एंड रेस्टोरेंट</em></h2>
        <p>परिवार साथ लाओ, भूख हम संभाल लेंगे।</p>
        <div className="visit-info">
          <div><MapPin /><p><b>पता</b><br />{CAFE_ADDRESS}</p></div>
          <div><Clock3 /><p><b>रोज़ाना खुला</b><br />सुबह 12:00 – रात 11:30</p></div>
          <div><Phone /><p><b>टेबल बुकिंग / संपर्क</b><br />
            <a href={`tel:${PHONE_PRIMARY}`}>+91 97258 45974</a><br />
            <a href={`tel:${PHONE_SECONDARY}`}>+91 70730 11597</a>
          </p></div>
        </div>
        <div className="visit-buttons">
          <a href={GOOGLE_MAPS_DIRECTIONS_URL} target="_blank" rel="noreferrer" className="btn primary"><MapPin size={18} /> रास्ता देखें</a>
          <a href={`tel:${PHONE_PRIMARY}`} className="btn ghost"><Phone size={18} /> कॉल करें</a>
        </div>
      </div>
    </section>
  )
}

function CartDrawer({ cart, setCart, onClose, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const update = (id, delta) => setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0))
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="cart-drawer" onMouseDown={e => e.stopPropagation()}>
        <div className="drawer-head"><div><span>ADDED ITEMS</span><h3>आज क्या जीमोगे?</h3></div><button onClick={onClose}><X /></button></div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart"><ShoppingBag /><h4>अभी कोई ITEM ADD नहीं है</h4><p>मेन्यू से अपना मनपसंद खाना चुनिए।</p><button className="btn primary" onClick={onClose}>मेन्यू देखें</button></div>
          ) : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="cart-thumb" style={dishStyle(item)} />
              <div className="cart-item-copy"><h4>{item.name}</h4><span>₹{item.price}</span><div className="qty"><button onClick={() => update(item.id, -1)}><Minus /></button><b>{item.qty}</b><button onClick={() => update(item.id, 1)}><Plus /></button></div></div>
            </div>
          ))}
        </div>
        {cart.length > 0 && <div className="cart-footer">
          <div><span>Subtotal</span><b>₹{total}</b></div>
          <small>Taxes & delivery checkout पर जुड़ेंगे</small>
          <button className="btn primary full" onClick={onCheckout}>पेमेंट करें • ₹{total} <ArrowRight /></button>
          <p><Gift size={15} /> ऑनलाइन पेमेंट पर पक्का scratch reward</p>
        </div>}
      </aside>
    </div>
  )
}

function Checkout({ total, customerName = '', customerPhone = '', onClose, onSuccess }) {
  const [billAmount, setBillAmount] = useState(total)
  const [paymentMode, setPaymentMode] = useState('counter') // 'counter' | 'online'
  const [name, setName] = useState(customerName || '')
  const [mobile, setMobile] = useState(customerPhone || '')
  const [email, setEmail] = useState('')
  const [members, setMembers] = useState(2)
  const [isCustomMembers, setIsCustomMembers] = useState(false)
  const [upiRef, setUpiRef] = useState('')
  const [paying, setPaying] = useState(false)
  const [diningOption, setDiningOption] = useState('dine-in')

  const amount = Math.max(1, Number(billAmount) || total)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Majisa Cafe bill payment')}`

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (paymentMode === 'online' && upiRef.trim().length < 6) {
      alert('कृपया सही 6+ अंकों का UPI रेफरेंस नंबर दर्ज करें सा!')
      return
    }
    const cleanMobile = mobile.replace(/\D/g, '')
    if (!cleanMobile || cleanMobile.length < 10) {
      alert('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें सा!')
      return
    }

    setPaying(true)
    setTimeout(() => {
      onSuccess({
        amount,
        name: name.trim() || customerName || 'Guest Customer',
        mobile: cleanMobile || customerPhone || '',
        email: email.trim(),
        members: diningOption === 'dine-in' ? (Number(members) || 2) : null,
        upiRef: paymentMode === 'counter' ? 'COUNTER_PAY' : upiRef.trim(),
        paymentMode,
        diningOption
      })
    }, 800)
  }

  return (
    <div className="overlay modal-overlay">
      <div className="checkout-modal" style={{ maxWidth: '520px', width: '95%' }}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <div className="checkout-head" style={{ marginBottom: '14px' }}>
          <span><ShoppingBag /></span>
          <div>
            <small style={{ color: 'var(--marigold)', fontWeight: 'bold' }}>ORDER & PAYMENT METHOD</small>
            <h3 style={{ margin: 0, fontFamily: 'var(--devanagari)' }}>ऑर्डर व पेमेंट विकल्प</h3>
          </div>
        </div>

        {/* Total Amount Header */}
        <div className="bill-line" style={{ background: '#fff9ed', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f0e1c2', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#555' }}>कुल भुगतान (Total Amount):</span>
          <strong style={{ fontSize: '1.35rem', color: 'var(--rust)' }}>₹{amount}</strong>
        </div>

        {/* Payment Mode Selection Tabs */}
        <label className="input-label" style={{ fontFamily: 'var(--devanagari)', fontWeight: 'bold', color: '#333' }}>
          भुगतान का तरीका चुनें (Payment Method)
        </label>
        <div style={{ display: 'flex', gap: '10px', margin: '6px 0 16px 0' }}>
          <button
            type="button"
            onClick={() => setPaymentMode('counter')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: paymentMode === 'counter' ? '2px solid var(--rust)' : '1px solid rgba(28, 14, 7, 0.18)',
              background: paymentMode === 'counter' ? 'var(--rust)' : '#fff',
              color: paymentMode === 'counter' ? '#fff' : 'rgba(28, 14, 7, 0.7)',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--devanagari)',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              boxShadow: paymentMode === 'counter' ? '0 4px 12px rgba(157, 54, 27, 0.25)' : 'none'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💵</span>
            <span>काउंटर पर भुगतान (Pay at Counter)</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('online')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: paymentMode === 'online' ? '2px solid var(--rust)' : '1px solid rgba(28, 14, 7, 0.18)',
              background: paymentMode === 'online' ? 'var(--rust)' : '#fff',
              color: paymentMode === 'online' ? '#fff' : 'rgba(28, 14, 7, 0.7)',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--devanagari)',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              boxShadow: paymentMode === 'online' ? '0 4px 12px rgba(157, 54, 27, 0.25)' : 'none'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💳</span>
            <span>ऑनलाइन यूपीआई (Online UPI QR)</span>
          </button>
        </div>

        {/* Dining Type Selection */}
        <label className="input-label" style={{ fontFamily: 'var(--devanagari)', fontWeight: 'bold' }}>ऑर्डर का प्रकार (Dining Option)</label>
        <div style={{ display: 'flex', gap: '10px', margin: '6px 0 16px 0' }}>
          <button
            type="button"
            onClick={() => setDiningOption('dine-in')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: diningOption === 'dine-in' ? '2px solid var(--rust)' : '1px solid rgba(28, 14, 7, 0.18)',
              background: diningOption === 'dine-in' ? 'rgba(157, 54, 27, 0.08)' : 'transparent',
              color: diningOption === 'dine-in' ? 'var(--rust)' : 'rgba(28, 14, 7, 0.65)',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: 'var(--devanagari)',
              fontSize: '0.84rem'
            }}
          >
            <UtensilsCrossed size={16} />
            <span>टेबल पर खाएंगे (Dine-in)</span>
          </button>
          <button
            type="button"
            onClick={() => setDiningOption('takeaway')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: diningOption === 'takeaway' ? '2px solid var(--rust)' : '1px solid rgba(28, 14, 7, 0.18)',
              background: diningOption === 'takeaway' ? 'rgba(157, 54, 27, 0.08)' : 'transparent',
              color: diningOption === 'takeaway' ? 'var(--rust)' : 'rgba(28, 14, 7, 0.65)',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: 'var(--devanagari)',
              fontSize: '0.84rem'
            }}
          >
            <ShoppingBag size={16} />
            <span>पैक करवाएंगे (Takeaway)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Customer Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">आपका नाम (Name)</label>
              <div className="fake-input">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. रमेश शर्मा"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">मोबाइल नंबर (Mobile)</label>
              <div className="fake-input">
                <input
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                  inputMode="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guest Count (Members) - Only visible when Dine-in is selected */}
          {diningOption === 'dine-in' && (
            <div style={{ background: '#fdfbf7', padding: '12px 14px', borderRadius: '8px', border: '1px solid #efe4d3' }}>
              <label className="input-label" style={{ fontFamily: 'var(--devanagari)', fontWeight: 'bold', color: 'var(--rust)', margin: '0 0 8px 0' }}>
                👥 कुल सदस्य / लोग (Number of Guests/Members)
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[1, 2, 4, 6, 8].map(cnt => (
                  <button
                    type="button"
                    key={cnt}
                    onClick={() => { setMembers(cnt); setIsCustomMembers(false); }}
                    style={{
                      flex: 1,
                      minWidth: '55px',
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: (!isCustomMembers && members === cnt) ? '2px solid var(--rust)' : '1px solid #ccc',
                      background: (!isCustomMembers && members === cnt) ? 'var(--rust)' : '#fff',
                      color: (!isCustomMembers && members === cnt) ? '#fff' : '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {cnt} {cnt === 1 ? 'व्यक्ति' : 'लोग'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomMembers(true)}
                  style={{
                    flex: 1,
                    minWidth: '75px',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: isCustomMembers ? '2px solid var(--rust)' : '1px solid #ccc',
                    background: isCustomMembers ? 'var(--rust)' : '#fff',
                    color: isCustomMembers ? '#fff' : '#333',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  ✏️ अन्य (Custom)
                </button>
              </div>

              {isCustomMembers && (
                <div style={{ marginTop: '10px' }}>
                  <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.75rem' }}>सदस्यों की संख्या मैनुअल दर्ज करें (Enter Member Count):</label>
                  <div className="fake-input" style={{ background: '#fff' }}>
                    <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold' }}>👥</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={members}
                      onChange={e => setMembers(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="जैसे: 3, 5, 7, 10, 15 लोग"
                      style={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                      required={isCustomMembers}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional Email input for receipt alert */}
          <div>
            <label className="input-label">ईमेल आईडी (Email Notification - Optional)</label>
            <div className="fake-input">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="customer@gmail.com"
              />
            </div>
          </div>

          {/* ONLINE PAYMENT MODE DETAILS */}
          {paymentMode === 'online' && (
            <div style={{ background: '#fcf8ee', padding: '12px', borderRadius: '8px', border: '1px solid #e9d7b0' }}>
              <div className="qr-pay-box" style={{ margin: 0 }}>
                <div className="qr-card" aria-label="UPI QR code"><QRCodeSVG value={upiUrl} size={120} includeMargin /><b>SCAN & PAY</b></div>
                <div>
                  <small>Paytm / PhonePe / GPay</small>
                  <h4>{PAYEE_NAME}</h4>
                  <p>UPI ID: <b>{UPI_ID}</b></p>
                  <a href={upiUrl} className="upi-open">UPI App Open</a>
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <label className="input-label">UPI Transaction / Ref No. (Required)</label>
                <div className="fake-input">
                  <span>#</span>
                  <input
                    value={upiRef}
                    onChange={e => setUpiRef(e.target.value)}
                    placeholder="e.g. 426598731204"
                    required={paymentMode === 'online'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAY AT COUNTER MODE DETAILS */}
          {paymentMode === 'counter' && (
            <div style={{ background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#1b5e20' }}>
              <b>💵 काउंटर पेमेंट सुविधा:</b>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', lineHeight: '1.4' }}>
                आपका ऑर्डर तुरंत रसोई को भेज दिया जाएगा। भोजन प्राप्त करते समय या टेबल पर बिलिंग काउंटर पर Cash / Card द्वारा ₹{amount} का भुगतान करें सा।
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`btn primary full pay-button ${paying ? 'paying' : ''}`}
            disabled={paying || (paymentMode === 'online' && upiRef.trim().length < 6)}
            style={{ marginTop: '6px' }}
          >
            {paying ? (
              <><i /> ऑर्डर सबमिट हो रहा है...</>
            ) : paymentMode === 'counter' ? (
              <>काउंटर ऑर्डर कन्फर्म करें (Confirm Order) <ArrowRight /></>
            ) : (
              <>ऑनलाइन ऑर्डर सबमिट करें (Submit Payment) <ArrowRight /></>
            )}
          </button>
        </form>

        <small className="info-note" style={{ marginTop: '8px', display: 'block', textAlign: 'center' }}>
          {paymentMode === 'counter'
            ? 'ऑर्डर सबमिट होते ही आपकी रसीद और नोटिफिकेशन ईमेल व मोबाइल पर प्राप्त हो जाएगा सा।'
            : 'नोट: यूपीआई पेमेंट की जांच काउंटर स्टाफ द्वारा की जाएगी।'}
        </small>
      </div>
    </div>
  )
}

function CustomerWalletModal({
  customerPhone,
  setCustomerPhone,
  customerName,
  setCustomerName,
  coupons = [],
  orders = [],
  bills = [],
  onClose,
  onApplyCoupon,
  pendingItemToAdd = null,
  onCompletePendingAdd = null
}) {
  const [step, setStep] = useState(customerPhone ? 'dashboard' : 'phone')
  const [phoneInput, setPhoneInput] = useState(customerPhone || '')
  const [nameInput, setNameInput] = useState(customerName || '')
  const [copiedCode, setCopiedCode] = useState('')
  const [activeTab, setActiveTab] = useState('coupons')

  const handleSignIn = (e) => {
    e.preventDefault()
    const cleanPhone = phoneInput.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      alert('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें सा!')
      return
    }
    const finalName = nameInput.trim() || 'Guest Customer'

    localStorage.setItem('majisa-customer-phone', cleanPhone)
    localStorage.setItem('majisa-customer-name', finalName)
    setCustomerPhone(cleanPhone)
    setCustomerName(finalName)
    registerOrUpdateCustomer(finalName, cleanPhone)
    setStep('dashboard')

    if (pendingItemToAdd && typeof onCompletePendingAdd === 'function') {
      onCompletePendingAdd(pendingItemToAdd)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('majisa-customer-phone')
    localStorage.removeItem('majisa-customer-name')
    setCustomerPhone('')
    setCustomerName('')
    setPhoneInput('')
    setNameInput('')
    setStep('phone')
  }

  const cleanActivePhone = (customerPhone || '').replace(/\D/g, '').slice(-10)
  const activeNameClean = (customerName || '').trim().toLowerCase()
  const activeOrderId = localStorage.getItem('majisa-active-order-id')

  // History matching customer phone, name, or active order ID (Orders + Bills)
  const rawMyOrders = orders.filter(o => {
    const oPhone = (o.mobile || '').replace(/\D/g, '').slice(-10)
    const oName = (o.name || '').trim().toLowerCase()
    if (activeOrderId && o.id === activeOrderId) return true
    if (cleanActivePhone && oPhone && (oPhone.includes(cleanActivePhone) || cleanActivePhone.includes(oPhone))) return true
    if (activeNameClean && activeNameClean.length >= 2 && oName && (oName.includes(activeNameClean) || activeNameClean.includes(oName))) return true
    return false
  })

  const myOrders = rawMyOrders.map(o => ({
    type: 'order',
    id: o.id,
    amount: o.amount,
    date: o.created,
    status: o.status,
    diningOption: o.diningOption,
    items: o.items || [],
    ref: o.upiRef,
    coupon: o.coupon
  }))

  const myBills = bills.filter(b => {
    const bPhone = (b.mobile || b.customer_phone || b.customerPhone || '').replace(/\D/g, '').slice(-10)
    const bName = (b.customerName || b.name || '').trim().toLowerCase()
    if (cleanActivePhone && bPhone && (bPhone.includes(cleanActivePhone) || cleanActivePhone.includes(bPhone))) return true
    if (activeNameClean && activeNameClean.length >= 2 && bName && (bName.includes(activeNameClean) || activeNameClean.includes(bName))) return true
    return false
  }).map(b => ({
    type: 'bill',
    id: b.id,
    amount: b.amount,
    date: b.created || b.submittedAt,
    status: b.status === 'rewarded' ? 'completed' : b.status === 'submitted' ? 'accepted' : 'pending',
    diningOption: null,
    items: [],
    ref: b.upiRef,
    couponCode: b.couponCode,
    customerName: b.customerName || b.name
  }))

  const historyList = [...myOrders, ...myBills].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  // Coupons matching customer phone/name OR attached to customer's completed orders
  const directCoupons = coupons.filter(c => {
    const cPhone = (c.customerPhone || c.mobile || '').replace(/\D/g, '').slice(-10)
    const cName = (c.customerName || '').trim().toLowerCase()
    if (cleanActivePhone && cPhone && (cPhone.includes(cleanActivePhone) || cleanActivePhone.includes(cPhone))) return true
    if (activeNameClean && activeNameClean.length >= 2 && cName && (cName.includes(activeNameClean) || activeNameClean.includes(cName))) return true
    return false
  })

  const orderCoupons = rawMyOrders.map(o => o.coupon).filter(Boolean)
  const combinedMap = new Map()
    ;[...directCoupons, ...orderCoupons].forEach(c => {
      if (c && c.code) combinedMap.set(c.code, c)
    })
  const myCoupons = Array.from(combinedMap.values())
  const availableCoupons = myCoupons.filter(c => couponStatus(c) === 'valid')
  const usedCoupons = myCoupons.filter(c => couponStatus(c) === 'redeemed')
  const expiredCoupons = myCoupons.filter(c => couponStatus(c) === 'expired')

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 3000)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
      case 'submitted':
        return <span className="status-badge accepted">स्वीकृत</span>
      case 'completed':
      case 'rewarded':
      case 'delivered':
        return <span className="status-badge delivered">डिलीवर</span>
      case 'cancelled':
        return <span className="status-badge cancelled">रद्द</span>
      default:
        return <span className="status-badge pending">पेंडिंग</span>
    }
  }

  return (
    <div className="overlay modal-overlay">
      <div className="checkout-modal customer-wallet-modal" style={{ maxWidth: '540px', width: '95%' }}>
        <button className="modal-close" onClick={onClose}><X /></button>

        <div className="checkout-head" style={{ marginBottom: '16px' }}>
          <span style={{ background: 'var(--rust)', color: '#fff', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={20} />
          </span>
          <div>
            <small style={{ color: 'var(--marigold)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              {step === 'dashboard' ? 'CUSTOMER DASHBOARD' : 'CUSTOMER SIGN-IN'}
            </small>
            <h3 style={{ margin: 0, fontFamily: 'var(--devanagari)' }}>
              {step === 'dashboard' ? 'मेरा खाता & इतिहास' : 'माजीसा ग्राहक साइन-इन'}
            </h3>
          </div>
        </div>

        {/* Enter Name & Phone */}
        {step === 'phone' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pendingItemToAdd && (
              <div style={{ background: 'rgba(216, 168, 67, 0.15)', border: '1px solid var(--marigold)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--rust)', flexShrink: 0 }} />
                <span><b>{pendingItemToAdd.name}</b> को कार्ट में जोड़ने के लिए साइन-इन करें सा!</span>
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 4px 0', lineHeight: '1.4' }}>
              साइन-इन करने, डिस्काउंट कूपन पाने और अपने ऑर्डर/पेमेंट का इतिहास देखने के लिए अपना नाम व 10 अंकों का मोबाइल नंबर दर्ज करें सा:
            </p>

            <div>
              <label className="input-label">आपका नाम (Full Name)</label>
              <div className="fake-input">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="जैसे: दिलीप कुमार"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">10 अंकों का मोबाइल नंबर (Mobile Number)</label>
              <div className="fake-input">
                <span>+91</span>
                <input
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  inputMode="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn primary full" style={{ marginTop: '8px' }}>
              साइन-इन करें & खाता देखें (Sign In) <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 3: Customer Dashboard */}
        {step === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(216, 168, 67, 0.1)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(216, 168, 67, 0.25)' }}>
              <div>
                <b style={{ color: 'var(--rust)', fontSize: '0.95rem', display: 'block' }}>{customerName || 'Guest User'}</b>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>📱 +91 {customerPhone}</span>
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #ccc', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#555' }}>
                लॉगआउट
              </button>
            </div>

            {/* Dashboard Tabs */}
            <div className="account-tabs">
              <button
                type="button"
                className={`account-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                🎟️ मेरे कूपन ({availableCoupons.length})
              </button>
              <button
                type="button"
                className={`account-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                📜 पेमेंट व ऑर्डर इतिहास ({historyList.length})
              </button>
            </div>

            {/* Tab 1: Coupons */}
            {activeTab === 'coupons' && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>उपलब्ध कूपन ({availableCoupons.length})</h4>

                {availableCoupons.length === 0 ? (
                  <div className="coupon-result" style={{ textAlign: 'center', padding: '20px 12px', background: '#f8f6f0', borderRadius: '10px' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>अभी कोई नया कूपन नहीं है सा</p>
                    <small style={{ color: '#777' }}>अगली बार बिल ऑनलाइन पे करें या स्क्रैच कार्ड से कूपन जीतें। कूपन ऑटोमैटिक आपके इस वॉलेट में सेव हो जाएगा!</small>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {availableCoupons.map(c => (
                      <div key={c.code} style={{ border: '2px dashed var(--rust)', borderRadius: '10px', padding: '12px', background: '#fffcf7', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ background: 'var(--rust)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              {c.reward?.type === 'discount' ? 'डिस्काउंट' : 'मुफ़्त आइटम'}
                            </span>
                            <h4 style={{ margin: '6px 0 2px 0', color: 'var(--ink)' }}>{c.reward?.label || 'SPECIAL REWARD'}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>{c.reward?.detail || 'माजीसा कैफे शगुन इनाम'}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <code style={{ background: '#eee', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#333', display: 'block' }}>{c.code}</code>
                            <small style={{ fontSize: '0.7rem', color: '#888' }}>15 दिनों के लिए वैध</small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.code)}
                            style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            {copiedCode === c.code ? '✅ कॉपी हो गया!' : 'कोड कॉपी करें'}
                          </button>
                          {typeof onApplyCoupon === 'function' && (
                            <button
                              type="button"
                              onClick={() => { onApplyCoupon(c); onClose(); }}
                              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: 'var(--rust)', color: '#fff', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              1-क्लिक में लागू करें
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {usedCoupons.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontWeight: 'bold' }}>✓ उपयोग किए जा चुके कूपन ({usedCoupons.length})</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.7 }}>
                      {usedCoupons.map(c => (
                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <span><b>{c.reward?.label}</b> (<code>{c.code}</code>)</span>
                          <small style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ रिडीम किया गया</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expiredCoupons.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#d32f2f', fontWeight: 'bold' }}>⚠️ एक्सपायर हो चुके कूपन ({expiredCoupons.length})</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.65 }}>
                      {expiredCoupons.map(c => (
                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <span><b>{c.reward?.label}</b> (<code>{c.code}</code>)</span>
                          <small style={{ color: '#d32f2f', fontWeight: 'bold' }}>⚠️ एक्सपायर (Expired)</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Order & Payment History */}
            {activeTab === 'history' && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>आपके पिछले ऑर्डर व बिल ({historyList.length})</h4>

                {historyList.length === 0 ? (
                  <div className="coupon-result" style={{ textAlign: 'center', padding: '20px 12px', background: '#f8f6f0', borderRadius: '10px' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>अभी तक कोई ऑर्डर इतिहास नहीं है सा</p>
                    <small style={{ color: '#777' }}>ऑनलाइन ऑर्डर या बिल पे करने पर आपके सभी ट्रांजेक्शन यहाँ दिखेंगे।</small>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {historyList.map(item => (
                      <div key={item.id} className="history-card" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                          <div>
                            <b style={{ color: 'var(--rust)', fontSize: '0.9rem' }}>{item.id}</b>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#888' }}>
                              {item.date ? new Date(item.date).toLocaleString('en-IN') : 'हाल ही में'}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--ink)' }}>₹{item.amount}</strong>
                            <div style={{ marginTop: '2px' }}>{getStatusBadge(item.status)}</div>
                          </div>
                        </div>

                        {item.diningOption && (
                          <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: '4px' }}>
                            प्रकार: <b>{item.diningOption === 'takeaway' ? 'पैक करवाएंगे (Takeaway)' : 'टेबल पर खाएंगे (Dine-in)'}</b>
                          </div>
                        )}

                        {item.items && item.items.length > 0 && (
                          <div style={{ background: '#f9f9f9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', color: '#444' }}>
                            {item.items.map((it, idx) => (
                              <div key={idx}>• {it.name} x {it.qty} (₹{it.price * it.qty})</div>
                            ))}
                          </div>
                        )}

                        {item.ref && (
                          <small style={{ display: 'block', fontSize: '0.7rem', color: '#999', marginTop: '6px' }}>
                            UPI Ref: {item.ref}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PartyBookingModal({ menu = [], onClose, onSubmit, customerPhone = '', customerName = '' }) {
  const [eventType, setEventType] = useState('bandola')
  const [guestCount, setGuestCount] = useState(50)
  const [isCustomGuests, setIsCustomGuests] = useState(false)
  const [eventDate, setEventDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    return tomorrow.toISOString().split('T')[0]
  })
  const [eventTime, setEventTime] = useState('शाम 7:30 PM')
  const [name, setName] = useState(customerName || '')
  const [mobile, setMobile] = useState(customerPhone || '')
  const [notes, setNotes] = useState('')

  const [activeCategory, setActiveCategory] = useState('सब')
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [selectedItemsMap, setSelectedItemsMap] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedBooking, setSubmittedBooking] = useState(null)

  const categories = ['सब', ...Array.from(new Set(menu.map(i => i.cat).filter(Boolean)))]
  const filteredMenu = menu.filter(i => {
    const matchCat = activeCategory === 'सब' || i.cat === activeCategory
    const query = menuSearchQuery.trim().toLowerCase()
    if (!query) return matchCat
    const nameMatch = (i.name || '').toLowerCase().includes(query)
    const latinMatch = (i.latin || '').toLowerCase().includes(query)
    const catMatch = (i.cat || '').toLowerCase().includes(query)
    return matchCat && (nameMatch || latinMatch || catMatch)
  })

  const toggleItemQty = (item, delta) => {
    setSelectedItemsMap(prev => {
      const current = prev[item.id] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const copy = { ...prev }
        delete copy[item.id]
        return copy
      }
      return { ...prev, [item.id]: next }
    })
  }

  const selectedItemsList = Object.entries(selectedItemsMap).map(([id, qty]) => {
    const found = menu.find(m => String(m.id) === String(id))
    return found ? { id: found.id, name: found.name, latin: found.latin || '', cat: found.cat, price: found.price, qty } : null
  }).filter(Boolean)

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const cleanMobile = mobile.replace(/\D/g, '')
    if (cleanMobile.length < 10) {
      alert('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें सा!')
      return
    }
    if (!name.trim()) {
      alert('कृपया अपना नाम दर्ज करें सा!')
      return
    }

    setSubmitting(true)

    const eventNamesMap = {
      birthday: '🎂 बर्थडे पार्टी (Birthday Party)',
      bandola: '🪕 मारवाड़ी बन्दोला / पारिवारिक जीमण',
      anniversary: '💍 एनिवर्सरी / किट्टी पार्टी',
      corporate: '👔 कॉरपोरेट मीटिंग / अन्य'
    }

    const booking = {
      id: `MJC-EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      eventType,
      eventTypeName: eventNamesMap[eventType] || 'इवेंट बुकिंग',
      guestCount: Number(guestCount) || 50,
      eventDate,
      eventTime,
      name: name.trim(),
      mobile: cleanMobile,
      notes: notes.trim(),
      selectedItems: selectedItemsList,
      status: 'pending',
      created: new Date().toISOString(),
    }

    onSubmit(booking)
    setSubmittedBooking(booking)
    setSubmitting(false)
  }

  return (
    <div className="overlay modal-overlay">
      <div className="checkout-modal party-booking-modal" style={{ maxWidth: '680px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X /></button>

        {submittedBooking ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
              <CheckCircle size={36} />
            </div>
            <span style={{ color: 'var(--rust)', fontWeight: 'bold', fontSize: '0.78rem', letterSpacing: '0.1em' }}>BOOKING SUBMITTED</span>
            <h3 style={{ margin: '4px 0 8px 0', font: '1.8rem var(--display)', color: 'var(--ink)' }}>बुकिंग आवेदन सबमिट हो गया सा!</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', fontFamily: 'var(--devanagari)', lineHeight: '1.5' }}>
              आपकी <b>{submittedBooking.eventTypeName}</b> बुकिंग ID <b>{submittedBooking.id}</b> सफलतापूर्वक दर्ज कर ली गई है। 
              स्टाफ जल्द ही आपके मोबाइल (+91 {submittedBooking.mobile}) पर संपर्क करेगा सा।
            </p>

            <div style={{ background: '#fbf7ee', border: '1px dashed #d8c4a5', borderRadius: '10px', padding: '16px', margin: '18px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>बुकिंग ID:</span>
                <strong style={{ color: 'var(--rust)' }}>{submittedBooking.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>इवेंट / कार्यक्रम:</span>
                <b>{submittedBooking.eventTypeName}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>तारीख व समय:</span>
                <b>{submittedBooking.eventDate} ({submittedBooking.eventTime})</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>कुल सदस्य / मेहमान:</span>
                <b>👥 {submittedBooking.guestCount} लोग</b>
              </div>
              {submittedBooking.selectedItems && submittedBooking.selectedItems.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2d5c2' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--rust)', display: 'block', marginBottom: '6px' }}>चुने गए मेन्यू व्यंजन ({submittedBooking.selectedItems.length}):</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {submittedBooking.selectedItems.map((it, idx) => (
                      <span key={idx} style={{ background: '#fff', border: '1px solid #ccc', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                        • {it.name} {it.latin ? `(${it.latin})` : ''} x {it.qty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`https://wa.me/919725845974?text=${encodeURIComponent(`खम्मा घणी माजीसा कैफे, मैंने अभी ऑनलाइन बन्दोला/पार्टी बुकिंग (ID: ${submittedBooking.id}) की है सा। कृपया विवरण कन्फर्म करें!`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn primary full"
                style={{ background: '#25D366', borderColor: '#25D366', textDecoration: 'none', color: '#fff', fontWeight: 'bold' }}
              >
                💬 WhatsApp पर कन्फर्म करें
              </a>
              <button className="btn outline full" onClick={onClose}>बंद करें</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="checkout-head" style={{ marginBottom: '16px' }}>
              <span style={{ background: 'var(--rust)', color: '#fff', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} />
              </span>
              <div>
                <small style={{ color: 'var(--rust)', fontWeight: 'bold' }}>EVENT & FUNCTION BOOKING</small>
                <h3 style={{ margin: '2px 0 0 0', font: '1.6rem var(--display)' }}>पार्टी व बन्दोला बुकिंग</h3>
              </div>
            </div>

            {/* Step 1: Event Type */}
            <label className="input-label" style={{ fontWeight: 'bold' }}>1. कार्यक्रम का प्रकार (Event Type)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { id: 'bandola', label: '🪕 मारवाड़ी बन्दोला', desc: 'पारंपरिक पारिवारिक जीमण' },
                { id: 'birthday', label: '🎂 बर्थडे पार्टी', desc: 'केक, सजावट व स्पेशल पार्टी' },
                { id: 'anniversary', label: '💍 एनिवर्सरी / किट्टी', desc: 'फैमिली गेट-टूगेदर' },
                { id: 'corporate', label: '👔 कॉरपोरेट / अन्य', desc: 'ऑफिस मीटिंग व पार्टी' },
              ].map(evt => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setEventType(evt.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: eventType === evt.id ? '2px solid var(--rust)' : '1px solid var(--line)',
                    background: eventType === evt.id ? '#fff8ee' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <b style={{ display: 'block', fontSize: '0.88rem', color: eventType === evt.id ? 'var(--rust)' : 'var(--ink)' }}>{evt.label}</b>
                  <small style={{ fontSize: '0.72rem', color: '#777' }}>{evt.desc}</small>
                </button>
              ))}
            </div>

            {/* Step 2: Guest Count */}
            <label className="input-label" style={{ fontWeight: 'bold' }}>2. कुल सदस्य / मेहमान (No. of Guests)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {[15, 25, 50, 100, 150, 200].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => { setGuestCount(cnt); setIsCustomGuests(false); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: !isCustomGuests && Number(guestCount) === cnt ? '2px solid var(--rust)' : '1px solid #ccc',
                    background: !isCustomGuests && Number(guestCount) === cnt ? 'var(--rust)' : '#fff',
                    color: !isCustomGuests && Number(guestCount) === cnt ? '#fff' : '#333',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  👥 {cnt} लोग
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomGuests(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isCustomGuests ? '2px solid var(--rust)' : '1px solid #ccc',
                  background: isCustomGuests ? 'var(--rust)' : '#fff',
                  color: isCustomGuests ? '#fff' : '#333',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✏️ अन्य संख्या
              </button>
            </div>

            {isCustomGuests && (
              <div style={{ marginBottom: '16px' }}>
                <div className="fake-input">
                  <span>👥</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={guestCount}
                    onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="जैसे: 75, 300, 500 लोग"
                    required={isCustomGuests}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Date & Time Slot */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 'bold' }}>3. कार्यक्रम की तारीख (Date)</label>
                <div className="fake-input">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 'bold' }}>4. समय (Time Slot)</label>
                <div className="fake-input">
                  <select
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    style={{ flex: 1, border: 0, outline: 0, background: 'transparent', padding: '0 10px', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    <option value="दोपहर 1:00 PM">दोपहर 1:00 PM</option>
                    <option value="दोपहर 3:00 PM">दोपहर 3:00 PM</option>
                    <option value="शाम 7:00 PM">शाम 7:00 PM</option>
                    <option value="रात 8:30 PM">रात 8:30 PM</option>
                    <option value="अन्य समय (फोन पर तय करें)">अन्य समय (फोन पर तय करें)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 4: Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="input-label" style={{ fontWeight: 'bold' }}>5. आपका नाम (Full Name)</label>
                <div className="fake-input">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="जैसे: दिलीप कुमार"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 'bold' }}>6. 10 अंकों का मोबाइल नंबर</label>
                <div className="fake-input">
                  <span>+91</span>
                  <input
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    inputMode="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Custom Menu Item Selector */}
            <div style={{ background: '#fdf9f2', border: '1px solid #e8d9c3', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <label className="input-label" style={{ margin: 0, fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--ink)' }}>
                    7. मेन्यू से पसन्दीदा व्यंजन चुनें (Choose Menu Items)
                  </label>
                  <small style={{ color: '#777', fontSize: '0.72rem' }}>इवेंट me parosne ke liye items select karein (Hindi & English)</small>
                </div>
                <span style={{ background: 'var(--rust)', color: '#fff', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {selectedItemsList.length} चुने गए
                </span>
              </div>

              {/* Search Bar Input */}
              <div className="fake-input" style={{ marginBottom: '10px', background: '#fff', border: '1px solid #d8c4a5' }}>
                <span>🔍</span>
                <input
                  value={menuSearchQuery}
                  onChange={e => setMenuSearchQuery(e.target.value)}
                  placeholder="व्यंजन या डिश खोजें (Search dish in Hindi / English e.g. Paneer, Dal, Lassi...)"
                  style={{ fontSize: '0.85rem' }}
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 8px', color: '#888', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: activeCategory === cat ? '1px solid var(--rust)' : '1px solid #ccc',
                      background: activeCategory === cat ? 'var(--rust)' : '#fff',
                      color: activeCategory === cat ? '#fff' : '#555',
                      fontSize: '0.74rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dish Items Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredMenu.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px', color: '#888', fontSize: '0.82rem' }}>
                    कोई व्यंजन नहीं मिला सा ('{menuSearchQuery}' नहीं मिला)
                  </div>
                ) : (
                  filteredMenu.map(item => {
                    const qty = selectedItemsMap[item.id] || 0
                    const isSelected = qty > 0
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: isSelected ? '#fff3e0' : '#fff',
                          border: isSelected ? '1px solid var(--rust)' : '1px solid #eee',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div>
                            <b style={{ fontSize: '0.78rem', color: 'var(--ink)', display: 'block', lineHeight: '1.2' }}>{item.name}</b>
                            {item.latin && <span style={{ fontSize: '0.68rem', color: '#666', fontStyle: 'italic', display: 'block' }}>{item.latin}</span>}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--rust)', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '4px' }}>₹{item.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
                          <small style={{ fontSize: '0.66rem', color: '#888' }}>{item.cat}</small>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isSelected && (
                              <button
                                type="button"
                                onClick={() => toggleItemQty(item, -1)}
                                style={{ width: '22px', height: '22px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                            )}
                            {isSelected && <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>{qty}</span>}
                            <button
                              type="button"
                              onClick={() => toggleItemQty(item, 1)}
                              style={{
                                padding: '2px 8px',
                                border: 'none',
                                background: isSelected ? 'var(--rust)' : '#e0e0e0',
                                color: isSelected ? '#fff' : '#333',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {isSelected ? '+' : '+ जोड़ें'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Notes Input */}
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">विशेष निर्देश / नोट (Special Requests - Optional)</label>
              <div className="fake-input">
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="जैसे: स्टेज सजावट, डीजे या अलग से लहसुन चटनी की व्यवस्था"
                />
              </div>
            </div>

            <button type="submit" className="btn primary full" disabled={submitting}>
              {submitting ? 'बुकिंग सबमिट हो रही है...' : '🎉 पार्टी/बन्दोला बुकिंग सबमिट करें'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ScratchCard({ reward, code, onDone }) {
  const canvasRef = useRef(null)
  const cardRef = useRef(null)
  const isDrawing = useRef(false)
  const isScratched = Boolean(code && localStorage.getItem(`majisa-scratched-${code}`))
  const [percent, setPercent] = useState(isScratched ? 100 : 0)
  const [revealed, setRevealed] = useState(isScratched)

  useEffect(() => {
    if (isScratched && typeof onDone === 'function') {
      onDone()
    }
  }, [isScratched])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (isScratched) {
      canvas.style.opacity = '0'
      canvas.style.pointerEvents = 'none'
      return
    }
    const card = cardRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = card.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#d8a843')
    gradient.addColorStop(.45, '#f2cf73')
    gradient.addColorStop(1, '#a96d18')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = 'rgba(89,45,12,.16)'
    for (let x = -40; x < rect.width + 40; x += 28) {
      ctx.beginPath(); ctx.arc(x, rect.height * .22, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 14, rect.height * .78, 3, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#4b2810'
    ctx.textAlign = 'center'
    ctx.font = '700 18px DM Sans'
    ctx.fillText('SCRATCH HERE • यहाँ रगड़ो', rect.width / 2, rect.height / 2 + 6)
  }, [isScratched])

  const handleReveal = () => {
    setRevealed(true)
    setPercent(100)
    if (code) {
      localStorage.setItem(`majisa-scratched-${code}`, 'true')
    }
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.transition = 'opacity .7s ease'
      canvas.style.opacity = '0'
      canvas.style.pointerEvents = 'none'
    }
    setTimeout(() => {
      if (typeof onDone === 'function') onDone()
    }, 800)
  }

  const scratch = (event) => {
    if (!isDrawing.current || revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const touch = event.touches?.[0]
    const x = (touch ? touch.clientX : event.clientX) - rect.left
    const y = (touch ? touch.clientY : event.clientY) - rect.top
    const ctx = canvas.getContext('2d')
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x * scaleX, y * scaleY, 28 * scaleX, 0, Math.PI * 2)
    ctx.fill()
    if (Math.random() > .72) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let clear = 0
      for (let i = 3; i < data.length; i += 40) if (data[i] < 30) clear++
      const next = Math.min(100, Math.round(clear / (data.length / 40) * 100))
      setPercent(next)
      if (next >= 40) {
        handleReveal()
      }
    }
  }

  const startScratch = () => { isDrawing.current = true }
  const stopScratch = () => { isDrawing.current = false }

  return (
    <div className="scratch-shell">
      <div className="scratch-progress"><span><Sparkles size={15} /> {revealed ? 'इनाम खुल गया!' : 'इनाम देखने के लिए रगड़ो सा'}</span><b>{revealed ? 100 : percent}%</b></div>
      <div className="scratch-card" ref={cardRef}>
        <div className="prize-content">
          <span className="prize-icon">{reward.type === 'discount' ? <Ticket /> : <Gift />}</span>
          <small>आपका शगुन</small>
          <strong>{reward.label}</strong>
          <p>{reward.detail}</p>
          <code>{code}</code>
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startScratch}
          onMouseUp={stopScratch}
          onMouseLeave={stopScratch}
          onMouseMove={scratch}
          onTouchStart={startScratch}
          onTouchEnd={stopScratch}
          onTouchMove={scratch}
        />
      </div>
    </div>
  )
}

function RewardModal({ reward, code, onClose }) {
  const isAlreadyDone = Boolean(code && localStorage.getItem(`majisa-scratched-${code}`))
  const [done, setDone] = useState(isAlreadyDone)
  return (
    <div className="overlay modal-overlay celebration">
      <div className="reward-modal">
        <button className="modal-close light-close" onClick={onClose}><X /></button>
        <div className="reward-modal-head"><span>पेमेंट सफल <Check /></span><h3>{done ? 'आपका शगुन इनाम' : 'अब शगुन खोलो सा!'}</h3><p>हर payment पर पक्का reward — अगली पधारो के लिए।</p></div>
        <ScratchCard reward={reward} code={code} onDone={() => setDone(true)} />
        {done && <div className="claim-info"><CalendarDays /><p><b>अगली visit पर claim करें</b><br />Counter पर code दिखाएँ • 15 दिन तक valid</p></div>}
        <button className="btn primary full" onClick={onClose}>{done ? 'इनाम संभाल लिया' : 'बाद में scratch करूँगा'}</button>
      </div>
    </div>
  )
}

function ConfirmDialog({ title, message, confirmText = 'हाँ, साफ़ करें (Yes, Clear)', cancelText = 'नहीं, रद्द करें (No, Cancel)', onConfirm, onCancel }) {
  return (
    <div className="overlay modal-overlay" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.75)' }}>
      <div className="checkout-modal" style={{ maxWidth: '440px', textAlign: 'center', padding: '28px 24px', background: '#ffffff', border: '2px solid #d32f2f', borderRadius: '14px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ background: '#ffebee', width: '58px', height: '58px', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 14px auto', color: '#d32f2f', border: '2px solid #ffcdd2' }}>
          <AlertTriangle size={30} />
        </div>
        <h3 style={{ margin: '0 0 10px 0', color: '#1c0e07', fontFamily: 'var(--display)', fontSize: '1.4rem' }}>{title}</h3>
        <p style={{ margin: '0 0 22px 0', fontSize: '0.92rem', color: '#444444', fontFamily: 'var(--devanagari)', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn ghost full"
            onClick={onCancel}
            style={{ border: '1px solid #cccccc', color: '#333333', background: '#f5f5f5', fontWeight: 'bold', padding: '10px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn primary full"
            onClick={onConfirm}
            style={{ background: '#d32f2f', borderColor: '#d32f2f', color: '#ffffff', fontWeight: 'bold', padding: '10px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function CouponVerifier({ coupons = [], setCoupons, onClose, embedded = false, customerOnly = false }) {
  const [query, setQuery] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    let active = true
    const refreshCoupons = async () => {
      try {
        const local = getCoupons()
        let remote = []
        if (hasSupabase) {
          try { remote = await readCoupons() } catch (e) { }
        }
        if (!active) return
        const map = new Map()
          ;[...local, ...remote, ...coupons].forEach(c => {
            if (c && c.code) map.set(c.code.toUpperCase(), c)
          })
        const merged = Array.from(map.values())
        if (merged.length) {
          localStorage.setItem(COUPON_KEY, JSON.stringify(merged))
          if (typeof setCoupons === 'function') setCoupons(merged)
        }
      } catch (error) {
        console.warn('Coupon refresh failed', error.message)
      }
    }
    refreshCoupons()
    return () => {
      active = false
    }
  }, [setCoupons])

  // Merge prop coupons + local coupons to guarantee no coupon is missed
  const mergedCouponsMap = new Map()
    ;[...coupons, ...getCoupons()].forEach(c => {
      if (c && c.code) mergedCouponsMap.set(c.code.toUpperCase(), c)
    })
  const allCouponsList = Array.from(mergedCouponsMap.values()).sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())

  const normalized = query.trim().toUpperCase()
  const coupon = allCouponsList.find(item => {
    if (!normalized) return false
    const codeMatch = item.code.toUpperCase().includes(normalized)
    const phoneMatch = (item.customerPhone || item.mobile || '').replace(/\D/g, '').includes(normalized)
    const nameMatch = (item.customerName || '').toUpperCase().includes(normalized)
    return codeMatch || phoneMatch || nameMatch
  })
  const status = couponStatus(coupon)
  const pendingCoupons = allCouponsList.filter(item => couponStatus(item) === 'valid')

  const markRedeemedCode = async (codeToRedeem) => {
    const targetCode = codeToRedeem || coupon?.code
    if (!targetCode) return
    const cleanCode = targetCode.trim().toUpperCase()
    const targetItem = allCouponsList.find(c => c.code.toUpperCase() === cleanCode)
    const custName = targetItem?.customerName ? `(${targetItem.customerName})` : ''

    const confirmChoice = window.confirm(`क्या आप सचमुच कूपन ${cleanCode} ${custName} को रिडीम (इस्तेमाल किया हुआ) मार्क करना चाहते हैं सा?`)
    if (!confirmChoice) return

    let redeemedAt = new Date().toISOString()
    try {
      redeemedAt = (await markCouponRedeemed(cleanCode)) || redeemedAt
    } catch (error) {
      console.warn('Supabase redeem mark failed', error.message)
    }
    const allLocal = getCoupons()
    const updated = allLocal.map(item => item.code.toUpperCase() === cleanCode ? { ...item, redeemedAt } : item)
    saveCoupons(updated)
    if (typeof setCoupons === 'function') setCoupons(updated)
    const savedReward = JSON.parse(localStorage.getItem('majisa-reward') || 'null')
    if (savedReward?.code?.toUpperCase() === cleanCode) localStorage.removeItem('majisa-reward')
    alert(`🎉 कूपन ${cleanCode} सफलता पूर्वक रिडीम (उपयोग किया हुआ) मार्क हो गया सा!`)
  }

  const markUnredeemedCode = async (codeToUnredeem) => {
    const targetCode = codeToUnredeem || coupon?.code
    if (!targetCode) return
    const cleanCode = targetCode.trim().toUpperCase()
    const targetItem = allCouponsList.find(c => c.code.toUpperCase() === cleanCode)
    const custName = targetItem?.customerName ? `(${targetItem.customerName})` : ''

    const confirmChoice = window.confirm(`क्या आप कूपन ${cleanCode} ${custName} का रिडेम्पशन रद्द करके इसे पुनः सक्रिय (Active) करना चाहते हैं सा?`)
    if (!confirmChoice) return

    try {
      await markCouponUnredeemed(cleanCode)
    } catch (error) {
      console.warn('Supabase unredeem mark failed', error.message)
    }
    const allLocal = getCoupons()
    const updated = allLocal.map(item => item.code.toUpperCase() === cleanCode ? { ...item, redeemedAt: null } : item)
    saveCoupons(updated)
    if (typeof setCoupons === 'function') setCoupons(updated)
    alert(`🎉 कूपन ${cleanCode} सफलता पूर्वक पुनः सक्रिय (Active) हो गया सा!`)
  }

  const executeClearAllCoupons = async () => {
    setShowClearConfirm(false)
    localStorage.setItem(COUPON_KEY, '[]')
    localStorage.removeItem('majisa-reward')
    if (typeof setCoupons === 'function') setCoupons([])
    try {
      await clearAllCouponsSupabase()
    } catch (err) {
      console.warn('Supabase clear coupons failed', err)
    }
  }

  const statusLabel = (st) => {
    if (st === 'valid') return '🟢 सक्रिय (Valid)'
    if (st === 'redeemed') return '✓ रिडीम (Used)'
    return '🔴 एक्सपायर (Expired)'
  }

  const content = (
    <div className={embedded ? 'staff-modal embedded' : 'staff-modal'}>
      {!embedded && <button className="modal-close" onClick={onClose}><X /></button>}
      <div className="checkout-head"><span><Ticket /></span><div><small>{customerOnly ? 'COUPON STATUS' : 'STAFF COUPON CHECK'}</small><h3>{customerOnly ? 'Coupon check karo' : 'Coupon valid hai ya used?'}</h3></div></div>
      <label className="input-label">Customer ka coupon code ya mobile/naam</label>
      <div className="fake-input"><span>MJC</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. PE5M या 8764198342 या Nitesh" aria-label="Coupon code" /></div>
      {normalized && (
        <div className={`coupon-result ${status}`}>
          {coupon ? (
            <>
              <div>
                <b>{coupon.code} {coupon.customerName ? `(${coupon.customerName})` : ''}</b>
                <span>{coupon.reward?.label}</span>
              </div>
              <p>{coupon.reward?.detail}</p>
              {!customerOnly && <small>Customer: {coupon.customerPhone ? `+91 ${coupon.customerPhone}` : 'N/A'} • Valid till {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</small>}
              {customerOnly && <small>Valid till {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</small>}
              {status === 'valid' && !customerOnly && <button className="btn primary full" onClick={() => markRedeemedCode(coupon.code)}>Redeem mark karo (✓ रिडीम करें)</button>}
              {status === 'redeemed' && !customerOnly && (
                <div style={{ marginTop: '8px' }}>
                  <em style={{ color: '#2e7d32', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>✓ Already redeemed on {new Date(coupon.redeemedAt).toLocaleString('en-IN')}</em>
                  <button className="btn outline full" style={{ borderColor: '#e65100', color: '#e65100', padding: '6px' }} onClick={() => markUnredeemedCode(coupon.code)}>
                    ↩️ गलती से रिडीम हुआ? (अन-रिडीम / री-एक्टिव करें)
                  </button>
                </div>
              )}
              {status === 'redeemed' && customerOnly && <em style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Already redeemed on {new Date(coupon.redeemedAt).toLocaleString('en-IN')}</em>}
              {status === 'expired' && <em style={{ color: '#c62828' }}>⚠️ Coupon expire ho chuka hai</em>}
            </>
          ) : (
            <><b>Invalid code</b><p>Ye coupon code record me nahi mila. Code dobara check karo.</p></>
          )}
        </div>
      )}
      {!customerOnly && (
        <div className="recent-coupons" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: 'var(--ink)', fontSize: '1.05rem', fontFamily: 'var(--display)' }}>
              Pending coupons <small style={{ color: 'var(--rust)', fontWeight: 'bold' }}>({pendingCoupons.length})</small>
            </h4>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Clear All Coupons (Reset Database)
            </button>
          </div>

          {pendingCoupons.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {pendingCoupons.map(item => (
                <div
                  key={item.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#fffcf7',
                    border: '2px dashed var(--rust)',
                    borderRadius: '8px',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.92rem', color: 'var(--rust)', display: 'block' }}>
                      {item.code} {item.customerName ? `(${item.customerName})` : ''}
                    </span>
                    <small style={{ fontSize: '0.75rem', color: '#666' }}>
                      {item.reward?.label} {item.customerPhone ? `• +91 ${item.customerPhone}` : ''}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => markRedeemedCode(item.code)}
                    style={{ width: 'auto', flexShrink: 0, background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ✓ रिडीम करें
                  </button>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: '0.84rem', color: '#777', margin: '8px 0 16px 0', fontFamily: 'var(--devanagari)' }}>अभी कोई पेंडिंग कूपन नहीं है सा।</p>}

          <h4 style={{ margin: '14px 0 10px 0', color: 'var(--ink)', fontSize: '1.05rem', fontFamily: 'var(--display)' }}>
            All coupon records ({allCouponsList.length})
          </h4>
          {allCouponsList.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {allCouponsList.map(item => {
                const st = couponStatus(item)
                const isPending = st === 'valid'
                const isRedeemed = st === 'redeemed'
                return (
                  <div
                    key={item.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2d5c3',
                      borderRadius: '8px',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1c0e07', display: 'block' }}>
                        {item.code} {item.customerName ? `(${item.customerName})` : ''}
                      </span>
                      <small style={{ fontSize: '0.74rem', color: '#666' }}>
                        {item.reward?.label} {item.customerPhone ? `• +91 ${item.customerPhone}` : ''}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: isPending ? '#e8f5e9' : isRedeemed ? '#e3f2fd' : '#ffebee',
                        color: isPending ? '#2e7d32' : isRedeemed ? '#1565c0' : '#c62828',
                        border: isPending ? '1px solid #a5d6a7' : isRedeemed ? '1px solid #90caf9' : '1px solid #ef9a9a'
                      }}>
                        {statusLabel(st)}
                      </span>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => markRedeemedCode(item.code)}
                          style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✓ रिडीम
                        </button>
                      )}
                      {isRedeemed && (
                        <button
                          type="button"
                          onClick={() => markUnredeemedCode(item.code)}
                          style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', padding: '5px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer' }}
                          title="गलती से रिडीम हुआ तो वापस एक्टिव करें"
                        >
                          ↩️ अन-रिडीम
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ fontSize: '0.84rem', color: '#777', fontFamily: 'var(--devanagari)' }}>अभी कोई कूपन रिकॉर्ड नहीं है सा।</p>}
        </div>
      )}
      <small className="info-note">{customerOnly ? 'कूपन का उपयोग रिडेम्पशन काउंटर पर स्टाफ द्वारा किया जाएगा।' : 'कूपन मार्क करते ही कूपन उपयोग किया हुआ माना जाएगा (वैधता 15 दिन)।'}</small>
    </div>
  )

  return (
    <>
      {showClearConfirm && (
        <ConfirmDialog
          title="⚠️ डेटा डिलीट सुरक्षा चेतावनी"
          message="क्या आप सचमुच सभी कूपन (स्थानीय व सुपाबेस डेटाबेस) से हमेशा के लिए साफ़ करना चाहते हैं सा? यह प्रक्रिया वापस नहीं होगी।"
          confirmText="हाँ, सब डिलीट करें (Yes Clear All)"
          cancelText="नहीं, रद्द करें (No, Cancel)"
          onConfirm={executeClearAllCoupons}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {embedded ? content : (
        <div className="overlay modal-overlay">
          {content}
        </div>
      )}
    </>
  )
}

const blankItem = { name: '', latin: '', desc: '', price: '', cat: 'मारवाड़ी', tag: '', image: '', veg: true }

const HINDI_FOOD_NAMES = {
  'dal baati churma': 'दाल बाटी चूरमा',
  'gatte ki sabzi': 'गट्टे की सब्ज़ी',
  'ker sangri': 'केर सांगरी',
  'ker sangri thali': 'केर सांगरी थाली',
  'bajra roti': 'बाजरे की रोटी',
  'bajra khichdi': 'बाजरे की खिचड़ी',
  'angara paneer tikka': 'अंगारा पनीर टिक्का',
  'paneer tikka': 'पनीर टिक्का',
  'chilli paneer': 'चिली पनीर',
  'hakka noodles': 'हक्का नूडल्स',
  'desi hakka noodles': 'देसी हक्का नूडल्स',
  'cold coffee': 'कोल्ड कॉफी',
  'mocktail': 'मॉकटेल',
  'lassi': 'लस्सी',
  'kesar kulhad lassi': 'केसर कुल्हड़ लस्सी',
  'ghevar': 'घेवर',
  'ghevar rabdi': 'घेवर रबड़ी',
  'malpua': 'मालपुआ',
  'roti': 'रोटी',
  'tandoori roti': 'तंदूरी रोटी',
  'butter roti': 'बटर रोटी',
  'naan': 'नान',
  'butter naan': 'बटर नान',
  'tanduri': 'तंदूरी',
  'tandoori': 'तंदूरी',
  'tanduri roti': 'तंदूरी रोटी',
  'paneer butter masala': 'पनीर बटर मसाला',
  'sev tamatar': 'सेव टमाटर',
  'masala dosa': 'मसाला डोसा',
}

const HINDI_CATEGORY_NAMES = {
  marwadi: 'मारवाड़ी',
  rajasthani: 'राजस्थानी',
  roti: 'रोटी',
  sabji: 'सब्जी',
  sabzi: 'सब्जी',
  vegetable: 'सब्जी',
  tandoor: 'तंदूर',
  tandoori: 'तंदूर',
  chinese: 'चाइनीज़',
  drinks: 'पेय',
  drink: 'पेय',
  beverage: 'पेय',
  mithai: 'मीठा',
  sweet: 'मीठा',
  dessert: 'मीठा',
}

function normalizeEnglish(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function transliterateRomanToHindi(text) {
  const words = normalizeEnglish(text).split(' ').filter(Boolean)
  const vowels = { a: 'अ', aa: 'आ', i: 'इ', ee: 'ई', u: 'उ', oo: 'ऊ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' }
  const matras = { a: '', aa: 'ा', i: 'ि', ee: 'ी', u: 'ु', oo: 'ू', e: 'े', ai: 'ै', o: 'ो', au: 'ौ' }
  const consonants = {
    kh: 'ख', gh: 'घ', chh: 'छ', ch: 'च', jh: 'झ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ',
    sh: 'श', k: 'क', g: 'ग', c: 'क', j: 'ज', t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब',
    m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', h: 'ह', f: 'फ', z: 'ज'
  }
  const vowelKeys = ['aa', 'ee', 'oo', 'ai', 'au', 'a', 'i', 'u', 'e', 'o']
  const consKeys = ['chh', 'kh', 'gh', 'jh', 'th', 'dh', 'ph', 'bh', 'sh', 'ch', 'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'b', 'm', 'y', 'r', 'l', 'v', 'w', 's', 'h', 'f', 'z']

  const convertWord = (word) => {
    let out = ''
    let i = 0
    while (i < word.length) {
      const vowel = vowelKeys.find(key => word.startsWith(key, i))
      if (vowel) {
        out += vowels[vowel]
        i += vowel.length
        continue
      }

      const cons = consKeys.find(key => word.startsWith(key, i))
      if (cons) {
        const nextIndex = i + cons.length
        const nextVowel = vowelKeys.find(key => word.startsWith(key, nextIndex))
        out += consonants[cons]
        if (nextVowel) {
          out += matras[nextVowel]
          i = nextIndex + nextVowel.length
        } else {
          out += '्'
          i = nextIndex
        }
        continue
      }

      out += word[i]
      i += 1
    }
    return out.replace(/्$/g, '')
  }

  return words.map(convertWord).join(' ')
}

function suggestHindiName(text) {
  const key = normalizeEnglish(text)
  return HINDI_FOOD_NAMES[key] || transliterateRomanToHindi(text)
}

function suggestHindiCategory(text) {
  const key = normalizeEnglish(text)
  return HINDI_CATEGORY_NAMES[key] || transliterateRomanToHindi(text)
}

function MediaManager({ media, setMedia }) {
  const [uploading, setUploading] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadStatus, setUploadStatus] = useState({})

  const updateMedia = (next) => {
    saveMedia(next)
    setMedia(next)
  }
  const updateHome = (key, value) => updateMedia({ ...media, [key]: value })
  const updateSlot = (id, patch) => updateMedia({ ...media, gallery: media.gallery.map(slot => slot.id === id ? { ...slot, ...patch } : slot) })

  const [cNameInput, setCNameInput] = useState(() => localStorage.getItem('majisa-cloudinary-name') || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'majisa-cafe-dilip')
  const [cPresetInput, setCPresetInput] = useState(() => localStorage.getItem('majisa-cloudinary-preset') || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'majisa-cafe')

  const cloudName = cNameInput.trim() || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || localStorage.getItem('majisa-cloudinary-name') || 'majisa-cafe-dilip'
  const uploadPreset = cPresetInput.trim() || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || localStorage.getItem('majisa-cloudinary-preset') || 'majisa-cafe'

  const saveCloudinarySettings = () => {
    localStorage.setItem('majisa-cloudinary-name', cNameInput.trim())
    localStorage.setItem('majisa-cloudinary-preset', cPresetInput.trim())
    writeAppState('cloudinary_config', { cloudName: cNameInput.trim(), uploadPreset: cPresetInput.trim() }).catch(() => { })
    alert('Cloudinary सेटिंग्स सेव हो गईं सा! (Cloudinary Settings Saved Successfully!)')
  }

  const uploadHomeImage = async (key, file) => {
    if (!file) return
    setUploading(prev => ({ ...prev, [key]: true }))
    setUploadProgress(prev => ({ ...prev, [key]: 5 }))
    setUploadStatus(prev => ({ ...prev, [key]: 'loading' }))
    try {
      let dataUrl
      if (cloudName && uploadPreset) {
        dataUrl = await uploadToCloudinary({
          file,
          cloudName,
          uploadPreset,
          onProgress: (pct) => setUploadProgress(prev => ({ ...prev, [key]: pct }))
        })
      } else {
        dataUrl = await compressImage(file, 1920, 1920, 0.82, (pct) => {
          setUploadProgress(prev => ({ ...prev, [key]: pct }))
        })
      }
      updateHome(key, dataUrl)
      setUploadStatus(prev => ({ ...prev, [key]: 'success' }))
      setTimeout(() => {
        setUploadProgress(prev => { const n = { ...prev }; delete n[key]; return n })
        setUploadStatus(prev => { const n = { ...prev }; delete n[key]; return n })
      }, 3500)
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }))
      console.error('Home image upload failed:', error)
      alert(`अपलोड फ़ेल हो गया: ${error.message}`)
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }))
    }
  }

  const uploadGalleryFile = async (slot, file) => {
    if (!file) return
    if (!cloudName && file.type.startsWith('video/') && file.size > 15 * 1024 * 1024) {
      alert(`वीडियो फ़ाइल बहुत बड़ी है (${(file.size / 1024 / 1024).toFixed(1)}MB)! कृपया Cloudinary क्रेडेंशियल्स डालें या 15MB से छोटा वीडियो अपलोड करें।`)
      return
    }
    setUploading(prev => ({ ...prev, [slot.id]: true }))
    setUploadProgress(prev => ({ ...prev, [slot.id]: 5 }))
    setUploadStatus(prev => ({ ...prev, [slot.id]: 'loading' }))
    try {
      let dataUrl
      if (cloudName && uploadPreset) {
        dataUrl = await uploadToCloudinary({
          file,
          cloudName,
          uploadPreset,
          onProgress: (pct) => setUploadProgress(prev => ({ ...prev, [slot.id]: pct }))
        })
      } else {
        dataUrl = await compressImage(file, 1920, 1920, 0.82, (pct) => {
          setUploadProgress(prev => ({ ...prev, [slot.id]: pct }))
        })
      }
      updateSlot(slot.id, { src: dataUrl, type: file.type.startsWith('video/') ? 'video' : 'image', visible: true })
      setUploadStatus(prev => ({ ...prev, [slot.id]: 'success' }))
      setTimeout(() => {
        setUploadProgress(prev => { const n = { ...prev }; delete n[slot.id]; return n })
        setUploadStatus(prev => { const n = { ...prev }; delete n[slot.id]; return n })
      }, 3500)
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [slot.id]: 'error' }))
      console.error('Gallery file upload failed:', error)
      alert(`अपलोड फ़ेल हो गया: ${error.message}`)
    } finally {
      setUploading(prev => ({ ...prev, [slot.id]: false }))
    }
  }

  const resetSlot = (slot) => updateSlot(slot.id, DEFAULT_MEDIA.gallery.find(item => item.id === slot.id))

  return (
    <div className="media-manager">
      <div className="media-heading">
        <div><h3>Website media manage</h3><p>Menu images alag hain. Yahan sirf homepage, story aur gallery ki image/video badlo.</p></div>
        <button onClick={() => updateMedia(DEFAULT_MEDIA)}>Reset all media</button>
      </div>

      <div className="media-section" style={{ background: 'rgba(216, 168, 67, 0.08)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(216, 168, 67, 0.25)' }}>
        <h4 style={{ margin: '0 0 6px 0', color: 'var(--marigold)' }}>☁️ Cloudinary Direct Upload Config</h4>
        <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '0 0 12px 0' }}>अनलिमिटेड HD वीडियो और फ़ोटो अपलोड के लिए अपना Cloud Name और Upload Preset सेव करें:</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginBottom: '4px' }}>Cloud Name</small>
            <input value={cNameInput} onChange={e => setCNameInput(e.target.value)} placeholder="e.g. majisa-cafe-dilip" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#1c1712', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginBottom: '4px' }}>Upload Preset Name</small>
            <input value={cPresetInput} onChange={e => setCPresetInput(e.target.value)} placeholder="majisa-cafe" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#1c1712', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <button className="btn primary" onClick={saveCloudinarySettings} style={{ alignSelf: 'flex-end', padding: '9px 18px', fontSize: '0.85rem' }}>
            सेटिंग्स सेव करें
          </button>
        </div>
      </div>

      <div className="media-section">
        <h4>Homepage images</h4>
        <div className="media-grid home-media-grid">
          {[['heroImage', 'Hero background'], ['storyImage', 'Story / thali image']].map(([key, label]) => (
            <article className="media-card" key={key}>
              <div className="media-preview">
                {uploadProgress[key] !== undefined ? (
                  <div className="upload-loader-overlay" style={{ background: 'rgba(15, 10, 5, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                    {uploadStatus[key] === 'success' ? (
                      <div style={{ background: '#2e7d32', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        ✅ 100% अपलोड सफल!
                      </div>
                    ) : uploadStatus[key] === 'error' ? (
                      <div style={{ background: '#d32f2f', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        ❌ अपलोड फ़ेल हो गया
                      </div>
                    ) : (
                      <>
                        <Loader2 className="spinner" size={24} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--marigold)' }} />
                        <b style={{ fontSize: '1.1rem', color: 'var(--marigold)', marginTop: '4px' }}>{uploadProgress[key]}%</b>
                        <div style={{ width: '85%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ width: `${uploadProgress[key]}%`, height: '100%', background: 'linear-gradient(90deg, #f2cf73, #d8a843)', transition: 'width 0.15s linear' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--devanagari)', color: '#fff', marginTop: '4px' }}>अपलोड हो रहा है...</span>
                      </>
                    )}
                  </div>
                ) : (
                  <img src={media[key] || DEFAULT_MEDIA[key]} alt={label} />
                )}
              </div>
              <b>{label}</b>
              <input value={media[key] || ''} onChange={e => updateHome(key, e.target.value)} placeholder="Image URL paste karo" />
              <label className="media-upload" style={uploading[key] ? { opacity: 0.7, pointerEvents: 'none' } : undefined}>
                {uploadStatus[key] === 'success' ? (
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ 100% अपलोड सफल</span>
                ) : uploadProgress[key] !== undefined ? (
                  <span style={{ color: 'var(--marigold)', fontWeight: 'bold' }}>⏳ {uploadProgress[key]}% अपलोड हो रहा है...</span>
                ) : (
                  "Image upload"
                )}
                <input type="file" accept="image/*" disabled={uploading[key]} onChange={e => uploadHomeImage(key, e.target.files?.[0])} />
              </label>
              <button className="media-reset" onClick={() => updateHome(key, DEFAULT_MEDIA[key])}>Default restore</button>
            </article>
          ))}
        </div>
      </div>
      <div className="media-section">
        <h4>Gallery images & videos</h4>
        <div className="media-grid">
          {media.gallery.map(slot => (
            <article className={`media-card ${slot.visible ? '' : 'is-hidden'}`} key={slot.id}>
              <div className={`media-preview ${slot.type === 'atlas' ? `image-tile atlas-${slot.atlas || 0}` : ''}`}>
                {uploadProgress[slot.id] !== undefined ? (
                  <div className="upload-loader-overlay" style={{ background: 'rgba(15, 10, 5, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                    {uploadStatus[slot.id] === 'success' ? (
                      <div style={{ background: '#2e7d32', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        ✅ 100% अपलोड सफल!
                      </div>
                    ) : uploadStatus[slot.id] === 'error' ? (
                      <div style={{ background: '#d32f2f', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        ❌ अपलोड फ़ेल हो गया
                      </div>
                    ) : (
                      <>
                        <Loader2 className="spinner" size={24} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--marigold)' }} />
                        <b style={{ fontSize: '1.1rem', color: 'var(--marigold)', marginTop: '4px' }}>{uploadProgress[slot.id]}%</b>
                        <div style={{ width: '85%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ width: `${uploadProgress[slot.id]}%`, height: '100%', background: 'linear-gradient(90deg, #f2cf73, #d8a843)', transition: 'width 0.15s linear' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--devanagari)', color: '#fff', marginTop: '4px' }}>अपलोड हो रहा है...</span>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {slot.type === 'video' && <video src={slot.src} muted playsInline />}
                    {slot.type === 'image' && <img src={slot.src} alt={slot.label} />}
                  </>
                )}
              </div>
              <div className="media-slot-head"><b>{slot.label}</b><span>{slot.visible ? 'Visible' : 'Hidden'}</span></div>
              <input value={slot.caption || ''} onChange={e => updateSlot(slot.id, { caption: e.target.value })} placeholder="Caption" />
              <input value={slot.src || ''} onChange={e => updateSlot(slot.id, { src: e.target.value, type: e.target.value ? (slot.type === 'video' ? 'video' : 'image') : slot.type })} placeholder="Image/video URL paste karo" />
              <label className="media-upload" style={uploading[slot.id] ? { opacity: 0.7, pointerEvents: 'none' } : undefined}>
                {uploadStatus[slot.id] === 'success' ? (
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ 100% अपलोड सफल</span>
                ) : uploadProgress[slot.id] !== undefined ? (
                  <span style={{ color: 'var(--marigold)', fontWeight: 'bold' }}>⏳ {uploadProgress[slot.id]}% अपलोड हो रहा है...</span>
                ) : (
                  "Image / video upload"
                )}
                <input type="file" accept="image/*,video/*" disabled={uploading[slot.id]} onChange={e => uploadGalleryFile(slot, e.target.files?.[0])} />
              </label>
              <div className="media-actions">
                <button onClick={() => updateSlot(slot.id, { visible: !slot.visible })}>{slot.visible ? 'Hide' : 'Show'}</button>
                <button className="media-reset" onClick={() => resetSlot(slot)}>Restore</button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p className="media-note">नोट: वेबसाइट मीडिया फ़ाइलें सुरक्षित सेव होती हैं। HD वीडियो व फ़ोटो अपलोड के लिए Cloudinary क्रेडेंशियल्स डालें सा।</p>
    </div>
  )
}

function AdminGalleryPanel({ galleryItems, setGalleryItems }) {
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('व्यंजन')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [filterCategory, setFilterCategory] = useState('all')
  const [previewItem, setPreviewItem] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || localStorage.getItem('majisa-cloudinary-name') || 'majisa-cafe-dilip'
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || localStorage.getItem('majisa-cloudinary-preset') || 'majisa-cafe'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)

    if (!title) {
      const cleanName = selectedFile.name.replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mov|avi|mkv|webm)$/i, '')
      setTitle(cleanName)
    }
  }

  const clearSelectedFile = () => {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    const fileInput = document.getElementById('gallery-file-input')
    if (fileInput) fileInput.value = ''
  }

  const handleUpload = async () => {
    if (!file) {
      alert("कृपया अपलोड करने के लिए फ़ाइल चुनें। (Please choose a file to upload.)")
      return
    }
    setUploading(true)
    setUploadProgress(5)
    try {
      let fileUrl
      if (cloudName && uploadPreset) {
        fileUrl = await uploadToCloudinary({
          file,
          cloudName,
          uploadPreset,
          onProgress: (pct) => setUploadProgress(pct)
        })
      } else {
        fileUrl = await compressImage(file, 1920, 1920, 0.82, (pct) => setUploadProgress(pct))
      }

      const rawTitle = title.trim() || file.name
      const cleanTitle = rawTitle.replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mov|avi|mkv|webm)$/i, '')

      const newItem = {
        id: `GAL-${Date.now()}`,
        title: cleanTitle,
        caption: caption.trim(),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        category,
        src: fileUrl,
        created_at: new Date().toISOString()
      }

      const updated = [newItem, ...galleryItems]
      saveGallery(updated)
      setGalleryItems(updated)

      setTitle('')
      setCaption('')
      clearSelectedFile()

      alert("गैलरी आइटम Cloudinary पर सफलतापूर्वक अपलोड और सेव हो गया! 🎉")
    } catch (error) {
      alert(`अपलोड फ़ेल हो गया: ${error.message}`)
      console.error(error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteItem = (id) => {
    if (confirm("क्या आप इस आइटम को गैलरी से हटाना चाहते हैं?")) {
      const updated = galleryItems.filter(item => item.id !== id)
      saveGallery(updated)
      setGalleryItems(updated)
      if (previewItem?.id === id) setPreviewItem(null)
    }
  }

  const handleCopyLink = (url, id) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const cleanDisplayTitle = (itemTitle) => {
    if (!itemTitle) return 'Gallery Item'
    return itemTitle.replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mov|avi|mkv|webm)$/i, '')
  }

  const filteredGallery = galleryItems.filter(item => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'video') return item.type === 'video'
    return item.category === filterCategory
  })

  return (
    <div className="admin-grid" style={{ gridTemplateColumns: '340px 1fr' }}>
      {/* Upload Card */}
      <div className="admin-card" style={{ height: 'fit-content' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px 0' }}>
          <UploadCloud size={20} style={{ color: 'var(--marigold)' }} />
          Add Gallery Item
        </h3>
        <p className="bill-help" style={{ marginBottom: 16 }}>
          बड़ी HD फ़ोटो व Reels सीधे Cloudinary क्लाउड पर अपलोड होंगी।
        </p>

        <div className="admin-form">
          {/* File Picker with Live Preview */}
          {file && previewUrl ? (
            <div className="admin-preview-container">
              {file.type.startsWith('video/') ? (
                <video src={previewUrl} className="admin-preview-media" controls autoPlay muted loop />
              ) : (
                <img src={previewUrl} alt="Preview" className="admin-preview-media" />
              )}
              <div style={{ padding: '8px 12px', background: '#25160d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, paddingRight: 8 }}>
                  <b style={{ color: '#fff', fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </b>
                  <small style={{ color: 'var(--marigold)', fontSize: '0.7rem' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.startsWith('video/') ? '🎥 Video Reel' : '📷 Image'}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={uploading}
                  style={{ background: '#442217', color: '#ff8a75', border: '1px solid #663322', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="admin-file-picker-dropzone">
              <input
                id="gallery-file-input"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadCloud size={32} style={{ color: 'var(--saffron)', marginBottom: 6 }} />
              <b style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>Photo / Video Select Karen</b>
              <small style={{ fontSize: '0.75rem', color: '#886852', marginTop: 4 }}>
                Click to browse files (JPEG, PNG, MP4, WebM)
              </small>
            </label>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: 4, color: '#553c2a' }}>
              Item Title / Naam
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Special Marwadi Thali"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: 4, color: '#553c2a' }}>
              Category / Shreni
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="व्यंजन">व्यंजन (Food)</option>
              <option value="माहौल">माहौल (Ambience)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: 4, color: '#553c2a' }}>
              Caption / Description (Optional)
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Desi ghee baati with churma..."
              rows={2}
            />
          </div>

          {uploading && (
            <div style={{ margin: '8px 0', padding: 10, background: '#fff5e0', borderRadius: 8, border: '1px solid #fce3b3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--rust)', marginBottom: 6 }}>
                <span>Cloudinary Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#e8d5c0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--saffron), var(--rust))', transition: 'width 0.2s linear' }} />
              </div>
            </div>
          )}

          <button
            className="btn primary full"
            onClick={handleUpload}
            disabled={uploading || !file}
            style={{ marginTop: 8 }}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: 6, display: 'inline' }} />
                Cloudinary Upload ({uploadProgress}%)...
              </>
            ) : (
              "Upload to Cloudinary Gallery"
            )}
          </button>
        </div>
      </div>

      {/* Gallery Items Display */}
      <div className="admin-card">
        <div className="admin-card-head" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px dashed #e5d8c8', paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Gallery Items ({galleryItems.length})</h3>
            <small style={{ color: '#886852', fontSize: '0.75rem' }}>Upload kiye gaye sabhi photo aur video reels</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, fontSize: '0.8rem', border: '1px solid var(--line)' }}
            >
              <option value="all">Sabhi ({galleryItems.length})</option>
              <option value="व्यंजन">व्यंजन (Food)</option>
              <option value="माहौल">माहौल (Ambience)</option>
              <option value="video">🎥 Reels / Videos</option>
            </select>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: '#f3e8d7', padding: 2, borderRadius: 6, border: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '4px 8px', border: 0, borderRadius: 4, cursor: 'pointer',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--rust)' : '#7a5c48',
                  boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}
                title="Grid View"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 8px', border: 0, borderRadius: 4, cursor: 'pointer',
                  background: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? 'var(--rust)' : '#7a5c48',
                  boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div style={{ marginTop: 16 }}>
          {!filteredGallery.length ? (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              गैलरी में अभी कोई फोटो या वीडियो नहीं है। बाएं पैनल से नया मीडिया अपलोड करें सा!
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="admin-gallery-grid">
              {filteredGallery.map(item => {
                const displayTitle = cleanDisplayTitle(item.title)
                return (
                  <div className="admin-gallery-card" key={item.id}>
                    <div className="admin-gallery-thumb-box" onClick={() => setPreviewItem(item)}>
                      {item.type === 'video' ? (
                        <>
                          <video src={item.src} muted playsInline style={{ pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'grid', placeItems: 'center' }}>
                            <Play size={28} fill="white" color="white" />
                          </div>
                        </>
                      ) : (
                        <img src={item.src} alt={displayTitle} loading="lazy" />
                      )}

                      <span className="admin-gallery-badge category">{item.category}</span>
                      <span className="admin-gallery-badge type">
                        {item.type === 'video' ? '🎥 Reel' : '📷 Photo'}
                      </span>
                    </div>

                    <div className="admin-gallery-card-body">
                      <h4 className="admin-gallery-card-title">{displayTitle}</h4>
                      {item.caption && <p className="admin-gallery-card-caption">{item.caption}</p>}
                    </div>

                    <div className="admin-gallery-card-footer">
                      <button
                        type="button"
                        className="admin-gallery-btn"
                        onClick={() => setPreviewItem(item)}
                        title="Full View"
                      >
                        <Eye size={13} /> View
                      </button>

                      <button
                        type="button"
                        className="admin-gallery-btn"
                        onClick={() => handleCopyLink(item.src, item.id)}
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <CheckCircle size={13} color="#2e7d32" /> : <Copy size={13} />}
                        {copiedId === item.id ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        type="button"
                        className="admin-gallery-btn delete"
                        onClick={() => deleteItem(item.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="admin-list">
              {filteredGallery.map(item => {
                const displayTitle = cleanDisplayTitle(item.title)
                return (
                  <div className="admin-item" key={item.id} style={{ gridTemplateColumns: '80px 1fr auto auto auto' }}>
                    <div
                      className="media-preview"
                      onClick={() => setPreviewItem(item)}
                      style={{ height: 60, width: 80, borderRadius: 8, background: '#1c0e07', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                    >
                      {item.type === 'video' ? (
                        <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#26140b', color: 'var(--marigold)' }}>
                          <Play size={18} fill="currentColor" />
                        </div>
                      ) : (
                        <img src={item.src} alt={displayTitle} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, paddingLeft: 6 }}>
                      <b style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{displayTitle}</b>
                      <span style={{ fontSize: '0.75rem', display: 'block', color: '#886852' }}>{item.category} • {item.type === 'video' ? '🎥 Video Reel' : '📷 Photo'}</span>
                      <small style={{ fontSize: '0.65rem', display: 'block', color: '#907060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.src}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      style={{ padding: '6px 10px', background: '#f5ea98', color: '#553c2a', border: '1px solid #dcd080', borderRadius: 6 }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.src, item.id)}
                      style={{ padding: '6px 10px', background: '#fff', color: '#553c2a', border: '1px solid #d5c8b5', borderRadius: 6 }}
                    >
                      {copiedId === item.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      style={{ padding: '6px 10px', background: 'var(--rust)', color: 'white', border: 0, borderRadius: 6 }}
                    >
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Admin Lightbox Preview Modal */}
      {previewItem && (
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewItem(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '800px', width: '100%', background: '#1c120c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, overflow: 'hidden', color: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          >
            <button
              onClick={() => setPreviewItem(null)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: 0, color: 'white', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <X size={20} />
            </button>

            <div style={{ width: '100%', maxHeight: '550px', background: '#000', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {previewItem.type === 'video' ? (
                <video src={previewItem.src} controls autoPlay style={{ width: '100%', maxHeight: '550px', objectFit: 'contain' }} />
              ) : (
                <img src={previewItem.src} alt={previewItem.title} style={{ width: '100%', maxHeight: '550px', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--display)', color: 'var(--marigold)' }}>
                  {cleanDisplayTitle(previewItem.title)}
                </h3>
                {previewItem.caption && <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>{previewItem.caption}</p>}
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4, display: 'inline-block' }}>
                  {previewItem.category} • {previewItem.type === 'video' ? '🎥 Reel' : '📷 Image'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleCopyLink(previewItem.src, previewItem.id)}
                  className="btn outline"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  {copiedId === previewItem.id ? '✅ URL Copied' : '📋 Copy URL'}
                </button>
                <button
                  onClick={() => deleteItem(previewItem.id)}
                  className="btn primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', background: '#d32f2f', border: 0 }}
                >
                  🗑️ Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminCustomerDetailModal({ customer, orders = [], bills = [], coupons = [], setCoupons, menu = [], onClose }) {
  if (!customer) return null

  const targetPhone = (customer.phone || '').replace(/\D/g, '').slice(-10)
  const targetName = (customer.name || '').trim().toLowerCase()
  const [activeSubTab, setActiveSubTab] = useState('coupons')

  // Match coupons for this customer
  const customerCoupons = coupons.filter(c => {
    const cPhone = (c.customerPhone || c.mobile || '').replace(/\D/g, '').slice(-10)
    const cName = (c.customerName || '').trim().toLowerCase()
    if (targetPhone && cPhone && cPhone === targetPhone) return true
    if (targetName && targetName.length >= 2 && cName && cName === targetName) return true
    return false
  })

  // Match orders for this customer
  const customerOrders = orders.filter(o => {
    const oPhone = (o.mobile || '').replace(/\D/g, '').slice(-10)
    const oName = (o.name || '').trim().toLowerCase()
    if (targetPhone && oPhone && oPhone === targetPhone) return true
    if (targetName && targetName.length >= 2 && oName && oName === targetName) return true
    return false
  }).map(o => ({
    type: 'order',
    id: o.id,
    amount: o.amount,
    date: o.created,
    status: o.status,
    diningOption: o.diningOption,
    items: o.items || [],
    ref: o.upiRef,
    paymentMode: o.paymentMode || 'online',
    coupon: o.coupon
  }))

  // Match bills for this customer
  const customerBills = bills.filter(b => {
    const bPhone = (b.mobile || b.customer_phone || b.customerPhone || '').replace(/\D/g, '').slice(-10)
    const bName = (b.customerName || b.name || '').trim().toLowerCase()
    if (targetPhone && bPhone && bPhone === targetPhone) return true
    if (targetName && targetName.length >= 2 && bName && bName === targetName) return true
    return false
  }).map(b => ({
    type: 'bill',
    id: b.id,
    amount: b.amount,
    date: b.created || b.submittedAt,
    status: b.status === 'rewarded' ? 'completed' : b.status === 'submitted' ? 'accepted' : 'pending',
    diningOption: null,
    items: [],
    ref: b.upiRef,
    paymentMode: 'counter',
    couponCode: b.couponCode
  }))

  const customerHistory = [...customerOrders, ...customerBills].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  const handleIssueCoupon = () => {
    const reward = pickReward(menu)
    const code = `MJC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const created = new Date().toISOString()
    const expiresAt = new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const newCoupon = {
      reward,
      code,
      created,
      expiresAt,
      amount: customer.totalSpend || 350,
      mobile: targetPhone,
      customerPhone: targetPhone,
      customerName: customer.name || 'Valued Customer',
      upiRef: 'ADMIN_SPECIAL_GIFT',
      redeemedAt: null
    }

    const updatedCoupons = [newCoupon, ...coupons]
    saveCoupons(updatedCoupons)
    if (typeof setCoupons === 'function') setCoupons(updatedCoupons)
    alert(`🎉 ग्राहक ${customer.name} (+91 ${targetPhone}) के लिए नया कूपन ${code} (${reward.label}) सफलतापूर्वक जारी हो गया सा!`)
  }

  return (
    <div className="overlay modal-overlay" style={{ zIndex: 1100 }}>
      <div className="checkout-modal" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X /></button>

        {/* Customer Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px dashed #e0d5c5', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--rust)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', flexShrink: 0 }}>
            {(customer.name || 'G')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--devanagari)', color: 'var(--ink)', fontSize: '1.25rem' }}>{customer.name}</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
              <a href={`tel:+91${customer.phone}`} style={{ color: 'var(--rust)', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'none' }}>
                📱 +91 {customer.phone}
              </a>
              <a href={`https://wa.me/91${customer.phone}`} target="_blank" rel="noreferrer" style={{ background: '#2e7d32', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 'bold' }}>
                💬 WhatsApp Message
              </a>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: '#fffcf7', border: '1px solid #f0e1c2', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <small style={{ color: '#777', fontSize: '0.74rem', display: 'block' }}>कुल ट्रांजेक्शन</small>
            <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{customerHistory.length} ऑर्डर/बिल</strong>
          </div>
          <div style={{ background: '#f1f8e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <small style={{ color: '#555', fontSize: '0.74rem', display: 'block' }}>जारी कूपन</small>
            <strong style={{ fontSize: '1.05rem', color: '#2e7d32' }}>{customerCoupons.length} कूपन</strong>
          </div>
          <div style={{ background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <small style={{ color: '#555', fontSize: '0.74rem', display: 'block' }}>कुल बिल भुगतान</small>
            <strong style={{ fontSize: '1.05rem', color: '#c62828' }}>₹{customer.totalSpend || 0}</strong>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="account-tabs" style={{ marginBottom: '14px' }}>
          <button
            type="button"
            className={`account-tab-btn ${activeSubTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('coupons')}
          >
            🎟️ ग्राहक कूपन्स ({customerCoupons.length})
          </button>
          <button
            type="button"
            className={`account-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('history')}
          >
            📜 लेन-देन इतिहास ({customerHistory.length})
          </button>
        </div>

        {/* Tab 1: Coupons */}
        {activeSubTab === 'coupons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, color: 'var(--ink)' }}>कस्टमर के कूपन्स ({customerCoupons.length})</h4>
              <button
                type="button"
                onClick={handleIssueCoupon}
                style={{ background: 'var(--rust)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                🎁 नया कूपन जारी करें
              </button>
            </div>

            {customerCoupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', background: '#f9f6ef', borderRadius: '8px', border: '1px dashed #d5c8b2' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#555' }}>इस ग्राहक के पास अभी कोई कूपन दर्ज नहीं है सा।</p>
                <small style={{ color: '#888', display: 'block', marginBottom: '10px' }}>आप ऊपर "🎁 नया कूपन जारी करें" पर क्लिक करके ग्राहक को सरप्राइज डिस्काउंट/इनाम दे सकते हैं!</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                {customerCoupons.map(c => {
                  const status = couponStatus(c)
                  return (
                    <div key={c.code} style={{ border: status === 'valid' ? '2px dashed var(--rust)' : status === 'redeemed' ? '1px solid #a5d6a7' : '1px solid #ffcdd2', borderRadius: '8px', padding: '12px', background: status === 'valid' ? '#fffcf7' : status === 'redeemed' ? '#e8f5e9' : '#ffebee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ background: status === 'valid' ? 'var(--rust)' : status === 'redeemed' ? '#2e7d32' : '#c62828', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                            {status === 'valid' ? 'सक्रिय कूपन' : status === 'redeemed' ? '✓ इस्तेमाल किया गया' : '⚠️ एक्सपायर (Expired)'}
                          </span>
                          <h4 style={{ margin: '6px 0 2px 0', color: 'var(--ink)' }}>{c.reward?.label || 'SPECIAL REWARD'}</h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{c.reward?.detail || 'माजीसा कैफे शगुन इनाम'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <code style={{ background: '#eee', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.88rem', color: '#333', display: 'block' }}>{c.code}</code>
                          <small style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginTop: '2px' }}>
                            {c.expiresAt ? `वैधता: ${new Date(c.expiresAt).toLocaleDateString('en-IN')}` : '15 दिनों के लिए वैध'}
                          </small>
                        </div>
                      </div>

                      {status === 'valid' && (
                        <button
                          type="button"
                          onClick={() => markRedeemedCode(c.code)}
                          style={{ marginTop: '10px', width: '100%', background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✓ रिडीम मार्क करें (Mark as Redeemed)
                        </button>
                      )}

                      {status === 'redeemed' && (
                        <button
                          type="button"
                          onClick={() => markUnredeemedCode(c.code)}
                          style={{ marginTop: '10px', width: '100%', background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ↩️ गलती से रिडीम हुआ? (अन-रिडीम / री-एक्टिव करें)
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeSubTab === 'history' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--ink)' }}>पूरा ऑर्डर व बिल भुगतान रिकॉर्ड ({customerHistory.length})</h4>
            {customerHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', background: '#f9f6ef', borderRadius: '8px', border: '1px dashed #d5c8b2' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#555' }}>इस ग्राहक का कोई लेन-देन रिकॉर्ड नहीं मिला सा।</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                {customerHistory.map(item => (
                  <div key={item.id} style={{ background: '#fff', border: '1px solid #e2d5c3', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '6px', marginBottom: '6px' }}>
                      <div>
                        <b style={{ color: 'var(--rust)', fontSize: '0.88rem' }}>{item.id}</b>
                        <small style={{ display: 'block', fontSize: '0.72rem', color: '#888' }}>
                          {item.date ? new Date(item.date).toLocaleString('en-IN') : 'हाल ही में'}
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>₹{item.amount}</strong>
                        <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: item.status === 'completed' ? '#2e7d32' : item.status === 'accepted' ? '#1565c0' : '#ef6c00' }}>
                          {item.status === 'completed' ? '✓ पूरा हुआ' : item.status === 'accepted' ? 'स्वीकृत' : 'पेंडिंग'}
                        </div>
                      </div>
                    </div>

                    {item.items && item.items.length > 0 && (
                      <div style={{ background: '#f9f9f9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.76rem', color: '#444' }}>
                        {item.items.map((it, idx) => (
                          <div key={idx}>• {it.name} x {it.qty} (₹{it.price * it.qty})</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminPanel({ menu, setMenu, coupons, setCoupons, media, setMedia, bills, setBills, onApproveBill, galleryItems, setGalleryItems, b2Credentials, setB2Credentials, orders, setOrders, customers = [], setCustomers, eventBookings = [], setEventBookings, onClose }) {
  const [pin, setPin] = useState('')
  const [logged, setLogged] = useState(() => sessionStorage.getItem('majisa-admin') === 'yes')
  const [tab, setTab] = useState('events')
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null)
  const [eventFilter, setEventFilter] = useState('all')

  const updateEventBookingStatus = (id, status) => {
    const next = eventBookings.map(b => b.id === id ? { ...b, status } : b)
    saveEventBookings(next)
    if (typeof setEventBookings === 'function') setEventBookings(next)
  }

  const filteredEventBookings = eventBookings.filter(b => eventFilter === 'all' ? true : b.status === eventFilter)
  const [form, setForm] = useState(blankItem)
  const [editingId, setEditingId] = useState(null)
  const [newCat, setNewCat] = useState('')
  const [customCatInput, setCustomCatInput] = useState('')
  const [autoHindi, setAutoHindi] = useState(true)
  const [customCats, setCustomCats] = useState(() => getCategories())
  const [activeCat, setActiveCat] = useState('सब')
  const [billAmount, setBillAmount] = useState('')
  const [billMobile, setBillMobile] = useState('')
  const [billCustomerName, setBillCustomerName] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats, ...menu.map(item => item.cat)].filter(Boolean)))
  const visibleAdminMenu = activeCat === 'सब' ? menu : menu.filter(item => item.cat === activeCat)
  const updateLatin = (value) => {
    const hindi = suggestHindiName(value)
    setForm(current => ({ ...current, latin: value, name: autoHindi ? hindi : current.name }))
  }
  const refreshBills = async () => {
    if (!hasSupabase) return
    try {
      const remoteBills = await readAppState('bills', bills)
      setBills(remoteBills)
    } catch (err) {
      console.warn('Failed to refresh bills', err.message)
    }
  }

  const refreshCoupons = async () => {
    if (!hasSupabase) return
    try {
      const remoteCoupons = await readCoupons()
      setCoupons(remoteCoupons)
    } catch (err) {
      console.warn('Failed to refresh coupons', err.message)
    }
  }

  const refreshOrders = async () => {
    if (!hasSupabase) return
    try {
      const remoteOrders = await readAppState('orders', orders)
      setOrders(remoteOrders)
    } catch (err) {
      console.warn('Failed to refresh orders', err.message)
    }
  }

  const refreshCustomers = async () => {
    if (!hasSupabase) return
    try {
      const remoteCustomers = await readAppState('customers', customers)
      setCustomers(remoteCustomers)
    } catch (err) {
      console.warn('Failed to refresh customers', err.message)
    }
  }

  // Combine customers array + inferred customers from orders, bills, and coupons
  const allCustomerMap = new Map()

  customers.forEach(c => {
    const phone = (c.phone || c.mobile || '').replace(/\D/g, '').slice(-10)
    if (phone && phone.length >= 10) {
      allCustomerMap.set(phone, {
        phone,
        name: c.name || 'Guest Customer',
        registeredAt: c.registeredAt || c.created_at || new Date().toISOString(),
        lastActive: c.lastActive || c.registeredAt || new Date().toISOString(),
      })
    }
  })

  orders.forEach(o => {
    const phone = (o.mobile || '').replace(/\D/g, '').slice(-10)
    if (phone && phone.length >= 10) {
      const existing = allCustomerMap.get(phone) || {}
      allCustomerMap.set(phone, {
        phone,
        name: existing.name || o.name || 'Guest Customer',
        registeredAt: existing.registeredAt || o.created || new Date().toISOString(),
        lastActive: o.created || existing.lastActive || new Date().toISOString(),
      })
    }
  })

  bills.forEach(b => {
    const phone = (b.mobile || b.customer_phone || b.customerPhone || '').replace(/\D/g, '').slice(-10)
    if (phone && phone.length >= 10) {
      const existing = allCustomerMap.get(phone) || {}
      allCustomerMap.set(phone, {
        phone,
        name: existing.name || b.customerName || b.name || 'Guest Customer',
        registeredAt: existing.registeredAt || b.created || new Date().toISOString(),
        lastActive: b.created || existing.lastActive || new Date().toISOString(),
      })
    }
  })

  coupons.forEach(c => {
    const phone = (c.customerPhone || c.mobile || '').replace(/\D/g, '').slice(-10)
    if (phone && phone.length >= 10) {
      const existing = allCustomerMap.get(phone) || {}
      allCustomerMap.set(phone, {
        phone,
        name: existing.name || c.customerName || 'Guest Customer',
        registeredAt: existing.registeredAt || c.created || new Date().toISOString(),
        lastActive: c.created || existing.lastActive || new Date().toISOString(),
      })
    }
  })

  const mergedCustomersList = Array.from(allCustomerMap.values()).map(c => {
    const cPhone = c.phone
    const cNameClean = (c.name || '').trim().toLowerCase()

    const myOrdersCount = orders.filter(o => {
      const oPhone = (o.mobile || '').replace(/\D/g, '').slice(-10)
      const oName = (o.name || '').trim().toLowerCase()
      return (cPhone && oPhone && oPhone === cPhone) || (cNameClean && cNameClean.length >= 2 && oName && oName === cNameClean)
    }).length

    const myBillsCount = bills.filter(b => {
      const bPhone = (b.mobile || b.customer_phone || b.customerPhone || '').replace(/\D/g, '').slice(-10)
      const bName = (b.customerName || b.name || '').trim().toLowerCase()
      return (cPhone && bPhone && bPhone === cPhone) || (cNameClean && cNameClean.length >= 2 && bName && bName === cNameClean)
    }).length

    const myCouponsCount = coupons.filter(cp => {
      const cpPhone = (cp.customerPhone || cp.mobile || '').replace(/\D/g, '').slice(-10)
      const cpName = (cp.customerName || '').trim().toLowerCase()
      return (cPhone && cpPhone && cpPhone === cPhone) || (cNameClean && cNameClean.length >= 2 && cpName && cpName === cNameClean)
    }).length

    const totalOrdersAmount = orders.filter(o => {
      const oPhone = (o.mobile || '').replace(/\D/g, '').slice(-10)
      return cPhone && oPhone && oPhone === cPhone && o.status === 'completed'
    }).reduce((sum, o) => sum + Number(o.amount || 0), 0)

    const totalBillsAmount = bills.filter(b => {
      const bPhone = (b.mobile || b.customer_phone || b.customerPhone || '').replace(/\D/g, '').slice(-10)
      return cPhone && bPhone && bPhone === cPhone
    }).reduce((sum, b) => sum + Number(b.amount || 0), 0)

    return {
      ...c,
      ordersCount: myOrdersCount,
      billsCount: myBillsCount,
      couponsCount: myCouponsCount,
      totalSpend: totalOrdersAmount + totalBillsAmount,
    }
  }).sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime())

  const filteredCustomers = mergedCustomersList.filter(c => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return true
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)
  })

  const updateOrderStatus = (orderId, status) => {
    const nextOrders = orders.map(ord => ord.id === orderId ? { ...ord, status } : ord)
    saveOrders(nextOrders)
    setOrders(nextOrders)
  }

  const completeOnlineOrder = (order) => {
    const reward = pickReward(menu)
    const code = `MJC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const created = new Date().toISOString()
    const expiresAt = new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const newCoupon = {
      reward,
      code,
      created,
      expiresAt,
      amount: order.amount,
      mobile: order.mobile || '',
      customerPhone: order.mobile || '',
      customerName: order.name || '',
      upiRef: order.upiRef || '',
      redeemedAt: null
    }

    const updatedCoupons = [newCoupon, ...coupons]
    saveCoupons(updatedCoupons)
    setCoupons(updatedCoupons)

    const nextOrders = orders.map(ord => ord.id === order.id ? { ...ord, status: 'completed', coupon: newCoupon } : ord)
    saveOrders(nextOrders)
    setOrders(nextOrders)

    localStorage.setItem('majisa-reward', JSON.stringify(newCoupon))
    setToast(`🎉 ऑर्डर ${order.id} पूरा हुआ सा! कूपन ${newCoupon.code} (${newCoupon.reward?.label}) जारी हो गया सा।`)
    setTimeout(() => setToast(''), 4500)
  }

  const readImage = async (file) => {
    if (!file) return
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.8)
      setForm(current => ({ ...current, image: compressed }))
    } catch {
      const reader = new FileReader()
      reader.onload = () => setForm(current => ({ ...current, image: reader.result }))
      reader.readAsDataURL(file)
    }
  }

  const saveItem = () => {
    const finalCat = form.cat === '__other__' ? suggestHindiCategory(customCatInput) : form.cat
    if (!form.name || !form.price || !finalCat) return
    const payload = { ...form, cat: finalCat, price: Number(form.price), id: editingId || Date.now(), atlas: 0 }
    const updated = editingId ? menu.map(item => item.id === editingId ? payload : item) : [payload, ...menu]
    if (!categories.includes(finalCat)) {
      const nextCats = [...customCats, finalCat]
      saveCategories(nextCats)
      setCustomCats(nextCats)
    }
    saveMenu(updated)
    setMenu(updated)
    setForm(blankItem)
    setCustomCatInput('')
    setAutoHindi(true)
    setEditingId(null)
  }

  const editItem = (item) => {
    setForm({ ...item, price: String(item.price) })
    setCustomCatInput('')
    setAutoHindi(false)
    setEditingId(item.id)
    setTab('menu')
  }

  const deleteItem = (id) => {
    const updated = menu.filter(item => item.id !== id)
    saveMenu(updated)
    setMenu(updated)
  }

  const addCategory = () => {
    const cat = suggestHindiCategory(newCat)
    if (!cat) return
    const nextCats = Array.from(new Set([...customCats, cat]))
    saveCategories(nextCats)
    setCustomCats(nextCats)
    setActiveCat(cat)
    setForm(current => ({ ...current, cat }))
    setNewCat('')
  }

  const [showResetMenuConfirm, setShowResetMenuConfirm] = useState(false)

  const executeResetMenu = () => {
    setShowResetMenuConfirm(false)
    saveMenu(DEFAULT_MENU)
    saveCategories(DEFAULT_CATEGORIES)
    setMenu(DEFAULT_MENU)
    setCustomCats(DEFAULT_CATEGORIES)
    setActiveCat('सब')
    setForm(blankItem)
    setCustomCatInput('')
    setAutoHindi(true)
    setEditingId(null)
  }

  const createBill = () => {
    const amount = Number(billAmount)
    if (!amount || amount < 1) {
      alert('कृपया सही बिल राशि दर्ज करें सा!')
      return
    }
    const id = `MJC-BILL-${Math.floor(1000 + Math.random() * 9000)}`
    const cleanMobile = billMobile.replace(/\D/g, '')
    const cName = billCustomerName.trim() || 'Guest Customer'
    const next = [{
      id,
      amount,
      mobile: cleanMobile,
      customerPhone: cleanMobile,
      customerName: cName,
      name: cName,
      status: 'open',
      created: new Date().toISOString(),
      upiRef: '',
      couponCode: ''
    }, ...bills]
    saveBills(next)
    setBills(next)
    if (cleanMobile) {
      registerOrUpdateCustomer(cName, cleanMobile)
    }
    setBillAmount('')
    setBillMobile('')
    setBillCustomerName('')
  }

  const [showResetPinModal, setShowResetPinModal] = useState(false)
  const [resetMobile, setResetMobile] = useState('')
  const [resetNewPin, setResetNewPin] = useState('')

  // Security Tab state & Lockout state
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [confirmPinInput, setConfirmPinInput] = useState('')

  const [lockout, setLockout] = useState(() => getLockoutState())
  const [remainingTimeText, setRemainingTimeText] = useState('')

  useEffect(() => {
    syncLockoutFromRemote().then(updated => {
      if (updated) setLockout(updated)
    })
  }, [])

  useEffect(() => {
    let timer = null
    if (lockout.lockoutUntil && lockout.lockoutUntil > Date.now()) {
      const updateCountdown = () => {
        const diff = Math.max(0, lockout.lockoutUntil - Date.now())
        if (diff <= 0) {
          const cleared = { ...lockout, lockoutUntil: null }
          setLockout(cleared)
          saveLockoutState(cleared)
          setRemainingTimeText('')
        } else {
          const mins = Math.floor(diff / 60000)
          const secs = Math.floor((diff % 60000) / 1000)
          setRemainingTimeText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`)
        }
      }
      updateCountdown()
      timer = setInterval(updateCountdown, 1000)
    } else {
      setRemainingTimeText('')
    }
    return () => { if (timer) clearInterval(timer) }
  }, [lockout.lockoutUntil])

  const login = () => {
    if (lockout.isBlocked) {
      alert('⛔ आपका डिवाइस एडमिन एक्सेस के लिए स्थायी रूप से ब्लॉक (PERMANENTLY BLOCKED) कर दिया गया है सा! ओनर से संपर्क करें।')
      return
    }

    if (lockout.lockoutUntil && lockout.lockoutUntil > Date.now()) {
      alert(`🛑 सुरक्षा लॉकआउट एक्टिव है! कृपया ${remainingTimeText || 'समय पूरा होने'} के बाद पुनः प्रयास करें सा।`)
      return
    }

    if (!clientApiLimiter.checkLimit()) {
      alert('🛑 अत्यधिक प्रयास! सुरक्षा के लिए कृपया 1 मिनट बाद पुनः प्रयास करें सा।')
      return
    }

    const activePin = getAdminPin()
    if (pin.trim() === activePin) {
      handleSuccessfulAdminLogin()
      sessionStorage.setItem('majisa-admin', 'yes')
      setLogged(true)
      setLockout(getLockoutState())
    } else {
      const result = handleFailedAdminLogin()
      setLockout(result.state)
      alert(result.message)
    }
  }

  const handleExecuteResetPin = (e) => {
    e.preventDefault()
    const clean = resetMobile.replace(/\D/g, '').slice(-10)
    if (clean === '9725845974' || clean === '7073011597' || clean === '8764198342') {
      if (!resetNewPin || resetNewPin.trim().length < 4) {
        alert('कृपया कम से कम 4 अंकों का नया पिन दर्ज करें सा!')
        return
      }
      const finalPin = resetNewPin.trim()
      saveAdminPin(finalPin)
      handleSuccessfulAdminLogin()
      alert(`🎉 एडमिन पिन सफलता पूर्वक बदल गया सा! नया लॉगिन पिन: ${finalPin}`)
      setShowResetPinModal(false)
      setPin(finalPin)
      setResetMobile('')
      setResetNewPin('')
    } else {
      alert('⚠️ अमान्य ओनर मोबाइल नंबर! केवल पंजीकृत ओनर नंबर (उदा. 9725845974 / 7073011597) द्वारा रीसेट किया जा सकता है।')
    }
  }

  const handleChangePinSubmit = (e) => {
    e.preventDefault()
    const activePin = getAdminPin()
    if (currentPinInput.trim() !== activePin) {
      alert('⚠️ वर्तमान पिन (Current PIN) गलत दर्ज किया गया है सा!')
      return
    }
    if (!newPinInput || newPinInput.trim().length < 4) {
      alert('कृपया कम से कम 4 अंकों का नया पिन (New PIN) दर्ज करें सा!')
      return
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      alert('⚠️ नया पिन और कन्फर्म पिन आपस में मेल नहीं खाते!')
      return
    }

    const finalPin = newPinInput.trim()
    saveAdminPin(finalPin)
    alert(`🎉 बधाई हो सा! आपका एडमिन पिन सफलतापूर्वक बदल दिया गया है। नया पिन: ${finalPin}`)
    setCurrentPinInput('')
    setNewPinInput('')
    setConfirmPinInput('')
  }

  if (!logged) {
    const isLockedOut = Boolean(lockout.lockoutUntil && lockout.lockoutUntil > Date.now())
    return (
      <div className="overlay modal-overlay">
        <div className="admin-modal login-box">
          <button className="modal-close" onClick={onClose}><X /></button>
          <div className="checkout-head"><span><ChefHat /></span><div><small>OWNER ONLY</small><h3>Admin Panel Login</h3></div></div>

          {lockout.isBlocked ? (
            <div style={{ background: '#ffebee', border: '2px solid #d32f2f', color: '#c62828', padding: '16px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={32} style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>⛔ PERMANENTLY BLOCKED</h4>
              <p style={{ fontSize: '0.85rem', margin: '6px 0 0 0' }}>
                6 बार गलत पासवर्ड डालने के कारण एडमिन लॉगिन ब्लॉक कर दिया गया है सा। ओनर से संपर्क करें।
              </p>
            </div>
          ) : isLockedOut ? (
            <div style={{ background: '#fff3e0', border: '2px solid #ef6c00', color: '#e65100', padding: '14px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px' }}>
              <Clock3 size={28} style={{ marginBottom: '6px' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>🛑 सुरक्षा लॉकआउट (Security Lock)</h4>
              <p style={{ fontSize: '0.88rem', margin: '6px 0 0 0', fontWeight: '600' }}>
                {lockout.failedAttempts} बार गलत पासवर्ड दर्ज हुआ। <br />
                पुनः प्रयास करें: <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#b71c1c' }}>{remainingTimeText}</span>
              </p>
            </div>
          ) : null}

          <label className="input-label">Owner PIN</label>
          <div className="fake-input">
            <span>PIN</span>
            <input
              value={pin}
              onChange={e => setPin(e.target.value)}
              type="password"
              placeholder="Enter PIN"
              disabled={lockout.isBlocked || isLockedOut}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>

          {!lockout.isBlocked && !isLockedOut && lockout.failedAttempts > 0 && (
            <small style={{ color: '#d32f2f', fontWeight: 'bold', display: 'block', marginBottom: '10px', textAlign: 'center' }}>
              ⚠️ {lockout.failedAttempts} गलत प्रयास! ({4 - lockout.failedAttempts} प्रयास शेष हैं)
            </small>
          )}

          <button
            className="btn primary full"
            onClick={login}
            disabled={lockout.isBlocked || isLockedOut}
            style={{ opacity: (lockout.isBlocked || isLockedOut) ? 0.5 : 1 }}
          >
            Admin login (ओपन करें)
          </button>

          <div style={{ marginTop: '14px', textAlign: 'center', borderTop: '1px dashed #e0d5c5', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={() => setShowResetPinModal(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--rust)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}
            >
              🔑 पिन भूल गए? (Reset Password / PIN)
            </button>
          </div>
          <small className="demo-note" style={{ display: 'block', marginTop: '8px' }}>डिफ़ॉल्ट पिन: 1122. लॉगिन करके आप पिन बदल सकते हैं सा।</small>
        </div>

        {/* Forgot PIN Modal */}
        {showResetPinModal && (
          <div className="overlay modal-overlay" style={{ zIndex: 1200 }}>
            <div className="checkout-modal" style={{ maxWidth: '420px', width: '90%' }}>
              <button className="modal-close" onClick={() => setShowResetPinModal(false)}><X /></button>
              <div className="checkout-head"><span><Key /></span><div><small>RESET SECURITY PIN</small><h3>पिन रीसेट (Reset Password)</h3></div></div>
              <form onSubmit={handleExecuteResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.82rem', color: '#666', margin: 0 }}>
                  सुरक्षा सत्यापन के लिए अपना पंजीकृत ओनर मोबाइल नंबर दर्ज करें सा:
                </p>
                <div>
                  <label className="input-label">पंजीकृत ओनर मोबाइल नंबर</label>
                  <div className="fake-input">
                    <span>+91</span>
                    <input
                      value={resetMobile}
                      onChange={e => setResetMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9725845974"
                      inputMode="tel"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">नया एडमिन पिन (New 4-digit PIN)</label>
                  <div className="fake-input">
                    <span>PIN</span>
                    <input
                      value={resetNewPin}
                      onChange={e => setResetNewPin(e.target.value)}
                      type="password"
                      placeholder="e.g. 5566"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn primary full" style={{ marginTop: '6px' }}>
                  नया पिन सेव करें (Set New PIN)
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="overlay admin-overlay">
      <div className="admin-panel">
        <div className="admin-top">
          <div><small>MAJISA OWNER DASHBOARD</small><h2>Admin Panel</h2></div>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="admin-tabs">
          <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>🎉 पार्टी व बन्दोला ({eventBookings.length})</button>
          <button className={tab === 'customers' ? 'active' : ''} onClick={() => { setTab('customers'); refreshCustomers(); }}>👥 Customers ({mergedCustomersList.length})</button>
          <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}>Menu manage</button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); refreshOrders(); }}>Online Orders</button>
          <button className={tab === 'coupons' ? 'active' : ''} onClick={() => { setTab('coupons'); refreshCoupons(); }}>Coupon check</button>
          <button className={tab === 'bills' ? 'active' : ''} onClick={() => { setTab('bills'); refreshBills(); }}>Bill payment</button>
          <button className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>Gallery page</button>
          <button className={tab === 'media' ? 'active' : ''} onClick={() => setTab('media')}>Media manage</button>
          <button className={tab === 'security' ? 'active' : ''} onClick={() => setTab('security')}>🔑 पासवर्ड बदलें</button>
        </div>
        {tab === 'events' ? (
          <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="admin-card">
              <div className="admin-card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--devanagari)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎉 पार्टी व बन्दोला बुकिंग्स (Event & Bandola Bookings)
                  </h3>
                  <small style={{ color: '#666', fontSize: '0.82rem' }}>
                    ग्राहक द्वारा ऑनलाइन की गई बर्थडे, बन्दोला व पार्टी बुकिंग की सूची और मैन्युअल स्वीकृति
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEventFilter(st)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: eventFilter === st ? '1px solid var(--rust)' : '1px solid #ccc',
                        background: eventFilter === st ? 'var(--rust)' : '#fff',
                        color: eventFilter === st ? '#fff' : '#444',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {st === 'all' && `सब (${eventBookings.length})`}
                      {st === 'pending' && `⌛ लंबित (${eventBookings.filter(b => b.status === 'pending').length})`}
                      {st === 'accepted' && `✅ स्वीकृत (${eventBookings.filter(b => b.status === 'accepted').length})`}
                      {st === 'completed' && `🎉 पूरा हुआ (${eventBookings.filter(b => b.status === 'completed').length})`}
                      {st === 'cancelled' && `❌ निरस्त (${eventBookings.filter(b => b.status === 'cancelled').length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {filteredEventBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 12px', background: '#fcf8ee', borderRadius: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>कोई पार्टी/बन्दोला बुकिंग उपलब्ध नहीं है सा</p>
                  </div>
                ) : (
                  filteredEventBookings.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e0d2bf',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px dashed #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <b style={{ fontSize: '1.05rem', color: 'var(--rust)' }}>{item.id}</b>
                            <span style={{
                              fontSize: '0.76rem',
                              fontWeight: 'bold',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              background: item.status === 'pending' ? '#fff3e0' : item.status === 'accepted' ? '#e8f5e9' : item.status === 'completed' ? '#e3f2fd' : '#ffebee',
                              color: item.status === 'pending' ? '#e65100' : item.status === 'accepted' ? '#2e7d32' : item.status === 'completed' ? '#1565c0' : '#c62828'
                            }}>
                              {item.status === 'pending' && '⌛ स्वीकृति लंबित'}
                              {item.status === 'accepted' && '✅ स्वीकृत / Approved'}
                              {item.status === 'completed' && '🎉 पूरा हुआ / Completed'}
                              {item.status === 'cancelled' && '❌ निरस्त / Cancelled'}
                            </span>
                          </div>
                          <h4 style={{ margin: '4px 0 0 0', color: 'var(--ink)', font: '1.2rem var(--display)' }}>{item.eventTypeName}</h4>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold', display: 'block' }}>
                            📅 {item.eventDate} ({item.eventTime})
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--rust)', fontWeight: 'bold' }}>
                            👥 {item.guestCount} लोग (मेहमान)
                          </span>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <b style={{ fontSize: '0.92rem', color: '#333' }}>👤 {item.name}</b>
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '10px' }}>📱 +91 {item.mobile}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={`https://wa.me/91${item.mobile}?text=${encodeURIComponent(`खम्मा घणी ${item.name} जी, माजीसा कैफे में आपकी ${item.eventTypeName} (ID: ${item.id}) बुकिंग स्वीकृत कर ली गई है सा!`)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ background: '#25D366', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            💬 WhatsApp संदेश
                          </a>
                          <a
                            href={`tel:+91${item.mobile}`}
                            style={{ background: 'var(--indigo)', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            📞 कॉल करें
                          </a>
                        </div>
                      </div>

                      {/* Selected Menu Items */}
                      {item.selectedItems && item.selectedItems.length > 0 && (
                        <div style={{ background: '#fcf8f2', padding: '10px 12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #ebdccb' }}>
                          <small style={{ fontWeight: 'bold', color: 'var(--rust)', display: 'block', marginBottom: '6px' }}>
                            🍽️ चुने गए मेन्यू व्यंजन ({item.selectedItems.length}):
                          </small>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {item.selectedItems.map((it, idx) => (
                              <span key={idx} style={{ background: '#fff', border: '1px solid #ddd', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                                • {it.name} x {it.qty} (₹{it.price * it.qty})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#666', background: '#fff8ee', padding: '8px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                          <b>नोट:</b> {item.notes}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                        {item.status !== 'accepted' && (
                          <button
                            type="button"
                            onClick={() => updateEventBookingStatus(item.id, 'accepted')}
                            style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ✅ स्वीकृत करें (Approve)
                          </button>
                        )}
                        {item.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateEventBookingStatus(item.id, 'completed')}
                            style={{ background: 'var(--rust)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            🎉 पूरा हुआ (Complete)
                          </button>
                        )}
                        {item.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => updateEventBookingStatus(item.id, 'cancelled')}
                            style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ❌ निरस्त (Cancel)
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : tab === 'customers' ? (
          <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="admin-card">
              <div className="admin-card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--devanagari)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👥 पंजीकृत ग्राहक लिस्ट (Registered Customers)
                  </h3>
                  <small style={{ color: '#666', fontSize: '0.82rem' }}>
                    वेबसाइट पर रजिस्टर हुए ग्राहक, उनके मोबाइल नंबर और उनका पूरा रिकॉर्ड
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="नाम या नंबर से खोजें..."
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                  />
                  <button className="btn outline small" style={{ margin: 0 }} onClick={refreshCustomers}>Refresh</button>
                  <button
                    type="button"
                    className="btn outline small"
                    style={{ margin: 0, color: '#d32f2f', borderColor: '#d32f2f', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}
                    onClick={async () => {
                      if (window.confirm('क्या आप सचमुच डेटाबेस (Supabase) से सभी टेस्ट ग्राहक (5), टेस्ट ऑर्डर्स (2) और टेस्ट बिल (3) हमेशा के लिए डिलीट करना चाहते हैं सा?')) {
                        await clearAllProductionTestData()
                        setBills([])
                        setOrders([])
                        setCoupons([])
                        setCustomers([])
                        localStorage.setItem('majisa-v2-production-clean', 'true')
                        alert('🎉 डेटाबेस (Supabase) और स्क्रीन से सभी टेस्ट ग्राहक, ऑर्डर्स व बिल 100% साफ़ (Delete) हो गए हैं सा!')
                      }
                    }}
                  >
                    🧹 टेस्ट डेटा साफ़ करें
                  </button>
                  <span style={{ fontWeight: 'bold', color: 'var(--rust)', background: '#fff9ed', padding: '4px 10px', borderRadius: '12px', border: '1px solid #f0e1c2', fontSize: '0.85rem' }}>
                    {filteredCustomers.length} ग्राहक
                  </span>
                </div>
              </div>

              <div className="admin-list" style={{ marginTop: '16px' }}>
                {filteredCustomers.map(cust => (
                  <div
                    key={cust.phone}
                    className="admin-item"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2d5c3',
                      borderRadius: '10px',
                      gap: '12px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                      marginBottom: '10px'
                    }}
                  >
                    <div>
                      <b style={{ fontSize: '1rem', color: 'var(--ink)', display: 'block' }}>{cust.name}</b>
                      <small style={{ color: '#777', fontSize: '0.75rem' }}>
                        पंजीकरण: {cust.registeredAt ? new Date(cust.registeredAt).toLocaleDateString('en-IN') : 'हाल ही में'}
                      </small>
                    </div>

                    <div>
                      <a
                        href={`tel:+91${cust.phone}`}
                        style={{ color: 'var(--rust)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        📱 +91 {cust.phone}
                      </a>
                      <a
                        href={`https://wa.me/91${cust.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.72rem', color: '#2e7d32', textDecoration: 'underline', display: 'block', marginTop: '2px' }}
                      >
                        💬 WhatsApp पर मैसेज भेजें
                      </a>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#333', display: 'block', fontWeight: '600' }}>
                        📦 {cust.ordersCount + cust.billsCount} कुल ऑर्डर/बिल
                      </span>
                      <small style={{ fontSize: '0.74rem', color: '#666' }}>
                        ({cust.ordersCount} ऑनलाइन • {cust.billsCount} काउंटर)
                      </small>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#1b5e20', fontWeight: 'bold', display: 'block' }}>
                        🎟️ {cust.couponsCount} कूपन जारी
                      </span>
                      {cust.totalSpend > 0 && (
                        <small style={{ fontSize: '0.75rem', color: 'var(--rust)', fontWeight: 'bold' }}>
                          कुल बिल राशि: ₹{cust.totalSpend}
                        </small>
                      )}
                    </div>

                    <div>
                      <button
                        className="btn outline small"
                        onClick={() => setSelectedCustomerDetail(cust)}
                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      >
                        विवरण (Details)
                      </button>
                    </div>
                  </div>
                ))}

                {!filteredCustomers.length && (
                  <div className="admin-empty" style={{ textAlign: 'center', padding: '30px 10px' }}>
                    कोई ग्राहक नहीं मिला सा। वेबसाइट पर ग्राहक के साइन-इन या ऑर्डर करते ही उनका नाम व नंबर यहाँ दिखेगा।
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : tab === 'menu' ? (
          <div className="admin-grid">
            <div className="admin-card">
              <h3>{editingId ? 'Item update karo' : 'New item add karo'}</h3>
              <div className="admin-form">
                <input value={form.latin} onChange={e => updateLatin(e.target.value)} placeholder="Dish name English e.g. Dal Baati Churma" />
                <input value={form.name} onChange={e => { setAutoHindi(false); setForm({ ...form, name: e.target.value }) }} placeholder="Hindi name auto-fill / edit" />
                <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description / ingredients" />
                <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price ₹" inputMode="numeric" />
                <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="__other__">Other / Custom category</option>
                </select>
                {form.cat === '__other__' && (
                  <input value={customCatInput} onChange={e => setCustomCatInput(e.target.value)} placeholder="Custom category e.g. Rice, Snacks, South Indian" />
                )}
                <input value={form.tag || ''} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Tag e.g. घर की शान" />
                <label className="image-picker">
                  <input type="file" accept="image/*" onChange={e => readImage(e.target.files?.[0])} />
                  {form.image ? <img src={form.image} alt="Dish preview" /> : <span>Dish image upload</span>}
                </label>
                <button className="btn primary full" onClick={saveItem}>{editingId ? 'Update item' : 'Add item'}</button>
                {editingId && <button className="btn outline full" onClick={() => { setEditingId(null); setAutoHindi(true); setForm(blankItem) }}>Cancel edit</button>}
              </div>
              <div className="category-add">
                <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Custom category e.g. Roti, Sabji, Fast Food" />
                <button onClick={addCategory}>Add category</button>
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card-head">
                <h3>Current menu</h3>
                <button
                  style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', fontWeight: 'bold' }}
                  onClick={() => setShowResetMenuConfirm(true)}
                >
                  Reset Default Menu
                </button>
              </div>
              <div className="admin-category-filter">
                {['सब', ...categories].map(cat => (
                  <button key={cat} className={activeCat === cat ? 'active' : ''} onClick={() => setActiveCat(cat)}>
                    {cat} <span>{cat === 'सब' ? menu.length : menu.filter(item => item.cat === cat).length}</span>
                  </button>
                ))}
              </div>
              <div className="admin-list">
                {visibleAdminMenu.map(item => (
                  <div className="admin-item" key={item.id}>
                    <div className="admin-thumb" style={dishStyle(item)} />
                    <div><b>{item.name}</b><span>{item.cat} • ₹{item.price}</span><small>{item.latin}</small></div>
                    <button onClick={() => editItem(item)}>Edit</button>
                    <button onClick={() => deleteItem(item.id)}>Delete</button>
                  </div>
                ))}
                {!visibleAdminMenu.length && <div className="admin-empty">Is category mein abhi item nahi hai. Left side se item add karo.</div>}
              </div>
            </div>
          </div>
        ) : tab === 'bills' ? (
          <div className="admin-grid">
            <div className="admin-card">
              <h3>Manual bill banao (कस्टमर बिल बनाएं)</h3>
              <p className="bill-help">Cashier yahan customer ka naam, mobile number aur bill amount dalega. Customer apne wallet me apni payment history aur coupons dekh payega.</p>
              <div className="admin-form">
                <input value={billCustomerName} onChange={e => setBillCustomerName(e.target.value)} placeholder="Customer Name (e.g. Devendra / देवेंद्र)" />
                <input value={billMobile} onChange={e => setBillMobile(e.target.value)} inputMode="numeric" placeholder="Customer mobile e.g. 8764198342" />
                <input value={billAmount} onChange={e => setBillAmount(e.target.value)} inputMode="numeric" placeholder="Final bill amount ₹" />
                <button className="btn primary full" onClick={createBill}>Bill create karo</button>
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card-head">
                <h3>Bill payment requests</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn outline small" style={{ padding: '3px 8px', fontSize: '0.75rem', height: 'auto', margin: 0 }} onClick={refreshBills}>Refresh</button>
                  <span>{bills.length} bills</span>
                </div>
              </div>
              <div className="admin-list">
                {bills.map(bill => (
                  <div className="admin-item bill-item" key={bill.id}>
                    <div className="bill-item-info">
                      <b>{bill.id} {bill.customerName || bill.name ? `(${bill.customerName || bill.name})` : ''}</b>
                      <span>₹{bill.amount} • {bill.status === 'open' ? 'Payment pending' : bill.status === 'submitted' ? `Ref ${bill.upiRef}` : `Coupon ${bill.couponCode}`}</span>
                      <small>{new Date(bill.created).toLocaleString('en-IN')}</small>
                    </div>
                    <div className="bill-item-action">
                      {bill.status === 'submitted' && <button onClick={() => onApproveBill(bill)}>Verify & coupon</button>}
                      {bill.status === 'open' && <a className="bill-link" href={`/?bill=${bill.id}`} target="_blank" rel="noreferrer">Payment page kholo</a>}
                      {bill.status === 'rewarded' && <span className="bill-status-done">Done</span>}
                    </div>
                  </div>
                ))}
                {!bills.length && <div className="admin-empty">Abhi koi manual bill nahi bana hai.</div>}
              </div>
            </div>
          </div>
        ) : tab === 'orders' ? (
          <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="admin-card">
              <div className="admin-card-head">
                <h3>Online Orders</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn outline small" style={{ padding: '3px 8px', fontSize: '0.75rem', height: 'auto', margin: 0 }} onClick={refreshOrders}>Refresh</button>
                  <span>{orders.length} orders</span>
                </div>
              </div>
              <div className="admin-list">
                {orders.map(order => (
                  <div className="admin-item bill-item" key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#ffffff', border: '1px solid #e2d5c3', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: '12px' }}>
                    <div className="bill-item-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <b style={{ fontSize: '1.1rem', color: 'var(--rust)', fontWeight: 'bold' }}>{order.id}</b>

                        {/* Payment Method Badge */}
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          background: order.paymentMode === 'counter' ? '#e8f5e9' : '#e3f2fd',
                          color: order.paymentMode === 'counter' ? '#2e7d32' : '#1565c0',
                          border: order.paymentMode === 'counter' ? '1px solid #a5d6a7' : '1px solid #90caf9',
                          fontFamily: 'var(--devanagari)',
                          lineHeight: '1'
                        }}>
                          {order.paymentMode === 'counter' ? '💵 काउंटर पर भुगतान (Pay at Counter)' : '💳 ऑनलाइन यूपीआई (UPI Paid)'}
                        </span>

                        {/* Dining Option Badge */}
                        {order.diningOption && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            background: order.diningOption === 'takeaway' ? '#fff3e0' : '#fce4ec',
                            color: order.diningOption === 'takeaway' ? '#e65100' : '#c2185b',
                            border: order.diningOption === 'takeaway' ? '1px solid #ffe0b2' : '1px solid #f8bbd0',
                            fontFamily: 'var(--devanagari)',
                            lineHeight: '1'
                          }}>
                            {order.diningOption === 'takeaway' ? '📦  पैक करवाएंगे (Takeaway)' : '🍽️ टेबल पर खाएंगे (Dine-in)'}
                          </span>
                        )}

                        {/* Guest Count Badge */}
                        {order.members && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            background: '#f5f5f5',
                            color: '#333333',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'var(--devanagari)',
                            lineHeight: '1'
                          }}>
                            👥 {order.members} {order.members === 1 ? 'व्यक्ति' : 'लोग'} (Guests)
                          </span>
                        )}
                      </div>

                      {/* Customer Info Line */}
                      <div style={{ margin: '8px 0', fontSize: '0.92rem', color: '#333333', lineHeight: '1.4' }}>
                        <b style={{ color: '#1c0e07', fontSize: '1rem' }}>{order.name || 'Guest Customer'}</b>
                        <span style={{ color: '#555', margin: '0 8px' }}>•</span>
                        <span style={{ color: '#444' }}>📱 +91 {order.mobile || 'No Mobile'}</span>
                        <span style={{ color: '#555', margin: '0 8px' }}>•</span>
                        <strong style={{ color: 'var(--rust)', fontSize: '1.05rem', fontWeight: 'bold' }}>₹{order.amount}</strong>
                        {order.upiRef && order.upiRef !== 'PAY_AT_COUNTER' && (
                          <span style={{ color: '#666', marginLeft: '8px', fontSize: '0.82rem' }}>(Ref: <b>{order.upiRef}</b>)</span>
                        )}
                      </div>

                      {/* Ordered Items Box */}
                      {order.items && order.items.length > 0 && (
                        <div className="bill-ordered-items" style={{ marginTop: '8px', fontSize: '0.85rem', background: '#fdfbf7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #eee4d5', borderLeft: '4px solid var(--rust)' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', color: 'var(--rust)', marginBottom: '4px', fontFamily: 'var(--devanagari)' }}>आर्डर किए गए आइटम (Items Ordered):</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {order.items.map((item, idx) => (
                              <span key={idx} style={{ color: '#222222', fontWeight: '600' }}>
                                • {item.name} x {item.qty} <span style={{ color: '#666', fontWeight: 'normal' }}>(₹{item.price * item.qty})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <small style={{ color: '#777777', display: 'block', marginTop: '8px', fontSize: '0.78rem' }}>
                        🕒 {new Date(order.created).toLocaleString('en-IN')}
                      </small>
                    </div>

                    <div className="bill-item-action" style={{ marginLeft: '16px' }}>
                      {order.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button className="btn primary small" style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 'bold' }} onClick={() => updateOrderStatus(order.id, 'accepted')}>Accept & Prepare</button>
                          <button className="btn outline small" style={{ color: '#d32f2f', borderColor: '#d32f2f', padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => updateOrderStatus(order.id, 'cancelled')}>Cancel</button>
                        </div>
                      ) : order.status === 'accepted' ? (
                        <button className="btn primary small" style={{ background: '#2e7d32', borderColor: '#2e7d32', color: '#ffffff', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 'bold' }} onClick={() => completeOnlineOrder(order)}>
                          {order.paymentMode === 'counter' ? 'Mark Paid & Complete' : 'Mark Picked Up / Complete'}
                        </button>
                      ) : (
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: order.status === 'completed' ? '#2e7d32' : '#d32f2f' }}>
                          {order.status === 'completed' ? '✓ Paid & Completed' : '✕ Cancelled'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {!orders.length && <div className="admin-empty">Abhi koi online order nahi aaya hai.</div>}
              </div>
            </div>
          </div>
        ) : tab === 'gallery' ? (
          <AdminGalleryPanel
            galleryItems={galleryItems}
            setGalleryItems={setGalleryItems}
            b2Credentials={b2Credentials}
            setB2Credentials={setB2Credentials}
          />
        ) : tab === 'media' ? (
          <MediaManager media={media} setMedia={setMedia} />
        ) : tab === 'security' ? (
          <div className="admin-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '520px', margin: '0 auto' }}>
            <div className="admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px dashed #e0d5c5', paddingBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔑</span>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--ink)', fontFamily: 'var(--devanagari)' }}>एडमिन पासवर्ड / पिन बदलें (Change PIN)</h3>
                  <small style={{ color: '#666' }}>अपना एडमिन लॉगिन पिन सुरक्षित रूप से अपडेट करें सा</small>
                </div>
              </div>

              <form onSubmit={handleChangePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="input-label">वर्तमान पिन (Current Admin PIN)</label>
                  <div className="fake-input">
                    <span>PIN</span>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={e => setCurrentPinInput(e.target.value)}
                      placeholder="वर्तमान पिन दर्ज करें"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">नया एडमिन पिन (New Admin PIN)</label>
                  <div className="fake-input">
                    <span>NEW</span>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={e => setNewPinInput(e.target.value)}
                      placeholder="कम से कम 4 अंक"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">नया पिन दोबारा दर्ज करें (Confirm New PIN)</label>
                  <div className="fake-input">
                    <span>CONFIRM</span>
                    <input
                      type="password"
                      value={confirmPinInput}
                      onChange={e => setConfirmPinInput(e.target.value)}
                      placeholder="नया पिन पुनः टाइप करें"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn primary full" style={{ marginTop: '8px', padding: '12px' }}>
                  🔑 पासवर्ड/पिन अपडेट करें (Update Admin Password)
                </button>
              </form>
            </div>

            {/* Production Live Launch Reset Card */}
            <div className="admin-card" style={{ padding: '24px', marginTop: '20px', border: '2px solid #ffcdd2', background: '#fff5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🚀</span>
                <div>
                  <h3 style={{ margin: 0, color: '#c62828', fontFamily: 'var(--devanagari)' }}>लाइव लॉन्च हेतु डेमो डेटा रीसेट (Live Production Reset)</h3>
                  <small style={{ color: '#666' }}>प्रोजेक्ट लाइव करने से पहले सभी टेस्टिंग डेटा को 1-क्लिक में साफ़ करें</small>
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#555', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                परीक्षण (Testing) के दौरान बनाए गए सभी डेमो ग्राहक, टेस्ट कूपन, ऑनलाइन ऑर्डर व मैनुअल बिल डेटाबेस और लोकल स्टोरेज से साफ़ करें ताकि असली ग्राहक एकदम फ्रेश डेटा देख सकें। <i>(आपका मेनु, मीडिया व एडमिन पासवर्ड सुरक्षित रहेगा)</i>
              </p>
              <button
                type="button"
                onClick={async () => {
                  const confirmChoice = window.confirm(' क्या आप सचमुच लाइव जाने के लिए सभी टेस्टिंग डेटा (टेस्ट ग्राहक, टेस्ट कूपन, ऑनलाइन ऑर्डर व बिल) साफ़ करना चाहते हैं सा?')
                  if (!confirmChoice) return
                  await clearAllProductionTestData()
                  setBills([])
                  setOrders([])
                  setCoupons([])
                  setCustomers([])
                  alert('🎉 बधाई हो सा! लाइव लॉन्च हेतु सभी डेमो/टेस्ट डेटा (कूपन्स, ऑर्डर्स, बिल, कस्टमर्स) सफलता पूर्वक साफ़ कर दिए गए हैं। आपकी वेबसाइट अब लाइव जाने के लिए एकदम फ्रेश और तैयार है!')
                }}
                style={{ width: '100%', background: '#d32f2f', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer' }}
              >
                🧹 सभी टेस्ट डेटा साफ़ करें (Clean All Test Data for Production)
              </button>
            </div>
          </div>
        ) : (
          <CouponVerifier coupons={coupons} setCoupons={setCoupons} embedded />
        )}
      </div>
      {showResetMenuConfirm && (
        <ConfirmDialog
          title="⚠️ मेनु रीसेट सुरक्षा चेतावनी"
          message="क्या आप सचमुच पूरे मेनु को डिफ़ॉल्ट डिश लिस्ट पर रीसेट करना चाहते हैं सा? आपकी जोड़ी गई नई कस्टमाइज़्ड डिश रीसेट हो जाएंगी।"
          confirmText="हाँ, रीसेट करें (Yes Reset)"
          cancelText="नहीं, रद्द करें (No, Cancel)"
          onConfirm={executeResetMenu}
          onCancel={() => setShowResetMenuConfirm(false)}
        />
      )}
      {selectedCustomerDetail && (
        <AdminCustomerDetailModal
          customer={selectedCustomerDetail}
          orders={orders}
          bills={bills}
          coupons={coupons}
          setCoupons={setCoupons}
          menu={menu}
          onClose={() => setSelectedCustomerDetail(null)}
        />
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <BrandMark />
        <p>मिट्टी की खुशबू, देसी स्वाद<br />और दिल से मनुहार।</p>
        <div className="footer-social">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>
          <a href={`tel:${PHONE_PRIMARY}`} aria-label="Call"><Phone /></a>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" aria-label="Location"><MapPin /></a>
        </div>
      </div>
      <div className="footer-links">
        <div><h4>पधारो सा</h4><a href="#story">हमारी कहानी</a><a href="#menu">मेन्यू</a><a href="#gallery">झलकियाँ</a><a href="#gallery-page">गैलरी (Photos & Reels)</a></div>
        <div><h4>मदद</h4><a href="#rewards">Scratch rewards</a><a href="#visit">टेबल बुकिंग</a><a href="#visit">संपर्क</a></div>
        <div><h4>समय</h4><span>Mon – Sun</span><b>11:00 AM – 11:00 PM</b><small>रसोई 10:30 PM तक</small></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Majisa Cafe and Restaurant. Made with <Heart size={13} fill="currentColor" /> in Rajasthan.</span><span>Privacy • Terms • FSSAI</span></div>
    </footer>
  )
}

function GalleryPage({ galleryItems, onClose }) {
  const [activeTab, setActiveTab] = useState('सब')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [muted, setMuted] = useState(true)

  const filteredItems = galleryItems.filter(item => {
    if (activeTab === 'सब') return true
    if (activeTab === 'व्यंजन') return item.category === 'व्यंजन'
    if (activeTab === 'माहौल') return item.category === 'माहौल'
    if (activeTab === 'वीडियो') return item.type === 'video'
    return true
  })

  const handleBack = () => {
    onClose()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <div className="gallery-page-container">
      <header className="gallery-page-header">
        <button className="back-button" onClick={handleBack}>
          <ChevronLeft size={20} /> <span>मुख्य पृष्ठ (Home)</span>
        </button>
        <div className="gallery-page-title">
          <BrandMark small />
          <h2>हमारी <em>गैलरी</em></h2>
          <p>माजीसा रेस्टोरेंट की खास झलकियां—स्वादिष्ट व्यंजन और खुशनुमा माहौल।</p>
        </div>
      </header>

      <div className="category-tabs gallery-page-tabs" role="tablist">
        {['सब', 'व्यंजन', 'माहौल', 'वीडियो'].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'सब' ? 'सभी झलकियाँ' : tab === 'व्यंजन' ? 'लाजवाब व्यंजन (Food)' : tab === 'माहौल' ? 'देसी माहौल (Ambience)' : 'वीडियो रील्स (Videos)'}
          </button>
        ))}
        <button className="sound-toggle" onClick={() => setMuted(!muted)} style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />} {muted ? 'Mute' : 'Unmute'}
        </button>
      </div>

      <div className="gallery-page-grid">
        {filteredItems.map((item, idx) => (
          <div key={item.id} className="gallery-page-card" style={{ '--delay': `${idx * 40}ms` }}>
            {item.type === 'video' ? (
              <div className="gallery-video-wrapper">
                <video
                  src={item.src}
                  muted={muted}
                  loop
                  playsInline
                  autoPlay
                  onClick={() => setLightboxIndex(idx)}
                />
                <div className="video-card-overlay">
                  <Play size={20} fill="currentColor" />
                  <span>पूरी रील देखें</span>
                </div>
              </div>
            ) : (
              <div className="gallery-image-wrapper" onClick={() => setLightboxIndex(idx)}>
                <img src={item.src} alt={item.title} loading="lazy" />
              </div>
            )}
            <div className="gallery-card-info">
              <h4>{(item.title || '').replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mov|avi|mkv|webm)$/i, '')}</h4>
              {item.caption && <p>{item.caption}</p>}
              <span className="gallery-card-category">{item.category}</span>
            </div>
          </div>
        ))}
        {!filteredItems.length && (
          <div className="admin-empty" style={{ gridColumn: 'span 4', margin: '40px auto' }}>
            इस केटेगरी में अभी कोई फ़ाइल नहीं है। एडमिन पैनल से अपलोड करें सा!
          </div>
        )}
      </div>

      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}><X size={24} /></button>

          <button
            className="lightbox-nav prev"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length) }}
          >
            <ChevronLeft size={36} />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {filteredItems[lightboxIndex].type === 'video' ? (
              <video
                src={filteredItems[lightboxIndex].src}
                controls
                autoPlay
                playsInline
                style={{ maxHeight: '80vh', maxWidth: '90vw' }}
              />
            ) : (
              <img
                src={filteredItems[lightboxIndex].src}
                alt={filteredItems[lightboxIndex].title}
                style={{ maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }}
              />
            )}
            <div className="lightbox-caption">
              <h3>{filteredItems[lightboxIndex].title}</h3>
              {filteredItems[lightboxIndex].caption && <p>{filteredItems[lightboxIndex].caption}</p>}
              <small>{filteredItems[lightboxIndex].category}</small>
            </div>
          </div>

          <button
            className="lightbox-nav next"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % filteredItems.length) }}
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}
    </div>
  )
}

function OrderStatusModal({ activeOrder, onRefresh, onClose, onClear }) {
  if (!activeOrder) return null
  const isPending = activeOrder.status === 'pending'
  const isAccepted = activeOrder.status === 'accepted'
  const isCompleted = activeOrder.status === 'completed'
  const isCancelled = activeOrder.status === 'cancelled'

  const getProgressWidth = () => {
    if (isPending) return '33%'
    if (isAccepted) return '66%'
    return '100%'
  }

  return (
    <div className="overlay modal-overlay">
      <div className="checkout-modal order-status-modal" style={{ maxWidth: '420px', background: 'var(--ink)', border: '2px solid var(--rust)', color: 'white' }}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <div className="checkout-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <span style={{ background: isCancelled ? '#ff4d4d' : isCompleted ? '#4caf50' : 'var(--marigold)', display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '50%', color: isCancelled || isCompleted ? 'white' : 'var(--ink)' }}>
            {isCancelled ? <X size={20} /> : isCompleted ? <ChefHat size={20} /> : <Loader2 className="spinner" size={20} />}
          </span>
          <div style={{ marginLeft: '12px' }}>
            <small style={{ color: 'var(--marigold)', letterSpacing: '0.05em', fontWeight: 'bold' }}>ORDER STATUS</small>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontFamily: 'var(--devanagari)' }}>ऑर्डर ट्रैकिंग</h3>
          </div>
        </div>

        <div className="order-status-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', margin: '15px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Order ID:</span>
            <strong style={{ color: 'var(--marigold)', fontFamily: 'var(--sans)' }}>{activeOrder.id}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem', fontFamily: 'var(--devanagari)' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>भुगतान का तरीका (Payment Mode):</span>
            <strong style={{ color: activeOrder.paymentMode === 'counter' ? '#81c784' : '#64b5f6' }}>
              {activeOrder.paymentMode === 'counter' ? '💵 काउंटर पर भुगतान (Pay at Counter)' : '💳 ऑनलाइन यूपीआई (UPI QR)'}
            </strong>
          </div>

          {activeOrder.members && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem', fontFamily: 'var(--devanagari)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>कुल सदस्य (Guests):</span>
              <strong style={{ color: '#fff' }}>👥 {activeOrder.members} लोग</strong>
            </div>
          )}

          {activeOrder.diningOption && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.84rem', fontFamily: 'var(--devanagari)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ऑर्डर प्रकार (Service Type):</span>
              <strong style={{ color: activeOrder.diningOption === 'takeaway' ? '#81c784' : 'var(--marigold)' }}>
                {activeOrder.diningOption === 'takeaway' ? '📦  पैक करवाएंगे (Takeaway)' : '🍽️ टेबल पर खाएंगे (Dine-in)'}
              </strong>
            </div>
          )}

          <div className="status-progress-container" style={{ margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '8px', fontFamily: 'var(--devanagari)' }}>
              <span style={{ color: isPending ? 'var(--marigold)' : '#888', fontWeight: isPending ? '700' : '400' }}>
                {activeOrder.paymentMode === 'counter' ? '1. काउंटर ऑर्डर' : '1. पेमेंट जांच'}
              </span>
              <span style={{ color: isAccepted ? 'var(--marigold)' : '#888', fontWeight: isAccepted ? '700' : '400' }}>2. भोजन तैयार</span>
              <span style={{ color: isCompleted ? '#4caf50' : '#888', fontWeight: isCompleted ? '700' : '400' }}>3. पूरा हुआ</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                background: isCancelled ? '#ff4d4d' : isCompleted ? '#4caf50' : 'var(--marigold)',
                width: getProgressWidth(),
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <h4 style={{ margin: '0 0 4px 0', color: isCancelled ? '#ff4d4d' : isCompleted ? '#4caf50' : 'var(--marigold)', fontSize: '1.05rem', fontFamily: 'var(--devanagari)', fontWeight: 'bold' }}>
              {isPending && 'पेमेंट वेरिफिकेशन पेंडिंग'}
              {isAccepted && (activeOrder.paymentMode === 'counter' ? 'काउंटर ऑर्डर स्वीकृत - रसोई में खाना तैयार हो रहा है!' : 'ऑर्डर स्वीकृत - भोजन तैयार हो रहा है!')}
              {isCompleted && 'ऑर्डर पूरा - खाना परोस/डिलीवर दिया गया है!'}
              {isCancelled && 'ऑर्डर रद्द कर दिया गया है'}
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'var(--devanagari)', lineHeight: '1.4' }}>
              {isPending && 'स्टाफ आपके यूपीआई पेमेंट की जांच कर रहा है। कृपया कुछ पल प्रतीक्षा करें।'}
              {isAccepted && (activeOrder.paymentMode === 'counter'
                ? `ऑर्डर रसोई में तैयार हो रहा है सा! भोजन प्राप्त करते समय बिलिंग काउंटर पर ₹${activeOrder.amount} का भुगतान Cash/Card से करें।`
                : 'पेमेंट वेरिफाई हो गया है। आपका खाना रसोई में गरम-गरम तैयार किया जा रहा है सा!')}
              {isCompleted && 'आपका भोजन डिलीवर हो चुका है। स्क्रैच कार्ड से अपना उपहार प्राप्त करें सा!'}
              {isCancelled && 'आपका ऑर्डर निरस्त कर दिया गया है। कोई पूछताछ हो तो काउंटर स्टाफ से संपर्क करें।'}
            </p>
          </div>

          {activeOrder.items && activeOrder.items.length > 0 && (
            <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--marigold)', display: 'block', marginBottom: '6px', fontFamily: 'var(--devanagari)' }}>ऑर्डर किए गए आइटम्स:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeOrder.items.map((item, idx) => (
                  <span key={idx} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
                    • {item.name} x {item.qty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button className="btn outline full" onClick={onRefresh} style={{ fontSize: '0.85rem', padding: '10px' }}>स्टेटस रिफ्रेश करें</button>
          {(isCompleted || isCancelled) && (
            <button className="btn primary full" onClick={onClear} style={{ fontSize: '0.85rem', padding: '10px' }}>नया ऑर्डर (Clear)</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const billFromUrl = new URLSearchParams(window.location.search).get('bill') || ''
  const [currentHash, setCurrentHash] = useState(() => window.location.hash)
  useEffect(() => {
    initSecurityShield()
    const handleHashChange = () => setCurrentHash(window.location.hash)
    const handleStorageChange = (e) => {
      if (!e.key || e.key === BILLS_KEY) setBills(getBills())
      if (!e.key || e.key === COUPON_KEY) setCoupons(getCoupons())
      if (!e.key || e.key === MENU_KEY) setMenuItems(getMenu())
      if (!e.key || e.key === ORDERS_KEY) setOrders(getOrders())
    }
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('storage', handleStorageChange)

    const runClean = async () => {
      if (!localStorage.getItem('majisa-v2-production-clean')) {
        await clearAllProductionTestData()
        setBills([])
        setOrders([])
        setCoupons([])
        setCustomers([])
        localStorage.setItem('majisa-v2-production-clean', 'true')
      }
      // Auto Keep-Alive heartbeat to keep Supabase active
      readAppState('ping', null).catch(() => { })
    }
    runClean()

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const [showFloatingButtons, setShowFloatingButtons] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 60) {
        setShowFloatingButtons(true)
      } else if (currentScrollY > lastScrollY + 4) {
        setShowFloatingButtons(false)
      } else if (currentScrollY < lastScrollY - 4) {
        setShowFloatingButtons(true)
      }
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [billPayOpen, setBillPayOpen] = useState(() => Boolean(billFromUrl))
  const [rewardOpen, setRewardOpen] = useState(false)
  const [staffOpen, setStaffOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === '#owner-admin' || window.location.pathname === '/admin')
  const [toast, setToast] = useState('')
  const [menuItems, setMenuItems] = useState(() => getMenu())
  const [siteMedia, setSiteMedia] = useState(() => getMedia())
  const [rewardData, setRewardData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('majisa-reward')) } catch { return null }
  })
  const [coupons, setCoupons] = useState(() => getCoupons())
  const [bills, setBills] = useState(() => getBills())
  const [orders, setOrders] = useState(() => getOrders())
  const [customers, setCustomers] = useState(() => getCustomers())
  const [galleryItems, setGalleryItems] = useState(() => getGallery())
  const [b2Credentials, setB2Credentials] = useState(() => getB2())
  const count = cart.reduce((sum, item) => sum + item.qty, 0)
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const [eventBookings, setEventBookings] = useState(() => getEventBookings())
  const [partyBookingOpen, setPartyBookingOpen] = useState(false)

  const submitEventBooking = (booking) => {
    const next = [booking, ...eventBookings]
    saveEventBookings(next)
    setEventBookings(next)
    setToast(`🎉 पार्टी/बन्दोला बुकिंग #${booking.id} दर्ज हो गई सा!`)
    setTimeout(() => setToast(''), 4000)
  }

  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem('majisa-active-order-id') || '')
  const [activeOrder, setActiveOrder] = useState(null)
  const [trackerOpen, setTrackerOpen] = useState(false)

  const checkActiveOrderStatus = async () => {
    if (!activeOrderId) return
    try {
      const remoteOrders = await readAppState('orders', getOrders())
      const found = remoteOrders.find(ord => ord.id === activeOrderId)
      if (found) {
        setActiveOrder(found)
        if (found.status === 'completed' && found.coupon) {
          const savedReward = localStorage.getItem('majisa-reward')
          let alreadySaved = false
          if (savedReward) {
            try {
              const parsed = JSON.parse(savedReward)
              if (parsed.code === found.coupon.code) {
                alreadySaved = true
              }
            } catch { }
          }
          if (!alreadySaved) {
            localStorage.setItem('majisa-reward', JSON.stringify(found.coupon))
            setRewardData(found.coupon)
            setRewardOpen(true)
            setToast('भोजन डिलीवर हो गया! आपका स्क्रैच कार्ड आ गया है सा।')
            setTimeout(() => setToast(''), 4000)
          }
        }
      } else {
        setActiveOrder(null)
        setActiveOrderId('')
        localStorage.removeItem('majisa-active-order-id')
      }
    } catch (err) {
      console.warn('Failed to check order status', err.message)
    }
  }

  useEffect(() => {
    if (activeOrderId) {
      checkActiveOrderStatus()
      const interval = setInterval(checkActiveOrderStatus, 15000)
      return () => clearInterval(interval)
    }
  }, [activeOrderId])

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    const loadSupabaseData = async () => {
      try {
        const localMenu = getMenu()
        const localCategories = getCategories()
        const localMedia = getMedia()
        const localCoupons = getCoupons()
        const localBills = getBills()
        const localOrders = getOrders()
        const localGallery = getGallery()
        const localB2 = getB2()
        const [
          menuExists, categoriesExist, mediaExists, billsExist, ordersExist, galleryExists, b2Exists,
          remoteMenu, remoteCategories, remoteMedia, remoteCoupons, remoteBills, remoteOrders, remoteGallery, remoteB2
        ] = await Promise.all([
          hasAppState('menu'),
          hasAppState('categories'),
          hasAppState('media'),
          hasAppState('bills'),
          hasAppState('orders'),
          hasAppState('gallery_items'),
          hasAppState('b2_credentials'),
          readAppState('menu', localMenu),
          readAppState('categories', localCategories),
          readAppState('media', localMedia),
          readCoupons(),
          readAppState('bills', localBills),
          readAppState('orders', localOrders),
          readAppState('gallery_items', localGallery),
          readAppState('b2_credentials', localB2),
        ])
        if (!active) return
        const firstMigration = !localStorage.getItem('majisa-supabase-migrated-v1')
        const finalMenu = menuExists ? remoteMenu : localMenu
        const finalCategories = categoriesExist ? remoteCategories : localCategories
        const finalMedia = mediaExists ? remoteMedia : localMedia
        const finalCoupons = remoteCoupons
        const finalBills = billsExist ? remoteBills : localBills
        const finalOrders = ordersExist ? remoteOrders : localOrders
        const finalGallery = galleryExists ? remoteGallery : localGallery
        const finalB2 = b2Exists ? remoteB2 : localB2
        await Promise.all([
          !menuExists ? writeAppState('menu', finalMenu) : Promise.resolve(),
          !categoriesExist ? writeAppState('categories', finalCategories) : Promise.resolve(),
          !mediaExists ? writeAppState('media', finalMedia) : Promise.resolve(),
          !billsExist ? writeAppState('bills', finalBills) : Promise.resolve(),
          !ordersExist ? writeAppState('orders', finalOrders) : Promise.resolve(),
          !galleryExists ? writeAppState('gallery_items', finalGallery) : Promise.resolve(),
          !b2Exists ? writeAppState('b2_credentials', finalB2) : Promise.resolve(),
          firstMigration && localCoupons.length && remoteCoupons.length === 0 ? writeCoupons(finalCoupons) : Promise.resolve(),
        ])
        localStorage.setItem('majisa-supabase-migrated-v1', 'true')
        localStorage.setItem(MENU_KEY, JSON.stringify(finalMenu))
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(finalCategories))
        localStorage.setItem(MEDIA_KEY, JSON.stringify(finalMedia))
        localStorage.setItem(COUPON_KEY, JSON.stringify(finalCoupons))
        localStorage.setItem(BILLS_KEY, JSON.stringify(finalBills))
        localStorage.setItem(ORDERS_KEY, JSON.stringify(finalOrders))
        localStorage.setItem(GALLERY_KEY, JSON.stringify(finalGallery))
        localStorage.setItem(B2_KEY, JSON.stringify(finalB2))
        setMenuItems(finalMenu)
        setSiteMedia(finalMedia)
        setCoupons(finalCoupons)
        setBills(finalBills)
        setOrders(finalOrders)
        setGalleryItems(finalGallery)
        setB2Credentials(finalB2)
      } catch (error) {
        console.warn('Supabase load failed, using local browser data', error.message)
      }
    }
    loadSupabaseData()
    return () => {
      active = false
    }
  }, [])

  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('majisa-customer-phone') || '')
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('majisa-customer-name') || '')
  const [walletOpen, setWalletOpen] = useState(false)
  const [pendingItemToAdd, setPendingItemToAdd] = useState(null)

  const addItem = (item) => {
    if (!customerPhone) {
      setPendingItemToAdd(item)
      setWalletOpen(true)
      setToast(`साइन-इन करें सा! ${item.name} जोड़ने के लिए मोबाइल नंबर वेरिफाई करें।`)
      setTimeout(() => setToast(''), 3000)
      return
    }
    setCart(current => {
      const found = current.find(cartItem => cartItem.id === item.id)
      return found ? current.map(cartItem => cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem) : [...current, { ...item, qty: 1 }]
    })
    setToast(`${item.name} ITEM ADD हो गया`)
    setTimeout(() => setToast(''), 2200)
  }

  const completePendingAdd = (item) => {
    if (!item) return
    setCart(current => {
      const found = current.find(cartItem => cartItem.id === item.id)
      return found ? current.map(cartItem => cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem) : [...current, { ...item, qty: 1 }]
    })
    setToast(`साइन-इन सफल! ${item.name} कार्ट में जुड़ गया सा`)
    setTimeout(() => setToast(''), 3000)
    setPendingItemToAdd(null)
  }

  const beginOrder = () => {
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' })
  }
  const issueCoupon = (payment = {}, showReward = false) => {
    const reward = pickReward()
    const code = `MJC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const created = new Date().toISOString()
    const expiresAt = new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const data = { reward, code, created, expiresAt, amount: payment.amount || total || 289, mobile: payment.mobile || '', upiRef: payment.upiRef || '', redeemedAt: null }
    const updatedCoupons = [data, ...getCoupons()]
    localStorage.setItem('majisa-reward', JSON.stringify(data))
    saveCoupons(updatedCoupons)
    setCoupons(updatedCoupons)
    if (showReward) {
      setRewardData(data)
      setRewardOpen(true)
    }
    return data
  }

  const sendOrderEmailNotification = (order) => {
    const emailTarget = order.email || 'customer@majisacafebalotra.com'
    console.log('Sending Order Notification Email to:', emailTarget, order)
    const modeText = order.paymentMode === 'counter' ? 'काउंटर पर भुगतान' : 'ऑनलाइन यूपीआई'
    setToast(`📧 ऑर्डर #${order.id} कन्फर्म! रसीद व सूचना ईमेल (${emailTarget}) पर भेज दी गई है सा।`)
    setTimeout(() => setToast(''), 5000)
  }

  const submitCartPayment = (payment = {}) => {
    const isCounter = payment.paymentMode === 'counter'
    const orderMobile = (payment.mobile || customerPhone || '').replace(/\D/g, '')
    const orderName = payment.name || customerName || 'Guest Customer'

    if (orderMobile) {
      localStorage.setItem('majisa-customer-phone', orderMobile)
      localStorage.setItem('majisa-customer-name', orderName)
      setCustomerPhone(orderMobile)
      setCustomerName(orderName)
      registerOrUpdateCustomer(orderName, orderMobile)
    }

    const order = {
      id: `MJC-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: payment.amount || total || 289,
      mobile: orderMobile,
      name: orderName,
      email: payment.email || '',
      members: payment.members || 2,
      paymentMode: payment.paymentMode || 'counter',
      upiRef: isCounter ? 'PAY_AT_COUNTER' : (payment.upiRef || ''),
      status: isCounter ? 'accepted' : 'pending',
      diningOption: payment.diningOption || 'dine-in',
      created: new Date().toISOString(),
      items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
    }
    const nextOrders = [order, ...orders]
    saveOrders(nextOrders)
    setOrders(nextOrders)
    localStorage.setItem('majisa-active-order-id', order.id)
    setActiveOrderId(order.id)
    setActiveOrder(order)
    setCheckoutOpen(false)
    setCart([])
    setTrackerOpen(true)

    sendOrderEmailNotification(order)
  }

  const submitBillPayment = (bill, payment) => {
    const nextBills = bills.map(item => item.id === bill.id ? { ...item, ...payment, status: 'submitted', submittedAt: new Date().toISOString() } : item)
    saveBills(nextBills)
    setBills(nextBills)
  }

  const approveBill = (bill) => {
    if (bill.status !== 'submitted') return
    const coupon = issueCoupon({ amount: bill.amount, mobile: bill.mobile || bill.customer_phone || customerPhone, upiRef: bill.upiRef })
    const nextBills = bills.map(item => item.id === bill.id ? { ...item, status: 'rewarded', couponCode: coupon.code, rewardedAt: new Date().toISOString() } : item)
    saveBills(nextBills)
    setBills(nextBills)
    setToast(`${bill.id} verify ho gaya — coupon ${coupon.code} issue hua.`)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <>
      {currentHash === '#gallery-page' ? (
        <GalleryPage galleryItems={galleryItems} onClose={() => window.location.hash = ''} />
      ) : (
        <>
          <Navbar count={count} onCart={() => setCartOpen(true)} onWallet={() => setWalletOpen(true)} onPartyBooking={() => setPartyBookingOpen(true)} customerPhone={customerPhone} />
          <main>
            <Hero onOrder={beginOrder} onPartyBooking={() => setPartyBookingOpen(true)} media={siteMedia} />
            <Marquee />
            <Story media={siteMedia} />
            <MenuSection menu={menuItems} onAdd={addItem} />
            <Rewards />
            <Gallery media={siteMedia} />
            <Testimonials />
            <Visit />
          </main>
          <Footer />
        </>
      )}
      {toast && <div className="toast"><Check /> {toast}</div>}
      {SHOW_FLOATING_REWARD_BUTTON && rewardData && !rewardOpen && (
        <button className="saved-reward" onClick={() => setRewardOpen(true)}>
          <Gift /><span>मेरा इनाम</span>
        </button>
      )}
      <button className={`staff-check ${!showFloatingButtons ? 'hidden-on-scroll' : ''}`} onClick={() => setStaffOpen(true)}><Ticket /><span>Coupon Check</span></button>
      <button className={`staff-check bill-pay-button ${!showFloatingButtons ? 'hidden-on-scroll' : ''}`} onClick={() => setBillPayOpen(true)}><ShoppingBag /><span>Bill Pay</span></button>
      {cartOpen && <CartDrawer cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }} />}
      {checkoutOpen && <Checkout total={total || 289} customerName={customerName} customerPhone={customerPhone} onClose={() => setCheckoutOpen(false)} onSuccess={submitCartPayment} />}
      {walletOpen && (
        <CustomerWalletModal
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerName={customerName}
          setCustomerName={setCustomerName}
          coupons={coupons}
          orders={orders}
          bills={bills}
          onClose={() => { setWalletOpen(false); setPendingItemToAdd(null); }}
          onApplyCoupon={(c) => { setToast(`कूपन ${c.code} (${c.reward?.label}) वॉलेट से चुना गया!`); setTimeout(() => setToast(''), 3500) }}
          pendingItemToAdd={pendingItemToAdd}
          onCompletePendingAdd={completePendingAdd}
        />
      )}
      {partyBookingOpen && (
        <PartyBookingModal
          menu={menuItems}
          onClose={() => setPartyBookingOpen(false)}
          onSubmit={submitEventBooking}
          customerPhone={customerPhone}
          customerName={customerName}
        />
      )}
      {billPayOpen && <BillPayModal bills={bills} setBills={setBills} coupons={coupons} onClose={() => setBillPayOpen(false)} onSubmit={submitBillPayment} initialBillId={billFromUrl} customerPhone={customerPhone} />}
      {rewardOpen && rewardData && <RewardModal reward={rewardData.reward} code={rewardData.code} onClose={() => setRewardOpen(false)} />}
      {staffOpen && <CouponVerifier coupons={coupons} setCoupons={setCoupons} onClose={() => setStaffOpen(false)} customerOnly />}
      {adminOpen && <AdminPanel menu={menuItems} setMenu={setMenuItems} coupons={coupons} setCoupons={setCoupons} media={siteMedia} setMedia={setSiteMedia} bills={bills} setBills={setBills} onApproveBill={approveBill} galleryItems={galleryItems} setGalleryItems={setGalleryItems} b2Credentials={b2Credentials} setB2Credentials={setB2Credentials} orders={orders} setOrders={setOrders} customers={customers} setCustomers={setCustomers} eventBookings={eventBookings} setEventBookings={setEventBookings} onClose={() => setAdminOpen(false)} />}
      {activeOrderId && (
        <button
          className="order-tracker-btn"
          onClick={() => { checkActiveOrderStatus(); setTrackerOpen(true); }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: '45',
            background: 'var(--marigold)',
            border: '2px solid var(--rust)',
            color: 'var(--ink)',
            borderRadius: '24px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--devanagari)',
            fontWeight: '700',
            fontSize: '0.88rem',
            boxShadow: '0 8px 24px rgba(172, 71, 33, 0.35)',
            cursor: 'pointer',
            animation: 'gift-pulse 2s infinite'
          }}
        >
          <Loader2 className="spinner" size={16} />
          <span>ऑर्डर ट्रैक करें ({activeOrderId.split('-').pop()})</span>
        </button>
      )}
      {trackerOpen && activeOrder && (
        <OrderStatusModal
          activeOrder={activeOrder}
          onRefresh={checkActiveOrderStatus}
          onClose={() => setTrackerOpen(false)}
          onClear={() => {
            setActiveOrderId('');
            setActiveOrder(null);
            localStorage.removeItem('majisa-active-order-id');
            setTrackerOpen(false);
          }}
        />
      )}
    </>
  )
}
