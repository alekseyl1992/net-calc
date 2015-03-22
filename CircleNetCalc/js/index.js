
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
    $distTableWrapper.empty();
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
    // build queue
    var nodeList = _toNodeList(distTable);
    var queue = _.sortBy(nodeList, 'value');

    // build path
    var path = [];
    var l = 0;

    var idToFind = null;

    for (var nextNode = queue.shift(); nextNode; nextNode = queue.shift()) {
        // first node
        if (idToFind === null) {
            path.push(nextNode.i);
            idToFind = nextNode.j;
            l += nextNode.value;
        } else if (idToFind == nextNode.i && !_.contains(path, nextNode.j)) {
            path.push(nextNode.i);
            idToFind = nextNode.j;
            l += nextNode.value;
        } else if (idToFind == nextNode.j && !_.contains(path, nextNode.i)) {
            path.push(nextNode.j);
            idToFind = nextNode.i;
            l += nextNode.value;
        }
    }
    path.push(idToFind);

    // close list
    var i = _.min([path[0], path[path.length - 1]]);
    var j = _.max([path[0], path[path.length - 1]]);

    var closeNode = _.find(nodeList, {
        i: i,
        j: j
    });

    path.push(closeNode.i);
    l += closeNode.value;

    // prepare path for output
    path = _.map(path, function (p) { return p + 1; });

    return {
        path: path.join('-'),
        l: l
    };
}

function calcPrimeEuler() {
    // build queue
    var nodeList = _toNodeList(distTable);
    var queue = _.sortBy(nodeList, 'value');

    var usedNodes = [];
    for (var nextNode = queue.shift(); nextNode; nextNode = queue.shift()) {
        if (usedNodes.length == 0) {
            nextNode.visited = {};
            usedNodes.push(nextNode);
        } else {
            var startNode = _.find(usedNodes, {i: nextNode.i}) || _.find(usedNodes, {j: nextNode.i});
            var endNode = _.find(usedNodes, {j: nextNode.j}) || _.find(usedNodes, {i: nextNode.j});

            if (!(startNode && endNode) && (startNode || endNode)) {
                nextNode.visited = {};
                usedNodes.push(nextNode);
            }
        }
    }

    // paths...
    var results = [];
    for (var pathId = 0; pathId < usedNodes.length + 1; ++pathId) {
        // reset visited
        _.each(usedNodes, function (node) {
            node.visited.i = false;
            node.visited.j = false;
        });

        // build path
        var path = [];
        var idToFind = null;

        while (true) {
            if (path.length == 0) {
                if (pathId < usedNodes.length) {
                    nextNode = usedNodes[pathId];
                    idToFind = nextNode.j;
                    path.push(nextNode.i);
                    nextNode.visited.i = true;
                } else {
                    nextNode = usedNodes[pathId-1];
                    idToFind = nextNode.i;
                    path.push(nextNode.j);
                    nextNode.visited.j = true;
                }
            } else {
                nextNode = _.find(usedNodes, function (node) {
                    return (node.i == idToFind && !node.visited.i);
                });
                if (nextNode) {
                    idToFind = nextNode.j;
                    path.push(nextNode.i);
                    nextNode.visited.i = true;
                    continue;
                }

                nextNode = _.find(usedNodes, function (node) {
                    return (node.j == idToFind && !node.visited.j);
                });

                if (nextNode) {
                    idToFind = nextNode.i;
                    path.push(nextNode.j);
                    nextNode.visited.j = true;
                    continue;
                }

                // out of list
                nextNode = _.find(usedNodes, function (node) {
                    return !node.visited.i || !node.visited.j;
                });

                if (!nextNode) {
                    break;
                }

                if (nextNode.visited.i)
                    idToFind = nextNode.j;
                else
                    idToFind = nextNode.i;
            }
        }

        // remove duplicated from path
        path = _.uniq(path);

        // calc length
        var l = 0;
        for (var i = 0; i < path.length - 1; ++i) {
            var from = _.min([path[i], path[i + 1]]);
            var to = _.max([path[i], path[i + 1]]);

            var node = _.find(nodeList, {
                i: from,
                j: to
            });

            l += node.value;
        }

        // close path
        from = _.min([path[pathId], path[path.length - 1]]);
        to = _.max([path[pathId], path[path.length - 1]]);

        var closeNode = _.find(nodeList, {
            i: from,
            j: to
        });
        l += closeNode.value;

        // prepare path for output
        path.push(path[0]);
        path = _.map(path, function (p) { return p + 1; });

        results.push({
            path: path.join('-'),
            l: l
        });
    }

    var min = _.min(results, function (result) {
        return result.l;
    });

    return min;
}

function calcLittle() {
    return {
        path: "5-4-3-2-1-5",
        l: 100500
    };
}

function _toNodeList (table) {
    var nodeList = [];

    var size = table.length;
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            if (i < j) {
                nodeList.push({
                    i: i,
                    j: j,
                    value: table[i][j]
                });
            }
        }
    }

    return nodeList;
}