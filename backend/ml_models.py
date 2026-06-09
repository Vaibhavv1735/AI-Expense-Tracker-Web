import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import re

class ExpenseAnalyzer:
    """ML-powered expense analysis"""
    
    def __init__(self):
        self.categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
        
        # Keywords in PRIORITY ORDER — Bills/Health/Transport checked before Food
        # to avoid "electricity" matching food, etc.
        self.category_keywords = {
            'Bills': ['electricity', 'electric', 'water', 'internet', 'wifi', 'phone',
                     'mobile', 'recharge', 'rent', 'emi', 'loan', 'insurance', 'bill',
                     'gas', 'broadband', 'postpaid', 'prepaid'],
            'Health': ['doctor', 'medicine', 'pharmacy', 'hospital', 'clinic', 'gym',
                      'fitness', 'medical', 'health', 'chemist', 'tablet', 'injection'],
            'Transport': ['uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'petrol', 'diesel',
                         'fuel', 'parking', 'auto', 'rickshaw', 'rapido', 'flight', 'ticket'],
            'Entertainment': ['movie', 'netflix', 'prime', 'spotify', 'game', 'concert',
                            'party', 'club', 'theater', 'cinema', 'hotstar', 'youtube'],
            'Shopping': ['amazon', 'flipkart', 'clothes', 'shoes', 'shopping', 'mall',
                        'store', 'purchase', 'shirt', 'dress', 'myntra', 'meesho'],
            'Food': ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'cafe', 'coffee',
                     'pizza', 'burger', 'meal', 'snack', 'grocery', 'swiggy', 'zomato',
                     'hotel', 'dhaba', 'biryani', 'chai', 'tea', 'juice'],
        }

        # Priority order — most specific first
        self.priority_order = ['Bills', 'Health', 'Transport', 'Entertainment', 'Shopping', 'Food']

    def simple_categorize(self, description):
        """Keyword-based categorization with enforced priority order"""
        description_lower = description.lower()

        for category in self.priority_order:
            keywords = self.category_keywords[category]
            for keyword in keywords:
                if keyword in description_lower:
                    return category

        return 'Other'

    def predict_category(self, description, df):
        """
        TF-IDF + cosine similarity against existing labeled expenses.
        Falls back to keyword matching if not enough data.
        """
        if len(df) < 5:
            return self.simple_categorize(description)

        try:
            existing_descriptions = df['description'].tolist()
            existing_categories = df['category'].tolist()

            # Vectorize all descriptions including the new one
            vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
            all_descriptions = existing_descriptions + [description]
            tfidf_matrix = vectorizer.fit_transform(all_descriptions)

            # New description vector is the last row
            new_vec = tfidf_matrix[-1]
            existing_vecs = tfidf_matrix[:-1]

            # Find cosine similarity between new description and all existing ones
            similarities = cosine_similarity(new_vec, existing_vecs).flatten()

            # Get top 3 most similar expenses
            top_indices = similarities.argsort()[-3:][::-1]
            top_categories = [existing_categories[i] for i in top_indices]

            # Return most common category among top 3
            from collections import Counter
            most_common = Counter(top_categories).most_common(1)[0][0]
            return most_common

        except Exception as e:
            return self.simple_categorize(description)

    def detect_anomalies(self, df):
        """
        Detect unusual expenses using Z-score method.
        Returns expenses that are >2 standard deviations from category mean.
        """
        if len(df) < 5:
            return pd.DataFrame()

        anomalies = []

        for category in df['category'].unique():
            category_df = df[df['category'] == category].copy()

            if len(category_df) < 3:
                continue

            mean_amount = category_df['amount'].mean()
            std_amount = category_df['amount'].std()

            if std_amount == 0:
                continue

            category_df['z_score'] = (category_df['amount'] - mean_amount) / std_amount
            category_anomalies = category_df[abs(category_df['z_score']) > 2]

            if len(category_anomalies) > 0:
                anomalies.append(category_anomalies)

        if anomalies:
            return pd.concat(anomalies)
        else:
            return pd.DataFrame()

    def predict_spending(self, df):
        """
        Predict next month's spending using Linear Regression on daily totals.
        """
        if len(df) < 5:
            avg_daily = df['amount'].sum() / max(len(df['date'].unique()), 1)
            return round(avg_daily * 30, 2)

        try:
            df_copy = df.copy()
            df_copy['date'] = pd.to_datetime(df_copy['date'])

            daily_spending = df_copy.groupby('date')['amount'].sum().reset_index()
            daily_spending = daily_spending.sort_values('date')

            start_date = daily_spending['date'].min()
            daily_spending['day_num'] = (daily_spending['date'] - start_date).dt.days

            X = daily_spending[['day_num']].values
            y = daily_spending['amount'].values

            model = LinearRegression()
            model.fit(X, y)

            last_day = daily_spending['day_num'].max()
            future_days = np.array([[last_day + i] for i in range(1, 31)])
            predictions = model.predict(future_days)

            next_month_prediction = max(predictions.sum(), 0)
            return round(next_month_prediction, 2)

        except Exception as e:
            avg_daily = df['amount'].sum() / max(len(df['date'].unique()), 1)
            return round(avg_daily * 30, 2)

    def get_spending_insights(self, df):
        """Generate insights about spending patterns"""
        if len(df) == 0:
            return {}

        insights = {}

        category_totals = df.groupby('category')['amount'].sum()
        insights['top_category'] = category_totals.idxmax()
        insights['top_category_amount'] = category_totals.max()
        insights['top_category_percentage'] = (category_totals.max() / df['amount'].sum() * 100)
        insights['avg_transaction'] = df['amount'].mean()

        max_idx = df['amount'].idxmax()
        insights['max_expense'] = df.loc[max_idx, 'amount']
        insights['max_expense_desc'] = df.loc[max_idx, 'description']
        insights['total_transactions'] = len(df)

        return insights