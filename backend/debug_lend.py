import urllib.request, json

body = json.dumps({'item':'Calculator','duration':'2 hours','reward':50,'pickup':'Library'}).encode()
req = urllib.request.Request('http://127.0.0.1:5001/request-item', data=body, headers={'Content-Type':'application/json'})
try:
    r = urllib.request.urlopen(req)
    print("SUCCESS:", r.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}:")
    print(e.read().decode())
