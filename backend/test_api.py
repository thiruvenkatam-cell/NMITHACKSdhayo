import urllib.request, json

endpoints = [
    '/', '/test-db', '/analytics', '/tracking', '/match-route', '/leaderboard', 
    '/rewards?user_id=demo_user', '/notifications?user_id=demo_user', '/lend-requests',
    '/merchant/products?merchant_id=demo_merchant_1', 
    '/merchant/orders?merchant_id=demo_merchant_1',
    '/merchant/analytics?merchant_id=demo_merchant_1',
    '/merchant/dashboard?merchant_id=demo_merchant_1'
]
results = []
for ep in endpoints:
    try:
        r = urllib.request.urlopen(f'http://127.0.0.1:5001{ep}')
        data = json.loads(r.read())
        results.append(('PASS', f'GET {ep}'))
    except Exception as e:
        results.append(('FAIL', f'GET {ep} -- {e}'))

# Test POST endpoints
for ep, payload in [
    ('/create-order', {'item':'Maggie','pickup':'Canteen','drop':'Library','priority':'urgent'}),
    ('/request-item', {'item':'Calculator','duration':'2 hours','reward':50,'pickup':'Library'}),
    ('/tracking/simulate', {'order_id':'test_demo'}),
    ('/merchant/login', {'email':'merchant@nmit.ac.in', 'password':'123456'}),
    ('/merchant/add-product', {'name':'Testing Product', 'price':10, 'merchant_id':'demo_merchant_1'}),
]:
    try:
        body = json.dumps(payload).encode()
        req = urllib.request.Request(f'http://127.0.0.1:5001{ep}', data=body, headers={'Content-Type':'application/json'})
        r = urllib.request.urlopen(req)
        results.append(('PASS', f'POST {ep}'))
    except Exception as e:
        results.append(('FAIL', f'POST {ep} -- {e}'))

passed = sum(1 for s, _ in results if s == 'PASS')
total = len(results)
for status, msg in results:
    icon = 'PASS' if status == 'PASS' else 'FAIL'
    print(f'  [{icon}] {msg}')
print(f'\n  Result: {passed}/{total} endpoints working')
