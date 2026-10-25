"""
VIDHIVRAKSH Deterministic Legal Retrieval & Response Engine
Matches user queries deterministically against the small local sample corpus
and renders structured responses in Normal or Professional mode across 6 languages.
"""

import re
from typing import Dict, List, Any, Optional
from app.corpus import DEMO_CORPUS

# Ambiguous questions that lack necessary context to determine legal subject
AMBIGUOUS_PATTERNS = [
    r"^(can|could|should|may)\s+i\s+(do|make|sign)\s*(it|this|that)?\??$",
    r"^(is\s+this|is\s+it)\s*(legal|allowed|valid|ok|okay)?\??$",
    r"^(help|help\s+me|guide\s+me|tell\s+me)\??$",
    r"^(what\s+can\s+i\s+do|what\s+should\s+i\s+do)\??$",
    r"^(क्या\s+मैं\s+यह\s+कर\s+सकता\s+हूँ|क्या\s+यह\s+कानूनी\s+है|मदद\s+करें)\??$",
    r"^(আমি\s+কি\s+এটা\s+করতে\s+পারি|এটা\s+কি\s+আইনি|সাহায্য\s+করুন)\??$",
    r"^(நான்\s+இதைச்\s+செய்யலாமா|இது\s+சட்டப்பூர்வமானதா|உதவி\s+செய்யவும்)\??$",
    r"^(मी\s+हे\s+करू\s+शकतो\s+का|हे\s+कायदेशीर\s+आहे\s+का|मदत\s+करा)\??$",
    r"^(నేను\s+దీన్ని\s+చేయవచ్చా|ఇది\s+చట్టబద్ధమైనదా|సహాయం\s+చేయండి)\??$",
]

def normalize_text(text: str) -> str:
    cleaned = text.lower().strip()
    cleaned = re.sub(r"[^\w\s\u0900-\u0D7F]", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned)

def is_ambiguous_query(text: str) -> bool:
    cleaned = text.strip().lower()
    if len(cleaned.split()) <= 2 and len(cleaned) < 15:
        if any(w in cleaned for w in ["help", "legal", "can", "do", "how", "what", "मदद", "সাহায্য", "உதவி", "मदत", "సహాయం"]):
            return True
    for pat in AMBIGUOUS_PATTERNS:
        if re.match(pat, cleaned, re.IGNORECASE):
            return True
    return False

STOP_WORDS = {
    "what", "are", "the", "for", "and", "can", "how", "with", "from", "this",
    "that", "does", "mean", "have", "been", "will", "would", "about", "your",
    "give", "tell", "need", "legal", "law", "india", "under", "code", "rule"
}

def score_record(query_norm: str, record: Dict[str, Any], lang: str) -> int:
    score = 0
    words = [w for w in query_norm.split() if w not in STOP_WORDS]

    # 1. Match keywords for requested language
    lang_keywords = record.get("keywords_by_lang", {}).get(lang, [])
    for kw in lang_keywords:
        kw_norm = kw.lower()
        if kw_norm in query_norm:
            score += 5
        else:
            kw_tokens = set(kw_norm.split())
            for w in words:
                if len(w) >= 3 and w in kw_tokens:
                    score += 3

    # 2. Match English keywords as universal fallback for statutory terms (e.g. "fir", "bns", "rent")
    en_keywords = record.get("keywords_by_lang", {}).get("en", [])
    for kw in en_keywords:
        kw_norm = kw.lower()
        if kw_norm in query_norm:
            score += 4
        else:
            kw_tokens = set(kw_norm.split())
            for w in words:
                if len(w) >= 3 and w in kw_tokens:
                    score += 2

    # 3. Match specific title words (excluding general legal terms)
    title_tokens = set(record["title"].lower().split()) - STOP_WORDS
    for w in words:
        if len(w) >= 4 and w in title_tokens:
            score += 2

    return score

MIN_RETRIEVAL_SCORE = 4

def retrieve_records(query: str, lang: str = "en", limit: int = 3) -> List[Dict[str, Any]]:
    query_norm = normalize_text(query)
    scored = []
    for rec in DEMO_CORPUS:
        sc = score_record(query_norm, rec, lang)
        if sc >= MIN_RETRIEVAL_SCORE:
            scored.append((sc, rec))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:limit]]

