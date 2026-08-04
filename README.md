# Cryptocurrency Prediction and Market Analysis System

## End-to-End Project Implementation Blueprint

**Programme:** MCA -- Mini Project\
**Team:** V.S. Shairaaj (25MX221), L. Surya (25MX229)\
**Guide:** Dr. M. Subathra\
**Project Type:** Explainable cryptocurrency analytics and
decision-support platform

> **System objective:** Build a reproducible, leakage-safe, explainable
> web application that combines cryptocurrency market monitoring,
> next-day price forecasting, financial-news sentiment analysis, and
> SHAP-based model explanations. The system is a
> decision-support/educational platform, not an automated trading or
> financial-advice engine.

------------------------------------------------------------------------

# 1. Project Vision

Cryptocurrency markets are highly volatile and react to both
quantitative market behaviour and qualitative information such as
financial news. Existing market dashboards commonly provide prices,
charts, and historical statistics, but a useful academic analytics
system should go further by integrating:

1.  real-time/current market monitoring,
2.  historical data analysis,
3.  reproducible feature engineering,
4.  next-day forecasting,
5.  financial-news sentiment classification,
6.  explainable machine learning,
7.  model evaluation and monitoring,
8.  a usable dashboard following established HCI principles.

The project will therefore implement an end-to-end pipeline:

``` text
CoinGecko / Market Data ──> Raw Storage ──> Validation ──> Feature Engineering ──┐
                                                                               │
                                                                               ├─> XGBoost ─> Prediction
                                                                               │             │
News API ────────────────> News Storage ──> Cleaning ──> FinBERT ─> Sentiment ─┘             │
                                                                                             v
                                                                                       SHAP Explanation
                                                                                             │
                                                                                             v
SQLite <──────────────────────────── Persisted Results <──────────────────────────────────────┘
  │
  v
Flask REST API
  │
  v
React Dashboard
```

------------------------------------------------------------------------

# 2. Scope

## 2.1 Core Project Scope

The system will provide:

- Cryptocurrency search and selection
- Real-time/current cryptocurrency market monitoring
- Historical price and market trend visualization
- Technical indicator analysis
- Next-day cryptocurrency price prediction using XGBoost
- Financial news sentiment analysis using FinBERT
- Positive / Neutral / Negative sentiment classification
- SHAP-based prediction explainability
- Interactive React.js dashboard
- Flask REST API backend
- SQLite database for persistent storage
- News filtering and pagination
- Cryptocurrency watchlist management
- Model performance and evaluation metrics
- Responsive UI following Shneiderman's Eight Golden Rules
- Secure external API integration
- Proper loading, error, empty, and data-freshness states

------------------------------------------------------------------------

# 3. Technology Stack

  ----------------------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- ----------------------------------
  Frontend                React.js                Interactive dashboard

  Backend                 Flask (Python)          REST API and application services

  Database                SQLite                  Market/news/prediction/watchlist
                                                  persistence

  Data processing         pandas, NumPy           Cleaning and feature engineering

  ML                      XGBoost                 Next-day forecasting

  Sentiment               FinBERT                 Financial-text sentiment

  Explainability          SHAP                    Local/global feature explanations

  Market API              CoinGecko API           Cryptocurrency market/history data

  News                    News API/provider       Financial/crypto headlines

  Visualisation           Frontend chart library  Interactive historical/prediction
                                                  charts

  ML evaluation           scikit-learn            Metrics, splitting, baselines

  HTTP                    requests/httpx          External API integration

  Testing                 pytest                  Python unit/integration tests

  Dev tools               VS Code                 Development

  Version control         Git + GitHub            Collaboration/version history
  ----------------------------------------------------------------------------------

### Recommended Supporting Packages

``` text
backend:
flask
flask-cors
sqlalchemy
pandas
numpy
scikit-learn
xgboost
shap
transformers
torch
requests
python-dotenv
joblib
pytest

frontend:
react
react-router-dom
axios
charting library
```

Pin exact dependency versions in lock/requirements files after the
environment is working.

------------------------------------------------------------------------

# 4. Repository Structure

Use separation of concerns from the beginning.

