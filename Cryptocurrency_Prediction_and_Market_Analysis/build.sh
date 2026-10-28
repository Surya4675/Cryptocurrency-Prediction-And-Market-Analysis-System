#!/usr/bin/env bash
# Render Build Script for Cryptocurrency Prediction & Market Analysis
set -o errexit

echo ">>> [1/3] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ">>> [2/3] Building React Frontend..."
npm --prefix frontend install
npm --prefix frontend run build

echo ">>> [3/3] Checking Database Migrations..."
python backend/database/migrate_schema.py

echo ">>> Build completed successfully!"

