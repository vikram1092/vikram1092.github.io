"""Build only the new Phase 2 code-native SVG candidates; approved Delivery files untouched."""
from pathlib import Path
P=Path(__file__).parent
entries=[]
def svg(name,w,h,body,title,group,state,layer='roadside',intent='decorative; no collision'):
 (P/(name+'-v1.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{title}</title>{body}</svg>')
 entries.append(dict(id=group+'-'+state.upper(),group=group,file='assets/'+name+'-v1.svg',state=state,layer=layer,intent=intent))
def rect(x,y,w,h,c,rx=0): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}"/>'
def path(d,c,stroke=None,sw=3): return f'<path d="{d}" fill="{c}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+'/>'
def line(d,c='#64767c',sw=3): return path(d,'none',c,sw)
# Environment dressing, reused distant skyline and road remain separate.
b=''
for x,w,y in [(0,350,140),(350,330,250),(1270,290,240),(1560,360,130)]:
 b+=rect(x,y,w,480-y,'#20313d')+rect(x,y,w,12,'#6c756d')
 for xx in range(x+18,x+w-12,28): b+=line(f'M{xx} {y+25}V465','#354753')
 b+=rect(x+20,y+22,w-40,24,'#889087')
for x in [90,510,1350,1730]:
 b+=rect(x,90,16,390,'#36474d')+line(f'M{x-50} 127h116M{x-33} 145v63m82-63v63','#9b9f87',7)
b+=line('M0 75H1920','#61717a',10)+line('M0 95H1920','#263c49',5)
svg('env-l2-midground',1920,480,b,'Freight stacks and substation gantry','ENV-L2','midground','midground')
b=''
for x,w,y in [(0,340,160),(340,310,238),(1240,300,232),(1540,380,145)]:
 b+=rect(x,y,w,480-y,'#233640')+rect(x+15,y+32,w-30,95,'#142630')
 for xx in range(x+30,x+w-20,60): b+=rect(xx,y+48,25,44,'#55615b')
 b+=path(f'M{x} 365h{w}l-18 39H{x+18}z','#877759')+rect(x+20,415,w-40,65,'#10232d')
 for xx in range(x+10,x+w,40): b+=path(f'M{xx} 365h20l-4 39h-16z','#354b54')
 b+=line(f'M{x+w/2} {y}v-83m-40 30h80m-66-19h52','#7a898a',4)
svg('env-l3-midground',1920,480,b,'Quiet market awnings and exchange antennas','ENV-L3','midground','midground')
b=path('M0 95L165 48l165 49 185-77 245 113 185-74 196 74 236-93 245 89 218-29V480H0z','#243e47')+path('M0 160Q470 128 930 157T1920 142V300H0z','#42636c')
for y in [180,215,250]: b+=line(f'M0 {y}Q480 {y-12} 960 {y}T1920 {y-4}','#74918b',2)
b+=path('M0 277L1150 265l125 107H0z','#596566')+path('M0 311l1180-12 95 73H0z','#354b54')
b+=line('M0 283L1150 271','#abb1a1',7)
svg('env-l4-reservoir',1920,480,b,'Freshwater reservoir above concrete retaining bank','ENV-L4','reservoir','distance')
b=path('M0 463L760 426l610-185 550-4v48l-538 11-605 184H0z','#47565a')+line('M0 450l756-38 610-183 554-4','#bcc2ad',6)+line('M0 475l764-35 610-187 546-3','#75877f',6)
for x,y in [(1160,287),(1320,238),(1530,217),(1740,215)]: b+=line(f'M{x} {y}v-35','#a0aaa0',5)
b+=path('M1375 241v-75h545v71z','#283f49')+rect(1400,179,490,37,'#89948c')
svg('env-l4-route',1920,480,b,'Lower road climbing on shared escape corridor to civic ramp','ENV-L4','route','midground')
b=''
for x,w,y in [(0,385,90),(385,290,214),(1250,285,205),(1535,385,75)]:
 b+=rect(x,y,w,480-y,'#33444c')+rect(x,y,w,20,'#879088')+rect(x+15,y+36,w-30,33,'#192f3a')
 for xx in range(x+28,x+w-20,56): b+=rect(xx,y+88,18,392-y,'#66756f')
 b+=rect(x,436,w,44,'#20353f')
