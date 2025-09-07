import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=api_key)

TRANSCRIPT_FOLDER = "call_center_transcripts"


def analyze_transcript(text):
    prompt = f"""
    Analyze the following call center transcript. 
    1. Summarize the main problems faced by the customer.
    2. Identify severity based on repeated issues, deadline/credit cycle mentions, and negative tone.
    3. Give an overall sentiment (positive, neutral, negative).
    Transcript:
    {text}
    """
    response = client.chat.completions.create(
        model="gpt-4o",  # Latest GPT-4 model
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400
    )
    return response.choices[0].message.content

def main():
    analyses = []
    for filename in os.listdir(TRANSCRIPT_FOLDER):
        if filename.endswith('.json'):
            with open(os.path.join(TRANSCRIPT_FOLDER, filename), 'r') as f:
                data = json.load(f)
                transcript_text = data.get("call_transcript", "")
                customer_id = data.get("customer_unique_id", "")
                customer_name = data.get("customer_name", "")
                agent_name = data.get("support_agent_name", "")
                case_id = filename.replace('.json', '').replace('transcript_', '')

            result = analyze_transcript(transcript_text)
            
            # Parse the result to extract summary, severity, sentiment
            lines = result.strip().split('\n')
            summary = ""
            severity = "Medium"
            sentiment = "neutral"
            
            for line in lines:
                if line.startswith('1.') or 'Summary' in line:
                    summary = line.split(':', 1)[1].strip() if ':' in line else line
                elif line.startswith('2.') or 'Severity' in line:
                    if 'High' in line: severity = "High"
                    elif 'Low' in line: severity = "Low"
                elif line.startswith('3.') or 'Sentiment' in line:
                    if 'positive' in line.lower(): sentiment = "positive"
                    elif 'negative' in line.lower(): sentiment = "negative"
            
            analysis = {
                "id": case_id,
                "customerId": customer_id,
                "customerName": customer_name,
                "agentName": agent_name,
                "caseSummary": summary,
                "sentiment": sentiment,
                "severity": severity,
                "timestamp": "Recently analyzed"
            }
            analyses.append(analysis)
            print(f"Processed: {filename}")
    
    # Save to JSON file
    with open("case_analyses.json", 'w') as f:
        json.dump(analyses, f, indent=2)
    
    print("Analysis complete. Results saved to case_analyses.json")

if __name__ == "__main__":
    main()