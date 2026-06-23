import requests
import google.generativeai as genai # pip install google-generativeai

# Configure your secure authorization key
genai.configure(api_key="YOUR_GEMINI_API_KEY")
model = genai.GenerativeModel('gemini-1.5-pro')

def query_jarvis(prompt_question: str):
    # 1. Fetch live application data matrix metrics directly from your backend endpoints
    try:
        app_data = requests.get("http://127.0.0.1:8000/api/state").json()
    except Exception:
        return "Error: Cannot reach operational core server data streams."

    # 2. Combine the data context with your personal business question
    context_package = f"""
    You are Jarvis, the executive AI operational assistant for Frank's Forex Mentorship Business & Trading Journal.
    Here is the live metrics status database of the business:
    {app_data}
    
    User Question: {prompt_question}
    Answer beautifully, clearly, and structure text cleanly using local ZAR currency formatting indicators.
    """

    # 3. Generate response
    response = model.generate_content(context_package)
    return response.text

if __name__ == "__main__":
    print("Jarvis Core Active. Enter your business queries below:")
    while True:
        user_query = input("\nYou: ")
        if user_query.lower() in ["exit", "quit"]:
            break
        answer = query_jarvis(user_query)
        print(f"\nJarvis: {answer}")