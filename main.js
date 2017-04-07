/*jslint browser: true unparam: true*/
/*global YUI: false, Clipboard:false*/
YUI().use('node', 'event-valuechange', function (Y) {
    'use strict';
    var values = {
        LRM: '\u200E',
        RLM: '\u200F',
        LRE: '\u202A',
        RLE: '\u202B',
        PDF: '\u202C',
        ZWJ: '\u200D',
        ZWNJ: '\u200C'
    };

    var Lookup = {
        '\u0020': 'SPACE',
        '\u200D': 'ZWJ',
        '\u200C': 'ZWNJ',
        '\u200E': 'LRM',
        '\u200F': 'RLM',
        '\u202A': 'LRE',
        '\u202B': 'RLE',
        '\u202C': 'PDF',
        '\u202D': 'LRO',
        '\u202E': 'RLO',
        '\u2066': 'LRI',
        '\u2067': 'RLI',
        '\u2068': 'FSI',
        '\u2069': 'PDI',
    }

    var demoNode = Y.one('#demo');
    var jsNode = Y.one('#js');

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
        demoNode.highlightText('\u202B', '\u202C');
    });

    Y.one('#lre').on('click', function (e) {
        demoNode.highlightText('\u202A', '\u202C');
    });


    Y.all('input[type=button].insert').each(function (n) {
        n.setAttribute('data-action', values[n.get('value')]);
    });

    Y.all('input[type=button].insert').on('click', function (e) {
        demoNode.placeChar(e.currentTarget.getAttribute('data-action'));
    });

    function setDemoNodeValue(value, options) {
        var _ref = options || {};
        var _ref$setNode = _ref.setNode,
            setNode = _ref$setNode === undefined ? true : _ref$setNode,
            _ref$setJS = _ref.setJS,
            setJS = _ref$setJS === undefined ? true : _ref$setJS,
            _ref$setHash = _ref.setHash,
            setHash = _ref$setHash === undefined ? true : _ref$setHash;

        var js = "",
            trs = [
                "",
                ""
            ],
            trIdx = 0,
            i,
            c;
        if (setNode) {
            demoNode.set('value', value);
        }
        Y.one('#rtlout').set('text', value);
        Y.one('#ltrout').set('text', value);

        if (setJS) {
            js = value.replace(/[\u0000-\u000f]/g, function (match) {
                return '\\u000' + match.charCodeAt(0).toString(16);
            }).replace(/[\u0010-\u001f\u007f-\u009f\u00ad]/g, function (match) {
                return '\\u00' + match.charCodeAt(0).toString(16);
            }).replace(/[\u0100-\u0fff]/g, function (match) {
                return '\\u0' + match.charCodeAt(0).toString(16);
            }).replace(/[\u1000-\uffff]/g, function (match) {
                return '\\u' + match.charCodeAt(0).toString(16);
            });

            jsNode.set('value', js);
        }

        if (setHash) {
            window.location.hash = encodeURIComponent(value);
        }
        for (i = 0; i < value.length; i ++) {
            if (i !== 0 && i % 12 === 0) {
                trIdx += 2;
                trs[trIdx]='';
                trs[trIdx+1]='';
            }
            c = value.charAt(i);
            trs[trIdx]+='<th>' + i + '</th>';
            if (Lookup[c]) {
                trs[trIdx+1]+='<td class="special">' + Lookup[c] + '</td>';
            } else {
                trs[trIdx+1]+='<td>' + c + '</td>';
            }
        }
        var tableInner = "";
        for (i = 0; i < trs.length; i++) {
            tableInner += '<tr>' + trs[i] + '</tr>';
        }
        Y.one('#order').set('innerHTML', tableInner);
    }
    demoNode.on('valueChange', function (e) {
        var val = e.currentTarget.get('value');
        setDemoNodeValue(val, { setNode: false });
    });
    jsNode.on('valueChange', function (e) {
        var val = e.currentTarget.get('value').replace(
            /\\u([\da-f]{4})/g,
            function (m, p1) {
                return String.fromCharCode(parseInt(p1, 16));
            }
        );
        setDemoNodeValue(val, { setJS: false });
    });

    if (window.location.hash) {
        setDemoNodeValue(decodeURIComponent(window.location.hash.substr(1)), { setHash: false });
    }
});