svg('env-l5-midground',1920,480,b,'Civic colonnades and network service corridor','ENV-L5','midground','midground')
b='<defs><linearGradient id="dawn" x2="0" y2="1"><stop stop-color="#637d90" stop-opacity=".86"/><stop offset="1" stop-color="#c4b794" stop-opacity=".62"/></linearGradient></defs>'+rect(0,0,1920,480,'url(#dawn)')
svg('env-l5-dawn',1920,480,b,'Restrained dawn atmosphere after release','ENV-L5','dawn','atmosphere')
# Delivery deferred states, no overwrites.
s=(P/'signal-dead-v1.svg').read_text().replace('Unlit roadside crossing signal','Restored crossing signal after dawn').replace('</svg>','<circle cx="81" cy="136" r="12" fill="#9dc79a"/><path d="M76 140l5-9 5 9" fill="none" stroke="#eff4d8" stroke-width="2"/></svg>');(P/'signal-restored-v1.svg').write_text(s)
entries.append(dict(id='PROP-SIGNAL-RESTORED',group='PROP-SIGNAL',file='assets/signal-restored-v1.svg',state='restored',layer='roadside',intent='decorative; no collision'))
svg('approach-marker',240,360,rect(112,135,16,225,'#56696e')+rect(14,22,212,123,'#bcc4b7',6)+rect(26,34,188,99,'#304651',3)+path('M47 78h102V56l39 36-39 35v-25H47z','#b9cbb9'),'Blank municipal approach direction sign','PROP-SERVICE-GATE','approach')
block=rect(15,190,28,50,'#45585f')+rect(757,190,28,50,'#45585f')+rect(10,110,780,90,'#5f6358')
for x in range(20,770,90):block+=path(f'M{x} 110h42l-36 90h-42z','#b8a67a')
svg('crossing-blocked',800,240,block,'Blocked crossing dressing; service bypass separate','PROP-SERVICE-GATE','blocked-crossing',intent='authored obstruction footprint only; service bypass required')
# Intake frames neutral before scan; no baked accusation.
for state in ['inactive','active']:
 b=rect(38,40,54,320,'#748682')+rect(708,40,54,320,'#748682')+rect(38,20,724,50,'#3d535d')+rect(108,30,584,20,'#9da89a')
 for x in [54,724]: b+=rect(x,90,22,75,'#c9b47b' if state=='inactive' else '#86c5bc')
 if state=='active': b+=line('M98 92H702M98 125H702M98 158H702','#85bdb7',2)
 svg('intake-'+state,800,360,b,'Municipal intake scan '+state,'PROP-INTAKE',state,intent='posts off corridor; scan lines never collide')
# Hauler overlay uses crop space 520x420, leaves wheel/body readability.
for state in ['inactive','active']:
 b=path('M151 61h218l12 198H139z','#b7bdb0','#56666a',4)+rect(183,87,154,32,'#3e535c')+rect(198,148,124,65,'#788985',5)
 b+=path('M232 163h56v35h-56z','#172e3c')+rect(248,172,24,17,'#b0a475' if state=='inactive' else '#91d6ce')
 if state=='active':b+=line('M204 178h-41m153 0h41M233 227h54','#91d6ce',4)
 svg('recovery-'+state,520,420,b,'Municipal carrier neutral body and '+state+' emitter overlay','VEH-RECOVERY',state,'actor-overlay','overlay excluded from collision; existing hauler body requires later authored footprint')
