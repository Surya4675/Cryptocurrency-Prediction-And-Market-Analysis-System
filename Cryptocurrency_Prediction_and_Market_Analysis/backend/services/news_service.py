import os
import sqlite3
import requests
import urllib.parse
import email.utils
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from backend.config import Config

DB_PATH = Config.DATABASE_PATH

BULLISH_WORDS = {
    'gain', 'surge', 'rally', 'high', 'highest', 'soar', 'jump', 'rise', 'profit', 
    'bull', 'bullish', 'growth', 'breakout', 'record', 'uptrend', 'boom', 'adoption', 
    'partner', 'buy', 'inflow', 'accumulate', 'milestone', 'positive', 'green', 'skyrocket'
}
BEARISH_WORDS = {
    'drop', 'fall', 'plunge', 'sink', 'slump', 'loss', 'bear', 'bearish', 'decline', 
    'crash', 'down', 'low', 'fear', 'downtrend', 'selloff', 'scam', 'ban', 'lawsuit', 
    'hack', 'crackdown', 'liquidation', 'negative', 'red', 'fud', 'dump', 'investigation'
}

def score_article_sentiment(title, description=''):
    """
    Score financial sentiment of headline and snippet.
    Returns (label, positive_score, neutral_score, negative_score).
    """
    text = f"{title} {description}".lower()
    words = text.split()
    
    bull_count = sum(1 for w in words if any(b in w for b in BULLISH_WORDS))
    bear_count = sum(1 for w in words if any(b in w for b in BEARISH_WORDS))
    total = bull_count + bear_count
    
    if total == 0:
        return 'neutral', 0.15, 0.70, 0.15
    elif bull_count > bear_count:
        pos = min(0.92, 0.55 + (bull_count / (total + 1)) * 0.35)
        neg = 0.08
        neu = round(1.0 - pos - neg, 2)
        return 'positive', round(pos, 2), neu, neg
    else:
        neg = min(0.92, 0.55 + (bear_count / (total + 1)) * 0.35)
        pos = 0.08
        neu = round(1.0 - pos - neg, 2)
        return 'negative', pos, neu, round(neg, 2)

def fetch_and_store_live_news(coin_id, coin_name=None, limit=12):
    """
    Fetches real-time crypto news via Google News RSS,
    scores sentiment, and caches to SQLite database.
    """
    if not coin_name:
        coin_name = coin_id.replace('-', ' ').title()

    query = urllib.parse.quote(f'"{coin_name}" cryptocurrency')
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    
    articles = []
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, timeout=6)
        if response.status_code == 200:
            root = ET.fromstring(response.content)
            for item in root.findall('./channel/item')[:limit]:
                title = item.findtext('title') or ''
                link = item.findtext('link') or ''
                source = item.findtext('source') or 'Crypto News'
                pub_date_str = item.findtext('pubDate') or ''
                
                # Clean source from title if appended (e.g. "Bitcoin Rallies - CoinDesk" -> "Bitcoin Rallies")
                clean_title = title
                if ' - ' in title:
                    parts = title.rsplit(' - ', 1)
                    clean_title = parts[0]
                    if source == 'Crypto News':
                        source = parts[1]
                
                # Parse publication datetime
                published_at = datetime.now(timezone.utc)
                if pub_date_str:
                    try:
                        parsed = email.utils.parsedate_to_datetime(pub_date_str)
                        if parsed:
                            published_at = parsed
                    except Exception:
                        pass
                        
                articles.append({
                    'title': clean_title.strip(),
                    'description': clean_title.strip(),
                    'source': source.strip(),
                    'url': link.strip(),
                    'published_at': published_at.strftime('%Y-%m-%d %H:%M:%S')
                })
    except Exception as e:
        print(f"[NewsService] Error fetching news RSS for {coin_id}: {e}")
        return []

    if not articles:
        return []

    # Store in database with sentiment
    try:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        cur = conn.cursor()
        
        for art in articles:
            # Check duplicate by URL
            cur.execute("SELECT id FROM news_articles WHERE url = ?", (art['url'],))
            existing = cur.fetchone()
            if existing:
                news_id = existing[0]
            else:
                cur.execute("""
                    INSERT INTO news_articles (coin_id, title, description, source, url, published_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (coin_id, art['title'], art['description'], art['source'], art['url'], art['published_at']))
                news_id = cur.lastrowid
                
            # Check if sentiment exists
            cur.execute("SELECT id FROM sentiment_results WHERE news_id = ?", (news_id,))
            if not cur.fetchone():
                label, pos_score, neu_score, neg_score = score_article_sentiment(art['title'], art['description'])
                cur.execute("""
                    INSERT INTO sentiment_results (news_id, label, positive_score, neutral_score, negative_score, model_name, model_version)
                    VALUES (?, ?, ?, ?, ?, 'FinBERT-Heuristic', '1.0')
                """, (news_id, label, pos_score, neu_score, neg_score))
                
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[NewsService] Error saving news to database: {e}")

    return articles

def get_live_news_for_coin(coin_id, coin_name=None, limit=10):
    """
    Retrieves up-to-date news with sentiment.
    If database articles are older than 12 hours or fewer than 5 exist, fetches fresh news.
    """
    try:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        cur = conn.cursor()
        cur.execute("""
            SELECT n.id, n.title, n.description, n.source, n.url, n.published_at,
                   s.label, s.positive_score, s.neutral_score, s.negative_score
            FROM news_articles n
            LEFT JOIN sentiment_results s ON n.id = s.news_id
            WHERE n.coin_id = ?
            ORDER BY n.published_at DESC
            LIMIT ?
        """, (coin_id, limit))
        rows = cur.fetchall()
        conn.close()
        
        # Check freshness: do we have at least 4 articles and is the latest from today/yesterday?
        needs_fetch = False
        if len(rows) < 4:
            needs_fetch = True
        elif rows and rows[0][5]:
            try:
                latest_dt = datetime.fromisoformat(str(rows[0][5]).replace('Z', '+00:00'))
                if (datetime.now(timezone.utc) - latest_dt.replace(tzinfo=timezone.utc)).total_seconds() > 43200: # 12 hours
                    needs_fetch = True
            except Exception:
                needs_fetch = True
                
        if needs_fetch:
            fetch_and_store_live_news(coin_id, coin_name, limit=limit)
            
            # Re-query
            conn = sqlite3.connect(DB_PATH, timeout=60)
            cur = conn.cursor()
            cur.execute("""
                SELECT n.id, n.title, n.description, n.source, n.url, n.published_at,
                       s.label, s.positive_score, s.neutral_score, s.negative_score
                FROM news_articles n
                LEFT JOIN sentiment_results s ON n.id = s.news_id
                WHERE n.coin_id = ?
                ORDER BY n.published_at DESC
                LIMIT ?
            """, (coin_id, limit))
            rows = cur.fetchall()
            conn.close()

        result = []
        for r in rows:
            label = r[6] or 'neutral'
            pos = float(r[7] or 0.33)
            neu = float(r[8] or 0.34)
            neg = float(r[9] or 0.33)
            
            result.append({
                'id': r[0],
                'title': r[1],
                'description': r[2],
                'source': r[3],
                'url': r[4],
                'published_at': str(r[5]).replace(' ', 'T') if r[5] else None,
                'sentiment': {
                    'label': label,
                    'positive_score': pos,
                    'neutral_score': neu,
                    'negative_score': neg
                }
            })
        return result
    except Exception as e:
        print(f"[NewsService] Error querying news: {e}")
        return []
