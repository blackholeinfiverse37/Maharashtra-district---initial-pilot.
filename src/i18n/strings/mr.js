// Machine-drafted, pending native review.
// The dashboard's own words in Marathi: same keys as en.js. Keep {name} placeholders exactly as they are.
const mr = {
  // Page
  "app.title": "AIAIC जिल्हा कृषी माहिती डॅशबोर्ड",
  "app.subtitle": "शेतीची माहिती - {state}",
  "app.englishNote": "काही मजकूर इंग्रजीत दाखवला आहे.",
  "app.reviewNote": "भाषांतराची तपासणी सुरू आहे.",
  "app.listError": "जिल्हा किंवा पिकांची यादी उघडता आली नाही: {error}",
  "app.uncalibratedLead": "कृषी तज्ज्ञांनी अजून याला मान्यता दिलेली नाही. फक्त मार्गदर्शन म्हणून वापरा.",
  "app.idle": "तुमच्या भागाचा सल्ला पाहण्यासाठी वर जिल्हा आणि पीक निवडा",
  "app.loadError": "माहिती उघडता आली नाही. कृपया दुसरा जिल्हा किंवा पीक निवडून पाहा.",

  // Dropdowns
  "field.language": "भाषा",
  "field.state": "राज्य",
  "field.district": "जिल्हा",
  "field.crop": "पीक",
  "field.selectDistrict": "जिल्हा निवडा",
  "field.selectCrop": "पीक निवडा",
  "field.chooseDistrictFirst": "आधी जिल्हा निवडा",

  // State names
  "state.maharashtra": "महाराष्ट्र",
  "state.madhya_pradesh": "मध्य प्रदेश",

  // Status bar
  "status.idle": "सल्ला पाहण्यासाठी जिल्हा आणि पीक निवडा.",
  "status.loading": "माहिती येत आहे...",
  "status.success": "माहिती: {district} · {crop}",
  "status.error": "माहिती उघडता आली नाही. कृपया पुन्हा प्रयत्न करा.",

  // Shared
  "common.whereFrom": "ही माहिती कुठून: {source}",
  "common.dataFrom": "{date} रोजीची माहिती",
  "common.dataFromTo": "{from} ते {to} पर्यंतची माहिती",
  "common.lastChecked": "शेवटची तपासणी: {date}",
  "common.thisDistrict": "तुमच्या",
  "common.unknown": "माहीत नाही",
  "common.perQuintal": "प्रति क्विंटल",
  "common.pricePerQuintal": "₹{price} प्रति क्विंटल",

  // How old a source is
  "fresh.fresh": "ताजी",
  "fresh.aging": "थोडी जुनी",
  "fresh.stale": "जुनी",

  // At a glance
  "glance.title": "थोडक्यात",
  "glance.whereToSell": "कुठे विकायचे",
  "glance.sellOrStore": "आता विकायचे की साठवायचे?",
  "glance.water": "पाणी",
  "glance.talukaHint": "या जिल्ह्यातील काही तालुक्यांची स्थिती जास्त वाईट आहे. खाली पाण्याच्या कार्डमध्ये तुमचा तालुका पाहा.",

  // Harvest card
  "harvest.title": "{district} जिल्ह्यात {crop} या पिकाचे उत्पादन किती होते?",
  "harvest.noData": "या निवडीसाठी उत्पादनाची माहिती नाही.",
  "harvest.unit": "टन प्रति हेक्टर",
  "harvest.hectareNote": "(1 हेक्टर म्हणजे सुमारे 2.5 एकर)",
  "harvest.noRecord": "नोंद सापडली नाही",
  "harvest.missing": "सरकारी पीक आकडेवारीत {district} जिल्ह्यासाठी {crop} या पिकाचे उत्पादन दिलेले नाही.",
  "harvest.coversOnly": "या जिल्ह्यासाठी यात फक्त ही पिके आहेत: {crops}.",
  "harvest.notAbsent": "नोंद नसली म्हणजे हे पीक इथे घेतले जात नाही असे नाही.",
  "harvest.aboutData": "या माहितीबद्दल: {note}",
  "harvest.source": "DES / MoSPI (सरकारी पीक आकडेवारी)",
  "harvest.dataCovers": "माहितीचा कालावधी: {period} (वर्षातून एकदा बदलते)",

  // Price card
  "price.title": "{district} जिल्ह्यात {crop} या पिकाला सर्वात चांगला भाव कुठे आहे?",
  "price.noData": "या निवडीसाठी भावाची माहिती नाही.",
  "price.quintalNote": "(1 क्विंटल = 100 किलो)",
  "price.noRecent": "अलीकडचा भाव सापडला नाही",
  "price.payingMost": "सर्वात जास्त भाव देणारा बाजार: {mandi}",
  "price.beforeTransport": "या भावात वाहतुकीचा खर्च धरलेला नाही.",
  "price.priceFrom": "भावाची तारीख: {date}",

  // Water card
  "water.title": "{district} जिल्ह्यात किती भूजल उपसले जात आहे?",
  "water.noData": "या निवडीसाठी भूजलाची माहिती नाही.",
  "water.refill": "दर वर्षी पावसाने जमिनीत पाणी भरते. त्यापैकी सुमारे {pct}% पाणी उपसले जात आहे.",
  "water.category": "जिल्ह्याची श्रेणी (किती भूजल उपसले जाते त्यावरून ठरवलेली): {category}",
  "water.notAvailable": "माहिती नाही",
  "water.abstained": "इथे पाण्याचा सल्ला नाही. माहिती खूप जुनी आहे, तिच्यावर विसंबता येत नाही.",
  "water.dataIsFrom": "माहितीची तारीख: {date}",
  "water.stale": "हे सर्वात नवीन सरकारी सर्वेक्षण आहे, पण जुने आहे. काही करण्याआधी तुमच्या भागातील स्थिती पाहून घ्या.",
  "water.talukaIntro": "जिल्ह्याचा आकडा तुमच्या तालुक्याची स्थिती लपवू शकतो. संपूर्ण {district} जिल्हा '{category}' आहे, पण ही सरासरी आहे.",
  "water.talukaAssessmentOn": "{date} रोजीच्या CGWB मूल्यांकनात या तालुक्यांची स्थिती जास्त वाईट आहे.",
  "water.talukaAssessment": "CGWB मूल्यांकनात या तालुक्यांची स्थिती जास्त वाईट आहे.",
  "water.talukaGroup": "{label}: {names}.",
  "water.talukaOutro": "तुमची शेती यापैकी एखाद्या तालुक्यात असेल, तर जिल्ह्याचे उत्तर तुमच्या पाण्याला लागू होत नाही.",
  "water.talukaNoneWorse": "या जिल्ह्यातील कोणताही तालुका जिल्ह्याच्या सरासरीपेक्षा वाईट श्रेणीत नाही.",
  // Groundwater category, used for the district and for each taluka (the backend's code -> a plain word)
  "water.cat.safe": "सुरक्षित",
  "water.cat.semi_critical": "अर्ध-गंभीर",
  "water.cat.critical": "गंभीर",
  "water.cat.over_exploited": "अतिउपसा",
  "water.cat.saline": "खारट",

  // Storage card
  "storage.title": "आता विकायचे, की साठवून थांबायचे?",
  "storage.noData": "या पिकासाठी अजून विकायचे की साठवायचे याचा सल्ला नाही.",
  "storage.sample": "नमुना हिशोब",
  "storage.guideOnly": "फक्त मार्गदर्शन. विकण्याआधी जवळच्या बाजार समितीत भाव विचारून घ्या.",
  "storage.abstained": "इथे विकायचे की साठवायचे याचा सल्ला नाही. माहितीवर पुरेसा विश्वास ठेवता येत नाही.",
  "storage.inSample": "या नमुना हिशोबात: ",
  "storage.whatToDo": "काय करावे: ",
  "storage.latestPrice": "प्रति क्विंटल (100 किलो) ताजा भाव:",
  "storage.fixedBand": "चांगल्या किंवा कमी दिवसाचा भाव दाखवलेला नाही: याचा खरा चढ-उतार मोजलेला नाही, फक्त याच एका भावाभोवती ठरलेली {band} आहे.",
  "storage.band": "मर्यादा",
  "storage.expected": "प्रति क्विंटल (100 किलो) अपेक्षित भाव:",
  "storage.betterDay": "चांगल्या दिवशी",
  "storage.typicalDay": "नेहमीच्या दिवशी",
  "storage.weakerDay": "कमी भावाच्या दिवशी",
  "storage.priceFrom": "इथे वापरलेला भाव {mandi} या बाजाराचा आहे, {district} जिल्ह्याचा नाही.",
  "storage.yourDistrict": "तुमच्या",
  "storage.referenceMarket": "एक तुलनेचा बाजार",
  "storage.na": "उपलब्ध नाही",

  // Weather card
  "weather.title": "या आठवड्यात हवामान कसे राहील?",
  "weather.noAnswerTitle": "हवामानाचे काय?",
  "weather.highest": "कमाल {temp}°C",
  "weather.rainChance": "पावसाची शक्यता {pct}%",
  "weather.readOn": "हवामान अंदाज {date} रोजी घेतला",
  "weather.kind.dry": "कोरडे",
  "weather.kind.some_chance": "पावसाची थोडी शक्यता",
  "weather.kind.rain_likely": "पाऊस पडण्याची शक्यता",

  // Background card
  "bg.title": "अधिक माहिती (जुनी आकडेवारी)",
  "bg.enam": "{district} जिल्ह्यातील e-NAM वरील बाजार समित्या",
  "bg.soil": "{district} जिल्ह्यातील जमिनीतील ओलावा",

  // Pie chart
  "pie.title": "{district} जिल्ह्यात शेतजमीन कोणत्या पिकांखाली आहे?",
  "pie.units": "लाख हेक्टरमध्ये (1 लाख = 1,00,000)",
  "pie.cropMissing": "या सरकारी आकडेवारीत {crop} नाही.",
  "pie.source": "DES / MoSPI",
  "pie.dataCovers": "माहितीचे वर्ष {year}",
  "pie.tooltip": "{value} लाख हेक्टर",
};

export default mr;
