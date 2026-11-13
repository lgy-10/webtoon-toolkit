import re
s=open('../planner/index.html',encoding='utf-8').read()
s=re.sub(r'<link rel="stylesheet" href="https://cdn\.jsdelivr\.net/gh/sun-typeface/SUIT[^"]*"[^>]*>','<style>@font-face{font-family:"SUIT Variable";font-weight:100 900;font-display:swap;src:url(fonts/SUIT-Variable.woff2) format("woff2-variations")}</style>',s)
s=re.sub(r'<link rel="manifest"[^>]*>','',s)
s=re.sub(r'<link rel="preconnect"[^>]*>','',s)
assert 'cdn.jsdelivr' not in s, re.findall(r'.{40}cdn\.jsdelivr.{40}',s)
open('app/www/index.html','w',encoding='utf-8').write(s)
print('ok')