``` text
cryptocurrency-prediction-market-analysis/
│
├── README.md
├── .gitignore
├── .env.example
├── LICENSE
│
├── docs/
│   ├── 01_problem_statement.md
│   ├── 02_requirements.md
│   ├── 03_system_architecture.md
│   ├── 04_database_design.md
│   ├── 05_api_documentation.md
│   ├── 06_data_dictionary.md
│   ├── 07_ml_methodology.md
│   ├── 08_sentiment_methodology.md
│   ├── 09_explainability.md
│   ├── 10_ui_ux_shneiderman.md
│   ├── 11_testing_report.md
│   ├── 12_model_evaluation_report.md
│   ├── 13_deployment_guide.md
│   ├── 14_user_manual.md
│   ├── 15_limitations_ethics.md
│   └── diagrams/
│       ├── architecture.png
│       ├── data_flow.png
│       ├── er_diagram.png
│       └── ml_pipeline.png
│
├── data/
│   ├── raw/
│   │   ├── market/
│   │   └── news/
│   ├── interim/
│   ├── processed/
│   └── README.md
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_data_quality.ipynb
│   ├── 03_feature_engineering.ipynb
│   ├── 04_baseline_models.ipynb
│   ├── 05_xgboost_experiments.ipynb
│   ├── 06_finbert_validation.ipynb
│   └── 07_shap_analysis.ipynb
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── api/
│   │   ├── market_routes.py
│   │   ├── prediction_routes.py
│   │   ├── sentiment_routes.py
│   │   ├── news_routes.py
│   │   ├── watchlist_routes.py
│   │   └── health_routes.py
│   ├── services/
│   │   ├── market_service.py
│   │   ├── news_service.py
│   │   ├── prediction_service.py
│   │   ├── sentiment_service.py
│   │   └── explanation_service.py
│   ├── models/
│   │   └── db_models.py
│   ├── repositories/
│   │   ├── market_repository.py
│   │   ├── news_repository.py
│   │   └── prediction_repository.py
│   ├── utils/
│   │   ├── validators.py
│   │   ├── logging_config.py
│   │   ├── error_handlers.py
│   │   └── response.py
│   └── tests/
│       ├── test_market_api.py
│       ├── test_prediction_api.py
│       └── test_sentiment_api.py
│
├── ml/
│   ├── config/
│   │   └── model_config.yaml
│   ├── data/
│   │   ├── collect_market.py
│   │   ├── collect_news.py
│   │   └── validate_data.py
│   ├── features/
│   │   ├── technical_indicators.py
│   │   ├── lag_features.py
│   │   ├── sentiment_features.py
│   │   └── build_features.py
│   ├── training/
│   │   ├── baselines.py
│   │   ├── train_xgboost.py
│   │   ├── tune_xgboost.py
│   │   └── evaluate.py
│   ├── sentiment/
│   │   ├── finbert.py
│   │   └── aggregate_sentiment.py
│   ├── explainability/
│   │   └── shap_explainer.py
│   ├── inference/
│   │   └── predict.py
│   ├── artifacts/
│   │   ├── models/
│   │   ├── explainers/
│   │   ├── metrics/
│   │   └── metadata/
│   └── tests/
│       ├── test_features.py
│       └── test_inference.py
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── api/
│       │   └── client.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── CoinSelector.jsx
│       │   ├── PriceCard.jsx
│       │   ├── PriceChart.jsx
│       │   ├── PredictionCard.jsx
│       │   ├── SentimentCard.jsx
│       │   ├── ShapExplanation.jsx
│       │   ├── NewsList.jsx
│       │   ├── LoadingState.jsx
│       │   ├── EmptyState.jsx
│       │   └── ErrorState.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Market.jsx
│       │   ├── Prediction.jsx
│       │   ├── Sentiment.jsx
│       │   ├── Watchlist.jsx
│       │   └── ModelPerformance.jsx
│       └── utils/
│           └── formatters.js
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── scripts/
│   ├── setup.sh
│   ├── setup.ps1
│   ├── fetch_data.py
│   ├── train_model.py
│   └── run_all.py
│
└── tests/
    └── end_to_end/
        └── test_user_flow.md
```

### Repository Rule

**Notebooks are for exploration, not production logic.**\
Once an experiment works, move reusable logic into `ml/`, `backend/`, or
`frontend/`.

------------------------------------------------------------------------

# 5. System Architecture

Use a layered architecture.

``` text
┌────────────────────────────────────────────┐
│                 React UI                   │
│ Dashboard / Charts / Prediction / News     │
└──────────────────────┬─────────────────────┘
                       │ HTTP / JSON
┌──────────────────────▼─────────────────────┐
│                 Flask API                  │
│ validation / routing / error handling      │
└───────┬─────────────────┬──────────────────┘
        │                 │
        v                 v
 Application          ML Inference
 Services             Services
        │                 │
        ├───────┬─────────┤
        v       v         v
     SQLite   XGBoost   FinBERT
                        + SHAP
        ^
        │
External data ingestion
CoinGecko + News Provider
```

### Architectural Principles

-   UI never calls ML models directly.
-   Routes remain thin.
-   Business logic belongs in services.
-   SQL/database access belongs in repositories.
-   ML training is separated from online inference.
-   External APIs are wrapped in dedicated services.
-   Secrets never enter frontend code or Git.
-   Predictions include model metadata/version.
-   Failed external API calls must not crash the entire dashboard.

------------------------------------------------------------------------

# 6. Data Strategy

## 6.1 Market Data

For each supported cryptocurrency collect, where available:

``` text
coin_id
symbol
name
timestamp/date
open
high
low
close/price
volume
market_cap
```

If the selected endpoint only supplies price/market-cap/volume rather
than true OHLC, document this explicitly. Never label synthetic values
as exchange OHLC.

## 6.2 News Data

Store:

``` text
news_id
title
description
source
published_at
url
coin/topic mapping
sentiment_label
positive_probability
neutral_probability
negative_probability
```

Do not commit API keys.

## 6.3 Data Quality Checks

Before feature engineering:

-   timestamps parse correctly,
-   rows are sorted chronologically,
-   duplicates are removed,
-   numeric values have valid types,
-   prices are positive,
-   missing observations are quantified,
-   extreme values are inspected rather than blindly removed,
-   data frequency is understood,
-   future observations never fill past values.

Create a data-quality report containing:

