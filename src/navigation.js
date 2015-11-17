var $ = require('jquery')
var _ = require('lodash')
var mapView = require('./mapView')
var noUiSlider = require('nouislider');
var defaults = {
    toggles:   {},
    start:     60,
    end:       235,
    collapsed: false
}
var settings = loadFilters() || defaults

module.exports = {
    init: initNavigation
}

var mapMissing = true

function reportSettings(settings) {
    return activeFilters(settings).sort().join(' ') + ' ' + settings.start + '-' + settings.end + ' ' + (settings.collapsed ? 'collapsed' : '')
}

function initNavigation() {
    activeFilters(settings).forEach(name => { $('#' + name).addClass('inactive')})
    $('#single').prop('checked', 'single' in settings.toggles)
    setContainerFilterClasses()
    $('.filters button, #single').click(function (e) {
        var $button = $(this)
        $button.toggleClass('inactive')
        var id = $button.prop('id')
        toggleObj(id, settings.toggles)
        setTimeout(function () {
            $('#schedule').toggleClass(id)
            saveFilters()
        }, 1)
    })
    $('.toggleInformation').click(function () {
        $('.information').show()
    })
    $('.toggleMapInformation').click(function () {
        $('#map_wrapper').show()
        if (mapMissing) {
            mapView.renderMap()
            mapMissing = false
        }
    })
    toggleNavi()
    $('.toggleFilters, .filters .close').click(function () {
        settings.collapsed = $(this).hasClass('close')
        toggleNavi()
        saveFilters()
    })
    initTimeFilter()
    initFeedback()
}

function initFeedback() {
    $('.feedbackForm').on('submit', function (e) {
        e.preventDefault()
        var $feedback = $('.feedback')
        var text = $feedback.val()
        ga('send', 'event', 'Feedback', text)
        $feedback.val('')
        $('.submitFeedback').prop('disabled', true).text('Palaute lähetetty')
    })
    return false
}
function toggleNavi() {
    $('.filters').toggleClass('collapsed', settings.collapsed)

}
function toggleObj(key, obj) {
    if (key in obj) delete obj[key]
    else obj[key] = true
}

var all = _.range(60, 235, 5)

function initTimeFilter() {
    var slider = document.getElementById('slider')
    noUiSlider.create(slider, {
        start:   [settings.start, settings.end],
        step:    5,
        //margin:   20,
        connect: true,
        range:   {
            'min': 60,
            'max': 230
        },
        format:  {
            to:   formatTime,
            from: x => x
        }
    })
    slider.noUiSlider.on('update', function (values, endTime) {
        var isStart = !endTime
        setStartAndEndLabels(isStart, parseTime(values[endTime]))
    })
    slider.noUiSlider.on('change', () => {
        setContainerFilterClasses()
        saveFilters()
    })
}
var $rangeLabel = $('.rangeLabel')

function setStartAndEndLabels(isStart, val) {
    if (isStart) settings.start = Number(val)
    else settings.end = Number(val)
    $rangeLabel.html(formatTime(settings.start) + '-' + formatTime(settings.end))
}

function parseTime(isoTime) {
    var hm = isoTime.split(':')
    return String(Number(hm[0]) * 10 + Number(hm[1]) / 6)
}

function formatTime(val) {
    var hour = Math.floor(val / 10)
    var min = Math.round(val % 10 * .6)
    return hour + ':' + min + '0'
}
var $schedule = $('#schedule')

function setContainerFilterClasses() {
    var hiddenTimes = all.filter(function (time) {
        return time < settings.start || time > settings.end
    })
    $schedule.prop('class', activeFilters(settings).concat(hiddenTimes.map(function (time) { return 'h' + time })).join(' '))
}

function activeFilters(settings) { return _.map(settings.toggles, function (v, k) { return k }) }

function saveFilters() {
    localStorage.setItem('filters', JSON.stringify(settings))
}

function loadFilters() {
    var jsonString = localStorage.getItem('filters')
    var parsedJson = JSON.parse(jsonString)
    if (jsonString) ga('send', 'event', 'User settings', reportSettings(parsedJson))
    return parsedJson
}
