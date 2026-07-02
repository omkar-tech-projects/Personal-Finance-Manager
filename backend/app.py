"""Finance with Omkar v2 — Backend"""
from flask import Flask, request, jsonify, send_from_directory
import json,os,hashlib,re,uuid,time,threading,random
from datetime import datetime
from functools import wraps
from config import *
try:
    import yfinance as yf
    HAS_YF=True
except ImportError:
    HAS_YF=False

app=Flask(__name__,static_folder='../frontend/public',static_url_path='')
app.secret_key=SECRET_KEY
_lock=threading.Lock()

def rj(p):
    if not os.path.exists(p): return {}
    with _lock:
        with open(p,'r') as f: return json.load(f)
def wj(p,d):
    with _lock:
        with open(p,'w') as f: json.dump(d,f,indent=2)
def hp(pw): return hashlib.sha256(('omkar_v2_'+pw).encode()).hexdigest()

@app.after_request
def cors(r):
    r.headers['Access-Control-Allow-Origin']='*'
    r.headers['Access-Control-Allow-Headers']='Content-Type,X-Auth-Token'
    r.headers['Access-Control-Allow-Methods']='GET,POST,PUT,DELETE,OPTIONS'
    return r

@app.route('/',defaults={'path':''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder,path)): return send_from_directory(app.static_folder,path)
    return send_from_directory(app.static_folder,'index.html')

def require_auth(f):
    @wraps(f)
    def d(*a,**kw):
        if request.method=='OPTIONS': return jsonify({}),200
        t=request.headers.get('X-Auth-Token','')
        if not t: return jsonify({'error':'Unauthorized'}),401
        users=rj(USERS_FILE)
        u=next((u for u in users.values() if u.get('token')==t),None)
        if not u: return jsonify({'error':'Unauthorized'}),401
        request.current_user=u
        return f(*a,**kw)
    return d

def vu(u):
    if not u or len(u)!=10: return 'Username must be exactly 10 characters'
    if not re.match(r'^[a-zA-Z0-9_]+$',u): return 'Letters, numbers, underscore only'
def vp(p):
    if not p or len(p)<4 or len(p)>10: return 'Password must be 4-10 characters'
    if not re.search(r'[a-zA-Z]',p): return 'Need at least one letter'
    if not re.search(r'[0-9]',p): return 'Need at least one number'
    if not re.search(r'[^a-zA-Z0-9]',p): return 'Need at least one special character'

@app.route('/api/register',methods=['POST','OPTIONS'])
def register():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}; u=d.get('username','').strip(); p=d.get('password','')
    e=vu(u)
    if e: return jsonify({'error':e}),400
    e=vp(p)
    if e: return jsonify({'error':e}),400
    users=rj(USERS_FILE)
    if u in users: return jsonify({'error':'Username taken'}),400
    t=str(uuid.uuid4())
    users[u]={'username':u,'password':hp(p),'token':t,'created_at':datetime.now().isoformat(),'display_name':u,'preferred_currency':'INR'}
    wj(USERS_FILE,users)
    return jsonify({'token':t,'username':u}),201

@app.route('/api/login',methods=['POST','OPTIONS'])
def login():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}; u=d.get('username','').strip(); p=d.get('password','')
    users=rj(USERS_FILE); user=users.get(u)
    if not user or user['password']!=hp(p): return jsonify({'error':'Invalid credentials'}),401
    t=str(uuid.uuid4()); users[u]['token']=t; wj(USERS_FILE,users)
    return jsonify({'token':t,'username':u})

@app.route('/api/logout',methods=['POST','OPTIONS'])
@require_auth
def logout():
    users=rj(USERS_FILE); u=request.current_user['username']
    if u in users: users[u]['token']=''; wj(USERS_FILE,users)
    return jsonify({'ok':True})

@app.route('/api/reset-password',methods=['POST','OPTIONS'])
@require_auth
def reset_pw():
    d=request.json or {}; users=rj(USERS_FILE); u=request.current_user['username']
    if users[u]['password']!=hp(d.get('current_password','')): return jsonify({'error':'Wrong current password'}),400
    e=vp(d.get('new_password',''))
    if e: return jsonify({'error':e}),400
    users[u]['password']=hp(d['new_password']); wj(USERS_FILE,users)
    return jsonify({'ok':True})

@app.route('/api/profile',methods=['GET','OPTIONS'])
@require_auth
def get_profile():
    u=request.current_user
    return jsonify({'username':u['username'],'display_name':u.get('display_name',u['username']),'preferred_currency':u.get('preferred_currency','INR'),'created_at':u.get('created_at','')})