``` text
row count
date range
missingness %
duplicate count
frequency
minimum/maximum
unexpected gaps
API failures
```

------------------------------------------------------------------------

# 7. Database Design

Recommended tables:

## `cryptocurrencies`

``` text
id
coin_id UNIQUE
symbol
name
is_active
created_at
```

## `market_prices`

``` text
id
coin_id
timestamp
open
high
low
close
price
volume
market_cap
source
created_at
UNIQUE(coin_id, timestamp)
```

## `news_articles`

``` text
id
external_id
coin_id
title
description
source
url
published_at
created_at
```

## `sentiment_results`

``` text
id
news_id
label
positive_score
neutral_score
negative_score
model_name
model_version
created_at
```

## `features`

``` text
id
coin_id
date
sma_7
sma_14
sma_30
ema_7
ema_14
rsi_14
macd
macd_signal
volatility_7
volatility_30
return_1d
lag_1
lag_2
lag_3
lag_7
volume_change
sentiment_score
created_at
```

## `predictions`

``` text
id
coin_id
prediction_for_date
generated_at
current_price
predicted_price
predicted_return
model_version
feature_version
created_at
```

## `prediction_explanations`

``` text
id
prediction_id
feature_name
feature_value
shap_value
rank
```

## `model_runs`

``` text
id
model_version
training_start
training_end
validation_start
validation_end
test_start
test_end
mae
rmse
mape
directional_accuracy
parameters_json
feature_list_json
created_at
```

## `watchlist`

For a simple academic single-user system:

``` text
id
coin_id UNIQUE
created_at
```

If authentication is later added, introduce `users` and a user/coin
composite key.

------------------------------------------------------------------------

# 8. Forecasting Problem Definition

Define the target **before training**.

Primary target:

``` text
y_t = Close_(t+1)
```

That means all features available at the end of day `t` predict the next
observation/day.

A useful secondary derived target is:

``` text
next_return = (Close_(t+1) - Close_t) / Close_t
```

The UI can then show:

``` text
Current price
Predicted next-day price
Predicted % change
Predicted direction
```

### Critical Rule: No Future Leakage

At prediction time for day `t+1`, a feature may only contain information
available on or before the prediction cutoff at `t`.

This includes sentiment. A news article published after the cutoff
cannot influence an earlier prediction.

------------------------------------------------------------------------

# 9. Feature Engineering

Start with interpretable, defensible features.

## 9.1 Returns

``` python
return_1d = close.pct_change(1)
```

## 9.2 Simple Moving Average

``` python
SMA_7  = close.rolling(7).mean()
SMA_14 = close.rolling(14).mean()
SMA_30 = close.rolling(30).mean()
```

## 9.3 Exponential Moving Average

``` python
EMA_7  = close.ewm(span=7, adjust=False).mean()
EMA_14 = close.ewm(span=14, adjust=False).mean()
```

## 9.4 RSI

Use a standard 14-period RSI implementation and document the exact
formula/library.

## 9.5 MACD

``` text
EMA12 = EMA(close, 12)
EMA26 = EMA(close, 26)
MACD = EMA12 - EMA26
Signal = EMA(MACD, 9)
```

## 9.6 Volatility

Prefer return volatility:

``` python
volatility_7 = return_1d.rolling(7).std()
volatility_30 = return_1d.rolling(30).std()
```

## 9.7 Lag Features

``` text
lag_1
lag_2
lag_3
lag_7
```

Use either lagged close/price or lagged returns, but name columns
unambiguously.

## 9.8 Volume Features

Examples:

``` text
volume
volume_change_1d
volume_sma_7
```

## 9.9 Sentiment Features

After FinBERT:

``` text
sentiment_score = P(positive) - P(negative)
```

Possible daily aggregates:

``` text
sentiment_mean
sentiment_weighted_mean
positive_article_ratio
negative_article_ratio
article_count
```

A day with no news should be explicitly represented. Do not silently
treat "no news" as proven neutral sentiment without documenting that
modelling choice.

------------------------------------------------------------------------

# 10. Why XGBoost?

XGBoost is a sensible first advanced model because the engineered
dataset is tabular and includes non-linear relationships between
technical, volume, lag, volatility, and sentiment variables.

Advantages:

-   captures nonlinear relationships,
-   models feature interactions,
-   handles heterogeneous tabular features,
-   strong performance on structured data,
-   regularisation support,
-   integrates effectively with SHAP.

However:

> XGBoost must beat simple baselines on unseen chronological data before
> the project claims predictive value.

------------------------------------------------------------------------

# 11. Baselines

Never evaluate XGBoost in isolation.

Implement at least:

### Baseline A --- Persistence

``` text
Tomorrow's predicted price = today's price
```

### Baseline B --- Moving Average

Example:

``` text
prediction = recent rolling mean
```

Optional academic comparison:

-   Linear Regression,
-   Random Forest.

The final report should compare:

  Model                            MAE   RMSE   MAPE   Direction Accuracy
  ------------------------------ ----- ------ ------ --------------------
  Persistence                                        
  Moving Average                                     
  Linear Regression (optional)                       
  XGBoost                                            

If XGBoost does not outperform persistence consistently, report that
result rather than hiding it.

------------------------------------------------------------------------

# 12. Time-Series Validation