# Localized Responses for Ambiguous and Insufficient Queries
CLARIFICATION_RESPONSES = {
    "en": {
        "title": "Context Needed",
        "normal": "To give you accurate legal information, VIDHIVRAKSH needs a bit more context. Could you specify which topic you are asking about? For example:\n• A tenancy or landlord-tenant dispute\n• Filing an FIR or police procedure\n• A will, inheritance, or property division\n• A contract, agreement, or traffic challan",
        "professional": "CLARIFICATION REQUIRED:\nThe submitted inquiry lacks specific jurisdictional, factual, or statutory parameters. Please delineate the nature of the legal relationship, subject matter (e.g., contractual obligation, penal provision, or testamentary succession), and relevant jurisdiction to facilitate structured analysis.",
        "follow_ups": ["Can I deduct security deposit?", "How to execute a valid will in India?", "What is zero FIR?"]
    },
    "hi": {
        "title": "अधिक संदर्भ आवश्यक",
        "normal": "सटीक कानूनी जानकारी देने के लिए VIDHIVRAKSH को थोड़े और संदर्भ की आवश्यकता है। कृपया स्पष्ट करें कि आपका प्रश्न किस विषय पर है? जैसे:\n• किराया समझौता या मकान मालिक-किरायेदार विवाद\n• एफआईआर (FIR) दर्ज करना या पुलिस प्रक्रिया\n• वसीयत, उत्तराधिकार या संपत्ति बंटवारा\n• कोई अनुबंध या ट्रैफिक चालान",
        "professional": "स्पष्टीकरण अपेक्षित:\nप्रस्तुत प्रश्न में आवश्यक विधिक या तथ्यात्मक संदर्भ का अभाव है। कृपया विवाद की प्रकृति, विधिक अधिकार (जैसे संविदात्मक दायित्व, दांडिक प्रावधान, अथवा वसीयत) स्पष्ट करें ताकि संरचित विश्लेषण प्रदान किया जा सके।",
        "follow_ups": ["किराया समझौते के नियम क्या हैं?", "वसीयत कैसे बनाएं?", "जीरो एफआईआर क्या है?"]
    },
    "bn": {
        "title": "প্রাসঙ্গিক তথ্য প্রয়োজন",
        "normal": "সঠিক আইনি তথ্য প্রদানের জন্য VIDHIVRAKSH-র কিছু অতিরিক্ত তথ্যের প্রয়োজন। দয়া করে স্পষ্ট করুন আপনার প্রশ্নটি কোন বিষয়ের উপর? যেমন:\n• বাড়িভাড়া চুক্তি বা বাড়িওয়ালা-ভাড়াটে বিরোধ\n• এফআইআর (FIR) দায়ের বা পুলিশি প্রক্রিয়া\n• উইল, উত্তরাধিকার বা সম্পত্তি বণ্টন\n• কোনো চুক্তি বা ট্রাফিক চালান",
        "professional": "স্পষ্টীকরণ প্রয়োজন:\nউপস্থাপিত প্রশ্নে সুনির্দিষ্ট আইনি বিষয়ের উল্লেখ নেই। দয়া করে আইনি সম্পর্ক, বিষয়বস্তু (যেমন চুক্তিভিত্তিক বাধ্যবাধকতা বা ফৌজদারি ধারা) নির্দিষ্ট করুন যাতে কাঠামোগত বিশ্লেষণ প্রদান করা যায়।",
        "follow_ups": ["ভাড়া চুক্তির নিয়ম কী?", "উইল করার সঠিক নিয়ম কী?", "জিরো এফআইআর কী?"]
    },
    "ta": {
        "title": "கூடுதல் விவரம் தேவை",
        "normal": "சரியான சட்டத் தகவல்களை வழங்க VIDHIVRAKSH-விற்கு கூடுதல் விவரங்கள் தேவைப்படுகின்றன. உங்கள் கேள்வி எந்தத் தலைப்பைப் பற்றியது என்பதைக் குறிப்பிட முடியுமா? உதாரணமாக:\n• வாடகை ஒப்பந்தம் அல்லது நில உரிமையாளர் பிணக்கு\n• எஃப்ஐஆர் (FIR) பதிவு அல்லது காவல்துறை நடைமுறை\n• உயில், வாரிசுரிமை அல்லது சொத்து பிரிவினை\n• ஒப்பந்தம் அல்லது போக்குவரத்து சலான்",
        "professional": "விளக்கம் தேவைப்படுகிறது:\nசமர்ப்பிக்கப்பட்ட வினாவில் போதுமான சட்டபூர்வ விவரங்கள் இல்லை. கட்டமைக்கப்பட்ட சட்டப் பகுப்பாய்வை வழங்க, வழக்கின் தன்மை அல்லது சட்டப் பிரிவைக் குறிப்பிடவும்.",
        "follow_ups": ["வாடகை ஒப்பந்த விதிகள் என்ன?", "உயில் எழுதுவது எப்படி?", "ஜீரோ எஃப்ஐஆர் என்றால் என்ன?"]
    },
    "mr": {
        "title": "अधिक संदर्भ आवश्यक",
        "normal": "अचूक कायदेशीर माहिती देण्यासाठी VIDHIVRAKSH ला अधिक संदर्भाची आवश्यकता आहे. कृपया आपला प्रश्न कोणत्या विषयावर आहे ते स्पष्ट करा? उदा.:\n• भाडे करार किंवा घरमालक-भाडेकरू वाद\n• एफआयआर (FIR) नोंदणी किंवा पोलीस प्रक्रिया\n• इच्छापत्र (विल), वारसाहक्क किंवा मालमत्ता वाटप\n• व्यावसायिक करार किंवा वाहतूक चलन",
        "professional": "स्पष्टीकरण आवश्यक:\nसादर केलेल्या प्रश्नात आवश्यक कायदेशीर संदर्भाचा अभाव आहे. संरचित विश्लेषणासाठी कृपया कायदेशीर संबंध किंवा विषयाचे स्वरूप स्पष्ट करा.",
        "follow_ups": ["भाडे कराराचे नियम काय आहेत?", "इच्छापत्र कसे करावे?", "झिरो एफआयआर म्हणजे काय?"]
    },
    "te": {
        "title": "మరింత సమాచారం అవసరం",
        "normal": "కచ్చితమైన చట్టపరమైన సమాచారాన్ని అందించడానికి VIDHIVRAKSH కు కొంచెం అదనపు సమాచారం అవసరం. మీ ప్రశ్న దేనికి సంబంధించినదో దయచేసి వివరించగలరా? ఉదాహరణకు:\n• అద్దె ఒప్పందం లేదా ఇంటి యజమాని-అద్దెదారు వివాదం\n• ఎఫ్ఐఆర్ (FIR) నమోదు లేదా పోలీసు విధానం\n• వీలునామా, వారసత్వం లేదా ఆస్తి పంపకం\n• ఒప్పందం లేదా ట్రాఫిక్ చలాన్",
        "professional": "వివరణ అవసరం:\nసమర్పించిన ప్రశ్నలో తగిన చట్టపరమైన వివరాలు లేవు. నిర్మాణాత్మక విశ్లేషణను అందించడానికి దయచేసి చట్టపరమైన సంబంధాన్ని లేదా అంశాన్ని స్పష్టం చేయండి.",
        "follow_ups": ["అద్దె ఒప్పందం నియమాలు ఏమిటి?", "వీలునామా ఎలా రాయాలి?", "జీరో ఎఫ్ఐఆర్ అంటే ఏమిటి?"]
    }
}