@app.route('/api/profile',methods=['PUT'])
@require_auth
def update_profile():
    d=request.json or {}; users=rj(USERS_FILE); u=request.current_user['username']
    if 'display_name' in d: users[u]['display_name']=d['display_name'][:30]
    if 'preferred_currency' in d: users[u]['preferred_currency']=d['preferred_currency']
    wj(USERS_FILE,users); return jsonify({'ok':True})

@app.route('/api/portfolios',methods=['GET','OPTIONS'])
@require_auth
def get_ports():
    p=rj(PORTFOLIOS_FILE); return jsonify([x for x in p.get(request.current_user['username'],[]) if not x.get('deleted')])

@app.route('/api/portfolios',methods=['POST'])
@require_auth
def save_port():
    d=request.json or {}; p=rj(PORTFOLIOS_FILE); u=request.current_user['username']
    if u not in p: p[u]=[]
    pid=d.get('id') or str(uuid.uuid4()); ex=next((x for x in p[u] if x['id']==pid),None)
    port={'id':pid,'name':d.get('name','Portfolio'),'updated_at':datetime.now().isoformat(),'created_at':(ex or{}).get('created_at') or datetime.now().isoformat(),'form_data':d.get('form_data',{}),'assets':d.get('assets',{}),'liabilities':d.get('liabilities',{}),'calc_result':d.get('calc_result',{}),'deleted':False}
    if ex: p[u][p[u].index(ex)]=port
    else: p[u].append(port)
    wj(PORTFOLIOS_FILE,p); return jsonify({'id':pid,'portfolio':port}),201

@app.route('/api/portfolios/<pid>',methods=['DELETE'])
@require_auth
def del_port(pid):
    p=rj(PORTFOLIOS_FILE); u=request.current_user['username']
    for x in p.get(u,[]):
        if x['id']==pid: x['deleted']=True; wj(PORTFOLIOS_FILE,p); return jsonify({'ok':True})
    return jsonify({'error':'Not found'}),404

@app.route('/api/portfolios/<pid>/restore',methods=['POST'])
@require_auth
def restore_port(pid):
    p=rj(PORTFOLIOS_FILE); u=request.current_user['username']
    for x in p.get(u,[]):
        if x['id']==pid: x['deleted']=False; wj(PORTFOLIOS_FILE,p); return jsonify({'ok':True})
    return jsonify({'error':'Not found'}),404

@app.route('/api/calculate-fire',methods=['POST','OPTIONS'])
@require_auth
def calc_fire():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}
    fg=max(0,float(d.get('fire_goal',0))); ca=max(1,int(d.get('current_age',30))); ra=max(ca+1,int(d.get('retire_age',45)))
    ir=max(0,min(30,float(d.get('inflation_rate',6))))/100; assets=d.get('assets',{}); ytr=ra-ca
    ta=0.0; ab=[]; wrn=0.0
    for at,items in assets.items():
        if not items or not isinstance(items,list): continue
        br=ASSET_RETURNS.get(at,0.08)
        for it in items:
            if it.get('na'): continue
            inv=float(it.get('invested') or it.get('balance') or it.get('principal') or 0)
            gp=float(it.get('gain') or it.get('gain_pct') or 0)
            cr=float(it.get('rate') or it.get('interest_rate') or 0)
            cv=inv*(1+gp/100) if inv>0 else 0
            if cv<=0: cv=inv
            er=(cr/100) if cr>0 else br
            ta+=cv; wrn+=cv*er
            ab.append({'label':it.get('name') or it.get('bank_name') or at.title(),'type':at,'invested':round(inv,2),'current_value':round(cv,2),'gain_pct':round(gp,2),'effective_return':round(er*100,2)})
    wr=(wrn/ta) if ta>0 else 0.12
    iag=fg*((1+ir)**ytr); pv=ta*((1+wr)**ytr)
    gap=max(0,iag-pv); can=pv>=iag; sur=max(0,pv-iag)
    mr=wr/12; mo=ytr*12; rms=0.0
    if not can and gap>0 and mo>0 and mr>0:
        fvf=(((1+mr)**mo-1)/mr)*(1+mr); rms=gap/fvf if fvf>0 else 0
    isch=[]
    for age in range(ca,ra+1):
        yl=ra-age; nm=yl*12; m=0.0
        if nm>0 and not can and mr>0:
            eg=ta*((1+wr)**(age-ca)); rg=max(0,iag-eg)
            if rg>0:
                ff=(((1+mr)**nm-1)/mr)*(1+mr); m=rg/ff if ff>0 else 0
        isch.append({'age':age,'years_left':yl,'monthly':round(m,2),'yearly':round(m*12,2),'daily':round(m/30.44,2)})
    proj=[]
    for yr in range(0,ytr+1):
        proj.append({'year':yr,'age':ca+yr,'corpus':round(ta*((1+wr)**yr),2),'goal':round(fg*((1+ir)**yr),2)})
    atm={}
    for i in ab:
        t=i['type'].title(); atm[t]=atm.get(t,0)+i['current_value']
    return jsonify({'fire_goal':fg,'inflation_adj_goal':round(iag,2),'current_age':ca,'retire_age':ra,'years_to_retire':ytr,'inflation_rate':round(ir*100,2),'total_assets':round(ta,2),'projected_value':round(pv,2),'weighted_return':round(wr*100,2),'can_retire':can,'gap':round(gap,2),'surplus':round(sur,2),'required_monthly_sip':round(rms,2),'invest_schedule':isch,'projection':proj,'asset_breakdown':ab,'asset_type_map':atm,'monthly_sip_needed':round(rms,2),'daily_sip_needed':round(rms/30.44,2),'yearly_sip_needed':round(rms*12,2)})

