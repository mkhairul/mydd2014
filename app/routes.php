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
	return View::make('mainpage');
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
	//echo $param_str;
	//return $session;

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
});