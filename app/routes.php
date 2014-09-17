<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/

use PhpAmqpLib\Connection\AMQPConnection;
use PhpAmqpLib\Message\AMQPMessage;

Route::get('/', function()
{
		// Simple identification because not enough time to implement it.
		// Check if user already have a session
		$uid = Session::get('uid');
		if(!$uid){
				// Generate UID & Username
				$uid = uniqid();
				$username = 'Anon';
				Session::put('uid', $uid);
				Session::put('username', $username);

				// Save the uid and username in db with the browser info.
				$user = new Users;
				$user->uid = $uid;
				$user->username = 'Anon';
				$user->save();
		}
		else
		{
				$username = Session::get('username');
		}

		return View::make('mainpage', array('uid' => $uid, 'username' => $username));
});

Route::match(array('POST'), '/api/changeName', array('uses' => 'UserController@changeName'));
Route::match(array('GET'), '/refresh', function(){
		Session::forget('uid');
		return Redirect::to('/');
});

Route::match(array('GET'), '/janus/{session?}', function($session=''){
		$request = Request::instance();
		$content = $request->getContent();

		$param = Input::all();
		$param_str = '';
		foreach($param as $key => $val){
				$param_str .= $key . '=' . $val . '&';
		}
		$param_str = rtrim($param_str, '&');

		$url = "http://192.168.1.155:8088/janus/$session?$param_str";
		$ch = curl_init();

		//set the url
		curl_setopt($ch,CURLOPT_URL, $url);
		$result = curl_exec($ch);
		//close connection
		curl_close($ch);
});

Route::match(array('POST'), '/janus/{param?}/{handle?}', function($param='', $handle=''){
		$url = 'http://192.168.1.155:8088/janus';
		if($param)
		{
				$url = $url . "/$param";
		}
		if($handle)
		{
				$url = $url . "/$handle";
		}
		$request = Request::instance();
		$content = $request->getContent();
		$ch = curl_init();
		//set the url, POST data
		curl_setopt($ch,CURLOPT_URL, $url);
		curl_setopt($ch,CURLOPT_POSTFIELDS, $content);

		//execute post
		$result = curl_exec($ch);

		//close connection
		curl_close($ch);

		// Save the broadcast session in DB
		// $payload = json_decode($content, true);
		// $broadcast = new Broadcast;
});

Route::get('/sendmessage', function(){
		$exchange = 'notification';
		$queue = 'msgs';

		$conn = new AMQPConnection('localhost', '5672', 'guest', 'guest', '/');
		$ch = $conn->channel();
		$ch->queue_declare($queue, false, false, false, true);
		$ch->exchange_declare($exchange, 'fanout', false, false, true);
		$ch->queue_bind($queue, $exchange);

		$msg_body = 'woot';
		$msg = new AMQPMessage($msg_body, array('content_type' => 'text/plain'));
		$ch->basic_publish($msg, $exchange);

		$ch->close();
		$conn->close();
});