@app.route('/api/calculate-final',methods=['POST','OPTIONS'])
@require_auth
def calc_final():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}; fr=d.get('fire_result',{}); liab=d.get('liabilities',{})
    ir=float(fr.get('inflation_rate',6))/100; ca=int(fr.get('current_age',30))
    tlc=0.0; lb=[]
    for key,items in liab.items():
        if not items: continue
        cfg=LIABILITY_TYPES.get(key,{'icon':'💰','label':key.title()})
        il=items if isinstance(items,list) else [items]
        for it in il:
            if not isinstance(it,dict) or it.get('na'): continue
            cost=float(it.get('cost') or it.get('expected_cost') or 0)
            if key=='children':
                n=max(1,int(it.get('num_children',1) or 1))
                cost=float(it.get('birth_cost',0) or 0)+(float(it.get('edu_cost',0) or 0)*n)
            ba=int(it.get('by_age') or it.get('purchase_age') or ca+5)
            fc=cost*((1+ir)**max(0,ba-ca)); tlc+=fc
            lb.append({'type':key,'icon':cfg['icon'],'label':cfg['label'],'name':it.get('name') or it.get('description') or cfg['label'],'original_cost':round(cost,2),'future_cost':round(fc,2),'by_age':ba,'loan_rate':float(it.get('loan_rate') or it.get('interest_rate') or 0)})
    pv=float(fr.get('projected_value',0)); fc2=float(fr.get('inflation_adj_goal',0))
    afg=fc2+tlc; an=max(0,afg-pv); ytr=max(1,int(fr.get('years_to_retire',10)))
    wr2=float(fr.get('weighted_return',12))/100; mr2=wr2/12; mo2=ytr*12; asip=0.0
    if an>0 and mo2>0 and mr2>0:
        ff2=(((1+mr2)**mo2-1)/mr2)*(1+mr2); asip=an/ff2 if ff2>0 else 0
    return jsonify({'total_liab_cost':round(tlc,2),'liab_breakdown':lb,'net_after_liabilities':round(pv-tlc,2),'adjusted_fire_goal':round(afg,2),'can_retire_with_liabilities':(pv-tlc)>=fc2,'additional_needed':round(an,2),'additional_sip':round(asip,2),'total_sip_needed':round(float(fr.get('required_monthly_sip',0))+asip,2),'projected_value':round(pv,2),'fire_corpus':round(fc2,2),'surplus_or_deficit':round(pv-tlc-fc2,2)})

@app.route('/api/sip-calculate',methods=['POST','OPTIONS'])
def sip_calc():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}; m=max(0,float(d.get('monthly_amount',5000))); r=max(0,float(d.get('annual_rate',12)))/100/12; y=max(1,int(d.get('years',10))); n=y*12
    t=m*n if r==0 else m*(((1+r)**n-1)/r)*(1+r); inv=m*n
    yl=[]
    for yr in range(1,y+1):
        nm=yr*12; v=m*nm if r==0 else m*(((1+r)**nm-1)/r)*(1+r)
        yl.append({'year':yr,'invested':round(m*nm,2),'value':round(v,2),'returns':round(v-m*nm,2)})
    return jsonify({'total_invested':round(inv,2),'estimated_returns':round(t-inv,2),'total_value':round(t,2),'yearly_breakdown':yl,'wealth_gained_pct':round(((t-inv)/inv)*100,2) if inv>0 else 0})

