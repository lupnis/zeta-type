from datetime import date, datetime
import flask
from flask import Flask, render_template
from gevent import pywsgi as wsgi
import json

import db


def webApp():
    app = Flask(__name__)
    app.config['HOST'] = 'localhost'
    app.config['PORT'] = '2333'
    app.config['RESTPLUS_MASK_SWAGGER'] = False     
    
    @app.route('/')
    @app.route('/login')
    def login():
        return render_template('login.html')
    
    
    @app.route('/account/do_sign_in',methods=['POST'])
    @app.route('/do_sign_in')
    def verify_signin():
        uid, pwd, sub = flask.request.form.get('uid'),flask.request.form.get('pwd'),flask.request.form.get('sub')
        if db.user_list.get(uid) is not None and db.user_list[uid] == pwd:
            gen = db.generate_token(str(uid) + str(datetime.timestamp))
            db.tokens[gen]=str(uid);
            return {'token':str(gen)},200
        else:
            return {'err_tag':'WRONG USERNAME OR PASSWORD'},401
    
    
    @app.route('/typing',methods=['GET'])
    def typing():
        token = flask.request.args.get('token')
        if db.tokens.get(str(token)) is not None:
            return render_template('type.html')
        return login()
    
    
    @app.route('/get_article',methods=['GET'])
    def get_article():
        token = flask.request.args.get('token')
        if db.tokens.get(str(token)) is not None:
            f = open('./article_data.txt','r',encoding='utf-8')
            db.article['article_data'] = ''.join(f.readlines())
            f.close()
            return db.article,200
    
    @app.route('/submit',methods=['POST'])
    def submit_data():
        token, wpm, time_left, mistakes = flask.request.form.get('token'),flask.request.form.get('wpm'),flask.request.form.get('time_left'),flask.request.form.get('mistakes')
        if db.tokens.get(str(token)) is  None:
            return {'err_tag':'ACCOUNT TOKEN ERROR'},401
        db.scores=db.scores.drop(index=db.scores.index)
        db.scores = db.scores.append([[str(datetime.now()),db.tokens[str(token)],wpm,mistakes,time_left]],ignore_index=True)
        db.scores.to_csv('statistics.csv',mode='a', header=False, index=None,columns=None)
        return {'message':'ok'},200
        
    
    
    
    return app
    


if __name__ == "__main__":
    appli =  webApp()
    print("running service at http://127.0.0.1:2333")
    server = wsgi.WSGIServer(('0.0.0.0', 2333), appli)
    server.serve_forever()
    


