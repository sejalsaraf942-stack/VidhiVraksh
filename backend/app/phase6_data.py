"""
VIDHIVRAKSH Phase 6 Curated Data:
1. Legal Document Library Records (Personal/Civil, Business/Commercial, Property, Legal Procedures)
2. Fictional Simulated Land Records & Educational Verification Checklist
3. Initial Case Management Seed Records for Advocate Priya Iyer (Demo Lawyer)
"""

import json

SEED_LEGAL_DOCUMENTS = [
    # --- Category: Personal and Civil Documents ---
    {
        "id": "doc_rent_agreement_01",
        "title": "Residential Rental & Lease Agreement",
        "category": "personal_civil",
        "doc_type": "agreement",
        "jurisdiction": "All Indian States (Subject to State Rent Control / Model Tenancy Act)",
        "language": "en",
        "short_description": "Standard 11-month residential tenancy agreement between a property owner (landlord/lessor) and tenant (lessee).",
        "intended_purpose": "Establishes terms of occupancy, monthly rent, security deposit quantum, maintenance liabilities, and termination procedure.",
        "typical_use_cases": json.dumps([
            "Renting a residential apartment, flat, or independent house",
            "Defining security deposit return obligations",
            "Setting utility and maintenance responsibilities"
        ]),
        "important_clauses": json.dumps([
            "Term of Tenancy (usually 11 months to avoid mandatory registration in some states)",
            "Rent & Due Date (mode of payment, grace period)",
            "Security Deposit (amount, deduction terms for repairs vs wear & tear, refund timeline)",
            "Notice Period for Vacating (typically 1 month written notice)",
            "Lock-in Period (if applicable)"
        ]),
        "plain_explanation": "This document is a formal contract between a home owner and a tenant. It protects both sides: the owner is assured of regular rent payments and property care, while the tenant is protected against unlawful eviction and unfair deposit deductions. It specifies who pays electricity and society maintenance, and how much notice must be given before moving out.",
        "key_terms_json": json.dumps([
            {"term": "Lessor", "meaning": "The owner of the property granting the lease."},
            {"term": "Lessee", "meaning": "The tenant occupying the premises."},
            {"term": "Lock-in Period", "meaning": "A minimum timeframe during which neither party can terminate the agreement without penalty."},
            {"term": "Normal Wear and Tear", "meaning": "Natural deterioration of property from ordinary daily use, which cannot be deducted from security deposit."}
        ]),
        "potential_risks": "Unregistered agreements exceeding 11 months may face admissibility issues in court. Ambiguous clauses on painting charges or maintenance often lead to deposit retention disputes.",
        "required_docs": "Aadhaar / ID proof of both parties, PAN card, proof of property ownership (electricity bill or tax receipt).",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """RESIDENTIAL LEASE AGREEMENT
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

This Residential Lease Agreement is entered into on this [Date] day of [Month], [Year] at [City, State], between:

LESSOR (Owner): [Full Name of Landlord], residing at [Permanent Address], Aadhaar No. [__________] (hereinafter called the 'Lessor').
AND
LESSEE (Tenant): [Full Name of Tenant], residing at [Permanent Address], Aadhaar No. [__________] (hereinafter called the 'Lessee').

1. PREMISES: The Lessor agrees to lease to the Lessee the premises situated at [Complete Address of Rental Property].
2. TERM: The tenancy shall be for a duration of 11 months commencing from [Start Date] to [End Date].
3. RENT: The monthly rent shall be INR [Rent Amount in Numbers] (Rupees [Rent Amount in Words] only), payable on or before the [Due Day, e.g. 5th] of each English calendar month.
4. SECURITY DEPOSIT: The Lessee has paid an interest-free refundable security deposit of INR [Deposit Amount] to the Lessor. The Lessor shall refund this deposit within 30 days of vacation, subject to deductions only for unpaid rent or proven damage exceeding normal wear and tear.
5. TERMINATION & NOTICE: Either party may terminate this agreement by giving [30 Days] written notice.

IN WITNESS WHEREOF the parties have signed this agreement on the date first mentioned above.

Lessor: ____________________          Lessee: ____________________
Witness 1: __________________         Witness 2: __________________"""
    },
    {
        "id": "doc_affidavit_name_change",
        "title": "General Affidavit for Change of Name",
        "category": "personal_civil",
        "doc_type": "affidavit",
        "jurisdiction": "India (Central / State Gazette applicable)",
        "language": "en",
        "short_description": "Sworn legal declaration before a notary public or oath commissioner affirming an official change of name.",
        "intended_purpose": "Used to submit alongside newspaper publication and official Gazette notification for changing name in passport, PAN, and Aadhaar.",
        "typical_use_cases": json.dumps([
            "Change of surname after marriage or divorce",
            "Correction of spelling errors across educational records",
            "Adopting a new personal name"
        ]),
        "important_clauses": json.dumps([
            "Affirmation of identity and existing registered name",
            "Declaration of new intended name",
            "Statement that change is voluntary and free from fraud or criminal avoidance"
        ]),
        "plain_explanation": "An affidavit is a formal written statement sworn on oath before an authorized official. In this document, you officially state that you have ceased using your old name and will henceforth be known only by your new name for all official, legal, and financial purposes.",
        "key_terms_json": json.dumps([
            {"term": "Deponent", "meaning": "The person making the sworn statement under oath."},
            {"term": "Attestation", "meaning": "Verification and signing by an authorized Notary Public or Magistrate."},
            {"term": "Gazette Notification", "meaning": "Publication in the official government gazette certifying the name change."}
        ]),
        "potential_risks": "Making a false affidavit carries severe penal liabilities under Section 227 of Bharatiya Nyaya Sanhita (BNS) for giving false evidence under oath.",
        "required_docs": "Valid photo ID (Voter ID, Passport, or Aadhaar), birth certificate, marriage certificate (if applicable), and passport-sized photographs.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """AFFIDAVIT FOR CHANGE OF NAME
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

I, [Old Full Name], Son/Daughter/Wife of [Father/Spouse Name], aged about [Age] years, residing at [Complete Residential Address], do hereby solemnly affirm and state on oath as follows:

1. That my name is currently recorded in official records as [Old Full Name].
2. That for all personal and professional purposes, I have adopted and assumed the name [New Full Name] in place of my former name.
3. That I declare that henceforth I shall be known, addressed, and referred to in all records, documents, dealings, and proceedings as [New Full Name].
4. That the statements made hereinabove are true and correct to the best of my personal knowledge and belief, and nothing material has been concealed therefrom.

Deponent: ____________________

VERIFICATION
Verified at [City] on this [Date] day of [Month], [Year] that the contents of this affidavit are true to my knowledge.
Deponent: ____________________
Before Me: Notary Public / Oath Commissioner"""
    },
    {
        "id": "doc_legal_notice_deposit",
        "title": "Legal Notice for Refund of Tenancy Security Deposit",
        "category": "personal_civil",
        "doc_type": "notice",
        "jurisdiction": "India",
        "language": "en",
        "short_description": "Formal advocate/individual demand notice to an ex-landlord demanding the refund of illegally withheld security deposit.",
        "intended_purpose": "Creates a formal statutory paper trail and gives a 15-day ultimatum before initiating civil recovery proceedings or consumer complaint.",
        "typical_use_cases": json.dumps([
            "Landlord refusing to return deposit after peaceful handover",
            "Arbitrary deductions without repair receipts",
            "Formal prerequisite prior to small claims or civil suit"
        ]),
        "important_clauses": json.dumps([
            "Recital of tenancy duration and deposit payment proof",
            "Confirmation of handover of keys and inspection",
            "15-day peremptory demand with interest rate stipulation"
        ]),
        "plain_explanation": "When an owner does not return your security deposit after you have vacated the house, this formal notice puts them on legal notice. It lays out the dates, amounts paid, evidence of clean handover, and gives 15 days to refund the amount before legal action is filed in court.",
        "key_terms_json": json.dumps([
            {"term": "Peremptory Demand", "meaning": "A final, non-negotiable legal demand carrying formal deadlines."},
            {"term": "Notice Period", "meaning": "The grace window given to comply before legal suit is instituted."}
        ]),
        "potential_risks": "Sending a notice without proof of rent clearance or key handover may expose the sender to counterclaims.",
        "required_docs": "Original lease agreement, rent receipts, bank transfer statement of deposit, key handover confirmation (email/SMS/letter).",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """LEGAL NOTICE (DEMAND FOR SECURITY DEPOSIT REFUND)
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

Date: [Date]
To: [Landlord Name], [Landlord Address]

Subject: Legal Notice under instruction of my client [Tenant Name] for refund of Security Deposit of INR [Amount] with interest.

Sir/Madam,
Under instructions from and on behalf of my client [Tenant Name], residing at [Address], I hereby address you as under:

1. That you entered into a lease agreement dated [Date] with my client in respect of premises situated at [Premises Address].
2. That my client paid an interest-free security deposit of INR [Amount] via [Bank Mode / UTR No.] on [Date].
3. That my client duly vacated the premises on [Vacation Date] after handing over peaceful vacant possession and keys.
4. That despite repeated requests, you have unlawfully withheld the security deposit without providing any lawful justification or repair receipts.

You are hereby called upon to refund the said sum of INR [Amount] together with interest @ 12% p.a. within 15 days of receipt of this notice, failing which my client shall initiate appropriate civil and criminal proceedings against you entirely at your risk, cost, and consequence.

Advocate: ____________________"""
    },

    # --- Category: Business and Commercial Documents ---
    {
        "id": "doc_mutual_nda",
        "title": "Mutual Non-Disclosure Agreement (NDA)",
        "category": "business_commercial",
        "doc_type": "nda",
        "jurisdiction": "Indian Contract Act, 1872",
        "language": "en",
        "short_description": "Bilateral confidentiality agreement safeguarding proprietary business secrets, source code, customer data, and trade information.",
        "intended_purpose": "Protects confidential discussions between companies, startups, or freelancers during exploratory business partnerships.",
        "typical_use_cases": json.dumps([
            "Startup fundraising discussions with prospective investors",
            "Software development outsourcing",
            "Commercial partnership exploration"
        ]),
        "important_clauses": json.dumps([
            "Definition of Confidential Information",
            "Exclusions from Confidential Information (public knowledge, prior possession)",
            "Non-disclosure obligations & standard of care",
            "Term of confidentiality (e.g. 2 to 3 years)",
            "Remedies including injunctive relief"
        ]),
        "plain_explanation": "A Mutual NDA ensures that when two businesses discuss a potential collaboration or exchange sensitive data, neither side can steal, publish, or misuse the other's proprietary ideas or client information. If either party leaks the secret, the other can seek an immediate court injunction and compensation.",
        "key_terms_json": json.dumps([
            {"term": "Disclosing Party", "meaning": "The party sharing proprietary information."},
            {"term": "Receiving Party", "meaning": "The party receiving proprietary information who must keep it secret."},
            {"term": "Injunctive Relief", "meaning": "A court order restraining an unauthorized party from disclosing or misusing confidential data."}
        ]),
        "potential_risks": "Overly broad definitions of confidential information can make the agreement difficult to enforce. Failing to mark shared documents as confidential can weaken protection.",
        "required_docs": "Company registration certificate (CIN/LLPIN), authorized signatory resolution or power of attorney.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """MUTUAL NON-DISCLOSURE AGREEMENT
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

This Mutual Non-Disclosure Agreement ('Agreement') is made on [Date] by and between:
Party A: [Company Name A], registered under Companies Act, having its registered office at [Address A].
AND
Party B: [Company Name B], registered under Companies Act, having its registered office at [Address B].

1. PURPOSE: The parties wish to explore a business opportunity concerning [Project/Opportunity Description].
2. CONFIDENTIAL INFORMATION: Includes all non-public technical, commercial, financial, or operational data disclosed in writing or orally.
3. OBLIGATIONS: Each party agrees to protect the Confidential Information of the other with at least reasonable care and shall not disclose it to any third party without prior written consent.
4. EXCLUSIONS: Does not include information that is publicly known or was already lawfully in the receiving party's possession.
5. TERM: This agreement shall remain in force for [2 Years] from the date of execution.
6. GOVERNING LAW: This agreement shall be governed by the laws of India, subject to the jurisdiction of courts in [City].

Party A Signatory: ____________________       Party B Signatory: ____________________"""
    },
    {
        "id": "doc_cheque_bounce_138_notice",
        "title": "Statutory Demand Notice under Section 138 NI Act",
        "category": "business_commercial",
        "doc_type": "notice",
        "jurisdiction": "Negotiable Instruments Act, 1881",
        "language": "en",
        "short_description": "Mandatory 30-day statutory legal notice issued after a cheque bounces for insufficiency of funds or exceeding arrangements.",
        "intended_purpose": "Strict legal prerequisite before filing a criminal complaint under Section 138 of the Negotiable Instruments Act in the magistrate court.",
        "typical_use_cases": json.dumps([
            "Business payments dishonoured due to insufficient funds",
            "Recovery of loan repayments or invoice dues via bounced cheque"
        ]),
        "important_clauses": json.dumps([
            "Details of cheque (number, date, drawn bank, amount)",
            "Reason for return as stated in Bank Return Memo",
            "Mandatory 15-day statutory repayment window"
        ]),
        "plain_explanation": "Under Indian law, bouncing a cheque given for a lawful debt is a criminal offense. However, you cannot directly file a criminal case: you MUST serve this statutory notice within 30 days of receiving the bank memo, giving the drawer exactly 15 days to pay.",
        "key_terms_json": json.dumps([
            {"term": "Drawer", "meaning": "The person who issued and signed the cheque."},
            {"term": "Payee", "meaning": "The person or entity in whose favour the cheque was drawn."},
            {"term": "Bank Memo", "meaning": "The official slip from the bank recording the reason for dishonour."}
        ]),
        "potential_risks": "Missing the strict 30-day window from receipt of bank return memo extinguishes the right to prosecute under Section 138.",
        "required_docs": "Original cheque, original bank return memo, invoice or loan agreement establishing legally enforceable debt.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """STATUTORY DEMAND NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

Date: [Date]
REGISTERED POST A.D. / SPEED POST

To: [Drawer Name], [Address]

Sir/Madam,
Under instructions from my client [Payee Name], I hereby serve you with this statutory notice:

1. That in discharge of your legally enforceable debt towards [Invoice No. / Loan Account], you issued Cheque No. [Cheque No.] dated [Date] for INR [Amount] drawn on [Bank Name].
2. That my client presented the said cheque for clearance, but it was dishonoured with the remark '[Funds Insufficient / Account Closed]' vide Bank Return Memo dated [Memo Date].
3. You are hereby called upon to pay the said cheque amount of INR [Amount] within 15 (fifteen) days from receipt of this notice, failing which my client shall institute a criminal complaint against you under Section 138 of the Negotiable Instruments Act, 1881.

Advocate for Complainant: ____________________"""
    },
    {
        "id": "doc_service_agreement",
        "title": "Independent Service & Consulting Agreement",
        "category": "business_commercial",
        "doc_type": "contract",
        "jurisdiction": "Indian Contract Act, 1872",
        "language": "en",
        "short_description": "Comprehensive contract for retaining freelancers, consultants, or technical agencies with deliverables and payment terms.",
        "intended_purpose": "Defines scope of work, milestones, intellectual property assignment, and contractor status.",
        "typical_use_cases": json.dumps([
            "Hiring software consultants or design agencies",
            "Engaging marketing or financial advisors",
            "Clear IP assignment for work-for-hire"
        ]),
        "important_clauses": json.dumps([
            "Scope of Work (SOW) & Deliverables",
            "Fees, Milestones & Invoicing Schedule",
            "Intellectual Property Ownership (Work-for-Hire)",
            "Independent Contractor Status (No employment relationship)"
        ]),
        "plain_explanation": "This contract clarifies that the consultant is not a permanent employee and guarantees that all software, designs, or reports created during the engagement belong exclusively to the client upon payment.",
        "key_terms_json": json.dumps([
            {"term": "Work for Hire", "meaning": "Work created by a contractor where ownership automatically vests with the paying client."},
            {"term": "Scope of Work (SOW)", "meaning": "The detailed list of deliverables and milestones to be accomplished."}
        ]),
        "potential_risks": "Without explicit IP assignment wording, copyright in the created software or design may remain with the creator under Indian Copyright Law.",
        "required_docs": "Scope of Work annexure, GSTIN certificate (if registered), milestone schedule.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """INDEPENDENT CONTRACTOR & SERVICE AGREEMENT
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

This Service Agreement is made on [Date] between [Client Name] ('Client') and [Service Provider Name] ('Contractor').
1. SERVICES: Contractor shall deliver the services set forth in Schedule A ('Scope of Work').
2. PAYMENT: Client shall pay Contractor INR [Amount] as per milestone schedule.
3. INTELLECTUAL PROPERTY: All deliverables created under this agreement shall be the sole property of the Client upon payment.
4. INDEPENDENT STATUS: Contractor is an independent contractor and not an employee or agent.
5. GOVERNING LAW: Indian Contract Act, 1872."""
    },

    # --- Category: Property Documents ---
    {
        "id": "doc_agreement_to_sale_property",
        "title": "Agreement to Sell Immovable Property",
        "category": "property",
        "doc_type": "deed",
        "jurisdiction": "Transfer of Property Act, 1882 & Registration Act, 1908",
        "language": "en",
        "short_description": "Contract preceding the final Sale Deed fixing the agreed price, earnest money deposit, and timeline for title transfer.",
        "intended_purpose": "Binds buyer and seller to complete property purchase upon satisfactory title clearance and loan approval.",
        "typical_use_cases": json.dumps([
            "Purchasing a residential flat or land parcel",
            "Applying for bank home loans using sale agreement",
            "Reserving property pending title verification"
        ]),
        "important_clauses": json.dumps([
            "Full Schedule of Property with boundaries and survey number",
            "Total Consideration & Token Advance (Earnest Money)",
            "Time is of the Essence stipulation",
            "Clear Title Warranty (free from encumbrances, mortgages, or litigation)"
        ]),
        "plain_explanation": "An Agreement to Sell is not the final transfer of ownership, but a legally binding promise. It records how much advance money the buyer has paid, sets the deadline for paying the remainder, and obligates the seller to clear any pending loans, property taxes, or legal disputes before signing the final Sale Deed.",
        "key_terms_json": json.dumps([
            {"term": "Earnest Money", "meaning": "Advance token payment showing genuine commitment to purchase."},
            {"term": "Encumbrance Certificate", "meaning": "A certificate issued by sub-registrar confirming whether property is mortgaged or in dispute."},
            {"term": "Specific Performance", "meaning": "A court remedy forcing an unwilling party to complete the sale as agreed."}
        ]),
        "potential_risks": "In several states, unregistered sale agreements cannot be used to claim specific performance or legal possession.",
        "required_docs": "Parent title deeds for 30 years, Encumbrance Certificate (Form 15), latest property tax receipt, approved layout plan.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """AGREEMENT TO SELL IMMOVABLE PROPERTY
(SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION)

This Agreement to Sell is entered into on [Date] between:
Vendor (Seller): [Full Name], residing at [Address].
AND
Purchaser (Buyer): [Full Name], residing at [Address].

1. PROPERTY: All that piece and parcel of land/flat situated at [Schedule of Property with Survey No. and Boundaries].
2. CONSIDERATION: The total agreed sale price is INR [Total Amount].
3. EARNEST MONEY: The Purchaser has paid advance token sum of INR [Token Amount] by Cheque/NEFT No. [__________].
4. BALANCE & CONVEYANCE: The balance of INR [Balance Amount] shall be paid within [90 Days] upon execution and registration of Sale Deed.
5. ENCUMBRANCES: The Vendor covenants that the property is free from all mortgages, claims, attachments, and litigations.

Vendor: ____________________          Purchaser: ____________________"""
    },
    {
        "id": "doc_property_due_diligence_checklist",
        "title": "Property Title & Due Diligence Checklist",
        "category": "property",
        "doc_type": "checklist",
        "jurisdiction": "India",
        "language": "en",
        "short_description": "Comprehensive legal checklist for verifying title history, encumbrances, and municipal approvals before buying property.",
        "intended_purpose": "Assists buyers and lawyers in systematically verifying authenticity and ownership chain before paying advances.",
        "typical_use_cases": json.dumps([
            "Pre-purchase property title search",
            "Bank loan legal verification",
            "Inherited property partition verification"
        ]),
        "important_clauses": json.dumps([
            "30-Year Title Search verification",
            "Sub-Registrar Encumbrance Certificate (EC)",
            "Revenue Records (Khata / Patta / 7/12 Extract)",
            "RERA Registration verification for under-construction flats"
        ]),
        "plain_explanation": "This checklist outlines every key document you must inspect before buying land or a flat in India. It prevents fraud, unauthorized layout sales, and property disputes by ensuring the seller genuinely owns the land.",
        "key_terms_json": json.dumps([
            {"term": "Mother Deed", "meaning": "The primary original document tracing initial property title ownership."},
            {"term": "Khata / Patta", "meaning": "Municipal / Revenue entry identifying the person responsible for paying property taxes."}
        ]),
        "potential_risks": "Ignoring unreleased mortgages or co-parcenary minor rights can cause sales to be voided by civil courts.",
        "required_docs": "Title deeds, EC, Tax receipts, Khata extract, Sanctioned building plan, RERA certificate.",
        "verification_status": "Verified Reference Guide",
        "is_template": 0,
        "sample_content": """PROPERTY LEGAL DUE DILIGENCE CHECKLIST
(VERIFIED REFERENCE GUIDE)

1. TITLE CHAIN (Minimum 30 Years)
   [ ] Inspect original Mother Deed / Parent Document.
   [ ] Verify chronological conveyance trail without gaps.

2. SUB-REGISTRAR OFFICE (SRO) SEARCH
   [ ] Obtain Encumbrance Certificate (EC) for minimum 15 to 30 years.
   [ ] Confirm no registered mortgages or court attachments exist.

3. REVENUE & MUNICIPAL RECORDS
   [ ] Check Patta / Khata Extract / 7/12 Extract in Seller's name.
   [ ] Check up-to-date Property Tax receipts with local municipal authority.

4. APPROVALS & SANCTIONS
   [ ] Check Conversion Order (Agricultural to Non-Agricultural / NA Order).
   [ ] Check Sanctioned Building Plan and Commencement Certificate (CC).
   [ ] Verify Occupancy Certificate (OC) for completed buildings.
   [ ] Verify RERA registration on state RERA website for projects."""
    },

    # --- Category: Legal Procedures and Reference Material ---
    {
        "id": "doc_zero_fir_guide",
        "title": "Zero FIR Application Guide & Reference Format",
        "category": "procedures_reference",
        "doc_type": "reference",
        "jurisdiction": "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Supreme Court Guidelines",
        "language": "en",
        "short_description": "Procedural guide and application format for registering an FIR at any police station regardless of territorial jurisdiction.",
        "intended_purpose": "Educates citizens on their statutory right to immediate FIR registration for cognizable offenses without jurisdictional delays.",
        "typical_use_cases": json.dumps([
            "Reporting urgent cognizable crimes occurring while traveling",
            "Overcoming refusal by police officers citing territorial jurisdiction"
        ]),
        "important_clauses": json.dumps([
            "Statutory basis under Section 173(1) BNSS",
            "Mandatory assignment of number '0' before forwarding to competent police station",
            "Remedy under Section 173(4) BNSS in case of police refusal"
        ]),
        "plain_explanation": "A Zero FIR is an FIR that can be registered at ANY police station, irrespective of where the crime took place. The police cannot refuse registration claiming 'not in our area'. The station records it, assigns serial number '0', provides immediate medical/forensic aid, and then transfers it to the proper police station.",
        "key_terms_json": json.dumps([
            {"term": "Cognizable Offence", "meaning": "A serious crime where police have duty to arrest without warrant and investigate immediately."},
            {"term": "Zero Numbering", "meaning": "The FIR is logged without standard station serial number so transfer can occur."}
        ]),
        "potential_risks": "Deliberately filing a false FIR is punishable under Section 217 of BNS with imprisonment and fine.",
        "required_docs": "Written statement detailing date, time, location of incident, details of accused (if known), medical report (if injured).",
        "verification_status": "Verified Procedural Guide",
        "is_template": 1,
        "sample_content": """APPLICATION FOR REGISTRATION OF ZERO FIR
(UNDER SECTION 173 BHARATIYA NAGARIK SURAKSHA SANHITA)

To:
The Station House Officer (SHO),
[Name of Police Station], [District, State]

Subject: Information regarding commission of cognizable offense — Request for registration of Zero FIR.

Sir/Madam,
I, [Name of Informant/Victim], Son/Daughter of [Father's Name], residing at [Address], Mobile: [__________], state as follows:

1. That on [Date] at approximately [Time], a cognizable offense took place at [Location of Incident].
2. Brief Facts: [State chronological events clearly and concisely].
3. Details of Accused/Suspects: [Names or physical descriptions].
4. As the incident occurred outside this station's territorial jurisdiction, I request you to register a ZERO FIR under Section 173 of BNSS, provide me a free copy thereof, and transfer the records to the police station having competent jurisdiction for further investigation.

Yours faithfully,
Signature of Informant: ____________________
Date & Time: ____________________"""
    },
    {
        "id": "doc_consumer_complaint_format",
        "title": "Consumer Commission Complaint Draft Format",
        "category": "procedures_reference",
        "doc_type": "complaint",
        "jurisdiction": "Consumer Protection Act, 2019",
        "language": "en",
        "short_description": "Standard petition format for filing a formal consumer grievance before District Consumer Disputes Redressal Commission.",
        "intended_purpose": "Used by consumers to claim replacement, refund, and compensation for defective goods or deficiency of service.",
        "typical_use_cases": json.dumps([
            "E-commerce seller refusing replacement or refund for damaged product",
            "Deficiency in healthcare, insurance, or airline services",
            "Builder failing to deliver flat possession within agreed timeline"
        ]),
        "important_clauses": json.dumps([
            "Pecuniary jurisdiction statement (District Commission up to INR 50 Lakhs)",
            "Cause of action chronology and deficiency demonstration",
            "Prayer clause specifying refund, damages, and litigation expenses"
        ]),
        "plain_explanation": "If a company sells you a defective product or refuses to honor a paid service, you can file a complaint directly in the District Consumer Commission without needing high court fees. This draft formats your grievance with clear dates, invoice proofs, and the compensation amount you are asking the court to order.",
        "key_terms_json": json.dumps([
            {"term": "Complainant", "meaning": "The consumer filing the grievance."},
            {"term": "Opposite Party (OP)", "meaning": "The seller, manufacturer, or service provider being complained against."},
            {"term": "Deficiency in Service", "meaning": "Any fault, imperfection, or shortcoming in quality or performance required by law."}
        ]),
        "potential_risks": "Consumer complaints must be filed within 2 years from the date on which the cause of action arose.",
        "required_docs": "Purchase bill/invoice, warranty card, written complaints/emails sent to customer care, payment receipt.",
        "verification_status": "Sample Reference Template",
        "is_template": 1,
        "sample_content": """BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION AT [DISTRICT]
CONSUMER COMPLAINT NO. _____ OF 2026

IN THE MATTER OF:
[Your Full Name], [Your Complete Address]  ...COMPLAINANT
VERSUS
[Company / Seller Name], [Company Address] ...OPPOSITE PARTY

COMPLAINT UNDER SECTION 35 OF CONSUMER PROTECTION ACT, 2019

1. That the Complainant purchased [Product/Service Name] from the Opposite Party on [Date] against Invoice No. [Invoice No.] for INR [Amount].
2. That on [Date], the said product manifested [Describe Defect / Service Failure].
3. That Complainant lodged complaints on [Dates], but Opposite Party failed to rectify or refund.
4. PRAYER: Complainant respectfully prays that this Hon'ble Commission may be pleased to direct the Opposite Party to:
   a) Refund the purchase price of INR [Amount] with 12% interest;
   b) Pay compensation of INR [Compensation Amount] for mental harassment;
   c) Award litigation costs of INR [Costs Amount].

