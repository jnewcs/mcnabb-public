document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('exam-links')) {
    initPastExams();
  }
  if (document.getElementById('results')) {
    initResults();
  }
});

/* ---------- Past Exams ---------- */

function initPastExams() {
  var EXAM_NAMES = ['Pre-Algebra', 'Algebra I', 'Geometry', 'Algebra II', 'Pre-Calculus', 'Calculus'];
  var TERM_NAMES = ['Spring', 'Fall'];
  var COMBOS = [
    [2010, 0], [2010, 1],
    [2011, 0], [2011, 1],
    [2012, 0], [2012, 1],
    [2013, 0], [2013, 1],
    [2014, 0], [2014, 1],
    [2016, 0], [2016, 1],
    [2017, 0],
    [2018, 0],
    [2019, 0]
  ];
  var current = COMBOS[0];

  var picker = document.getElementById('term-picker');
  var title = document.getElementById('term-title');
  var links = document.getElementById('exam-links');
  var extra = document.getElementById('exam-extra');

  function base() {
    return 'exams/' + current[0] + TERM_NAMES[current[1]];
  }

  function isActive(y, t) {
    return current[0] === y && current[1] === t;
  }

  function renderPicker() {
    picker.replaceChildren();
    COMBOS.forEach(function (combo) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'card' + (isActive(combo[0], combo[1]) ? ' active' : '');
      button.textContent = combo[0] + ' ' + TERM_NAMES[combo[1]];
      button.setAttribute('aria-pressed', isActive(combo[0], combo[1]) ? 'true' : 'false');
      button.addEventListener('click', function () {
        current = combo;
        renderPicker();
        renderLinks();
      });
      picker.appendChild(button);
    });
  }

  function renderLinks() {
    title.textContent = current[0] + ' ' + TERM_NAMES[current[1]];

    links.replaceChildren();
    EXAM_NAMES.forEach(function (name, index) {
      links.appendChild(downloadLink(name + ' Exam', base() + (index + 1) + '.pdf'));
    });

    extra.replaceChildren();
    extra.appendChild(downloadLink('All Exams', base() + '7.pdf'));
    extra.appendChild(downloadLink('All Solutions', base() + '7S.pdf'));
  }

  function downloadLink(label, href) {
    var link = document.createElement('a');
    link.className = 'download';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label;
    return link;
  }

  renderPicker();
  renderLinks();
}

/* ---------- Results ---------- */

function initResults() {
  var subtitle = document.getElementById('results-subtitle');
  var examPicker = document.getElementById('exam-picker');
  var termPicker = document.getElementById('term-picker');
  var output = document.getElementById('results');
  var data;
  var combos = [];
  var combo = null;
  var exam = null;

  try {
    data = JSON.parse(document.getElementById('results-data').textContent).data;
  } catch (error) {
    output.innerHTML = '<p class="muted">Could not read the embedded results data.</p>';
    return;
  }

  combos = uniqueCombos(data);
  combo = combos[combos.length - 1];
  renderTermPicker();
  selectExam();
  renderResults();

  function uniqueCombos(entries) {
    var seen = {};
    var list = [];
    entries.forEach(function (entry) {
      var key = entry.year + ' ' + entry.term;
      if (!seen[key]) {
        seen[key] = true;
        list.push({ year: entry.year, term: entry.term, title: entry.title });
      }
    });
    return list;
  }

  function examsFor(selected) {
    return data
      .filter(function (entry) {
        return entry.year === selected.year && entry.term === selected.term;
      })
      .sort(function (a, b) {
        return a.exam_level - b.exam_level;
      });
  }

  function selectExam() {
    var exams = examsFor(combo);
    if (!exams.some(function (entry) { return entry.exam === exam; })) {
      exam = exams[0].exam;
    }
    renderExamPicker(exams);
  }

  function renderTermPicker() {
    termPicker.replaceChildren();
    combos.forEach(function (item) {
      var active = item.year === combo.year && item.term === combo.term;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'card' + (active ? ' active' : '');
      button.textContent = item.title;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.addEventListener('click', function () {
        combo = item;
        renderTermPicker();
        selectExam();
        renderResults();
      });
      termPicker.appendChild(button);
    });
  }

  function renderExamPicker(exams) {
    examPicker.replaceChildren();
    exams.forEach(function (entry) {
      var active = entry.exam === exam;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'card' + (active ? ' active' : '');
      button.textContent = entry.exam;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.addEventListener('click', function () {
        exam = entry.exam;
        renderExamPicker(exams);
        renderResults();
      });
      examPicker.appendChild(button);
    });
  }

  function renderResults() {
    var entry = examsFor(combo).find(function (item) {
      return item.exam === exam;
    });
    subtitle.textContent = combo.title + ' ' + exam;
    output.replaceChildren();

    if (!entry || !entry.individual_results.length) {
      var message = document.createElement('p');
      message.className = 'muted';
      message.textContent = 'No results exist for this exam.';
      output.appendChild(message);
      return;
    }

    output.appendChild(heading('Top Individuals'));
    output.appendChild(makeTable(
      ['Rank', 'Name', 'School', 'Score'],
      entry.individual_results.map(function (result) {
        return [result.rank, result.name, result.school, result.score];
      })
    ));

    output.appendChild(heading('Top Teams'));
    output.appendChild(makeTable(
      ['Rank', 'School', 'Score'],
      entry.team_results.map(function (result) {
        return [result.rank, result.school, result.score];
      })
    ));
  }

  function heading(text) {
    var element = document.createElement('h2');
    element.className = 'results-heading';
    element.textContent = text;
    return element;
  }

  function makeTable(headers, rows) {
    var table = document.createElement('table');
    table.className = 'table';

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    headers.forEach(function (header) {
      var th = document.createElement('th');
      th.textContent = header;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) {
        var td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }
}
