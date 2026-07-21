# test_langgraph_workflow.py

import unittest
from graph_engine.workflow import workflow_app

class TestLangGraphWorkflow(unittest.TestCase):

    def test_protect_node(self):
        # Test case where a decoy should be triggered
        initial_state = {
            "request_id": "req_123",
            "file_name": "test_id.png",
            "target_domain": "untrusted_form.com",
            "input_data": {
                "text": "234567890123",
                "pii_type": "AADHAAR"
            },
            "logs": []
        }
        
        result = workflow_app.invoke(initial_state)
        
        # Verify execution status and decoy application
        self.assertTrue(result.get("decoy_applied"))
        self.assertEqual(result.get("execution_status"), "DECOYED")
        self.assertIn("synthetic_payload", result)

    def test_scan_node(self):
        # Test case where domain is whitelisted / safe pass
        initial_state = {
            "request_id": "req_124",
            "file_name": "secure_doc.pdf",
            "target_domain": "internal-bank.com",
            "input_data": {
                "text": "Safe corporate document text",
                "pii_type": "NONE"
            },
            "logs": []
        }
        
        result = workflow_app.invoke(initial_state)
        
        # Verify safe pass execution
        self.assertFalse(result.get("decoy_applied"))
        self.assertEqual(result.get("execution_status"), "SUCCESS")

if __name__ == "__main__":
    unittest.main()