Do **not** randomly shuffle market observations.

Wrong:

``` python
train_test_split(X, y, shuffle=True)
```

Preferred basic split:

``` text
Oldest 70%  -> Train
Next 15%    -> Validation
Newest 15%  -> Test
```

Better evaluation:

``` text
Fold 1: Train ─────> Validate
Fold 2: Train ──────────> Validate
Fold 3: Train ───────────────> Validate
```

Use expanding-window/walk-forward validation for model selection.

The final test period must remain untouched until model/hyperparameter
decisions are complete.

------------------------------------------------------------------------

# 13. XGBoost Training Pipeline

``` text
Load validated market data
        ↓
Sort chronologically
        ↓
Generate technical features
        ↓
Join time-safe sentiment aggregates
        ↓
Create next-day target
        ↓
Remove rows invalid due to rolling windows/target shift
        ↓
Chronological train/validation/test
        ↓
Train baselines
        ↓
Train XGBoost
        ↓
Tune on validation/walk-forward folds
        ↓
Evaluate once on final test period
        ↓
Fit/save approved production artifact
        ↓
Create SHAP explainer
        ↓
Save model + metadata + metrics
```

Example parameter search:

``` text
n_estimators
max_depth
learning_rate
subsample
colsample_bytree
min_child_weight
reg_alpha
reg_lambda
```

Do not tune parameters against the final test set.

------------------------------------------------------------------------

# 14. Evaluation

## Regression Metrics

### MAE

``` text
MAE = mean(|actual - predicted|)
```

Easy to interpret in price units.

### RMSE

``` text
RMSE = sqrt(mean((actual - predicted)^2))
```

Penalises large errors.

### MAPE

``` text
MAPE = mean(|(actual - predicted) / actual|) × 100
```

Use carefully and document edge cases.

### Directional Accuracy

``` text
actual_direction = sign(actual_next_price - current_price)
pred_direction   = sign(predicted_next_price - current_price)
```

Then measure the fraction of matching directions.

## Diagnostics

Also inspect:

-   prediction-vs-actual chart,
-   residual distribution,
-   residuals over time,
-   error by coin,
-   error by volatility regime,
-   baseline comparison,
-   performance stability across folds.

A good project report should not rely on a single metric.

------------------------------------------------------------------------

# 15. FinBERT Sentiment Pipeline

Pipeline:

``` text
Fetch crypto-related news
        ↓
Deduplicate
        ↓
Validate timestamp/source
        ↓
Map article to relevant coin/topic
        ↓
Construct text input
        ↓
Tokenize
        ↓
FinBERT inference
        ↓
Positive / Neutral / Negative probabilities
        ↓
Persist article-level result
        ↓
Aggregate into time-safe daily sentiment features
```

Store probabilities, not only labels.

Example:

``` json
{
  "label": "positive",
  "positive": 0.81,
  "neutral": 0.14,
  "negative": 0.05
}
```

### Validation

Manually label a small representative sample of headlines and compare
FinBERT outputs. Report obvious domain errors, ambiguous headlines, and
coin-mapping problems.

Do not automatically assume a model trained for financial language is
perfectly calibrated for cryptocurrency news.

------------------------------------------------------------------------

# 16. SHAP Explainability

SHAP answers:

> Which features pushed this model prediction higher or lower relative
> to the model's baseline output?

For each prediction display the strongest contributions, for example:

``` text
Predicted next price: X

Factors pushing prediction upward:
+ lag_1
+ positive sentiment
+ MACD

Factors pushing prediction downward:
- volatility_7
- RSI
```

### Global Explanation

Use summary/importance analysis to understand model behaviour across
many observations.

### Local Explanation

For one prediction show:

``` text
feature
feature value
SHAP contribution
direction
```

### Interpretation Rule

Never write:

> "RSI caused Bitcoin's price to rise."

Prefer:

> "For this model prediction, RSI contributed positively relative to the
> model's baseline."

SHAP explains **model behaviour**, not market causality.

------------------------------------------------------------------------

# 17. Model Artifact Contract

Never save only `model.pkl`.

Store:

``` text
model artifact
model version
training period
feature names
feature order
feature-generation version
hyperparameters
metrics
target definition
data source/version
created timestamp
SHAP explainer/configuration
```

Example:

``` text
ml/artifacts/models/xgb_price_v1.joblib
ml/artifacts/explainers/xgb_price_v1_shap.joblib
ml/artifacts/metrics/xgb_price_v1.json
ml/artifacts/metadata/xgb_price_v1.json
```

This prevents training-serving feature mismatch.

------------------------------------------------------------------------

# 18. Backend REST API

Use versioned routes.

``` text
/api/v1/health
/api/v1/coins
/api/v1/market/{coin_id}
/api/v1/history/{coin_id}
/api/v1/predict/{coin_id}
/api/v1/explain/{prediction_id}
/api/v1/news/{coin_id}
/api/v1/sentiment/{coin_id}
/api/v1/model/performance
/api/v1/watchlist
```

Example prediction response:

