"""
VIDHIVRAKSH Small Demo Legal Corpus (10 Curated Grounded Records)
This corpus contains carefully verified, factual Indian legal awareness records
covering common citizen and business questions.
"""

from typing import List, Dict, Any

DEMO_CORPUS: List[Dict[str, Any]] = [
    {
        "id": "rec_tenancy_001",
        "topic": "tenancy",
        "title": "Residential Tenancy and Security Deposit Regulations",
        "short_explanation": "Security deposits for residential leases in India are typically capped at two months' rent under the Model Tenancy framework. Landlords cannot arbitrarily withhold deposits without providing written itemized repair bills for damage exceeding reasonable wear and tear.",
        "statute": "Model Tenancy Act & State Rent Control Legislations",
        "section": "Section 10 & 13 (Security Deposit and Maintenance)",
        "court_or_authority": "Ministry of Housing and Urban Affairs & State Rent Authorities",
        "source_name": "Model Tenancy Act Framework, Govt of India",
        "official_url": "https://mohua.gov.in",
        "verification_status": "verified_statutory_framework",
        "is_demo": True,
        "limitations": "Tenancy laws are subject to specific state enactments and individual registered rent agreement clauses.",
        "keywords_by_lang": {
            "en": ["rent", "rental", "agreement", "lease", "landlord", "tenant", "security deposit", "eviction", "maintenance", "notice period"],
            "hi": ["किराया", "किरायेदार", "मकान मालिक", "किरायानामा", "अनुबंध", "सिक्योरिटी डिपॉजिट", "जमानत राशि", "खाली कराना"],
            "bn": ["ভাড়া", "ভাড়াটে", "বাড়িওয়ালা", "ভাড়া চুক্তি", "সিকিউরিটি ডিপোজিট", "উচ্ছেদ", "লিজ"],
            "ta": ["வாடகை", "வாடகைதாரர்", "வீட்டு உரிமையாளர்", "வாடகை ஒப்பந்தம்", "முன்தொகை", "காலி செய்தல்"],
            "mr": ["भाडे", "भाडेकरू", "घरमालक", "भाडे करार", "डिपॉझिट", "अनामत रक्कम", "घर खाली करणे"],
            "te": ["అద్దె", "అద్దెదారు", "ఇంటి యజమాని", "అద్దె ఒప్పందం", "సెక్యూరిటీ డిపాజిట్", "ఖాళీ చేయించడం"]
        }
    },
    {
        "id": "rec_wills_002",
        "topic": "inheritance",
        "title": "Wills, Attestation, and Indian Succession Basics",
        "short_explanation": "Under the Indian Succession Act, 1925, a valid unprivileged will must be executed in writing by a person of sound mind and attested by at least two witnesses who witnessed the testator's signature. Registration of a will is optional under the Registration Act, 1908, though highly recommended to prevent fraud.",
        "statute": "Indian Succession Act, 1925 & Registration Act, 1908",
        "section": "Section 59 & 63 (Execution and Attestation of Wills)",
        "court_or_authority": "Supreme Court of India (H. Venkatachala Iyengar v. B.N. Thimmajamma)",
        "source_name": "Indian Succession Act, 1925 (Act No. 39 of 1925)",
        "official_url": "https://indiacode.nic.in",
        "verification_status": "verified_statutory_precedent",
        "is_demo": True,
        "limitations": "Muslim succession is governed by customary personal law; Hindu, Sikh, Jain, and Christian successions have distinct statutory provisions.",
        "keywords_by_lang": {
            "en": ["will", "testament", "inheritance", "succession", "property division", "testator", "attestation", "executor", "probate"],
            "hi": ["वसीयत", "उत्तराधिकार", "वारिस", "पैतृक संपत्ति", "संपत्ति बंटवारा", "गवाह", "इच्छापत्र"],
            "bn": ["উইল", "উত্তরাধিকার", "সম্পত্তি বণ্টন", "ওয়ারিশ", "ইচ্ছাপত্র", "সাক্ষী"],
            "ta": ["உயில்", "வாரிசுரிமை", "சொத்து பிரிவினை", "சாட்சிகள்", "சொத்து உரிமை"],
            "mr": ["इच्छापत्र", "वारसाहक्क", "मालमत्ता वाटप", "वारसदार", "विल", "साक्षीदार"],
            "te": ["వీలునామా", "వారసత్వం", "ఆస్తి పంపకం", "సాక్షులు", "వారసుడు"]
        }
    },
    {
        "id": "rec_fir_003",
        "topic": "criminal_procedure",
        "title": "First Information Report (FIR) and Citizen Rights under BNSS",
        "short_explanation": "Section 173 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 mandates that police must register an FIR for cognizable offences. A Zero FIR allows a citizen to register an FIR at any police station regardless of jurisdiction. The informant is statutorily entitled to a free copy of the FIR immediately upon registration.",
        "statute": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
        "section": "Section 173 (Information in cognizable cases & Zero FIR)",
        "court_or_authority": "Supreme Court of India (Lalita Kumari v. Govt of UP)",
        "source_name": "Bharatiya Nagarik Suraksha Sanhita, 2023 Gazette Notification",
        "official_url": "https://mha.gov.in",
        "verification_status": "verified_statutory_precedent",
        "is_demo": True,
        "limitations": "Non-cognizable offences require permission from a Magistrate under Section 174 BNSS before police investigation can proceed.",
        "keywords_by_lang": {
            "en": ["fir", "police", "complaint", "cognizable", "zero fir", "arrest", "bnss", "crpc", "investigation"],
            "hi": ["एफआईआर", "प्राथमिकी", "पुलिस", "शिकायत", "संज्ञेय अपराध", "जीरो एफआईआर", "बीएनएसएस", "गिरफ्तारी"],
            "bn": ["এফআইআর", "পুলিশ", "অভিযোগ", "আমলযোগ্য অপরাধ", "জিরো এফআইআর", "গ্রেপ্তার"],
            "ta": ["எஃப்ஐஆர்", "காவல்துறை", "புகார்", "கைது", "ஜீரோ எஃப்ஐஆர்", "விசாரணை"],
            "mr": ["एफआयआर", "तक्रार", "पोलीस", "दखलपात्र गुन्हा", "झिरो एफआयआर", "अटक"],
            "te": ["ఎఫ్ఐఆర్", "పోలీస్", "ఫిర్యాదు", "కాగ్నిజబుల్ నేరం", "జీరో ఎఫ్ఐఆర్", "అరెస్ట్"]
        }
    },
    {
        "id": "rec_ipc_bns_004",
        "topic": "penal_code_transition",
        "title": "Transition from Indian Penal Code (IPC) to Bharatiya Nyaya Sanhita (BNS)",
        "short_explanation": "Effective July 1, 2024, the colonial IPC (1860) was replaced by the Bharatiya Nyaya Sanhita (BNS), 2023. Key transitions include cheating (formerly IPC 420) now mapped to BNS Section 318(4), murder (formerly IPC 302) now mapped to BNS Section 103, and the formal inclusion of community service as a penal consequence for minor offences.",
        "statute": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
        "section": "Section 103 (Murder), Section 318 (Cheating), Section 4 (Community Service)",
        "court_or_authority": "Parliament of India & Ministry of Home Affairs",
        "source_name": "Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)",
        "official_url": "https://mha.gov.in",
        "verification_status": "verified_statutory_framework",
        "is_demo": True,
        "limitations": "Offences committed prior to July 1, 2024 continue to be tried and substantively governed by the IPC under the general savings principles.",
        "keywords_by_lang": {
            "en": ["ipc", "bns", "cheating", "section 420", "section 302", "murder", "criminal law", "new laws", "bharatiya nyaya sanhita"],
            "hi": ["आईपीसी", "बीएनएस", "धारा 420", "धारा 302", "धोखाधड़ी", "हत्या", "नए कानून", "भारतीय न्याय संहिता"],
            "bn": ["আইপিসি", "বিএনএস", "ধারা ৪২০", "ধারা ৩০২", "প্রতারণা", "নতুন আইন", "ভারতীয় ন্যায় সংহিতা"],
            "ta": ["ஐபிசி", "பிஎன்எஸ்", "பிரிவு 420", "பிரிவு 302", "மோசடி", "புதிய சட்டங்கள்", "பாரதிய நியாய சன்ஹிதா"],
            "mr": ["आयपीसी", "बीएनएस", "कलम 420", "कलम 302", "फसवणूक", "नवीन कायदे", "भारतीय न्याय संहिता"],
            "te": ["ఐపీసీ", "బీఎన్ఎస్", "సెక్షన్ 420", "సెక్షన్ 302", "మోసం", "కొత్త చట్టాలు", "భారతీయ న్యాయ సంహిత"]
        }
    },
    {
        "id": "rec_fundamental_rights_005",
        "topic": "constitutional_law",
        "title": "Fundamental Rights and Constitutional Remedies under Article 32 and 226",
        "short_explanation": "Part III of the Constitution of India guarantees fundamental rights to all persons, including equality before the law (Article 14), freedom of speech and expression (Article 19), and protection of life and personal liberty (Article 21). When fundamental rights are infringed, citizens may approach the Supreme Court under Article 32 or High Courts under Article 226 for the issuance of prerogative writs (Habeas Corpus, Mandamus, Quo Warranto, Prohibition, Certiorari).",
        "statute": "Constitution of India, 1950",
        "section": "Articles 14, 19, 21, 32 & 226",
        "court_or_authority": "Supreme Court of India (Maneka Gandhi v. Union of India & K.S. Puttaswamy v. Union of India)",
        "source_name": "Constitution of India Official Text",
        "official_url": "https://legislative.gov.in",
        "verification_status": "verified_constitutional_text",
        "is_demo": True,
        "limitations": "Fundamental rights are subject to reasonable restrictions in the interests of public order, national security, decency, and morality.",
        "keywords_by_lang": {
            "en": ["constitution", "fundamental rights", "article 21", "article 14", "article 19", "article 32", "writ", "liberty", "privacy"],
            "hi": ["संविधान", "मौलिक अधिकार", "अनुच्छेद 21", "अनुच्छेद 14", "अनुच्छेद 32", "रिट", "निजता का अधिकार", "स्वतंत्रता"],
            "bn": ["সংবিধান", "মৌলিক অধিকার", "অনুচ্ছেদ ২১", "অনুচ্ছেদ ৩২", "রিট", "ব্যক্তিগত স্বাধীনতা"],
            "ta": ["அரசியலமைப்பு", "அடிப்படை உரிமைகள்", "பிரிவு 21", "பிரிவு 32", "ரிட் மனு", "தனியுரிமை"],
            "mr": ["संविधान", "मूलभूत हक्क", "कलम 21", "कलम 14", "कलम 32", "रिट याचिका", "स्वातंत्र्य"],
            "te": ["రాజ్యాంగం", "ప్రాథమిక హక్కులు", "ఆర్టికల్ 21", "ఆర్టికల్ 32", "రిట్ పిటిషన్", "స్వేచ్ఛ"]
        }
    },
    {
        "id": "rec_contracts_006",
        "topic": "contracts",
        "title": "Essentials of a Valid Contract and Stamp Duty Requirements",
        "short_explanation": "Under Section 10 of the Indian Contract Act, 1872, agreements are valid contracts if made by free consent of competent parties for a lawful consideration and lawful object. Agreements not properly stamped in accordance with state stamp duty schedules may be impounded under the Indian Stamp Act, 1899 and cannot be admitted in evidence until the deficit duty and penalty are cured.",
        "statute": "Indian Contract Act, 1872 & Indian Stamp Act, 1899",
        "section": "Section 10 (Essential Conditions) & Section 35 (Stamping and Admissibility)",
        "court_or_authority": "Supreme Court of India (NN Global Mercantile v. Indo Unique Flame)",
        "source_name": "Indian Contract Act, 1872 (Act No. 9 of 1872)",
        "official_url": "https://indiacode.nic.in",
        "verification_status": "verified_statutory_precedent",
        "is_demo": True,
        "limitations": "Oral agreements can be legally binding in India, but documentary agreements are required for transactions involving immovable property or statutory registration.",
        "keywords_by_lang": {
            "en": ["contract", "agreement", "stamp duty", "stamp paper", "breach of contract", "valid contract", "consideration", "nda"],
            "hi": ["अनुबंध", "इकरारनामा", "स्टांप ड्यूटी", "स्टांप पेपर", "समझौता", "शर्तें", "उल्लंघन"],
            "bn": ["চুক্তি", "দলিল", "স্ট্যাম্প ডিউটি", "স্ট্যাম্প পেপার", "চুক্তিভঙ্গ"],
            "ta": ["ஒப்பந்தம்", "உடன்படிக்கை", "முத்திரைத்தாள்", "ஒப்பந்த மீறல்"],
            "mr": ["करार", "दस्तऐवज", "मुद्रांक शुल्क", "स्टॅम्प पेपर", "करारभंग"],
            "te": ["ఒప్పందం", "అగ్రిమెంట్", "స్టాంప్ డ్యూటీ", "స్టాంప్ పేపర్", "ఉల్లంఘన"]
        }
    },
    {
        "id": "rec_adoption_007",
        "topic": "family_law",
        "title": "Child Adoption Procedures and CARA Guidelines",
        "short_explanation": "Legal adoption in India is governed through the Central Adoption Resource Authority (CARA) under the Juvenile Justice (Care and Protection of Children) Act, 2015, or through personal law under the Hindu Adoptions and Maintenance Act (HAMA), 1956. Unofficial or private adoptions outside CARA or HAMA are illegal under Indian law.",
        "statute": "Juvenile Justice Act, 2015 & HAMA, 1956",
        "section": "Sections 56-73 (Adoption Procedure and Eligibility)",
        "court_or_authority": "Central Adoption Resource Authority (CARA), Ministry of Women & Child Development",
        "source_name": "CARA Adoption Regulations, Govt of India",
        "official_url": "https://cara.wcd.gov.in",
        "verification_status": "verified_statutory_regulations",
        "is_demo": True,
        "limitations": "Single men cannot adopt a female child under CARA regulations; parents must meet composite age criteria.",
        "keywords_by_lang": {
            "en": ["adoption", "adopt child", "cara", "orphan", "foster care", "hama", "child custody"],
            "hi": ["गोद लेना", "दत्तक", "बच्चा गोद", "कारा", "कारा नियम", "अभिभावक"],
            "bn": ["দত্তক", "সন্তান দত্তক", "কারা", "অভিভাবকত্ব"],
            "ta": ["தத்தெடுத்தல்", "குழந்தை தத்து", "காரா", "பாதுகாவலர்"],
            "mr": ["दत्तक", "मुलगा दत्तक", "मुलगी दत्तक", "कारा नियम", "पालकत्व"],
            "te": ["దత్తత", "పిల్లల దత్తత", "కారా", "సంరక్షకుడు"]
        }
    },
    {
        "id": "rec_msme_arbitration_008",
        "topic": "commercial_disputes",
        "title": "MSMED Act Delayed Payment Recovery and Commercial Arbitration",
        "short_explanation": "Under Section 15 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006, buyers must settle dues to registered MSMEs within the agreed period (not exceeding 45 days). Failure to pay attracts statutory compound interest with monthly rests at three times the RBI bank rate. MSMEs can file dispute petitions before the MSEFC (Samadhaan Portal) which acts as a statutory arbitration forum.",
        "statute": "MSMED Act, 2006 & Arbitration and Conciliation Act, 1996",
        "section": "Section 15, 16 & 18 (Delayed Payments and Reference to Council)",
        "court_or_authority": "Micro and Small Enterprise Facilitation Council (MSEFC)",
        "source_name": "MSMED Act, 2006 (Act No. 27 of 2006)",
        "official_url": "https://samadhaan.msme.gov.in",
        "verification_status": "verified_statutory_framework",
        "is_demo": True,
        "limitations": "The claimant enterprise must have had an active Udyam registration at the time of entering into the contract or executing the supply.",
        "keywords_by_lang": {
            "en": ["msme", "delayed payment", "arbitration", "recovery", "unpaid invoice", "45 days", "samadhaan", "dispute"],
            "hi": ["एमएसएमई", "विलंबित भुगतान", "बकाया राशि", "मध्यस्थता", "४५ दिन", "समाधान पोर्टल", "व्यापार विवाद"],
            "bn": ["এমএসএমই", "বিলম্বিত পাওনা", "বকেয়া টাকা", "সালিশি", "৪৫ দিন", "বাণিজ্যিক বিরোধ"],
            "ta": ["சிறு குறு தொழில்", "தாமத கட்டணம்", "மத்தியஸ்தம்", "45 நாட்கள்", "வணிகப் பிணக்கு"],
            "mr": ["एमएसएमई", "थकीत देणी", "वसुली", "लवाद", "४५ दिवस", "समाधान पोर्टल"],
            "te": ["ఎంఎస్ఎంఈ", "బకాయిలు", "మధ్యవర్తిత్వం", "45 రోజులు", "సమాధాన్ పోర్టల్", "చెల్లింపుల రికవరీ"]
        }
    },
    {
        "id": "rec_challans_traffic_009",
        "topic": "traffic_and_civic",
        "title": "Motor Vehicle Challans and Lok Adalat Contest Procedures",
        "short_explanation": "Under the Motor Vehicles Act, 1988 (as amended in 2019), traffic citations can be paid electronically or contested in court. If a citizen disputes a digital e-challan (e.g. erroneous registration number or incorrect signal violation capture), they can submit a grievance on the Parivahan portal or settle compoundable traffic infractions with substantial compounding waivers before the National Lok Adalat.",
        "statute": "Motor Vehicles (Amendment) Act, 2019 & Legal Services Authorities Act, 1987",
        "section": "Sections 177-194 (Traffic Penalties) & Section 20 (Lok Adalat)",
        "court_or_authority": "National Legal Services Authority (NALSA) & State Transport Departments",
        "source_name": "Parivahan e-Challan Framework, MoRTH",
        "official_url": "https://echallan.parivahan.gov.in",
        "verification_status": "verified_statutory_framework",
        "is_demo": True,
        "limitations": "Non-compoundable violations (such as severe drunken driving causing injury) cannot be settled in Lok Adalat and require magistrate trial.",
        "keywords_by_lang": {
            "en": ["challan", "traffic fine", "traffic violation", "lok adalat", "speeding", "signal jumping", "parivahan", "license suspension"],
            "hi": ["चालान", "ट्रैफिक जुर्माना", "यातायात नियम", "लोक अदालत", "परिवहन", "लाइसेंस"],
            "bn": ["চালান", "ট্রাফিক জরিমানা", "লোক আদালত", "পরিবহন", "লাইসেন্স"],
            "ta": ["சலான்", "போக்குவரத்து அபராதம்", "லோக் அதாலத்", "பரிவாஹன்", "ஓட்டுநர் உரிமம்"],
            "mr": ["चलन", "वाहतूक दंड", "ट्रॅफिक नियम", "लोकअदालत", "परिवहन", "परवाना"],
            "te": ["చలాన్", "ట్రాఫిక్ జరిమానా", "లోక్ అదాలత్", "పరివాహన్", "లైసెన్స్ రద్దు"]
        }
    },
    {
        "id": "rec_consumer_protection_010",
        "topic": "consumer_law",
        "title": "Consumer Protection Rights and E-Daakhil Portal",
        "short_explanation": "The Consumer Protection Act, 2019 replaced the 1986 Act, establishing the Central Consumer Protection Authority (CCPA) and introducing e-filing of complaints via the E-Daakhil portal. Consumers can seek compensation for defective goods, deficient services, misleading advertisements, and unfair trade practices within a 2-year limitation period from the date of cause of action.",
        "statute": "Consumer Protection Act, 2019 (Act No. 35 of 2019)",
        "section": "Section 2(7) (Definition of Consumer), Section 35 (Filing Procedure)",
        "court_or_authority": "National Consumer Disputes Redressal Commission (NCDRC) & CCPA",
        "source_name": "Consumer Protection Act, 2019 Gazette Notification",
        "official_url": "https://edaakhil.nic.in",
        "verification_status": "verified_statutory_text",
        "is_demo": True,
        "limitations": "Purchases made purely for large-scale commercial resale purposes are generally excluded from consumer dispute jurisdiction.",
        "keywords_by_lang": {
            "en": ["consumer", "defective goods", "refund", "unfair trade", "e-daakhil", "consumer court", "warranty", "deficiency in service"],
            "hi": ["उपभोक्ता", "खराब सामान", "रिफंड", "उपभोक्ता अदालत", "वारंटी", "सेवा में कमी", "ई-दाखिल"],
            "bn": ["ভোক্তা", "ক্রেতা সুরক্ষা", "রিফান্ড", "ভোক্তা আদালত", "ওয়ারেন্টি"],
            "ta": ["நுகர்வோர்", "குறைபாடுள்ள பொருட்கள்", "பணம் திரும்பப் பெறுதல்", "நுகர்வோர் நீதிமன்றம்"],
            "mr": ["ग्राहक", "खराब वस्तू", "परतावा", "ग्राहक मंच", "ई-दाखल", "वॉरंटी"],
            "te": ["వినియోగదారుడు", "లోపభూయిష్ట వస్తువులు", "రీఫండ్", "వినియోగదారుల ఫోరమ్", "వారంటీ"]
        }
    }
]

# --- 30 Curated Landmark Indian Supreme Court Case Studies ---
from app.landmark_cases import LANDMARK_CASES

for c in LANDMARK_CASES:
    DEMO_CORPUS.append({
        "id": c["id"],
        "topic": c["topic"].lower().replace(" ", "_"),
        "title": c["case_title"],
        "case_title": c["case_title"],
        "year": c["year"],
        "court": c["court"],
        "citation": c["citation"],
        "statute": c["statute"],
        "section": c["citation"],
        "court_or_authority": c["court"],
        "short_explanation": f"{c['facts_summary']} Key Holding: {c['key_holding']} Legal Principle: {c['legal_principle']} Significance: {c['why_it_matters']}",
        "facts_summary": c["facts_summary"],
        "key_holding": c["key_holding"],
        "legal_principle": c["legal_principle"],
        "why_it_matters": c["why_it_matters"],
        "source_name": f"Supreme Court of India ({c['citation']})",
        "official_url": c["official_url"],
        "verification_status": c["verification_status"],
        "is_demo": False,
        "is_landmark_case": True,
        "limitations": "Judicial precedent under Article 141 of the Constitution of India is binding on all courts within India, subject to distinct factual matrix.",
        "keywords_by_lang": c["keywords_by_lang"],
    })

