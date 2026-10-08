"""Malformed request regressions; simulated bridge only, never provider I/O."""
import json
import unittest
from unittest.mock import patch

from app import app
from assistant_bridge import read_json


class AssistantJsonTests(unittest.TestCase):
    def setUp(self):
        self.old = {key: app.config.get(key) for key in
                    ('ASSISTANT_BRIDGE_ENABLED', 'ASSISTANT_BRIDGE_TRANSPORT')}
        self.calls = []

        def never_forward(*args):
            self.calls.append(args)
            raise AssertionError('Malformed input reached the bridge')

        app.config['ASSISTANT_BRIDGE_TRANSPORT'] = never_forward
        self.client = app.test_client()

    def tearDown(self):
        app.config.update(self.old)

    def test_deep_and_malformed_input_is_400_with_bridge_off_and_on(self):
        # This exceeds the parser recursion limit while remaining below 2 KB.
        deeply_nested = b'[' * 1000 + b'0' + b']' * 1000
        self.assertLess(len(deeply_nested), 2048)
        bodies = (deeply_nested, b'{"mode":' + b'[' * 20 + b'0' + b']' * 20 + b'}',
                  b'{"mode":"text","mode":"voice"}', b'{', b'{"mode":"\\x"}', b'\xff')
        for enabled in (False, True):
            app.config['ASSISTANT_BRIDGE_ENABLED'] = enabled
            for endpoint in ('challenge', 'consent', 'session'):
                for body in bodies:
                    with self.subTest(enabled=enabled, endpoint=endpoint, body_length=len(body)):
                        response = self.client.post('/api/assistant/' + endpoint,
                            data=body, content_type='application/json',
                            headers={'Origin': 'https://angelgoddsantana.me'},
                            base_url='https://angelgoddsantana.me')
                        self.assertEqual(response.status_code, 400)
                        self.assertEqual(response.get_json(), {'code': 'invalid_consent_request'})
                        self.assertNotIn('Set-Cookie', response.headers)
        self.assertEqual(self.calls, [])

    def test_nesting_bound_and_quoted_brackets(self):
        self.assertEqual(read_json(b'[' * 16 + b'0' + b']' * 16),
                         json.loads('[' * 16 + '0' + ']' * 16))
        for depth in (17, 1000):
            with self.subTest(depth=depth), self.assertRaises(ValueError):
                read_json(b'[' * depth + b'0' + b']' * depth)
        value = {'message': '[' * 30 + '"\\' + ']' * 30, 'nested': [{}]}
        self.assertEqual(read_json(json.dumps(value).encode()), value)

    def test_parser_recursion_failure_is_normalized(self):
        with patch('assistant_bridge.json.loads', side_effect=RecursionError('offline parser failure')):
            with self.assertRaises(ValueError):
                read_json(b'{}')

    def test_parser_recursion_failure_is_400_before_bridge_io(self):
        decode = json.loads

        def lower_parser_limit(value, *args, **kwargs):
            if kwargs.get('object_pairs_hook') is not None:
                raise RecursionError('offline lower parser limit')
            return decode(value, *args, **kwargs)

        with patch('assistant_bridge.json.loads', side_effect=lower_parser_limit):
            for enabled in (False, True):
                app.config['ASSISTANT_BRIDGE_ENABLED'] = enabled
                for endpoint in ('challenge', 'consent', 'session'):
                    with self.subTest(enabled=enabled, endpoint=endpoint):
                        response = self.client.post('/api/assistant/' + endpoint,
                            data=b'{}', content_type='application/json',
                            headers={'Origin': 'https://angelgoddsantana.me'},
                            base_url='https://angelgoddsantana.me')
                        self.assertEqual(response.status_code, 400)
                        self.assertEqual(response.get_json(), {'code': 'invalid_consent_request'})
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
