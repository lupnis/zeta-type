import hashlib
import pandas as pd
user_list = {
    'test':'eb5637cef0d0ba8a35a8091116d07561'
}

tokens = {}
article = {
    "article_data":'./article_data.txt',
    "total_time":120
}


scores = pd.DataFrame()

def generate_token(uid):
    return hashlib.md5(str(uid).encode('utf-8')).hexdigest()