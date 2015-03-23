
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

function setSize(size, table) {
    if (!table) {
        distTable = [];
        for (var i = 0; i < size; ++i) {
            var row = [];
            for (var j = 0; j < size; ++j) {
                if (i == j)
                    row[j] = 0;
                else
                    row[j] = undefined;
            }
            distTable[i] = row;
        }
    } else {
        distTable = table;
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
    //var msg = {
    //    nn_alg: {
    //        name: "Nearest Neighbor Algorithm",
    //        results: [
    //            [
    //                {from: 1, to: 2, distance: 1},
    //                {from: 2, to: 1, distance: 2}
    //            ],
    //            [
    //                {from: 1, to: 2, distance: 2},
    //                {from: 2, to: 1, distance: 3}
    //            ]
    //        ]
    //    }
    //};
    //
    //var preparedResults = prepareResults(msg);
    //renderResults(preparedResults);

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/calculate",
        data: JSON.stringify({size: distTable.length, arr: distTable})
    })
        .done(function (msg) {
            var preparedResults = prepareResults(msg);
            renderResults(preparedResults);
        })
        .fail(function (error) {
            console.log("AJAX error: ", error);
            alert("AJAX Error, watch your console log");
        }
    );
}

function prepareResults(entries) {
    return _.map(entries, function (entry) {
        return {
            method: entry.name,
            values: _.uniq(_.sortBy(_.map(entry.results, function (result) {
                return buildPath(result);
            }), 'l'))
        };
    });
}

function buildPath(nodes) {
    var path = [];
    var l = 0;

    var nextNode = nodes[0];
    path.push(nextNode.from);
    l += nextNode.distance;
    var idToFind = nextNode.to;
    nodes.remove(nextNode);

    while (nodes.length != 0) {
        nextNode = _.find(nodes, {from: idToFind});
        path.push(nextNode.from);
        l += nextNode.distance;
        idToFind = nextNode.to;
        nodes.remove(nextNode);
    }
    path.push(idToFind);

    return {
        path: path.join('-'),
        l: l
    };
}

function renderResults(results) {
    var $resultsTable = $('#results-table').find('tbody');
    $resultsTable.empty();

    var renderedRows = templates.resultsRow({
        results: results
    });

    var $renderedRows = $(renderedRows);
    $renderedRows.appendTo($resultsTable);
}

function fillTestData() {
    distTable = [
        [0, 4, 6, 2, 13],
        [4, 0, 3, 2, 13],
        [6, 3, 0, 5, 13],
        [2, 2, 5, 0, 8],
        [13, 13, 13, 8, 0]];

    setSize(distTable.length, distTable);
}

Array.prototype.remove = function (item) {
    var i;
    while((i = this.indexOf(item)) !== -1) {
        this.splice(i, 1);
    }
};