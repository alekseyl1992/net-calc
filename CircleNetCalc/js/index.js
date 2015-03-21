
var templates = {};

var distTable = [];

$(function () {
    var $setSizeButton = $('#set-size');
    var $sizeInput = $('#size');

    $setSizeButton.click(function () {
        setSize(parseInt($sizeInput.val()));
    });

    var $calcButton = $('#calc');
    $calcButton.click(function () {
        alert("Allah akbar");
    });

    Handlebars.registerHelper('sum', function() {
        var sum = 0, v;
        for (var i=0; i<arguments.length; i++) {
            v = parseFloat(arguments[i]);
            if (!isNaN(v)) sum += v;
        }
        return sum;
    });

    var distTableHtml = $('#dist-table-template').html();
    templates.distTable = Handlebars.compile(distTableHtml);
});

function setSize(size) {
    distTable = [];

    for (var i = 0; i < size; ++i) {
        var row = [];
        for (var j = 0; j < size; ++j) {
            row[j] = undefined;
        }
        distTable[i] = row;
    }

    var renderedTable = templates.distTable({
        rows: distTable
    });
    var $renderedTable = $(renderedTable);

    $renderedTable.find('input').on('input', function () {
        var $cell = $(this);

        var id = $cell.attr('id').split('-');

        var i = id[1];
        var j = id[2];

        var $mirrorCell = $('#cell-' + j + '-' + i);
        $mirrorCell.val($cell.val());
    });

    var $distTableWrapper = $('#dist-table-wrapper');
    $renderedTable.appendTo($distTableWrapper);
}