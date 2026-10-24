// Machine-drafted, pending native review.
// The dashboard's own words in Hindi: same keys as en.js. Keep {name} placeholders exactly as they are.
const hi = {
  // Page
  "app.title": "AIAIC ज़िला कृषि जानकारी डैशबोर्ड",
  "app.subtitle": "खेती की जानकारी - {state}",
  "app.englishNote": "कुछ बातें अंग्रेज़ी में दिखाई गई हैं।",
  "app.reviewNote": "अनुवाद की जाँच चल रही है।",
  "app.listError": "ज़िले या फसल की सूची नहीं खुल पाई: {error}",
  "app.listErrorPlain": "ज़िले या फसल की सूची नहीं खुल पाई।",
  "app.uncalibratedLead": "कृषि विशेषज्ञों ने अभी इसे मंज़ूरी नहीं दी है। इसे सिर्फ़ मार्गदर्शन के लिए देखें।",
  "app.idle": "अपने इलाके की सलाह देखने के लिए ऊपर ज़िला और फसल चुनें",
  "app.loadError": "जानकारी नहीं खुल पाई। कृपया दूसरा ज़िला या फसल चुनकर देखें।",

  // Dropdowns
  "field.language": "भाषा",
  "field.state": "राज्य",
  "field.district": "ज़िला",
  "field.crop": "फसल",
  "field.selectDistrict": "ज़िला चुनें",
  "field.selectCrop": "फसल चुनें",
  "field.chooseDistrictFirst": "पहले ज़िला चुनें",

  // State names
  "state.maharashtra": "महाराष्ट्र",
  "state.madhya_pradesh": "मध्य प्रदेश",

  // Status bar
  "status.idle": "सलाह देखने के लिए ज़िला और फसल चुनें।",
  "status.loading": "जानकारी आ रही है...",
  "status.success": "{district} · {crop} की जानकारी",
  "status.error": "जानकारी नहीं खुल पाई। कृपया फिर से कोशिश करें।",

  // Shared
  "common.whereFrom": "यह जानकारी कहाँ से: {source}",
  "common.dataFrom": "{date} की जानकारी",
  "common.dataFromTo": "{from} से {to} तक की जानकारी",
  "common.lastChecked": "आख़िरी बार जाँचा गया: {date}",
  "common.thisDistrict": "आपके",
  "common.unknown": "पता नहीं",
  "common.perQuintal": "प्रति क्विंटल",
  "common.pricePerQuintal": "₹{price} प्रति क्विंटल",
  "common.englishOnly": "और जानकारी, केवल अंग्रेज़ी में ({n})",

  // A source's short name (by its id)
  "source.agmarknet_daily_prices": "Agmarknet (सरकारी मंडी भाव)",
  "source.cgwb_groundwater": "CGWB (केंद्रीय भूजल बोर्ड)",
  "source.cgwb_groundwater_mp": "CGWB (केंद्रीय भूजल बोर्ड)",

  // How old a source is
  "fresh.fresh": "ताज़ा",
  "fresh.aging": "थोड़ी पुरानी",
  "fresh.stale": "पुरानी",

  // At a glance
  "glance.title": "एक नज़र में",
  "glance.whereToSell": "कहाँ बेचें",
  "glance.sellOrStore": "अभी बेचें या रखें?",
  "glance.water": "पानी",
  "glance.talukaHint": "इस ज़िले के कुछ तालुकों में हालत ज़्यादा ख़राब है। नीचे पानी वाले कार्ड में अपना तालुका देखें।",

  // Harvest card
  "harvest.title": "{district} ज़िले में {crop} की पैदावार कितनी है?",
  "harvest.noData": "इस चुनाव के लिए पैदावार की जानकारी नहीं है।",
  "harvest.unit": "टन प्रति हेक्टेयर",
  "harvest.hectareNote": "(1 हेक्टेयर लगभग 2.5 एकड़ होता है)",
  "harvest.noRecord": "कोई आँकड़ा नहीं मिला",
  "harvest.missing": "सरकारी फसल आँकड़ों में {district} ज़िले के {crop} की पैदावार नहीं दी गई है।",
  "harvest.coversOnly": "इस ज़िले के लिए इनमें सिर्फ़ ये फसलें हैं: {crops}।",
  "harvest.notAbsent": "आँकड़ा न होने का मतलब यह नहीं कि यहाँ यह फसल नहीं उगाई जाती।",
  "harvest.aboutData": "इस जानकारी के बारे में: {note}",
  "harvest.source": "DES / MoSPI (सरकारी फसल आँकड़े)",
  "harvest.dataCovers": "जानकारी का समय: {period} (साल में एक बार बदलती है)",

  // Price card
  "price.title": "{district} ज़िले में {crop} का सबसे अच्छा भाव कहाँ है?",
  "price.noData": "इस चुनाव के लिए भाव की जानकारी नहीं है।",
  "price.quintalNote": "(1 क्विंटल = 100 किलो)",
  "price.noRecent": "हाल का कोई भाव नहीं मिला",
  "price.payingMost": "सबसे ज़्यादा भाव देने वाली मंडी: {mandi}",
  "price.beforeTransport": "इस भाव में ढुलाई का ख़र्च नहीं जोड़ा गया है।",
  "price.priceFrom": "भाव की तारीख़: {date}",

  // Top 5 mandis card
  "top5.title": "किन मंडियों में सबसे ज़्यादा भाव मिल रहा है?",
  "top5.recommended": "सुझाई गई मंडी",
  "top5.inYourDistrict": "आपके ज़िले में",
  "top5.aboutKm": "लगभग {km} किमी",
  "top5.place": "{district} ज़िला",
  "top5.priceOn": "{date} का भाव",
  "top5.showMore": "और दिखाएँ",
  "top5.showLess": "कम दिखाएँ",
  "top5.otherDayNote": "दूसरे दिनों के भाव। AIAIC ने इनकी तुलना ऊपर की मंडियों से नहीं की।",

  // Transport cost card
  "trip.title": "आपकी मंडी से ज़्यादा भाव देने वाली मंडियों तक ढुलाई",
  "trip.introOwn": "दूसरे ज़िलों की ये मंडियाँ आपके ज़िले की सबसे ज़्यादा भाव देने वाली मंडी {base} से ज़्यादा भाव देती हैं।",
  "trip.introNearest": "इस भाव डेटा में आपके ज़िले की कोई मंडी नहीं है। ये मंडियाँ सबसे नज़दीकी मंडी {base} (लगभग {km} किमी दूर) से ज़्यादा भाव देती हैं।",
  "trip.paysMore": "प्रति क्विंटल ₹{adv} ज़्यादा भाव",
  "trip.worthIf": "जाना तभी फ़ायदेमंद है जब 1 क्विंटल ले जाने का ख़र्च हर किमी ₹{rate} से कम हो।",
  "trip.district": "{district} ज़िला",
  "trip.aboutKm": "लगभग {km} किमी दूर",
  "trip.note": "दूरी ज़िलों के केंद्रों के बीच सीधी रेखा में है। सड़क की दूरी ज़्यादा होती है, इसलिए अपना असली ढुलाई ख़र्च ज़रूर देखें।",

  // Warehouses card
  "wh.title": "आपके ज़िले में और आसपास के गोदाम",
  "wh.at": "{address} पर गोदाम",
  "wh.noName": "पंजीकृत गोदाम",
  "wh.capacity": "क्षमता: {capacity} टन",
  "wh.validUpto": "पंजीकरण मान्य: {date} तक",
  "wh.aboutKm": "लगभग {km} किमी (सीधी दूरी)",
  "wh.showMore": "और दिखाएँ",
  "wh.showLess": "कम दिखाएँ",
  "wh.note": "{date} तक के पंजीकृत गोदाम। भंडारण से पहले गोदाम से बात करके पक्का कर लें।",
  "wh.source": "WDRA (भंडारण विकास और विनियामक प्राधिकरण)",
  "wh.none": "इस ज़िले में या आसपास कोई सक्रिय पंजीकृत गोदाम सूची में नहीं है।",

  // Water card
  "water.title": "{district} ज़िले में कितना भूजल निकाला जा रहा है?",
  "water.noData": "इस चुनाव के लिए भूजल की जानकारी नहीं है।",
  "water.refill": "हर साल बारिश से ज़मीन में पानी भरता है। उसमें से लगभग {pct}% पानी निकाला जा रहा है।",
  "water.category": "ज़िले की श्रेणी (कितना भूजल निकाला जाता है, उससे तय की गई): {category}",
  "water.notAvailable": "जानकारी नहीं है",
  "water.abstained": "यहाँ पानी की कोई सलाह नहीं है। जानकारी बहुत पुरानी है, उस पर भरोसा नहीं किया जा सकता।",
  "water.dataIsFrom": "जानकारी की तारीख़: {date}",
  "water.stale": "यह सबसे नया सरकारी सर्वे है, लेकिन पुराना है। कुछ करने से पहले अपने इलाके की हालत देख लें।",
  "water.talukaIntro": "ज़िले का आँकड़ा आपके तालुके की हालत छिपा सकता है। पूरा {district} ज़िला '{category}' है, लेकिन यह औसत है।",
  "water.talukaAssessmentOn": "{date} के CGWB आकलन में इन तालुकों की हालत ज़्यादा ख़राब है।",
  "water.talukaAssessment": "CGWB आकलन में इन तालुकों की हालत ज़्यादा ख़राब है।",
  "water.talukaGroup": "{label}: {names}।",
  "water.talukaOutro": "अगर आपकी खेती इनमें से किसी तालुके में है, तो ज़िले का जवाब आपके पानी पर लागू नहीं होता।",
  "water.talukaNoneWorse": "इस ज़िले का कोई भी तालुका ज़िले के औसत से ज़्यादा ख़राब श्रेणी में नहीं है।",
  // Groundwater category, used for the district and for each taluka (the backend's code -> a plain word)
  "water.cat.safe": "सुरक्षित",
  "water.cat.semi_critical": "कुछ गंभीर",
  "water.cat.critical": "गंभीर",
  "water.cat.over_exploited": "बहुत ज़्यादा दोहन",
  "water.cat.saline": "खारा",

  // Storage card
  "storage.title": "अभी बेचें, या रखकर इंतज़ार करें?",
  "storage.noData": "इस फसल के लिए अभी बेचने या रखने की सलाह नहीं है।",
  "storage.sample": "नमूने का हिसाब",
  "storage.guideOnly": "सिर्फ़ मार्गदर्शन। बेचने से पहले अपनी नज़दीकी मंडी में भाव पूछ लें।",
  "storage.abstained": "यहाँ बेचने या रखने की सलाह नहीं है। जानकारी पर पूरा भरोसा नहीं किया जा सकता।",
  "storage.inSample": "इस नमूने के हिसाब में: ",
  "storage.whatToDo": "क्या करें: ",
  "storage.latestPrice": "प्रति क्विंटल (100 किलो) ताज़ा भाव:",
  "storage.fixedBand": "अच्छे या कमज़ोर दिन का भाव नहीं दिखाया गया: इसका असली उतार-चढ़ाव नहीं मापा गया, बस इसी एक भाव के आसपास तय {band} है।",
  "storage.band": "दायरा",
  "storage.expected": "प्रति क्विंटल (100 किलो) अनुमानित भाव:",
  "storage.betterDay": "अच्छे दिन",
  "storage.typicalDay": "आम दिन",
  "storage.weakerDay": "कमज़ोर दिन",
  "storage.priceFrom": "यहाँ इस्तेमाल किया गया भाव {mandi} का है, {district} ज़िले का नहीं।",
  "storage.priceFromMedian": "यह भाव {mandi} ({district} ज़िला) का है, जो पूरे राज्य में इस फ़सल के बीच के भाव वाली मंडी है। यह ठीक आपके ज़िले का भाव नहीं है।",
  "storage.priceFromMedianNoPlace": "यह भाव {mandi} का है, जो पूरे राज्य में इस फ़सल के बीच के भाव वाली मंडी है। यह ठीक आपके ज़िले का भाव नहीं है।",
  "storage.yourDistrict": "आपके",
  "storage.referenceMarket": "एक तुलना वाली मंडी",
  "storage.na": "उपलब्ध नहीं",

  // Weather card
  "weather.title": "इस हफ़्ते मौसम कैसा रहेगा?",
  "weather.noAnswerTitle": "मौसम का क्या?",
  "weather.highest": "सबसे ज़्यादा {temp}°C",
  "weather.rainChance": "बारिश की संभावना {pct}%",
  "weather.readOn": "पूर्वानुमान {date} को लिया गया",
  "weather.kind.dry": "सूखा",
  "weather.kind.some_chance": "बारिश की थोड़ी संभावना",
  "weather.kind.rain_likely": "बारिश होने की संभावना",

  // Weather map card
  "wmap.title": "हर ज़िले में मौसम कैसा है?",
  "wmap.bubbleTitle": "{district}: सबसे ज़्यादा {temp}°C, {word}",
  "wmap.detail": "{district}: सबसे ज़्यादा {temp}°C, {days} में से {dry} दिन सूखे।",
  "wmap.nextRain": "{date} को बारिश की संभावना।",
  "wmap.noRain": "इन {days} दिनों में बारिश की संभावना नहीं।",
  "wmap.tempNote": "हर पिन के पास लिखी संख्या इस हफ़्ते का सबसे ज़्यादा अनुमानित तापमान है (°C में)।",
  "wmap.switchLabel": "नक्शा चुनें",
  "wmap.switchWeather": "मौसम",
  "wmap.switchWarehouses": "गोदाम",
  "wmap.whTitle": "पंजीकृत गोदाम कहाँ हैं?",
  "wmap.whPinTitle": "{district}: {count} पंजीकृत गोदाम, {capacity} टन",
  "wmap.whSome": "पंजीकृत गोदाम हैं",
  "wmap.whNone": "सूची में कोई नहीं",
  "wmap.whNote": "हर पिन के पास लिखी संख्या उस ज़िले के सक्रिय पंजीकृत गोदामों की संख्या है।",
  "wmap.whDetail": "{district}: {count} सक्रिय पंजीकृत गोदाम, कुल {capacity} टन।",

  // Background card
  "bg.title": "और जानकारी (पुराने आँकड़े)",
  "bg.enam": "{district} ज़िले की e-NAM वाली मंडियाँ",
  "bg.soil": "{district} ज़िले में मिट्टी की नमी",
  "bg.wdra": "पंजीकृत गोदामों की सूची: {source}, {date} तक",
  "bg.enamSource": "e-NAM निर्देशिका (SFAC)",
  "bg.soilSource": "NWIC (राष्ट्रीय जल सूचना विज्ञान केंद्र)",

  // Pie chart
  "pie.title": "{district} ज़िले में खेती की ज़मीन किन फसलों में है?",
  "pie.units": "लाख हेक्टेयर में (1 लाख = 1,00,000)",
  "pie.cropMissing": "इन सरकारी आँकड़ों में {crop} नहीं है।",
  "pie.source": "DES / MoSPI",
  "pie.dataCovers": "जानकारी का साल {year}",
  "pie.tooltip": "{value} लाख हेक्टेयर",
};

export default hi;
