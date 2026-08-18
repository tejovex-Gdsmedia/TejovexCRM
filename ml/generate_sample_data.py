import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

stages = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed']
lead_sources = ['WEBSITE', 'REFERRAL', 'INDIAMART', 'WHATSAPP', 'EMAIL', 'COLD_CALL']

companies = ['Tata Consultancy', 'Infosys Ltd', 'Wipro Tech', 'HCL Systems',
             'Reliance Corp', 'Mahindra Group', 'Bajaj Finserv', 'HDFC Solutions',
             'Zomato India', 'Paytm Services', 'Flipkart Pvt', 'Ola Electric',
             'Byju Learning', 'Razorpay Inc', 'Swiggy Corp', 'Nykaa Fashion']

first_names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Pooja', 'Arjun',
               'Neha', 'Suresh', 'Kavya', 'Rohit', 'Ananya', 'Karan', 'Divya']

last_names = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Mehta', 'Shah', 'Verma',
              'Gupta', 'Das', 'Joshi', 'Nair', 'Reddy', 'Iyer', 'Bose']

def random_date(days_back=365):
    return datetime.now() - timedelta(days=random.randint(1, days_back))

def random_name():
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def random_email(name):
    return f"{name.lower().replace(' ', '.')}@{random.choice(['gmail.com', 'outlook.com', 'yahoo.com'])}"

def random_phone():
    return f"+91{random.randint(7000000000, 9999999999)}"

# ── DEALS ──────────────────────────────────────────────
deals = []
for i in range(100):
    stage = random.choice(stages)
    value = round(random.uniform(5000, 500000), 2)
    probability = random.randint(10, 95)
    follow_up_count = random.randint(0, 10)
    days_in_stage = random.randint(1, 90)
    has_note = random.choice([0, 1])
    has_task = random.choice([0, 1])
    assigned = random.choice([0, 1])
    contact_name = random_name()
    company = random.choice(companies)

    # Win probability logic
    win_score = 0
    if stage == 'Negotiation': win_score += 3
    elif stage == 'Proposal': win_score += 2
    elif stage == 'Qualified': win_score += 1
    if follow_up_count > 5: win_score += 2
    if probability > 60: win_score += 2
    if value > 100000: win_score += 1
    if days_in_stage < 30: win_score += 1

    if win_score >= 7:
        status = 'WON'
    elif win_score <= 2:
        status = 'LOST'
    else:
        status = random.choice(['WON', 'LOST', 'OPEN'])

    deals.append({
        'id': f'deal_{i+1}',
        'title': f'{company} - {stage} Deal',
        'value': value,
        'probability': probability,
        'stage': stage,
        'status': status,
        'contact_name': contact_name,
        'company': company,
        'follow_up_count': follow_up_count,
        'days_in_stage': days_in_stage,
        'has_note': has_note,
        'has_task': has_task,
        'assigned': assigned,
        'created_at': random_date().strftime('%Y-%m-%d'),
    })

deals_df = pd.DataFrame(deals)
deals_df.to_csv('data/deals.csv', index=False)
print(f"✅ Generated {len(deals_df)} deals")
print(deals_df['status'].value_counts())

# ── LEADS ──────────────────────────────────────────────
leads = []
for i in range(100):
    source = random.choice(lead_sources)
    value = round(random.uniform(1000, 200000), 2)
    follow_up_count = random.randint(0, 8)
    days_since_created = random.randint(1, 180)
    contact_name = random_name()
    company = random.choice(companies)
    email = random_email(contact_name)
    phone = random_phone()
    assigned = random.choice([0, 1])

    # Conversion logic
    conv_score = 0
    if source == 'REFERRAL': conv_score += 3
    elif source == 'INDIAMART': conv_score += 2
    elif source == 'WEBSITE': conv_score += 1
    if follow_up_count > 4: conv_score += 2
    if value > 50000: conv_score += 1
    if days_since_created < 30: conv_score += 1
    if assigned: conv_score += 1

    if conv_score >= 7:
        status = 'CONVERTED'
    elif conv_score <= 2:
        status = 'UNQUALIFIED'
    else:
        status = random.choice(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'])

    leads.append({
        'id': f'lead_{i+1}',
        'title': f'{contact_name} - {company}',
        'source': source,
        'value': value,
        'contact_name': contact_name,
        'company': company,
        'email': email,
        'phone': phone,
        'follow_up_count': follow_up_count,
        'days_since_created': days_since_created,
        'assigned': assigned,
        'status': status,
        'created_at': random_date().strftime('%Y-%m-%d'),
    })

leads_df = pd.DataFrame(leads)
leads_df.to_csv('data/leads.csv', index=False)
print(f"\n✅ Generated {len(leads_df)} leads")
print(leads_df['status'].value_counts())