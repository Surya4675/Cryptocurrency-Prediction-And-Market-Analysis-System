import os
import joblib
import pandas as pd
import shap
import matplotlib.pyplot as plt
from backend.config import Config

class ShapExplainer:
    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            model_path = os.path.join(base_dir, 'models', 'xgboost_model.pkl')
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Please train the model first.")
            
        self.model = joblib.load(model_path)
        self.explainer = shap.TreeExplainer(self.model)

    def explain_prediction(self, features_df):
        """
        Calculates SHAP values for a given set of features.
        Returns the expected value, shap values, and feature names.
        """
        shap_values = self.explainer.shap_values(features_df)
        
        # Calculate mean absolute SHAP values for feature importance
        feature_importance = pd.DataFrame({
            'feature': features_df.columns,
            'importance': abs(shap_values).mean(axis=0)
        }).sort_values(by='importance', ascending=False)
        
        return {
            'expected_value': float(self.explainer.expected_value),
            'shap_values': shap_values.tolist(),
            'feature_importance': feature_importance.to_dict(orient='records')
        }
        
    def generate_summary_plot(self, features_df, output_path=None):
        """
        Generates and saves a SHAP summary plot.
        """
        shap_values = self.explainer.shap_values(features_df)
        
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, features_df, show=False)
        
        if output_path is None:
            base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            output_path = os.path.join(base_dir, 'frontend', 'public', 'shap_summary.png')
            
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return output_path

if __name__ == "__main__":
    print("SHAP Explainer Module Initialized.")