Complainant: ____________________"""
    }
]

# --- Simulated Land Records for Exploration ---
SIMULATED_LAND_RECORDS = [
    {
        "id": "sim_prop_001",
        "survey_identifier": "SIM-MAH-PUN-0842",
        "state": "Maharashtra",
        "district": "Pune",
        "locality": "Mauje Baner, Taluka Haveli",
        "property_description": "Residential Plot No. 14-B in Survey No. 44/2B, measuring 2,400 sq.ft.",
        "status": "Requires Further Verification",
        "hypothetical_chain": [
            {"year": "1994", "event": "Original Agricultural Grant to Shri Ramchandra Patil"},
            {"year": "2008", "event": "Non-Agricultural (NA) Order issued by Sub-Divisional Officer, Pune"},
            {"year": "2016", "event": "Registered Sale Deed No. 4521 to Smt. Sunita Kulkarni"}
        ],
        "missing_documents": ["Latest 2025 Mutation Extract (Ferfar)", "Discharge Certificate for 2012 Bank Loan"],
        "checklist_tasks": [
            {"task": "Verify 7/12 extract on official Mahabhulekh portal", "done": False},
            {"task": "Apply for Encumbrance Certificate from 2008 to present at Sub-Registrar Haveli-4", "done": True},
            {"task": "Inspect physically whether boundary demarcation matches cadastral map", "done": False}
        ],
        "research_notes": "The 2012 loan entry on 7/12 extract needs bank NOC to ensure charge is removed."
    },
    {
        "id": "sim_prop_002",
        "survey_identifier": "SIM-KAR-BLR-1920",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "locality": "Indiranagar 1st Stage, BBMP East",
        "property_description": "Built-up Duplex Villa on Site No. 182, Khata No. 892/14, 3,200 sq.ft.",
        "status": "Information Collected",
        "hypothetical_chain": [
            {"year": "1982", "event": "BDA Allotment Letter to Col. R. N. Rao"},
            {"year": "1991", "event": "BDA Absolute Sale Deed registered at Shivajinagar SRO"},
            {"year": "2019", "event": "Inherited by legal heirs vide Registered Family Settlement Deed"}
        ],
        "missing_documents": ["Updated 'A' Khata Certificate from BBMP Assistant Revenue Officer"],
        "checklist_tasks": [
            {"task": "Cross-check property ID on Kaveri Online Services portal", "done": True},
            {"task": "Verify property tax receipts on BBMP e-Aasthi portal", "done": True},
            {"task": "Confirm all legal heirs signed the 2019 settlement", "done": False}
        ],
        "research_notes": "Title appears clear from BDA records; ensure B Khata is not issued by mistake."
    },
    {
        "id": "sim_prop_003",
        "survey_identifier": "SIM-DL-NDLS-0412",
        "state": "Delhi",
        "district": "South West Delhi",
        "locality": "Sector 12, Dwarka",
        "property_description": "Residential Apartment No. 402, Tower B, Palm Grove CGHS Ltd.",
        "status": "Documents Pending",
        "hypothetical_chain": [
            {"year": "2002", "event": "DDA Land Perpetual Lease to Palm Grove CGHS"},
            {"year": "2006", "event": "Allotment of Flat 402 to Shri Arvind Mehra"},
            {"year": "2018", "event": "DDA Freehold Conveyance Deed registered at Kapashera SRO"}
        ],
        "missing_documents": ["Society Share Certificate & No-Objection Certificate (NOC)"],
        "checklist_tasks": [
            {"task": "Verify DDA Conveyance Deed registration online via DORIS Delhi", "done": False},
            {"task": "Obtain Society Management clearance certificate for maintenance dues", "done": False}
        ],
        "research_notes": "Freehold conveyance verified; Society NOC required before transfer."
    }
]

# --- Educational Property Verification Checklist ---
PROPERTY_VERIFICATION_CHECKLIST = [
    {
        "id": "step_authority",
        "title": "Identify State Land Authority & Official Registry",
        "desc": "Land administration is a State subject in India. Determine the relevant revenue portal (e.g., Mahabhulekh in Maharashtra, Bhoomi in Karnataka, Dharani in Telangana, BanglarBhumi in West Bengal)."
    },
    {
        "id": "step_survey",
        "title": "Obtain Survey Number / Khata / Patta",
        "desc": "Identify the exact cadastral identifier: Survey Number, Hissa, Khasra, or Plot ID to inspect revenue records."
    },
    {
        "id": "step_ec",
        "title": "Request Encumbrance Certificate (EC) for 30 Years",
        "desc": "Check Sub-Registrar records to ensure property has no registered mortgages, liens, or court attachment orders."
    },
    {
        "id": "step_mutation",
        "title": "Examine Mutation Register (Patta / Khata / Ferfar)",
        "desc": "Confirm that the seller's name is actively recorded in the government revenue register for property tax collection."
    },
    {
        "id": "step_sanctions",
        "title": "Verify Non-Agricultural (NA) & Layout Approvals",
        "desc": "Ensure land was lawfully converted from agricultural use and building plans are approved by competent development authority."
    },
    {
        "id": "step_physical",
        "title": "Physical Inspection & Public Notice",
        "desc": "Inspect site boundaries against survey map; consider publishing a public notice in local newspapers for title claims."
    }
]

# --- Seed Cases for Advocate Priya Iyer (Demo Lawyer) ---
SEED_LAWYER_CASES = [
    {
        "id": "case_priya_001",
        "case_title": "Aarav Sharma v. Skylark Realty Pvt Ltd",
        "internal_ref": "VRK-2026-CV-0104",
        "case_type": "Tenancy & Consumer Recovery",
        "court_forum": "District Consumer Disputes Redressal Commission, Pune",
        "jurisdiction": "Pune, Maharashtra",
        "parties": "Aarav Sharma (Complainant) vs. Skylark Realty Pvt Ltd (Opposite Party)",
        "summary": "Recovery of illegally withheld security deposit of INR 85,000 post vacation of leased premises with claim for interest and damages.",
        "status": "Active",
        "next_deadline": "2026-11-15",
        "timeline_events": [
            {"event_type": "Consultation", "date": "2026-10-12", "desc": "Initial client consultation conducted with Aarav Sharma; reviewed lease agreement."},
            {"event_type": "Document Received", "date": "2026-10-15", "desc": "Received bank statements showing deposit payment and key return receipt."},
            {"event_type": "Filing Preparation", "date": "2026-10-22", "desc": "Drafted formal legal notice demanding refund within 15 days under Model Tenancy principles."}
        ],
        "evidence_items": [
            {"title": "Registered Lease Agreement Copy", "category": "Contract", "review_status": "Reviewed", "date_received": "2026-10-15"},
            {"title": "Bank Transfer Slip (INR 85,000)", "category": "Financial Proof", "review_status": "Reviewed", "date_received": "2026-10-15"},
            {"title": "Email thread confirming key handover", "category": "Correspondence", "review_status": "Under Review", "date_received": "2026-10-18"}
        ],
        "notes": [
            {"category": "Facts", "content": "Client resided from Nov 2024 to Sep 2025. Landlord claims repainting cost of entire building without clause support."},
            {"category": "Provisions", "content": "Section 13 Model Tenancy Act prohibits arbitrary deductions for normal wear and tear."},
            {"category": "Next Actions", "content": "If no reply to statutory notice by Nov 10, lodge formal complaint before District Commission."}
        ],
        "tasks": [
            {"title": "Dispatch statutory legal notice via Speed Post", "due_date": "2026-10-30", "priority": "High", "status": "Completed"},
            {"title": "Track postal delivery receipt and prepare complaint annexures", "due_date": "2026-11-05", "priority": "High", "status": "Pending"},
            {"title": "Draft affidavit in support of complaint", "due_date": "2026-11-12", "priority": "Medium", "status": "Pending"}
        ]
    },
    {
        "id": "case_priya_002",
        "case_title": "GreenLeaf Ventures v. TechCore Logistics",
        "internal_ref": "VRK-2026-CR-0209",
        "case_type": "Criminal / Negotiable Instruments Act",
        "court_forum": "Court of Judicial Magistrate First Class (JMFC), Bengaluru",
        "jurisdiction": "Bengaluru, Karnataka",
        "parties": "GreenLeaf Ventures (Complainant) vs. TechCore Logistics & Ors. (Accused)",
        "summary": "Criminal complaint under Section 138 NI Act for dishonour of commercial cheque amounting to INR 4,20,000.",
        "status": "Active",
        "next_deadline": "2026-11-08",
        "timeline_events": [
            {"event_type": "Document Received", "date": "2026-10-05", "desc": "Received original dishonoured cheque and bank return memo."},
            {"event_type": "Consultation", "date": "2026-10-08", "desc": "Formulated statutory demand notice strategy within 30-day window."}
        ],
        "evidence_items": [
            {"title": "Original Cheque No. 441029", "category": "Negotiable Instrument", "review_status": "Reviewed", "date_received": "2026-10-05"},
            {"title": "Bank Return Memo ('Funds Insufficient')", "category": "Bank Record", "review_status": "Reviewed", "date_received": "2026-10-05"}
        ],
        "notes": [
            {"category": "Issues", "content": "Verify director liability under Section 141 NI Act for managing directors of TechCore Logistics."},
            {"category": "Authorities", "content": "Supreme Court in SMS Pharmaceuticals v. Neeta Bhalla on director specific averments."}
        ],
        "tasks": [
            {"title": "File Section 138 complaint before JMFC Bengaluru", "due_date": "2026-11-08", "priority": "High", "status": "Pending"}
        ]
    }
]
