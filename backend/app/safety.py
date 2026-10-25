"""
VIDHIVRAKSH Intelligent Safety & Suspicious-Message Classification Engine
Phase 7 Implementation

Distinguishes between:
A. Legitimate Legal Inquiry (e.g., definitions of fraud, criminal penalties, statutory rights) -> Allowed, 0 warnings
B. Protective / Victim-Support Request (e.g., facing extortion, harassment, scam reporting) -> Safe guidance, 0 warnings
C. Ambiguous or Potentially Suspicious Request (purpose unclear; could facilitate wrongdoing) -> Neutral clarification question, 0 warnings
D. Clearly Harmful Request (actionable assistance to commit fraud, fabricate evidence, impersonate officials, evade law) -> Refusal + qualifying warning + chat termination
"""

import re
from typing import Dict, Any, Optional, List

# Classification Categories
CAT_LEGITIMATE = "legitimate_inquiry"
CAT_VICTIM_SUPPORT = "victim_support"
CAT_AMBIGUOUS = "ambiguous_clarification"
CAT_HARMFUL = "harmful_refusal"
CAT_CRISIS_SUPPORT = "crisis_support"

# Policy Rule Identifiers
RULE_LEGITIMATE = "RULE_LEGITIMATE_INQUIRY"
RULE_VICTIM_SUPPORT = "RULE_VICTIM_PROTECTION_AND_SUPPORT"
RULE_AMBIGUOUS_DOC_ALTERATION = "RULE_AMBIGUOUS_DOCUMENT_ALTERATION"
RULE_AMBIGUOUS_FINANCIAL_ASSETS = "RULE_AMBIGUOUS_ASSET_DISCLOSURE"
RULE_AMBIGUOUS_PROCEDURAL_BYPASS = "RULE_AMBIGUOUS_PROCEDURAL_QUERY"
RULE_ILLEGAL_HARM = "RULE_ILLEGAL_HARM_AND_VIOLENCE"
RULE_HIT_AND_RUN = "RULE_HIT_AND_RUN_FACILITATION"
RULE_PSYCHOLOGICAL_HARM = "RULE_EMOTIONAL_PSYCHOLOGICAL_HARM"
RULE_FORGERY_FABRICATION = "RULE_FORGERY_AND_FABRICATION"
RULE_IMPERSONATION = "RULE_OFFICIAL_IMPERSONATION"
RULE_FALSE_EVIDENCE_FRAMING = "RULE_FALSE_EVIDENCE_AND_FRAMING"
RULE_EVASION_OF_LAW = "RULE_EVASION_OF_LAWFUL_ACCOUNTABILITY"
RULE_EXTORTION_THREATS = "RULE_EXTORTION_OR_THREAT_FACILITATION"
RULE_SELF_HARM_SUPPORT = "RULE_SELF_HARM_CRISIS_SUPPORT"

# 0. Self-harm signals: the person may be at risk. Respond with support, never a warning.
SELF_HARM_PATTERNS = [
    r"\b(kill|unalive|hurt|harm)\s+(myself|my\s*self)\b",
    r"\b(end|take)\s+my\s+(own\s+)?life\b",
    r"\b(i\s+(want|wanna|plan|am\s+going|'m\s+going)\s+to\s+(die|commit\s+suicide))\b",
    r"\b(i\s+am|i'm)\s+(suicidal|thinking\s+(of|about)\s+suicide)\b",
    r"(आत्महत्या\s+करना\s+चाहता|आत्महत्या\s+करना\s+चाहती|खुद\s+को\s+मार)",
]

# Violence / harm verbs and the first-person or how-to framing that signals intent to act on them.
_HARM_VERBS = (
    r"(kill|murder|unalive|stab|shoot|poison|strangle|choke|suffocate|beat\s+up|beat|hurt|injure|"
    r"attack|assault|torture|kidnap|abduct|burn|maim|run\s+over|rape|molest|stalk|harass|"
    r"humiliate|traumati[sz]e|bully|threaten|intimidate|harm|acid\s+attack|lynch|disfigure)"
)
_INTENT_FRAMES = (
    r"(i\s+(still\s+)?(want|wanna|need|plan|intend|am\s+going|'m\s+going|am\s+planning|will)\s+to|"
    r"how\s+(do|can|could|should|would)\s+i|how\s+to|help\s+me|teach\s+me|tell\s+me\s+how\s+to|"
    r"(best|easiest|quickest|safest)\s+way\s+to|ways?\s+to|plan\s+to|planning\s+to|going\s+to)"
)
# Everyday, non-violent objects of "kill"/"attack" etc. (processes, pests, time) that must not be flagged.
_HARMLESS_OBJECTS = (
    r"(me|us|myself|(a|the|this|that|my|all|running)?\s*(running\s+)?(process(es)?|tasks?|apps?|programs?|jobs?|sessions?|"
    r"threads?|servers?|ports?|switch|time|boredom|vibe|mood|bugs?|lights?|engine|weeds?|pests?|mosquito(es)?|bacteria|"
    r"germs|virus(es)?|cockroach(es)?|rats?|mice|insects?|termites?|ants?|flies|odou?r|smell|pain|hunger|the\s+game))"
)
_PERSON_TARGET = (
    r"(someone|somebody|anyone|anybody|people|a\s+person|him|her|them|my\s+\w+|his\s+\w+|their\s+\w+|"
    r"(a|the|that|this)\s+(man|woman|child|kid|boy|girl|guy|neighbou?r|cop|officer|witness|teacher|student))"
)

# Intent to inflict physical, emotional or psychological harm on another person.
HARM_INTENT_PATTERNS = [
    (r"\b" + _INTENT_FRAMES + r"\b.{0,40}?\b" + _HARM_VERBS + r"\b(?!\s+" + _HARMLESS_OBJECTS + r"\b)", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"\b(kill|murder|unalive|stab|shoot|poison|strangle|kidnap|beat\s+up|torture|attack)\s+" + _PERSON_TARGET + r"\b", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"\b(get\s+away\s+with\s+(murder|killing|it)|hide\s+(a|the)\s+(body|corpse)|dispose\s+of\s+(a|the)\s+(body|corpse)|make\s+it\s+look\s+like\s+an\s+accident)\b", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"\b(ruin|destroy)\s+(someone'?s|his|her|their|my\s+\w+'?s?)\s+(life|mental\s+health|reputation)\b", RULE_PSYCHOLOGICAL_HARM, "emotional_psychological_harm"),
    (r"\b(make|drive)\s+(someone|him|her|them|my\s+\w+)\s+(go\s+)?(crazy|insane|depressed|kill\s+(himself|herself|themselves))\b", RULE_PSYCHOLOGICAL_HARM, "emotional_psychological_harm"),
    (r"\bgaslight(ing)?\s+(someone|him|her|them|my\s+\w+)\b", RULE_PSYCHOLOGICAL_HARM, "emotional_psychological_harm"),
    # Multilingual intent to kill or harm
    (r"(जान\s+से\s+मार|हत्या\s+कैसे\s+कर|मार\s+डाल|को\s+मारना\s+है|नुकसान\s+पहुँचाना\s+है|नुकसान\s+पहुंचाना\s+है)", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"(খুন\s+করতে\s+চাই|কীভাবে\s+খুন|মেরে\s+ফেল)", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"(கொலை\s+செய்வது\s+எப்படி|கொல்ல\s+வேண்டும்|கொன்று\s+விட)", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"(खून\s+कसा\s+करावा|मारून\s+टाक|जीवे\s+मार)", RULE_ILLEGAL_HARM, "murder_violence"),
    (r"(హత్య\s+ఎలా\s+చేయాలి|చంపాలని\s+ఉంది|చంపేయ)", RULE_ILLEGAL_HARM, "murder_violence"),
]

