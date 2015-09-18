<?php

/**
* enable robokassa
*/
function coupon_uc_payment_method()
{
  /*$block = module_invoke('block', 'block_view', '28');
  $title = $block['content'];*/
  $title = 'Оплата через Robokassa';

  $methods['robo'] = array(
    'name'      => t('Оплата через Robokassa'),
    'title'     => $title,
    'desc'      => t('Оплата через Robokassa'),
    'callback'  => 'coupon_uc_payment_method_robo',
    'weight'    => 3,
    'checkout'  => FALSE,
    'no_gateway'=> TRUE,
  );
  return $methods;
}


function coupon_uc_payment_method_robo($op, & $order, $form = NULL, $form_state = NULL) {

	switch ($op) {
		
		case 'order-view': /* просматривает админ */
		
			$result = db_query('SELECT * FROM {uc_payment_robo} WHERE order_id = :id ', array(':id'=> $order->order_id));
			$data         = $result->fetchObject();
			$payment_robo = robokassa_api('load', $data->robo_id);

			if ( isset($payment_robo['enrolled']) 
				&& $payment_robo['enrolled'] != '' 
				&& $payment_robo['enrolled'] != 0) {

				$build['#markup'] = ' Оплачен. id платежа '. $data->robo_id;
			} else { 
				$build['#markup'] = ' Ожидает оплаты. id платежа '
					. $data->robo_id;
			}

			return $build;
		case 'customer-view':/* просматривает клиент */

			$build = array();
			$result = db_query('SELECT * FROM {uc_payment_robo} WHERE order_id = :id ', array(':id'=> $order->order_id));
			$data         = $result->fetchObject();
			$payment_robo = robokassa_api('load', array('pid'=>$data->robo_id));

			if ( isset($payment_robo['enrolled']) 
				&& $payment_robo['enrolled'] != '' 
				&& $payment_robo['enrolled'] != 0) {
				
				$build['#markup'] = ' Оплачен';
			} else {
				$build['#markup'] = '<b>Ожидает оплаты</b> '.l('Оплатить через сервис Robokassa','robokassa/payment/'.$data->robo_id);
			}

			return $build;
		case 'cart-review': /* при просмотре перед отправкой */

			global $user;

			if ( isset( $_SESSION['bonus'] ) ) {
				
				$bonus = $_SESSION['bonus'];
				$bonus = intval( $bonus );
				unset( $_SESSION['bonus'] );
			} else {
				$bonus = 0;
			}
			
			$total = $order->order_total - $bonus;

			$params = array(
				'uid'          => $user->uid,// владелец платежа, как правило пользователь, который его создал
				'created'=> time(),// не обязательно, время создания платежа
				'amount'=> $total,// сумма
				'currency'=> 'RUR',// ID валюты
				'memo'=> 'Оплата товара виртульной валютой. Заказа: '.$order->order_id,
				'payee_account'=> $order->order_id,
			);
			$result = robokassa_api('insert', $params);

			db_merge('uc_payment_robo')
				->key( array( 'order_id'=> $order->order_id, ))
				->fields( array( 'robo_id'=> $result['pid'], ))
				->execute();

			$review[] = array('title'=> 'Оплата','data' => 'Оформив заказ, Вы сможете найти его в личном кабинете на вкладке "Заказы". Для оплаты заказа перейдите по ссылке "Оплатить через сервис Robokassa" на странице заказа.');

			return $review;
		case 'order-delete':

			db_delete('uc_payment_robo')
			->condition('order_id', $order->order_id)
			->execute();
			break;
	}
}

// при успешной оплате изменить статус заказа;
function coupon_payment_accepted_callback() {

	global $base_path;
	drupal_add_http_header('Content-type', 'text/html; charset=iso-8859-1');

	// check url
	$url = trim($_SERVER['REQUEST_URI'], '/');
	$pos = strpos( $url, '?' );

	if ( $pos !== false ) {
		$url = substr( $url, 0, $pos );
	}

	$alias = trim($base_path . drupal_get_path_alias('robokassa/status'), '/');
	
	if ($url != $alias) {
		watchdog('Robokassa', 'Wrong Result URL accessed "%url"', array("%url" => $url), WATCHDOG_WARNING);
		notify('bad sign');
		die("bad sign");
	}

	$created = time();
	$out_summ = $_REQUEST["OutSum"];
	$inv_id = $_REQUEST["InvId"];
	$crc = strtoupper($_REQUEST["SignatureValue"]);
	$my_crc = strtoupper(md5("$out_summ:$inv_id:" . variable_get('robokassa_secretkey2', '')));

	if ($my_crc != $crc || !preg_match("/^[0-9]{1,10}$/", $_REQUEST["InvId"])) {
		watchdog('Robokassa', 'Bad sign, vars "%vars"', array("%vars" => print_r($_REQUEST,TRUE)), WATCHDOG_ALERT);    
		notify('bad sign');
		die("bad sign\n");
	}

	$payment = _robokassa_pid_load($_REQUEST["InvId"]);
	
	if (!is_array($payment)) {
		watchdog('Robokassa', 'Bad invId, vars "%vars"', array("%vars" => print_r($_REQUEST,TRUE)), WATCHDOG_ALERT);
		notify('bad InvId');
		die("bad InvId\n");
	}

	// check if payment already enrolled
	if ($payment['enrolled'] > 0) {
		watchdog('Robokassa', 'Order InvID %invid already enrolled', array("%invid" => $_REQUEST['InvId']), WATCHDOG_WARNING);
		notify('bad sign');
		die("bad sign\n");
	}

	if ($_REQUEST["OutSum"] == round($payment['amount'], 2)) {
	
		_robokassa_enrollpayment($payment['pid'], $created);
		// поменять статус заказа на "оплачено";
		notify('is about to...');
		$res = db_query( "select order_id from uc_payment_robo where robo_id=" . $inv_id );
		if ( $row = $res->fetchAssoc() ) {

			require_once DRUPAL_ROOT . '/' . drupal_get_path('module', 'uc_order') . "/uc_order.module";
			uc_order_update_status( $row['order_id'], 'payment_received' );
		}

		die("OK$inv_id\n");
	} else { // you can also save invalid payments for debug purposes
	
		watchdog('Robokassa', 
			"Can't process order InvID %invid, vars '%vars'", 
			array(
				"%invid" => $_REQUEST['InvId'],
				'%vars' => print_r($_REQUEST,TRUE)
				),
			WATCHDOG_ERROR );
		
		die();
	}
}