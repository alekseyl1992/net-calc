
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
        calc();
    });


    // handlebars setup
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

    var resultsRowHtml = $('#results-row-template').html();
    templates.resultsRow = Handlebars.compile(resultsRowHtml);
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
        var value = parseFloat($cell.val());

        var id = $cell.attr('id').split('-');

        var i = id[1];
        var j = id[2];

        distTable[i][j] = value;

        var $mirrorCell = $('#cell-' + j + '-' + i);
        $mirrorCell.val(value);
    });

    var $distTableWrapper = $('#dist-table-wrapper');
    $renderedTable.appendTo($distTableWrapper);
}

function calc() {
    var results = [{
            method: 'Метод "Иди в ближний"',
            value: calcNearest()
        }, {
            method: 'Метод Прима-Эйлера',
            value: calcPrimeEuler()
        }, {
            method: 'Метод Литтла',
            value: calcLittle()
        }
    ];

    var $resultsTable = $('#results-table').find('tbody');
    $resultsTable.empty();

    var renderedRows = templates.resultsRow({
        results: results
    });

    var $renderedRows = $(renderedRows);
    $renderedRows.appendTo($resultsTable);
}

function calcNearest() {
    return {
        seq: "5-4-3-2-1-5",
        l: 100500
    };
}

function calcPrimeEuler() {
    return {
        seq: "5-4-3-2-1-5",
        l: 100500
    };
}

function calcLittle() {
    return {
        seq: "5-4-3-2-1-5",
        l: 100500
    };
}