# ── Market data cache ───────────────────────────────────────────────
_market_cache = {'data': None, 'ts': 0}
_MARKET_TTL = 120  # 2 min cache

def _fetch_markets_yf():
    all_syms = [
        ('^BSESN','SENSEX','🇮🇳','india'),('^NSEI','NIFTY 50','🇮🇳','india'),
        ('^NSEBANK','BANK NIFTY','🇮🇳','india'),('^CNXIT','NIFTY IT','🇮🇳','india'),
        ('^GSPC','S&P 500','🇺🇸','us'),('^IXIC','NASDAQ','🇺🇸','us'),
        ('^DJI','DOW JONES','🇺🇸','us'),('^RUT','RUSSELL 2000','🇺🇸','us'),
        ('^N225','NIKKEI 225','🇯🇵','global'),('^FTSE','FTSE 100','🇬🇧','global'),
        ('^GDAXI','DAX','🇩🇪','global'),('^HSI','HANG SENG','🇭🇰','global'),
        ('^AXJO','ASX 200','🇦🇺','global'),('^STOXX50E','EURO STOXX','🇪🇺','global'),
        ('GC=F','GOLD','🥇','commodity'),('SI=F','SILVER','🥈','commodity'),
        ('CL=F','CRUDE OIL','🛢️','commodity'),('INR=X','USD/INR','💱','commodity'),
        ('BTC-USD','BITCOIN','₿','crypto'),('ETH-USD','ETHEREUM','Ξ','crypto'),
        ('SOL-USD','SOLANA','◎','crypto'),('BNB-USD','BNB','🔶','crypto'),
        ('XRP-USD','XRP','✕','crypto'),
    ]
    results = []
    if not HAS_YF:
        return results
    try:
        syms = [s[0] for s in all_syms]
        tickers = yf.download(syms, period='2d', interval='1d', progress=False, threads=True)
        close = tickers['Close'] if 'Close' in tickers else None
        for sym, name, flag, cat in all_syms:
            try:
                t = yf.Ticker(sym)
                info = t.fast_info
                price = float(info.last_price or 0)
                prev  = float(info.previous_close or price)
                chg   = round(price - prev, 4)
                pct   = round((chg / prev * 100) if prev else 0, 3)
                results.append({'symbol':sym,'name':name,'flag':flag,'category':cat,
                                 'price':round(price,4),'change':round(chg,4),
                                 'change_pct':round(pct,3),'prev_close':round(prev,4),'live':True})
            except Exception as e:
                results.append({'symbol':sym,'name':name,'flag':flag,'category':cat,
                                 'price':0,'change':0,'change_pct':0,'prev_close':0,'live':False,'error':str(e)})
    except Exception as e:
        pass
    return results

@app.route('/api/markets',methods=['GET'])
def get_markets():
    now = time.time()
    if _market_cache['data'] and now - _market_cache['ts'] < _MARKET_TTL:
        return jsonify({'data':_market_cache['data'],'updated_at':datetime.now().isoformat(),'source':'cache'})
    results = _fetch_markets_yf()
    if results:
        _market_cache['data'] = results
        _market_cache['ts'] = now
        return jsonify({'data':results,'updated_at':datetime.now().isoformat(),'source':'yfinance'})
    # fallback static
    bp={'^BSESN':73500,'^NSEI':22300,'^NSEBANK':47800,'^CNXIT':34200,'^GSPC':5700,'^IXIC':18100,'^DJI':42500,'^RUT':2180,'^N225':38900,'^FTSE':8250,'^GDAXI':18700,'^HSI':20800,'^AXJO':8100,'^STOXX50E':5020,'GC=F':2680,'SI=F':30.5,'CL=F':73.2,'INR=X':84.1,'BTC-USD':68000,'ETH-USD':3400,'SOL-USD':185,'BNB-USD':610,'XRP-USD':2.1}
    names={'^BSESN':('SENSEX','🇮🇳','india'),'^NSEI':('NIFTY 50','🇮🇳','india'),'^NSEBANK':('BANK NIFTY','🇮🇳','india'),'^CNXIT':('NIFTY IT','🇮🇳','india'),'^GSPC':('S&P 500','🇺🇸','us'),'^IXIC':('NASDAQ','🇺🇸','us'),'^DJI':('DOW JONES','🇺🇸','us'),'^RUT':('RUSSELL 2000','🇺🇸','us'),'^N225':('NIKKEI 225','🇯🇵','global'),'^FTSE':('FTSE 100','🇬🇧','global'),'^GDAXI':('DAX','🇩🇪','global'),'^HSI':('HANG SENG','🇭🇰','global'),'^AXJO':('ASX 200','🇦🇺','global'),'^STOXX50E':('EURO STOXX','🇪🇺','global'),'GC=F':('GOLD','🥇','commodity'),'SI=F':('SILVER','🥈','commodity'),'CL=F':('CRUDE OIL','🛢️','commodity'),'INR=X':('USD/INR','💱','commodity'),'BTC-USD':('BITCOIN','₿','crypto'),'ETH-USD':('ETHEREUM','Ξ','crypto'),'SOL-USD':('SOLANA','◎','crypto'),'BNB-USD':('BNB','🔶','crypto'),'XRP-USD':('XRP','✕','crypto')}
    fallback=[]
    for sym,base in bp.items():
        n,f,c=names.get(sym,(sym,'','misc'))
        cp=round(random.uniform(-1.5,1.5),2)
        fallback.append({'symbol':sym,'name':n,'flag':f,'category':c,'price':round(base*(1+cp/100),2),'change':round(base*cp/100,2),'change_pct':cp,'prev_close':base,'live':False})
    return jsonify({'data':fallback,'updated_at':datetime.now().isoformat(),'source':'fallback'})

