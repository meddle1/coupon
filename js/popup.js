jQuery(function() {
    jQuery( "#coupon-dialog" ).dialog({
    	autoOpen: false,
    });

    jQuery('a.coupon-info').click( function( e ){

    	jQuery( "#coupon-dialog" ).dialog('open');
    	e.stopPropagation();
    	e.preventDefault();
    });
});