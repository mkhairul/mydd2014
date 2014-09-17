<?php

class UserController extends BaseController {

  public function changeName()
  {
      $name = Input::get('name');
      $uid = Session::get('uid');
      $user = Users::where('uid', $uid)->first();
      if($user)
      {
          $user->username = $name;
          $user->save();

          return json_encode(array('status' => 'success'));
      }
      else
      {
          return json_encode(array('status' => 'failed'));
      }
  }

}
