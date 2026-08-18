import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

os.makedirs('models', exist_ok=True)

print("=" * 50)
print("  TejovexCRM ML Model Training")
print("=" * 50)

# ══════════════════════════════════════════════════════
# MODEL 1 — Deal Win Probability (Logistic Regression)
# ══════════════════════════════════════════════════════
print("\n📊 Training Deal Win Probability Model...")

deals_df = pd.read_csv('data/deals.csv')
deals_train = deals_df[deals_df['status'].isin(['WON', 'LOST'])].copy()

stage_encoder = LabelEncoder()
deals_train['stage_encoded'] = stage_encoder.fit_transform(deals_train['stage'])

deal_features = ['value', 'probability', 'stage_encoded',
                 'follow_up_count', 'days_in_stage',
                 'has_note', 'has_task', 'assigned']

X_deal = deals_train[deal_features]
y_deal = (deals_train['status'] == 'WON').astype(int)

if len(X_deal) > 20:
    X_train, X_test, y_train, y_test = train_test_split(
        X_deal, y_deal, test_size=0.2, random_state=42, stratify=y_deal
    )
else:
    X_train, X_test, y_train, y_test = X_deal, X_deal, y_deal, y_deal

deal_model = LogisticRegression(max_iter=1000)
deal_model.fit(X_train, y_train)

y_pred = deal_model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Deal Model Accuracy: {acc * 100:.1f}%")
print(classification_report(y_test, y_pred, target_names=['LOST', 'WON']))

joblib.dump(deal_model, 'models/deal_win_model.pkl')
joblib.dump(stage_encoder, 'models/stage_encoder.pkl')
joblib.dump(deal_features, 'models/deal_features.pkl')
print("💾 Saved: models/deal_win_model.pkl")

# ══════════════════════════════════════════════════════
# MODEL 2 — Lead Conversion Score (Random Forest)
# ══════════════════════════════════════════════════════
print("\n📊 Training Lead Conversion Model...")

leads_df = pd.read_csv('data/leads.csv')
leads_train = leads_df[leads_df['status'].isin(['CONVERTED', 'UNQUALIFIED'])].copy()

source_encoder = LabelEncoder()
leads_train['source_encoded'] = source_encoder.fit_transform(leads_train['source'])

lead_features = ['value', 'source_encoded', 'follow_up_count',
                 'days_since_created', 'assigned']

X_lead = leads_train[lead_features]
y_lead = (leads_train['status'] == 'CONVERTED').astype(int)

if len(X_lead) > 20:
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(
        X_lead, y_lead, test_size=0.2, random_state=42, stratify=y_lead
    )
else:
    X_train_l, X_test_l, y_train_l, y_test_l = X_lead, X_lead, y_lead, y_lead

lead_model = RandomForestClassifier(n_estimators=100, random_state=42)
lead_model.fit(X_train_l, y_train_l)

y_pred_l = lead_model.predict(X_test_l)
acc_l = accuracy_score(y_test_l, y_pred_l)
print(f"✅ Lead Model Accuracy: {acc_l * 100:.1f}%")
print(classification_report(y_test_l, y_pred_l, target_names=['UNQUALIFIED', 'CONVERTED']))

joblib.dump(lead_model, 'models/lead_conversion_model.pkl')
joblib.dump(source_encoder, 'models/source_encoder.pkl')
joblib.dump(lead_features, 'models/lead_features.pkl')
print("💾 Saved: models/lead_conversion_model.pkl")

# ══════════════════════════════════════════════════════
# MODEL 3 — Revenue Forecast (Linear Regression)
# ══════════════════════════════════════════════════════
print("\n📊 Training Revenue Forecast Model...")

deals_df['created_at'] = pd.to_datetime(deals_df['created_at'])
won_deals = deals_df[deals_df['status'] == 'WON'].copy()
won_deals['month_num'] = (
    (won_deals['created_at'].dt.year - won_deals['created_at'].dt.year.min()) * 12
    + won_deals['created_at'].dt.month
)

monthly = won_deals.groupby('month_num')['value'].sum().reset_index()
monthly.columns = ['month_num', 'revenue']

X_rev = monthly[['month_num']]
y_rev = monthly['revenue']

rev_model = LinearRegression()
rev_model.fit(X_rev, y_rev)

joblib.dump(rev_model, 'models/revenue_forecast_model.pkl')
joblib.dump(int(monthly['month_num'].max()), 'models/last_month_num.pkl')
print(f"✅ Revenue Model trained on {len(monthly)} months of data")
print("💾 Saved: models/revenue_forecast_model.pkl")

print("\n" + "=" * 50)
print("  ✅ All models trained and saved!")
print("=" * 50)