# Rule used when a request matched an explicit-harm pattern and the user later persists with it.
CLARIFICATION_KEY_RULES = {
    "murder_violence": RULE_ILLEGAL_HARM,
    "hit_and_run": RULE_HIT_AND_RUN,
    "emotional_psychological_harm": RULE_PSYCHOLOGICAL_HARM,
    "general_illegal_harm": RULE_ILLEGAL_HARM,
    "unlawful_conduct": RULE_EVASION_OF_LAW,
    "document_alteration": RULE_AMBIGUOUS_DOC_ALTERATION,
    "asset_disclosure": RULE_AMBIGUOUS_FINANCIAL_ASSETS,
    "evidence_handling": RULE_AMBIGUOUS_PROCEDURAL_BYPASS,
}
HARM_CLARIFICATION_KEYS = {"murder_violence", "hit_and_run", "emotional_psychological_harm", "general_illegal_harm"}

# Wording that keeps the original request alive after a clarification question.
PERSIST_STRONG_RE = re.compile(
    r"\b(still|anyway|anyways|regardless|just\s+(tell|answer|do|give)|i\s+(said|asked|meant\s+what\s+i\s+said)|"
    r"answer\s+my\s+(question|query)|won'?t\s+(catch|find|know)|without\s+(getting\s+)?(caught|traced|noticed)|"
    r"get\s+away\s+with|not\s+get\s+caught|no\s+one\s+(will\s+)?(know|find)|nobody\s+(will\s+)?(know|find))\b"
)
PERSIST_WEAK_RE = re.compile(r"^\s*(no|nope|nah|yes|yeah|yep|same|exactly|you\s+know\s+what\s+i\s+mean)\b")
FIRST_PERSON_INTENT_RE = re.compile(
    r"\b(i\s+(still\s+)?(want|wanna|need|plan|intend|am\s+going|'m\s+going|will)\s+to|help\s+me|"
    r"how\s+(do|can|could|should)\s+i|teach\s+me|tell\s+me\s+how)\b"
)

# 1. Victim Support Patterns (Always Safe, 0 Warning)
VICTIM_PATTERNS = [
    r"\b(i am being|i was|someone is|they are)\s+(threatened|extorted|blackmailed|harassed|stalked|cheated|scammed|defrauded)\b",
    r"\b(received\s+a\s+(threat|blackmail|extortion\s+demand|fake\s+notice))\b",
    r"\b(blackmail|extortion|threaten).*?(police|report|help|protect|stop|file)\b",
    r"\b(how\s+to\s+(report|complain\s+against|file\s+complaint\s+for|protect\s+myself\s+from))\b",
    r"\b(protection\s+order|domestic\s+violence\s+help|cyber\s+crime\s+portal)\b",
    r"\b(victim\s+of\s+(fraud|harassment|threat|cybercrime|cheating))\b",
    # Multilingual signals
    r"(धमकी\s+मिल\s+रही\s+है|ब्लैकमेल\s+किया\s+जा\s+रहा\s+है|धोखाधड़ी\s+का\s+शिकार|शिकायत\s+कैसे\s+दर्ज\s+करें)",
    r"(হুমকি\s+পাচ্ছি|ব্ল্যাকমেল\s+করা\s+হচ্ছে|প্রতারণার\s+শিকার|অভিযোগ\s+কীভাবে\s+করব)",
    r"(மிரட்டல்\s+வருகிறது|பிளாக்மெயில்\s+செய்கிறார்கள்|மோசடி\s+புகார்|எப்படி\s+பாதுகாப்பது)",
    r"(धमकी\s+येत\s+आहे|ब्लॅकमेल\s+करत\s+आहेत|फसवणूक\s+झाली\s+आहे|तक्रार\s+कशी\s+करावी)",
    r"(బెదిరింపులు\s+వస్తున్నాయి|బ్లాక్‌మెయిల్\s+చేస్తున్నారు|మోసపోయాను|ఫిర్యాదు\s+ఎలా\s+చేయాలి)"
]

# 2. Legitimate Educational / Criminal Law Inquiry Patterns (Always Safe, 0 Warning)
LEGITIMATE_PATTERNS = [
    r"\b(what\s+is\s+(the\s+)?(legal\s+)?definition|punishment\s+for|penalty\s+for|law\s+on)\b.*?\b(fraud|forgery|extortion|cheating|defamation|cybercrime|theft|section\s+\d+|ipc|bns|murder|homicide|hit\s+and\s+run|culpable\s+homicide)\b",
    r"\b(what\s+are\s+my\s+rights|rights\s+of\s+(arrested\s+person|accused|citizen))\b",
    r"\b(how\s+to\s+legally\s+(preserve|submit|prove)\s+(evidence|chats|documents|records))\b",
    r"\b(under\s+section\s+\d+|under\s+(bns|bnss|ipc|crpc|cpc|evidence\s+act|bsa))\b",
    r"\b(what\s+constitutes\s+(criminal\s+intimidation|cheating|forgery|fraud|culpable\s+homicide|murder))\b",
    r"\b(bail\s+provisions|anticipatory\s+bail|procedure\s+for\s+fir|quashing\s+fir)\b",
    r"\b(lawful\s+(process|rectification|correction|amendment))\b",
    # Multilingual
    r"(की\s+परिभाषा|के\s+लिए\s+सजा|गिरफ्तारी\s+के\s+अधिकार|कानूनी\s+अधिकार|साक्ष्य\s+संरक्षण)",
    r"(সংজ্ঞা\s+কী|শাস্তি\s+কী|গ্রেফতারের\s+অধিকার|আইনি\s+অধিকার|প্রমাণ\s+সংরক্ষণ)",
    r"(வரையறை\s+என்ன|தண்டனை\s+என்ன|கைது\s+உரிமைகள்|சட்டப்பூர்வ\s+உரிமை)",
    r"(ची\s+व्याख्या|साठी\s+शिक्षा|अटकेच्या\s+वेळचे\s+हक्क|कायदेशीर\s+हक्क)",
    r"(నిర్వచనం\s+ఏమిటి|శిక్ష\s+ఏమిటి|అరెస్టు\s+హక్కులు|చట్టపరమైన\s+హక్కులు)"
]

