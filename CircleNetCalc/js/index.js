
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
        distTable[j][i] = value;

        if (i == j)
            return;

        var $mirrorCell = $('#cell-' + j + '-' + i);
        $mirrorCell.val(value);
    });

    var $distTableWrapper = $('#dist-table-wrapper');
    $distTableWrapper.empty();
    $renderedTable.appendTo($distTableWrapper);
}

function calc() {
    return renderResults();

    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: "/calc",
        data: distTable
    })
        .done(function (msg) {
            renderResults(msg);
        })
        .fail(function (error) {
            alert(error);
        });
}

function renderResults(results) {
    results = [{
        method: 'Метод "Иди в ближний"',
        values: [{
            path: '1-2-3-4-5-1',
            l: 10
        }, {
            path: '1-3-2-4-5-1',
            l: 20
        }]
    }, {
        method: 'Метод Прима-Эйлера',
        values: [{
            path: '1-2-3-4-5-1',
            l: 10
        }, {
            path: '1-3-2-4-5-1',
            l: 20
        }]
    }, {
        method: 'Метод Литтла',
        values: [{
            path: '1-2-3-4-5-1',
            l: 10
        }, {
            path: '1-3-2-4-5-1',
            l: 20
        }]
    }];

    var $resultsTable = $('#results-table').find('tbody');
    $resultsTable.empty();

    var renderedRows = templates.resultsRow({
        results: results
    });

    var $renderedRows = $(renderedRows);
    $renderedRows.appendTo($resultsTable);
}

Array.prototype.remove = function (item) {
    var i;
    while((i = this.indexOf(item)) !== -1) {
        this.splice(i, 1);
    }
};