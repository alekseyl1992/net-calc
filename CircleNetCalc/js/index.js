
var templates = {};
var stages = {};

var distTable = [];

$(function () {
    // handlebars setup
    Handlebars.registerHelper('sum', function() {
        var sum = 0, v;
        for (var i=0; i<arguments.length; i++) {
            v = parseFloat(arguments[i]);
            if (!isNaN(v)) sum += v;
        }
        return sum;
    });

    loadTemplates();
    findStages();

    var $stage = showStage(stages.stage1, templates.stage1());
    var $setSizeButton = $stage.find('#set-size');
    var $sizeInput = $stage.find('#size');

    $setSizeButton.click(function () {
        setSize(parseInt($sizeInput.val()));
    });
});

function loadTemplates() {
    templates = {
        stage1: Handlebars.compile($('#stage1-template').html()),
        stage2: Handlebars.compile($('#stage2-template').html()),
        stage3: Handlebars.compile($('#stage3-template').html())
    };
}

function findStages() {
    stages = {
        stage1: $('#stage1'),
        stage2: $('#stage2'),
        stage3: $('#stage3')
    };
}

function showStage($stage, html) {
    $stage.empty().off("*");
    var $html = $(html);

    $stage.hide();
    $html.appendTo($stage);
    $stage.fadeIn('slow');

    return $html;
}

function setSize(size, table) {
    if (!table) {
        distTable = [];
        for (var i = 0; i < size; ++i) {
            var row = [];
            for (var j = 0; j < size; ++j) {
                if (i == j)
                    row[j] = 0;
                else
                    row[j] = null;
            }
            distTable[i] = row;
        }
    } else {
        distTable = table;
    }

    var html = templates.stage2({
        rows: distTable
    });
    var $stage = showStage(stages.stage2, html);

    var $inputs = $stage.find('input[type="text"]');
    $inputs.each(function(idx, input) {
        var $input = $(input);

        var id = $input.attr('id').split('-');
        var i = id[1];
        var j = id[2];

        if (i == j)
            $input.prop('disabled', true);
    });

    $inputs.on('input', function () {
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

    var $calcButton = $stage.find('#calc');
    $calcButton.click(function () {
        calc();
    });
}

function calc() {
    var valid = _.all(distTable, function (row) {
        return _.all(row, function (value) {
            return value != null && !_.isNaN(value);
        });
    });

    if (!valid) {
        alert("Incorrect data!");
        return;
    }

    // project will work both in Qt5 HTML App and via AJAX
    // and via emscripten
    if (window.Qt && !window.myAppViewer) {
        alert("Qt && !myAppViewer");
    }

    if (window.myAppViewer) {
        var msg = JSON.parse(myAppViewer.calc(JSON.stringify({
            size: distTable.length,
            arr: distTable
        })));

        var preparedResults = prepareResults(msg);
        renderResults(preparedResults);
    } else if (_calculate) {
        var calcFun = Module.cwrap('calculate', 'string', ['string']);

        var data = JSON.stringify({
            size: distTable.length,
            arr: distTable
        });

        var result = JSON.parse(calcFun(data));
        var preparedResults = prepareResults(result);
        renderResults(preparedResults);
    } else {

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
}

function prepareResults(entries) {
    return _.map(entries, function (entry) {
        return {
            method: entry.name,
            values: _.uniq(_.sortBy(_.map(uniqResults(entry.results), function (result) {
                return buildPath(result);
            }), 'l'),
                function (value) {
                    return value.path;
                })
        };
    });
}

function uniqResults(sourceResults) {
	var results = [];

	return _.each(sourceResults, function (newResult) {
		var dup = _.find(results, function (oldResult) {
			return compareArrays(newResult, oldResult);
		});

		if (!dup) {
			results.push(newResult);
		}
	});

	return results;
}

function compareArrays(oldResult, newResult) {
	return _.all(oldResult, function (oldNode) {
		return _.find(newResult, function (newNode) {
			return (newNode.from == oldNode.from && newNode.to == oldNode.to)
				|| (newNode.from == oldNode.to && newNode.to == oldNode.from);
		});
	});
}

function buildPath(nodes) {
    var edges = [];
    var path = [];
    var l = 0;

    edges = _.map(nodes, function (node) {
        return (node.from + 1) + "-" + (node.to + 1);
    });

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

    // prepare path to user
    path = _.map(path, function (p) {
        return p + 1;
    });

    return {
        edges: edges.join(', '),
        path: path.join('-'),
        l: l
    };
}

function renderResults(results) {
    var renderedRows = templates.stage3({
        results: results
    });

    showStage(stages.stage3, renderedRows);
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