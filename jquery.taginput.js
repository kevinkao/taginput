;(function(window, $, undefined) {
	"use strict";

	// Prefix is #
	var isTagText = function(text) {
		return text.match(/^#([\u4e00-\u9fa5_a-zA-Z0-9]+)$/);
	}

	function TagInput($element, options) {
		var self = this;
		self.$element = $element;
		self.target = "/typeahead";
		$.extend(self, options);

		// 包覆input的最外層
		self.$wrapper = $('<div/>')
		.addClass('tag-container').on('click', function() {
			// 當點擊外層就去focus真的input
			$("input.tag-input", this).focus();
		})
		.on('click', '.remove', function() {
			// 刪除Tag
			$(this).parent().remove();
		});

		self.$dropdown = $("<div/>").addClass('tag-dropdown');

		self.$dropdown.on('mouseenter', 'div.option', function() {
			// 處理滑鼠移過hover事件
			$(this)
			.siblings('div.option')
			.removeClass('selected');
			$(this).addClass('selected');
		});

		self.$dropdown.on('click', 'div.option', function() {
			// 處理滑鼠點擊選項事件
			self.$element.trigger($.Event('keyup', { "which" : 13 }));
		});

		self.$element.get(0).style.cssText = "width: 9em !important";
		self.$element
		.attr("size", 1)
		.addClass('tag-input')
		.on('keydown', function(e) {
			// 為了抓tab鍵，所以要在keydown的時候就攔截，並阻止它繼續往下觸發
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 || keyCode == 38 || keyCode == 40) {
				e.preventDefault();
			}
		})
		.on('keyup', function(e) {
			var match = isTagText(this.value);
			if (match) {
				if (this.value != $(this).data("value")) {
					// 記錄當前的值(為了下次能比對是不是都一樣)
					$(this).data("value", this.value);
					// 清空現在所有的選項
					self.$dropdown.empty();
					// 觸發typeahead自動完成，ajax取得 符合的選項
					$.get(self.target + "/" + match[1])
					.done(function(matches) {
						if (matches.length > 0) {
							self.$dropdown.show();
							for (var i = 0, len = matches.length; i < len ; i++) {
								self.$dropdown.append(
									$("<div/>")
									.addClass('option')
									.data('value', matches[i])
									.html(matches[i])
								);
							}
						} else {
							// 已經沒有值了
							self.$dropdown.hide();
						}
						$("div:first-child", self.$dropdown).toggleClass('selected');
					});
				}
			} else {
				self.$dropdown.hide();
			}
			
			
			var keyCode = e.keyCode || e.which;
			var $selected = self.$dropdown.children('div.option.selected');
			var selectedIdx = $selected.index();
			switch(e.keyCode || e.which) {
				case 13:
				case 9:
					// Enter or Tab 拿selected
					var value = $selected.data('value');
					if (value === undefined) {
						// 判斷是不是空字串
						if (this.value.length > 0) {
							// 單純文字 直接取input的值就好
							if (isTagText(this.value)) {
								self.addTag(this.value.replace('#', ''));
							} else {
								self.addText(this.value);
							}
						}
					} else {
						// Tag
						self.addTag(value);
					}
					// 清除dropdown區塊，並且隱藏
					self.$dropdown.empty().hide();
					// 清空輸入的input的欄位
					self.$element.val('');
					break;

				case 38:
					// Up
					if ($selected.is(':first-child')) {
						return false;
					}
					$selected.toggleClass('selected');
					self.$dropdown
					.children('div.option')
					.eq(selectedIdx - 1)
					.toggleClass('selected');
					break;

				case 40:
					if ($selected.is(':last-child')) {
						return false;
					}
					// Down
					$selected.toggleClass('selected');
					self.$dropdown
					.children('div.option')
					.eq(selectedIdx + 1)
					.toggleClass('selected');
					break;
			}
		})
		.wrap(self.$wrapper)
		.parent()
		.append(self.$dropdown);
	}

	TagInput.prototype.add = function(type, str) {
		if (str.length === 0) {
			return;
		}
		// type: tag || text
		var $label = $("<span/>")
			.addClass(type)
			.addClass('label')
			.addClass(type == "tag" ? 'label-info' : 'label-default')
			.attr({ "data-value": str, "data-type": type })
			// .data({ "value": str, "type": type})
			.append(str)
			.append($("<span/>").addClass('remove'));
		this.$element.before($label);
		// 非常重要！！ 換行靠這個空白
		$label.after(' ');
	}

	TagInput.prototype.addTag = function(text) {
		if ($.isArray(text)) {
			for (var i = 0, len = text.length; i < len; i++) {
				this.add('tag', text[i])
			}
		} else {
			this.add('tag', text);
		}
	}

	TagInput.prototype.addText = function(text) {
		if ($.isArray(text)) {
			for (var i = 0, len = text.length; i < len; i++) {
				this.add('text', text[i])
			}
		} else {
			this.add('text', text);
		}
	}

	TagInput.prototype.getData = function() {
		var ret = [];
		this.$element
		.parent()
		.children('span.label')
		.each(function(i, node) {
			ret.push({
				"value": $(this).data("value"),
				"type": $(this).data("type")
			});
		});
		return ret;
	}

	$.fn.taginput = function() {
		var args = Array.prototype.slice.call(arguments);
		var instance = this.data("taginput");
		if (typeof args[0] == "string" && instance && $.isFunction(instance[args[0]])) {
			return instance[args[0]].apply(instance, args.slice(1));
		}
		return this.each(function() {
			var $element = $(this);
			// var instance = $element.data("taginput");
			if ( ! instance) {
				instance = new TagInput($element, args[0]);
				$element.data("taginput", instance);
			}
			if (typeof args[0] == "string") {
				// Call method
				return instance[args[0]].apply(instance, args.slice(1));
			}
		});
	};

})(window, jQuery)