# 3. Explicit Harmful Intent Patterns (Prohibited Assistance, 1 Qualifying Warning)
HARMFUL_PATTERNS = [
    # A. Forgery and document / currency / credential falsification
    (
        r"\b(forge|forging|counterfeit|counterfeiting)\b.*?\b(stamp|seal|signature|document|will|degree|certificate|currency|notes?|paper|aadhaar|pan|deed|passport|records?)\b",
        RULE_FORGERY_FABRICATION,
        "Requesting assistance to forge or counterfeit legal instruments, stamps, currency, or credentials."
    ),
    (
        r"\b(make|create|generate|produce|obtain)\b.*?\b(fake|fraudulent|counterfeit|bogus)\b.*?\b(stamp|seal|signature|document|will|degree|certificate|currency|notes?|paper|aadhaar|pan|deed|passport|evidence|caste\s+certificate|death\s+certificate|birth\s+certificate|salary|bill|receipt)\b",
        RULE_FORGERY_FABRICATION,
        "Attempting to generate or obtain fraudulent, counterfeit, or fabricated legal documents or credentials."
    ),
    (
        r"\b(how\s+(can\s+i|do\s+i|to)|help\s+me|want\s+to|teach\s+me)\b.*?\b(forge|counterfeit|falsify)\b",
        RULE_FORGERY_FABRICATION,
        "Requesting instructions to forge, counterfeit, or falsify legal instruments or records."
    ),
    # B. Fabricating false evidence or framing individuals
    (
        r"\b(fabricat(e|ing)|manufactur(e|ing)|plant(ing)?)\b.*?\b(fake|false|bogus)?\s*(evidence|proof|witness|court evidence|records?)\b",
        RULE_FALSE_EVIDENCE_FRAMING,
        "Seeking to manufacture, plant, or fabricate false evidence or court testimony."
    ),
    (
        r"\b(frame\s+someone|trap\s+someone\s+with\s+false|file\s+(a\s+)?fake\s+fir|false\s+police\s+complaint\s+against)\b",
        RULE_FALSE_EVIDENCE_FRAMING,
        "Seeking to manufacture fabricated evidence or lodge deliberately false criminal accusations."
    ),
    # C. Impersonation of officials
    (
        r"\b(impersonat(e|ing)|pretend\s+to\s+be|pose\s+as)\b.*?\b(police|judge|advocate|lawyer|government|public servant|officer|ias|ips|cbi|ed|magistrate)\b",
        RULE_IMPERSONATION,
        "Inquiring about unlawful impersonation of public servants or judicial officers."
    ),
    # D. Evasion of lawful process / bribing
    (
        r"\b(bribe|bribing|pay\s+off|give\s+bribe)\b.*?\b(judge|police|officer|officers|clerk|prosecutor|magistrate|official|inspector|staff|revenue)\b",
        RULE_EVASION_OF_LAW,
        "Requesting assistance to bribe or corrupt law enforcement, public servants, or judicial officers."
    ),
    (
        r"\b(skip\s+bail|abscond|evade\s+(arrest|warrant|police)|flee\s+the\s+country\s+to\s+avoid)\b",
        RULE_EVASION_OF_LAW,
        "Seeking instructions on absconding or evading lawful judicial arrest and process."
    ),
    # E. Extortion & Threats facilitation
    (
        r"\b(how\s+(can\s+i|do\s+i|to)|help\s+me|teach\s+me)\b.*?\b(blackmail|extort|intimidate|threaten)\b",
        RULE_EXTORTION_THREATS,
        "Requesting methods to execute unlawful threats, extortion, or criminal intimidation."
    ),
    # Multilingual harmful patterns
    (
        r"(फर्जी|जाली|नकली)\s+(दस्तावेज़|स्टाम्प|हस्ताक्षर|सर्टिफिकेट|सबूत|करेंसी|रुपये|नोट|प्रमाणपत्र)",
        RULE_FORGERY_FABRICATION,
        "दस्तावेज़, स्टाम्प या प्रमाण-पत्र में जालसाजी या धोखाधड़ी का अनुरोध।"
    ),
    (
        r"(रिश्वत\s+(कैसे\s+दें|देना)|पुलिस\s+से\s+कैसे\s+बचें|फरार\s+होना)",
        RULE_EVASION_OF_LAW,
        "रिश्वतखोरी या कानूनी गिरफ्तारी से बचने का प्रयास।"
    ),
    (
        r"(ভুয়া|জাল)\s+(নথি|স্ট্যাম্প|স্বাক্ষর|প্রমাণপত্র|টাকা)",
        RULE_FORGERY_FABRICATION,
        "জাল বা ভুয়া নথি তৈরির নির্দেশনা চাওয়া।"
    ),
    (
        r"(போலி|மோசடி)\s+(ஆவணம்|முத்திரை|கையொப்பம்|சான்றிதழ்)",
        RULE_FORGERY_FABRICATION,
        "போலி ஆவணம் அல்லது முத்திரை தயாரித்தல்."
    ),
    (
        r"(बनावट|खोटा)\s+(दस्तऐवज|स्टॅम्प|स्वाक्षरी|प्रमाणपत्र|पुरावा)",
        RULE_FORGERY_FABRICATION,
        "बनावट दस्तऐवज किंवा मुद्रांक तयार करण्याची विचारणा."
    ),
    (
        r"(నకిలీ|దొంగ)\s+(పత్రం|స్టాంపు|సంతకం|సర్టిఫికేట్|రుజువు)",
        RULE_FORGERY_FABRICATION,
        "నకిలీ పత్రాలు లేదా స్టాంపులను సృష్టించే విజ్ఞప్తి."
    ),
]

# 4. Ambiguous Patterns (Clarification Needed, 0 Warning)
AMBIGUOUS_SAFETY_PATTERNS = [
    (
        r"\b(alter|change|modify|edit)\s+(dates?|terms|clauses?|figures?|numbers?)\s+(on|in)\s+(a\s+)?(contract|agreement|document|receipt|deed)\b",
        RULE_AMBIGUOUS_DOC_ALTERATION,
        "document_alteration"
    ),
    (
        r"\b(can\s+i|how\s+to)\s+(change|alter|modify|edit)\s+(terms|dates?|clauses?|conditions?)?\s*(in|on)?\s*(a\s+)?(contract|agreement|document|deed)\s*(without|so\s+(nobody|no\s+one))\b",
        RULE_AMBIGUOUS_DOC_ALTERATION,
        "document_alteration"
    ),
    (
        r"\b(change|alter|modify)\s+(a\s+)?(document|contract|agreement|receipt)\s+so\s+(nobody|no\s+one)\s+(questions|catches|notices)\s+it\b",
        RULE_AMBIGUOUS_DOC_ALTERATION,
        "document_alteration"
    ),
    (
        r"\b(how\s+to\s+(alter|change|edit)\s+a\s+(signed|executed)\s+(contract|agreement|deed))\b",
        RULE_AMBIGUOUS_DOC_ALTERATION,
        "document_alteration"
    ),
    (
        r"\b(can\s+i|how\s+to)\s+(hide|conceal|transfer)\s+(assets|property|money)\s+(before|during)\s+(divorce|court\s+case|recovery|attachment)\b",
        RULE_AMBIGUOUS_FINANCIAL_ASSETS,
        "asset_disclosure"
    ),
    (
        r"\b(delete|destroy)\s+(messages|chats|files)\s+(before\s+police|so\s+court\s+cannot\s+find)\b",
        RULE_AMBIGUOUS_PROCEDURAL_BYPASS,
        "evidence_handling"
    ),
    # 5. Illegal Activity & Harm Patterns (Clarification Needed First, Warning/Termination if Persisted)
    (
        r"\b(murder|murdering|commit\s+(a\s+)?murder|plan\s+(a\s+)?murder|how\s+to\s+murder)\b",
        RULE_ILLEGAL_HARM,
        "murder_violence"
    ),
    (
        r"\b(hit\s+and\s+run|hit\s*&\s*run|ran\s+(someone|somebody|a\s+person|a\s+pedestrian)\s+over|flee\s+(the\s+)?(accident|scene|crash)|hit\s+someone\s+with\s+(my\s+)?car\s+and\s+(ran|fled|left))\b",
        RULE_HIT_AND_RUN,
        "hit_and_run"
    ),
    (
        r"\b(unalive\s+(someone|somebody|a\s+person|them|him|her)|how\s+to\s+unalive|unaliving)\b",
        RULE_ILLEGAL_HARM,
        "murder_violence"
    ),
    (
        r"\b(how\s+to\s+kill(?!\s+" + _HARMLESS_OBJECTS + r"\b)|kill\s+(someone|somebody|a\s+person|my|them|him|her)|help\s+me\s+kill|want\s+to\s+kill|hire\s+(a\s+)?hitman)\b",
        RULE_ILLEGAL_HARM,
        "murder_violence"
    ),
    (
        r"\b(inflict\s+(physical\s+)?harm|harm\s+(someone|others|somebody|a\s+person|them|him|her)|how\s+to\s+(hurt|injure|beat\s+up|poison|attack|assault|stab|shoot|strangle|break\s+(their|someone's)\s+legs?|acid\s+attack))\b",
        RULE_ILLEGAL_HARM,
        "murder_violence"
    ),
    (
        r"\b(inflict\s+(emotional|psychological)\s+harm|harm\s+someone\s+(emotionally|psychologically)|destroy\s+(someone|them|him|her)\s+(emotionally|psychologically|mentally)|traumatize\s+(someone|them|him|her)|how\s+to\s+(harass|torment|bully)\s+someone\s+until|drive\s+(someone|them|him|her)\s+to\s+(suicide|insanity|breakdown))\b",
        RULE_PSYCHOLOGICAL_HARM,
        "emotional_psychological_harm"
    ),
    (
        r"\b(how\s+to\s+(commit|do|execute)\s+(an\s+)?illegal|promote\s+illegal|help\s+me\s+(rob|kidnap|extort|traffic))\b",
        RULE_ILLEGAL_HARM,
        "general_illegal_harm"
    )
]

