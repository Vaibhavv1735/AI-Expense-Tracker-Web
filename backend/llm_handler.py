import httpx


class ExpenseLLMHandler:
    """Handles LLM-based responses using Groq or OpenAI APIs."""

    def __init__(self, api_key, provider):
        self.api_key = api_key
        self.provider = provider

    def _build_context(self, df):
        """Build a text summary of expense data for the LLM."""
        if len(df) == 0:
            return "No expenses recorded yet."

        total = df['amount'].sum()
        count = len(df)
        avg = df['amount'].mean()
        categories = df.groupby('category')['amount'].sum().to_dict()
        cat_summary = ", ".join(f"{k}: ₹{v:.2f}" for k, v in categories.items())

        recent = df.sort_values('date', ascending=False).head(10)
        recent_lines = []
        for _, row in recent.iterrows():
            recent_lines.append(
                f"  - ₹{row['amount']:.2f} on {row['description']} "
                f"({row['category']}, {row['date']})"
            )
        recent_text = "\n".join(recent_lines)

        return (
            f"Total spent: ₹{total:.2f}\n"
            f"Transactions: {count}\n"
            f"Average: ₹{avg:.2f}\n"
            f"By category: {cat_summary}\n"
            f"Recent expenses:\n{recent_text}"
        )

    def get_response(self, df, question):
        """Get LLM response about the user's expenses."""
        context = self._build_context(df)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful personal finance assistant. "
                    "Answer questions about the user's expenses based on the data provided. "
                    "Be concise, specific with numbers, and use ₹ for currency. "
                    "If the data doesn't contain enough information, say so."
                )
            },
            {
                "role": "user",
                "content": f"My expense data:\n{context}\n\nQuestion: {question}"
            }
        ]

        if self.provider == "groq":
            return self._call_groq(messages)
        elif self.provider == "openai":
            return self._call_openai(messages)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    def _call_groq(self, messages):
        """Call Groq API (LLaMA-3.3-70B)."""
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    def _call_openai(self, messages):
        """Call OpenAI API (GPT-4o-mini)."""
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
