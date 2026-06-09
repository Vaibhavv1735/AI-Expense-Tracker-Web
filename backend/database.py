from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_all_expenses(start=None, end=None, category=None):
    query = supabase.table("expenses").select("*")
    
    if start:
        query = query.gte("date", start)
    if end:
        query = query.lte("date", end)
    if category and category != "All":
        query = query.eq("category", category)
    
    response = query.order("date", desc=True).execute()
    return response.data

def add_expense(amount, description, category, date, timestamp):
    response = supabase.table("expenses").insert({
        "amount": amount,
        "description": description,
        "category": category,
        "date": date,
        "timestamp": timestamp
    }).execute()
    return response.data

def delete_expense(expense_id):
    response = supabase.table("expenses").delete().eq("id", expense_id).execute()
    return response.data

def get_expenses_as_df():
    import pandas as pd
    data = get_all_expenses()
    if not data:
        return pd.DataFrame(columns=["id", "amount", "description", "category", "date", "timestamp"])
    return pd.DataFrame(data)