``` json
{
  "coin_id": "bitcoin",
  "prediction_for": "YYYY-MM-DD",
  "generated_at": "ISO-8601 timestamp",
  "current_price": 0,
  "predicted_price": 0,
  "predicted_change_pct": 0,
  "model_version": "xgb_price_v1",
  "features_as_of": "ISO-8601 timestamp",
  "top_factors": [
    {
      "feature": "lag_1",
      "value": 0,
      "shap_value": 0
    }
  ],
  "disclaimer": "Experimental model output; not financial advice."
}
```

### HTTP Behaviour

``` text
200 success
201 resource created
400 invalid request
404 resource not found
429 upstream/rate-limit condition where appropriate
500 unexpected internal failure
503 upstream/model service unavailable
```

Use a consistent error body:

``` json
{
  "error": {
    "code": "MARKET_DATA_UNAVAILABLE",
    "message": "Market data is temporarily unavailable."
  }
}
```

Do not expose stack traces to the browser.

------------------------------------------------------------------------

# 19. External API Reliability

Coin/news providers may fail or rate-limit requests.

Implement:

``` text
timeout
limited retry with backoff
rate-limit awareness
response validation
database caching
last-successful-data fallback where appropriate
structured logging
friendly frontend error state
```

Example behaviour:

``` text
External API available
    -> fetch
    -> validate
    -> cache/store
    -> return

External API unavailable
    -> attempt safe fallback
    -> clearly label data timestamp
    -> otherwise return controlled service error
```

Never silently present stale data as real-time data.

------------------------------------------------------------------------

# 20. Security

Minimum requirements:

-   `.env` for API keys,
-   `.env` in `.gitignore`,
-   `.env.example` contains names but no secrets,
-   validate route parameters,
-   parameterised SQL/ORM,
-   restrict CORS to required origins,
-   set request timeouts,
-   limit request payload sizes where relevant,
-   avoid sensitive details in logs,
-   never expose backend API keys to React,
-   dependency updates/security review,
-   no arbitrary code execution endpoints.

Example:

``` env
COINGECKO_API_KEY=
NEWS_API_KEY=
FLASK_ENV=
DATABASE_URL=
```

------------------------------------------------------------------------

# 21. Frontend Pages

## Dashboard

Display:

``` text
market summary
selected coin
current price
24h change
volume
market cap
historical chart
next-day prediction
sentiment summary
top SHAP factors
recent news
data/prediction timestamps
```

## Market

``` text
search
coin selector
historical chart
date/range controls
technical indicators
volume
market statistics
```

## Prediction

``` text
current price
next-day prediction
predicted change
model version
generated timestamp
model-performance context
SHAP explanation
disclaimer
```

## Sentiment

``` text
overall sentiment
positive/neutral/negative distribution
article list
source
published time
article-level sentiment
filters
pagination
```

## Watchlist

``` text
saved coins
current market snapshot
quick navigation
remove action
```

## Model Performance

``` text
model version
test period
MAE
RMSE
MAPE
directional accuracy
baseline comparison
actual vs predicted
known limitations
```

------------------------------------------------------------------------

# 22. Shneiderman's Eight Golden Rules

The UI must demonstrate the rules explicitly, not merely mention them in
documentation.

## Rule 1 --- Strive for Consistency

Apply:

-   same navigation across pages,
-   same typography hierarchy,
-   same card behaviour,
-   same price/date formatting,
-   same sentiment labels,
-   same button terminology.

Example: use **Add to Watchlist** everywhere rather than mixing
"Favourite", "Save", and "Wishlist".

## Rule 2 --- Seek Universal Usability

Apply:

-   responsive layouts,
-   keyboard accessibility,
-   readable typography,
-   labels in addition to icons,
-   sufficient contrast,
-   semantic HTML,
-   tooltips/help for technical terms,
-   avoid relying only on colour.

For sentiment use:

``` text
Positive + icon/text
Neutral + icon/text
Negative + icon/text
```

## Rule 3 --- Offer Informative Feedback

Every user action receives feedback.

Examples:

``` text
Loading market data...
Prediction generated at 10:30
Added to watchlist
No articles found for this filter
Unable to contact market-data service
```

## Rule 4 --- Design Dialogs to Yield Closure

Multi-step processes need a clear finish.

Example:

``` text
Select coin
   ↓
Load latest features
   ↓
Generate prediction
   ↓
Prediction displayed successfully
```

## Rule 5 --- Prevent Errors

Apply:

-   valid coin dropdowns rather than arbitrary identifiers,
-   disable prediction until required data exists,
-   validate date ranges,
-   prevent duplicate watchlist entries,
-   confirm destructive actions where necessary.

## Rule 6 --- Permit Easy Reversal of Actions

Examples:

``` text
Remove from watchlist -> Undo
Clear filters -> Restore/reset
```

Avoid irreversible actions where possible.

## Rule 7 --- Keep Users in Control

Users choose:

-   coin,
-   time range,
-   filters,
-   pagination,
-   watchlist,
-   chart/indicator views.

Avoid unexplained automatic navigation or hidden state changes.

## Rule 8 --- Reduce Short-Term Memory Load

Do not force users to remember information across pages.

Keep important context visible:

``` text
BTC / Bitcoin
Current price
Selected date range
Prediction horizon
Last updated
Model version
```

Use tooltips for:

``` text
RSI
MACD
SHAP
FinBERT
MAE
RMSE
```

------------------------------------------------------------------------

# 23. UX States Required for Every Data Component

