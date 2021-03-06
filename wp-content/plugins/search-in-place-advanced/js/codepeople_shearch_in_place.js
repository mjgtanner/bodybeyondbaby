var codepeople_search_in_place_generator = function (){
	var $ = jQuery;
	if('undefined' != typeof codepeople_search_in_place_generator_flag) return;
	codepeople_search_in_place_generator_flag = true;

	var popup_is_visible = false,
		clickOnLink = function(evt)
		{
			var url = $(this).find('a').attr('href');
			switch (evt.which)
			{
				case 2:
					let _win = window.open(url, '_blank');
					_win.blur();
					window.focus();
				break;
				case 3:
					return;
				case 1:
				default:
					document.location = url;
			}
		},
		hideResultsPopUp = function()
		{
			if(
				popup_is_visible &&
				$('input[name="s"]:focus').length == 0 &&
				$('.search-in-place:hover').length == 0
			)
			{
				$('.search-in-place').hide();
				popup_is_visible = false;
			}
		},
		searchInPlace = function()
		{
			if(jQuery.fn.on){
				$(document).on('mouseover mouseout', '.search-in-place>.item', function(){$(this).toggleClass('active');})
						   .on('mousedown', '.search-in-place>.item', clickOnLink)
						   .on('mousedown', '.search-in-place>.label.more', clickOnLink);
			}else{
				$('.search-in-place>.item').live('mouseover mouseout', function(){$(this).toggleClass('active');})
										   .live('mousedown', clickOnLink)
										   .live('mousedown', clickOnLink);
			}
		};

	searchInPlace.prototype = {
		active : null,
		search : '',
		config:{
			min 		 : codepeople_search_in_place_advanced.char_number,
			image_width  : 50,
			image_height : 50,
			colors		 : ['#F4EFEC', '#B5DCE1', '#F4E0E9', '#D7E0B1', '#F4D9D0', '#D6CDC8', '#F4E3C9', '#CFDAF0'],
			areas		 : ['div.hentry', '#content', '#main', 'div.content', '#middle', '#container', '#wrapper', 'article']
		},

		autohide : function(){
			var me = this,
				selector = 'input[name="s"]';

			if(
				'own_only' in codepeople_search_in_place_advanced &&
				codepeople_search_in_place_advanced.own_only*1
			) selector += '[data-search-in-place]';

			$(document).on('input keyup focus', selector,
				function(evt){
					var s = $(this),
						v = s.val();
					s.attr('autocomplete', 'off');
					if(me.checkString(v)){
						setTimeout( function(){ me.getResults(s); }, 500 );
						popup_is_visible = true;
					}else{
						me.clearAutocomplete(s);
						$('.search-in-place').hide();
						popup_is_visible = false;
					}

					if(evt.type=='keyup' && evt.keyCode==39) me.fromAutocomplete(s);
				}
			);
			$(document).on('mouseover', ':not(.search-in-place, .search-in-place *)', function(){
				setTimeout(hideResultsPopUp, 150);
			});
			$(document).on('blur', 'input[name="s"]',function(){
				// Remove the autocomplete
				$('[name="cpsp-autocomplete"]').remove();
				setTimeout(hideResultsPopUp, 150);
			});
		},

		checkString : function(v){
			return this.config.min <= v.length;
		},

		getResults : function(e){
			if(e.val() == this.search){
				$('.search-in-place').show();
				return;
			}

			this.search = e.val();
			var me 	= this,
				o 	= e.offset(),
				p 	= {'s': me.search},
				s 	= $('<div class="search-in-place"></div>');

			// For wp_ajax
			p.action = "search_in_place";
			if('lang' in codepeople_search_in_place_advanced) p.lang = codepeople_search_in_place_advanced.lang;

			// Stop all search actions
			if(me.active) me.active.abort();

			// Remove results container inserted previously
			$('.search-in-place').remove();
			// Set the results container
			s.width(e.outerWidth()).css({'left' : o.left, 'top' : (parseInt(o.top) + e.outerHeight()+5)+'px'}).appendTo('body');
			me.displayLoading(s);

			me.active = jQuery.get( codepeople_search_in_place_advanced.root + 'admin-ajax.php', p, function(r){
				if('object' == typeof r)
				{
					if('result' in r)
					{
						me.displayResult(r['result'], s);
						me.removeLoading(r['result'], s);
					}

					if('autocomplete' in r && r['autocomplete'].length)
					{
						me.autocomplete(r['autocomplete'][0], e);
					}
					else
					{
						me.clearAutocomplete(e);
					}
				}
			}, "json");
		},

		autocomplete : function(o, e){
			function colorValues(color)
			{
				if (!color) return;
				if (color.toLowerCase() === 'transparent') return [0, 0, 0, 0];
				if (color[0] === '#')
				{
					if (color.length < 7) color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
					return [parseInt(color.substr(1, 2), 16),
							parseInt(color.substr(3, 2), 16),
							parseInt(color.substr(5, 2), 16),
							color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
				}
				if (color.indexOf('rgb') === -1)
				{
					var temp_elem = document.body.appendChild(document.createElement('fictum')),
						flag = 'rgb(1, 2, 3)';
					temp_elem.style.color = flag;
					if (temp_elem.style.color !== flag) return;
					temp_elem.style.color = color;
					if (temp_elem.style.color === flag || temp_elem.style.color === '') return;
					color = getComputedStyle(temp_elem).color;
					document.body.removeChild(temp_elem);
				}
				if (color.indexOf('rgb') === 0)
				{
					if (color.indexOf('rgba') === -1) color += ',1';
					return color.match(/[\.\d]+/g).map(function (a){ return +a });
				}
			};
			var b  = e.data('background-color') || e.css('background-color'),
				c  = colorValues(e.css('color')),
				n  = e.clone(),
				a  = {'position': 'absolute', 'background': b, 'border-color': 'transparent', 'box-shadow': 'none', 'zIndex': 1};

			n.removeAttr('placeholder').removeAttr('required');

			if(e.css('zIndex') == 'auto') e.css('zIndex', 10);
			if(e.css('position') == 'static') e.css('position', 'relative');
			e.data('background-color', b);

			if(c)
			{
				c[3] = 0.5;
				a['color'] = 'rgba('+c.join(',')+')';

			}

			$('[name="cpsp-autocomplete"]').remove();
			e.css('backgroundColor', 'transparent').after(n.attr('name', 'cpsp-autocomplete').val(o).css(a));
			n.width(e.width());
			n.offset(e.offset());
		},

		fromAutocomplete : function(e){
			var n = e.next('[name="cpsp-autocomplete"]');
			if(n.length && n.val().length) e.val(n.val());
		},

		clearAutocomplete: function(e){
			var n = e.next('[name="cpsp-autocomplete"]');
			if(n.length) n.val('');
		},

		displayResult : function(o, e){
			var me = this,
				s = '';

			for(var t in o){
				var item = o[t],
					l = o[t].items;

				if(item.label)
					s += '<div class="label">'+item.label+'</div>';

				for(var i=0, h = l.length; i < h; i++){
					s += '<div class="item">';
					if(l[i].thumbnail){
						s += '<div class="thumbnail"><img src="'+l[i].thumbnail+'" style="visibility:hidden;float:left;position:absolute;" /></div><div class="data" style="margin-left:'+(me.config.image_width+5)+'px;min-height:'+me.config.image_height+'px;">';
					}else{
						s += '<div class="data">';
					}

					s += '<span class="title"><a href="'+l[i].link+'">'+l[i].title+'</a></span>';
					if(l[i].resume) s += '<span class="resume">'+l[i].resume+'</span>';
					if(l[i].author) s += '<span class="author">'+l[i].author+'</span>';
					if(l[i].date) s += '<span class="date">'+l[i].date+'</span>';
					s += '</div></div>';
				}
			}

			e.prepend(s).find('.thumbnail img').on( 'load', function(){
				var size = me.imgSize(this);
				$(this).width(size.w).height(size.h).css('visibility', 'visible');
			});
		},

		imgSize : function(e){
			e = $(e);

			var w = e.width(),
				h = e.height(),
				nw, nh;

			if(w > this.config.image_width){
				nw = this.config.image_width;
				nh = nw/w*h;
				w = nw; h = nh;
			}

			if(h > this.config.image_height){
				nh = this.config.image_height;
				nw = nh/h*w;
				w = nw; h = nh;
			}

			return {'w':w, 'h':h};
		},

		displayLoading : function(e){
			e.append('<div class="label"><div class="loading"></div></div>');
		},

		removeLoading : function(c, e){
			var home, s = '', t = 0;
			for( var i in c )
				if( typeof c[i]['items'] != 'undefined' && typeof c[i]['items'].length != 'undefined') t += c[i]['items'].length;

			if(t)
			{
				if(codepeople_search_in_place_advanced.result_number <= t)
				{
					home = codepeople_search_in_place_advanced.home;
					home += ( home.indexOf( '?' ) == -1 ) ? '?' : '&' ;
					s += '<a href="'+home+'s='+this.search+'&submit=Search">'+codepeople_search_in_place_advanced.more+' &gt;</a>';
				}
			}
			else
			{
				s += codepeople_search_in_place_advanced.empty;
			}
			e.find('.loading').parent().addClass('more').html(s);

		},

		highlightTerms : function(terms){
			var me = this, color;

			innerHighlight = function(text, node){
				var skip = 0;
				if(3 == node.nodeType) {
					var pattern = text.toUpperCase();
                    var nodeData = node.data.toUpperCase();
                    var patternIndex = nodeData.indexOf(pattern);

                    if (patternIndex >= 0) {
						replaceNodeContent(node, text, patternIndex);
						skip = 1;
					}
                }
                else if(possibleTextNode(node)) {
					lookupTextNodes(node, text);
                }
				return skip;
            };

			replaceNodeContent = function(node, text, patternIndex) {
                var markNode = document.createElement('mark');
                var startOfText = node.splitText(patternIndex);
                var endOfText = startOfText.splitText(text.length);
                var matchedText = startOfText.cloneNode(true);

                markNode.setAttribute('style', 'background-color:'+color);
                markNode.appendChild(matchedText);
                startOfText.parentNode.replaceChild(markNode, startOfText);
            };

			possibleTextNode = function(node) {
                return (1 == node.nodeType && node.childNodes && !/(script|style)/i.test(node.tagName));
            };

			lookupTextNodes = function(node, text) {
				for (var i=0; i<node.childNodes.length; i++) {
                    i += innerHighlight(text, node.childNodes[i]);
                }
            };

			$.each(
				me.config.areas,
				function(i, b)
				{
					b = $(b);
					if(b.length){
						$.each(terms, function(i, term){
							if(term.length >= codepeople_search_in_place_advanced.char_number){
								color = me.config.colors[i%me.config.colors.length];
								innerHighlight(term, b[0]);
							}
						});
					}
				}
			);
		}
	};

	var	searchObj = new searchInPlace();

	if(((codepeople_search_in_place_advanced.highlight*1) || (codepeople_search_in_place_advanced.highlight_resulting_page*1))&& codepeople_search_in_place_advanced.terms && codepeople_search_in_place_advanced.terms.length > 0){
		searchObj.highlightTerms(codepeople_search_in_place_advanced.terms);
	}

	if((codepeople_search_in_place_advanced.identify_post_type)*1 && codepeople_search_in_place_advanced.post_types){
		var post_types = eval(codepeople_search_in_place_advanced.post_types);
		for(var i in post_types){
			if(post_types[i].name && post_types[i].label)
				$('.type-'+post_types[i].name).prepend('<div class="search-in-place-type">'+post_types[i].label+'</div>');
		}
	}

	searchObj.autohide();

};

jQuery(codepeople_search_in_place_generator);
jQuery(window).on('load', codepeople_search_in_place_generator);