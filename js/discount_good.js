(function($){
$( function () {

var Discount_good = function () {

	this.default_options = {
		i: true,
		max: 0,
		min: 0,
		t: 'percent',
		v: 0,
	};

	this.vm = {

		discount_types: [
			{ id: 'percent', name: 'Скидка процентом' },
			{ id: 'sum', name: 'Скидка суммой' },
		],

		discount_info: function( rule ) {

			return 'test';
		},

		remove_discount: function( rule, e ) {

			e.stopPropagation();
			e.preventDefault();

			rule.data.i( 0 );
			rule.data.v( 0 );
			rule.data.min( '—' );
			rule.data.max( '—' )

			return false;
		},

		// при смене опции "наследовать настройки";
		on_inherit_change: function( rule ) {

			var i = rule.data.i(),
				rule_id, data;

			rule_id = rule.id()

			if ( !i ) {
				/*data = this.catalog_data[ rule_id ];
				rule.data.min( data.min );
				rule.data.max( data.max );*/
				rule.data.min( '—' );
				rule.data.max( '—' );
				return;
			}

			if ( this.catalogs ) {
				//this.on_catalog_change.bind( this )();
				data = this.catalog_data[ rule_id ];
				rule.data.t( data.t );
				rule.data.v( data.v );
			} else {
				rule.data.t( rule.discount_type() );
				rule.data.v( rule.discount_value() );
			}

			rule.data.min( data.min );
			rule.data.max( data.max );
		},

		on_catalog_change: function() {

			var rules = this.rules(),
				i, data;

			for (var i = rules.length - 1; i >= 0; i--) {


				if ( rules[i].data.i() ) {
					data = this.catalog_data[ rules[i].id() ];
					rules[i].data.t( data.t );
					rules[i].data.v( data.v );
					rules[i].data.min( data.min );
					rules[i].data.max( data.max );
				}
			};
		},
	};

	this.on_catalog_change_success = function( data_str ) {

		var self = this,
			data;

		try { data = JSON.parse( data_str ); } catch(e) {};
		if ( !$.isPlainObject( data ) ) {
			console.log( data_str );
			return;
		}
		
		self.vm.catalog_data = data;
		self.vm.on_catalog_change.bind( self.vm )();
	}.bind( this );

	this.on_catalog_change = function( elem ) {

		var self = this,
			tid,
			data, rules, rule;

		if ( elem ) {
			tid = elem.find('select').val();
		}

		// каталоги не используются либо каталог не выбран;
		// брать опции по умолчанию из правил;
		if ( !self.vm.catalogs || tid == '_none' ) {

			data = {};
			rules = self.vm.rules();
	    	for (var i = rules.length - 1; i >= 0; i--) {
	    		rule = rules[i];
	    		data[ rule.id() ] = {
	    			t: rule.discount_type(),
	    			v: rule.discount_value(),
	    			min: 0,
	    			max: 0
	    		};
	    	};
	
			data = JSON.stringify( data );
			self.on_catalog_change_success( data );
			return;
		}

		// получить данные выбранного каталога;
		$.ajax({
			url: self.base_path + '/coupon_catalog_options/' + tid,
			type: 'GET',
			success: function( data ) {
				self.on_catalog_change_success( data );
			}
		})
	}.bind( this );

    this._process_data = function ( dataObj, parent, parent_name ) {
        if(dataObj == null){
            dataObj = parent[parent_name];
        }

        var wrappedData;
        if ($.isArray(dataObj)) {

            var bufArray = [];
            for (var i = 0; i < dataObj.length; i++) {
                bufArray[i] = this._process_data
                	.bind(this)(null,dataObj,i );
            }
            wrappedData = ko.observableArray(bufArray);

        } else if ($.isPlainObject(dataObj)) {

            var bufObj = {};
            for (var name in dataObj) {
                if (dataObj.hasOwnProperty(name)) {
                    bufObj[name] = this._process_data
                    	.bind(this)(null,dataObj,name);
                }
            }
            wrappedData = bufObj;

        } else {
            var bufObj = ko.observable(dataObj);
            wrappedData = bufObj;
        }
        return wrappedData;
    };

    this.on_save = function( e ) {

    	var self = this,
    		vm,
    		data = {},
    		rule;

    	vm = ko.toJS( self.vm );
    	//console.log( vm );
    	for (var i = vm.rules.length - 1; i >= 0; i--) {
    		rule = vm.rules[i];
    		data[ rule.id ] = rule.data;
    	};

    	data = JSON.stringify( data );
    	$('.field-name-coupon-data textarea').html( data );
    	//console.log( data );

    	//e.stopPropagation();
    	//e.preventDefault();

    }.bind( this );

	this.init = function() {
		
		var self = this,
			data_elem = $('#coupon-data'),
			container_markup = '<div id="coupon-options-container"></div>',
			catalog_field_name,
			selector, field,
			good_data,
			actions,
			id,
			catalog_options,
			container,
			rule_id,
			parsed_good_data;

		if ( !data_elem.length ) {
			return;
		}

		// базовый url сайта;
		self.base_path = data_elem.data('base-path');

		// список акций;
		actions = data_elem.data('actions');
		actions = decodeURIComponent( actions );
		try { actions = JSON.parse( actions ); } catch(e) {};
		if ( !$.isArray( actions ) ) {
			return;
		}

		// если есть поле "каталог", получать данные каталога при смене его 
		// значения; редактирование акций добавить после поля каталога;
		catalog_field_name = data_elem.data('catalog-field-selector');
		if ( catalog_field_name ) {

			self.vm.catalogs = 1;
			selector = '.field-name-' + catalog_field_name;
			
			$( selector ).change( function( e ) {

				var elem = $(this);
				self.on_catalog_change( elem );
			}).after( container_markup );
		} else {

			// если нет каталогов, добавить настройки акций после описания;
			$('.field-type-text-with-summary').append( container_markup );
			self.vm.catalogs = 0;
		}

		container = $('#coupon-options-container');
		if ( !container.length ) {
			return;
		}

		// получить данные товара из соотв. поля на форме;
		good_data = $('.field-name-coupon-data textarea').html();
		try { good_data = JSON.parse( good_data ); } catch(e) {};
		if ( !$.isPlainObject( good_data ) ) {
			good_data = {};
		}

		// для всех акций у товара должны быть настройки;
		parsed_actions = {};
		for (var i = 0; i < actions.length; i++) {
			id = actions[i].id;
			if ( !good_data[ id ] ) {
				good_data[ id ] = self.default_options;
			}

			parsed_actions[ id ] = actions[i];
		};

		// преобразовать good_data для knockout;
		parsed_good_data = [];

		for ( var rule_id in good_data ) {
			if ( parsed_actions[ rule_id ] ) {
			    parsed_good_data.push({
			    	id: rule_id,
					title: parsed_actions[ rule_id ].title,
					discount_type: parsed_actions[ rule_id ].discount_type,
					discount_value: parsed_actions[ rule_id ].discount_value,
			    	data: good_data[ rule_id ],
			    });
			}
		}

		self.vm.rules = this._process_data( parsed_good_data );

		//console.log( catalog_options );
		//console.log( parsed_good_data );

		// перед сохранением формы записывать данные вьюмодели в соотв. поле;
		$('.form-actions input#edit-submit').click( self.on_save );

		// инициализировать данные товара;
		if ( catalog_field_name ) {
			$( selector ).trigger('change')
		} else {
			self.on_catalog_change();
		}

	    ko.renderTemplate('coupon-good-template', self.vm, 
	    	{templateEngine: ko.nativeTemplateEngine.instance}, 
	    	container.get(0) );
	}
};	

Drupal.coupon = Drupal.coupon || {};
Drupal.coupon.discount_good = new Discount_good();
Drupal.coupon.discount_good.init();

});

})(jQuery);