INSUFFICIENT_RESPONSES = {
    "en": {
        "title": "Corpus Limitation",
        "normal": "VIDHIVRAKSH's current demonstration corpus does not contain verified source records for this specific topic. To prevent misinformation, VIDHIVRAKSH does not generate unverified legal conclusions.\n\nYou can ask about our 10 supported Indian legal awareness topics:\n• Residential tenancy & security deposit rules\n• Wills, succession & attestation\n• FIR registration & Zero FIR rights under BNSS\n• Transition from IPC to Bharatiya Nyaya Sanhita (BNS)\n• Fundamental rights under Article 21, 14, 19, 32\n• Contract essentials & stamp duty\n• Adoption guidelines under CARA\n• MSMED delayed payment recovery\n• Traffic e-challans & Lok Adalat",
        "professional": "INSUFFICIENT CORPUS DOCUMENTATION:\nThe subject inquiry falls outside the perimeter of the 10 verified statutory modules presently indexed in this prototype demonstration repository. Consistent with VIDHIVRAKSH's grounding standards, no uncorroborated legal proposition or non-indexed statutory authority is fabricated."
    },
    "hi": {
        "title": "डेटाबेस सीमा",
        "normal": "VIDHIVRAKSH के वर्तमान नमूना डेटाबेस में इस विशिष्ट विषय के लिए सत्यापित रिकॉर्ड उपलब्ध नहीं हैं। भ्रामक जानकारी से बचने के लिए, VIDHIVRAKSH बिना सत्यापन के कानूनी निष्कर्ष प्रस्तुत नहीं करता है।\n\nआप हमारे समर्थित भारतीय कानूनी विषयों के बारे में पूछ सकते हैं:\n• किराया समझौता और सुरक्षा जमा नियम\n• वसीयत और उत्तराधिकार के नियम\n• BNSS के तहत एफआईआर और जीरो एफआईआर अधिकार\n• IPC से भारतीय न्याय संहिता (BNS) में बदलाव\n• संविधान के तहत मौलिक अधिकार (अनुच्छेद 21, 14, 19)\n• अनुबंध की वैधता और स्टांप शुल्क\n• दत्तक (गोद लेने) के नियम\n• एमएसएमई 45-दिवसीय भुगतान नियम\n• ट्रैफिक चालान और लोक अदालत",
        "professional": "अपर्याप्त विधिक दस्तावेज:\nयह प्रश्न इस प्रोटोटाइप रिपॉजिटरी में अनुक्रमित 10 सत्यापित वैधानिक मॉड्यूल के दायरे से बाहर है। VIDHIVRAKSH के प्रामाणिकता मानकों के अनुरूप, बिना सत्यापित स्रोतों के कोई भी कानूनी निष्कर्ष उत्पन्न नहीं किया गया है।"
    },
    "bn": {
        "title": "তথ্যসূত্রের সীমাবদ্ধতা",
        "normal": "VIDHIVRAKSH-র বর্তমান ডেমো ডেটাবেসে এই নির্দিষ্ট বিষয়ের কোনো যাচাইকৃত তথ্যসূত্র নেই। ভুল তথ্য এড়াতে VIDHIVRAKSH অননুমোদিত আইনি সিদ্ধান্ত তৈরি করে না।\n\nআপনি আমাদের সমর্থিত ১০টি ভারতীয় আইনি বিষয় সম্পর্কে জানতে চাইতে পারেন:\n• বাড়িভাড়া চুক্তি ও সিকিউরিটি ডিপোজিট\n• উইল ও উত্তরাধিকার সংক্রান্ত নিয়মাবলী\n• BNSS-এর অধীনে এফআইআর ও জিরো এফআইআর\n• IPC থেকে ভারতীয় ন্যায় সংহিতা (BNS)-র রূপান্তর\n• মৌলিক অধিকার (অনুচ্ছেদ ২১, ১৪, ১৯)\n• চুক্তি ও স্ট্যাম্প ডিউটি\n• দত্তক নেওয়ার সরকারি নিয়ম\n• এমএসএমই বকেয়া পাওনা আদায়\n• ট্রাফিক চালান ও লোক আদালত",
        "professional": "অপর্যাপ্ত নথিপত্র:\nপ্রশ্নটি বর্তমানে অন্তর্ভুক্ত ১০টি যাচাইকৃত সংবিধিবদ্ধ মডিউলের আওতাভুক্ত নয়। VIDHIVRAKSH-র প্রামাণ্য নীতি অনুযায়ী কোনো অপ্রমাণিত আইনি তথ্য তৈরি করা হয় না।"
    },
    "ta": {
        "title": "தரவுத்தள வரம்பு",
        "normal": "VIDHIVRAKSH-வின் தற்போதைய மாதிரித் தரவுத்தளத்தில் இந்த குறிப்பிட்ட தலைப்புக்கான சரிபார்க்கப்பட்ட தகவல்கள் இல்லை. தவறான தகவல்களைத் தவிர்க்க, VIDHIVRAKSH சரிபார்க்கப்படாத சட்ட முடிவுகளை உருவாக்குவதில்லை.\n\nநீங்கள் ஆதரிக்கப்படும் 10 இந்திய சட்டத் தலைப்புகள் குறித்துக் கேட்கலாம்:\n• வாடகை ஒப்பந்தம் மற்றும் முன்தொகை விதிகள்\n• உயில் மற்றும் வாரிசுரிமை சட்டங்கள்\n• BNSS சட்டத்தின் கீழ் எஃப்ஐஆர் மற்றும் ஜீரோ எஃப்ஐஆர்\n• IPC முதல் பாரதிய நியாய சன்ஹிதா (BNS) மாற்றங்கள்\n• அடிப்படை உரிமைகள் (பிரிவு 21, 14, 19)\n• ஒப்பந்தங்கள் மற்றும் முத்திரைத்தாள்\n• தத்தெடுப்பு வழிகாட்டுதல்கள்\n• MSME தாமத கட்டண வசூல்\n• போக்குவரத்து சலான் மற்றும் லோக் அதாலத்",
        "professional": "போதுமான சட்ட ஆவணங்கள் இல்லை:\nகோரப்பட்ட வினா இந்த மாதிரித் தளத்தில் உள்ள 10 சரிபார்க்கப்பட்ட சட்டத் தொகுப்புகளுக்கு அப்பாற்பட்டது. VIDHIVRAKSH-வின் நம்பகத்தன்மை விதிகளின்படி ஆதாரமற்ற தகவல்கள் உருவாக்கப்படுவதில்லை."
    },
    "mr": {
        "title": "माहिती मर्यादा",
        "normal": "VIDHIVRAKSH च्या सध्याच्या नमुना डेटाबेसमध्ये या विषयासाठी प्रमाणित नोंदी उपलब्ध नाहीत. चुकीची माहिती टाळण्यासाठी, VIDHIVRAKSH अप्रमाणित कायदेशीर उत्तरे देत नाही.\n\nआपण आमच्या १० समर्थित भारतीय कायदेशीर विषयांबद्दल विचारू शकता:\n• भाडे करार आणि अनामत रक्कम नियम\n• इच्छापत्र आणि वारसाहक्क\n• BNSS अंतर्गत एफआयआर आणि झिरो एफआयआर\n• IPC ते भारतीय न्याय संहिता (BNS) बदल\n• घटनेतील मूलभूत अधिकार (कलम 21, 14, 19)\n• कराराची वैधता आणि मुद्रांक शुल्क\n• दत्तक घेण्याचे नियम\n• एमएसएमई थकीत देणी वसुली\n• वाहतूक चलन आणि लोकअदालत",
        "professional": "अपुरे कायदेशीर दस्तऐवज:\nहा प्रश्न सध्याच्या १० प्रमाणित कायदेशीर घटकांच्या कार्यकक्षेबाहेरील आहे. VIDHIVRAKSH च्या नियमांनुसार कोणतेही अप्रमाणित कायदेशीर निष्कर्ष काढले जात नाहीत."
    },
    "te": {
        "title": "డేటా పరిమితి",
        "normal": "VIDHIVRAKSH యొక్క ప్రస్తుత నమూనా డేటాబేస్‌లో ఈ అంశానికి సంబంధించి తగిన సమాచారం లేదు. తప్పుడు సమాచారాన్ని నివారించడానికి, VIDHIVRAKSH ఆధారాలు లేని చట్టపరమైన సమాధానాలను అందించదు.\n\nమీరు మా 10 భారతీయ చట్టపరమైన అంశాల గురించి అడగవచ్చు:\n• అద్దె ఒప్పందం మరియు సెక్యూరిటీ డిపాజిట్ నిబంధనలు\n• వీలునామా మరియు వారసత్వ హక్కులు\n• BNSS కింద ఎఫ్ఐఆర్ మరియు జీరో ఎఫ్ఐఆర్ హక్కులు\n• IPC నుండి భారతీయ న్యాయ సంహిత (BNS) మార్పులు\n• ప్రాథమిక హక్కులు (ఆర్టికల్ 21, 14, 19)\n• ఒప్పందాల చెల్లుబాటు మరియు స్టాంప్ డ్యూటీ\n• దత్తత నిబంధనలు\n• MSME చెల్లింపుల రికవరీ\n• ట్రాఫిక్ చలాన్లు మరియు లోక్ అదాలత్",
        "professional": "సరిపడా చట్టపరమైన ఆధారాలు లేవు:\nఈ ప్రశ్న ప్రస్తుతం ఉన్న 10 ప్రామాణిక చట్టాల మాడ్యూళ్ల పరిధిలోకి రాదు. VIDHIVRAKSH విశ్వసనీయ ప్రమాణాల ప్రకారం ఎలాంటి ఆధారాలు లేని సమాచారం సృష్టించబడదు."
    }
}

