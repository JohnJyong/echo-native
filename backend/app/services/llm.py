from openai import AsyncOpenAI
import json
import os

class LLMService:
    """
    Service for handling grammar correction and dialogue generation.
    """
    def __init__(self, api_key: str = None):
        self.client = AsyncOpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    async def correct_grammar(self, text: str, context: str = "") -> dict:
        """
        Uses GPT-4o to correct grammar and return a diff.
        """
        system_prompt = """
        You are an expert English language coach. 
        Your task is to correct the user's grammar while keeping the tone natural.
        Return ONLY a JSON object with:
        {
            "corrected": "The corrected sentence",
            "explanation": "Brief explanation of why",
            "diff": [{"old": "wrong_word", "new": "right_word", "type": "replace/insert/delete"}]
        }
        """
        
        user_prompt = f"Context: {context}\nUser said: {text}"

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            # Fallback for demo/no-key
            print(f"LLM Error: {e}")
            return {
                "corrected": text, 
                "explanation": "Service unavailable", 
                "diff": []
            }

    async def translate_text(self, text: str, target_lang: str = "English") -> str:
        """
        Translates text to target language using GPT-4o.
        Used for Panic Button mode.
        """
        system_prompt = f"You are a professional translator. Translate the following text into natural, native-sounding {target_lang}. Return ONLY the translation, no extra text."
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Translation Error: {e}")
            return text # Fallback
