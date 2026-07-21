import unittest
from graph_engine.workflow import workflow_app

class TestLangGraphWorkflow(unittest.TestCase):
    def test_protect_node(self):
        state = {
            "task_type": "protect",
            "input_data": {
                "text": "Contact me at test@example.com or 555-123-4567"
            }
        }
        result = workflow_app.invoke(state)
        
        # Verify the synthesizer ran via the protect_node
        protected_text = result["result"]["protected_text"]
        self.assertIn("[REDACTED_EMAIL]", protected_text)
        self.assertIn("[REDACTED_PHONE]", protected_text)
        self.assertEqual(result["result"]["status"], "protected")

    def test_scan_node(self):
        state = {
            "task_type": "scan",
            "input_data": {
                "text": "test_image.png"
            }
        }
        result = workflow_app.invoke(state)
        self.assertEqual(result["result"]["status"], "scanned")
        
if __name__ == '__main__':
    unittest.main()
