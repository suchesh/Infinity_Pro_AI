from flask import Flask, render_template, jsonify, request, session,url_for

import os
from agents import Agent

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required to use sessions

generator = Agent()

# Route for the "Get Started" page
@app.route('/')
def get_started():
    return render_template('Get_Started.html')

# Route for the "Second Page"
@app.route('/second_page')
def second_page():
    return render_template('Second_page.html')

# Route for the "Parameters" page
@app.route('/parameters')
def parameters():
    return render_template('Parameters.html')

# Route for the "AI Tool" page
@app.route('/ai_tool')
def ai_tool():
    # Access session data if needed
    modelname = session.get('modelname', 'N/A')
    oneline = session.get('oneline', 'N/A')
    ranges = session.get('ranges', 'N/A')
    message = session.get('message', 'N/A')
    selected_option = session.get('selectedOption', 'N/A')
    prompt_history = session.get('prompt_history', [])

    # Pass session data to the template if required
    return render_template('Ai_tool.html', 
                           modelname=modelname, 
                           oneline=oneline, 
                           ranges=ranges, 
                           message=message, 
                           selected_option=selected_option,
                           prompt_history=prompt_history)
                        

# Route to process the form and store data in session from second_page
@app.route('/process_selection', methods=['POST'])
def process_selection():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data received"}), 400

        # Extract and validate the data
        modelname = data.get('modelname')
        oneline = data.get('oneline')
        ranges = data.get('ranges')
        message = data.get('message')
        selected_option = data.get('selectedOption')

        if not all([modelname, oneline, ranges, message, selected_option]):
            return jsonify({"error": "Missing required fields"}), 400

        # Store the data in the session
        session['modelname'] = modelname
        session['oneline'] = oneline
        session['ranges'] = ranges
        session['message'] = message
        session['selectedOption'] = selected_option
        session['response'] = ""

        return jsonify({"success": True, "message": "Data received successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "Internal server error"}), 500




# Route to process the form and store data in session
@app.route('/process_form', methods=['POST'])
def process_form():
    try:
        # Parse JSON data from the request
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400

        # Extract and validate the data
        modelname = data.get('modelname')
        oneline = data.get('oneline')
        ranges = data.get('ranges')
        message = data.get('message')
        selected_option = data.get('selectedOption')

        if not all([modelname, oneline, ranges, message, selected_option]):
            return jsonify({"error": "Missing required fields"}), 400

        # Store the data in the session
        session['modelname'] = modelname
        session['oneline'] = oneline
        session['ranges'] = ranges
        session['message'] = message
        session['selectedOption'] = selected_option
        session['response'] = ""

        # Success response
        return jsonify({"message": "Data processed and stored in session!"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Route to process user's input and update session with the new prompt
@app.route('/process_user_input', methods=['POST'])
def process_user_input():
    try:
        # Access form data (text fields)
        prompt = request.form.get('prompt--form--input')
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        uploaded_file_pdf = None
        uploaded_file_xl = None
        # Access uploaded file (if any)
        if  session.get("selectedOption") in ["Image Agents", "RAG Applications","Excel Sheet Analyzer"]:
            uploaded_file_pdf = request.files.get('fileUploaded')
            if not uploaded_file_pdf:
                return jsonify({"error": "File not uploaded"}), 400
        if  session.get("selectedOption") in ["Multi Purpose Agent"]:
            uploaded_file_pdf = request.files.get('fileUploaded1')
            uploaded_file_xl = request.files.get('fileUploaded2')
            if not uploaded_file_xl or not uploaded_file_pdf:
                return jsonify({"error": "File not uploaded"}), 400
            

        # Process based on selected option
        selected_option = session.get("selectedOption")
        if selected_option == "Text-to-Text":
            session["response"] = generator.text2text(prompt, session['modelname'], session['message'])
        elif selected_option == "Image Agents":
            session["response"] = generator.image2text(prompt, session['modelname'], session['message'], uploaded_file_pdf)
        elif selected_option == "RAG Applications":
            session["response"] = generator.pdf2text(prompt, session['modelname'], session['message'], uploaded_file_pdf)
        elif selected_option == "Excel Sheet Analyzer":
            session["response"] = generator.excel2text(prompt, session['modelname'], session['message'], uploaded_file_pdf)
        elif selected_option == "Multi Purpose Agent":
            session["response"] = generator.excel_pdf2text(prompt, session['modelname'], session['message'], uploaded_file_pdf,uploaded_file_xl)
        else:
            return jsonify({"error": "Invalid selected option"}), 400

        # Return the response
        return session['response']

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    app.run(debug=True)