# Localized Clarification Questions (PART D)
CLARIFICATION_PROMPTS = {
    "document_alteration": {
        "en": "Could you clarify what you mean? Are you trying to correct an inaccurate document through a lawful process (such as a formal Rectification Deed or mutual addendum), or are you inquiring about altering signed records without consent?",
        "hi": "क्या आप स्पष्ट कर सकते हैं कि आपका क्या अभिप्राय है? क्या आप किसी दस्तावेज़ में हुई त्रुटि को वैध कानूनी प्रक्रिया (जैसे सुधार विलेख/Rectification Deed) से ठीक करना चाहते हैं, या बिना सहमति हस्ताक्षरित रिकॉर्ड बदलने के बारे में पूछ रहे हैं?",
        "bn": "আপনি কি বিষয়টি স্পষ্ট করতে পারেন? আপনি কি কোনো আইনি প্রক্রিয়ার (যেমন আনুষ্ঠানিক সংশোধন দলিল বা পারস্পরিক চুক্তি) মাধ্যমে নথির ভুল সংশোধন করতে চান, নাকি সম্মতি ছাড়া স্বাক্ষরিত নথি পরিবর্তনের কথা জানতে চাইছেন?",
        "ta": "உங்கள் கேள்வியை சற்று தெளிவுபடுத்த முடியுமா? நீங்கள் சட்டப்பூர்வ நடைமுறை (திருத்தப் பத்திரம் அல்லது பரஸ்பர ஒப்பந்தம்) மூலம் ஆவணப் பிழையைச் சரிசெய்ய முயற்சிக்கிறீர்களா, அல்லது ஒப்புதல் இல்லாமல் மாற்ற வினவுகிறீர்களா?",
        "mr": "कृपया आपला उद्देश स्पष्ट करू शकाल का? आपण कायदेशीर प्रक्रियेद्वारे (उदा. सुधारणा करार/Rectification Deed) दस्तऐवजातील चूक दुरुस्त करू इच्छिता, की संमतीशिवाय स्वाक्षरी केलेला दस्तऐवज बदलण्याबाबत विचारत आहात?",
        "te": "మీ ఉద్దేశాన్ని దయచేసి స్పష్టం చేయగలరా? మీరు చట్టబద్ధమైన ప్రక్రియ (రెక్టిఫికేషన్ డీడ్ లేదా పరస్పర సవరణ) ద్వారా పత్రంలోని లోపాన్ని సరిదిద్దాలనుకుంటున్నారా, లేదా అనుమతి లేకుండా మార్చడం గురించి అడుగుతున్నారా?"
    },
    "asset_disclosure": {
        "en": "Could you clarify the lawful purpose of this inquiry? Are you looking for legitimate estate planning, family trust structuring, or asking about disclosure obligations during judicial proceedings?",
        "hi": "कृपया इस प्रश्न का कानूनी उद्देश्य स्पष्ट करें: क्या आप वैध पारिवारिक ट्रस्ट या संपदा योजना के बारे में पूछ रहे हैं, या न्यायिक कार्यवाही के दौरान संपत्ति प्रकटीकरण दायित्वों के बारे में?",
        "bn": "দয়া করে আপনার অনুসন্ধানের উদ্দেশ্য স্পষ্ট করুন: আপনি কি বৈধ পারিবারিক ট্রাস্ট বা এস্টেট পরিকল্পনা জানতে চাইছেন, নাকি আইনি প্রক্রিয়ায় সম্পদ প্রকাশের বাধ্যবাধকতা সম্পর্কে জানতে চান?",
        "ta": "உங்கள் கேள்வியின் சட்டப்பூர்வ நோக்கத்தை தெளிவுபடுத்த முடியுமா? நீங்கள் குடும்ப அறக்கட்டளை திட்டமிடல் பற்றிக் கேட்கிறீர்களா, அல்லது நீதிமன்ற நடவடிக்கைகளின் போது சொத்து வெளிப்படுத்தல் விதிகள் பற்றியா?",
        "mr": "कृपया या चौकशीचा कायदेशीर उद्देश स्पष्ट करा: आपण कायदेशीर कौटुंबिक ट्रस्ट रचनेबद्दल विचारत आहात, की न्यायालयीन कामकाजादरम्यान मालमत्ता जाहीर करण्याच्या नियमांबद्दल?",
        "te": "దయచేసి మీ చట్టపరమైన ఉద్దేశాన్ని స్పష్టం చేయండి: మీరు కుటుంబ ట్రస్ట్ లేదా ఎస్టేట్ ప్లానింగ్ గురించి అడుగుతున్నారా, లేదా న్యాయస్థాన విచారణలో ఆస్తుల వెల్లడి బాధ్యతల గురించా?"
    },
    "evidence_handling": {
        "en": "Could you clarify your situation? Are you inquiring about digital privacy rights and personal data protection, or legal rules concerning the preservation of evidence?",
        "hi": "कृपया अपनी स्थिति स्पष्ट करें: क्या आप व्यक्तिगत डिजिटल गोपनीयता और डेटा संरक्षण अधिकारों के बारे में पूछ रहे हैं, या साक्ष्य संरक्षण से जुड़े कानूनी नियमों के बारे में?",
        "bn": "দয়া করে আপনার বিষয়টি স্পষ্ট করুন: আপনি কি ব্যক্তিগত ডিজিটাল গোপনীয়তা সম্পর্কে জানতে চাইছেন, নাকি প্রমাণ সংরক্ষণের আইনি নিয়ম সম্পর্কে জানতে চাইছেন?",
        "ta": "உங்கள் சூழ்நிலையை தெளிவுபடுத்த முடியுமா? நீங்கள் தனிப்பட்ட டிஜிட்டల్ தனியுரிமை உரிமைகள் பற்றிக் கேட்கிறீர்களா, அல்லது சான்றுகளைப் பாதுகாக்கும் சட்ட விதிகள் பற்றியா?",
        "mr": "कृपया आपली स्थिती स्पष्ट करा: आपण डिजिटल गोपनीयतेच्या हक्कांबद्दल विचारत आहात, की पुरावे जतन करण्याच्या कायदेशीर नियमांबद्दल?",
        "te": "దయచేసి మీ పరిస్థితిని స్పష్టం చేయండి: మీరు డిజిటల్ గోప్యతా హక్కుల గురించి అడుగుతున్నారా, లేదా సాక్ష్యాల భద్రతకు సంబంధించిన చట్టపరమైన నిబంధనల గురించా?"
    },
    "murder_violence": {
        "en": "Could you clarify your query? Are you asking about the statutory legal provisions, definitions, and penalties for murder or culpable homicide under the Bharatiya Nyaya Sanhita (BNS) and rights of criminal defense, or legal protections for victims of violent crime?",
        "hi": "क्या आप अपने कानूनी प्रश्न को स्पष्ट कर सकते हैं? क्या आप भारतीय न्याय संहिता (BNS) के तहत हत्या या गैर-इरादतन हत्या के कानूनी प्रावधानों, परिभाषा और सजा के बारे में पूछ रहे हैं, या पीड़ित सहायता के कानूनी उपायों के बारे में?",
        "bn": "আপনি কি আপনার আইনি প্রশ্নটি স্পষ্ট করতে পারেন? আপনি কি ভারতীয় ন্যায় সংহিতা (BNS)-এর অধীনে হত্যা বা অনিচ্ছাকৃত হত্যার আইনি বিধান ও শাস্তি সম্পর্কে জানতে চাইছেন, নাকি সহিংসতার শিকার ব্যক্তিদের আইনি প্রতিকার সম্পর্কে?",
        "ta": "உங்கள் கேள்வியை தெளிவுபடுத்த முடியுமா? பாரதிய நியாய சன்ஹிதா (BNS) சட்டத்தின் கீழ் கொலை அல்லது மரணம் விளைவித்தல் தொடர்பான சட்ட விதிகளையும் தண்டனைகளையும் பற்றி கேட்கிறீர்களா, அல்லது பாதிக்கப்பட்டவர்களுக்கான சட்ட தீர்வுகளைப் பற்றியா?",
        "mr": "कृपया आपला कायदेशीर प्रश्न स्पष्ट करू शकाल का? आपण भारतीय न्याय संहिता (BNS) अंतर्गत खून किंवा सदोष मनुष्यवधाच्या कायदेशीर तरतुदी आणि शिक्षेबद्दल विचारत आहात, की हिंसाचाराच्या बळींसाठीच्या कायदेशीर उपायांबद्दल?",
        "te": "దయచేసి మీ చట్టపరమైన ప్రశ్నను స్పష్టం చేయగలరా? మీరు భారతీయ న్యాయ సంహిత (BNS) కింద హత్య లేదా నేరపూరిత నరహత్యకు సంబంధించిన చట్టపరమైన నిబంధనలు మరియు శిక్షల గురించి అడుగుతున్నారా, లేక బాధితుల చట్టపరమైన పరిష్కారాల గురించా?"
    },
    "hit_and_run": {
        "en": "Could you clarify your query? Are you asking about the statutory penalties and legal procedures for road accidents and hit-and-run under Section 106 of the Bharatiya Nyaya Sanhita (BNS) and Motor Vehicles Act, or how to lawfully report an accident and claim insurance compensation?",
        "hi": "क्या आप अपने प्रश्न को स्पष्ट कर सकते हैं? क्या आप भारतीय न्याय संहिता (BNS) की धारा 106 और मोटर वाहन अधिनियम के तहत हिट-एंड-रन और सड़क दुर्घटनाओं की कानूनी प्रक्रियाओं व सजा के बारे में पूछ रहे हैं, या दुर्घटना की रिपोर्ट और मुआवजे के कानूनी तरीके के बारे में?",
        "bn": "আপনি কি আপনার বিষয়টি স্পষ্ট করতে পারেন? আপনি কি ভারতীয় ন্যায় সংহিতা (BNS)-এর ১০৬ ধারা এবং মোটর যান আইনের অধীনে হিট-অ্যান্ড-রান এবং সড়ক দুর্ঘটনার আইনি प्रक्रिया ও শাস্তি সম্পর্কে জানতে চান, নাকি দুর্ঘটনার অভিযোগ দায়ের ও ক্ষতিপূরণ দাবির বিষয়ে?",
        "ta": "உங்கள் கேள்வியை தெளிவுபடுத்த முடியுமா? பாரதிய நியாய சன்ஹிதா (BNS) பிரிவு 106 மற்றும் மோட்டார் வாகனச் சட்டத்தின் கீழ் விபத்து மற்றும் ஹிட்-அண்ட்-ரன் வழக்குகளுக்கான சட்ட நடைமுறைகள் பற்றி கேட்கிறீர்களா, அல்லது சட்டப்பூர்வ புகார் மற்றும் இழப்பீடு கோருவது பற்றியா?",
        "mr": "कृपया आपला प्रश्न स्पष्ट करू शकाल का? आपण भारतीय न्याय संहिता (BNS) च्या कलम 106 व मोटार वाहन कायद्यांतर्गत हिट-अँड-रन आणि अपघाताच्या कायदेशीर प्रक्रिया व शिक्षेबद्दल विचारत आहात, की अपघाताची रीतसर तक्रार आणि नुकसानभरपाई मिळवण्याबद्दल?",
        "te": "దయచేసి మీ ప్రశ్నను స్పష్టం చేయగలరా? మీరు భారతీయ న్యాయ సంహిత (BNS) సెక్షన్ 106 మరియు మోటారు వాహనాల చట్టం కింద హిట్-అండ్-రన్ మరియు రోడ్డు ప్రమాదాల చట్టపరమైన ప్రక్రియలు, శిక్షల గురించి అడుగుతున్నారా, లేక ప్రమాదాన్ని నివేదించడం మరియు పరిహారం క్లెయిమ్ చేయడం గురించా?"
    },
    "emotional_psychological_harm": {
        "en": "Could you clarify what you mean? Are you seeking information on statutory legal protections, definitions, and legal remedies against harassment, criminal intimidation, or emotional and psychological abuse under Indian law?",
        "hi": "क्या आप स्पष्ट कर सकते हैं कि आपका क्या अभिप्राय है? क्या आप भारतीय कानून के तहत उत्पीड़न, आपराधिक धमकी, या भावनात्मक व मानसिक शोषण के खिलाफ वैधानिक कानूनी सुरक्षा और उपायों की जानकारी चाहते हैं?",
        "bn": "আপনি কি বিষয়টি স্পষ্ট করতে পারেন? আপনি কি ভারতীয় আইনের অধীনে হয়রানি, অপরাধমূলক ভীতি প্রদর্শন বা মানসিক নির্যাতনের বিরুদ্ধে আইনি সুরক্ষা এবং প্রতিকার সম্পর্কে জানতে চাইছেন?",
        "ta": "உங்கள் நோக்கத்தை தெளிவுபடுத்த முடியுமா? இந்திய சட்டத்தின் கீழ் துன்புறுத்தல், மிரட்டல் அல்லது மனரீதியான துன்புறுத்தலுக்கு எதிரான சட்டப்பூர்வ பாதுகாப்பு மற்றும் தீர்வுகள் பற்றிய தகவலை நாடுகிறீர்களா?",
        "mr": "कृपया आपला उद्देश स्पष्ट कराल का? आपण भारतीय कायद्यांतर्गत छळ, गुन्हेगारी धमकी किंवा भावनिक व मानसिक त्रासाविरुद्धच्या कायदेशीर संरक्षण व उपायांबद्दल माहिती विचारत आहात का?",
        "te": "మీ ఉద్దేశాన్ని దయచేసి స్పష్టం చేయగలరా? మీరు భారతీయ చట్టం ప్రకారం వేధింపులు, క్రిమినల్ బెదిరింపులు లేదా మానసిక వేధింపులకు వ్యతిరేకంగా చట్టపరమైన రక్షణలు మరియు పరిష్కారాల గురించి సమాచారం కోరుతున్నారా?"
    },
    "general_illegal_harm": {
        "en": "Could you clarify your query? Are you asking about the statutory definitions, legal penalties, and lawful defense rights under Indian criminal law, or seeking lawful assistance?",
        "hi": "क्या आप अपने प्रश्न को स्पष्ट कर सकते हैं? क्या आप भारतीय आपराधिक कानून के तहत वैधानिक परिभाषाओं, कानूनी सजा और वैध बचाव के बारे में पूछ रहे हैं, या कोई कानूनी सहायता चाहते हैं?",
        "bn": "আপনি কি আপনার বিষয়টি স্পষ্ট করতে পারেন? আপনি কি ভারতীয় ফৌজদারি আইনের অধীনে আইনি সংজ্ঞা, শাস্তি ও আইনানুগ আত্মরক্ষা সম্পর্কে জানতে চান, নাকি বৈধ আইনি সহায়তা চাইছেন?",
        "ta": "உங்கள் கேள்வியை தெளிவுபடுத்த முடியுமா? நீங்கள் இந்திய குற்றவியல் சட்டத்தின் கீழ் சட்டப்பூர்வ வரையறைகள், தண்டனைகள் மற்றும் சட்டப்பூர்வ தற்காப்பு உரிமைகள் பற்றி கேட்கிறீர்களா?",
        "mr": "कृपया आपला प्रश्न स्पष्ट करू शकाल का? आपण भारतीय फौजदारी कायद्यांतर्गत कायदेशीर व्याख्या, शिक्षा आणि कायदेशीर बचावाच्या अधिकारांबद्दल विचारत आहात का?",
        "te": "దయచేసి మీ ప్రశ్నను స్పష్టం చేయగలరా? మీరు భారతీయ క్రిమినల్ చట్టం కింద చట్టపరమైన నిర్వచనాలు, శిక్షలు మరియు చట్టబద్ధమైన రక్షణల గురించి అడుగుతున్నారా?"
    },
    "unlawful_conduct": {
        "en": "Could you clarify your query? Did you mean to ask what the law says about this act (its definition and penalties under the Bharatiya Nyaya Sanhita), or how to obtain, correct or report the matter through a lawful process?",
        "hi": "क्या आप अपने प्रश्न को स्पष्ट कर सकते हैं? क्या आप यह पूछना चाहते हैं कि भारतीय न्याय संहिता के तहत इस कृत्य की परिभाषा और सजा क्या है, या इसे वैध प्रक्रिया से प्राप्त करने, सुधारने या इसकी शिकायत करने का तरीका क्या है?",
        "bn": "আপনি কি আপনার প্রশ্নটি স্পষ্ট করতে পারেন? আপনি কি জানতে চান ভারতীয় ন্যায় সংহিতা অনুযায়ী এই কাজের সংজ্ঞা ও শাস্তি কী, নাকি বৈধ প্রক্রিয়ায় বিষয়টি পাওয়া, সংশোধন করা বা অভিযোগ জানানোর উপায় কী?",
        "ta": "உங்கள் கேள்வியை தெளிவுபடுத்த முடியுமா? பாரதிய நியாய சன்ஹிதாவின் கீழ் இந்தச் செயலின் வரையறை மற்றும் தண்டனை பற்றிக் கேட்கிறீர்களா, அல்லது சட்டப்பூர்வ நடைமுறையில் இதைப் பெறுவது, திருத்துவது அல்லது புகார் அளிப்பது பற்றியா?",
        "mr": "कृपया आपला प्रश्न स्पष्ट करू शकाल का? भारतीय न्याय संहितेनुसार या कृत्याची व्याख्या आणि शिक्षा काय आहे, हे आपण विचारत आहात, की कायदेशीर प्रक्रियेद्वारे हे मिळवणे, दुरुस्त करणे किंवा तक्रार करणे याबद्दल?",
        "te": "దయచేసి మీ ప్రశ్నను స్పష్టం చేయగలరా? భారతీయ న్యాయ సంహిత ప్రకారం ఈ చర్య యొక్క నిర్వచనం మరియు శిక్ష గురించి అడుగుతున్నారా, లేక చట్టబద్ధమైన ప్రక్రియ ద్వారా దీనిని పొందడం, సరిదిద్దడం లేదా ఫిర్యాదు చేయడం గురించా?"
    }
}

