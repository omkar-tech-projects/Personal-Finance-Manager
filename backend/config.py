import os, secrets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
SECRET_KEY = os.environ.get('OMKAR_SECRET', secrets.token_hex(32))
PORT = int(os.environ.get('PORT', 5000))
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
PORTFOLIOS_FILE = os.path.join(DATA_DIR, 'portfolios.json')
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
ASSET_RETURNS = {'bank':0.04,'stocks':0.15,'fd':0.072,'etf':0.13,'gold':0.08,'silver':0.07,'property':0.10,'bonds':0.072,'nps':0.10,'crypto':0.20,'other':0.07}
LIABILITY_TYPES = {'car':{'icon':'🚗','label':'Car'},'house':{'icon':'🏠','label':'House'},'bike':{'icon':'🏍️','label':'Bike'},'wedding':{'icon':'💍','label':'Wedding'},'children':{'icon':'👶','label':'Children'},'education':{'icon':'🎓','label':'Education'},'travel':{'icon':'✈️','label':'Travel'},'gadgets':{'icon':'💻','label':'Gadgets'},'medical':{'icon':'🏥','label':'Medical'},'other':{'icon':'🛒','label':'Other'}}
MARKET_SYMBOLS = {
    'india':[{'sym':'^BSESN','name':'SENSEX','flag':'🇮🇳'},{'sym':'^NSEI','name':'NIFTY 50','flag':'🇮🇳'},{'sym':'^NSEBANK','name':'BANK NIFTY','flag':'🇮🇳'},{'sym':'^CNXIT','name':'NIFTY IT','flag':'🇮🇳'}],
    'us':[{'sym':'^GSPC','name':'S&P 500','flag':'🇺🇸'},{'sym':'^IXIC','name':'NASDAQ','flag':'🇺🇸'},{'sym':'^DJI','name':'DOW JONES','flag':'🇺🇸'},{'sym':'^RUT','name':'RUSSELL 2000','flag':'🇺🇸'}],
    'global':[{'sym':'^N225','name':'NIKKEI 225','flag':'🇯🇵'},{'sym':'^FTSE','name':'FTSE 100','flag':'🇬🇧'},{'sym':'^GDAXI','name':'DAX','flag':'🇩🇪'},{'sym':'^HSI','name':'HANG SENG','flag':'🇭🇰'},{'sym':'^AXJO','name':'ASX 200','flag':'🇦🇺'},{'sym':'^STOXX50E','name':'EURO STOXX','flag':'🇪🇺'}],
    'commodity':[{'sym':'GC=F','name':'GOLD','flag':'🥇'},{'sym':'SI=F','name':'SILVER','flag':'🥈'},{'sym':'CL=F','name':'CRUDE OIL','flag':'🛢️'},{'sym':'INR=X','name':'USD/INR','flag':'💱'}],
    'crypto':[{'sym':'BTC-USD','name':'BITCOIN','flag':'₿'},{'sym':'ETH-USD','name':'ETHEREUM','flag':'Ξ'},{'sym':'SOL-USD','name':'SOLANA','flag':'◎'},{'sym':'BNB-USD','name':'BNB','flag':'🔶'},{'sym':'XRP-USD','name':'XRP','flag':'✕'}],
}
CURRENCIES = ['USD','EUR','GBP','INR','JPY','AUD','CAD','CHF','CNY','SGD','HKD','KRW','BRL','ZAR','AED','SAR']
