import sqlite3
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pandas as pd
import torch.nn.functional as F
from backend.config import Config

DB_PATH = Config.DATABASE_PATH
# Use FinBERT model from Hugging Face
MODEL_NAME = "ProsusAI/finbert"

def load_news_without_sentiment():
    conn = sqlite3.connect(DB_PATH, timeout=60)
    query = """
    SELECT n.id, n.coin_id, n.title, n.description
    FROM news_articles n
    LEFT JOIN sentiment_results s ON n.id = s.news_id
    LEFT JOIN cryptocurrencies c ON n.coin_id = c.coin_id
    WHERE s.id IS NULL
    ORDER BY c.last_requested_at DESC NULLS LAST, n.published_at DESC
    LIMIT 50
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def analyze_sentiment():
    df = load_news_without_sentiment()
    if df.empty:
        print("No new articles to analyze.")
        return
        
    try:
        print(f"Loading FinBERT model ({len(df)} articles to process)...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        use_transformer = True
    except Exception as e:
        print(f"FinBERT weights unavailable ({e}). Using financial lexicon analyzer fallback.")
        use_transformer = False
        tokenizer = None
        model = None
        
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    # FinBERT labels: 0: positive, 1: negative, 2: neutral
    labels_map = {0: 'positive', 1: 'negative', 2: 'neutral'}
    
    BULLISH_WORDS = {'gain', 'surge', 'rally', 'high', 'highest', 'soar', 'jump', 'rise', 'profit', 'bull', 'bullish', 'growth', 'breakout', 'record', 'uptrend', 'boom', 'adoption', 'partner'}
    BEARISH_WORDS = {'drop', 'fall', 'plunge', 'sink', 'slump', 'loss', 'bear', 'bearish', 'decline', 'crash', 'down', 'low', 'fear', 'downtrend', 'selloff', 'scam', 'ban', 'lawsuit', 'hack'}
    
    count = 0
    for _, row in df.iterrows():
        text = f"{row['title']} {row['description'] if row['description'] else ''}".strip()
        if not text:
            continue
            
        if use_transformer:
            try:
                inputs = tokenizer(text, padding=True, truncation=True, max_length=512, return_tensors='pt')
                with torch.no_grad():
                    outputs = model(**inputs)
                probs = F.softmax(outputs.logits, dim=1).numpy()[0]
                positive_score = float(probs[0])
                negative_score = float(probs[1])
                neutral_score = float(probs[2])
                pred_idx = probs.argmax()
                label = labels_map[pred_idx]
                model_used = 'FinBERT'
            except Exception as te:
                print(f"Transformer inference error: {te}, falling back to lexicon.")
                use_transformer = False
                
        if not use_transformer:
            words = text.lower().split()
            bull_cnt = sum(1 for w in words if any(b in w for b in BULLISH_WORDS))
            bear_cnt = sum(1 for w in words if any(b in w for b in BEARISH_WORDS))
            total = bull_cnt + bear_cnt
            
            if total == 0:
                positive_score, negative_score, neutral_score = 0.15, 0.15, 0.70
                label = 'neutral'
            elif bull_cnt > bear_cnt:
                positive_score = min(0.85, 0.55 + (bull_cnt / (total + 1)) * 0.3)
                negative_score = 0.10
                neutral_score = 1.0 - positive_score - negative_score
                label = 'positive'
            else:
                negative_score = min(0.85, 0.55 + (bear_cnt / (total + 1)) * 0.3)
                positive_score = 0.10
                neutral_score = 1.0 - positive_score - negative_score
                label = 'negative'
            model_used = 'FinLexicon'
            
        cursor.execute('''
            INSERT INTO sentiment_results (news_id, label, positive_score, neutral_score, negative_score, model_name, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (row['id'], label, positive_score, neutral_score, negative_score, model_used, '1.0'))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"Analyzed sentiment for {count} articles.")

if __name__ == '__main__':
    analyze_sentiment()
