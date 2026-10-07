import json
import unittest

from app import app, NOTICE, NOTICE_SHA256


class AssistantGateTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.payload = {
            'source': 'web-personal', 'mode': 'text', 'language': 'en',
            'policyVersion': NOTICE['policyVersion'],
            'noticeVersion': NOTICE['noticeVersion'],
            'noticeSha256': NOTICE_SHA256,
        }
        self.headers = {'Origin': 'https://angelgoddsantana.me'}

    def post(self, payload=None, headers=None):
        return self.client.post('/api/assistant/consent', json=payload or self.payload,
                                headers=self.headers if headers is None else headers,
                                base_url='https://angelgoddsantana.me')

    def test_readiness_never_authorizes_connection(self):
        response = self.client.get('/api/assistant/readiness', base_url='https://angelgoddsantana.me')
        value = response.get_json()
        self.assertFalse(value['ready'])
        self.assertEqual(value['source'], 'web-personal')
        self.assertEqual(value['noticeSha256'], NOTICE_SHA256)
        self.assertIsNone(value['csrfToken'])
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertNotIn('authorization', value)
        self.assertNotIn('agentId', value)

    def test_origin_is_required_and_exact(self):
        for headers in ({}, {'Origin': 'https://foreign.test'}, {'Origin': 'null'},
                        {'Origin': 'https://angelgoddsantana.me.evil.test'}):
            with self.subTest(headers=headers):
                self.assertEqual(self.post(headers=headers).status_code, 403)

    def test_both_modes_fail_closed_without_real_bridge(self):
        for mode in ('text', 'voice'):
            with self.subTest(mode=mode):
                response = self.post({**self.payload, 'mode': mode})
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.get_json(), {'code': 'consent_binding_bridge_unavailable'})
                self.assertNotIn('Set-Cookie', response.headers)
                self.assertEqual(response.headers['Permissions-Policy'], 'camera=(), geolocation=(), microphone=()')

    def test_client_claims_cannot_manufacture_authority(self):
        for field, value in (('source', 'web-corporate'), ('mode', 'audio'),
                             ('language', 'es'), ('policyVersion', 'old'),
                             ('noticeVersion', 'old'), ('noticeSha256', '0' * 64)):
            with self.subTest(field=field):
                self.assertEqual(self.post({**self.payload, field: value}).status_code, 409)
        response = self.post(headers={**self.headers, 'X-Assistant-CSRF': 'invented'})
        self.assertEqual(response.status_code, 503)
        for field in ('consented', 'conversationId', 'startedAt', 'agentId'):
            with self.subTest(field=field):
                self.assertEqual(self.post({**self.payload, field: 'invented'}).status_code, 400)

    def test_payload_is_bounded_and_exact(self):
        response = self.client.post('/api/assistant/consent', data=json.dumps([]),
                                    content_type='application/json', headers=self.headers,
                                    base_url='https://angelgoddsantana.me')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.post({**self.payload, 'extra': 'x' * 5000}).status_code, 413)
        self.assertEqual(self.client.get('/api/assistant/consent').status_code, 404)
        self.assertEqual(self.client.get('/api/assistant/unknown').get_json(), {'code': 'api_route_unavailable'})
        self.assertEqual(self.client.get('/api').status_code, 404)
        self.assertEqual(self.client.get('/api').get_json(), {'code': 'api_route_unavailable'})

    def test_source_is_derived_from_exact_host_without_forwarded_claims(self):
        for host in ('https://foreign.test', 'https://angelgoddsantana.me.evil.test',
                     'https://localhost', 'https://samgov.goddtechnologies.com'):
            with self.subTest(host=host):
                response = self.client.get('/api/assistant/readiness', base_url=host,
                                           headers={'X-Forwarded-Host': 'angelgoddsantana.me'})
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.get_json(), {'code': 'unsupported_source_host'})
                self.assertEqual(self.client.post('/api/assistant/consent', json=self.payload,
                                                  base_url=host, headers=self.headers).status_code, 403)


if __name__ == '__main__':
    unittest.main()
