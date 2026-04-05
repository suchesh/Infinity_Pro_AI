import google.generativeai as genai
from PyPDF2 import PdfReader
import pandas as pd
import os
from dotenv import load_dotenv
import io


class Agent:

    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GOOGLE_API_KEY")

        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found")

        genai.configure(api_key=self.api_key)

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={
                "temperature": 0.6,
                "top_p": 0.9,
                "top_k": 40,
                "max_output_tokens": 1000
            }
        )

    # ---------------------- PROMPT BUILDER ----------------------

    def _build_prompt(self, question, role, domain, data_context=None):

        system_prompt = f"""You are a {role} expert in {domain}.

IMPORTANT - CONVERSATION MEMORY:
- You are continuing an ongoing conversation with the user
- ALWAYS check the conversation history below for information the user has already provided
- DO NOT ask for information that has already been provided or clarified in previous messages
- If the user previously answered a question, acknowledge it and proceed accordingly
- Reference relevant previous messages when building on prior answers

FORMAT YOUR RESPONSE WITH MARKDOWN:
- Start with a main heading using #
- Use ## for section subheadings  
- Use - for bullet points (each on a new line)
- Add blank lines between sections
- Keep response structured and easy to read
- Maximum 150 words
- If you don't know the answer or if it out of the role and domain specified, say "I don't know" instead of making something up.
- If the question is unclear, ask for clarification instead of guessing.
- If the question are greeting or farewell, respond with a friendly message instead of providing information."""

        user_section = f"User: {question}"

        if data_context:
            user_section += f"\n\n=== PREVIOUS CONVERSATION HISTORY ===\n{data_context}\n=== END HISTORY ==="

        return system_prompt + "\n\n" + user_section

    # ---------------------- RESPONSE FORMATTER ----------------------

    def _format_response(self, text):
        """Format response for proper markdown display"""
        if not text:
            return text
        
        # Remove any double backslashes
        text = text.replace('\\\\n', '\\n')
        text = text.replace('\\\\t', '\\t')
        
        # Ensure we have proper line breaks for markdown
        text = text.replace('\\n', '\n')
        
        # Trim whitespace
        return text.strip()

    # ---------------------- TEXT TO TEXT ----------------------

    def text2text(self, question, role, domain, context=None):

        try:
            prompt = self._build_prompt(question, role, domain, context)
            response = self.model.generate_content(prompt)

            if response.text:
                return self._format_response(response.text)

            return "No response generated."

        except Exception as e:
            return f"Error: {e}"

    # ---------------------- IMAGE TO TEXT ----------------------

    async def image2text(self, question, role, domain, image_file, context=None):

        if image_file is None:
            return "No image uploaded."

        try:
            image_bytes = await image_file.read()
            
            # Combine conversation context with image analysis
            combined_context = None
            if context:
                combined_context = context
            
            prompt = self._build_prompt(question, role, domain, combined_context)

            response = self.model.generate_content(
                [
                    prompt,
                    {
                        "mime_type": image_file.content_type,
                        "data": image_bytes
                    }
                ]
            )

            if response.text:
                return self._format_response(response.text)

            return "No response generated."

        except Exception as e:
            return f"Error: {e}"

    # ---------------------- PDF TO TEXT ----------------------

    async def pdf2text(self, question, role, domain, pdf_file, context=None):

        if pdf_file is None:
            return "No PDF uploaded."

        try:
            pdf_bytes = await pdf_file.read()
            reader = PdfReader(io.BytesIO(pdf_bytes))

            pdf_text = ""
            for page in reader.pages:
                content = page.extract_text()
                if content:
                    pdf_text += content + "\n"

            if not pdf_text.strip():
                return "No readable content found in PDF."

            # Combine conversation context with PDF content
            combined_context = pdf_text
            if context:
                combined_context = f"Previous Conversation:\n{context}\n\nDocument Content:\n{pdf_text}"
            
            prompt = self._build_prompt(question, role, domain, combined_context)
            response = self.model.generate_content(prompt)

            if response.text:
                return self._format_response(response.text)

            return "No response generated."

        except Exception as e:
            return f"PDF Processing Error: {e}"

    # ---------------------- EXCEL TO TEXT ----------------------

    async def excel2text(self, question, role, domain, excel_file, context=None):

        if excel_file is None:
            return "No Excel file uploaded."

        try:
            excel_bytes = await excel_file.read()
            df = pd.read_excel(io.BytesIO(excel_bytes))
            excel_text = df.to_string(index=False)

            # Combine conversation context with Excel content
            combined_context = excel_text
            if context:
                combined_context = f"Previous Conversation:\n{context}\n\nSpreadsheet Content:\n{excel_text}"
            
            prompt = self._build_prompt(question, role, domain, combined_context)
            response = self.model.generate_content(prompt)

            if response.text:
                return self._format_response(response.text)

            return "No response generated."

        except Exception as e:
            return f"Excel Processing Error: {e}"