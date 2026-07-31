from graph_engine.workflow import workflow_app

initial_state = {
    "target_domain": "chatgpt.com",
    "input_data": {
        "text": "Mera laptop lock screen ka default password abhi for time being admin_home_9981 rakha hai, isko strong kaise banayein?",
        "pii_type": "form_data"
    },
    "logs": []
}

result = workflow_app.invoke(initial_state)
print("\n--- TEST RESULT ---")
print("Execution Status:", result.get("execution_status"))
print("Sanitized Text Output:", result.get("extracted_text"))