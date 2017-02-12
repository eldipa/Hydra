define(['jquery', 'layout', 'underscore'], function ($, layout, _) {
    var CodeSelector = function (thread_follower) {
        this.thread_follower = thread_follower;

        this._selected = {file: null, fullname: null};

        var self = this;
        this._$file_selector = $('<input></input>')
            .addClass( "ui-widget ui-widget-content ui-state-default ui-corner-all" )
            .autocomplete({
                source: function search_for_suggestions(request, callback) {
                    var search_for_all = !request.term;

                    var safe_value = $.ui.autocomplete.escapeRegex(request.term);
                    var matcher = new RegExp(safe_value, 'i');

                    var thread_follower = self.thread_follower;

                    if (thread_follower.are_you_following_a_thread_group()) {
                        var thread_group_followed = thread_follower.thread_group_followed;
                        thread_group_followed.update_source_fullnames(function on_source_fullnames(files, msg) {
                            var all_options = _.map(files, function (obj) {
                                return {
                                    label: obj.file,
                                    value: obj.fullname
                                };
                            });

                            if (search_for_all) {
                                var options = all_options;
                            }
                            else {
                                var options = _.filter(all_options, function (opt) {
                                    return matcher.test(opt.label);
                                });
                            }

                            callback(options);
                        });
                    }
                    else {
                        callback([]);
                    }
                },

                select: function on_suggestion_selected(ev, ui) {
                    var file = ui.item.label;
                    var fullname = ui.item.value;

                    self._selected = {file: file, fullname: fullname};

                    ui.item.value = ui.item.label;

                    thread_follower.update_button_bar_and_code_editor_to_show(fullname, 1, "0x00000000");
                }
        });

        this._$out_of_dom = this._$file_selector;

        this.disable();
    };
    
    CodeSelector.prototype.__proto__ = layout.Panel.prototype;

    CodeSelector.prototype.render = function () {
        if (this._$out_of_dom) {
            this._$out_of_dom.appendTo(this.box);
            this._$out_of_dom = null;
        }
    };

    CodeSelector.prototype.unlink = function () {
        if (!this._$out_of_dom) {
            this._$out_of_dom = this._$file_selector.detach();
        }
    };

    CodeSelector.prototype.position = function (conf) {
        this._$file_selector.position(conf);
    };

    CodeSelector.prototype.update_selection = function (fullname) {
        //console.log("updating... " + fullname); 
        var self = this;
        var thread_follower = self.thread_follower;

        if (this._selected.fullname === fullname) {
            return; //nothing to update
        }

        if (!fullname) {
            $(self._$file_selector).val("");
            this._selected = {file: null, fullname: null};
            return; 
        }

        if (thread_follower.are_you_following_a_thread_group()) {
            var thread_group_followed = thread_follower.thread_group_followed;
            thread_group_followed.update_source_fullnames(function on_source_fullnames(files, msg) {
                var found = _.where(files, {fullname: fullname});
                if (found) {
                    var file = found[0].file;
                    $(self._$file_selector).val(file);

                    //console.log("updated " + file); 
                    this._selected = {file: file, fullname: fullname};
                }
                else {
                    console.warn("The file '"+fullname+"' isn't loaded in GDB, beware...");
                    $(self._$file_selector).val("??");
                    
                    this._selected = {file: null, fullname: null};
                }
            });
        }
        else {
            $(self._$file_selector).val("");
            this._selected = {file: null, fullname: null};
        }

    };

    CodeSelector.prototype.disable = function () {
        this._selected = {file: null, fullname: null};
        $(this._$file_selector).attr('disabled', true).addClass('ui-state-disabled').val("");
    };

    CodeSelector.prototype.enable = function () {
        this._selected = {file: null, fullname: null};
        $(this._$file_selector).removeAttr('disabled').removeClass('ui-state-disabled').val("");
    };

    return {CodeSelector: CodeSelector};
});

