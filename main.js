/*jslint browser: true unparam: true*/
/*global YUI: false, Clipboard:false*/
YUI().use('node', 'event-valuechange', function (Y) {
    'use strict';
    var values;

    new Clipboard('#copy');

    // Adding some extra methods to Node
    Y.Node.addMethod('getCaretPosition', function () {
        var range, selLength;
        if (document.selection) {
            // IE
            range = document.selection.createRange();
            if (this !== Y.one(range.parentElement())) {
                // the node is not selected
                return 0;
            }
            selLength = range.text.length;
            range.moveStart('character', -this.get('value').length);
            return range.text.length - selLength;
        }

        if (this.get('selectionStart')) {
            return this.get('selectionStart');
        }

        return 0;
    });

    Y.Node.addMethod('setCaretPosition', function (node, value) {
        var range;
        if (document.selection) {
            // IE
            this.focus();
            range = this.invoke('createTextRange');
            range.move('character', value);
            range.select();
        } else if (this.get('selectionStart') !== undefined) {
            this.invoke('setSelectionRange', value, value);
        }
    });

    Y.Node.addMethod('placeChar', function (node, str) {
        var caretPos = 0,
            value = this.get('value'),
            newval;
        this.focus();
        caretPos = this.getCaretPosition();
        newval = value.substring(0, caretPos) + str + value.substring(caretPos);
        this.set('value', newval);
        this.setCaretPosition(caretPos + str.length);
        return newval;
    });

    Y.Node.addMethod('highlightText', function (node, start, end) {
        var curStart, curEnd, value = this.get('value'),
            newval,
            range, selLength;
        this.focus();
        if (document.selection) {
            // IE
            range = document.selection.createRange();
            selLength = range.text.length;
            range.moveStart('character', -this.get('value').length);
            curEnd = range.text.length;
            curStart = range.text.length - selLength;
        } else if (this.get('selectionStart') !== undefined) {
            curStart = this.get('selectionStart');
            curEnd = this.get('selectionEnd');
        }
        newval = value.substring(0, curStart) + start + value.substring(curStart, curEnd) + end + value.substring(curEnd);
        this.set('value', newval);
        this.setCaretPosition(curEnd + start.length + end.length);
        return newval;
    });

    Y.one('#rle').on('click', function (e) {
        Y.one('#demo').highlightText('\u202B', '\u202C');
    });

    Y.one('#lre').on('click', function (e) {
        Y.one('#demo').highlightText('\u202A', '\u202C');
    });

    values = {
        LRM: '\u200E',
        RLM: '\u200F',
        LRE: '\u202A',
        RLE: '\u202B',
        PDF: '\u202C',
        ZWJ: '\u200D',
        ZWNJ: '\u200C'
    };

    Y.all('input[type=button].insert').each(function (n) {
        n.setAttribute('data-action', values[n.get('value')]);
    });

    Y.all('input[type=button].insert').on('click', function (e) {
        Y.one('#demo').placeChar(e.currentTarget.getAttribute('data-action'));
    });

    Y.one('#demo').on('valueChange', function (e) {
        var val = e.currentTarget.get('value'), js = "", i, c;
        Y.one('#rtlout').set('text', val);
        Y.one('#ltrout').set('text', val);
        for (i = 0; i < val.length; i += 1) {
            c = val.charCodeAt(i);
            if (c < 0x20) {
                js += "\\u00" + c.toString(16);
            } else if (c < 0x7f) {
                js += val[i];
            } else if (c < 0x100) {
                js += "\\u00" + c.toString(16);
            } else if (c < 0x1000) {
                js += "\\u0" + c.toString(16);
            } else {
                js += "\\u" + c.toString(16);
            }
        }
        Y.one('#js').set('value', js);
    });
    Y.one('#js').on('valueChange', function (e) {
        var val = e.currentTarget.get('value').replace(
            /\\u([\da-f]{4})/g,
            function (m, p1) {
                return String.fromCharCode(parseInt(p1, 16));
            }
        );
        Y.one('#demo').set('value', val);
        Y.one('#rtlout').set('text', val);
        Y.one('#ltrout').set('text', val);
    });
});
