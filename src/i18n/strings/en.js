// The dashboard's own words, in English. This file is the reference: every other language has the same keys.
// {name} is filled in when the text is shown (a district, crop, date, number…). Text from the backend is never here.
const en = {
  // Page
  "app.title": "AIAIC District Intelligence Dashboard",
  "app.subtitle": "Agricultural Intelligence - {state}",
  "app.englishNote": "Some text is shown in English.",
  "app.reviewNote": "Translation is being reviewed.",
  "app.listError": "Could not load the district or crop list: {error}",
  "app.uncalibratedLead": "Not yet approved by agronomists. Use it as a guide only.",
  "app.idle": "Choose a district and a crop above to see advice for your area",
  "app.loadError": "Could not load the information. Please try another district or crop.",

  // Dropdowns
  "field.language": "Language",
  "field.state": "State",
  "field.district": "District",
  "field.crop": "Crop",
  "field.selectDistrict": "Select district",
  "field.selectCrop": "Select crop",
  "field.chooseDistrictFirst": "Choose a district first",

  // State names (keys are listed in src/config/states.js)
  "state.maharashtra": "Maharashtra",
  "state.madhya_pradesh": "Madhya Pradesh",

  // Status bar
  "status.idle": "Choose a district and a crop to see advice.",
  "status.loading": "Loading...",
  "status.success": "Showing data for {district} · {crop}",
  "status.error": "Could not load the information. Please try again.",

  // Shared
  "common.whereFrom": "Where this comes from: {source}",
  "common.dataFrom": "Data from {date}",
  "common.dataFromTo": "Data from {from} to {to}",
  "common.lastChecked": "Last checked: {date}",
  "common.thisDistrict": "this district",
  "common.unknown": "Unknown",
  "common.perQuintal": "per quintal",
  "common.pricePerQuintal": "₹{price} per quintal",

  // How old a source is
  "fresh.fresh": "Up to date",
  "fresh.aging": "Getting old",
  "fresh.stale": "Old",

  // At a glance
  "glance.title": "At a glance",
  "glance.whereToSell": "Where to sell",
  "glance.sellOrStore": "Sell now or store?",
  "glance.water": "Water",
  "glance.talukaHint": "Some talukas in this district are worse. Check your taluka on the water card below.",

  // Harvest card
  "harvest.title": "How much {crop} is harvested in {district}?",
  "harvest.noData": "No harvest data for this choice.",
  "harvest.unit": "tonnes per hectare",
  "harvest.hectareNote": "(1 hectare is about 2.5 acres)",
  "harvest.noRecord": "No record found",
  "harvest.missing": "The government crop data has no harvest figure for {crop} in {district}.",
  "harvest.coversOnly": "For this district it covers only: {crops}.",
  "harvest.notAbsent": "A missing record does not mean the crop is not grown here.",
  "harvest.aboutData": "About this data: {note}",
  "harvest.source": "DES / MoSPI (government crop statistics)",
  "harvest.dataCovers": "Data covers: {period} (updated once a year)",

  // Price card
  "price.title": "Where is the best price for {crop} in {district}?",
  "price.noData": "No price data for this choice.",
  "price.quintalNote": "(1 quintal = 100 kg)",
  "price.noRecent": "No recent price found",
  "price.payingMost": "Market paying the most: {mandi}",
  "price.beforeTransport": "This price is before transport costs, which are not included.",
  "price.priceFrom": "Price is from: {date}",

  // Water card
  "water.title": "How much groundwater is used in {district}?",
  "water.noData": "No groundwater data for this choice.",
  "water.refill": "Each year, nature refills the groundwater. About {pct}% of that refill is being taken out.",
  "water.category": "Category for the district, worked out from how much groundwater is taken out: {category}",
  "water.notAvailable": "Not available",
  "water.abstained": "No water advice here. The data is too old to rely on.",
  "water.dataIsFrom": "Data is from: {date}",
  "water.stale": "This is the newest official survey, but it is old. Check local conditions before you act on it.",
  "water.talukaIntro": "The district figure can hide your taluka. {district} is '{category}' as a whole, but that is an average.",
  "water.talukaAssessmentOn": "In the CGWB assessment as on {date}, these talukas are worse.",
  "water.talukaAssessment": "In the CGWB assessment, these talukas are worse.",
  "water.talukaGroup": "{label}: {names}.",
  "water.talukaOutro": "If you farm in one of them, the district answer does not describe your water.",
  "water.talukaNoneWorse": "No taluka in this district is in a worse category than the district average.",
  // Groundwater category, used for the district and for each taluka (the backend's code -> a plain word)
  "water.cat.safe": "Safe",
  "water.cat.semi_critical": "Semi-critical",
  "water.cat.critical": "Critical",
  "water.cat.over_exploited": "Over-exploited",
  "water.cat.saline": "Salty",

  // Storage card
  "storage.title": "Sell now, or store and wait?",
  "storage.noData": "No sell-or-store advice for this crop yet.",
  "storage.sample": "Sample calculation",
  "storage.guideOnly": "Guide only. Check your local mandi before you sell.",
  "storage.abstained": "No sell-or-store advice here. The data is not reliable enough.",
  "storage.inSample": "In this sample calculation: ",
  "storage.whatToDo": "What to do: ",
  "storage.latestPrice": "Latest price per quintal (100 kg):",
  "storage.fixedBand": "No better-day or weaker-day range is shown: there is no measured spread here, only a fixed {band} around this one price.",
  "storage.band": "band",
  "storage.expected": "Expected price per quintal (100 kg):",
  "storage.betterDay": "On a better day",
  "storage.typicalDay": "On a typical day",
  "storage.weakerDay": "On a weaker day",
  "storage.priceFrom": "The price used here comes from {mandi}, not from {district}.",
  "storage.yourDistrict": "your district",
  "storage.referenceMarket": "a reference market",
  "storage.na": "N/A",

  // Weather card
  "weather.title": "What will the weather be this week?",
  "weather.noAnswerTitle": "What about the weather?",
  "weather.highest": "Highest {temp}°C",
  "weather.rainChance": "Rain chance {pct}%",
  "weather.readOn": "Forecast read on {date}",
  "weather.kind.dry": "Dry",
  "weather.kind.some_chance": "Some chance of rain",
  "weather.kind.rain_likely": "Rain likely",

  // Weather map card
  "wmap.title": "What is the weather in each district?",
  "wmap.bubbleTitle": "{district}: highest {temp}°C, {word}",
  "wmap.detail": "{district}: highest {temp}°C, {dry} of {days} days dry.",
  "wmap.nextRain": "Rain likely on {date}.",
  "wmap.noRain": "No rain likely in these {days} days.",
  "wmap.hint": "Tap a pin to choose that district.",
  "wmap.tempNote": "The number next to each pin is the highest temperature expected this week, in °C.",

  // Background card
  "bg.title": "Background information (older data)",
  "bg.enam": "Mandis on e-NAM in {district}",
  "bg.soil": "Soil moisture in {district}",

  // Pie chart
  "pie.title": "How is farmland used in {district}?",
  "pie.units": "In lakh hectares (1 lakh = 100,000)",
  "pie.cropMissing": "{crop} is not in this government data.",
  "pie.source": "DES / MoSPI",
  "pie.dataCovers": "Data covers {year}",
  "pie.tooltip": "{value} lakh ha",
};

export default en;
