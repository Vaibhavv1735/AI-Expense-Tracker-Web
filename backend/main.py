from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pandas as pd
import re

from database import get_all_expenses, add_expense, delete_expense, get_expenses_as_df
from models import ExpenseCreate, ChatMessage
from ml_models import ExpenseAnalyzer

app = FastAPI()

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ExpenseAnalyzer()

# ── Expense parsing helpers ──────────────────────────────
def parse_expense_input(text):
    # Each tuple: (pattern, amount_group_index, description_group_index)
    patterns = [
        # "spent 500 on lunch", "spend 200 for groceries"
        (r'(?:spend|spent)\s+(\d+(?:\.\d+)?)\s+(?:on|for|rupees?)?\s*(.+)', 1, 2),
        # "paid 500 for electricity", "pay 300 on rent"
        (r'(?:paid|pay)\s+(\d+(?:\.\d+)?)\s+(?:for|on)?\s*(.+)', 1, 2),
        # "bought 500 worth of groceries", "purchased 200 of supplies"
        (r'(?:bought|purchased)\s+(\d+(?:\.\d+)?)\s+(?:worth\s+of|worth|of)\s+(.+)', 1, 2),
        # "bought pizza for 500", "purchased a book at 300"
        (r'(?:bought|purchased)\s+(.+?)\s+(?:for|at|worth|@)\s+(\d+(?:\.\d+)?)', 2, 1),
        # "500 on lunch", "500 for dinner" (catch-all, must be last)
        (r'(\d+(?:\.\d+)?)\s+(?:for|on|rupees?)?\s*(.+)', 1, 2),
    ]
    text_clean = text.strip()
    for pattern, amt_grp, desc_grp in patterns:
        match = re.search(pattern, text_clean, re.IGNORECASE)
        if match:
            return float(match.group(amt_grp)), match.group(desc_grp).strip()
    return None, None

def is_expense_entry(text):
    keywords = ['spent', 'spend', 'paid', 'pay', 'bought', 'purchased']
    text_lower = text.lower()
    has_amount = bool(re.search(r'\d+', text_lower))
    has_keyword = any(w in text_lower for w in keywords)
    return has_amount and has_keyword

def smart_response(question, df):
    if len(df) == 0:
        return "No expenses yet! Add one like: 'spent 500 on lunch'"

    q = question.lower()
    total = df['amount'].sum()

    if 'week' in q:
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        week_df = df[df['date'] >= week_ago]
        return f"This week: ₹{week_df['amount'].sum():.2f} ({len(week_df)} transactions)"

    if 'month' in q:
        month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        month_df = df[df['date'] >= month_ago]
        return f"This month: ₹{month_df['amount'].sum():.2f} ({len(month_df)} transactions)"

    for cat in ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health']:
        if cat in q:
            cat_df = df[df['category'].str.lower() == cat]
            if len(cat_df) > 0:
                return f"{cat.capitalize()}: ₹{cat_df['amount'].sum():.2f} ({len(cat_df)} transactions)"

    if 'total' in q or 'how much' in q:
        return f"Total: ₹{total:.2f} ({len(df)} transactions, avg ₹{df['amount'].mean():.2f})"

    if 'biggest' in q or 'most' in q:
        big = df.loc[df['amount'].idxmax()]
        return f"Biggest: ₹{big['amount']:.2f} - {big['description']} ({big['category']})"

    return "I can tell you about spending by week, month, category, or show totals and biggest expenses!"

def llm_response(question, df, api_key, provider):
    try:
        from llm_handler import ExpenseLLMHandler
        handler = ExpenseLLMHandler(api_key, provider)
        return handler.get_response(df, question)
    except Exception as e:
        return smart_response(question, df)

# ── Routes ───────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "AI Expense Tracker API is running"}

# --- Expenses ---
@app.get("/expenses")
def get_expenses(start: str = None, end: str = None, category: str = None):
    data = get_all_expenses(start, end, category)
    return {"expenses": data}

@app.post("/expenses")
def create_expense(expense: ExpenseCreate):
    df = get_expenses_as_df()
    date = expense.date or datetime.now().strftime("%Y-%m-%d")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if expense.category:
        category = expense.category
    elif len(df) == 0:
        category = analyzer.simple_categorize(expense.description)
    else:
        category = analyzer.predict_category(expense.description, df)

    result = add_expense(expense.amount, expense.description, category, date, timestamp)
    return {"message": "Expense added", "category": category, "data": result}

@app.delete("/expenses/{expense_id}")
def remove_expense(expense_id: int):
    delete_expense(expense_id)
    return {"message": "Expense deleted"}

# --- Chat ---
@app.post("/chat")
def chat(msg: ChatMessage):
    df = get_expenses_as_df()

    if is_expense_entry(msg.message):
        amount, desc = parse_expense_input(msg.message)
        if amount and desc:
            date = datetime.now().strftime("%Y-%m-%d")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            category = analyzer.simple_categorize(desc) if len(df) == 0 else analyzer.predict_category(desc, df)
            add_expense(amount, desc, category, date, timestamp)
            return {"response": f"Added ₹{amount:.2f} - {desc} ({category})", "expense_added": True}
        else:
            return {"response": "Couldn't parse that. Try: 'spent 500 on lunch'", "expense_added": False}

    if msg.api_key and msg.provider != "smart_bot":
        response = llm_response(msg.message, df, msg.api_key, msg.provider)
    else:
        response = smart_response(msg.message, df)

    return {"response": response, "expense_added": False}

# --- Dashboard ---
@app.get("/dashboard")
def get_dashboard():
    df = get_expenses_as_df()
    if len(df) == 0:
        return {"total": 0, "avg": 0, "count": 0, "top_category": "N/A", "category_breakdown": [], "daily_trend": []}

    category_breakdown = df.groupby("category")["amount"].sum().reset_index()
    category_breakdown.columns = ["category", "total"]
    category_breakdown = category_breakdown.sort_values("total", ascending=False)

    daily_trend = df.groupby("date")["amount"].sum().reset_index()
    daily_trend.columns = ["date", "total"]
    daily_trend = daily_trend.sort_values("date")

    return {
        "total": round(float(df["amount"].sum()), 2),
        "avg": round(float(df["amount"].mean()), 2),
        "count": int(len(df)),
        "top_category": str(df.groupby("category")["amount"].sum().idxmax()),
        "category_breakdown": category_breakdown.assign(total=category_breakdown["total"].astype(float)).to_dict("records"),
        "daily_trend": daily_trend.assign(total=daily_trend["total"].astype(float)).to_dict("records"),
    }

# --- Insights ---
@app.get("/insights")
def get_insights():
    df = get_expenses_as_df()
    if len(df) < 5:
        return {"anomalies": [], "prediction": None, "message": "Need 5+ expenses for insights"}

    anomalies_df = analyzer.detect_anomalies(df)
    anomalies = []
    if len(anomalies_df) > 0:
        anomalies = anomalies_df[["amount", "description", "category"]].to_dict("records")

    prediction = analyzer.predict_spending(df)

    return {
        "anomalies": anomalies,
        "prediction": prediction
    }