// Trumbowyg plugin to insert at cursor.
$.extend(true, $.trumbowyg, {
    langs: {
        en: {
            insertImageAtCursor: 'Upload Image'
        }
    },

    plugins: {
        insertAtCursor: {
            init: function (trumbowyg) {
                var insertAtCursor = {
                    fn: function () {
                        // Restore the range from the saved value
                        // when blur got called, if exists. If not, it means
                        // we have not clicked it yet, or range data is not available
                        // let's focus it, and create a range at the beginning of the field.
                        if (trumbowyg._insertAtCursor_lastRange) {
                            trumbowyg.range = trumbowyg._insertAtCursor_lastRange;
                            trumbowyg.restoreRange();
                        } else {
                            // Firefox does not like to behave, when the user does not
                            // click in the contenteditable, the default selection range
                            // will point to the outside of the editor div, so we have
                            // to set it manually to the editor's div.
                            var textNode = trumbowyg.$ed[0].firstChild || trumbowyg.$ed[0];
                            var newRange = document.createRange();
                            newRange.setStart(textNode, 0);
                            newRange.setEnd(textNode, 0);
                            var selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(newRange);

                            trumbowyg.saveRange();
                        }
                        var sel = window.getSelection();

                        var node = $(elementToInsert)[0];

                        trumbowyg.range.deleteContents();
                        trumbowyg.range.insertNode(node);

                        // Set cursor position after the inserted element.
                        // Hint: http://stackoverflow.com/questions/4834793/set-caret-position-right-after-the-inserted-element-in-a-contenteditable-div
                        var range = trumbowyg.range.cloneRange();
                        range.selectNodeContents(node);
                        range.collapse(false);

                        sel.removeAllRanges();
                        sel.addRange(range);

                        trumbowyg._insertAtCursor_lastRange = range;

                        trumbowyg.syncCode();                        
                        return true;
                    }
                };

                trumbowyg.addBtnDef('insertAtCursor', insertAtCursor);
            }
        },

        /**
         * This is a not-too-nice solution to get the wrapping dropzone element's
         * manual browse functionality. When we click the button, it just
         * triggers the click on the dropzone.
         *
         * NOTE: Handling dropzone globally is not possible, because of the custom
         * dropzone usage within the app (having multiple upload endpoints).
         */
        insertImageAtCursor: {
            init: function (trumbowyg) {
                trumbowyg.addBtnDef('insertImageAtCursor', {
                    fn: function () {
                        trumbowyg.$box.parent().trigger('click');
                        return true;
                    }
                });
            }
        }
    }
});