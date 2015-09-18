(function($){
$( function () {

var Discount = function () {

	var self = this;

	this.vm = {

		price_obj: self,
		rule: 0,
		rule_id: -1,

		discount_types: [
			{ id: 'percent', name: 'Скидка процентом' },
			{ id: 'sum', name: 'Скидка суммой' },
		],

		default_options: function() {
			
			return {
				'i': ko.observable(1),
				't': ko.observable('sum'),
				'v': ko.observable(0),
				'min': ko.observable(0),
				'max': ko.observable(0),
			};
    	},

    	catalog_prefix: function( level ) {

    		var i = 1,
    			res = '';

    		while ( i < level ) { 
    			res += '—';
    			i++;
    		}

    		return res;
    	},

    	select_rule: function() {

    		var container, // = self.container.find('.rule-wrapper'),
    			rule_id = this.rule,
    			rules = this.rules(),
    			found = 0,
    			vm = this;

    		container = $('#coupon-discount-container1');
    		if ( !container.length ) {
    			return;
    		}

    		for (var i = 0; i < rules.length; i++) {
    			if ( rules[i].id() == rule_id ) {
    				//rule = rules[i];
		    		//console.log( rule_id );
		    		//console.log( vm.rule_id );
    				if ( vm.rule_id == i ) {
    					return;
    				}
    				vm.rule_id = i;
    				found = 1;
    				break;
    			}
    		};

    		if ( !found ) {
    			return;
    		}


    		//console.log( this.rule );
    		//container = container.get(0);
    		//ko.cleanNode( container );
		    ko.renderTemplate('coupon-rule-template', vm, 
		    	{templateEngine: ko.nativeTemplateEngine.instance}, 
		    	container.get(0) );
    	},

    	show_time_table: function() {

    		var container,
    			vm = this;

    		container = $('#coupon-discount-container1 .rule-data');
    		if ( !container.length ) {
    			return;
    		}

		    ko.renderTemplate('coupon-time-table-template', vm, 
		    	{templateEngine: ko.nativeTemplateEngine.instance}, 
		    	container.get(0) );
    	},

    	show_discounts: function() {

    		var container,
    			vm = this;

    		container = $('#coupon-discount-container1 .rule-data');
    		if ( !container.length ) {
    			return;
    		}

		    ko.renderTemplate('coupon-discounts-template', vm, 
		    	{templateEngine: ko.nativeTemplateEngine.instance}, 
		    	container.get(0) );
    	},

    	show_goods: function ( tid, rule_id ) {

    		var container,
    			vm = {
    				vm: this,
    				//goods: this.goods,
    				rule_id: rule_id,
    				tid: tid,
    			};

    		container = $('#coupon-discount-container1 .rule-data-goods');
    		if ( !container.length ) {
    			return;
    		}

		    ko.renderTemplate('coupon-goods-template', vm, 
		    	{templateEngine: ko.nativeTemplateEngine.instance}, 
		    	container.get(0) );	
    	},

    	// update catalog item when inherit option is toggled;
    	update_item: function( parent_tid, data, rule_id ) {

    		var vm = this,
    			rules,
    			rule,
    			options;

    		//console.log( parent_tid );
    		//console.log( this.terms[ parent_tid ] );

    		if ( !parent_tid ) {

				rules = this.rules();
				rule = 0;

				for (var i = 0; i < rules.length; i++) {
					if ( rules[i].id() == rule_id ) {
						rule = rules[i];
						break;
					}
				}

				if ( rule ) {

					this.terms[ data.tid ].parsed_data[ rule_id ].t( 
						rule.discount_type() );
					this.terms[ data.tid ].parsed_data[ rule_id ].v( 
						rule.discount_value() );
					this.terms[ data.tid ].parsed_data[ rule_id ].min( 
						rule.min_good_price() );
					this.terms[ data.tid ].parsed_data[ rule_id ].max( 
						rule.max_good_price() );
				}
    		} else {

    			options = this.terms[ parent_tid ].parsed_data[ rule_id ];
    			options = ko.toJS( options );
    			if ( data.tid ) {

					this.terms[ data.tid ].parsed_data[ rule_id ].t( options.t );
					this.terms[ data.tid ].parsed_data[ rule_id ].v( options.v );
					this.terms[ data.tid ].parsed_data[ rule_id ].min( options.min );
					this.terms[ data.tid ].parsed_data[ rule_id ].max( options.max );
    			} else {

					data.parsed_data[ rule_id ].t( options.t );
					data.parsed_data[ rule_id ].v( options.v );
					data.parsed_data[ rule_id ].min( options.min );
					data.parsed_data[ rule_id ].max( options.max );
    			}
    		}

    		this.update_children.bind( this, data, rule_id )();
    	},

    	// update children when inherit is on;
    	update_children: function( data, rule_id ) {
    		
    		//console.log( data );
    		//this.terms[ data.tid ].parsed_data[ rule_id ]
    		var parse_goods;

    		parse_goods = function ( tid, rule_id, options ) {

    			var goods = this.goods[ tid ],
    				child_options;

    			if ( !goods ) {
    				return;
    			}

    			for ( i = goods.length - 1; i >= 0; i--) {

    				child_options = goods[i].parsed_data[ rule_id ];

        			if ( child_options && child_options.i() ) {
        				child_options.t( options.t );
        				child_options.v( options.v );
        				child_options.min( options.min );
        				child_options.max( options.max );
        			}
    			}
    		}.bind( this );
        	
        	function parse_children( item, rule_id, options, parse_goods ) {

        		var i, tid, child_options, decoded;


	        	if ( item.children ) {

	        		for ( i = item.children.length - 1; i >= 0; i--) {
	
		        		tid = item.children[i].tid;
		        		if ( this.terms[ tid ] ) {
		        			child_options = this.terms[ tid ].parsed_data[ rule_id ];
		        			if ( child_options && child_options.i() ) {
		        				child_options.t( options.t );
		        				child_options.v( options.v );
		        				child_options.min( options.min );
		        				child_options.max( options.max );
		
				        		decoded = ko.toJS( child_options );
				        		parse_goods( tid, rule_id, decoded );
			        			parse_children.bind( this, item.children[i], 
			        				rule_id, decoded, parse_goods )();
		        			}
		        		}
	        		};
	        	};
        	};

        	if ( data.tid ) {
	        	options = this.terms[ data.tid ].parsed_data[ rule_id ];
        	} else {
        		options = data.options;
        	}
        	
        	options = ko.toJS( options );
        	parse_goods( data.tid, rule_id, options )
        	parse_children.bind( this, data, rule_id, options, parse_goods )();
    		//data
    	},

		toggle_block: function( vm, e ) {

			var elem = $(e.target),
				days = $( e.target ).next();

			days.slideToggle(200);
			e.stopPropagation();
			e.preventDefault();

			if ( elem.html() == 'Показать' ) {
				elem.html('Скрыть');
			} else {
				elem.html('Показать');
			};
		},

		/*add_terms: function( rule_id, destination, source, level ) {

			var i, term, data;

			for ( i = 0; i < source.length; i++) {
				term = {};
				term.tid = source[i].tid;
				term.name = source[i].name;
				term.level = level;
				term.children = [];

				if ( source[i].children.length ) {
					this.add_terms.bind( this, rule_id, term.children, 
						source[i].children, level + 1 )();
				}

				term.options = {
					inherit_discount: 1,
					discount_type: 'percent',
					discount_value: 0,
					discount_value: 0,
					min_good_price: 0,
					max_good_price: 0,			
				};

				destination.push( term );
			};
		},*/

		add_rule: function() {

			var rule = {
				id: ++this.max_id,
				title: 'Новая акция',
				descr: '',
				from: 0,
				to: 0,
				days: [
					{
						name: 'Пон',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Вт',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Ср',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Чт',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Пт',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Сб',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
					{
						name: 'Вск',
						enabled: 0,
						hours: [
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
							{ enabled: 0 },
						]
					},
				],
				discount_type: 'percent',
				discount_value: 0,
				min_good_price: 0,
				max_good_price: 0,
			}, d = new Date();

			d.setHours(0,0,0,0);
			d = +d;
			rule.from = d;
			rule.to = d;

			//rule.terms = [];
			//this.add_terms( rule.id, rule.terms, this.terms, 1 );
			//console.log( rule );
			//console.log( this.terms );

			for ( var tid in this.goods ) {
			    for (var i = 0; i < this.goods[ tid ].length; i++) {
			    	this.goods[ tid ][i].parsed_data[ rule.id ] 
			    		= this.default_options();
			    	/*this.goods[ tid ][i].parsed_data[ rule.id ] = {
						'i': ko.observable(1),
						't': 'sum',
						'v': 0,
						'min': 0,
						'max': 0,
			    	}*/
			    };
			}

			for ( var tid in this.terms ) {
		    	this.terms[ tid ].parsed_data[ rule.id ]
		    		= this.default_options();
		    	/*this.terms[ tid ].parsed_data[ rule.id ] = {
					'i': ko.observable(1),
					't': 'sum',
					'v': 0,
					'min': 0,
					'max': 0,
		    	}*/
			}

			rule = this.price_obj._process_data( rule );
			this.rules.push( rule );
		},

		remove_rule: function( id ) {

            if ( confirm('Удалить акцию?') ) {
                this.rules.remove( function( rule ) {
                    return rule.id() == id;
                });
            }
		},

        save: function() {
        	
        	//return;
        	var rules = ko.toJS( this.rules ),
        		terms = ko.toJS( this.terms ),
        		term_tree = ko.toJS( this.term_tree ),
        		goods = ko.toJS( this.goods );
        	
        	rules = JSON.stringify( rules );
        	term_tree = JSON.stringify( term_tree );
        	terms = JSON.stringify( terms );
        	goods = JSON.stringify( goods );
        	//console.log( rules );
        	//return;
        	$.ajax({
        		url: '/coupon/coupon_discount_save',
        		type: 'POST',
        		data: {
        			rules: rules,
        			term_tree: term_tree,
        			terms: terms,
        			goods: goods,
        		},
        		success: function( data ) {
        			if ( data == '1' ) {
        				alert( Drupal.t('Сохранено') );
        				return;
        			}
        			alert( Drupal.t('Не удалось сохранить данные: ') + data);
        		}
        	})
        },

		/*test: function( root, parent ) {
			console.log( root );
			console.log( parent );
		}*/
	};

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

	this.on_get_data_error = function( err ) {

		self.container.html('Не удалось загрузить данные.');
		if ( err ) {
			console.log( err );
		}
	}.bind( self );

	this.init_goods = function ( terms, rule_ids ) {

		var i, j;

		for ( i = terms.length - 1; i >= 0; i--) {

			//terms[i].goods;
			for ( j = terms[i].goods - 1; j >= 0; j--) {

				for ( k = rule_ids.length - 1; rule_ids >= 0; rule_ids--) {
					if ( !terms[i].goods[j].data[k] ) {
						terms[i].goods[j].data[k] = {
							'i': 1,
							'type': 'sum',
							'value': '0',
						};
					}
				};
				self.init_goods( terms[i].children );
			};

		};
	}.bind( self ),

	this.on_get_data = function ( data_str ) {

		var self = this,
			data, coupon_actions, i, ids, max_id, id, rule_ids;

		try { data = JSON.parse( data_str ); } catch(e) {};
		if ( !$.isPlainObject( data ) ) {
		//if ( !$.isArray( data ) ) {
			this.on_get_data_error('data is not an object');
			//console.log('data is not an object');
			console.log( data_str );
			return;
		}

		if ( data['error'] ) {
			self.container.html( data['error'] );
			return;
		}

		try { coupon_actions = JSON.parse( data['coupon_actions'] ) } catch(e) {};
		if ( !$.isArray( coupon_actions ) ) {
			this.on_get_data_error('coupon actions is not an array');
			//console.log('coupon actions is not an array');
			console.log( data['coupon_actions'] );
			return;
		}

		data['coupon_actions'] = coupon_actions;

		max_id = 0;
		rule_ids = [];
		for ( i = 0; i < coupon_actions.length; i++ ) {
			id = coupon_actions[i].id;
			rule_ids.push( id );
			if ( id > max_id ) {
				max_id = id;
			}
		};

		// распарсить данные товаров;
		for( tid in data.goods ) {
		    for ( i = data.goods[ tid ].length - 1; i >= 0; i--) {

		    	data.goods[ tid ][i].parsed_data 
		    		= JSON.parse( data.goods[ tid ][i].data );
		    	delete data.goods[ tid ][i].data;
	
		    	for ( id in data.goods[ tid ][i].parsed_data ) {

		    		data.goods[ tid ][i].parsed_data[ id ] 
		    			= self._process_data( data.goods[ tid ][i].parsed_data[ id ] );

		    	    /*data.goods[ tid ][i].parsed_data[ id ].i
		    	    	= ko.observable( data.goods[ tid ][i].parsed_data[ id ].i );*/
		    	}

		    	for (var j = rule_ids.length - 1; j >= 0; j--) {
		    		
		    		id = rule_ids[j];
		    		
		    		if ( !data.goods[ tid ][i].parsed_data[ id ] ) {
		    			data.goods[ tid ][i].parsed_data[ id ]
		    				= self.vm.default_options();
		    		}
		    	};
		    };
		}

		// распарсить данные каталогов;
		if ( data.terms !== 'plain' ) {

			for( tid in data.terms ) {

		    	data.terms[ tid ].parsed_data 
		    		= JSON.parse( data.terms[ tid ].data );
		    	delete data.terms[ tid ].data;

		    	for( id in data.terms[ tid ].parsed_data ) {

		    		data.terms[ tid ].parsed_data[ id ] 
		    			= self._process_data( data.terms[ tid ].parsed_data[ id ] );
		    	    /*data.terms[ tid ].parsed_data[ id ].i
		    	    	= ko.observable( data.terms[ tid ].parsed_data[ id ].i );
		    	    data.terms[ tid ].parsed_data[ id ].v
		    	    	= ko.observable( data.terms[ tid ].parsed_data[ id ].v );
		    	    data.terms[ tid ].parsed_data[ id ].t
		    	    	= ko.observable( data.terms[ tid ].parsed_data[ id ].t );
		    	    data.terms[ tid ].parsed_data[ id ].min
		    	    	= ko.observable( data.terms[ tid ].parsed_data[ id ].min );
		    	    data.terms[ tid ].parsed_data[ id ].max
		    	    	= ko.observable( data.terms[ tid ].parsed_data[ id ].max );*/
		    	}

		    	for (var j = rule_ids.length - 1; j >= 0; j--) {
		    		
		    		id = rule_ids[j];
		    		
		    		if ( !data.terms[ tid ].parsed_data[ id ] ) {
		    			data.terms[ tid ].parsed_data[ id ]
		    				= self.vm.default_options();
		    		}
		    	};	    	
			}
		}
		//return;

		console.log( data );

		this.vm.rules = self._process_data( coupon_actions );
		this.vm.term_tree = data.term_tree;
		this.vm.terms = data.terms;
		this.vm.goods = data.goods;
		this.vm.max_id = max_id;

	    ko.renderTemplate('coupon-discount-template', this.vm, 
	    	{templateEngine: ko.nativeTemplateEngine.instance}, 
	    	self.container.get(0) );
	}.bind( self );

	this.get_data = function () {
		
		var self = this;

		self.container.html('Загружаю...');

		$.ajax({
			url: '/coupon/coupon_discount_data',
			success: self.on_get_data,
			error: self.on_get_data_error,
		});
	};

	this.init = function () {

		var self = this;
		
    	self.container = $('#coupon-discount-container');
    	if ( !self.container.length ) {
    		return;
    	}

		self.get_data();
	}
};

Drupal.coupon = Drupal.coupon || {};
Drupal.coupon.discount = new Discount();
Drupal.coupon.discount.init();

});

ko.bindingHandlers.rangeDatePicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {

    	var elem = $(element),
    		from = new Date( valueAccessor().from() ),
    		to = new Date( valueAccessor().to() );

        set_from = function( date ) {
        	this.from( +date );
        }.bind( valueAccessor() );

        set_to = function( date ) {
        	this.to( +date );
        }.bind( valueAccessor() );

        elem.html('<input class="from" type="text" /><span> по <span><input class="to" type="text" />');

		elem.find( ".from" ).datepicker({
			dateFormat: "dd.mm.yy", 
			monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
				'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
			dayNamesMin: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
			prevText: 'Предыдущий',
			nextText: 'Следующий',
			defaultDate: "+1w",
			changeMonth: true,
			numberOfMonths: 3,
			onClose: function( selectedDate ) {

				var elem = $(this),
					date = elem.datepicker('getDate');

				set_from( date );
				elem.parent().find('.to')
					.datepicker( "option", "minDate", selectedDate );
			}
		}).datepicker( "setDate", from )
		.datepicker( 'option', "maxDate", to );

		elem.find( ".to" ).datepicker({
			dateFormat: "dd.mm.yy", 
			monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
				'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
			dayNamesMin: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
			prevText: 'Предыдущий',
			nextText: 'Следующий',
			defaultDate: "+1w",
			changeMonth: true,
			numberOfMonths: 3,
			onClose: function( selectedDate ) {

				var elem = $(this),
					date = elem.datepicker('getDate');

				set_to( date );
				elem.parent().find('.from')
					.datepicker( "option", "maxDate", selectedDate );
			}
		}).datepicker( "setDate", to )
		.datepicker( 'option', "minDate", from );
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    }
}
/*
ko.bindingHandlers.parent_val = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {

    	var elem = $(element),
    		tid = viewModel.tid,
    		on_change;
        //elem.val();
        //console.log('init');
        on_change = function( elem, value, vm ) {

        	function parse_children( item, new_val, rule_id, terms ) {

        		var i, tid, child_data;

	        	if ( item.children ) {

	        		for ( i = item.children.length - 1; i >= 0; i--) {
	
		        		tid = item.children[i].tid;
		        		if ( terms[ tid ] ) {
		        			child_data = terms[ tid ].parsed_data[ rule_id ];
		        			if ( child_data && child_data.i() ) {

		        			}
		        		}

	        			parse_children( item.children[i], new_val, rule_id, terms );
	        		};
	        	};
        	}

        	var new_val = elem.val(),
        		options = elem.parent().parent();

        	//value.val( new_val );
        	new_val = {
	        	t: options.find('.term-discount-type select').val(),
        		v: options.find('.term-discount-value input').val(),
	        	min.find('.term-min-good-price input').val(),
	        	max.find('.term-max-good-price input').val(),
        	}

			parse_children( viewModel, new_val, value.rule_id, value.terms );

        }.bind( this, elem, valueAccessor(), viewModel );

        elem.val( valueAccessor().val() );
        elem.change( on_change );
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    	//console.log('update');
    }
}
*/
})(jQuery);