Every asynchronous component should support:

``` text
Loading
Success
Empty
Error
Stale/cached (if applicable)
```

Example:

``` text
News panel:
Loading -> skeleton
Success -> article cards
Empty -> "No relevant news found."
Error -> retry option
```

This is part of both usability and production robustness.

------------------------------------------------------------------------

# 24. Testing Strategy

## Unit Tests

Test:

``` text
SMA
EMA
RSI
MACD
lag generation
target shifting
sentiment aggregation
input validation
response formatting
```

Especially test that target/feature alignment cannot introduce leakage.

## API Integration Tests

Test:

``` text
GET market
GET history
GET prediction
GET sentiment
GET explanation
watchlist create/delete
invalid coin
external API failure
missing model artifact
```

## ML Tests

Validate:

``` text
feature schema/order
no target in feature matrix
chronological split
model can load
inference produces finite value
SHAP output matches feature count
metadata matches model
```

## UI Tests

Verify:

``` text
navigation
search
filters
pagination
watchlist
loading/error/empty states
prediction rendering
responsive behaviour
keyboard usability
```

## End-to-End Acceptance Flow

``` text
1. Open dashboard
2. Select Bitcoin
3. View current/historical market data
4. Open prediction
5. View next-day predicted price
6. Inspect SHAP factors
7. Open sentiment
8. Filter news
9. Add Bitcoin to watchlist
10. Refresh and verify expected persistence
```

------------------------------------------------------------------------

# 25. Experiment Tracking

For every serious model experiment record:

``` text
run_id
date
dataset range
coins
target
features
split/folds
parameters
MAE
RMSE
MAPE
directional accuracy
notes
artifact path
```

A CSV/JSON file is enough for the academic project if consistently
maintained.

Never report only the best run without preserving the experimental
history.

------------------------------------------------------------------------

# 26. Reproducibility

A reviewer should be able to reproduce the project.

Provide:

``` text
requirements.txt
package lock file
.env.example
database schema
data collection script
feature-building script
training script
evaluation script
model metadata
run instructions
test commands
```

Preferred workflow:

``` bash
python scripts/fetch_data.py
python scripts/train_model.py
python backend/app.py
```

and separately:

``` bash
cd frontend
npm install
npm run dev
```

Do not commit secrets, virtual environments, huge raw datasets, or
generated caches.

------------------------------------------------------------------------

# 27. Documentation Deliverables

The final repository must contain these documents.

### `01_problem_statement.md`

Explain:

-   volatility/problem context,
-   weaknesses of existing solutions,
-   end users,
-   project objective,
-   scope and exclusions.

### `02_requirements.md`

Include:

-   functional requirements,
-   non-functional requirements,
-   user stories,
-   acceptance criteria.

### `03_system_architecture.md`

Include:

-   component architecture,
-   data flow,
-   training vs inference,
-   external integrations.

### `04_database_design.md`

Include:

-   ER diagram,
-   tables,
-   PK/FK/unique constraints,
-   indexing decisions.

### `05_api_documentation.md`

For each endpoint:

``` text
method
URL
parameters
request
response
errors
example
```

### `06_data_dictionary.md`

For every important column:

``` text
name
type
source
meaning
unit
missing-value policy
```

### `07_ml_methodology.md`

Document:

-   target,
-   features,
-   leakage prevention,
-   split strategy,
-   baselines,
-   XGBoost,
-   tuning,
-   evaluation,
-   limitations.

### `08_sentiment_methodology.md`

Document:

-   news source,
-   query strategy,
-   preprocessing,
-   FinBERT,
-   probabilities,
-   aggregation,
-   validation.

### `09_explainability.md`

Explain:

-   why SHAP,
-   local vs global explanation,
-   limitations,
-   example interpretation.

### `10_ui_ux_shneiderman.md`

Map all eight rules to actual screenshots/components in the finished UI.

### `11_testing_report.md`

Include:

``` text
test ID
module
input
expected result
actual result
status
```

### `12_model_evaluation_report.md`

Include:

-   baselines,
-   XGBoost,
-   chronological test metrics,
-   plots,
-   residual/error analysis,
-   limitations.

### `13_deployment_guide.md`

Explain:

-   prerequisites,
-   environment variables,
-   database setup,
-   backend/frontend startup,
-   model artifact setup.

### `14_user_manual.md`

Show:

-   dashboard navigation,
-   prediction,
-   sentiment,
-   SHAP explanation,
-   watchlist,
-   model metrics.

### `15_limitations_ethics.md`

State clearly:

-   crypto is volatile,
-   predictions are probabilistic/uncertain,
-   historical performance does not guarantee future results,
-   news can be incomplete/noisy,
-   sentiment classification can be wrong,
-   SHAP is not causal explanation,
-   system is not financial advice,
-   external APIs can be unavailable or stale.

------------------------------------------------------------------------

# 28. Functional Requirements

Use identifiers for traceability.