# Every clarification question the safety engine can ask, mapped back to its key.
SAFETY_CLARIFICATION_TEXTS = {
    text: key for key, by_lang in CLARIFICATION_PROMPTS.items() for text in by_lang.values()
}

CRISIS_SUPPORT_MESSAGES = {
    "en": "It sounds like you may be going through something very painful, and you don't have to face it alone. Please reach out now: Tele-MANAS (free, 24x7) on 14416 or 1-800-891-4416, or call 112 if you are in immediate danger. Talking to someone you trust can also help.",
    "hi": "ऐसा लगता है कि आप किसी बहुत कठिन दौर से गुज़र रहे हैं, और आपको इसका सामना अकेले नहीं करना है। कृपया अभी संपर्क करें: टेली-मानस (निःशुल्क, 24x7) 14416 या 1-800-891-4416 पर, या तत्काल खतरे में 112 पर कॉल करें।",
    "bn": "মনে হচ্ছে আপনি খুব কঠিন সময়ের মধ্য দিয়ে যাচ্ছেন, এবং আপনাকে একা এর মুখোমুখি হতে হবে না। অনুগ্রহ করে এখনই যোগাযোগ করুন: টেলি-মানস (বিনামূল্যে, ২৪x৭) 14416 বা 1-800-891-4416, অথবা তাৎক্ষণিক বিপদে 112-এ কল করুন।",
    "ta": "நீங்கள் மிகவும் கடினமான சூழலில் இருப்பதாகத் தெரிகிறது; இதை நீங்கள் தனியாக எதிர்கொள்ள வேண்டியதில்லை. தயவுசெய்து இப்போதே தொடர்பு கொள்ளுங்கள்: டெலி-மானஸ் (இலவசம், 24x7) 14416 அல்லது 1-800-891-4416, உடனடி ஆபத்தில் 112 ஐ அழைக்கவும்.",
    "mr": "आपण खूप कठीण प्रसंगातून जात आहात असे वाटते, आणि याचा सामना आपल्याला एकट्याने करावा लागणार नाही. कृपया आत्ताच संपर्क साधा: टेली-मानस (मोफत, 24x7) 14416 किंवा 1-800-891-4416, किंवा तात्काळ धोका असल्यास 112 वर कॉल करा.",
    "te": "మీరు చాలా కష్టమైన పరిస్థితిలో ఉన్నట్లు అనిపిస్తోంది, దీన్ని మీరు ఒంటరిగా ఎదుర్కోవాల్సిన అవసరం లేదు. దయచేసి ఇప్పుడే సంప్రదించండి: టెలి-మానస్ (ఉచితం, 24x7) 14416 లేదా 1-800-891-4416, తక్షణ ప్రమాదంలో ఉంటే 112 కి కాల్ చేయండి."
}

