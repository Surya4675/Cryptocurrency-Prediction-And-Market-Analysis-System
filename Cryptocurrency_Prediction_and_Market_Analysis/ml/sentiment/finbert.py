import sqlite3
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pandas as pd
import torch.nn.functional as F

DB_PATH = "database/app.db"
# Use FinBERT model from Hugging Face
MODEL_NAME = "ProsusAI/finbert"

def load_news_without_sentiment():
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT n.id, n.coin_id, n.title, n.description
    FROM news_articles n
    LEFT JOIN sentiment_results s ON n.id = s.news_id
    WHERE s.id IS NULL
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def analyze_sentiment():
    df = load_news_without_sentiment()
    if df.empty:
        print("No new articles to analyze.")
        return
        
    print(f"Loading FinBERT model ({len(df)} articles to process)...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # FinBERT labels: 0: positive, 1: negative, 2: neutral
    labels_map = {0: 'positive', 1: 'negative', 2: 'neutral'}
    
    count = 0
    for _, row in df.iterrows():
        text = f"{row['title']} {row['description'] if row['description'] else ''}"
        if not text.strip():
            continue
            
        inputs = tokenizer(text, padding=True, truncation=True, max_length=512, return_tensors='pt')
        
        with torch.no_grad():
            outputs = model(**inputs)
            
        # Get probabilities
        probs = F.softmax(outputs.logits, dim=1).numpy()[0]
        
        positive_score = float(probs[0])
        negative_score = float(probs[1])
        neutral_score = float(probs[2])
        
        pred_idx = probs.argmax()
        label = labels_map[pred_idx]
        
        cursor.execute('''
            INSERT INTO sentiment_results (news_id, label, positive_score, neutral_score, negative_score, model_name, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (row['id'], label, positive_score, neutral_score, negative_score, 'FinBERT', '1.0'))
        
        count += 1
        
    conn.commit()
    conn.close()
    print(f"Analyzed sentiment for {count} articles.")

if __name__ == '__main__':
    analyze_sentiment()
