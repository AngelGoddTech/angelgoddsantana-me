"""Real personal routes, simulated central service, no network/provider sessions."""
from datetime import datetime, timedelta, timezone
import unittest
from app import app, assistant_notice
from assistant_bridge import BridgeReply, COOKIE_NAME, PATHS


class PersonalProductionBridgeTests(unittest.TestCase):
    def setUp(self):
        self.old = {key: app.config.get(key) for key in ('ASSISTANT_BRIDGE_ENABLED','ASSISTANT_BRIDGE_TRANSPORT','ASSISTANT_HTTPS_INGRESS_ORIGIN')}
        self.calls = []
        self.spent = False
        app.config.update(ASSISTANT_BRIDGE_ENABLED=True,ASSISTANT_BRIDGE_TRANSPORT=self.central,ASSISTANT_HTTPS_INGRESS_ORIGIN=None)
        self.client = app.test_client()
        self.origin = 'https://angelgoddsantana.me'
        self.token = 'C'*43
        self.grant = 'A'*43
        self.headers = {'Origin':self.origin,'Sec-Fetch-Site':'same-origin'}

    def tearDown(self):
        app.config.update(self.old)

    def central(self,path,body,headers):
        self.calls.append((path,body,headers))
        mode = body.get('mode','text')
        if path == PATHS['readiness']:
            return BridgeReply(200,dict(assistant_notice(mode),ready=True,code='ready'))
        if path == PATHS['challenge']:
            return BridgeReply(200,dict(assistant_notice(mode),code='challenge',csrfToken=self.token),
                f'{COOKIE_NAME}={self.token}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=300')
        if path == PATHS['consent']:
            self.mode = mode
            return BridgeReply(200,dict(assistant_notice(mode),code='authorized',authorization=self.grant,
                expiresAt=(datetime.now(timezone.utc)+timedelta(minutes=1)).isoformat()))
        if self.spent:
            return BridgeReply(409,dict(code='blocked_consent_spent_expired_or_superseded'))
        self.spent=True
        return BridgeReply(200,dict(code='authorized',conversationToken='T'*64,conversationId='conv_offline_personal',mode=self.mode,connectionType='webrtc'))

    def test_complete_bound_token_sequence_each_mode_and_spent_denial(self):
        for mode in ('text','voice'):
            with self.subTest(mode=mode):
                self.spent=False
                ready=self.client.get('/api/assistant/readiness?mode='+mode,base_url=self.origin)
                self.assertTrue(ready.json['ready'])
                challenge=self.client.post('/api/assistant/challenge',base_url=self.origin,headers=self.headers,json=dict(mode=mode,language='en'))
                self.assertEqual(challenge.status_code,200)
                self.assertIn('HttpOnly',challenge.headers['Set-Cookie'])
                headers={**self.headers,'X-CSRF-Token':self.token}
                accepted=self.client.post('/api/assistant/consent',base_url=self.origin,headers=headers,json=assistant_notice(mode))
                self.assertEqual(accepted.status_code,200)
                started=self.client.post('/api/assistant/session?mode='+mode,base_url=self.origin,headers=headers,json=dict(authorization=self.grant))
                self.assertEqual(started.status_code,200)
                self.assertEqual(started.json['conversationId'],'conv_offline_personal')
                self.assertEqual(started.json['mode'],mode)
                self.assertEqual(started.headers['Cache-Control'],'no-store')
                self.assertEqual(self.client.post('/api/assistant/session?mode='+mode,base_url=self.origin,headers=headers,json=dict(authorization=self.grant)).status_code,409)
        self.assertTrue(all(headers['Origin']==self.origin for _,_,headers in self.calls))
        self.assertTrue(all('Authorization' not in headers for _,_,headers in self.calls))

    def test_missing_csrf_origin_spoof_and_bounded_duplicate_schema_deny_before_io(self):
        self.assertEqual(self.client.post('/api/assistant/consent',base_url=self.origin,headers=self.headers,json=assistant_notice()).status_code,403)
        for host in ('https://foreign.invalid','http://angelgoddsantana.me'):
            self.assertEqual(self.client.post('/api/assistant/challenge',base_url=host,headers={**self.headers,'X-Forwarded-Proto':'https','X-Forwarded-Host':'angelgoddsantana.me'},json=dict(mode='text',language='en')).status_code,403)
        self.assertEqual(self.client.post('/api/assistant/challenge',base_url=self.origin,headers=self.headers,content_type='application/json',data='{"mode":"text","mode":"voice","language":"en"}').status_code,400)
        self.assertEqual(self.client.post('/api/assistant/session',base_url=self.origin,headers=self.headers,json=dict(authorization=self.grant,conversationId='conv_fake')).status_code,400)
        self.assertEqual(self.calls,[])

    def test_disabled_and_exact_attested_https_only_ingress(self):
        app.config['ASSISTANT_BRIDGE_ENABLED']=False
        self.assertEqual(self.client.post('/api/assistant/challenge',base_url=self.origin,headers=self.headers,json=dict(mode='text',language='en')).status_code,503)
        self.assertEqual(self.calls,[])
        app.config['ASSISTANT_BRIDGE_ENABLED']=True
        app.config['ASSISTANT_HTTPS_INGRESS_ORIGIN']=self.origin
        self.assertEqual(self.client.post('/api/assistant/challenge',base_url='http://angelgoddsantana.me',headers=self.headers,json=dict(mode='text',language='en')).status_code,200)
        self.assertEqual(self.client.post('/api/assistant/challenge',base_url='http://foreign.invalid',headers=self.headers,json=dict(mode='text',language='en')).status_code,403)

    def test_microphone_permission_is_exact_document_and_bridge_scoped(self):
        # Use a temporary static response so this route-level check needs no build.
        from unittest.mock import patch
        from flask import Response
        with patch('app.send_from_directory', side_effect=lambda *_args: Response('<html></html>')):
            for enabled in (False, True):
                app.config['ASSISTANT_BRIDGE_ENABLED'] = enabled
                for route in ('/assistant', '/assistant?mode=voice', '/assistant/', '/Assistant',
                              '/', '/privacy', '/terms', '/ai-retention-policy',
                              '/ai-retention-policy/azure-copy-amendment', '/contact', '/assets/main.js'):
                    with self.subTest(enabled=enabled, route=route):
                        response = self.client.get(route, base_url=self.origin)
                        expected = 'self' if enabled and route.split('?')[0] == '/assistant' else ''
                        self.assertEqual(response.headers['Permissions-Policy'],
                            f'camera=(), geolocation=(), microphone=({expected})')


if __name__=='__main__':
    unittest.main()