# Localized Refusal & Lawful Alternative Messages (PART E & F)
REFUSAL_MESSAGES = {
    "en": {
        "text": "VIDHIVRAKSH cannot provide instructions or actionable assistance to fabricate documents, impersonate officials, or evade lawful judicial processes.",
        "lawful_alternative": "Lawful Option: If a document requires correction, parties may execute a formal Rectification Deed under Section 26 of the Specific Relief Act, 1963. If you require legal remedies, consult an authorized advocate."
    },
    "hi": {
        "text": "VIDHIVRAKSH जाली दस्तावेज़ बनाने, अधिकारियों का रूप धारण करने या कानूनी प्रक्रियाओं से बचने के लिए कोई सहायता या निर्देश प्रदान नहीं कर सकता।",
        "lawful_alternative": "कानूनी विकल्प: यदि किसी दस्तावेज़ में संशोधन की आवश्यकता है, तो विशिष्ट अनुतोष अधिनियम, 1963 की धारा 26 के तहत औपचारिक सुधार विलेख निष्पादित किया जा सकता है। कानूनी सहायता हेतु किसी अधिकृत अधिवक्ता से परामर्श करें।"
    },
    "bn": {
        "text": "VIDHIVRAKSH ভুয়া নথি তৈরি, কর্মকর্তাদের ছদ্মবেশ ধারণ বা আইনি প্রক্রিয়া এড়ানোর জন্য কোনো সহায়তা বা নির্দেশনা প্রদান করতে পারে না।",
        "lawful_alternative": "আইনি বিকল্প: কোনো নথি সংশোধনের প্রয়োজন হলে নির্দিষ্ট প্রতিকার আইনের ২৬ ধারার অধীনে একটি আনুষ্ঠানিক সংশোধন দলিল সম্পাদন করা যেতে পারে। একজন অনুমোদিত আইনজীবীর পরামর্শ নিন।"
    },
    "ta": {
        "text": "போலி ஆவணங்களை உருவாக்குவது, அதிகாரிகளைப் போல் ஆள்மாறாட்டம் செய்வது அல்லது சட்ட நடைமுறைகளைத் தவிர்ப்பதற்கான வழிகாட்டலை VIDHIVRAKSH வழங்க முடியாது.",
        "lawful_alternative": "சட்டப்பூர்வ தீர்வு: ஆவணத்தில் திருத்தம் தேவைப்பட்டால், குறிப்பிட்ட நிவாரணச் சட்டம் 1963 பிரிவு 26 இன் கீழ் முறையான திருத்தப் பத்திரத்தை நிறைவேற்றலாம். தகுதியான வழக்கறிஞரை அணுகவும்."
    },
    "mr": {
        "text": "VIDHIVRAKSH बनावट दस्तऐवज तयार करणे, अधिकाऱ्यांचे सोंग घेणे किंवा कायदेशीर प्रक्रिया टाळण्यासाठी कोणतीही मदत किंवा सूचना देऊ शकत नाही.",
        "lawful_alternative": "कायदेशीर पर्याय: दस्तऐवजात दुरुस्तीची आवश्यकता असल्यास, विनिर्दिष्ट अनुतोष कायदा, 1963 च्या कलम 26 अंतर्गत रीतसर सुधारणा करार केला जाऊ शकतो. अधिकृत वकिलाचा सल्ला घ्या."
    },
    "te": {
        "text": "నకిలీ పత్రాలు సృష్టించడం, అధికారుల వలె నకిలీ రూపం ధరించడం లేదా చట్టపరమైన ప్రక్రియలను తప్పించుకోవడానికి VIDHIVRAKSH ఎలాంటి సహాయం లేదా సూచనలను అందించదు.",
        "lawful_alternative": "చట్టపరమైన ప్రత్యామ్నాయం: పత్రంలో సవరణ అవసరమైతే, స్పెసిఫిక్ రిలీఫ్ యాక్ట్, 1963 సెక్షన్ 26 కింద రెక్టిఫికేషన్ డీడ్ అమలు చేయవచ్చు. అధీకృత న్యాయవాదిని సంప్రదించండి."
    }
}

