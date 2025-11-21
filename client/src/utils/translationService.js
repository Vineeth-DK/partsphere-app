const DICTIONARY = {
  HI: {
    "Equipments": "उपकरण",
    "Parts": "पुर्जे",
    "Search": "खोजें...",
    "Login": "लॉग इन",
    "Sell": "बेचें",
    "Cart": "कार्ट",
    "Heavy Machinery": "भारी मशीनरी",
    "Spare Parts": "स्पेयर पार्ट्स",
    "Add to Cart": "कार्ट में डालें",
    "Verified Owner": "सत्यापित मालिक",
    "Responds": "प्रतिक्रिया समय",
    "Checkout": "चेकआउट",
    "Total": "कुल",
    "Empty Cart": "आपका कार्ट खाली है"
  },
  KN: {
    "Equipments": "ಉಪಕರಣಗಳು",
    "Parts": "ಭಾಗಗಳು",
    "Search": "ಹುಡುಕಿ...",
    "Login": "ಲಾಗಿನ್",
    "Sell": "ಮಾರಾಟ",
    "Cart": "ಕಾರ್ಟ್",
    "Heavy Machinery": "ಭಾರೀ ಯಂತ್ರೋಪಕರಣಗಳು",
    "Spare Parts": "ಬಿಡಿ ಭಾಗಗಳು",
    "Add to Cart": "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
    "Verified Owner": "ಪರಿಶೀಲಿಸಿದ ಮಾಲೀಕ",
    "Responds": "ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ",
    "Checkout": "ಪಾವತಿಸಿ",
    "Total": "ಒಟ್ಟು",
    "Empty Cart": "ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ"
  }
};

export const getLabel = (text, lang) => {
  if (lang === 'EN') return text;
  return DICTIONARY[lang]?.[text] || text;
};

export const translateText = async (text, targetLang) => {
  if (targetLang === 'EN') return text;
  try {
    const langPair = `en|${targetLang === 'HI' ? 'hi' : 'kn'}`;
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`);
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error("Translation failed", error);
    return text;
  }
};