def format_source_cards(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cards = []
    for r in records:
        cards.append({
            "id": r["id"],
            "title": r["title"],
            "statute": r.get("statute", ""),
            "section": r.get("section", ""),
            "court_or_authority": r.get("court_or_authority", ""),
            "source_name": r.get("source_name", "Official Indian Statute"),
            "official_url": r.get("official_url", ""),
            "verification_status": r.get("verification_status", "verified"),
            "limitations": r.get("limitations", "Subject to specific facts and state enactments."),
            "is_demo": True,
        })
    return cards

def generate_legal_response(
    query: str,
    lang: str = "en",
    mode: str = "normal",
) -> Dict[str, Any]:
    safe_lang = lang if lang in CLARIFICATION_RESPONSES else "en"
    safe_mode = mode if mode in ["normal", "professional"] else "normal"

    # Step 1: Check ambiguity
    if is_ambiguous_query(query):
        clarif = CLARIFICATION_RESPONSES[safe_lang]
        content = clarif["professional"] if safe_mode == "professional" else clarif["normal"]
        return {
            "type": "clarification_needed",
            "title": clarif["title"],
            "content": content,
            "mode": safe_mode,
            "language": safe_lang,
            "sources": [],
            "follow_up_suggestions": clarif.get("follow_ups", []),
            "insufficient_info": False,
            "disclaimer": "Demo Notice: VIDHIVRAKSH provides informational guidance only and is not a substitute for a legal advocate."
        }

    # Step 2: Retrieve records
    matched_records = retrieve_records(query, safe_lang, limit=3)

    # Step 3: Handle unsupported queries
    if not matched_records:
        insuff = INSUFFICIENT_RESPONSES[safe_lang]
        content = insuff["professional"] if safe_mode == "professional" else insuff["normal"]
        return {
            "type": "insufficient_info",
            "title": insuff["title"],
            "content": content,
            "mode": safe_mode,
            "language": safe_lang,
            "sources": [],
            "follow_up_suggestions": ["Explain a rental agreement", "What are my rights under BNSS for FIR?", "How does an Indian will work?"],
            "insufficient_info": True,
            "disclaimer": "Demo Notice: VIDHIVRAKSH provides informational guidance only and is not a substitute for a legal advocate."
        }

    # Step 4: Construct structured response based on mode
    top_record = matched_records[0]
    source_cards = format_source_cards(matched_records)

    if safe_mode == "professional":
        # Professional Mode: Structured legal memorandum
        content = f"""### LEGAL MEMORANDUM & STATUTORY BRIEF
**Subject:** {top_record['title']}
**Primary Enactment:** {top_record['statute']} ({top_record.get('section', 'General Provisions')})
**Authority / Precedent:** {top_record.get('court_or_authority', 'Statutory Authority')}

#### 1. Statutory Formulation & Rules
{top_record['short_explanation']}

#### 2. Scope & Practice Limitations
• {top_record.get('limitations', 'Outcome contingent upon registered documentation and jurisdictional state amendments.')}
• Demonstrative review indicates reliance on verified legislative text ({top_record['source_name']}).

#### 3. Citations & References
Primary indexed authority: {top_record['statute']}, {top_record.get('section', '')}. Verification status: {top_record.get('verification_status', 'verified')}.
"""
    else:
        # Normal Mode: Approachable, plain-language guidance
        content = f"""**{top_record['title']}**

{top_record['short_explanation']}

**Key Points to Keep in Mind:**
• **Applicable Law:** {top_record['statute']} ({top_record.get('section', '')})
• **Important Note:** {top_record.get('limitations', 'Always verify provisions with an advocate before taking legal action.')}
"""

    return {
        "type": "answer",
        "title": top_record["title"],
        "content": content.strip(),
        "mode": safe_mode,
        "language": safe_lang,
        "sources": source_cards,
        "follow_up_suggestions": [
            f"What documents do I need for {top_record['topic'].replace('_', ' ')}?",
            "What if there is a dispute?",
            "Consult an advocate"
        ],
        "insufficient_info": False,
        "disclaimer": "Demo Legal Information: VIDHIVRAKSH provides educational starting points, not formal legal advice."
    }