REFUSAL_MESSAGES_HARM = {
    "en": {
        "text": "VIDHIVRAKSH strictly prohibits providing assistance, instructions, or encouragement for illegal acts, physical violence, hit-and-run, or infliction of physical, emotional, or psychological harm.",
        "lawful_alternative": "Lawful Option: For emergencies or violence, contact 112 immediately. For legitimate legal defense, statutory penalties under the Bharatiya Nyaya Sanhita (BNS), or victim remedies, consult a certified advocate or legal aid service (NALSA)."
    },
    "hi": {
        "text": "VIDHIVRAKSH गैरकानूनी गतिविधियों, शारीरिक हिंसा, हिट-एंड-रन, या किसी को शारीरिक, भावनात्मक या मनोवैज्ञानिक नुकसान पहुंचाने में सहायता या प्रोत्साहन प्रदान नहीं करता।",
        "lawful_alternative": "कानूनी विकल्प: आपात स्थिति में 112 पर संपर्क करें। भारतीय न्याय संहिता (BNS) के तहत कानूनी बचाव या पीड़ित सहायता हेतु किसी अधिकृत अधिवक्ता से परामर्श करें।"
    },
    "bn": {
        "text": "VIDHIVRAKSH বেআইনি কার্যকলাপ, শারীরিক সহিংসতা, হিট-অ্যান্ড-রান, বা কাউকে শারীরিক, মানসিক বা মনস্তাত্ত্বিক ক্ষতিসাধনে কোনো সহায়তা বা উৎসাহ प्रदान করে না।",
        "lawful_alternative": "আইনি বিকল্প: জরুরি পরিস্থিতিতে ১১২ নম্বরে যোগাযোগ করুন। ভারতীয় ন্যায় সংহিতা (BNS)-এর অধীনে আইনি প্রতিকার বা সহায়তার জন্য একজন আইনজীবীর সাথে যোগাযোগ করুন।"
    },
    "ta": {
        "text": "சட்டவிரோத செயல்கள், வன்முறை, ஹிட்-அண்ட்-ரன், அல்லது பிறருக்கு உடல், உணர்ச்சி அல்லது உளவியல் ரீதியான தீங்கு விளைவிப்பதற்கு VIDHIVRAKSH வழிகாட்டவோ உதவவோ மாட்டாது.",
        "lawful_alternative": "சட்டப்பூர்வ தீர்வு: அவசர உதவிக்கு 112 ஐ தொடர்பு கொள்ளவும். பாரதிய நியாய சன்ஹிதா (BNS) சட்டப் பாதுகாப்பிற்கு அங்கீகரிக்கப்பட்ட வழக்கறிஞரை அணுகவும்."
    },
    "mr": {
        "text": "VIDHIVRAKSH बेकायदेशीर कृत्ये, शारीरिक हिंसा, हिट-अँड-रन, किंवा कोणासही शारीरिक, भावनिक किंवा मानसिक हानी पोहोचवण्यास मदत किंवा प्रोत्साहन देत नाही.",
        "lawful_alternative": "कायदेशीर पर्याय: आणीबाणीच्या वेळी 112 वर संपर्क साधा. भारतीय न्याय संहिता (BNS) अंतर्गत कायदेशीर संरक्षणासाठी अधिकृत वकिलाचा सल्ला घ्या."
    },
    "te": {
        "text": "చట్టవిరుద్ధమైన కార్యకలాపాలు, హింస, హిట్-అండ్-రన్, లేదా ఇతరులకు శారీరక, భావోద్వేగ లేదా మానసిక హాని కలిగించడంలో VIDHIVRAKSH ఎటువంటి సహాయాన్ని అందించదు.",
        "lawful_alternative": "చట్టపరమైన ప్రత్యామ్నాయం: అత్యవసర పరిస్థితుల్లో 112 కి కాల్ చేయండి. చట్టబద్ధమైన రక్షణ లేదా న్యాయ సహాయం కోసం ధృవీకరించబడిన న్యాయవాదిని సంప్రదించండి."
    }
}

class SafetyClassification:
    def __init__(
        self,
        category: str,
        risk_level: str,
        rule_id: str,
        reason: str,
        requires_clarification: bool = False,
        clarification_text: Optional[str] = None,
        is_qualifying_warning: bool = False,
        refusal_text: Optional[str] = None,
        lawful_alternative: Optional[str] = None,
    ):
        self.category = category
        self.risk_level = risk_level
        self.rule_id = rule_id
        self.reason = reason
        self.requires_clarification = requires_clarification
        self.clarification_text = clarification_text
        self.is_qualifying_warning = is_qualifying_warning
        self.refusal_text = refusal_text
        self.lawful_alternative = lawful_alternative

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "risk_level": self.risk_level,
            "rule_id": self.rule_id,
            "reason": self.reason,
            "requires_clarification": self.requires_clarification,
            "clarification_text": self.clarification_text,
            "is_qualifying_warning": self.is_qualifying_warning,
            "refusal_text": self.refusal_text,
            "lawful_alternative": self.lawful_alternative,
        }