@app.route('/api/chart/<symbol>', methods=['GET'])
def get_chart(symbol):
    period = request.args.get('period', '6mo')
    interval = {'3mo':'1d','6mo':'1d','1y':'1wk','3y':'1wk','5y':'1mo'}.get(period, '1d')
    if not HAS_YF:
        return jsonify({'error':'yfinance not available'}), 503
    try:
        t = yf.Ticker(symbol)
        hist = t.history(period=period, interval=interval)
        if hist.empty:
            return jsonify({'error':'No data'}), 404
        data = []
        for idx, row in hist.iterrows():
            data.append({'date': idx.strftime('%d %b %y'), 'close': round(float(row['Close']), 2)})
        return jsonify({'symbol': symbol, 'period': period, 'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/currency/rates',methods=['GET'])
def fx_rates():
    return jsonify({'rates':{'USD':1.0,'EUR':0.92,'GBP':0.79,'INR':83.40,'JPY':149.5,'AUD':1.53,'CAD':1.36,'CHF':0.88,'CNY':7.24,'SGD':1.34,'HKD':7.82,'KRW':1320.0,'BRL':4.97,'ZAR':18.6,'AED':3.67,'SAR':3.75},'updated_at':datetime.now().isoformat()})

@app.route('/api/currency/convert',methods=['POST','OPTIONS'])
def fx_convert():
    if request.method=='OPTIONS': return jsonify({}),200
    d=request.json or {}; a=float(d.get('amount',0)); fc=d.get('from','USD').upper(); tc=d.get('to','INR').upper()
    rates={'USD':1.0,'EUR':0.92,'GBP':0.79,'INR':83.40,'JPY':149.5,'AUD':1.53,'CAD':1.36,'CHF':0.88,'CNY':7.24,'SGD':1.34,'HKD':7.82,'KRW':1320.0,'BRL':4.97,'ZAR':18.6,'AED':3.67,'SAR':3.75}
    if fc not in rates or tc not in rates: return jsonify({'error':'Unsupported'}),400
    c=(a/rates[fc])*rates[tc]
    return jsonify({'amount':a,'from':fc,'to':tc,'converted':round(c,2),'rate':round(rates[tc]/rates[fc],6)})

@app.route('/api/history',methods=['GET'])
@require_auth
def get_hist(): return jsonify(rj(HISTORY_FILE).get(request.current_user['username'],[]))

@app.route('/api/history',methods=['POST'])
@require_auth
def save_hist():
    d=request.json or {}; h=rj(HISTORY_FILE); u=request.current_user['username']
    if u not in h: h[u]=[]
    e={'id':str(uuid.uuid4()),'saved_at':datetime.now().isoformat(),'snapshot':d}
    h[u].insert(0,e); h[u]=h[u][:50]; wj(HISTORY_FILE,h)
    return jsonify({'id':e['id']}),201

if __name__=='__main__':
    print(f"\n🧞 Finance with Omkar v2 — http://localhost:{PORT}\n")
    app.run(host='0.0.0.0',port=8090,debug=False)
