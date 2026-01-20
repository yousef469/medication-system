import ai_brain
try:
    print("Testing AI Brain...")
    res = ai_brain.process_command("Hello", use_online=True)
    print(f"Result: {res}")
except Exception as e:
    import traceback
    traceback.print_exc()