# Relay/civic node geometry states; all lights local until civic public-active.
for civic,states in [(False,['dormant','connecting','linked']),(True,['dormant','linked','public-active'])]:
 for state in states:
  c='#4e666b' if state=='dormant' else '#91c8bc';b=rect(33,118,174,270,'#475e65',9)+rect(47,138,146,222,'#213c48',4)+rect(13,383,214,17,'#172f3c')+rect(109,27,22,94,'#7a908d')
  b+=path('M70 120V54l50-32 50 32v66','#304e5a','#819693',5)+rect(75,158,90,53,'#172c38',4)
  if state=='connecting': b+=path('M91 188v-13h15v13zm28 0v-13h15v13z',c)
  elif state!='dormant':b+=path('M91 184l19 15 32-32','none',c,7)
  else:b+=line('M91 184h54',c,5)
  for y in [241,272,303]: b+=rect(74,y,92,9,'#60746f')
  if civic:
   b+=rect(11,67,42,45,'#83928a')+rect(187,67,42,45,'#83928a')
   if state=='public-active': b+=line('M120 91V54M95 78l25 20 25-20M37 91h24m118 0h24','#b4e1c7',7)
  svg(('civic-node-' if civic else 'relay-')+state,240,400,b,('Civic access node ' if civic else 'Local relay ')+state,'PROP-CIVIC-NODE' if civic else 'PROP-RELAY',state,intent='roadside geometry; light and link region excluded from collision')
# Spillway and separate water sheets share full frame.
for state in ['closed','open']:
 b=rect(0,36,640,68,'#81908b')+rect(20,104,115,296,'#52666b')+rect(505,104,115,296,'#52666b')+rect(135,104,370,296,'#152f3c')
 b+=rect(145,105,350,275 if state=='closed' else 56,'#657d80')
 for y in range(115,375 if state=='closed' else 161,26):b+=line(f'M153 {y}h334','#374f5c',5)
 b+=rect(16,22,608,15,'#bbc1ad')
 svg('spillway-'+state,640,400,b,'Reservoir spillway '+state,'PROP-SPILLWAY',state,'midground')
for state in ['low','high']:
 h=150 if state=='low' else 240;b=path(f'M150 {400-h}Q300 {370-h} 490 {400-h}L620 400H20z','#6c999c')
 for x in [190,250,310,370,430]:b+=line(f'M{x} {420-h}q-20 {h/2} -45 {h-25}','#bfd1c3',5)
 svg('spillway-water-'+state,640,400,b,'Staged freshwater discharge '+state,'PROP-SPILLWAY','water-'+state,'water-overlay','lateral background water only; no collision or fluid simulation')
# Barrier clears the SAME passage; raised arm remains visible, separate controller.
for state in ['closed','open']:
 b=rect(20,155,62,85,'#63736f')+rect(718,155,62,85,'#63736f')+rect(31,142,39,30,'#a59468')
 b+=rect(68,153,650,34,'#b7b5a0') if state=='closed' else rect(68,153,34,34,'#b7b5a0')
 for v in range(100,700,80): b+=path(f'M{v} 153h35l-21 34h-35z','#665d4b') if state=='closed' else ''
 svg('barrier-'+state,800,240,b,'Shared uphill barrier '+state,'PROP-ROADBLOCK',state,intent='closed arm authored blocking footprint; retracted arm and posts outside safe corridor')
for state in ['active','disabled']:
 b=rect(28,22,104,190,'#6b7d79',6)+rect(39,38,82,96,'#1d3742',3)+rect(14,210,132,30,'#344d58')
 b+=path('M62 64h36v41H62z','#cdb978' if state=='active' else '#455b61')+line('M48 157h64m-64 15h64','#30434c',4)
 if state=='disabled':b+=line('M63 67l32 36m0-36l-32 36','#adb6a6',4)
 svg('controller-'+state,160,240,b,'Marked barrier controller '+state,'PROP-ROADBLOCK','controller-'+state,intent='separate authored attack target; no hitbox from decorative glow')
import json
(P/'chapter-vector-register.json').write_text(json.dumps(entries,indent=2)+'\n')
print('Wrote',len(entries),'new SVG candidates and register')