``` text
FR-01 System shall retrieve supported cryptocurrency market data.
FR-02 System shall display historical market trends.
FR-03 System shall calculate documented technical indicators.
FR-04 System shall generate next-day price predictions for supported coins.
FR-05 System shall display model version and prediction timestamp.
FR-06 System shall retrieve relevant cryptocurrency news.
FR-07 System shall classify news using FinBERT.
FR-08 System shall display sentiment distributions.
FR-09 System shall provide SHAP-based prediction explanations.
FR-10 System shall support search/filter/pagination where applicable.
FR-11 System shall support a watchlist.
FR-12 System shall display model evaluation metrics.
FR-13 System shall provide controlled errors when upstream services fail.
FR-14 System shall display freshness timestamps for market/prediction data.
```

------------------------------------------------------------------------

# 29. Non-Functional Requirements

``` text
NFR-01 Usability
UI follows Shneiderman's Eight Golden Rules.

NFR-02 Performance
Cached dashboard requests should return promptly under normal academic/demo load.

NFR-03 Reliability
External API failure must produce controlled fallback/error behaviour.

NFR-04 Security
Secrets stay server-side and input is validated.

NFR-05 Maintainability
Data, ML, API, persistence and UI are separated into modules.

NFR-06 Explainability
Every production prediction can be associated with feature-level explanation data.

NFR-07 Reproducibility
Model training/evaluation can be rerun from documented scripts.

NFR-08 Traceability
Predictions retain model version, generation time and prediction horizon.

NFR-09 Accessibility
Important information is not encoded using colour alone.
```

------------------------------------------------------------------------

# 30. Development Phases

## Phase 1 --- Requirements & Design

Deliver:

``` text
problem statement
requirements
scope
use cases
architecture
database design
UI wireframes
API contract
```

**Exit condition:** the team can explain exactly what the MVP does and
does not do.

## Phase 2 --- Data Engineering

Deliver:

``` text
market collector
news collector
raw storage
data validation
database population
EDA/data-quality report
```

**Exit condition:** reproducible historical dataset with documented date
range and quality.

## Phase 3 --- Forecasting

Deliver:

``` text
feature pipeline
baselines
chronological validation
XGBoost experiments
final evaluation
saved artifact
```

**Exit condition:** model is evaluated against baselines on unseen
chronological data.

## Phase 4 --- Sentiment & Explainability

Deliver:

``` text
FinBERT pipeline
manual sentiment validation
daily aggregation
SHAP local/global explanations
```

**Exit condition:** sentiment and explanations are reproducible and
time-aligned.

## Phase 5 --- Dashboard & API

Deliver:

``` text
Flask routes
React pages
charts
prediction UI
sentiment UI
watchlist
Shneiderman implementation
```

**Exit condition:** complete user journey works through the browser.

## Phase 6 --- Testing & Deployment

Deliver:

``` text
unit tests
integration tests
end-to-end tests
documentation
deployment
final screenshots
demo dataset/fallback plan
```

**Exit condition:** a fresh machine can follow the README and run the
project.

------------------------------------------------------------------------

# 31. Recommended Build Order

Follow this order rather than building the dashboard first:

``` text
1. Freeze requirements and supported coins
2. Create repository structure
3. Define database/schema
4. Build market-data ingestion
5. Build news ingestion
6. Validate and profile data
7. Perform EDA
8. Implement feature engineering
9. Establish persistence baseline
10. Implement chronological validation
11. Train/tune XGBoost
12. Freeze final test evaluation
13. Implement FinBERT
14. Create time-aligned sentiment features
15. Test whether sentiment improves forecasting
16. Implement SHAP
17. Save model + metadata
18. Build Flask services/API
19. Build React dashboard
20. Apply Shneiderman rules explicitly
21. Add tests/error handling
22. Document/deploy
```

------------------------------------------------------------------------

# 32. Important Scientific Experiment: Does Sentiment Help?

Do not assume sentiment improves prediction because it sounds
reasonable.

Compare:

``` text
Model A:
technical + lag + volume features

Model B:
technical + lag + volume + sentiment features
```

Use the same chronological evaluation periods.

Report:

``` text
MAE change
RMSE change
MAPE change
directional-accuracy change
```

This turns the project from "we used FinBERT" into an actual research
question:

> Does financial-news sentiment provide incremental predictive value for
> next-day cryptocurrency forecasting beyond market-derived features?

That is a stronger academic contribution.

------------------------------------------------------------------------

# 33. Additional Ablation Study

If time permits, evaluate:

``` text
Baseline
Lag only
Lag + technical
Lag + technical + volume
Lag + technical + volume + sentiment
```

This helps answer which information sources actually contribute.

SHAP explains the fitted model; ablation tests whether feature groups
improve out-of-sample performance.

------------------------------------------------------------------------

# 34. Prediction Freshness and Traceability

Every prediction should answer:

``` text
What coin?
Prediction for what date/time?
Generated when?
Using data available until when?
Which model version?
Which feature version?
```

Example UI:

``` text
Bitcoin
Next-day forecast

Generated: 27 Jul, 10:30 AM
Market data as of: 27 Jul, 10:00 AM
Model: xgb_price_v1
```

This avoids ambiguous "real-time prediction" claims.

------------------------------------------------------------------------

# 35. Logging

Log useful operational events:

``` text
application start
external API request/failure
data validation failure
model load
prediction request
prediction failure
news inference failure
database failure
```

Do not log API keys.

Prefer structured context:

``` text
timestamp
level
module
event
coin_id
request_id
message
```

------------------------------------------------------------------------

# 36. Deployment Considerations

