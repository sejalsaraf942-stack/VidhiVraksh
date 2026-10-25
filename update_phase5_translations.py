import json
import os

BASE_DIR = "/Users/sejalsaraf/Documents/Libra/frontend/src/i18n/translations"
LANGUAGES = ["en", "hi", "bn", "ta", "mr", "te"]

phase5_keys = {
    "en": {
        "auth.login": "Log In",
        "auth.signup": "Sign Up",
        "auth.modalLoginTitle": "Log In to VIDHIVRAKSH",
        "auth.modalSignupTitle": "Create your VIDHIVRAKSH Account",
        "auth.modalLoginSubtitle": "Access personalized legal awareness, saved consultations, and documents.",
        "auth.modalSignupSubtitle": "Join VIDHIVRAKSH for verified Indian legal assistance, tenancy guides, and statutory knowledge.",
        "auth.passwordLabel": "Password",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "Confirm Password",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "Full Name (Optional)",
        "auth.switchToSignup": "Don't have an account? Sign Up",
        "auth.switchToLogin": "Already have an account? Log In",
        "auth.btnLogin": "Log In",
        "auth.btnSignup": "Create Account",
        "auth.errorInvalidCredentials": "Invalid email or password.",
        "auth.errorPasswordMismatch": "Password and confirm password do not match.",
        "auth.errorPasswordShort": "Password must be at least 6 characters long.",
        "auth.errorEmptyFields": "Please fill in all required fields.",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "Account created successfully! Welcome to VIDHIVRAKSH.",
        "auth.successLogin": "Welcome back to VIDHIVRAKSH."
    },
    "hi": {
        "auth.login": "लॉग इन करें",
        "auth.signup": "खाता बनाएं",
        "auth.modalLoginTitle": "VIDHIVRAKSH में लॉग इन करें",
        "auth.modalSignupTitle": "अपना VIDHIVRAKSH खाता बनाएं",
        "auth.modalLoginSubtitle": "व्यक्तिगत कानूनी जागरूकता, सहेजे गए परामर्श और दस्तावेजों तक पहुंच प्राप्त करें।",
        "auth.modalSignupSubtitle": "सत्यापित भारतीय कानूनी सहायता, किरायेदारी नियमों और वैधानिक ज्ञान के लिए VIDHIVRAKSH से जुड़ें।",
        "auth.passwordLabel": "पासवर्ड",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "पासवर्ड की पुष्टि करें",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "पूरा नाम (वैकल्पिक)",
        "auth.switchToSignup": "खाता नहीं है? साइन अप करें",
        "auth.switchToLogin": "पहले से खाता है? लॉग इन करें",
        "auth.btnLogin": "लॉग इन करें",
        "auth.btnSignup": "खाता बनाएं",
        "auth.errorInvalidCredentials": "अमान्य ईमेल या पासवर्ड।",
        "auth.errorPasswordMismatch": "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।",
        "auth.errorPasswordShort": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
        "auth.errorEmptyFields": "कृपया सभी आवश्यक फ़ील्ड भरें।",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "खाता सफलतापूर्वक बनाया गया! VIDHIVRAKSH में आपका स्वागत है।",
        "auth.successLogin": "VIDHIVRAKSH में पुनः स्वागत है।"
    },
    "bn": {
        "auth.login": "লগ ইন করুন",
        "auth.signup": "সাইন আপ করুন",
        "auth.modalLoginTitle": "VIDHIVRAKSH-এ লগ ইন করুন",
        "auth.modalSignupTitle": "আপনার VIDHIVRAKSH অ্যাকাউন্ট তৈরি করুন",
        "auth.modalLoginSubtitle": "ব্যক্তিগত আইনি সচেতনতা, সংরক্ষিত পরামর্শ এবং নথিতে প্রবেশাধিকার পান।",
        "auth.modalSignupSubtitle": "যাচাইকৃত ভারতীয় আইনি সহায়তা, ভাড়াটে নির্দেশিকা এবং সংবিধিবদ্ধ জ্ঞানের জন্য VIDHIVRAKSH-এ যোগ দিন।",
        "auth.passwordLabel": "পাসওয়ার্ড",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "পাসওয়ার্ড নিশ্চিত করুন",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "পুরো নাম (ঐচ্ছিক)",
        "auth.switchToSignup": "অ্যাকাউন্ট নেই? সাইন আপ করুন",
        "auth.switchToLogin": "ইতিমধ্যে অ্যাকাউন্ট আছে? লগ ইন করুন",
        "auth.btnLogin": "লগ ইন করুন",
        "auth.btnSignup": "অ্যাকাউন্ট তৈরি করুন",
        "auth.errorInvalidCredentials": "ভুল ইমেল বা পাসওয়ার্ড।",
        "auth.errorPasswordMismatch": "পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।",
        "auth.errorPasswordShort": "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
        "auth.errorEmptyFields": "অনুগ্রহ করে সমস্ত প্রয়োজনীয় ঘর পূরণ করুন।",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! VIDHIVRAKSH-এ স্বাগতম।",
        "auth.successLogin": "VIDHIVRAKSH-এ পুনরায় স্বাগতম।"
    },
    "ta": {
        "auth.login": "உள்நுழைக",
        "auth.signup": "பதிவு செய்க",
        "auth.modalLoginTitle": "VIDHIVRAKSH-இல் உள்நுழைக",
        "auth.modalSignupTitle": "உங்கள் VIDHIVRAKSH கணக்கை உருவாக்கவும்",
        "auth.modalLoginSubtitle": "தனிப்பயனாக்கப்பட்ட சட்ட விழிப்புணர்வு, சேமிக்கப்பட்ட ஆலோசனைகள் மற்றும் ஆவணங்களை அணுகவும்.",
        "auth.modalSignupSubtitle": "சரிபார்க்கப்பட்ட இந்திய சட்ட உதவி, வாடகை வழிகாட்டிகள் மற்றும் சட்ட அறிவைப் பெற VIDHIVRAKSH-இல் இணையுங்கள்.",
        "auth.passwordLabel": "கடவுச்சொல்",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "கடவுச்சொல்லை உறுதிப்படுத்துக",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "முழுப் பெயர் (விருப்பத்திற்குரியது)",
        "auth.switchToSignup": "கணக்கு இல்லையா? பதிவு செய்க",
        "auth.switchToLogin": "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக",
        "auth.btnLogin": "உள்நுழைக",
        "auth.btnSignup": "கணக்கு உருவாக்குக",
        "auth.errorInvalidCredentials": "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.",
        "auth.errorPasswordMismatch": "கடவுச்சொற்கள் பொருந்தவில்லை.",
        "auth.errorPasswordShort": "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் கொண்டதாக இருக்க வேண்டும்.",
        "auth.errorEmptyFields": "தேவையான அனைத்து புலங்களையும் நிரப்பவும்.",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! VIDHIVRAKSH-க்கு வரவேற்கிறோம்.",
        "auth.successLogin": "VIDHIVRAKSH-க்கு மீண்டும் நல்வரவு."
    },
    "mr": {
        "auth.login": "लॉग इन करा",
        "auth.signup": "साइन अप करा",
        "auth.modalLoginTitle": "VIDHIVRAKSH मध्ये लॉग इन करा",
        "auth.modalSignupTitle": "आपले VIDHIVRAKSH खाते तयार करा",
        "auth.modalLoginSubtitle": "वैयक्तिक कायदेशीर जागरूकता, जतन केलेले सल्लामसलत आणि कागदपत्रांमध्ये प्रवेश मिळवा.",
        "auth.modalSignupSubtitle": "प्रमाणित भारतीय कायदेशीर साहाय्य, भाडेकरू मार्गदर्शक आणि वैधानिक ज्ञानासाठी VIDHIVRAKSH शी जोडा.",
        "auth.passwordLabel": "पासवर्ड",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "पासवर्डची पुष्टी करा",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "पूर्ण नाव (पर्यायी)",
        "auth.switchToSignup": "खाते नाही का? साइन अप करा",
        "auth.switchToLogin": "आधीच खाते आहे? लॉग इन करा",
        "auth.btnLogin": "लॉग इन करा",
        "auth.btnSignup": "खाते तयार करा",
        "auth.errorInvalidCredentials": "अवैध ईमेल किंवा पासवर्ड.",
        "auth.errorPasswordMismatch": "पासवर्ड आणि पुष्टी पासवर्ड जुळत नाहीत.",
        "auth.errorPasswordShort": "पासवर्ड किमान ६ अक्षरांचा असावा.",
        "auth.errorEmptyFields": "कृपया सर्व आवश्यक माहिती भरा.",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "खाते यशस्वीरित्या तयार केले! VIDHIVRAKSH मध्ये आपले स्वागत आहे.",
        "auth.successLogin": "VIDHIVRAKSH मध्ये पुन्हा स्वागत आहे."
    },
    "te": {
        "auth.login": "లాగిన్ చేయండి",
        "auth.signup": "సైన్ అప్ చేయండి",
        "auth.modalLoginTitle": "VIDHIVRAKSH లోకి లాగిన్ చేయండి",
        "auth.modalSignupTitle": "మీ VIDHIVRAKSH ఖాతాను సృష్టించండి",
        "auth.modalLoginSubtitle": "వ్యక్తిగతీకరించిన చట్టపరమైన అవగాహన, సేవ్ చేయబడిన సంభాషణలు మరియు పత్రాలను యాక్సెస్ చేయండి.",
        "auth.modalSignupSubtitle": "ధృవీకరించబడిన భారతీయ చట్ట సహాయం, అద్దె మార్గదర్శకాలు మరియు చట్ట పరిజ్ఞానం కోసం VIDHIVRAKSH లో చేరండి.",
        "auth.passwordLabel": "పాస్‌వర్డ్",
        "auth.passwordPlaceholder": "••••••••",
        "auth.confirmPasswordLabel": "పాస్‌వర్డ్‌ను నిర్ధారించండి",
        "auth.confirmPasswordPlaceholder": "••••••••",
        "auth.nameOptionalLabel": "పూర్తి పేరు (ఐచ్ఛికం)",
        "auth.switchToSignup": "ఖాతా లేదా? సైన్ అప్ చేయండి",
        "auth.switchToLogin": "ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి",
        "auth.btnLogin": "లాగిన్ చేయండి",
        "auth.btnSignup": "ఖాతా సృష్టించండి",
        "auth.errorInvalidCredentials": "చెల్లని ఇమెయిల్ లేదా పాస్‌వర్డ్.",
        "auth.errorPasswordMismatch": "పాస్‌వర్డ్‌లు సరిపోలడం లేదు.",
        "auth.errorPasswordShort": "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.",
        "auth.errorEmptyFields": "దయచేసి అవసరమైన అన్ని వివరాలను పూరించండి.",
        "auth.errorUserAlreadyExists": "USER ALREDY EXISTS",
        "auth.successSignup": "ఖాతా విజయవంతంగా సృష్టించబడింది! VIDHIVRAKSH కు స్వాగతం.",
        "auth.successLogin": "VIDHIVRAKSH కు మళ్లీ స్వాగతం."
    }
}

for lang in LANGUAGES:
    file_path = os.path.join(BASE_DIR, f"{lang}.json")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Global replace LIBRA with VIDHIVRAKSH
    content = content.replace("LIBRA", "VIDHIVRAKSH")
    
    d = json.loads(content)
    # 2. Add Phase 5 keys
    d.update(phase5_keys[lang])
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json, now has {len(d)} keys.")
