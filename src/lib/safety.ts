import type { Lang } from "./i18n";

/** Verified 22 Oct 2026 from dm.mcgm.gov.in, mcgm.gov.in emergency contacts PDF, mumbaisuburban.gov.in, mumbaicity.gov.in */
export const HELPLINES: { number: string; label: Record<Lang, string> }[] = [
  { number: "1916", label: { en: "BMC Disaster Management helpline (24×7)", hi: "BMC आपदा प्रबंधन हेल्पलाइन (24×7)", mr: "BMC आपत्ती व्यवस्थापन हेल्पलाइन (24×7)" } },
  { number: "022-22694725", label: { en: "BMC Emergency Operation Centre", hi: "BMC आपातकालीन संचालन केंद्र", mr: "BMC आपत्कालीन कार्य केंद्र" } },
  { number: "112", label: { en: "Police / national emergency", hi: "पुलिस / राष्ट्रीय आपातकाल", mr: "पोलीस / राष्ट्रीय आपत्कालीन" } },
  { number: "101", label: { en: "Mumbai Fire Brigade", hi: "मुंबई अग्निशमन दल", mr: "मुंबई अग्निशमन दल" } },
  { number: "108", label: { en: "Ambulance", hi: "एम्बुलेंस", mr: "रुग्णवाहिका" } },
  { number: "1077", label: { en: "District control room (toll free)", hi: "ज़िला नियंत्रण कक्ष (टोल फ़्री)", mr: "जिल्हा नियंत्रण कक्ष (टोल फ्री)" } },
];

export const TIPS: Record<"before" | "during" | "after", Record<Lang, string[]>> = {
  before: {
    en: ["Keep a torch, power bank, medicines, ID papers and drinking water in a waterproof bag.", "Move valuables and electrical items to a higher shelf.", "Check BMC / IMD alerts before stepping out, and check if local trains are running.", "Keep drains outside your home free of plastic and garbage."],
    hi: ["टॉर्च, पावर बैंक, दवाइयाँ, पहचान पत्र और पीने का पानी वाटरप्रूफ़ थैले में रखें।", "कीमती सामान और बिजली के उपकरण ऊँची जगह पर रखें।", "बाहर निकलने से पहले BMC / IMD अलर्ट देखें और लोकल ट्रेन की स्थिति जाँचें।", "घर के बाहर की नालियों में प्लास्टिक और कचरा न जमने दें।"],
    mr: ["टॉर्च, पॉवर बँक, औषधे, ओळखपत्र आणि पिण्याचे पाणी जलरोधक पिशवीत ठेवा.", "मौल्यवान वस्तू आणि विजेची उपकरणे उंच जागी ठेवा.", "बाहेर पडण्यापूर्वी BMC / IMD इशारे आणि लोकल ट्रेनची स्थिती तपासा.", "घराबाहेरील गटारांत प्लास्टिक व कचरा साचू देऊ नका."],
  },
  during: {
    en: ["Do not walk or drive through flood water — open manholes may be hidden.", "Stay away from electric poles and fallen wires.", "Avoid low-lying subways and underpasses.", "If water enters your home, switch off the main power and move to a higher floor."],
    hi: ["बाढ़ के पानी में पैदल या गाड़ी से न जाएँ — खुले मैनहोल छिपे हो सकते हैं।", "बिजली के खंभों और गिरे हुए तारों से दूर रहें।", "निचले सबवे और अंडरपास से बचें।", "अगर घर में पानी घुसे तो मेन स्विच बंद करें और ऊपरी मंज़िल पर जाएँ।"],
    mr: ["पुराच्या पाण्यातून चालत किंवा गाडीने जाऊ नका — उघडे मॅनहोल लपलेले असू शकतात.", "विजेचे खांब आणि तुटलेल्या तारांपासून दूर राहा.", "सखल भागातील सबवे आणि भुयारी मार्ग टाळा.", "घरात पाणी शिरल्यास मुख्य वीज बंद करा आणि वरच्या मजल्यावर जा."],
  },
  after: {
    en: ["Drink boiled or filtered water only.", "See a doctor if you have fever after walking in flood water (risk of leptospirosis).", "Report blocked drains or fallen trees to BMC on 1916."],
    hi: ["सिर्फ़ उबला या फ़िल्टर किया पानी पिएँ।", "बाढ़ के पानी में चलने के बाद बुखार हो तो डॉक्टर को दिखाएँ (लेप्टोस्पायरोसिस का ख़तरा)।", "बंद नालियाँ या गिरे पेड़ की शिकायत BMC को 1916 पर करें।"],
    mr: ["फक्त उकळलेले किंवा गाळलेले पाणी प्या.", "पुराच्या पाण्यातून चालल्यानंतर ताप आल्यास डॉक्टरांना दाखवा (लेप्टोस्पायरोसिसचा धोका).", "तुंबलेली गटारे किंवा पडलेली झाडे यांची तक्रार BMC कडे 1916 वर करा."],
  },
};

export const ALERT_SOURCES = [
  { name: "BMC Disaster Management", url: "https://dm.mcgm.gov.in/" },
  { name: "India Meteorological Department (IMD)", url: "https://mausam.imd.gov.in/" },
];