def _clarify(rule_id: str, prompt_key: str, lang: str, reason: str) -> SafetyClassification:
    prompts = CLARIFICATION_PROMPTS.get(prompt_key, CLARIFICATION_PROMPTS["general_illegal_harm"])
    return SafetyClassification(
        category=CAT_AMBIGUOUS,
        risk_level="medium",
        rule_id=rule_id,
        reason=reason,
        requires_clarification=True,
        clarification_text=prompts.get(lang, prompts["en"]),
        is_qualifying_warning=False,
    )


def _refuse(rule_id: str, prompt_key: Optional[str], lang: str, reason: str) -> SafetyClassification:
    table = REFUSAL_MESSAGES_HARM if prompt_key in HARM_CLARIFICATION_KEYS else REFUSAL_MESSAGES
    refusal = table.get(lang, table["en"])
    return SafetyClassification(
        category=CAT_HARMFUL,
        risk_level="high",
        rule_id=rule_id,
        reason=reason,
        requires_clarification=False,
        is_qualifying_warning=True,
        refusal_text=refusal["text"],
        lawful_alternative=refusal["lawful_alternative"],
    )


def _match_unlawful(text: str) -> Optional[tuple]:
    """Returns (rule_id, clarification_key, reason) for the first unlawful-request pattern the text matches."""
    for pat, rule_id, key in HARM_INTENT_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return rule_id, key, "Request expresses intent to inflict physical, emotional or psychological harm on another person."
    for pat, rule_id, reason in HARMFUL_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return rule_id, "unlawful_conduct", reason
    return None


def _match_ambiguous(text: str) -> Optional[tuple]:
    for pat, rule_id, key in AMBIGUOUS_SAFETY_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return rule_id, key
    return None


def _pending_clarification(recent_messages: Optional[List[Dict[str, Any]]]) -> tuple:
    """
    If the assistant's last message was a safety clarification question, returns its prompt key and
    the rule matched by the user request that prompted it. Otherwise returns (None, None).
    """
    msgs = recent_messages or []
    for idx in range(len(msgs) - 1, -1, -1):
        if msgs[idx].get("role") != "assistant":
            continue
        key = SAFETY_CLARIFICATION_TEXTS.get((msgs[idx].get("content") or "").strip())
        if not key:
            return None, None
        original = next((m for m in reversed(msgs[:idx]) if m.get("role") == "user"), None)
        original_text = (original.get("content") or "").strip().lower() if original else ""
        match = _match_unlawful(original_text) or _match_ambiguous(original_text)
        return key, (match[0] if match else CLARIFICATION_KEY_RULES.get(key, RULE_ILLEGAL_HARM))
    return None, None


def evaluate_message_safety(
    text: str,
    recent_messages: Optional[List[Dict[str, Any]]] = None,
    lang: str = "en"
) -> SafetyClassification:
    """
    Deterministically evaluates user message safety.

    Any request that promotes or seeks help with illegal activity or harm to others first receives a
    clarification question offering the lawful version of the query. If the user persists with the
    original intent in their next message, the request is refused with a qualifying warning, which
    terminates the chat (three warnings suspend the account).
    """
    safe_lang = lang if lang in REFUSAL_MESSAGES else "en"
    clean_text = text.strip().lower()

    # --- Step 0: Self-harm signals always get support resources, never a warning ---
    for pat in SELF_HARM_PATTERNS:
        if re.search(pat, clean_text, re.IGNORECASE):
            return SafetyClassification(
                category=CAT_CRISIS_SUPPORT,
                risk_level="high",
                rule_id=RULE_SELF_HARM_SUPPORT,
                reason="Message indicates possible risk of self-harm; support resources provided.",
            )

    unlawful = _match_unlawful(clean_text)
    ambiguous = _match_ambiguous(clean_text)

    # --- Step 1: Reply to a pending safety clarification question ---
    pending_key, pending_rule = _pending_clarification(recent_messages)
    if pending_key:
        lawful_signals = [
            "lawful", "legal", "rectification", "clerical mistake", "error", "correct",
            "rectify", "mutual", "addendum", "court order", "valid", "statutory", "definition",
            "penalty", "penalties", "punishment", "victim", "report", "defense", "defence", "lawyer",
            "advocate", "rights", "bns", "section", "complaint", "fir", "insurance",
            "compensation", "protect", "remedy", "law student", "research", "consent",
            "वैध", "सुधार", "गलती", "त्रुटि", "ভুল সংশোধন", "சட்டப்பூர்வ",
            "दुरुस्ती", "चूक", "చట్టబద్ధ", "సరిదిద్దడం", "कानूनी", "सजा", "प्रावधान"
        ]
        harmful_words = [
            "forge", "fake", "counterfeit", "fabricate", "without consent", "hide assets",
            "cheat", "deceive", "frame him", "frame her", "bribe", "murder", "kill", "hit and run",
            "unalive", "harm", "hurt", "injure", "poison", "destroy", "harass", "attack", "flee",
            "hide my car", "hide the", "escape", "get rid of",
            "फर्जी", "जाली", "धोखा", "मारना", "हत्या", "ভুয়া", "জাল", "খুন", "போலி", "கொலை",
            "बनावट", "खून", "నకిలీ", "హత్య"
        ]
        has_lawful = any(w in clean_text for w in lawful_signals)
        has_harmful = any(w in clean_text for w in harmful_words)
        has_intent = bool(FIRST_PERSON_INTENT_RE.search(clean_text))
        persists = (
            unlawful is not None
            or bool(PERSIST_STRONG_RE.search(clean_text))
            or (bool(PERSIST_WEAK_RE.search(clean_text)) and not has_lawful)
            or (has_harmful and (has_intent or not has_lawful))
        )
        if persists:
            rule_id = pending_rule
            return _refuse(
                rule_id, pending_key, safe_lang,
                "User persisted with an unlawful or harmful request after being asked to clarify a lawful purpose.",
            )
        if has_lawful:
            return SafetyClassification(
                category=CAT_LEGITIMATE,
                risk_level="low",
                rule_id=RULE_LEGITIMATE,
                reason="User clarified lawful objective.",
            )
        # Otherwise the user moved on to a different question: classify it on its own merits below.

    # --- Step 2: Intent to harm others or commit an illegal act -> clarification first ---
    if unlawful:
        rule_id, key, reason = unlawful
        return _clarify(rule_id, key, safe_lang, reason)

    # --- Step 3: Victim Protection & Support (Category B) ---
    for pat in VICTIM_PATTERNS:
        if re.search(pat, clean_text, re.IGNORECASE):
            return SafetyClassification(
                category=CAT_VICTIM_SUPPORT,
                risk_level="low",
                rule_id=RULE_VICTIM_SUPPORT,
                reason="Protective legal query seeking victim remedies, reporting procedure, or protection.",
            )

    # --- Step 4: Legitimate Legal Inquiry (Category A) ---
    for pat in LEGITIMATE_PATTERNS:
        if re.search(pat, clean_text, re.IGNORECASE):
            return SafetyClassification(
                category=CAT_LEGITIMATE,
                risk_level="low",
                rule_id=RULE_LEGITIMATE,
                reason="Legitimate legal inquiry regarding statutory definitions, rights, or lawful procedure.",
            )

    # --- Step 5: Ambiguous / Potentially Suspicious Queries (Category C) ---
    if ambiguous:
        rule_id, key = ambiguous
        return _clarify(rule_id, key, safe_lang, "Ambiguous request with dual-use potential; establishing lawful purpose required.")

    # Default: Safe Legitimate Inquiry
    return SafetyClassification(
        category=CAT_LEGITIMATE,
        risk_level="low",
        rule_id=RULE_LEGITIMATE,
        reason="Standard legal inquiry matching supported domain.",
    )