For the college/demo version:

``` text
React frontend
       ↓
Flask API
       ↓
SQLite + saved model artifacts
```

SQLite is suitable for a mini-project/single-instance deployment.

For future multi-user scaling, consider:

``` text
PostgreSQL
scheduled ingestion workers
model registry
cloud object storage
Redis caching
containerisation
CI/CD
monitoring
```

Do not prematurely add infrastructure that does not improve the current
project.

------------------------------------------------------------------------

# 37. Model Retraining

MVP:

``` text
manual/scripted retraining
```

Example:

``` bash
python scripts/train_model.py
```

Future version:

``` text
scheduled data ingestion
        ↓
data-quality checks
        ↓
retraining
        ↓
evaluation gate
        ↓
only promote model if acceptance criteria pass
```

Never automatically replace a working model simply because a newer model
finished training.

------------------------------------------------------------------------

# 38. Definition of Done

The project is complete when:

-   [ ] market data ingestion works reproducibly,
-   [ ] news ingestion works reproducibly,
-   [ ] raw/processed data boundaries are clear,
-   [ ] SQLite schema is documented,
-   [ ] technical indicators are tested,
-   [ ] target construction is leakage-safe,
-   [ ] chronological validation is used,
-   [ ] persistence baseline is implemented,
-   [ ] XGBoost is evaluated on untouched test data,
-   [ ] FinBERT outputs probabilities and labels,
-   [ ] sentiment is correctly time-aligned,
-   [ ] SHAP explains predictions,
-   [ ] model artifacts contain metadata/versioning,
-   [ ] Flask API is versioned and validated,
-   [ ] React dashboard implements required states,
-   [ ] watchlist/filter/pagination work,
-   [ ] Shneiderman's eight rules are evidenced,
-   [ ] external API failures are handled,
-   [ ] secrets are protected,
-   [ ] tests pass,
-   [ ] model-performance page reports real metrics,
-   [ ] documentation is complete,
-   [ ] limitations/disclaimer are visible,
-   [ ] deployment instructions work from a clean environment.

------------------------------------------------------------------------

# 39. Review / Viva Talking Points

### Why XGBoost instead of LSTM?

Because the initial problem is formulated using engineered tabular
time-series features. XGBoost is efficient, interpretable with SHAP, and
provides a strong baseline for nonlinear tabular relationships. Deep
learning can be compared later rather than assumed to be superior.

### Why FinBERT?

It is designed for financial language, making it more appropriate than a
generic sentiment model for financial-news text. Its crypto-domain
performance is still validated rather than assumed.

### Why SHAP?

It provides feature-level attribution for individual predictions and
global model analysis, improving transparency. It explains model output,
not causal market mechanisms.

### Why SQLite?

The mini-project is a moderate-scale academic web application. SQLite
provides simple persistent relational storage without unnecessary
operational complexity. A production multi-user system could migrate to
PostgreSQL.

### Why React + Flask?

React handles interactive UI state and visualisation while Flask exposes
Python data-science/ML functionality through a clean REST boundary.

### How do you prevent data leakage?

Features are calculated only from observations available at the
prediction cutoff, targets are shifted into the future, sentiment uses
publication timestamps, and evaluation uses chronological/walk-forward
splits instead of shuffled random splits.

### How do you prove the model is useful?

Compare XGBoost against persistence and other simple baselines on unseen
chronological test data using MAE, RMSE, MAPE and directional accuracy.

------------------------------------------------------------------------

# 40. Final Product Positioning

Use wording such as:

> **Cryptocurrency Prediction and Market Analysis System is an
> explainable decision-support platform that integrates market data,
> machine-learning forecasting, financial-news sentiment analysis, and
> feature-level model explanations in a unified web interface.**

Avoid wording such as:

``` text
guaranteed crypto prediction
accurate investment recommendation
AI tells users what to buy
risk-free forecasting
```

The final system should communicate:

``` text
Market evidence
        +
Model forecast
        +
News sentiment
        +
Explanation
        +
Evaluation evidence
        ↓
Better-informed analysis
```

---not guaranteed investment decisions.

------------------------------------------------------------------------

# 41. Future Enhancements

After the MVP is validated:

-   automated retraining with evaluation gates,
-   social-media sentiment,
-   multi-source news fusion,
-   additional cryptocurrencies,
-   PostgreSQL migration,
-   user authentication,
-   portfolio analytics,
-   probabilistic prediction intervals,
-   drift monitoring,
-   ensemble models,
-   temporal/deep-learning comparison,
-   containerised deployment,
-   CI/CD.

Deep learning should be added as a **measured comparison**, not merely
because it is more complex.

------------------------------------------------------------------------

# 42. Final Engineering Principle

For every major project claim, preserve evidence.

``` text
"Accurate prediction"
        -> test metrics + baseline comparison

"Real-time"
        -> timestamps + refresh/data-source definition

"Sentiment improves prediction"
        -> ablation experiment

"Explainable"
        -> SHAP output + correct interpretation

"User-friendly"
        -> Shneiderman mapping + usability evidence

"Reliable"
        -> tests + controlled API failure behaviour

"Reproducible"
        -> scripts + dependencies + metadata
```

This evidence-driven approach should guide the entire implementation,
report, review presentation, and viva.
