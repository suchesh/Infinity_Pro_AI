import google.generativeai as genai
from PIL import Image
from PyPDF2 import PdfReader
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import io
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document

class Agent:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")  # Get API key from .env
        genai.configure(api_key=self.api_key)  # Configure API key

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0,
            max_tokens=None,
            timeout=None,
        )

    def text2text(self, question, name, prompt):
        input_prompt_template = f"""You are a well-experienced {name}. You need to perform the following operations: {prompt}. 
                                    Now answer the following question: {question}, and answer only this statement ->."""
        res = self.llm.invoke(input_prompt_template)
        return res.content

    def image2text(self, question, name, prompt, image):


        def image_setup(file):
            if file is not None:
                bytes_data = file.read()
                image_parts = [
                    {
                        "mime_type": file.content_type,
                        "data" : bytes_data
                    }
                ]
                return image_parts
            else:
                raise FileNotFoundError("NO file uploaded")

        

        image_data = image_setup(image)
        input_prompt_template = f"""You are a well-experienced {name}. You need to perform the following operations: {prompt}. 
                                    Now answer the following question: {question} based on the given image.And the image  data is {image_data[0]}"""
        res = self.llm.invoke([input_prompt_template])
        return res.content

    def pdf2text(self, question, name, prompt, pdf):
        def pdf_text(file):
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text
            return text

        pdf_content = pdf_text(pdf)
        input_prompt_template = f"""You are a well-experienced {name}. You need to perform the following operations: {prompt}. 
                                    Now answer the following question: {question} based on the given PDF file."""
        res = self.llm.invoke([pdf_content, input_prompt_template])
        return res.content

    def excel2text(self, question, name, prompt, excel):
        def excel_text(file):
            try:
                df = pd.read_excel(file)
                excel_text = df.to_string(index=False)
                return excel_text
            except Exception as e:
                print(f"An error occurred: {e}")
                return ""

        excel_content = excel_text(excel)
        input_prompt_template = f"""You are a well-experienced Excel data analyzer named {name}. 
                                    You need to perform the following operations: {prompt}. 
                                    Now answer the following question: {question} based on the given Excel file."""
        res = self.llm.invoke([excel_content, input_prompt_template])
        return res.content

    def excel_pdf2text(self, question, name, prompt, pdf, excel):
        def excel_text(file):   
            try:
                df = pd.read_excel(file)
                excel_text = df.to_string(index=False)
                return excel_text
            except Exception as e:
                print(f"An error occurred: {e}")
                return ""

        def pdf_text(file):
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text
            return text

        pdf_content = pdf_text(pdf)
        excel_content = excel_text(excel)

        input_prompt_template = f"""You are a well-experienced Excel and PDF data analyzer. 
                                    First, analyze the PDF and then analyze the Excel sheet. 
                                    You need to perform the following operations: {prompt}.
                                    Now answer the following question: {question} based on the given Excel and PDF data.

                                    Insights:
                                    - **Excel Data Insights**: Extract key details.
                                    - **PDF Data Insights**: Extract key details.

                                    If the question goes beyond the given prompt, answer with: <<<No content found>>>."""
        res = self.llm.invoke([excel_content, pdf_content, input_prompt_template])
        return res.content